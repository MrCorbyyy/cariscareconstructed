import type { NextFunction, Request, Response } from 'express';
import { MulterError } from 'multer';
import {
  ForeignKeyConstraintError,
  UniqueConstraintError,
  ValidationError as SequelizeValidationError,
} from 'sequelize';
import { ZodError } from 'zod';
import { env } from '../config/env';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ error: { code: 'not_found', message: `Route not found: ${req.method} ${req.path}` } });
}

// Express recognises error handlers by their four-argument signature.
 
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(422).json({
      error: {
        code: 'validation_error',
        message: 'Some fields are invalid.',
        fields: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
      },
    });
  }
  if (err instanceof AppError) {
    return res.status(err.status).json({ error: { code: err.code, message: err.message, details: err.details } });
  }
  if (err instanceof UniqueConstraintError) {
    return res.status(409).json({
      error: {
        code: 'conflict',
        message: 'A record with the same unique value already exists.',
        fields: err.errors.map((e) => ({ path: e.path ?? '', message: `${e.path} must be unique` })),
      },
    });
  }
  if (err instanceof ForeignKeyConstraintError) {
    return res.status(409).json({
      error: { code: 'conflict', message: 'This record is referenced by, or references, another record.' },
    });
  }
  if (err instanceof SequelizeValidationError) {
    return res.status(422).json({
      error: {
        code: 'validation_error',
        message: 'Some fields are invalid.',
        fields: err.errors.map((e) => ({ path: e.path ?? '', message: e.message })),
      },
    });
  }
  if (err instanceof MulterError) {
    const status = err.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
    return res.status(status).json({ error: { code: 'upload_error', message: err.message } });
  }
  if (err && typeof err === 'object' && 'type' in err && err.type === 'entity.too.large') {
    return res.status(413).json({ error: { code: 'payload_too_large', message: 'Request body is too large.' } });
  }
  if (err && typeof err === 'object' && 'type' in err && err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: { code: 'bad_request', message: 'Malformed JSON body.' } });
  }

  logger.error({ err, path: req.path, method: req.method }, 'Unhandled error');
  res.status(500).json({
    error: {
      code: 'internal_error',
      message: env.isProduction ? 'An unexpected error occurred.' : String((err as Error)?.message ?? err),
    },
  });
}
