import type { ObjectId } from "mongodb";

export type EndpointDocument = {
  _id: ObjectId;
  name: string;
  publicToken: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};
