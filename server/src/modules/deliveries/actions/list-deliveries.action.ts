import { ObjectId, type Db, type Filter } from "mongodb";
import type { DeliveryDocument, DeliveryOutcome } from "../delivery.model.js";

type DeliveryListInput = {
  cursor?: string;
  endpointId?: string;
  eventId?: string;
  outcome?: DeliveryOutcome;
  routeId?: string;
  limit: number;
};

export async function listDeliveriesAction(database: Db, input: DeliveryListInput) {
  const filter: Filter<DeliveryDocument> = { deletedAt: null };
  if (input.endpointId) filter.endpointId = new ObjectId(input.endpointId);
  if (input.eventId) filter.eventId = new ObjectId(input.eventId);
  if (input.routeId) filter.routeId = new ObjectId(input.routeId);
  if (input.outcome) filter.outcome = input.outcome;
  if (input.cursor) filter._id = { $lt: new ObjectId(input.cursor) };

  const deliveries = await database.collection<DeliveryDocument>("deliveries").find(filter).sort({ _id: -1 }).limit(input.limit + 1).toArray();
  const hasMore = deliveries.length > input.limit;
  const page = deliveries.slice(0, input.limit);
  return { deliveries: page, nextCursor: hasMore ? page.at(-1)?._id.toHexString() ?? null : null };
}
