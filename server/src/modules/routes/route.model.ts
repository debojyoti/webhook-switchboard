import type { ObjectId } from "mongodb";

export type StoredRouteHeader = {
  name: string;
  valueEncrypted: string;
};

export type RouteDocument = {
  _id: ObjectId;
  endpointId: ObjectId;
  url: string;
  enabled: boolean;
  customHeaders: StoredRouteHeader[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};
