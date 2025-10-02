import {
  MediaAIUpload,
  MediaAIChat,
  MediaAIImageGeneration,
} from '@domain/models';
import { IMediaAIRepository } from '@domain/repositories';
import { PrismaD1 } from '@prisma/adapter-d1';
import { PrismaClient } from '@prisma/client/extension';

export class PrismaMediaAIRepository implements IMediaAIRepository {
  private prisma: PrismaClient;
  private r2: R2Bucket;
  private ai: Ai;

  constructor(db: D1Database, r2: R2Bucket, ai: Ai) {
    const adapter = new PrismaD1(db);
    this.prisma = new PrismaClient({ adapter });
    this.r2 = r2;
    this.ai = ai;
  }

  async uploadFile(
    data: MediaAIUpload,
  ): Promise<{ success: boolean; key: string }> {
    await this.r2.put(data.key, data.file);
    return { success: true, key: data.key };
  }

  async getFile(key: string): Promise<Blob | null> {
    return (await this.r2.get(key)) as any;
  }

  async chatWithAI(data: MediaAIChat): Promise<any> {
    const messages = [
      { role: 'system', content: 'You are a friendly assistant' },
      { role: 'user', content: data.message },
    ];
    return await this.ai.run('@cf/openchat/openchat-3.5-0106', { messages });
  }

  async generateImage(data: MediaAIImageGeneration): Promise<Blob> {
    const aiResult = await this.ai.run('@cf/leonardo/phoenix-1.0', {
      prompt: data.prompt,
    });
    const key = data.imageKey;
    await this.r2.put(key, aiResult);
    return (await this.r2.get(key)) as any;
  }
}
