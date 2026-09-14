import type { Delivery } from "../../../contract/api.contract.js";
import type { DeliveryDocument } from "./delivery.model.js";

export const DeliveryPresenter = {
  present(document: DeliveryDocument): Delivery {
    return {
      id: document._id.toHexString(),
      eventId: document.eventId.toHexString(),
      endpointId: document.endpointId.toHexString(),
      routeId: document.routeId.toHexString(),
      routeUrl: document.routeUrl,
      outcome: document.outcome,
      responseStatus: document.responseStatus,
      responseHeaders: document.responseHeaders,
      responseBodyAvailable: document.responseBodyEncrypted !== null,
      responseBodyContentType: document.responseBodyContentType,
      responseBodySizeBytes: document.responseBodySizeBytes,
      responseBodyTruncated: document.responseBodyTruncated,
      errorMessage: document.errorMessage,
      durationMs: document.durationMs,
      attemptedAt: document.attemptedAt.toISOString(),
    };
  },
};
