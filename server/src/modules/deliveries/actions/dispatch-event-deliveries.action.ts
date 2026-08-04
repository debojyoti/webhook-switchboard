import type { Db } from "mongodb";
import type { Environment } from "../../../config/env.js";
import { Logger } from "../../../infra/logging/logger.js";
import type { EventDocument } from "../../events/event.model.js";
import { listEnabledRoutesForEndpointAction } from "../../routes/actions/list-enabled-routes-for-endpoint.action.js";
import type { InboundWebhook } from "../../webhooks/inbound-webhook.js";
import { deliverEventToRouteAction } from "./deliver-event-to-route.action.js";

export async function dispatchEventDeliveriesAction(
  database: Db,
  event: EventDocument,
  inboundWebhook: InboundWebhook,
  environment: Environment,
) {
  const routes = await listEnabledRoutesForEndpointAction(database, event.endpointId);
  const results = await Promise.allSettled(
    routes.map((route) => deliverEventToRouteAction(database, event, route, inboundWebhook, environment)),
  );

  results.forEach((result) => {
    if (result.status === "rejected") {
      Logger.error("Unexpected route delivery failure", {
        action: "deliveries.dispatch",
        requestId: event._id.toHexString(),
      });
    }
  });
}
