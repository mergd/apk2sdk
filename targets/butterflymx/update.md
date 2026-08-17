# Update the ButterflyMX SDK from a newer APK

You are updating the unofficial `@mergd/butterflymx` TypeScript SDK from an
unpacked ButterflyMX Android APK (and/or the public API docs).

## Work

1. Fetch the APK from **APKPure** (see root `AGENTS.md`). Confirm the Android
   package and record `appVersion` / `versionCode` in `target.json`,
   `SOURCE_APP`, and the README.
2. Cross-check hosts and `/v4/...` paths against both the APK config and
   https://apidocs.butterflymx.com/llms.txt.
3. Inventory changed methods, paths, query params, request bodies, and response
   fields for tenants, buildings, access points, devices, and door releases.
4. Compare with `packages/butterflymx/src/` and promote only useful,
   well-supported operations. Keep `request` as the escape hatch.
5. Authentication is out of scope. Note OAuth issuer / redirect changes, but do
   **not** add login, token exchange, client secrets, or credentials extracted
   from the APK.
6. Add focused fixture tests and update the README for public changes.

## Rules

- Do not commit APKs, unpacked bundles, credentials, tokens, or personal data.
- Do not ship OAuth `client_id` / `client_secret` values found in the APK.
- Do not guess write payloads from path names alone.
- Keep retries, caching, throttling, and authentication policy caller-owned.
- Preserve backwards compatibility when practical.

## Validation

```bash
bun run check
bun run pack:butterflymx
```

Inspect the tarball and report the source app version, API changes, tests, and
any uncertain endpoints.
