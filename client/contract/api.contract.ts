import { z } from "zod";

const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, "Expected a MongoDB object id");
const isoDateSchema = z.string().datetime();

export const apiErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
  }),
});

export const paginationQuerySchema = z.object({
  cursor: objectIdSchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export const pageInfoSchema = z.object({
  nextCursor: objectIdSchema.nullable(),
});

export const loginRequestSchema = z.object({
  username: z.string().min(1).max(128),
  password: z.string().min(1).max(1024),
});

export const sessionSchema = z.object({
  authenticated: z.boolean(),
  username: z.string().nullable(),
});

export const createEndpointRequestSchema = z.object({
  name: z.string().trim().min(1).max(120),
});

export const updateEndpointRequestSchema = createEndpointRequestSchema;

export const endpointSchema = z.object({
  id: objectIdSchema,
  name: z.string(),
  publicUrl: z.string().url(),
  routeCount: z.number().int().nonnegative(),
  createdAt: isoDateSchema,
  updatedAt: isoDateSchema,
});

export const endpointListResponseSchema = z.object({
  endpoints: z.array(endpointSchema),
});

export const endpointResponseSchema = z.object({
  endpoint: endpointSchema,
});

export const customHeaderInputSchema = z.object({
  name: z.string().trim().min(1).max(256),
  value: z.string().max(8192),
});

export const routeHeaderSchema = z.object({
  name: z.string(),
  value: z.string(),
  isMasked: z.boolean(),
});

export const routeSchema = z.object({
  id: objectIdSchema,
  endpointId: objectIdSchema,
  url: z.string().url(),
  enabled: z.boolean(),
  customHeaders: z.array(routeHeaderSchema),
  createdAt: isoDateSchema,
  updatedAt: isoDateSchema,
});

export const createRouteRequestSchema = z.object({
  url: z.string().url().max(2048),
  enabled: z.boolean().default(true),
  customHeaders: z.array(customHeaderInputSchema).max(50).default([]),
});

export const updateRouteRequestSchema = z
  .object({
    url: z.string().url().max(2048).optional(),
    enabled: z.boolean().optional(),
    customHeaders: z.array(customHeaderInputSchema).max(50).optional(),
  })
  .refine((value) => Object.values(value).some((field) => field !== undefined), {
    message: "At least one field must be provided",
  });

export const routeListResponseSchema = z.object({
  routes: z.array(routeSchema),
});

export const routeResponseSchema = z.object({
  route: routeSchema,
});

export const eventHeaderSchema = z.object({
  name: z.string(),
  value: z.string(),
  isRedacted: z.boolean(),
});

export const eventSchema = z.object({
  id: objectIdSchema,
  endpointId: objectIdSchema,
  endpointName: z.string(),
  method: z.string(),
  query: z.string(),
  headers: z.array(eventHeaderSchema),
  bodyAvailable: z.boolean(),
  bodyContentType: z.string().nullable(),
  bodySizeBytes: z.number().int().nonnegative(),
  receivedAt: isoDateSchema,
});

export const eventBodySchema = z.object({
  encoding: z.literal("base64"),
  content: z.string(),
});

export const eventListQuerySchema = paginationQuerySchema.extend({
  endpointId: objectIdSchema.optional(),
});

export const deliveryOutcomeSchema = z.enum(["success", "http_failure", "network_error", "timeout"]);

export const deliverySchema = z.object({
  id: objectIdSchema,
  eventId: objectIdSchema,
  endpointId: objectIdSchema,
  routeId: objectIdSchema,
  routeUrl: z.string().url(),
  outcome: deliveryOutcomeSchema,
  responseStatus: z.number().int().min(100).max(599).nullable(),
  responseHeaders: z.array(eventHeaderSchema),
  responseBodyAvailable: z.boolean(),
  responseBodyContentType: z.string().nullable(),
  responseBodySizeBytes: z.number().int().nonnegative(),
  responseBodyTruncated: z.boolean(),
  errorMessage: z.string().nullable(),
  durationMs: z.number().int().nonnegative(),
  attemptedAt: isoDateSchema,
});

export const deliveryResponseBodySchema = z.object({
  encoding: z.literal("base64"),
  content: z.string(),
});

export const deliveryListQuerySchema = paginationQuerySchema.extend({
  endpointId: objectIdSchema.optional(),
  eventId: objectIdSchema.optional(),
  outcome: deliveryOutcomeSchema.optional(),
  routeId: objectIdSchema.optional(),
});

export const eventDetailResponseSchema = z.object({
  event: eventSchema,
  body: eventBodySchema.nullable(),
  deliveries: z.array(deliverySchema),
});

export const eventListResponseSchema = z.object({
  events: z.array(eventSchema),
  pageInfo: pageInfoSchema,
});

export const deliveryListResponseSchema = z.object({
  deliveries: z.array(deliverySchema),
  pageInfo: pageInfoSchema,
});

export const deliveryResponseSchema = z.object({
  delivery: deliverySchema,
});

export const deliveryDetailResponseSchema = z.object({
  delivery: deliverySchema,
  responseBody: deliveryResponseBodySchema.nullable(),
});

export type ApiError = z.infer<typeof apiErrorSchema>;
export type CreateEndpointRequest = z.infer<typeof createEndpointRequestSchema>;
export type CreateRouteRequest = z.infer<typeof createRouteRequestSchema>;
export type Delivery = z.infer<typeof deliverySchema>;
export type Endpoint = z.infer<typeof endpointSchema>;
export type Event = z.infer<typeof eventSchema>;
export type Route = z.infer<typeof routeSchema>;
export type UpdateEndpointRequest = z.infer<typeof updateEndpointRequestSchema>;
export type UpdateRouteRequest = z.infer<typeof updateRouteRequestSchema>;
