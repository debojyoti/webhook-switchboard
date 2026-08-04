import { ObjectId, type Db } from "mongodb";
import { HttpError } from "../../../http/http-error.js";
import type { EndpointDocument } from "../endpoint.model.js";

export async function findEndpointAction(database: Db, endpointId: string): Promise<EndpointDocument> {
  if (!ObjectId.isValid(endpointId)) {
    throw new HttpError(404, "endpoint_not_found", "Endpoint not found");
  }

  const endpoint = await database.collection<EndpointDocument>("endpoints").findOne({
    _id: new ObjectId(endpointId),
    deletedAt: null,
  });
  if (!endpoint) {
    throw new HttpError(404, "endpoint_not_found", "Endpoint not found");
  }

  return endpoint;
}
