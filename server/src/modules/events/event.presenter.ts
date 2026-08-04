import type { Event } from "../../../contract/api.contract.js";
import type { EventDocument } from "./event.model.js";

export const EventPresenter = {
  present(document: EventDocument): Event {
    return {
      id: document._id.toHexString(),
      endpointId: document.endpointId.toHexString(),
      endpointName: document.endpointName,
      method: document.method,
      query: document.query,
      headers: document.headers,
      bodyAvailable: document.bodySizeBytes > 0 && document.bodyRetentionExpiresAt !== null && document.bodyRetentionExpiresAt > new Date(),
      bodyContentType: document.bodyContentType,
      bodySizeBytes: document.bodySizeBytes,
      receivedAt: document.receivedAt.toISOString(),
    };
  },
};
