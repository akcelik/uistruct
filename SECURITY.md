# Security Policy

## Supported versions

UIStruct is pre-1.0. Only the **latest published minor** on npm receives fixes —
there are no maintenance branches for older 0.x versions. Upgrading is designed
to be cheap: every release so far has been additive, and any behavioral change
is called out in [CHANGELOG.md](CHANGELOG.md).

| Version        | Supported           |
| -------------- | ------------------- |
| latest `0.x`   | ✅                  |
| older releases | ❌ (please upgrade) |

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
- Components never call `innerHTML` with consumer-provided strings except via
  Angular's `DomSanitizer` (icon registry), and never `eval` anything.
- Publishing runs from CI with npm **provenance** enabled — the package on npm
  is attestably built from this repository.
