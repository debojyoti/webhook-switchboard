import crypto from "node:crypto";
import type { Environment } from "../../../config/env.js";

export function loginAction(username: string, password: string, environment: Environment) {
  return timingSafeEqual(username, environment.ADMIN_USERNAME) && timingSafeEqual(password, environment.ADMIN_PASSWORD);
}

function timingSafeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer);
}
