import crypto from "node:crypto";
import type { Db } from "mongodb";
import type { CreateEndpointRequest } from "../../../../contract/api.contract.js";
import type { EndpointDocument } from "../endpoint.model.js";

export async function createEndpointAction(database: Db, input: CreateEndpointRequest): Promise<EndpointDocument> {
  const now = new Date();
  const endpoint: Omit<EndpointDocument, "_id"> = {
    name: input.name,
    publicToken: crypto.randomBytes(32).toString("base64url"),
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };
  const result = await database.collection<EndpointDocument>("endpoints").insertOne(endpoint as EndpointDocument);
  return { ...endpoint, _id: result.insertedId };
}
