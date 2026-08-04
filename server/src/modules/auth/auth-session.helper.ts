import crypto from "node:crypto";

const sessionLifetimeSeconds = 60 * 60 * 12;

export type AdminSession = {
  expiresAt: number;
  username: string;
};

export const AuthSessionHelper = {
  clearCookie(isProduction: boolean) {
    return serializeCookie("switchboard_session", "", isProduction, 0);
  },

  createCookie(username: string, secret: string, isProduction: boolean) {
    const session: AdminSession = {
      username,
      expiresAt: Date.now() + sessionLifetimeSeconds * 1000,
    };
    const payload = Buffer.from(JSON.stringify(session)).toString("base64url");
    const signature = sign(payload, secret);
    return serializeCookie("switchboard_session", `${payload}.${signature}`, isProduction, sessionLifetimeSeconds);
  },

  read(requestCookie: string | undefined, secret: string): AdminSession | null {
    const token = parseCookie(requestCookie, "switchboard_session");
    if (!token) {
      return null;
    }

    const [payload, signature] = token.split(".");
    if (!payload || !signature || !timingSafeEqual(signature, sign(payload, secret))) {
      return null;
    }

    try {
      const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as AdminSession;
      if (!session.username || !Number.isFinite(session.expiresAt) || session.expiresAt <= Date.now()) {
        return null;
      }

      return session;
    } catch {
      return null;
    }
  },
};

function parseCookie(header: string | undefined, name: string) {
  if (!header) {
    return null;
  }

  const prefix = `${name}=`;
  return header
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix))
    ?.slice(prefix.length) ?? null;
}

function serializeCookie(name: string, value: string, isProduction: boolean, maxAgeSeconds: number) {
  return [
    `${name}=${value}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${maxAgeSeconds}`,
    ...(isProduction ? ["Secure"] : []),
  ].join("; ");
}

function sign(value: string, secret: string) {
  return crypto.createHmac("sha256", secret).update(value).digest("base64url");
}

function timingSafeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer);
}
