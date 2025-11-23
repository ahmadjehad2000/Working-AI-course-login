import { z } from 'zod';
import type { Request, Response, NextFunction } from 'express';

export function validateBody<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = schema.safeParse(req.body);
      if (!result.success) {
        const errors = result.error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: errors 
        });
      }
      req.body = result.data;
      next();
    } catch (error) {
      res.status(400).json({ error: 'Invalid request data' });
    }
  };
}

export function validateQuery<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = schema.safeParse(req.query);
      if (!result.success) {
        const errors = result.error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));
        return res.status(400).json({ 
          error: 'Query validation failed', 
          details: errors 
        });
      }
      req.query = result.data as any;
      next();
    } catch (error) {
      res.status(400).json({ error: 'Invalid query parameters' });
    }
  };
}

export function validateParams<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = schema.safeParse(req.params);
      if (!result.success) {
        const errors = result.error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));
        return res.status(400).json({ 
          error: 'Parameter validation failed', 
          details: errors 
        });
      }
      req.params = result.data as any;
      next();
    } catch (error) {
      res.status(400).json({ error: 'Invalid parameters' });
    }
  };
}
