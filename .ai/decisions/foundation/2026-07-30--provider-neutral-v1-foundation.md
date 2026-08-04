# Provider-neutral v1 foundation

- **Date:** 2026-07-30
- **Decided by:** Project owner
- **Topic:** foundation

## Decision
The first public release of Switchboard will be a small, provider-neutral webhook routing service. It generates public webhook URLs for users to register manually with third-party services. Each endpoint can have multiple HTTP or HTTPS routes, and every enabled route receives one forwarding attempt for each incoming request.

The initial release will include delivery outcomes and incoming-event logs, a compact developer-focused control panel, single-organization access using one environment-configured administrator username and password, Docker Compose for local startup, and an MIT license.

Incoming events and delivery logs will be retained for 30 days initially. The interface will mask common secret-bearing headers. The product will retain the ability to add provider-specific signature verification later, but will not verify signatures in the first release.

## Why
The project needs a reliable foundation for clients that register webhooks with many third-party services, without prematurely adding provider integrations, retries, queueing, throttling, filtering, transformations, or load balancing.

## Supersedes / relates to
Initial product decision for the public Switchboard project.

---

## Single deployable application

### Decision
Switchboard will be deployed as one Node application. React and Vite remain in the repository for frontend development and production builds, but Express will serve the built frontend and API from the same process and origin in production. Docker Compose is optional for local development only; deployment must work directly with an externally supplied `MONGODB_URI`, including on DigitalOcean App Platform.

### Why
The initial release should be simple to deploy and operate on DigitalOcean App Platform, without requiring separate frontend/backend services or a Docker-based runtime.

### Supersedes / relates to
Builds on the provider-neutral v1 foundation decision above.

---

## Asynchronous v1 delivery and secure request retention

### Decision
Switchboard will persist an incoming event before immediately returning HTTP 202 to the webhook sender. Delivery to enabled routes will then run in-process in v1, with no external queue. Ingestion and delivery handling must remain separate so a queue-backed delivery mechanism can be introduced later.

Known secret-bearing request headers will be permanently redacted before event storage. Request bodies are retained initially but body retention must be configurable because bodies may contain sensitive data. The default event and delivery retention is 30 days.

Route destinations resolving to loopback, private, or link-local addresses will be rejected by default. A clearly named environment variable may opt trusted self-hosted deployments into internal destinations.

### Why
Webhook providers should receive a fast acknowledgement without waiting for downstream destinations. The first release should avoid operating queue infrastructure while preserving a clean future migration path. Permanent secret redaction and secure route-target defaults reduce the risk of retaining credentials or using the service to access internal network resources.

### Supersedes / relates to
Builds on the provider-neutral v1 foundation decision above.
