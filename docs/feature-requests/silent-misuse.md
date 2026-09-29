# FR-48-42 — Dev-mode diagnostics for attributes a component does not have

**From:** HyperStruct · **Version:** 4.4.0. Part of [hyperstruct-hand-built-audit.md](hyperstruct-hand-built-audit.md).
It continues the 4.1.0 work in [archive/uistruct-silent-failures-2026-09.md](archive/uistruct-silent-failures-2026-09.md)
and uses the same `util/dev-warn.ts`.

## Rule

**Writing a component the way a sibling component is written must not fail silently.** A static attribute is just an
HTML attribute to Angular, so a wrong one compiles, renders the default, and nobody finds out.

## What the audit found in HyperStruct

Each of these shipped, and none produced a warning, a test failure or a visual hint beyond "it looks a bit off":

| Written                                                        | Where                                                                                           | Why it looked right                                              | What rendered                                                                                 |
| -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `<strct-alert variant="warning">` (and `success` / `critical`) | object-detail.html:84, :1524, :1528, :1530, :1557, :1616, :1618, :1637; mvs-hosts-wizard.ts:189 | `strct-button` and `strct-empty-state` have `variant`            | nine info-blue boxes; six of them should not be: two critical (red), two success, two warning |
| `<strct-badge size="sm">`                                      | storage-pods.ts:104, vm-groups.ts:99                                                            | `strct-button`, `strct-avatar` and `strct-spinner` have `size`   | the default badge                                                                             |
| `<input strct-input>`                                          | host-configuration-view.ts:3157 (Rename switch)                                                 | `<button strct-button>` is kebab-case; `strctInput` is camelCase | an unstyled browser input                                                                     |
| `<select strct-input>` (fixed 2026-07-17, the same mistake)    | object-detail.html                                                                              | as above                                                         | an unbound select                                                                             |
| `style="display:block"` on `strct-alert`                       | 124 places                                                                                      | the usual way to give a custom element margins                   | icon above the text (see FR-48-22)                                                            |

HyperStruct's tests fail on any `[strct…]` console diagnostic (`src/test-setup.ts`), so each warning below would have
stopped these at the first test run.

## Proposed changes

1. **Unknown-attribute warning.**
   - **The check.** In dev mode, each component checks its host's attributes once, after the first render, against a
     small per-library list of input names that exist on other strct components: `variant`, `size`, `tone`, `status`,
     `type`, `dense`, `compact`, `heading`, `label`.
   - **The warning.** An attribute from that list that is not one of the component's own inputs gets a warning that
     suggests the right one: `[strct] <strct-alert> has no "variant" input — did you mean "type"? (values: info,
success, warning, critical)`.
   - **What it does not flag.** The list is closed and small, so ordinary HTML and ARIA attributes, `class`, `style`
     and `data-*` are never flagged.
   - **Cost.** Production builds pay nothing (`ngDevMode`).
2. **Selector alias for the input directive.** Add `input[strct-input], textarea[strct-input], select[strct-input]` to
   `StrctInput`'s selector. The library's element-level directives would then accept both spellings, as `let-row="row"`
   already does. Alternatively, a dev-mode directive on `[strct-input]` could only warn. The alias is kinder and costs
   nothing.
3. **Host `display` on flex components.** Addressed structurally in FR-48-22 for `strct-alert`. The same check applies
   to other components whose host is the flex container (for example `strct-badge`, `strct-tag` and
   `strct-status-dot`): either move the layout inward, or dev-warn when the computed host `display` is not the one the
   component set.

## Acceptance

- `<strct-alert variant="warning">` logs one `[strct]` warning naming `type`.
- `<strct-badge size="sm">` logs one naming the badge's inputs.
- `<input strct-input>` is styled as `strctInput` is.
- Nothing is logged for valid usage anywhere in the showcase; the showcase's e2e run asserts zero `[strct]` warnings.
