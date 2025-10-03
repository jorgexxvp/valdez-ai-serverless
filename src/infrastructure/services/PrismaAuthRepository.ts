import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { AuthLogin, AuthResult, AuthRegister } from '@domain/models/Auth';
import { IAuthRepository } from '@domain/repositories/IAuthRepository';
import { PrismaClient } from '@prisma/client';
import { PrismaD1 } from '@prisma/adapter-d1';

export class PrismaAuthRepository implements IAuthRepository {
  private prisma: PrismaClient;
  private secret: string;
  constructor(db: D1Database, jwtSecret: string) {
    const adapter = new PrismaD1(db);
    this.prisma = new PrismaClient({ adapter });
    this.secret = jwtSecret;
  }

  async login(data: AuthLogin): Promise<AuthResult> {
    const secretKey = new TextEncoder().encode(this.secret);
    const account = await this.prisma.account.findFirst({
      where: { name: data.name },
      select: {
        id: true,
        name: true,
        password: true,
        rol_id: true,
        rol: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
    if (!account) return { success: false, message: 'Usuario no encontrado' };
    const passwordMatches = await bcrypt.compare(
      data.password,
      account.password!,
    );
    if (!passwordMatches)
      return { success: false, message: 'Credenciales inválidas' };
    const token = await new SignJWT({
      userId: account.id,
      username: account.name,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('1h')
      .sign(secretKey);
    return {
      success: true,
      token,
      user: { id: account.id, name: account.name, role: account.rol?.name },
      expiresIn: 3600,
    };
  }

  async register(data: AuthRegister): Promise<AuthResult> {
    const exists = await this.prisma.account.findFirst({
      where: { name: data.name },
      select: { id: true },
    });
    if (exists) return { success: false, message: 'El usuario ya existe' };
    const hashed = await bcrypt.hash(data.password, 10);
    let createData: any = { name: data.name, password: hashed };
    if (data.rolId) {
      createData.rol = { connect: { id: data.rolId } };
    }
    await this.prisma.account.create({ data: createData });
    return { success: true, message: 'Usuario creado' };
  }

  async refreshToken(token: string): Promise<AuthResult> {
    const secretKey = new TextEncoder().encode(this.secret);
    try {
      const { payload } = await jwtVerify(token, secretKey, {
        algorithms: ['HS256'],
      });
      const account = await this.prisma.account.findUnique({
        where: { id: payload.userId as number },
        select: {
          id: true,
          name: true,
          rol: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
      if (!account) return { success: false, message: 'Usuario no encontrado' };
      const newToken = await new SignJWT({
        userId: account.id,
        username: account.name,
      })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('1h')
        .sign(secretKey);
      return {
        success: true,
        token: newToken,
        expiresIn: 3600,
      };
    } catch {
      return { success: false, message: 'Token inválido o expirado' };
    }
  }
}
