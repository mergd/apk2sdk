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

| Package | Source app | Status |
| --- | --- | --- |
| `@mergd/beli` | Beli 9.9.0 | Initial read-oriented SDK |
| `@mergd/eight-sleep` | Eight Sleep 7.51.2 | Pod controls, sleep data, alarms, devices, and household data |
| `@mergd/segway` | Segway Mobility 6.10.8 | Vehicle list + BLE command `ident` from Segway Mobility cloud |
| `@mergd/butterflymx` | ButterflyMX 1.63.0 | Tenants, buildings, access points, devices, and door release |

## Registering a new SDK

Add `targets/<name>/` (`target.json` + `update.md`), `packages/<name>/` (typed
client + `SOURCE_APP`), workspace scripts in the root `package.json`, a row in
the packages table, and the package name in `.github/workflows/publish.yml`.
Full checklist: `AGENTS.md`.

## Publishing

`@mergd/beli` and `@mergd/eight-sleep` are already on npm. New packages go out
the same way: bump the package version, then tag `<name>@<version>` or run
**Actions → Publish**. CI authenticates with npm **trusted publishing** (OIDC),
not a stored token. Configure each package on npmjs.com with workflow
`publish.yml`, repository `mergd/apk2sdk`, environment `npm`. Details in
`AGENTS.md`.

## Updating from an APK

Fetch the Android package from **APKPure**, unpack it locally, and follow the
target's `update.md` under `targets/`. Record `appVersion` / `versionCode` in
`target.json`, `SOURCE_APP`, and the package README. See `AGENTS.md`. APKs and
unpacked application bundles are not committed.

## Disclaimer

Unofficial hobby project. Not affiliated with Beli, Eight Sleep, Segway,
Ninebot, ButterflyMX, or Google. Private APIs can change without notice.
