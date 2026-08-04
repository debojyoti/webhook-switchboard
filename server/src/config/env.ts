import "dotenv/config";
import { z } from "zod";

const environmentSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),
  PUBLIC_BASE_URL: z.string().url("PUBLIC_BASE_URL must be a valid URL"),
  ADMIN_USERNAME: z.string().min(1, "ADMIN_USERNAME is required"),
  ADMIN_PASSWORD: z.string().min(1, "ADMIN_PASSWORD is required"),
  AUTH_SESSION_SECRET: z.string().min(32, "AUTH_SESSION_SECRET must be at least 32 characters"),
  APP_ENCRYPTION_KEY: z.string().refine((value) => Buffer.from(value, "base64").length === 32, "APP_ENCRYPTION_KEY must be a base64-encoded 32-byte key"),
  ALLOW_INTERNAL_ROUTE_TARGETS: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
  EVENT_RETENTION_DAYS: z.coerce.number().int().positive().default(30),
  DELIVERY_RETENTION_DAYS: z.coerce.number().int().positive().default(30),
  EVENT_BODY_RETENTION_DAYS: z.coerce.number().int().nonnegative().default(30),
  MAX_WEBHOOK_BODY_BYTES: z.coerce.number().int().positive().default(5 * 1024 * 1024),
});

export type Environment = z.infer<typeof environmentSchema>;

export function loadEnvironment(rawEnvironment: NodeJS.ProcessEnv = process.env): Environment {
  const parsed = environmentSchema.safeParse(rawEnvironment);

  if (!parsed.success) {
    throw new Error(`Invalid environment configuration: ${parsed.error.issues.map((issue) => issue.message).join(", ")}`);
  }

  return parsed.data;
}
