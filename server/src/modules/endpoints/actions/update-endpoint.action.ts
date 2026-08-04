import type { Db } from "mongodb";
import type { UpdateEndpointRequest } from "../../../../contract/api.contract.js";
import type { EndpointDocument } from "../endpoint.model.js";

export async function updateEndpointAction(database: Db, endpoint: EndpointDocument, input: UpdateEndpointRequest) {
  const updatedAt = new Date();
  await database.collection<EndpointDocument>("endpoints").updateOne(
    { _id: endpoint._id },
    { $set: { name: input.name, updatedAt } },
  );
  return { ...endpoint, name: input.name, updatedAt };
}
