import { Request, Response, NextFunction } from 'express';

// Middleware to track request start time for latency measurement
export function latencyTracking(req: Request, res: Response, next: NextFunction) {
  (req as any).startTime = Date.now();
  next();
}

// Error handling middleware
export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  console.error('Error:', err);

  const statusCode = (err as any).statusCode || 500;
  const message = err.message || 'Internal server error';

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

// Request validation middleware
export function validateContentType(req: Request, res: Response, next: NextFunction) {
  if (req.method === 'POST' || req.method === 'PUT') {
    if (!req.is('application/json')) {
      return res.status(415).json({ error: 'Content-Type must be application/json' });
    }
  }
  next();
}
