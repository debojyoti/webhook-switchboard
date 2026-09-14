import type { Db } from "mongodb";
import type { Environment } from "../../../config/env.js";
import { EncryptionHelper } from "../../../infra/encryption/encryption.helper.js";
import { HeaderSecurityHelper } from "../../../infra/security/header-security.helper.js";
import { RouteUrlSecurityHelper } from "../../../infra/security/route-url-security.helper.js";
import type { EventDocument } from "../../events/event.model.js";
import type { RouteDocument } from "../../routes/route.model.js";
import type { InboundWebhook } from "../../webhooks/inbound-webhook.js";
import type { DeliveryDocument, DeliveryOutcome, StoredDeliveryResponseHeader } from "../delivery.model.js";

const maxResponseBodyBytes = 64 * 1024;

const hopByHopHeaders = new Set([
  "connection",
  "content-length",
  "host",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
]);

export async function deliverEventToRouteAction(
  database: Db,
  event: EventDocument,
  route: RouteDocument,
  inboundWebhook: InboundWebhook,
  environment: Environment,
) {
  const attemptedAt = new Date();
  const startedAt = performance.now();
  let outcome: DeliveryOutcome = "network_error";
  let responseStatus: number | null = null;
  let responseHeaders: StoredDeliveryResponseHeader[] = [];
  let responseBodyEncrypted: string | null = null;
  let responseBodyContentType: string | null = null;
  let responseBodySizeBytes = 0;
  let responseBodyTruncated = false;
  let errorMessage: string | null = null;

  try {
    const allowedUrl = await RouteUrlSecurityHelper.assertAllowed(route.url, environment.ALLOW_INTERNAL_ROUTE_TARGETS);
    const destinationUrl = appendIncomingQuery(allowedUrl, inboundWebhook.query);
    const response = await fetch(destinationUrl, {
      method: inboundWebhook.method,
      headers: buildForwardHeaders(route, inboundWebhook, environment),
      body: acceptsBody(inboundWebhook.method) && inboundWebhook.body.length > 0 ? inboundWebhook.body : undefined,
      signal: AbortSignal.timeout(10_000),
      redirect: "manual",
    });
    responseStatus = response.status;
    outcome = response.ok ? "success" : "http_failure";

    try {
      responseHeaders = presentResponseHeaders(response.headers);
      responseBodyContentType = response.headers.get("content-type");
      const { body, truncated } = await readCappedResponseBody(response, maxResponseBodyBytes);
      responseBodySizeBytes = body.byteLength;
      responseBodyTruncated = truncated;
      if (body.byteLength > 0) {
        responseBodyEncrypted = EncryptionHelper.encrypt(body.toString("base64"), environment.APP_ENCRYPTION_KEY);
      }
    } catch {
      // Status/outcome already reflect the received response; body capture is best-effort.
    }
  } catch (error) {
    outcome = isTimeout(error) ? "timeout" : "network_error";
    errorMessage = error instanceof Error ? error.message.slice(0, 500) : "Unknown delivery failure";
  }

  const delivery: Omit<DeliveryDocument, "_id"> = {
    eventId: event._id,
    endpointId: event.endpointId,
    routeId: route._id,
    routeUrl: route.url,
    outcome,
    responseStatus,
    responseHeaders,
    responseBodyEncrypted,
    responseBodyContentType,
    responseBodySizeBytes,
    responseBodyTruncated,
    errorMessage,
    durationMs: Math.round(performance.now() - startedAt),
    attemptedAt,
    expiresAt: addDays(attemptedAt, environment.DELIVERY_RETENTION_DAYS),
    deletedAt: null,
  };
  await database.collection<DeliveryDocument>("deliveries").insertOne(delivery as DeliveryDocument);
}

function presentResponseHeaders(headers: Headers): StoredDeliveryResponseHeader[] {
  const result: StoredDeliveryResponseHeader[] = [];
  headers.forEach((value, name) => {
    if (hopByHopHeaders.has(name.toLowerCase())) {
      return;
    }
    const isRedacted = HeaderSecurityHelper.isSensitive(name);
    result.push({ name, value: isRedacted ? "[redacted]" : value, isRedacted });
  });
  return result;
}

async function readCappedResponseBody(response: Response, maxBytes: number): Promise<{ body: Buffer; truncated: boolean }> {
  if (!response.body) {
    return { body: Buffer.alloc(0), truncated: false };
  }

  const reader = response.body.getReader();
  const chunks: Buffer[] = [];
  let totalBytes = 0;
  let truncated = false;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done || !value) {
        if (done) break;
        continue;
      }

      const remaining = maxBytes - totalBytes;
      if (remaining <= 0) {
        truncated = true;
        break;
      }

      const chunk = value.byteLength > remaining ? value.subarray(0, remaining) : value;
      chunks.push(Buffer.from(chunk));
      totalBytes += chunk.byteLength;
      if (chunk.byteLength < value.byteLength) {
        truncated = true;
        break;
      }
    }
  } finally {
    await reader.cancel().catch(() => {});
  }

  return { body: Buffer.concat(chunks), truncated };
}

function buildForwardHeaders(route: RouteDocument, inboundWebhook: InboundWebhook, environment: Environment) {
  const headers = new Headers();
  for (const header of inboundWebhook.headers) {
    if (!hopByHopHeaders.has(header.name.toLowerCase())) {
      headers.append(header.name, header.value);
    }
  }

  for (const header of route.customHeaders) {
    headers.set(header.name, EncryptionHelper.decrypt(header.valueEncrypted, environment.APP_ENCRYPTION_KEY));
  }

  return headers;
}

function appendIncomingQuery(routeUrl: URL, incomingQuery: string) {
  if (!incomingQuery) {
    return routeUrl.toString();
  }

  const destination = new URL(routeUrl);
  destination.search = [destination.search.slice(1), incomingQuery].filter(Boolean).join("&");
  return destination.toString();
}

function acceptsBody(method: string) {
  return method !== "GET" && method !== "HEAD";
}

function isTimeout(error: unknown) {
  return error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");
}

function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}
