# Update the Segway SDK from a newer APK

You are updating the unofficial `@mergd/segway` TypeScript SDK from an unpacked
Segway Mobility / Ninebot Android APK.

## Work

1. Fetch the APK from **APKPure** (see root `AGENTS.md`). Confirm the Android
   package is `com.ninebot.segway` and record `appVersion` / `versionCode` in
   `target.json`, `SOURCE_APP`, and the README.
2. Prefer plaintext assets over the NetEase-packed DEX: read `assets/Server.json`
   and `assets/JavaApiList.json` first. Only dig into DEX / RN bundles when those
   assets are insufficient.
3. Inventory changed hosts, methods, paths, request bodies, and response fields
   for vehicle bind / my-vehicle / vehicle-basic-info / ident.
4. Compare with `packages/segway/src/` and promote only useful, well-supported
   operations. Keep `request` as the escape hatch.
5. Authentication is out of scope. Note Passport / OMS auth changes, but do not
   add login, refresh, credential storage, or extracted client secrets.
6. Do not implement BLE framing here — cloud only.
7. Add focused fixture tests and update the README for public changes.

## Rules

- Do not commit APKs, unpacked bundles, credentials, tokens, or personal data.
- Do not guess write payloads from path names alone.
- Keep retries, caching, throttling, and authentication policy caller-owned.
- Preserve backwards compatibility when practical.

## Validation

```bash
bun run check
bun run pack:segway
```

Inspect the tarball and report the source app version, API changes, tests, and
any uncertain endpoints.
