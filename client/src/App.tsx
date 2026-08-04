import { FormEvent, useEffect, useMemo, useState } from "react";
import type { Delivery, Endpoint, Event, Route } from "@contract/api.contract";
import { Api } from "./api.js";

type View = "endpoints" | "events" | "deliveries";
type Toast = { tone: "error" | "success"; message: string } | null;

export function App() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [activeView, setActiveView] = useState<View>("endpoints");
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [selectedEndpoint, setSelectedEndpoint] = useState<Endpoint | null>(null);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState<Toast>(null);
  const [isRouteFormOpen, setRouteFormOpen] = useState(false);

  useEffect(() => { void Api.session().then((value) => setAuthenticated(value.authenticated)).catch(() => setAuthenticated(false)); }, []);
  // Initial data loading intentionally happens only after authentication changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (authenticated) void refresh(); }, [authenticated]);
  // Route loading is triggered solely by the selected Endpoint identity.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (selectedEndpoint) void loadRoutes(selectedEndpoint.id); }, [selectedEndpoint]);

  const filteredEndpoints = useMemo(
    () => endpoints.filter((endpoint) => endpoint.name.toLowerCase().includes(search.toLowerCase())),
    [endpoints, search],
  );

  async function refresh() {
    try {
      const [endpointResult, eventResult, deliveryResult] = await Promise.all([Api.endpoints(), Api.events(), Api.deliveries()]);
      setEndpoints(endpointResult.endpoints);
      setEvents(eventResult.events);
      setDeliveries(deliveryResult.deliveries);
      setSelectedEndpoint((current) => endpointResult.endpoints.find((endpoint) => endpoint.id === current?.id) ?? endpointResult.endpoints[0] ?? null);
    } catch (reason) { notify("error", messageFrom(reason)); }
  }
  async function loadRoutes(endpointId: string) {
    try { setRoutes((await Api.routes(endpointId)).routes); } catch (reason) { notify("error", messageFrom(reason)); }
  }
  function notify(tone: NonNullable<Toast>["tone"], message: string) {
    setToast({ tone, message });
    window.setTimeout(() => setToast(null), 3600);
  }
  if (authenticated === null) return <LoadingScreen />;
  if (!authenticated) return <Login onSuccess={() => setAuthenticated(true)} onError={(reason) => notify("error", messageFrom(reason))} toast={toast} />;

  return <div className="app-frame">
    <header className="topbar">
      <div className="brand"><span className="brand-mark">S</span><span>Switchboard</span><span className="environment">LOCAL</span></div>
      <div className="command-center"><span>⌘</span><span>Search workspace</span><kbd>⌘ K</kbd></div>
      <div className="topbar-actions"><span className="online-dot" /> <span className="muted">Connected</span><button className="avatar" onClick={() => void Api.logout().then(() => setAuthenticated(false))}>AD</button></div>
    </header>
    <div className="app-body">
      <nav className="activity-rail" aria-label="Primary navigation">
        <RailButton icon="⌘" label="Endpoints" active={activeView === "endpoints"} onClick={() => setActiveView("endpoints")} />
        <RailButton icon="↧" label="Events" active={activeView === "events"} onClick={() => setActiveView("events")} />
        <RailButton icon="⇢" label="Deliveries" active={activeView === "deliveries"} onClick={() => setActiveView("deliveries")} />
        <div className="rail-spacer" /><RailButton icon="⚙" label="Settings" onClick={() => notify("success", "Settings are environment-managed in v1.")} />
      </nav>
      <aside className="explorer-panel">
        <div className="explorer-heading"><span>EXPLORER</span><button className="icon-button" title="Refresh" onClick={() => void refresh()}>↻</button></div>
        <div className="workspace-label"><span className="chevron">⌄</span> WORKSPACE</div>
        <div className="search-box"><span>⌕</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Find endpoint" /></div>
        <button className="new-endpoint" onClick={() => {
          const name = window.prompt("Endpoint name");
          if (!name?.trim()) return;
          void Api.createEndpoint(name.trim()).then(async ({ endpoint }) => { await refresh(); setSelectedEndpoint(endpoint); notify("success", "Endpoint created"); }).catch((reason) => notify("error", messageFrom(reason)));
        }}>+ New endpoint</button>
        <div className="endpoint-list">{filteredEndpoints.map((endpoint) => <button className={`endpoint-item ${selectedEndpoint?.id === endpoint.id ? "is-active" : ""}`} key={endpoint.id} onClick={() => { setSelectedEndpoint(endpoint); setActiveView("endpoints"); }}><span className="endpoint-glyph">◎</span><span className="endpoint-copy"><strong>{endpoint.name}</strong><small>{endpoint.routeCount} active route{endpoint.routeCount === 1 ? "" : "s"}</small></span><span className="item-chevron">›</span></button>)}</div>
        <div className="explorer-footer"><span className="muted">{endpoints.length} endpoints</span><span className="muted">v0.1.0</span></div>
      </aside>
      <main className="workbench">
        <div className="tab-strip"><span className="tab is-open"><span className="tab-dot" /> {activeView === "endpoints" ? selectedEndpoint?.name ?? "New endpoint" : activeView === "events" ? "Incoming events" : "Deliveries"}<button>×</button></span></div>
        {activeView === "endpoints" ? <EndpointWorkbench endpoint={selectedEndpoint} routes={routes} onOpenRouteForm={() => setRouteFormOpen(true)} onToggleRoute={async (route) => { try { const result = await Api.toggleRoute(route); setRoutes((current) => current.map((item) => item.id === route.id ? result.route : item)); notify("success", `Route ${result.route.enabled ? "enabled" : "disabled"}`); } catch (reason) { notify("error", messageFrom(reason)); } }} /> : <LogWorkbench view={activeView} events={events} deliveries={deliveries} />}
      </main>
      <aside className="inspector-panel"><Inspector activeView={activeView} endpoint={selectedEndpoint} events={events} deliveries={deliveries} /></aside>
    </div>
    {isRouteFormOpen && selectedEndpoint && <RouteDialog endpoint={selectedEndpoint} onClose={() => setRouteFormOpen(false)} onCreate={async (url, headerName, headerValue) => { try { await Api.createRoute(selectedEndpoint.id, url, headerName ? [{ name: headerName, value: headerValue }] : []); await loadRoutes(selectedEndpoint.id); await refresh(); setRouteFormOpen(false); notify("success", "Route added"); } catch (reason) { notify("error", messageFrom(reason)); } }} />}
    {toast && <div className={`toast ${toast.tone}`}>{toast.tone === "success" ? "✓" : "!"} {toast.message}</div>}
  </div>;
}

