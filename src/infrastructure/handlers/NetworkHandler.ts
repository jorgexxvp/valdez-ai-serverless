import { Hono } from 'hono';
import { withErrorHandling } from '../../shared/errors';
import {
  validateBody,
  validateNumericId,
  requireAtLeastOne,
  getJsonBody,
  expectString,
  expectNumber,
} from '../../shared/validation';
import { PrismaNetworkRepository } from '../services/PrismaNetworkRepository';
import {
  ListNetworks,
  CreateNetwork,
  UpdateNetwork,
  DeleteNetwork,
} from '../../application/use-cases/network/NetworkUseCases';

export const networkHandler = new Hono<{ Bindings: CloudflareBindings }>()
  .get(
    '/get-networks',
    withErrorHandling(async (c) => {
      const repo = new PrismaNetworkRepository(c.env.DB);
      const uc = new ListNetworks(repo);
      const data = await uc.execute();
      return c.json({ success: true, data });
    }),
  )
  .post(
    '/create-network',
    validateBody(['name', 'url', 'userId']),
    withErrorHandling(async (c) => {
      const raw = await getJsonBody<Record<string, unknown>>(c);
      const name = expectString(raw, 'name', { nonEmpty: true })!;
      const url = expectString(raw, 'url', { nonEmpty: true })!;
      const userId = expectNumber(raw, 'userId', { positive: true })!;
      const repo = new PrismaNetworkRepository(c.env.DB);
      const uc = new CreateNetwork(repo);
      const created = await uc.execute({
        name,
        url,
        user_id: userId,
      });
      return c.json({ success: true, data: created }, 201);
    }),
  )
  .put(
    '/update-network/:id',
    validateNumericId('id'),
    requireAtLeastOne(['name', 'url']),
    withErrorHandling(async (c) => {
      const id = c.get('numericId') as number;
      const raw = await getJsonBody<Record<string, unknown>>(c);
      const patch: { name?: string; url?: string } = {};
      if (raw.name !== undefined)
        patch.name = expectString(raw, 'name', { nonEmpty: true });
      if (raw.url !== undefined)
        patch.url = expectString(raw, 'url', { nonEmpty: true });
      const repo = new PrismaNetworkRepository(c.env.DB);
      const uc = new UpdateNetwork(repo);
      const updated = await uc.execute(id, patch);
      return c.json({ success: true, data: updated });
    }),
  )
  .delete(
    '/delete-network/:id',
    validateNumericId('id'),
    withErrorHandling(async (c) => {
      const id = c.get('numericId') as number;
      const repo = new PrismaNetworkRepository(c.env.DB);
      const uc = new DeleteNetwork(repo);
      await uc.execute(id);
      return c.json({ success: true, message: 'Eliminado' });
    }),
  );
