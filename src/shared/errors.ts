import type { Context } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';

export type AppErrorCode =
  | 'NOT_FOUND'
  | 'VALIDATION'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'CONFLICT'
  | 'INTERNAL';

export class AppError extends Error {
  public readonly code: AppErrorCode;
  public readonly status: ContentfulStatusCode;
  public readonly details?: unknown;
  public readonly cause?: unknown;

  constructor(
    code: AppErrorCode,
    message: string,
    options?: {
      status?: ContentfulStatusCode;
      details?: unknown;
      cause?: unknown;
    },
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.status = options?.status ?? mapCodeToStatus(code);
    this.details = options?.details;
    this.cause = options?.cause;
  }
}

function mapCodeToStatus(code: AppErrorCode): ContentfulStatusCode {
  switch (code) {
    case 'NOT_FOUND':
      return 404;
    case 'VALIDATION':
      return 400;
    case 'UNAUTHORIZED':
      return 401;
    case 'FORBIDDEN':
      return 403;
    case 'CONFLICT':
      return 409;
    case 'INTERNAL':
    default:
      return 500;
  }
}

export interface ErrorResponseBody {
  success: false;
  error: {
    code: AppErrorCode;
    message: string;
    details?: unknown;
  };
}

export const toErrorResponse = (err: unknown): ErrorResponseBody => {
  if (err instanceof AppError) {
    return {
      success: false,
      error: { code: err.code, message: err.message, details: err.details },
    };
  }
  return {
    success: false,
    error: { code: 'INTERNAL', message: 'Internal Server Error' },
  };
};

export const withErrorHandling = <R>(
  handler: (c: Context) => Promise<R> | R,
) => {
  return async (c: Context) => {
    try {
      return await handler(c);
    } catch (err) {
      const body = toErrorResponse(err);
      const status = (
        err instanceof AppError ? err.status : 500
      ) as ContentfulStatusCode;
      return c.json(body, status);
    }
  };
};
