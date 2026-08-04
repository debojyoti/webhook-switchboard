import type { Db } from "mongodb";
import type { EndpointDocument } from "../endpoint.model.js";

export async function findEndpointByTokenAction(database: Db, publicToken: string) {
  return database.collection<EndpointDocument>("endpoints").findOne({ publicToken, deletedAt: null });
}
