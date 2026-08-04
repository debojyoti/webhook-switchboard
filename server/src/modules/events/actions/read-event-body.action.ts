import type { Db } from "mongodb";
import type { Environment } from "../../../config/env.js";
import { EncryptionHelper } from "../../../infra/encryption/encryption.helper.js";
import type { EventBodyDocument, EventDocument } from "../event.model.js";

export async function readEventBodyAction(database: Db, event: EventDocument, environment: Environment) {
  if (!event.bodyRetentionExpiresAt || event.bodyRetentionExpiresAt <= new Date()) {
    return null;
  }

  const body = await database.collection<EventBodyDocument>("eventBodies").findOne({ eventId: event._id, deletedAt: null });
  if (!body) {
    return null;
  }

  return { encoding: "base64" as const, content: EncryptionHelper.decrypt(body.contentEncrypted, environment.APP_ENCRYPTION_KEY) };
}
