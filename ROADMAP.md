# Roadmap

Where UIStruct is heading, and what "1.0" means. Dates are intentionally
absent — items ship when they meet the bar. Ordering reflects priority.

## To 1.0 — API freeze

1.0 is a **stability contract**, not a feature milestone. It ships when:

- [x] **RTL / i18n audit** — static sweep + rendered verification done, with
      directional fixes shipped; see [docs/rtl-audit.md](docs/rtl-audit.md).
      Remaining 1.0 blocker from the audit: logical offsets for datagrid
      sticky columns (tracked below).
- [ ] **Datagrid sticky columns in RTL** — logical (`inset-inline-start`)
      frozen-column offsets.
- [ ] **Datepicker keyboard grid** — strict APG date-grid pattern
      (arrow/PageUp/PageDown/Home/End across the calendar).
- [ ] **Visual regression baseline** — screenshot diffing in CI on top of the
      existing axe gate, across all six palette × theme schemes.
- [ ] **API review pass** — naming/shape consistency sweep over all public
      inputs/outputs; anything renamed gets a deprecation alias for one minor.
- [ ] **Performance docs** — published, reproducible benchmarks
      (see `docs/performance.md`).

Until 1.0, the practical policy already in force:

- Releases are **additive-first**; defaults reproduce previous behavior.
- Anything that changes rendering or behavior is flagged in
  [CHANGELOG.md](CHANGELOG.md) under `Changed`.

## After 1.0 — semver contract

- **Patch**: fixes only, no API or visual-language changes.
- **Minor**: additive APIs; visual changes only when opt-in.
- **Major**: reserved for Angular major adoptions and (rare) breaking cleanups,
  each with a migration note per breaking item.
- Deprecations live for at least one minor with a console-free, docs-visible
  notice before removal in the next major.

## Under consideration (post-1.0)

- Datagrid: column reordering (drag), row grouping, Excel export.
- Charts: stacked series, log scale, time-axis (Date-based) domain.
- Overlay: portal-based rendering option for modal/drawer in embedded hosts.
- Theming: palette-builder playground with exportable token sets.

## Continuity

UIStruct is currently a single-maintainer project. Mitigations, in order of
usefulness to you: the codebase is small and dependency-free by design (easy to
fork and own), releases are built from CI with npm provenance, and the entire
verification story (tests, axe gate, benchmarks) is scripted in-repo so a fork
can keep the same quality bar without tribal knowledge.
