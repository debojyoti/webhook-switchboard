import type { NextFunction, Request, Response } from "express";
import type { Environment } from "../../config/env.js";
import { AuthSessionHelper } from "../../modules/auth/auth-session.helper.js";

export function requireAdminMiddleware(environment: Environment) {
  return (request: Request, response: Response, next: NextFunction) => {
    const session = AuthSessionHelper.read(request.headers.cookie, environment.AUTH_SESSION_SECRET);
    if (!session || session.username !== environment.ADMIN_USERNAME) {
      response.status(401).json({ error: { code: "unauthorized", message: "Authentication is required" } });
      return;
    }

    response.locals.userId = session.username;
    next();
  };
}
