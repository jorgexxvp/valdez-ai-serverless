import { DurableObject } from 'cloudflare:workers';

export class ChatSession extends DurableObject {
  private sessions: Set<WebSocket>;

  constructor(state: DurableObjectState, env: any) {
    super(state, env);
    this.sessions = new Set();
  }

  async fetch(request: Request): Promise<Response> {
    const upgradeHeader = request.headers.get('Upgrade');
    if (!upgradeHeader || upgradeHeader !== 'websocket') {
      return new Response('Expected Upgrade: websocket', { status: 426 });
    }

    const webSocketPair = new WebSocketPair();
    const [client, server] = Object.values(webSocketPair);

    this.handleSession(server);

    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }

  async handleSession(webSocket: WebSocket) {
    webSocket.accept();
    this.sessions.add(webSocket);

    webSocket.send(
      JSON.stringify({
        type: 'connected',
        message: 'Conectado al chat de IA',
        timestamp: new Date().toISOString(),
      }),
    );

    webSocket.addEventListener('message', async (event) => {
      try {
        const data = JSON.parse(event.data as string);

        if (data.type === 'chat') {
          webSocket.send(
            JSON.stringify({
              type: 'typing',
              message: 'La IA está escribiendo...',
            }),
          );

          const messages = [
            {
              role: 'system',
              content:
                'You are a helpful and friendly assistant. Provide complete and detailed answers.',
            },
            { role: 'user', content: data.message },
          ];

          const stream = await this.env.AI.run(
            '@cf/meta/llama-3.1-8b-instruct' as keyof AiModels,
            {
              messages,
              stream: true,
              max_tokens: 2048,
            },
          );

          webSocket.send(
            JSON.stringify({
              type: 'stream_start',
              timestamp: new Date().toISOString(),
            }),
          );

          let fullResponse = '';
          const reader = stream.getReader();
          const decoder = new TextDecoder();

          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              const chunk = decoder.decode(value, { stream: true });
              const lines = chunk.split('\n');

              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const jsonData = JSON.parse(line.slice(6));
                  if (jsonData.response) {
                    fullResponse += jsonData.response;
                    webSocket.send(
                      JSON.stringify({
                        type: 'stream_chunk',
                        chunk: jsonData.response,
                        fullText: fullResponse,
                      }),
                    );
                  }
                }
              }
            }
          } finally {
            reader.releaseLock();
          }

          webSocket.send(
            JSON.stringify({
              type: 'stream_end',
              message: fullResponse,
              timestamp: new Date().toISOString(),
            }),
          );
        }
      } catch (error) {
        webSocket.send(
          JSON.stringify({
            type: 'error',
            message: 'Error procesando mensaje',
            error: error instanceof Error ? error.message : 'Unknown error',
          }),
        );
      }
    });

    webSocket.addEventListener('close', () => {
      this.sessions.delete(webSocket);
    });

    webSocket.addEventListener('error', (error) => {
      console.error('WebSocket error:', error);
      this.sessions.delete(webSocket);
    });
  }

  broadcast(message: string) {
    this.sessions.forEach((session) => {
      try {
        session.send(message);
      } catch (error) {
        this.sessions.delete(session);
      }
    });
  }
}
