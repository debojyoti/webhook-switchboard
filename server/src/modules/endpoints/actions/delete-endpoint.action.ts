import type { Db } from "mongodb";
import type { EndpointDocument } from "../endpoint.model.js";

export async function deleteEndpointAction(database: Db, endpoint: EndpointDocument) {
  const deletedAt = new Date();
  await Promise.all([
    database.collection<EndpointDocument>("endpoints").updateOne({ _id: endpoint._id }, { $set: { deletedAt, updatedAt: deletedAt } }),
    database.collection("routes").updateMany({ endpointId: endpoint._id, deletedAt: null }, { $set: { deletedAt, updatedAt: deletedAt } }),
  ]);
}
