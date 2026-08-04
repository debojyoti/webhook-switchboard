import express, { type NextFunction, type Request, type Response } from "express";
import type { Db } from "mongodb";
import {
  createEndpointRequestSchema,
  createRouteRequestSchema,
  deliveryListQuerySchema,
  eventListQuerySchema,
  loginRequestSchema,
  updateEndpointRequestSchema,
  updateRouteRequestSchema,
} from "../../contract/api.contract.js";
import type { Environment } from "../config/env.js";
import { RouteUrlSecurityError } from "../infra/security/route-url-security.helper.js";
import { loginAction } from "../modules/auth/actions/login.action.js";
import { AuthSessionHelper } from "../modules/auth/auth-session.helper.js";
import { createEndpointAction } from "../modules/endpoints/actions/create-endpoint.action.js";
import { deleteEndpointAction } from "../modules/endpoints/actions/delete-endpoint.action.js";
import { findEndpointAction } from "../modules/endpoints/actions/find-endpoint.action.js";
import { listEndpointsAction } from "../modules/endpoints/actions/list-endpoints.action.js";
import { updateEndpointAction } from "../modules/endpoints/actions/update-endpoint.action.js";
import { EndpointPresenter } from "../modules/endpoints/endpoint.presenter.js";
import { findEventAction } from "../modules/events/actions/find-event.action.js";
import { listEventsAction } from "../modules/events/actions/list-events.action.js";
import { readEventBodyAction } from "../modules/events/actions/read-event-body.action.js";
import { EventPresenter } from "../modules/events/event.presenter.js";
import { findDeliveryAction } from "../modules/deliveries/actions/find-delivery.action.js";
import { listDeliveriesAction } from "../modules/deliveries/actions/list-deliveries.action.js";
import { DeliveryPresenter } from "../modules/deliveries/delivery.presenter.js";
import type { DeliveryDocument } from "../modules/deliveries/delivery.model.js";
import { createRouteAction } from "../modules/routes/actions/create-route.action.js";
import { deleteRouteAction } from "../modules/routes/actions/delete-route.action.js";
import { findRouteAction } from "../modules/routes/actions/find-route.action.js";
import { listRoutesAction } from "../modules/routes/actions/list-routes.action.js";
import { updateRouteAction } from "../modules/routes/actions/update-route.action.js";
import { RoutePresenter } from "../modules/routes/route.presenter.js";
import { HttpError } from "./http-error.js";
import { requireAdminMiddleware } from "./middleware/require-admin.middleware.js";

