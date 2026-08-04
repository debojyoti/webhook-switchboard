import type { ObjectId } from "mongodb";

export type StoredEventHeader = {
  name: string;
  value: string;
  isRedacted: boolean;
};

export type EventDocument = {
  _id: ObjectId;
  endpointId: ObjectId;
  endpointName: string;
  method: string;
  query: string;
  headers: StoredEventHeader[];
  bodyContentType: string | null;
  bodySizeBytes: number;
  bodyRetentionExpiresAt: Date | null;
  receivedAt: Date;
  expiresAt: Date;
  deletedAt: Date | null;
};

export type EventBodyDocument = {
  _id: ObjectId;
  eventId: ObjectId;
  contentEncrypted: string;
  expiresAt: Date;
  deletedAt: Date | null;
};
