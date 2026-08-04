import type { Db } from "mongodb";
import type { Environment } from "../../../config/env.js";
import { EncryptionHelper } from "../../../infra/encryption/encryption.helper.js";
import { HeaderSecurityHelper } from "../../../infra/security/header-security.helper.js";
import type { EndpointDocument } from "../../endpoints/endpoint.model.js";
import type { InboundWebhook } from "../../webhooks/inbound-webhook.js";
import type { EventBodyDocument, EventDocument } from "../event.model.js";

export async function createEventAction(
  database: Db,
  endpoint: EndpointDocument,
  inboundWebhook: InboundWebhook,
  environment: Environment,
): Promise<EventDocument> {
  const receivedAt = new Date();
  const bodyRetentionExpiresAt = environment.EVENT_BODY_RETENTION_DAYS > 0
    ? addDays(receivedAt, environment.EVENT_BODY_RETENTION_DAYS)
    : null;
  const event: Omit<EventDocument, "_id"> = {
    endpointId: endpoint._id,
    endpointName: endpoint.name,
    method: inboundWebhook.method,
    query: inboundWebhook.query,
    headers: inboundWebhook.headers.map((header) => ({
      name: header.name,
      value: HeaderSecurityHelper.isSensitive(header.name) ? "[redacted]" : header.value,
      isRedacted: HeaderSecurityHelper.isSensitive(header.name),
    })),
    bodyContentType: inboundWebhook.headers.find((header) => header.name.toLowerCase() === "content-type")?.value ?? null,
    bodySizeBytes: inboundWebhook.body.length,
    bodyRetentionExpiresAt,
    receivedAt,
    expiresAt: addDays(receivedAt, environment.EVENT_RETENTION_DAYS),
    deletedAt: null,
  };
  const result = await database.collection<EventDocument>("events").insertOne(event as EventDocument);
  const savedEvent = { ...event, _id: result.insertedId };

  if (bodyRetentionExpiresAt && inboundWebhook.body.length > 0) {
    const eventBody: Omit<EventBodyDocument, "_id"> = {
      eventId: savedEvent._id,
      contentEncrypted: EncryptionHelper.encrypt(inboundWebhook.body.toString("base64"), environment.APP_ENCRYPTION_KEY),
      expiresAt: bodyRetentionExpiresAt,
      deletedAt: null,
    };
    await database.collection<EventBodyDocument>("eventBodies").insertOne(eventBody as EventBodyDocument);
  }

  return savedEvent;
}

function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}
