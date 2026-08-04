import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { Logger } from "../../infra/logging/logger.js";
import { HttpError } from "../http-error.js";

export function errorMiddleware(error: unknown, _request: Request, response: Response, next: NextFunction) {
  if (response.headersSent) {
    next(error);
    return;
  }

  if (error instanceof ZodError) {
    response.status(400).json({ error: { code: "validation_error", message: error.issues[0]?.message ?? "Invalid request" } });
    return;
  }

  if (typeof error === "object" && error !== null && "type" in error && error.type === "entity.too.large") {
    response.status(413).json({ error: { code: "payload_too_large", message: "Webhook payload exceeds the configured size limit" } });
    return;
  }

  if (error instanceof HttpError) {
    response.status(error.status).json({ error: { code: error.code, message: error.message } });
    return;
  }

  Logger.error("Unhandled request error", { requestId: response.locals.requestId, userId: response.locals.userId });
  response.status(500).json({ error: { code: "internal_error", message: "An unexpected error occurred" } });
}
