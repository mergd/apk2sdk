# Update the Beli SDK from a newer APK

You are updating the unofficial `@mergd/beli` TypeScript SDK from an unpacked
Beli Android APK.

## Inputs

- The new APK from **APKPure** (see root `AGENTS.md`) or an unpacked APK
  directory supplied by the operator.
- The current SDK in `packages/beli/`.
- The existing Beli target configuration in `targets/beli/`.

## Work

1. Confirm the Android package is `com.beliapp.myapp` and record `appVersion` /
   `versionCode` from APKPure in `target.json`, `SOURCE_APP`, and the README.
2. Locate the Capacitor web assets and compiled Angular JavaScript bundles.
3. Search API wrapper code and call sites for changed hosts, HTTP methods,
   paths, query construction, request bodies, and consumed response fields.
4. Compare those findings with the methods and types exported by
   `packages/beli/src/`.
5. Update the SDK only where the new APK supports a concrete change. Keep the
   public resource-oriented names clean even when upstream names are awkward.
6. Authentication is out of scope. Note auth changes briefly, but do not add
   login, refresh, credential storage, or extracted secrets to the SDK.
7. Add focused tests for changed request construction and response handling.
8. Update the package README and changelog when user-visible behavior changes.

## Rules

- Do not commit the APK or unpacked application bundle.
- Do not add retries, caching, throttling, or authentication policy. Callers own
  those through the supplied `fetch` implementation.
- Do not guess missing write payloads. Leave uncertain operations out of the
  clean SDK until their call sites establish the request shape.
- Preserve backwards-compatible public methods when practical.

## Validation

Run from the repository root:

```bash
bun run check
bun run pack:beli
```

Inspect the tarball contents and report the app version, SDK changes, tests, and
anything still uncertain.
