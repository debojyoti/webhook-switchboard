import { ObjectId, type Db } from "mongodb";
import { HttpError } from "../../../http/http-error.js";
import type { DeliveryDocument } from "../delivery.model.js";

export async function findDeliveryAction(database: Db, deliveryId: string) {
  if (!ObjectId.isValid(deliveryId)) {
    throw new HttpError(404, "delivery_not_found", "Delivery not found");
  }

  const delivery = await database.collection<DeliveryDocument>("deliveries").findOne({ _id: new ObjectId(deliveryId), deletedAt: null });
  if (!delivery) {
    throw new HttpError(404, "delivery_not_found", "Delivery not found");
  }

  return delivery;
}
