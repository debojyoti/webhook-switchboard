import crypto from "node:crypto";
import type { NextFunction, Request, Response } from "express";

export function requestContextMiddleware(_request: Request, response: Response, next: NextFunction) {
  response.locals.requestId = crypto.randomUUID();
  response.setHeader("X-Request-Id", response.locals.requestId);
  next();
}
