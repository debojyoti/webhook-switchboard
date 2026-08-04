import type { Db, ObjectId } from "mongodb";
import type { RouteDocument } from "../route.model.js";

export async function listEnabledRoutesForEndpointAction(database: Db, endpointId: ObjectId) {
  return database.collection<RouteDocument>("routes").find({ endpointId, deletedAt: null, enabled: true }).toArray();
}
