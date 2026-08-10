# apk2sdk

Clean, unofficial TypeScript SDKs maintained from Android APKs.

This repository ships typed clients for private mobile APIs. Authentication is
intentionally out of scope: callers provide a `fetch` implementation that
already applies whatever session, token, cookie, or refresh behavior they need.

```bash
bun install
bun run check
```

## Packages

| Package | Status |
| --- | --- |
| `@mergd/beli` | Initial read-oriented SDK |
| `@mergd/eight-sleep` | Pod controls, sleep data, alarms, devices, and household data |

## Updating from an APK

Target-specific AI instructions live under `targets/`. Unpack the new APK
locally and follow the target's `update.md`. APKs and unpacked application
bundles are not committed.

## Disclaimer

Unofficial hobby project. Not affiliated with Beli, Eight Sleep, or Google.
Private APIs can change without notice.
