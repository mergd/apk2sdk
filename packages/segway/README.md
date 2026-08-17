# @mergd/segway

Unofficial, typed TypeScript SDK for Segway Mobility / Ninebot's private mobile API.

Derived from Segway Mobility **6.10.8** (`com.ninebot.segway`, versionCode `610081660`) via APKPure.

```bash
npm install @mergd/segway
```

Authentication is deliberately out of scope. Supply a `fetch` implementation that
already adds a valid session or bearer token (and handles refresh if needed):

```ts
import { SegwayClient } from "@mergd/segway";

const client = new SegwayClient({
  fetch: async (input, init) => {
    const headers = new Headers(init?.headers);
    headers.set("Authorization", `Bearer ${await getAccessToken()}`);
    return fetch(input, { ...init, headers });
  },
});

const vehicles = await client.vehicles.list();
const first = vehicles[0];
if (first?.wnumber) {
  const ident = await client.vehicles.ident({
    uid: await getUserId(),
    serial: first.wnumber,
  });
}
```

## API

- `vehicles.list()` — bound vehicles via OMS `POST /app-api/device/bind/v2/my-vehicle`
- `vehicles.basicInfo({ uid, serial })` — PHP `POST /vehicle/vehicle/vehicle-basic-info`
- `vehicles.ident({ uid, serial })` — same call, returns the 32-char hex BLE command ident
- `request(path, options)` — escape hatch (`host: "oms" | "api"`)

Default hosts match overseas production from Segway Mobility **6.10.8**
(`assets/Server.json`):

- OMS: `https://eu-oms-gateway.ninebot.com`
- API: `https://api-jhcx-v6-eu.ninebot.com`

Override with `omsBaseUrl` / `apiBaseUrl` for other regions (CN, US, etc.).

This package does not include Passport login, token storage, refresh, BLE
crypto, retries, or rate-limit policy. Private APIs can change without notice.
Not affiliated with Segway or Ninebot.
