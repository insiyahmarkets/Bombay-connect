import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  if (process.env.NODE_ENV !== 'production') {
    console.error('[Error]', err);
  }

  if (err instanceof SyntaxError && 'body' in (err as object)) {
    res.status(400).json({ error: 'Invalid JSON in request body' });
    return;
  }

  const message = err instanceof Error ? err.message : 'Internal server error';

  // Don't leak internal error details in production
  if (process.env.NODE_ENV === 'production') {
    res.status(500).json({ error: 'Internal server error' });
  } else {
    res.status(500).json({ error: message });
  }
}
