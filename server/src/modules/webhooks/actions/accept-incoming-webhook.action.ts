import type { Db } from "mongodb";
import type { Environment } from "../../../config/env.js";
import { HttpError } from "../../../http/http-error.js";
import { dispatchEventDeliveriesAction } from "../../deliveries/actions/dispatch-event-deliveries.action.js";
import { createEventAction } from "../../events/actions/create-event.action.js";
import type { EndpointDocument } from "../../endpoints/endpoint.model.js";
import type { InboundWebhook } from "../inbound-webhook.js";

export async function acceptIncomingWebhookAction(
  database: Db,
  endpoint: EndpointDocument | null,
  inboundWebhook: InboundWebhook,
  environment: Environment,
) {
  if (!endpoint) {
    throw new HttpError(404, "endpoint_not_found", "Webhook endpoint not found");
  }

  const event = await createEventAction(database, endpoint, inboundWebhook, environment);
  return {
    event,
    dispatch() {
      setImmediate(() => {
        void dispatchEventDeliveriesAction(database, event, inboundWebhook, environment);
      });
    },
  };
}
