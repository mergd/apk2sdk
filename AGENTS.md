# Agent notes for apk2sdk

## Fetching APKs

Always pull Android packages from **[APKPure](https://apkpure.com)**, not Play Store dumps, APKMirror, random mirrors, or device pulls unless the operator explicitly overrides.

1. Resolve the target's `packageName` from `targets/<name>/target.json`.
2. Open the APKPure page for that package (search by Play package id).
3. Prefer a concrete version (`versionName` + `versionCode`) over "latest" when updating an existing SDK so diffs stay reproducible.
4. Download via APKPure's CDN (`d.apkpure.com`), e.g.  
   `https://d.apkpure.com/b/APK/<packageName>?versionCode=<code>`  
   or `/b/XAPK/...` when the listing is an XAPK.
5. Unpack locally under a gitignored path (for example `.apk2sdk/` or the operator's scratch dir). **Never commit APKs, XAPKs, or unpacked bundles.**

Record the APKPure listing URL (or package + versionCode) in the update notes / PR summary when you bump a target.

## Source-app version annotation

Every SDK must advertise which Android app build it was reverse-engineered from. Keep these in sync on every APK-driven update:

| Location | Fields |
| --- | --- |
| `targets/<name>/target.json` | `packageName`, `appVersion` (versionName), `versionCode`, optional `apkpureUrl` |
| `packages/<name>/src/source-app.ts` | exported `SOURCE_APP` constant |
| `packages/<name>/README.md` | one-line "Derived from …" under the title |
| Root `README.md` packages table | versionName column |

`SOURCE_APP` shape:

```ts
export const SOURCE_APP = {
  packageName: "com.example.app",
  versionName: "1.2.3",
  versionCode: 123,
  /** APKPure page or CDN URL used for this derivation. */
  apkpureUrl: "https://apkpure.com/…",
} as const;
```

Use `null` for `versionName` / `versionCode` only as a temporary gap; fill them
on the next APKPure pull. Re-export `SOURCE_APP` from `src/index.ts`. Bump these
fields whenever the SDK is refreshed from a newer APK; do not leave stale
version annotations after an update.

## Registering a new SDK

A target is a named Android app plus the TypeScript package derived from it.
Add all of these in one change:

1. `targets/<name>/target.json` — `packageName`, `sdkPackage` (`@mergd/<name>`),
   `sdkDirectory`, `appVersion`, `versionCode`, `apkpureUrl`.
2. `targets/<name>/update.md` — APKPure fetch, what to search, auth-out-of-scope,
   `bun run check` + `pack:<name>`.
3. `packages/<name>/` — same shape as an existing SDK (`client`, `transport`,
   `errors`, `types`, `source-app`, tests, `publishConfig.access: public`).
4. Root `package.json` — add `build` / `typecheck` / `pack:<name>` workspace
   scripts.
5. Root `README.md` packages table — include source `versionName`.
6. `.github/workflows/publish.yml` — add `<name>` to the dispatch choices and
   tag filters.

After the package exists on npm, add the same GitHub Actions trusted publisher
on npmjs.com (see Publishing). Auth, tokens, and APK blobs stay out of git.

## Publishing

Packages are public `@mergd/*` modules on npm. Do not store `NPM_TOKEN`.
Publishing uses [npm trusted publishing](https://docs.npmjs.com/trusted-publishers/)
(OIDC) from `.github/workflows/publish.yml`.

On each package at npmjs.com → **Settings → Trusted Publisher**:

| Field | Value |
| --- | --- |
| Provider | GitHub Actions |
| Organization or user | `mergd` |
| Repository | `apk2sdk` |
| Workflow filename | `publish.yml` |
| Environment name | `npm` |
| Allowed actions | `npm publish` |

Existing packages (`@mergd/beli`, `@mergd/eight-sleep`): configure the publisher
on the live package, then publish from CI. New packages (`@mergd/segway`,
`@mergd/butterflymx`): create the empty package on npm (or first-publish with a
one-time login), then attach the same trusted publisher before relying on CI.

Release by bumping `packages/<name>/package.json` `version`, merging to `main`,
then either:

```bash
git tag <name>@<version>   # e.g. segway@0.1.0
git push origin <name>@<version>
```

or **Actions → Publish → Run workflow** and pick the package. The `npm`
GitHub Environment is required; it must match the npm trusted-publisher
environment field exactly.

## Updating an SDK

1. Fetch the APK from APKPure (above).
2. Follow `targets/<name>/update.md`.
3. Refresh version annotations.
4. Run `bun run check` and the package's `pack:*` script.
5. Auth stays out of scope — never commit credentials, tokens, or secrets found in the APK.