export function createApiRouter(database: Db, environment: Environment) {
  const router = express.Router();
  router.use(express.json({ limit: "256kb" }));

  router.post("/auth/login", asyncRoute(async (request, response) => {
    const input = loginRequestSchema.parse(request.body);
    if (!loginAction(input.username, input.password, environment)) {
      throw new HttpError(401, "invalid_credentials", "Invalid administrator credentials");
    }

    response.setHeader("Set-Cookie", AuthSessionHelper.createCookie(environment.ADMIN_USERNAME, environment.AUTH_SESSION_SECRET, environment.NODE_ENV === "production"));
    response.status(200).json({ authenticated: true, username: environment.ADMIN_USERNAME });
  }));

  router.get("/auth/session", (request, response) => {
    const session = AuthSessionHelper.read(request.headers.cookie, environment.AUTH_SESSION_SECRET);
    response.status(200).json({ authenticated: Boolean(session), username: session?.username ?? null });
  });

  router.post("/auth/logout", (request, response) => {
    response.setHeader("Set-Cookie", AuthSessionHelper.clearCookie(environment.NODE_ENV === "production"));
    response.status(204).send();
  });

  router.use(requireAdminMiddleware(environment));

  router.get("/endpoints", asyncRoute(async (_request, response) => {
    const endpoints = await listEndpointsAction(database);
    const routeCounts = await database.collection("routes").aggregate<{ _id: unknown; count: number }>([
      { $match: { deletedAt: null } },
      { $group: { _id: "$endpointId", count: { $sum: 1 } } },
    ]).toArray();
    const counts = new Map(routeCounts.map((item) => [String(item._id), item.count]));
    response.status(200).json({ endpoints: endpoints.map((endpoint) => EndpointPresenter.present(endpoint, counts.get(endpoint._id.toHexString()) ?? 0, environment)) });
  }));

  router.post("/endpoints", asyncRoute(async (request, response) => {
    const endpoint = await createEndpointAction(database, createEndpointRequestSchema.parse(request.body));
    response.status(201).json({ endpoint: EndpointPresenter.present(endpoint, 0, environment) });
  }));

  router.get("/endpoints/:endpointId", asyncRoute(async (request, response) => {
    const endpoint = await findEndpointAction(database, readRouteParameter(request.params.endpointId));
    const routeCount = await database.collection("routes").countDocuments({ endpointId: endpoint._id, deletedAt: null });
    response.status(200).json({ endpoint: EndpointPresenter.present(endpoint, routeCount, environment) });
  }));

  router.patch("/endpoints/:endpointId", asyncRoute(async (request, response) => {
    const endpoint = await findEndpointAction(database, readRouteParameter(request.params.endpointId));
    const updated = await updateEndpointAction(database, endpoint, updateEndpointRequestSchema.parse(request.body));
    const routeCount = await database.collection("routes").countDocuments({ endpointId: endpoint._id, deletedAt: null });
    response.status(200).json({ endpoint: EndpointPresenter.present(updated, routeCount, environment) });
  }));

  router.delete("/endpoints/:endpointId", asyncRoute(async (request, response) => {
    const endpoint = await findEndpointAction(database, readRouteParameter(request.params.endpointId));
    await deleteEndpointAction(database, endpoint);
    response.status(204).send();
  }));

  router.get("/endpoints/:endpointId/routes", asyncRoute(async (request, response) => {
    const endpoint = await findEndpointAction(database, readRouteParameter(request.params.endpointId));
    const routes = await listRoutesAction(database, endpoint);
    response.status(200).json({ routes: routes.map((route) => RoutePresenter.present(route, environment)) });
  }));

  router.post("/endpoints/:endpointId/routes", asyncRoute(async (request, response) => {
    const endpoint = await findEndpointAction(database, readRouteParameter(request.params.endpointId));
    const route = await createRouteAction(database, endpoint, createRouteRequestSchema.parse(request.body), environment);
    response.status(201).json({ route: RoutePresenter.present(route, environment) });
  }));

  router.patch("/routes/:routeId", asyncRoute(async (request, response) => {
    const route = await findRouteAction(database, readRouteParameter(request.params.routeId));
    const updated = await updateRouteAction(database, route, updateRouteRequestSchema.parse(request.body), environment);
    response.status(200).json({ route: RoutePresenter.present(updated, environment) });
  }));

  router.delete("/routes/:routeId", asyncRoute(async (request, response) => {
    const route = await findRouteAction(database, readRouteParameter(request.params.routeId));
    await deleteRouteAction(database, route);
    response.status(204).send();
  }));

  router.get("/events", asyncRoute(async (request, response) => {
    const input = eventListQuerySchema.parse(request.query);
    const { events, nextCursor } = await listEventsAction(database, input);
    response.status(200).json({ events: events.map(EventPresenter.present), pageInfo: { nextCursor } });
  }));

  router.get("/events/:eventId", asyncRoute(async (request, response) => {
    const event = await findEventAction(database, readRouteParameter(request.params.eventId));
    const [body, deliveries] = await Promise.all([
      readEventBodyAction(database, event, environment),
      database.collection<DeliveryDocument>("deliveries").find({ eventId: event._id, deletedAt: null }).sort({ attemptedAt: -1 }).toArray(),
    ]);
    response.status(200).json({ event: EventPresenter.present(event), body, deliveries: deliveries.map(DeliveryPresenter.present) });
  }));

  router.get("/deliveries", asyncRoute(async (request, response) => {
    const input = deliveryListQuerySchema.parse(request.query);
    const { deliveries, nextCursor } = await listDeliveriesAction(database, input);
    response.status(200).json({ deliveries: deliveries.map(DeliveryPresenter.present), pageInfo: { nextCursor } });
  }));

  router.get("/deliveries/:deliveryId", asyncRoute(async (request, response) => {
    const delivery = await findDeliveryAction(database, readRouteParameter(request.params.deliveryId));
    response.status(200).json({ delivery: DeliveryPresenter.present(delivery) });
  }));

  router.use((_request, _response, next) => {
    next(new HttpError(404, "not_found", "Resource not found"));
  });

  router.use((error: unknown, _request: Request, _response: Response, next: NextFunction) => {
    if (error instanceof RouteUrlSecurityError) {
      next(new HttpError(422, "unsafe_route_url", error.message));
      return;
    }

    next(error);
  });

  return router;
}

function asyncRoute(handler: (request: Request, response: Response) => Promise<void>) {
  return (request: Request, response: Response, next: NextFunction) => {
    void handler(request, response).catch(next);
  };
}

function readRouteParameter(value: string | string[]) {
  if (typeof value !== "string") {
    throw new HttpError(404, "not_found", "Resource not found");
  }

  return value;
}
