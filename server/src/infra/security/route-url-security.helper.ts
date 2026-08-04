import { lookup } from "node:dns/promises";
import net from "node:net";

export const RouteUrlSecurityHelper = {
  async assertAllowed(value: string, allowInternalTargets: boolean): Promise<URL> {
    let url: URL;

    try {
      url = new URL(value);
    } catch {
      throw new RouteUrlSecurityError("Route URL must be a valid absolute URL");
    }

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      throw new RouteUrlSecurityError("Route URL must use HTTP or HTTPS");
    }

    if (url.username || url.password) {
      throw new RouteUrlSecurityError("Route URL must not contain embedded credentials");
    }

    if (allowInternalTargets) {
      return url;
    }

    if (url.hostname === "localhost" || url.hostname.endsWith(".localhost")) {
      throw new RouteUrlSecurityError("Route URL targets a blocked internal address");
    }

    const addresses = net.isIP(url.hostname) ? [{ address: url.hostname }] : await resolve(url.hostname);
    if (addresses.some(({ address }) => isBlockedAddress(address))) {
      throw new RouteUrlSecurityError("Route URL targets a blocked internal address");
    }

    return url;
  },
};

export class RouteUrlSecurityError extends Error {}

async function resolve(hostname: string) {
  try {
    const addresses = await lookup(hostname, { all: true, verbatim: true });
    if (addresses.length === 0) {
      throw new Error("No addresses found");
    }

    return addresses;
  } catch {
    throw new RouteUrlSecurityError("Route hostname could not be resolved");
  }
}

function isBlockedAddress(address: string) {
  const normalizedAddress = address.toLowerCase();
  if (net.isIPv4(normalizedAddress)) {
    const [first, second] = normalizedAddress.split(".").map(Number);
    return (
      first === 0 ||
      first === 10 ||
      first === 127 ||
      (first === 100 && second >= 64 && second <= 127) ||
      (first === 169 && second === 254) ||
      (first === 172 && second >= 16 && second <= 31) ||
      (first === 192 && second === 168) ||
      (first === 198 && (second === 18 || second === 19)) ||
      first >= 224
    );
  }

  const ipv4MappedAddress = normalizedAddress.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/)?.[1];
  if (ipv4MappedAddress) {
    return isBlockedAddress(ipv4MappedAddress);
  }

  return normalizedAddress === "::" || normalizedAddress === "::1" || normalizedAddress.startsWith("fc") || normalizedAddress.startsWith("fd") || normalizedAddress.startsWith("fe80:");
}
