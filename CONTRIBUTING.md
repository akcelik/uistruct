# Contributing to UIStruct

Issues, feature requests and PRs are welcome. The project optimizes for a
coherent design system over a large contributor surface, so please read this
page before opening a PR.

## Development setup

```bash
npm ci
npx ng build strct      # library
npx ng build showcase   # docs app
npx ng test strct --watch=false
npx ng lint
node scripts/a11y-smoke.mjs   # axe-core gate over 8 key routes (needs Chrome)
```

`npm start` serves the showcase at `http://localhost:4200`.

## House conventions

Every component follows the same rules — new code should too:

- **Standalone components, signal APIs**: `input()` / `input.required()`,
  two-way via `model()`, events via `output()`. `ChangeDetectionStrategy.OnPush`.
- **Selectors**: elements `strct-*`, directives/slots `[strctXxx]`.
- **Theming via tokens only** — read CSS custom properties from the token layer
  (`_tokens.scss`); never hard-code colors. Light/dark and all three palettes
  must work without component changes.
- **Styles**: `ViewEncapsulation.None` with BEM-ish class names
  (`.strct-foo__part--modifier`).
- **Accessibility is not optional**: proper roles/`aria-*`, full keyboard
  paths, visible focus, `prefers-reduced-motion` guards, WCAG AA contrast.
  The CI a11y gate fails on serious/critical axe findings.
- **Backwards compatible by default**: new inputs are optional with defaults
  that reproduce the previous behavior. Breaking changes need a very good
  reason and a CHANGELOG entry.
- **i18n**: user-visible strings must be overridable inputs (see
  `StrctDatagridLabels` for the pattern).

## PR checklist

1. `ng build strct` + `ng build showcase` + `ng test strct` + `ng lint` green.
2. Unit tests for new behavior (including a "defaults render identically" test
   when extending an existing component).
3. Docs: update the component's registry entry and add/extend a showcase demo.
4. CHANGELOG entry under an `Added` / `Changed` / `Fixed` heading.
5. Conventional-commit style message (`feat(scope): …`, `fix(scope): …`).

## Release process (maintainer)

Version bump in `projects/strct/package.json` + CHANGELOG → PR to `main`
(merges auto-deploy the showcase) → a `v*` GitHub release triggers the npm
publish workflow (with provenance).
