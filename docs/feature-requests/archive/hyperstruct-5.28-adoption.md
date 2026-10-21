# HyperStruct on 5.28.0 (the 5.25–5.28 adoption) → BUG-60-01, FR-60-01

**From:** HyperStruct · **Version:** 5.28.0 · **Date:** 2026-10-21 · **HyperStruct decision:** O352

HyperStruct moved from 5.24.0 to 5.28.0. Every item of its 5.24 report (`hyperstruct-5.24-adoption.md`) is closed,
and each fix was checked in `projects/strct/src/lib` before the app's workaround went:

- **BUG-59-01** — the app's a11y gate (axe-core over 31 rendered surfaces) runs with an **empty** baseline: the
  `updates / heading-order 1` entry is deleted, and four "no page title" specs no longer skip the empty grid's title.
- **BUG-59-02** — the Backup, Site Recovery and Administration sidebars are `routerLink` entries again under an
  explicit `activeId`; the app's `href` entries and its own click routing are gone. Its shell spec still holds
  exactly one `aria-current` on `/backup/vms/vm-1`, and a Ctrl-click left to the browser.
- **BUG-59-04** — the app's `.strct-dg__sortbtn` rule and its guard spec are deleted; the app now has no rule on any
  `strct-dg` class.
- **BUG-59-03** — measured in HyperStruct's vitest on 5.28.0 (mean of three after a warm-up; the app's reader vs
  `strctParseMarkdown(src, { streaming: true, breaks: true })`):

  | Input (64 KiB unless said)              | HyperStruct's reader | `strctParseMarkdown` |
  | --------------------------------------- | -------------------- | -------------------- |
  | `"*a "`                                 | 10.1 ms              | 7.5 ms               |
  | `"**a "`                                | 4.4 ms               | 11.0 ms              |
  | `"_a "`                                 | 6.3 ms               | 8.0 ms               |
  | ``"`a "``                               | 12.4 ms              | 8.1 ms               |
  | `"["`                                   | 206.9 ms             | 39.4 ms              |
  | delimiter-free                          | 2.0 ms               | 1.8 ms               |
  | a 35 KB reply read at 400 stream points | 518 ms               | 521 ms               |

  The cost is closed (the `"**a "` case at 2.5× is not worth an id). The parity spec passes. HyperStruct keeps its
  renderer for its own reasons (images, tables as `strct-table`, a chat the operator validated) — nothing to file.

- **FR-59-01** — taken (the app had the library's group header since 5.24).
- **FR-59-02** — the guest agent line is `strct-cell-status` with its own icon, `accent` / `info` and
  `announce="false"` (it was a badge with an icon inside).
- **FR-59-03** — VM ▸ Updates ▸ Upgrade now… carries the server's reason as `disabledReason` — with a guard in its
  handler, because of BUG-60-01 below.
- **FR-59-04** — the product switcher is `strct-product-switcher` (`accent`, `headerTone`, `shortLabel`, `data-item`,
  `(opened)` for the health lines); the app's chip and menu are gone.
- **FR-59-05** — the install history draws a one-sided `strct-change`.
- **FR-59-07** — the inventory tree's resource-pool refusals are `canDrop` strings; the toast after the drop is gone.
- **FR-59-08** — `strct-flow [navigable]` is noted as the answer. HyperStruct's MVS Topology tab is not redrawn yet:
  that is a design step for its operator (four columns, a switch of hundreds of members).

5.26.0's badge (a dot and a word) went in untouched across 551 uses; no spec asserted the box.

One shipped feature is unsafe as shipped, and one could not be used where it was asked for. Suggested order:
BUG-60-01 first (a "disabled" button acts).

---

### BUG-60-01 — `strct-button [disabledReason]` lets the consumer's `(click)` through (5.27.0)

**Seen.** `onClick` refuses in the component's **host** listener (`preventDefault()` + `stopImmediatePropagation()`).
That stops listeners added after it and the bubbling — but Angular attaches a `(click)` written in the consumer's
template to the element **before** the component's host listener, so the consumer's handler has already run.
Measured in HyperStruct's vitest (jsdom, a probe spec on 5.28.0):

```html
<div (click)="outer = outer + 1">
  <button strct-button [disabled]="true" disabledReason="Why not" (click)="inner = inner + 1">
    Go
  </button>
</div>
```

After `button.click()`: `inner` **1**, `outer` 0, a listener added with `addEventListener` after creation 0;
`aria-disabled="true"`, `button.disabled` false. The library's spec ("refuses the click it can no longer refuse
natively") adds its counter with `addEventListener` after creation, which is why it passes. The usual way to use a
button — `(click)="act()"` on it — therefore performs the action of a "disabled" button on a click, and on Enter or
Space (a button's keyboard activation is a click). HyperStruct met it on its first adoption: Upgrade now… opened its
dialog while the server refused the upgrade.

**Asked.** Refuse before any listener on the element runs — e.g. a **capture** listener on the host
(`addEventListener('click', …, { capture: true })` in the constructor; at the target, capture listeners run before
bubble ones, and `stopImmediatePropagation()` there stops both the element's own listeners and the bubbling), the
same for an `<a strct-button>`. A spec with the consumer's `(click)` **in the template** beside the reason, a parent's
`(click)`, and Enter / Space.

**HyperStruct today.** The one handler checks the server's verdict itself (`upgradeNow()`, marked BUG-60-01); its spec
clicks the soft-disabled button and asserts nothing opens. No other `disabledReason` until this ships.

---

### FR-60-01 — `strct-desc [routerLink]`: query parameters (and a fragment)

**Seen.** 5.27.0 added `href`, `routerLink` and `target` to `strct-desc` (FR-59-06). The value FR-59-06 named —
HyperStruct's VM "Now" card, Guest agent row — opens the VM's Updates tab, whose address is
`/vms/vm-1?action=updates`. `routerLink` takes `string | unknown[]` and no `queryParams`: a string with `?` is
encoded into the path (`/vms/vm-1%3Faction%3Dupdates`), and `href` loads the page again instead of routing.

**Asked.** `queryParams` (and `fragment`, `queryParamsHandling` if cheap) beside `routerLink` on `strct-desc`,
passed to the inner `RouterLink`. A spec with a query parameter that checks the rendered `href` and a routed click.

**HyperStruct today.** The hand-made `<a [routerLink] [queryParams]>` inside the value slot stays, marked FR-60-01.

---

Still open from earlier reports: none from HyperStruct (`hyperstruct-5.24-adoption.md` and
`hyperstruct-5.16-adoption.md` are fully shipped and can be archived).
