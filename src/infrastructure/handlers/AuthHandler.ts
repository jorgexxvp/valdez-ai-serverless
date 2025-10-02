import { Hono } from 'hono';
import { PrismaClient } from '@prisma/client';
import { PrismaD1 } from '@prisma/adapter-d1';
import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import type { Prisma } from '@prisma/client';
import { withErrorHandling, AppError } from '../../shared/errors';
import { getJsonBody, expectString } from '../../shared/validation';

export const authHandler = new Hono<{ Bindings: CloudflareBindings }>()
  .post(
    '/auth/login',
    withErrorHandling(async (c) => {
      const body = await getJsonBody<Record<string, unknown>>(c);
      const name = expectString(body, 'name', { nonEmpty: true });
      const password = expectString(body, 'password', { nonEmpty: true });

      const adapter = new PrismaD1(c.env.DB);
      const prisma = new PrismaClient({ adapter });
      const secret = c.env.JWT_AUTH;
      if (!secret) throw new AppError('INTERNAL', 'JWT secreto no configurado');
      const secretKey = new TextEncoder().encode(secret);

      const account = await prisma.account.findFirst({
        where: { name },
        include: { rol: true, user: true },
      });
      if (!account) throw new AppError('UNAUTHORIZED', 'Usuario no encontrado');

      const passwordMatches = await bcrypt.compare(
        password!,
        account.password!,
      );
      if (!passwordMatches)
        throw new AppError('UNAUTHORIZED', 'Credenciales inválidas');

      const token = await new SignJWT({
        userId: account.id,
        username: account.name,
      })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('1h')
        .sign(secretKey);

      return c.json({
        success: true,
        token,
        user: {
          id: account.id,
          name: account.name,
          role: account.rol?.name,
        },
        expiresIn: 3600,
      });
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

      const adapter = new PrismaD1(c.env.DB);
      const prisma = new PrismaClient({ adapter });

      const exists = await prisma.account.findFirst({ where: { name } });
      if (exists) throw new AppError('VALIDATION', 'El usuario ya existe');

      const hashed = await bcrypt.hash(password!, 10);
      let data: Prisma.AccountCreateInput = {
        name: name!,
        password: hashed,
      } as Prisma.AccountCreateInput;
      if (rolId) {
        data = {
          ...data,
          rol: { connect: { id: rolId } },
        } as Prisma.AccountCreateInput;
      }
      await prisma.account.create({ data });

      return c.json({ success: true, message: 'Usuario creado' }, 201);
    }),
  )
  .post(
    '/auth/refresh',
    withErrorHandling(async (c) => {
      const body = await getJsonBody<Record<string, unknown>>(c);
      const refreshToken = expectString(body, 'refreshToken', {
        nonEmpty: true,
      })!;
      const secret = c.env.JWT_AUTH;
      if (!secret) throw new AppError('INTERNAL', 'JWT secreto no configurado');
      const secretKey = new TextEncoder().encode(secret);

      try {
        const { payload } = await jwtVerify(refreshToken!, secretKey, {
          algorithms: ['HS256'],
        });
        const adapter = new PrismaD1(c.env.DB);
        const prisma = new PrismaClient({ adapter });
        const account = await prisma.account.findUnique({
          where: { id: payload.userId as number },
          include: { rol: true },
        });
        if (!account)
          throw new AppError('UNAUTHORIZED', 'Usuario no encontrado');

        const token = await new SignJWT({
          userId: account.id,
          username: account.name,
        })
          .setProtectedHeader({ alg: 'HS256' })
          .setExpirationTime('1h')
          .sign(secretKey);
        return c.json({ success: true, token, expiresIn: 3600 });
      } catch {
        throw new AppError('UNAUTHORIZED', 'Token inválido o expirado');
      }
    }),
  );
