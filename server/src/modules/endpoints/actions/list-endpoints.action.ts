import type { Db } from "mongodb";
import type { EndpointDocument } from "../endpoint.model.js";

export async function listEndpointsAction(database: Db) {
  return database.collection<EndpointDocument>("endpoints").find({ deletedAt: null }).sort({ updatedAt: -1 }).toArray();
}
