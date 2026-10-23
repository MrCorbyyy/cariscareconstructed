import type { NextFunction, Request, Response } from 'express';
import type { ZodType } from 'zod';

type Source = 'body' | 'query' | 'params';

/**
 * Validates and replaces req[source] with the parsed (coerced, stripped) value.
 * Express 5 exposes req.query as a getter, so parsed query values are stored on res.locals.query.
 */
export const validate =
  (schema: ZodType, source: Source = 'body') =>
  (req: Request, res: Response, next: NextFunction) => {
    const parsed = schema.parse(source === 'body' ? (req.body ?? {}) : req[source]);
    if (source === 'query') res.locals.query = parsed;
    else if (source === 'params') res.locals.params = parsed;
    else req.body = parsed;
    next();
  };
