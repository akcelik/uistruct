# FR: Components fail silently where they could refuse loudly

> **RESOLVED in 4.1.0 (2026-09-18)** (item 1's fix shipped in 3.1.1). Per item:
>
> 1. **rowId** — fixed in 3.1.1; 4.1.0 adds dev warnings for duplicate values and
>    for unresolved rows (which now fall back to object identity rather than merge).
> 2. **chromeless vs size** — dev warning when `size` is set with `chromeless`;
>    the variable is documented, including _where_ to set it. 4.0.0 widened the
>    default to 864px. Not done: a `contentWidth` input. The dialog reads
>    `--strct-wiz-content-min` on itself, and a wizard input sets it on the
>    wizard — which, measured in Chrome, never reaches the dialog. A dev warning
>    now catches exactly that mistake instead.
> 3. **`let-row="row"`** — both spellings now work (`strctCell`, `strctRowDetail`).
> 4. **Wizard defaults in tests** — documented, plus a dev warning when `title`
>    is set on the horizontal layout, which is how the reported test failed.
>    Not done: flipping `vertical` to default true (a breaking layout change).
> 5. **Closed-modal cost** — `<ng-template strctModalContent>`, built only while
>    open. The default cannot change: Angular creates projected content with the
>    parent whether or not the slot renders.
> 6. **initialSelection mismatch** — dev warning (skipped in lazy mode).
>
> Shared helper: `projects/strct/src/lib/util/dev-warn.ts`, as proposed.

**Reported from:** HyperStruct (a consumer app), 2026-09-18
**Scope:** `StrctDatagrid`, `StrctModal`, `StrctWizard`, `StrctCellDef`
**Type:** quality (mostly small, contained changes + dev-mode diagnostics)
**Severity:** medium overall — no crashes, but each item cost a debugging session
in the consumer, and two of them shipped to an operator before being noticed

---

## Why one document

Everything below was hit in a **single consumer session**. They are different
components, but they share one shape:

> The component is used wrongly, or in a combination it does not support, and
> instead of saying so it **does something plausible and wrong**.

A crash is cheap — it points at its own cause. What these produce instead is a
screen that renders, passes tests, and is subtly incorrect. Two of them reached
an operator; one of those was reported three times before the cause was found,
because nothing anywhere said "you are holding it wrong".

`ngDevMode` is already used throughout the library (`debugName` metadata), so the
diagnostics proposed here cost nothing in production builds.

---

## 1. `rowId` that does not resolve merges rows

**Filed separately:** `datagrid-rowid-undefined-merges-rows.md` — summarised here
because it is the same theme and the most severe of the set.

`idOf` returns `row[rowId]`, which is `undefined` when the field is missing, and
selection is a `Set`. Every row missing the field shares one identity: ticking one
ticks all. `expandedRows` uses the same function, so `expandable`/`detailPane`
merges too.

**Fix:** `return resolved ?? row;` — the fallback the component already uses when
`rowId` is absent entirely.

**Dev-mode diagnostic:** on first render, if `rowId` is set and two visible rows
resolve to the same identity, warn once:

```
[strct-datagrid] rowId="id" resolves to the same value for 2 rows
(undefined). Selection and expansion key on this value, so those rows will
behave as one. Give each row a distinct value, or drop rowId to key on the
row object.
```

---

## 2. `chromeless` silently overrides `size`

```css
.strct-modal__dialog--chromeless {
  width: calc(232px + var(--strct-wiz-content-min, 480px) + 2px);
}
.strct-modal__dialog--chromeless .strct-modal__body {
  overflow: hidden;
}
```

A consumer wrote `size="xl" chromeless` and got a 714px dialog with a **480px**
content pane. The steps held six-column datagrids; `overflow: hidden` meant the
excess was not scrolled to but **cut**, and the steps read as empty. The operator
reported "the wizard steps are blank".

Two things went wrong at once, and both are worth separating:

**(a) `size` is accepted and ignored.** Nothing in the API says the two inputs
conflict. Either honour `size` when both are given, or warn in dev mode:

```
[strct-modal] size="xl" has no effect with `chromeless`: a chromeless dialog
sizes itself from --strct-wiz-content-min (default 480px). Set that variable
instead.
```

**(b) `--strct-wiz-content-min` is the real API and is undocumented.** It is the
only way to widen a wizard dialog, and a consumer can only find it by reading the
compiled CSS. It deserves to be a documented custom property, and arguably an
input:

```ts
/** Content-pane width for a chromeless wizard dialog (default 480px).
 *  Sets --strct-wiz-content-min. */
readonly contentWidth = input<string>('');
```

**Suggestion for the default:** 480px is right for a form and wrong for anything
holding a table. A wizard whose steps contain a `strct-datagrid` will always need
more. Consider widening the default, or documenting prominently that a datagrid
step needs the variable set.

---

## 3. `strctCell` with `let-row="row"` yields `undefined`

The cell context is `{ $implicit: row, value, column }`, so the row arrives as the
**implicit** value:

```html
<ng-template strctCell="x" let-row let-value="value">
  <!-- correct -->
  <ng-template strctCell="x" let-row="row" let-value="value"
    ><!-- silently undefined --></ng-template
  ></ng-template
>
```

This has now been hit **twice by the same consumer**, months apart, in two
different components — the second time by someone who had already fixed the
first. It does not throw; it renders an empty cell, or throws only when a
conditional branch touching `row` finally runs, which can be long after the code
shipped.

`value` and `column` ARE named context properties, which is exactly what makes
`row` look like one too. The asymmetry is the trap.

**Suggested fix — make both spellings work:**

```ts
// in the cell context construction
{
  $implicit: (row, row, value, column);
}
```

One extra property, no behaviour change for existing code, and the mistake stops
being possible. If that is unwanted, a dev-mode warning when a cell template
declares a `row` context binding would at least name the problem.

---

## 4. A wizard renders differently when `provideStrctWizardDefaults` is absent

`provideStrctWizardDefaults({ vertical: true })` is an app-level provider. A unit
test that builds a component **without** it gets the horizontal wizard: a
different DOM, no step rail, and `title` rendered nowhere.

So a consumer's test can exercise a component that is not the one the app ships,
and it passes. This was found only because a test asserted on the rail heading and
failed for a reason that looked like a bug in the consumer's own code.

**Suggestions, in order of preference:**

1. **Document it in the testing guide**: "a test that renders a `strct-wizard`
   must provide the same `provideStrctWizardDefaults` the app does, or it renders
   a different layout."
2. **Warn in dev mode** when `strct-wizard` renders horizontally and no defaults
   provider is present — most apps pick one orientation globally, so the
   un-provided case is usually an oversight.
3. Consider whether `vertical` should default to `true`. The horizontal layout
   drops `title` entirely, which makes it the more surprising of the two.

---

## 5. `strct-modal` projects its content while closed

A closed modal still instantiates everything inside it. A consumer dialog holding
four datagrids pushed two **unrelated** component specs past their render budget,
because every render of the parent screen built the closed dialog's contents too.

The workaround is to wrap the body in `@if (open())`, which every consumer has to
discover independently — and which is easy to forget precisely when the dialog is
expensive.

**Suggested fix:** render projected content only while open (or after first open,
if keeping state across close/reopen matters). If the current behaviour is
deliberate — a consumer may want the content alive to preserve form state — then
an input would make the choice explicit:

```ts
/** Keep projected content instantiated while closed (default false). */
readonly keepAlive = input(false, { transform: booleanAttribute });
```

Either way it belongs in the docs: today nothing suggests a closed modal costs
anything.

---

## 6. `initialSelection` and `rowId` can drift apart

`initialSelection` takes row **ids**, which must match whatever `rowId` resolves
to. A consumer that builds a composite key in one place and seeds the selection
from another silently gets an empty pre-selection: no warning, no error, just
nothing checked.

**Suggested dev-mode diagnostic:** after seeding, if `initialSelection` is
non-empty and **none** of its values match any visible row's identity, warn once:

```
[strct-datagrid] initialSelection has 2 values, none of which match any row's
rowId. The pre-selection will be empty.
```

That single warning would have saved the consumer a debugging pass on its own.

---

## Cross-cutting suggestion: a `strct` dev-mode diagnostics pass

Items 1, 2, 4 and 6 are all the same request in different components: **say
something when a combination cannot work.** The library already branches on
`ngDevMode`, so the cost is zero in production.

A small shared helper would keep them consistent and de-duplicated:

```ts
// projects/strct/src/lib/util/dev-warn.ts
const warned = new Set<string>();
export function strctDevWarn(key: string, message: string): void {
  if (typeof ngDevMode === 'undefined' || !ngDevMode) return;
  if (warned.has(key)) return;
  warned.add(key);
  console.warn(`[strct] ${message}`);
}
```

Keyed so a warning fires once per condition rather than once per change
detection.

---

## Priority, from a consumer's point of view

| #   | Item                                 | Why this order                                       |
| --- | ------------------------------------ | ---------------------------------------------------- |
| 1   | `rowId` merge (item 1)               | Wrong data reaches the user's hands; silent          |
| 2   | `let-row="row"` (item 3)             | Hit twice, by someone who knew about it              |
| 3   | `chromeless` vs `size` (item 2)      | Shipped a broken screen to an operator               |
| 4   | `initialSelection` mismatch (item 6) | Cheap warning, whole debugging pass saved            |
| 5   | Closed-modal cost (item 5)           | Performance + a workaround every consumer re-invents |
| 6   | Wizard defaults in tests (item 4)    | Tests that do not test what ships                    |

---

## What this document is not

None of this is a complaint about the components' design. The datagrid's
identity model, the wizard's rail and the modal's projection are all reasonable
choices. The request is narrower: **where a choice has a consequence the consumer
cannot see, make the component say so.** Every item above was found by reading
the library's compiled source or its repository — which is not where a consumer
should have to look.