function EndpointWorkbench({ endpoint, routes, onOpenRouteForm, onToggleRoute }: { endpoint: Endpoint | null; routes: Route[]; onOpenRouteForm: () => void; onToggleRoute: (route: Route) => void }) {
  if (!endpoint) return <section className="empty-workbench"><span className="empty-glyph">◎</span><h1>Create your first Endpoint</h1><p>Generate one secure public URL, then point third-party services at it.</p></section>;
  const enabled = routes.filter((route) => route.enabled).length;
  return <section className="workbench-content"><div className="page-header"><div><p className="eyebrow">ENDPOINT</p><h1>{endpoint.name}</h1><p className="subtle">Routes and observability for this incoming webhook URL.</p></div><button className="primary-button" onClick={onOpenRouteForm}>+ Add route</button></div><div className="metric-row"><Metric label="Enabled routes" value={String(enabled)} hint={`${routes.length} total configured`} /><Metric label="Delivery model" value="Fan-out" hint="One attempt per route" /><Metric label="Retention" value="30 days" hint="Events & delivery history" /></div><section className="surface public-url-card"><div><p className="section-kicker">PUBLIC WEBHOOK URL</p><code>{endpoint.publicUrl}</code></div><button onClick={() => void navigator.clipboard.writeText(endpoint.publicUrl)}>Copy URL</button></section><section className="routes-section"><div className="section-heading"><div><h2>Routes</h2><p>Enabled routes receive every inbound request.</p></div><span className="count-badge">{routes.length}</span></div><div className="data-table"><div className="table-head"><span>Status</span><span>Destination</span><span>Custom headers</span><span /></div>{routes.length ? routes.map((route) => <div className="table-row" key={route.id}><span><button className={`switch ${route.enabled ? "is-on" : ""}`} onClick={() => onToggleRoute(route)} aria-label="Toggle route"><i /></button></span><code>{route.url}</code><span className="header-count">{route.customHeaders.length ? `${route.customHeaders.length} configured` : "—"}</span><button className="row-action" onClick={() => onToggleRoute(route)}>{route.enabled ? "Disable" : "Enable"}</button></div>) : <div className="table-empty">No routes yet. Add a destination to begin forwarding.</div>}</div></section></section>;
}

function LogWorkbench({ view, events, deliveries }: { view: "events" | "deliveries"; events: Event[]; deliveries: Delivery[] }) {
  const isEvents = view === "events"; const rows = isEvents ? events : deliveries;
  return <section className="workbench-content"><div className="page-header"><div><p className="eyebrow">OBSERVABILITY</p><h1>{isEvents ? "Incoming events" : "Deliveries"}</h1><p className="subtle">Most recent activity across every Endpoint.</p></div><button className="ghost-button">Filter</button></div><div className="log-toolbar"><span className="live-indicator"><i /> Live stream</span><span className="muted">Last 30 days</span><input placeholder="Filter results" /></div><div className="data-table log-table">{isEvents ? <><div className="table-head"><span>Method</span><span>Endpoint</span><span>Payload</span><span>Received</span></div>{(rows as Event[]).map((event) => <div className="table-row" key={event.id}><span><b className="method-badge">{event.method}</b></span><span>{event.endpointName}</span><span className="muted">{event.bodySizeBytes.toLocaleString()} B · {event.bodyContentType ?? "unknown"}</span><time>{relativeTime(event.receivedAt)}</time></div>)}</> : <><div className="table-head"><span>Result</span><span>Destination</span><span>Response</span><span>Duration</span></div>{(rows as Delivery[]).map((delivery) => <div className="table-row" key={delivery.id}><span><b className={`outcome-badge ${delivery.outcome}`}>{delivery.outcome.replace("_", " ")}</b></span><code>{delivery.routeUrl}</code><span>{delivery.responseStatus ?? delivery.errorMessage ?? "—"}</span><time>{delivery.durationMs} ms</time></div>)}</>}{!rows.length && <div className="table-empty">Nothing to show yet.</div>}</div></section>;
}

