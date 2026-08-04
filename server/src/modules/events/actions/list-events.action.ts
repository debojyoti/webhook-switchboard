import { ObjectId, type Db, type Filter } from "mongodb";
import type { EventDocument } from "../event.model.js";

export async function listEventsAction(database: Db, input: { cursor?: string; endpointId?: string; limit: number }) {
  const filter: Filter<EventDocument> = { deletedAt: null };
  if (input.endpointId) {
    filter.endpointId = new ObjectId(input.endpointId);
  }
  if (input.cursor) {
    filter._id = { $lt: new ObjectId(input.cursor) };
  }

  const events = await database.collection<EventDocument>("events").find(filter).sort({ _id: -1 }).limit(input.limit + 1).toArray();
  const hasMore = events.length > input.limit;
  const page = events.slice(0, input.limit);
  return { events: page, nextCursor: hasMore ? page.at(-1)?._id.toHexString() ?? null : null };
}
