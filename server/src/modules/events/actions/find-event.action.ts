import { ObjectId, type Db } from "mongodb";
import { HttpError } from "../../../http/http-error.js";
import type { EventDocument } from "../event.model.js";

export async function findEventAction(database: Db, eventId: string) {
  if (!ObjectId.isValid(eventId)) {
    throw new HttpError(404, "event_not_found", "Event not found");
  }

  const event = await database.collection<EventDocument>("events").findOne({ _id: new ObjectId(eventId), deletedAt: null });
  if (!event) {
    throw new HttpError(404, "event_not_found", "Event not found");
  }

  return event;
}
