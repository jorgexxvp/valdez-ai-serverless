import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { verify } from 'hono/jwt';
import { authHandler } from './infrastructure/handlers/AuthHandler';
import { mediaAiHandler } from './infrastructure/handlers/MediaAIHandler';
import {
  userHandler,
  skillHandler,
  blogHandler,
  networkHandler,
  trainingHandler,
  experienceHandler,
  roleHandler,
} from './infrastructure/handlers';

// PUBLIC ROUTES

const publicApp = new Hono<{ Bindings: CloudflareBindings }>();

publicApp.use(
  '*',
  cors({
    origin: '*',
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
  }),
);

// AUTH

publicApp.route('/v1', authHandler);

publicApp.route('/v1', mediaAiHandler);

// PRIVATE ROUTES

const privateApp = new Hono<{ Bindings: CloudflareBindings }>();

privateApp.use(
  '*',
  cors({
    origin: '*',
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
  }),
);

privateApp.use('*', async (c, next) => {
  const authHeader = c.req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ success: false, message: 'Sin autorizacion' }, 401);
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    const decoded = await verify(token, c.env.JWT_AUTH);
    c.set('jwtPayload', decoded);
    await next();
  } catch (err) {
    return c.json(
      { success: false, message: 'Token invalido o expirado' },
      401,
    );
  }
});

privateApp.route('/v1/api', userHandler);
privateApp.route('/v1/api', skillHandler);
privateApp.route('/v1/api', blogHandler);
privateApp.route('/v1/api', networkHandler);
privateApp.route('/v1/api', trainingHandler);
privateApp.route('/v1/api', experienceHandler);
privateApp.route('/v1/api', roleHandler);

// EXPORT
const app = new Hono<{ Bindings: CloudflareBindings }>();
app.route('/', publicApp);
app.route('/', privateApp);

export default app;
