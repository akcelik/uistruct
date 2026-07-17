# API review — 1.0 freeze

A systematic pass over the entire public API surface (generated from the
published `types/akcelik-strct.d.ts`) ahead of 1.0. Reviewed: **327**
signal-based members (inputs / two-way models / outputs) across 65
components. Date: **2026-07-17**.

## Conventions (codified, enforced going forward)

**Inputs**

- Booleans are bare adjectives/nouns with `booleanAttribute` transforms:
  `disabled`, `collapsed`, `dense`, `virtual`, `lazy`, `brush`, `zoom`.
- Localizable strings are plain inputs (`emptyText`, `gapText`, `resetLabel`,
  `ariaLabel`) or a labels object (`StrctDatagridLabels`).
- Formatters are nullable function inputs (`valueFormat`, `axisFormat`,
  `xFormat`); `null` = default formatting.

**Two-way state** — `model()` named as the state noun, never verb-prefixed:
`open`, `expanded`, `collapsed`, `activeId`, `expandedIds`, `page`,
`columnState`, `checked`, `current`, `selectedIndex`.

**Outputs** — three families:

| Family       | Naming                          | Members                                                                                                                            |
| ------------ | ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Item pick    | verb or domain verb-phrase      | `select` (rail, section-menu, menu), `picked` (palette), `menuSelect`, `nodeMenuSelect`, `nodeActivated`, `activated`, `rowAction` |
| State stream | `<state>Change` or domain event | `selectionChange`, `expandedChange`, `stepChange`, `brushChange`, `nodeToggled`, `hoverIndex`                                      |
| Lifecycle    | past-tense verb                 | `closed`, `cancelled`, `finished`, `removed`                                                                                       |

`lazyLoad` (datagrid) is a **request** output — the grid asks the host to
load data — and is deliberately imperative.

## Accepted inconsistencies (no 1.0 rename)

Renaming any of these would break consumers for cosmetic gain, against the
additive-first policy. They are frozen as-is for 1.x and queued as
alias-then-remove candidates for 2.0:

1. **`close` / `back`** (context-menu internals) are imperative where the
   lifecycle family uses past tense (`closed`). 2.0 candidate: `closed`.
2. **`syncChange`** (datagrid refresh click, `void`) reads like a state
   stream but is a button event. 2.0 candidate: `refresh`.
3. **`picked`** (palette) vs `select` (rail / section-menu) — both are item
   picks. Kept: `picked` matches the palette's transient, dialog-like
   semantics.
4. **`isDisabled`** appears once as a CVA-driven model where inputs elsewhere
   use `disabled`. CVA state and the `disabled` input are different
   mechanisms; documented rather than unified.

## Result

- **No breaking changes required.** The surface is internally consistent
  within the taxonomy above; the four deviations are documented and frozen.
- The conventions section of [CONTRIBUTING.md](../CONTRIBUTING.md) plus this
  document are the review bar for every new API.
