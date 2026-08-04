# Plan webhook routing platform

- **Date:** 2026-07-30 21:35
- **Developer:** Codex
- **Topic:** foundation

## Request
Plan an open-source MERN monorepo named Switchboard: a control plane and middleware for receiving third-party webhooks, configuring multiple routes per endpoint, and inspecting event and delivery logs.

## What was done
Read repository instructions and memory guidance. Confirmed this is an empty scaffold with no prior decisions or implementation. Captured the approved v1 product scope: manual registration of generated provider-neutral URLs, one-shot transparent HTTP delivery to enabled routes, delivery and event observability, environment-configured single-admin access, optional local Docker Compose, and MIT licensing. The deployment model is one Node application: Vite builds the React frontend and Express serves that build plus the API in production, using an external MongoDB connection string. Incoming events will be stored before a 202 response; deliveries run separately in-process with a future queue seam. Secret-bearing headers are irreversibly redacted before storage, body retention is configurable, and private route targets are blocked by default. No application code had been written before implementation approval.

The approved implementation started with the single-app foundation. Added root scripts for concurrent Vite and Express development, production client/server builds, and Express startup; created Vite proxy/static-serving scaffolding, runtime environment validation, MongoDB bootstrap, structured logger, optional MongoDB-only Docker Compose, baseline React screen, MIT license, and lint/test/type-check tooling. Lint, type-checking, production build, and the currently empty test suite pass.

Defined the canonical frontend-owned API contract and a byte-identical API mirror. The contract includes authenticated management routes, public webhook ingestion, pagination, Event/Delivery views, and their zod schemas. Added a build-time synchronization check. Contract sync, lint, type-checking, production build, and the current test suite pass.

Implemented administrator cookie sessions; Endpoint and Route management APIs; AES-256-GCM encryption of custom Route headers; safe HTTP(S) Route validation that blocks internal addresses unless explicitly allowed; raw webhook acceptance; permanent sensitive-header redaction; encrypted separately retained Event bodies; immediate 202 acknowledgement; one-shot in-process delivery with a 10-second timeout; Event and Delivery APIs; TTL indexes; and the compact single-origin React dashboard. Added DigitalOcean/local-run documentation and MIT licensing.

Rebuilt the dashboard visual system after approval: premium graphite/emerald dark tokens, dense VS Code-style top bar/activity rail/explorer/workbench/inspector shell, stronger Endpoint and Route workbench, add-Route dialog, log tables, status badges, responsive behavior, and toast feedback. The existing API behavior remains unchanged. Lint, type checks, tests, and production build pass after the UI work.

## Notable findings
The repository requires an approved, concrete plan before implementation and records only user-confirmed business decisions in decision memory.

Docker Compose MongoDB became available after implementation. A live production-mode smoke test passed: administrator login, Endpoint creation, Route creation, public webhook receipt, immediate 202 acknowledgement, permanent Authorization-header redaction in the Event log, and a successful 200 Delivery to an external test receiver. The temporary Switchboard process was stopped; the local MongoDB Compose service remains running.

`npm audit --omit=dev --audit-level=high` reported no production dependency vulnerabilities.

## Open threads
Future product work includes a durable queue/retry implementation, provider signature verification, filtering, transformations, throttling, and load balancing.
