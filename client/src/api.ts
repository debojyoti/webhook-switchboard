import type { Delivery, Endpoint, Event, Route } from "@contract/api.contract";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api${path}`, {
    credentials: "same-origin",
    headers: { "Content-Type": "application/json", ...init?.headers },
    ...init,
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: { message?: string } } | null;
    throw new Error(body?.error?.message ?? `Request failed (${response.status})`);
  }
  return response.status === 204 ? (undefined as T) : (response.json() as Promise<T>);
}

export const Api = {
  createEndpoint(name: string) { return request<{ endpoint: Endpoint }>("/endpoints", { method: "POST", body: JSON.stringify({ name }) }); },
  createRoute(endpointId: string, url: string, customHeaders: Array<{ name: string; value: string }>) { return request<{ route: Route }>(`/endpoints/${endpointId}/routes`, { method: "POST", body: JSON.stringify({ url, customHeaders }) }); },
  endpoints() { return request<{ endpoints: Endpoint[] }>("/endpoints"); },
  events() { return request<{ events: Event[] }>("/events"); },
  login(username: string, password: string) { return request<{ authenticated: boolean }>("/auth/login", { method: "POST", body: JSON.stringify({ username, password }) }); },
  logout() { return request<void>("/auth/logout", { method: "POST" }); },
  routes(endpointId: string) { return request<{ routes: Route[] }>(`/endpoints/${endpointId}/routes`); },
  session() { return request<{ authenticated: boolean; username: string | null }>("/auth/session"); },
  toggleRoute(route: Route) { return request<{ route: Route }>(`/routes/${route.id}`, { method: "PATCH", body: JSON.stringify({ enabled: !route.enabled }) }); },
  deliveries() { return request<{ deliveries: Delivery[] }>("/deliveries"); },
};
