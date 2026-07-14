import { NextFunction, Request, Response } from "express";

// Wraps async route handlers so rejected promises are forwarded to Express's
// error middleware instead of crashing the process.
export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
