import type { Db } from "mongodb";
import type { CreateRouteRequest } from "../../../../contract/api.contract.js";
import type { Environment } from "../../../config/env.js";
import { EncryptionHelper } from "../../../infra/encryption/encryption.helper.js";
import { RouteUrlSecurityHelper } from "../../../infra/security/route-url-security.helper.js";
import type { EndpointDocument } from "../../endpoints/endpoint.model.js";
import type { RouteDocument } from "../route.model.js";

export async function createRouteAction(
  database: Db,
  endpoint: EndpointDocument,
  input: CreateRouteRequest,
  environment: Environment,
): Promise<RouteDocument> {
  const url = await RouteUrlSecurityHelper.assertAllowed(input.url, environment.ALLOW_INTERNAL_ROUTE_TARGETS);
  const now = new Date();
  const route: Omit<RouteDocument, "_id"> = {
    endpointId: endpoint._id,
    url: url.toString(),
    enabled: input.enabled,
    customHeaders: input.customHeaders.map((header) => ({
      name: header.name,
      valueEncrypted: EncryptionHelper.encrypt(header.value, environment.APP_ENCRYPTION_KEY),
    })),
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };
  const result = await database.collection<RouteDocument>("routes").insertOne(route as RouteDocument);
  return { ...route, _id: result.insertedId };
}
