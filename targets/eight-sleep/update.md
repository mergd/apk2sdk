# Update the Eight Sleep SDK from a newer APK

You are updating the unofficial `@mergd/eight-sleep` TypeScript SDK from an
unpacked Eight Sleep Android APK.

## Work

1. Confirm the Android package is `com.eightsleep.eight` and record the app version.
2. Decompile DEX bytecode and inspect native strings where needed. Search for
   `8slp.net`, endpoint paths, HTTP annotations, serializers, and request models.
3. Build an inventory of changed hosts, methods, paths, query parameters,
   request bodies, and response fields. Validate shapes at call sites.
4. Compare the inventory with `packages/eight-sleep/src/` and promote only
   useful, well-supported operations into the resource API. The low-level
   `request` method is the escape hatch for the rest.
5. Authentication is out of scope. Note auth changes, but do not add login,
   refresh, credential storage, or extracted client credentials.
6. Add focused fixture tests and update the README for public changes.

## Rules

- Do not commit APKs, unpacked bundles, credentials, tokens, or personal data.
- Do not make live device-control calls while validating the SDK.
- Do not guess write payloads from path names alone.
- Keep retries, caching, throttling, and authentication policy caller-owned.
- Preserve backwards compatibility when practical.

## Validation

```bash
bun run check
bun run pack:eight-sleep
```

Inspect the tarball and report the source app version, API changes, tests, and
any uncertain endpoints.
