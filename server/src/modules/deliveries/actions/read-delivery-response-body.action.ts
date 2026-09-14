import type { Environment } from "../../../config/env.js";
import { EncryptionHelper } from "../../../infra/encryption/encryption.helper.js";
import type { DeliveryDocument } from "../delivery.model.js";

export function readDeliveryResponseBodyAction(delivery: DeliveryDocument, environment: Environment) {
  if (!delivery.responseBodyEncrypted) {
    return null;
  }

  return { encoding: "base64" as const, content: EncryptionHelper.decrypt(delivery.responseBodyEncrypted, environment.APP_ENCRYPTION_KEY) };
}
