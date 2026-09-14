import type { ObjectId } from "mongodb";

export type DeliveryOutcome = "success" | "http_failure" | "network_error" | "timeout";

export type StoredDeliveryResponseHeader = {
  name: string;
  value: string;
  isRedacted: boolean;
};

export type DeliveryDocument = {
  _id: ObjectId;
  eventId: ObjectId;
  endpointId: ObjectId;
  routeId: ObjectId;
  routeUrl: string;
  outcome: DeliveryOutcome;
  responseStatus: number | null;
  responseHeaders: StoredDeliveryResponseHeader[];
  responseBodyEncrypted: string | null;
  responseBodyContentType: string | null;
  responseBodySizeBytes: number;
  responseBodyTruncated: boolean;
  errorMessage: string | null;
  durationMs: number;
  attemptedAt: Date;
  expiresAt: Date;
  deletedAt: Date | null;
};
