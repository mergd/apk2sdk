# @mergd/eight-sleep

Unofficial, typed TypeScript SDK for Eight Sleep's private mobile API.

Derived from Eight Sleep **7.51.2** (`com.eightsleep.eight`, versionCode `1007051002`) via APKPure.

```bash
npm install @mergd/eight-sleep
```

Authentication is deliberately out of scope. Supply a `fetch` implementation
that already adds a valid bearer token (and handles refresh if needed):

```ts
import { EightSleepClient } from "@mergd/eight-sleep";

const client = new EightSleepClient({
  fetch: async (input, init) => {
    const headers = new Headers(init?.headers);
    headers.set("Authorization", `Bearer ${await getAccessToken()}`);
    return fetch(input, { ...init, headers });
  },
});

const me = await client.users.current();
const status = await client.temperature.status(me.userId);
const trends = await client.sleep.trends({
  userId: me.userId,
  from: "2026-08-01",
  to: "2026-08-07",
  timeZone: "America/Los_Angeles",
});
```

## API

- `users.current()` and `users.get(userId)`
- `devices.get(deviceId)`, `devices.peripherals(deviceId)`, and `devices.online(deviceId)`
- `temperature.status(userId)`, `setPower(userId, on)`, and `setLevel(userId, level)`
- `sleep.trends(input)` and `sleep.intervals(userId, sessionId)`
- alarm list/create/update/delete, snooze, and dismiss
- household summary, schedule, current set, and guests
- `request(path, options)` for unwrapped client/app API endpoints

Temperature levels use Eight Sleep's `-100..100` scale. `setLevel` puts the
side in smart mode first by default; pass `{ ensureSmart: false }` to send only
the level update.

This package does not include login, OAuth client credentials, token storage,
refresh, retries, caching, or rate-limit policy. Private APIs can change without
notice. Not affiliated with Eight Sleep.
