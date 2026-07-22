# Feature Request: StrctModal styling hooks (`panelClass` / `backdropClass`, optional `variant`)

**Component:** `StrctModal` — `projects/strct/src/lib/modal/modal.ts` (selector `strct-modal`)
**Type:** feature
**Priority:** medium — enables custom modal looks without reaching into internal class names
**Reported from:** HyperStruct (a consumer app), 2026-07-15

## Motivation

HyperStruct wanted a **frosted-glass** assistant modal (translucent panel + blurred,
accent-tinted backdrop). `StrctModal` exposes no way to style the panel or backdrop, so the
consumer had to pierce encapsulation and target the library's **internal** class names:

```css
:host ::ng-deep .strct-modal__dialog  { background: color-mix(…); backdrop-filter: blur(28px); … }
:host ::ng-deep .strct-modal__overlay { background: …; backdrop-filter: blur(10px); }
```

Problems with that:

- **Couples the consumer to internal class names** (`__dialog`, `__overlay`) that are private
  and may change.
- Requires `::ng-deep` (deprecated) and only works because the modal renders **in-place**;
  it would silently break if the modal ever moved to a CDK portal / `document.body`.
- Every consumer re-derives the same hack.

## Proposed API

Two class inputs, applied to the existing elements:

```ts
/** Extra class(es) added to the dialog panel — style it from your app's global CSS. */
readonly panelClass = input<string>('');
/** Extra class(es) added to the backdrop/overlay. */
readonly backdropClass = input<string>('');
```

Template:

```html
<div class="strct-modal__overlay {{ backdropClass() }}" (click)="onBackdrop($event)">
  <div class="strct-modal__dialog strct-modal__dialog--{{ size() }} {{ panelClass() }}" …></div>
</div>
```

Consumer usage (class defined in **global** styles, so no `::ng-deep`):

```html
<strct-modal panelClass="app-glass" backdropClass="app-glass-scrim" …></strct-modal>
```

```css
/* global styles.css */
.app-glass {
  background: color-mix(in srgb, var(--bg-1) 74%, transparent);
  backdrop-filter: blur(28px) saturate(1.5);
  border-radius: 18px;
}
.app-glass-scrim {
  backdrop-filter: blur(10px) saturate(1.25);
  background: rgba(6, 9, 14, 0.44);
}
```

### Optional (nice-to-have): a built-in `variant`

```ts
readonly variant = input<'solid' | 'glass'>('solid');
```

`glass` would apply a tasteful, theme-aware frosted preset out of the box (translucent panel

- backdrop blur), so common cases need no custom CSS. `panelClass`/`backdropClass` remain the
  escape hatch for full control. (If only one lands, prefer the class hooks — they're the
  flexible primitive.)

## Acceptance criteria

- `panelClass` / `backdropClass` append the given class(es) to the dialog / overlay.
- Empty by default → **no visual change** for existing consumers.
- Documented example showing a glass modal styled entirely from app-global CSS (no `::ng-deep`,
  no dependence on `__dialog` / `__overlay`).
- (If `variant='glass'` is added) it renders correctly in both light and dark themes.
