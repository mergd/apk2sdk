# @mergd/butterflymx

Unofficial, typed TypeScript SDK for ButterflyMX's door / building API.

Derived from ButterflyMX **1.63.0** (`com.butterflymx.butterflymx`, versionCode `1914136311`) via APKPure, cross-checked with the public API docs.

```bash
npm install @mergd/butterflymx
```

Authentication is deliberately out of scope. Supply a `fetch` implementation that
already adds a valid bearer token (and handles OAuth refresh if needed):

```ts
import { ButterflyMxClient } from "@mergd/butterflymx";

const client = new ButterflyMxClient({
  env: "production",
  fetch: async (input, init) => {
    const headers = new Headers(init?.headers);
    headers.set("Authorization", `Bearer ${await getAccessToken()}`);
    return fetch(input, { ...init, headers });
  },
});

const tenants = await client.tenants.list();
const tenant = tenants[0];
if (tenant) {
  const points = await client.accessPoints.list({ buildingId: tenant.building_id });
  const front = points[0];
  if (front) {
    await client.doors.release({
      tenantId: tenant.id,
      accessPointId: front.id,
    });
  }
}
```

## API

- `tenants.list()` / `tenants.get(id)`
- `buildings.list()` / `buildings.get(id)`
- `accessPoints.list({ buildingId })` / `accessPoints.get(id)`
- `devices.list({ buildingId })` / `devices.get(id)`
- `doors.release({ tenantId, accessPointId | deviceId })`
- `request(path, options)` for other `/v4/...` endpoints

Hosts:

- production: `https://api.butterflymx.com`
- sandbox: `https://api.na.sandbox.butterflymx.com` (`env: "sandbox"`)

This package does not include OAuth authorize/token exchange, client credentials,
token storage, refresh, retries, or rate-limit policy. Private and partner APIs
can change without notice. Not affiliated with ButterflyMX.
