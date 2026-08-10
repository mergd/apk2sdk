# apk2sdk

Clean, unofficial TypeScript SDKs maintained from Android APKs.

This repository currently ships [`@mergd/beli`](packages/beli), a typed client
for Beli's private mobile API. Authentication is intentionally out of scope:
callers provide a `fetch` implementation that already applies whatever session,
token, cookie, or refresh behavior they need.

```bash
bun install
bun run check
```

## Packages

| Package | Status |
| --- | --- |
| `@mergd/beli` | Initial read-oriented SDK |
| `@mergd/eight-sleep` | Planned |

## Updating from an APK

Target-specific AI instructions live under `targets/`. For Beli, unpack the
new APK locally and follow [`targets/beli/update.md`](targets/beli/update.md).
APKs and unpacked application bundles are not committed.

## Disclaimer

Unofficial hobby project. Not affiliated with Beli, Eight Sleep, or Google.
Private APIs can change without notice.
