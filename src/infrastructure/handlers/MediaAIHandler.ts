import { MediaAIUseCases } from '@application/use-cases/mediaai/MediaAIUseCases';
import { PrismaMediaAIRepository } from '@infrastructure/services';
import { Hono } from 'hono';
import { withErrorHandling, AppError } from 'shared/errors';
import { getJsonBody, expectString } from 'shared/validation';

function generarNombreAleatorio(longitud = 8) {
  const caracteres = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let nombre = '';
  for (let i = 0; i < longitud; i++) {
    const randomIndex = Math.floor(Math.random() * caracteres.length);
    nombre += caracteres[randomIndex];
  }
  return nombre;
}

export const mediaAiHandler = new Hono<{ Bindings: CloudflareBindings }>()
  .post(
    '/upload',
    withErrorHandling(async (c) => {
      const formData = await c.req.formData();
      const file = formData.get('file');
      if (!file || !(file instanceof File)) {
        throw new AppError('VALIDATION', 'Archivo (file) requerido');
      }
      const key = file.name;
      const repo = new PrismaMediaAIRepository(
        c.env.DB,
        c.env.R2_BUCKET,
        c.env.AI,
      );
      const useCases = new MediaAIUseCases(repo);
      const result = await useCases.uploadFile({ key, file });
      return c.json({
        success: true,
        message: 'Archivo subido',
        key: result.key,
      });
    }),
  )
  .get(
    '/consulta',
    withErrorHandling(async (c) => {
      const key = 'My Resume (2).pdf';
      const repo = new PrismaMediaAIRepository(
        c.env.DB,
        c.env.R2_BUCKET,
        c.env.AI,
      );
      const useCases = new MediaAIUseCases(repo);
      const obj = await useCases.getFile(key);
      if (!obj) throw new AppError('NOT_FOUND', 'Archivo no encontrado');
      // Blob does not have httpMetadata or httpEtag, so we just return the blob as a file
      return new Response(obj, {
        headers: {
          'content-type': 'application/pdf',
        },
      });
    }),
  )
  .post(
    '/chat-ia',
    withErrorHandling(async (c) => {
      const body = await getJsonBody<Record<string, unknown>>(c);
      const message = expectString(body, 'message', { nonEmpty: true });
      const repo = new PrismaMediaAIRepository(
        c.env.DB,
        c.env.R2_BUCKET,
        c.env.AI,
      );
      const useCases = new MediaAIUseCases(repo);
      const response = await useCases.chatWithAI({
        message: message || '',
        response: null,
      });
      return c.json({ success: true, data: response });
    }),
  )
  .post(
    '/generacion-imagen',
    withErrorHandling(async (c) => {
      const body = await getJsonBody<Record<string, unknown>>(c);
      const prompt = expectString(body, 'message', { nonEmpty: true });
      const key = generarNombreAleatorio(10) + '.jpg';
      const repo = new PrismaMediaAIRepository(
        c.env.DB,
        c.env.R2_BUCKET,
        c.env.AI,
      );
      const useCases = new MediaAIUseCases(repo);
      const object: R2ObjectBody = await useCases.generateImage({
        prompt: prompt || '',
        imageKey: key,
      });
      return new Response(object.body, {
        headers: {
          'content-type':
            object.httpMetadata?.contentType || 'application/octet-stream',
        },
      });
    }),
  );

export default mediaAiHandler;
