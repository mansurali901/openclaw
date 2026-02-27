# Running the Dashboard

The dashboard (Control UI) is served by the **gateway**. If you see "connection refused" at `http://127.0.0.1:18789/`, the gateway is not running.

## 1. Build (first time only)

From the repo root:

```bash
pnpm install
pnpm build
pnpm run ui:build
```

## 2. Start the gateway

**Keep this terminal open** while you use the dashboard:

```bash
pnpm run gateway
```

Or with npx:

```bash
npx pnpm run gateway
```

This starts the gateway on port **18789** (or the port in your config). The same process serves both the WebSocket API and the dashboard.

## 3. Open the dashboard

- **URL:** http://127.0.0.1:18789/
- If you use a different port (e.g. from `gateway.port` in config or `OPENCLAW_GATEWAY_PORT`), use that port instead.

To get a URL with your auth token (if configured):

```bash
pnpm run openclaw dashboard
```

Use the printed URL or paste the token into the Control UI settings.

## 4. Agent mode (Sessions)

In the dashboard sidebar, open **Sessions**. Use the **Agent mode** column to set each session to **Full**, **Minimal**, or **None** (or **inherit** for default).

---

**Dev mode (different ports):** If you run `pnpm run gateway:dev` instead, the gateway uses the dev profile and listens on **19001** (WS + HTTP). Dashboard URL is then http://127.0.0.1:19001/
