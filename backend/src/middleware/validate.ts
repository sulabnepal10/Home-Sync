import { Request, Response, NextFunction } from 'express';
import { ZodType } from 'zod';

/**
 * Validates req.body against a zod schema. On success, replaces req.body
 * with the parsed (and coerced/defaulted) value so downstream handlers can
 * trust its shape. On failure, responds 400 with a flattened issue list.
 */
export function validateBody(schema: ZodType) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Request body failed validation',
        issues: result.error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      });
      return;
    }
    req.body = result.data;
    next();
  };
}

/**
 * Validates req.query against a zod schema. Query values arrive as strings,
 * so schemas passed here should use z.coerce for numeric/boolean fields.
 */
export function validateQuery(schema: ZodType) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Query parameters failed validation',
        issues: result.error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      });
      return;
    }
    // Express's req.query is a getter-only property on some versions; assign
    // fields individually onto the existing object rather than replacing it.
    Object.assign(req.query, result.data);
    next();
  };
}
