import type { Db } from "mongodb";
import type { RouteDocument } from "../route.model.js";

export async function deleteRouteAction(database: Db, route: RouteDocument) {
  const deletedAt = new Date();
  await database.collection<RouteDocument>("routes").updateOne({ _id: route._id }, { $set: { deletedAt, updatedAt: deletedAt } });
}
