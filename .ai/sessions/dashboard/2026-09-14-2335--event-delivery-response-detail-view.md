# Event delivery response detail view

- **Date:** 2026-09-14 23:35
- **Developer:** debojyoti
- **Topic:** dashboard

## Request
User asked: while checking each incoming event in the dashboard, be able to see the
exact response and headers by clicking on them.

## What was done
(in progress — updated as work lands)

Plan approved: `deliver-event-to-route.action.ts` will start capturing destination
response headers and a size-capped (64 KB), encrypted response body on every delivery
attempt (currently discarded entirely). These are exposed through the contract,
`GET /deliveries/:deliveryId`, and new client API calls. The dashboard's Events and
Deliveries tables become clickable, opening a detail panel that shows request
headers/body for an event and, per delivery, the exact response status/headers/body.

## Notable findings
- `GET /events/:eventId` and `GET /deliveries/:deliveryId` already existed server-side
  but were unused by the client — no detail view existed in the UI at all before this
  session.
- Delivery response bodies/headers were never read from `fetch()` — only
  `response.status` was kept; this had to be added from scratch, following the same
  redact-then-encrypt pattern already used for inbound event headers/bodies
  (`HeaderSecurityHelper`, `EncryptionHelper`).
- No existing env var governs response body size; capped at 64 KB via a local
  constant rather than adding new configuration, per repo's "avoid unnecessary
  config" guidance.

## Open threads
(to be filled in before session end)
