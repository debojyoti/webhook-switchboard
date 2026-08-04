import type { Db } from "mongodb";
import type { EndpointDocument } from "../../endpoints/endpoint.model.js";
import type { RouteDocument } from "../route.model.js";

export async function listRoutesAction(database: Db, endpoint: EndpointDocument) {
  return database.collection<RouteDocument>("routes").find({ endpointId: endpoint._id, deletedAt: null }).sort({ createdAt: -1 }).toArray();
}