function Inspector({ activeView, endpoint, events, deliveries }: { activeView: View; endpoint: Endpoint | null; events: Event[]; deliveries: Delivery[] }) {
  const latest = activeView === "events" ? events[0] : activeView === "deliveries" ? deliveries[0] : null;
  return <div className="inspector"><div className="inspector-heading">INSPECTOR</div>{activeView === "endpoints" && endpoint ? <><p className="section-kicker">ENDPOINT STATUS</p><div className="health-card"><span className="online-dot" /><div><strong>Ready to receive</strong><small>Public URL is active</small></div></div><dl><dt>Created</dt><dd>{new Date(endpoint.createdAt).toLocaleDateString()}</dd><dt>Last updated</dt><dd>{new Date(endpoint.updatedAt).toLocaleDateString()}</dd></dl><div className="notice"><b>Secure by default</b><span>Known credential headers are redacted before Events are stored.</span></div></> : latest ? <><p className="section-kicker">LATEST {activeView === "events" ? "EVENT" : "DELIVERY"}</p><div className="latest-card"><strong>{activeView === "events" ? (latest as Event).endpointName : (latest as Delivery).outcome}</strong><span>{activeView === "events" ? (latest as Event).method : (latest as Delivery).routeUrl}</span></div><dl><dt>Recorded</dt><dd>{activeView === "events" ? relativeTime((latest as Event).receivedAt) : relativeTime((latest as Delivery).attemptedAt)}</dd><dt>Retention</dt><dd>30 days</dd></dl></> : <div className="inspector-empty">Select an item to inspect its metadata.</div>}</div>;
}

function RouteDialog({ endpoint, onClose, onCreate }: { endpoint: Endpoint; onClose: () => void; onCreate: (url: string, headerName: string, headerValue: string) => void }) { return <div className="dialog-backdrop" role="presentation"><form className="dialog" onSubmit={(event) => { event.preventDefault(); const data = new FormData(event.currentTarget); onCreate(String(data.get("url")), String(data.get("headerName") ?? ""), String(data.get("headerValue") ?? "")); }}><div className="dialog-heading"><div><p className="eyebrow">NEW ROUTE</p><h2>{endpoint.name}</h2></div><button type="button" className="icon-button" onClick={onClose}>×</button></div><label>Destination URL<input name="url" type="url" required placeholder="https://api.example.com/webhooks" autoFocus /></label><div className="form-divider">Optional request header</div><label>Header name<input name="headerName" placeholder="X-Webhook-Key" /></label><label>Header value<input name="headerValue" placeholder="Stored encrypted" /></label><div className="dialog-actions"><button type="button" className="ghost-button" onClick={onClose}>Cancel</button><button className="primary-button">Add route</button></div></form></div>; }
function Login({ onSuccess, onError, toast }: { onSuccess: () => void; onError: (reason: unknown) => void; toast: Toast }) { return <main className="login-screen"><form className="login-card" onSubmit={async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const data = new FormData(event.currentTarget); try { await Api.login(String(data.get("username")), String(data.get("password"))); onSuccess(); } catch (reason) { onError(reason); } }}><span className="brand-mark large">S</span><p className="eyebrow">SWITCHBOARD</p><h1>Webhook control plane</h1><p>Sign in to manage your Endpoint workspace.</p><label>Username<input name="username" autoComplete="username" /></label><label>Password<input name="password" type="password" autoComplete="current-password" /></label><button className="primary-button">Sign in</button>{toast?.tone === "error" && <div className="login-error">{toast.message}</div>}</form></main>; }
function RailButton({ icon, label, active, onClick }: { icon: string; label: string; active?: boolean; onClick: () => void }) { return <button className={`rail-button ${active ? "is-active" : ""}`} onClick={onClick} title={label}><span>{icon}</span></button>; }
function Metric({ label, value, hint }: { label: string; value: string; hint: string }) { return <div className="metric"><span>{label}</span><strong>{value}</strong><small>{hint}</small></div>; }
function LoadingScreen() { return <main className="loading-screen"><span className="brand-mark large">S</span><p>Connecting to workspace…</p></main>; }
function messageFrom(reason: unknown) { return reason instanceof Error ? reason.message : "Unexpected error"; }
function relativeTime(value: string) { const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000)); return seconds < 60 ? "just now" : seconds < 3600 ? `${Math.floor(seconds / 60)}m ago` : `${Math.floor(seconds / 3600)}h ago`; }
