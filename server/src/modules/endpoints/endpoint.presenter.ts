import type { Endpoint } from "../../../contract/api.contract.js";
import type { Environment } from "../../config/env.js";
import type { EndpointDocument } from "./endpoint.model.js";

export const EndpointPresenter = {
  present(document: EndpointDocument, routeCount: number, environment: Environment): Endpoint {
    return {
      id: document._id.toHexString(),
      name: document.name,
      publicUrl: new URL(`/webhooks/${document.publicToken}`, environment.PUBLIC_BASE_URL).toString(),
      routeCount,
      createdAt: document.createdAt.toISOString(),
      updatedAt: document.updatedAt.toISOString(),
    };
  },
};
