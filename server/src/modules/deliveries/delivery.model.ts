import type { ObjectId } from "mongodb";

export type DeliveryOutcome = "success" | "http_failure" | "network_error" | "timeout";

export type DeliveryDocument = {
  _id: ObjectId;
  eventId: ObjectId;
  endpointId: ObjectId;
  routeId: ObjectId;
  routeUrl: string;
  outcome: DeliveryOutcome;
  responseStatus: number | null;
  errorMessage: string | null;
  durationMs: number;
  attemptedAt: Date;
  expiresAt: Date;
  deletedAt: Date | null;
};
