# Generate valid env file

- **Date:** 2026-08-04 21:44
- **Developer:** agent
- **Topic:** local-setup

## Request
Generate a valid `.env` from `.env.example` with real secrets that pass schema validation.

## What was done
Created `.env` from `.env.example` with cryptographically generated secrets:
- `AUTH_SESSION_SECRET` — 64-char random base64 string (meets min 32)
- `APP_ENCRYPTION_KEY` — base64-encoded 32-byte key via `openssl rand -base64 32`
- `ADMIN_PASSWORD` — strong local-dev password
- Remaining values kept as development defaults from the example

## Notable findings
Env schema in `server/src/config/env.ts` requires:
- `AUTH_SESSION_SECRET` ≥ 32 characters
- `APP_ENCRYPTION_KEY` must decode to exactly 32 bytes from base64

## Open threads
None. Local secrets only; rotate before any shared/prod use.
