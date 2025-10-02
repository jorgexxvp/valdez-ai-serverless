import type { Context, Next } from 'hono';
import { AppError } from './errors';

export async function getJsonBody<
  T extends Record<string, unknown> = Record<string, unknown>,
>(c: Context): Promise<T> {
  const cached = c.get('jsonBody') as T | undefined;
  if (cached) return cached;

  let parsed: unknown;
  try {
    parsed = await c.req.json<unknown>();
  } catch {
    throw new AppError('VALIDATION', 'Body JSON inválido o ausente');
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new AppError('VALIDATION', 'El body debe ser un objeto JSON');
  }

  const obj = parsed as T;
  c.set('jsonBody', obj);
  return obj;
}

export const validateBody = (fields: string[]) => {
  return async (c: Context, next: Next) => {
    const body = await getJsonBody<Record<string, unknown>>(c);
    const missing = fields.filter(
      (f) => body[f] === undefined || body[f] === null || body[f] === '',
    );
    if (missing.length) {
      throw new AppError(
        'VALIDATION',
        `Faltan campos requeridos: ${missing.join(', ')}`,
      );
    }
    await next();
  };
};

export const requireAtLeastOne = (fields: string[]) => {
  return async (c: Context, next: Next) => {
    const body = await getJsonBody<Record<string, unknown>>(c);
    if (!fields.some((f) => body[f] !== undefined && body[f] !== null)) {
      throw new AppError(
        'VALIDATION',
        `Debe proporcionar al menos uno de: ${fields.join(', ')}`,
      );
    }
    await next();
  };
};

export const validateNumericId = (paramName = 'id') => {
  return async (c: Context, next: Next) => {
    const raw = c.req.param(paramName);
    const id = Number(raw);
    if (!raw || Number.isNaN(id) || id <= 0) {
      throw new AppError('VALIDATION', `Parámetro ${paramName} inválido`);
    }
    c.set('numericId', id);
    await next();
  };
};

interface ExpectStringOptions {
  nonEmpty?: boolean;
  optional?: boolean;
  trim?: boolean;
}
export function expectString(
  obj: Record<string, unknown>,
  field: string,
  opts: ExpectStringOptions = {},
): string | undefined {
  const { nonEmpty = false, optional = false, trim = true } = opts;
  const val = obj[field];
  if (val === undefined || val === null) {
    if (optional) return undefined;
    throw new AppError('VALIDATION', `${field} es requerido`);
  }
  if (typeof val !== 'string') {
    throw new AppError('VALIDATION', `${field} debe ser string`);
  }
  const processed = trim ? val.trim() : val;
  if (nonEmpty && processed === '') {
    throw new AppError('VALIDATION', `${field} no puede estar vacío`);
  }
  return processed;
}

interface ExpectNumberOptions {
  optional?: boolean;
  integer?: boolean;
  positive?: boolean;
}
export function expectNumber(
  obj: Record<string, unknown>,
  field: string,
  opts: ExpectNumberOptions = {},
): number | undefined {
  const { optional = false, integer = false, positive = false } = opts;
  const val = obj[field];
  if (val === undefined || val === null) {
    if (optional) return undefined;
    throw new AppError('VALIDATION', `${field} es requerido`);
  }
  if (typeof val !== 'number' || Number.isNaN(val)) {
    throw new AppError('VALIDATION', `${field} debe ser number`);
  }
  if (integer && !Number.isInteger(val)) {
    throw new AppError('VALIDATION', `${field} debe ser entero`);
  }
  if (positive && val <= 0) {
    throw new AppError('VALIDATION', `${field} debe ser positivo`);
  }
  return val;
}

interface ExpectStringArrayOptions {
  optional?: boolean;
  allowEmpty?: boolean;
}
export function expectStringArray(
  obj: Record<string, unknown>,
  field: string,
  opts: ExpectStringArrayOptions = {},
): string[] | undefined {
  const { optional = false, allowEmpty = true } = opts;
  const val = obj[field];
  if (val === undefined || val === null) {
    if (optional) return undefined;
    throw new AppError('VALIDATION', `${field} es requerido`);
  }
  if (!Array.isArray(val)) {
    throw new AppError('VALIDATION', `${field} debe ser array`);
  }
  const invalid = val.some((v) => typeof v !== 'string' || v.trim() === '');
  if (invalid) {
    throw new AppError(
      'VALIDATION',
      `${field} debe ser array de strings no vacíos`,
    );
  }
  if (!allowEmpty && val.length === 0) {
    throw new AppError('VALIDATION', `${field} no puede estar vacío`);
  }
  return val as string[];
}
