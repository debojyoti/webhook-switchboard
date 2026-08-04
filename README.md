# Switchboard

Switchboard is a small, self-hosted webhook control plane. Generate a stable public URL, register it with any third-party provider, then fan each request out once to enabled HTTP(S) routes while inspecting inbound Events and outbound Deliveries.

## V1 boundaries

- Provider-neutral public webhook URLs; register them manually with third parties.
- One in-process delivery attempt per enabled Route, with a 10-second timeout.
- A webhook receives `202 Accepted` after its Event is stored; downstream delivery continues in-process.
- No retries, queues, throttling, transformations, filtering, provider signature verification, or load balancing yet.
- Routes targeting loopback, private, and link-local addresses are blocked unless `ALLOW_INTERNAL_ROUTE_TARGETS=true`.

## Run locally

1. Copy `.env.example` to `.env` and set real secrets. Generate the encryption key with `openssl rand -base64 32`.
2. Point `MONGODB_URI` to a running MongoDB instance.
3. Install and run:

   ```sh
   npm install
   npm run dev
   ```

Vite runs the developer UI at `http://localhost:5173`; it proxies API and webhook requests to Express at `http://localhost:3000`.

Docker is optional. To run only a local MongoDB dependency:

```sh
docker compose up -d mongodb
```

## Production and DigitalOcean App Platform

The app is one Node process. Vite builds the client, and Express serves the compiled UI, API, and public webhook paths from the same origin.

```sh
npm run build
npm start
```

For DigitalOcean App Platform, set the build command to `npm ci && npm run build` and run command to `npm start`. Configure `MONGODB_URI` with the external MongoDB connection string and set:

- `PUBLIC_BASE_URL` — public HTTPS application URL used in generated webhook URLs.
- `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `AUTH_SESSION_SECRET`.
- `APP_ENCRYPTION_KEY` — base64-encoded 32-byte AES-256-GCM key.
- `ALLOW_INTERNAL_ROUTE_TARGETS=false` (recommended).
- `EVENT_RETENTION_DAYS=30`, `DELIVERY_RETENTION_DAYS=30`, `EVENT_BODY_RETENTION_DAYS=30`.
- `MAX_WEBHOOK_BODY_BYTES=5242880`.

Use `GET /healthz` for the platform health check. Express reads the platform `PORT` variable automatically.

## Data handling

Events and Deliveries expire after 30 days by default using MongoDB TTL indexes. Event bodies are encrypted separately so `EVENT_BODY_RETENTION_DAYS` can differ from Event metadata retention. Credential-bearing headers are permanently redacted before Event storage; raw values remain only in memory long enough to forward the current request.

Custom Route header values and stored Event bodies are AES-256-GCM encrypted with `APP_ENCRYPTION_KEY`.

## API contract

The canonical zod API schemas live in `client/contract/`. `server/contract/` is a byte-identical mirror. Run `npm run contract:check` to verify the mirror before build or release.

## Checks

```sh
npm run lint
npm run typecheck
npm test
npm run build
```

## License

[MIT](LICENSE)
