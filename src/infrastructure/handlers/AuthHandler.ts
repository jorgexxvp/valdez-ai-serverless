import { AuthUseCases } from '@application/use-cases/auth/AuthUseCases';
import { PrismaAuthRepository } from '@infrastructure/services';
import { Hono } from 'hono';
import { withErrorHandling, AppError } from 'shared/errors';
import { getJsonBody, expectString } from 'shared/validation';

export const authHandler = new Hono<{ Bindings: CloudflareBindings }>()
  .post(
    '/auth/login',
    withErrorHandling(async (c) => {
      const body = await getJsonBody<Record<string, unknown>>(c);
      const name = expectString(body, 'name', { nonEmpty: true });
      const password = expectString(body, 'password', { nonEmpty: true });

      const repo = new PrismaAuthRepository(c.env.DB, c.env.JWT_AUTH);
      const useCases = new AuthUseCases(repo);
      const result = await useCases.login({
        name: name || '',
        password: password || '',
      });
      if (!result.success)
        throw new AppError(
          'UNAUTHORIZED',
          result.message || 'Error de autenticación',
        );
      return c.json(result);
    }),
  )
  .post(
    '/auth/register',
    withErrorHandling(async (c) => {
      const body = await getJsonBody<Record<string, unknown>>(c);
      const name = expectString(body, 'name', { nonEmpty: true });
      const password = expectString(body, 'password', { nonEmpty: true });
      const rolRaw = body['rol'];
      const rolId = typeof rolRaw === 'number' ? rolRaw : undefined;
      const repo = new PrismaAuthRepository(c.env.DB, c.env.JWT_AUTH);
      const useCases = new AuthUseCases(repo);
      const result = await useCases.register({
        name: name || '',
        password: password || '',
        rolId,
      });
      if (!result.success)
        throw new AppError(
          'VALIDATION',
          result.message || 'No se pudo registrar',
        );
      return c.json(result, 201);
    }),
  )
  .post(
    '/auth/refresh',
    withErrorHandling(async (c) => {
      const body = await getJsonBody<Record<string, unknown>>(c);
      const refreshToken = expectString(body, 'refreshToken', {
        nonEmpty: true,
      })!;
      const repo = new PrismaAuthRepository(c.env.DB, c.env.JWT_AUTH);
      const useCases = new AuthUseCases(repo);
      const result = await useCases.refreshToken(refreshToken);
      if (!result.success)
        throw new AppError(
          'UNAUTHORIZED',
          result.message || 'Token inválido o expirado',
        );
      return c.json(result);
    }),
  );
