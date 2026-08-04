import type { Db } from "mongodb";
import type { UpdateRouteRequest } from "../../../../contract/api.contract.js";
import type { Environment } from "../../../config/env.js";
import { EncryptionHelper } from "../../../infra/encryption/encryption.helper.js";
import { RouteUrlSecurityHelper } from "../../../infra/security/route-url-security.helper.js";
import type { RouteDocument } from "../route.model.js";

export async function updateRouteAction(
  database: Db,
  route: RouteDocument,
  input: UpdateRouteRequest,
  environment: Environment,
): Promise<RouteDocument> {
  const url = input.url ? (await RouteUrlSecurityHelper.assertAllowed(input.url, environment.ALLOW_INTERNAL_ROUTE_TARGETS)).toString() : route.url;
  const customHeaders = input.customHeaders
    ? input.customHeaders.map((header) => ({
        name: header.name,
        valueEncrypted: EncryptionHelper.encrypt(header.value, environment.APP_ENCRYPTION_KEY),
      }))
    : route.customHeaders;
  const updatedAt = new Date();
  const updatedRoute = {
    ...route,
    url,
    enabled: input.enabled ?? route.enabled,
    customHeaders,
    updatedAt,
  };
  await database.collection<RouteDocument>("routes").updateOne(
    { _id: route._id },
    { $set: { url, enabled: updatedRoute.enabled, customHeaders, updatedAt } },
  );
  return updatedRoute;
}
