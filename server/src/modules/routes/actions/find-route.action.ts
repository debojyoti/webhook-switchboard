import { ObjectId, type Db } from "mongodb";
import { HttpError } from "../../../http/http-error.js";
import type { RouteDocument } from "../route.model.js";

export async function findRouteAction(database: Db, routeId: string): Promise<RouteDocument> {
  if (!ObjectId.isValid(routeId)) {
    throw new HttpError(404, "route_not_found", "Route not found");
  }

  const route = await database.collection<RouteDocument>("routes").findOne({
    _id: new ObjectId(routeId),
    deletedAt: null,
  });
  if (!route) {
    throw new HttpError(404, "route_not_found", "Route not found");
  }

  return route;
}
