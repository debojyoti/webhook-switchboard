import express from "express";
import path from "node:path";
import type { Db } from "mongodb";
import type { Environment } from "../config/env.js";
import { createApiRouter } from "./api-router.js";
import { findEndpointByTokenAction } from "../modules/endpoints/actions/find-endpoint-by-token.action.js";
import { acceptIncomingWebhookAction } from "../modules/webhooks/actions/accept-incoming-webhook.action.js";
import { errorMiddleware } from "./middleware/error.middleware.js";
import { requestContextMiddleware } from "./middleware/request-context.middleware.js";

export function createApp(database: Db, environment: Environment) {
  const app = express();
  app.use(requestContextMiddleware);

  app.get("/healthz", (_request, response) => {
    response.status(200).json({ status: "ok" });
  });

  app.use("/api", createApiRouter(database, environment));

  app.all(
    "/webhooks/:publicToken",
    express.raw({ type: () => true, limit: environment.MAX_WEBHOOK_BODY_BYTES }),
    (request, response, next) => {
      void (async () => {
        const publicToken = typeof request.params.publicToken === "string" ? request.params.publicToken : null;
        const endpoint = publicToken ? await findEndpointByTokenAction(database, publicToken) : null;
        const accepted = await acceptIncomingWebhookAction(
          database,
          endpoint,
          {
            body: Buffer.isBuffer(request.body) ? request.body : Buffer.alloc(0),
            headers: rawHeaders(request.rawHeaders),
            method: request.method,
            query: request.originalUrl.split("?", 2)[1] ?? "",
          },
          environment,
        );
        response.status(202).json({ accepted: true });
        accepted.dispatch();
      })().catch(next);
    },
  );

  if (environment.NODE_ENV === "production") {
    const clientBuildDirectory = path.resolve(process.cwd(), "dist/client");
    app.use(express.static(clientBuildDirectory));
    app.get("/{*path}", (_request, response) => {
      response.sendFile(path.join(clientBuildDirectory, "index.html"));
    });
  }

  app.use(errorMiddleware);

  return app;
}

function rawHeaders(headers: string[]) {
  const values: Array<{ name: string; value: string }> = [];
  for (let index = 0; index < headers.length; index += 2) {
    const name = headers[index];
    const value = headers[index + 1];
    if (name !== undefined && value !== undefined) {
      values.push({ name, value });
    }
  }

  return values;
}
