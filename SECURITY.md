# Security Policy

## Supported versions

Only the **latest published minor** on npm receives fixes — there are no
maintenance branches. Upgrading is designed to be cheap: releases are
additive-first under the [1.0 semver contract](ROADMAP.md), and any
behavioral change is called out in [CHANGELOG.md](CHANGELOG.md).

| Version              | Supported           |
| -------------------- | ------------------- |
| latest `6.x`         | ✅                  |
| `1.x` – `5.x`, `0.x` | ❌ (please upgrade) |

## Reporting a vulnerability

Please **do not open a public issue** for security reports.

- Preferred: [GitHub private vulnerability reporting](https://github.com/akcelik/uistruct/security/advisories/new)
- Alternatively: email the maintainer at `serkan.akcelik@gmail.com` with
  `[uistruct security]` in the subject.

You can expect an acknowledgement within **7 days** and a status update within
**30 days**. This is a single-maintainer open-source project — there is no
commercial SLA — but security reports are handled ahead of all other work.

## Scope notes

- The library has **zero runtime dependencies** (charts included), so its
  supply-chain surface is the Angular peer dependencies you already ship.
- Components never `eval` anything, and never bind consumer-provided strings
  to `innerHTML` — with one documented exception: **`registerStrctIcon()`**.
  Registered icon markup is rendered through `bypassSecurityTrustHtml`
  (Angular's sanitizer would strip SVG), so it is treated as trusted code.
  Register only SVG you ship yourself; never feed it user, API or CMS input.
- The Angular peer dependencies are yours to keep patched. A router advisory
  (SSR-only denial of service, fixed in `@angular/router` 22.2.1) is an
  example: the library cannot pin your copy, so `npm audit` in your app is
  the check that matters.
- The `scripts/` helpers serve the built showcase on `127.0.0.1` only and
  refuse paths that resolve outside the build directory.
- Publishing runs from CI with npm **provenance** enabled — the package on npm
  is attestably built from this repository.
