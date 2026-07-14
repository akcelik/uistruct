import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  booleanAttribute,
  input,
} from '@angular/core';

/** Button visual variants. */
export type StrctButtonVariant = 'primary' | 'critical' | 'outline' | 'flat' | 'neutral';
/** Button size variants. */
export type StrctButtonSize = 'md' | 'sm' | 'mini';

/**
 * Styles a native `<button>` / `<a>` so it stays fully accessible and form-aware.
 *
 * Buttons are restrained by default: outlined / ghost surfaces with color used
 * only as a subtle border + text accent. Add `solid` for a rare filled call to
 * action.
 *   <button strct-button variant="primary">Save</button>
 *   <button strct-button variant="primary" solid>Deploy</button>
 *   <a strct-button variant="flat" size="sm" href="...">Cancel</a>
 */
@Component({
  selector: 'button[strct-button], a[strct-button]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `<ng-content />`,
  host: {
    class: 'strct-btn',
    '[class.strct-btn--primary]': "variant() === 'primary'",
    '[class.strct-btn--critical]': "variant() === 'critical'",
    '[class.strct-btn--outline]': "variant() === 'outline'",
    '[class.strct-btn--flat]': "variant() === 'flat'",
    '[class.strct-btn--solid]': 'solid()',
    '[class.strct-btn--sm]': "size() === 'sm'",
    '[class.strct-btn--mini]': "size() === 'mini'",
    '[class.strct-btn--block]': 'block()',
    '[class.strct-btn--icon]': 'iconOnly()',
  },
  styles: [
    `
      /* Base: neutral, outlined, no fill. */
      .strct-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: var(--space-1);
        font-family: var(--font);
        font-size: 13px;
        font-weight: 500;
        line-height: 1;
        padding: var(--space-2) var(--space-4);
        border-radius: var(--radius-md);
        cursor: pointer;
        user-select: none;
        color: var(--t1);
        background: transparent;
        border: 1px solid var(--b3);
        transition:
          background 0.14s ease,
          border-color 0.14s ease,
          color 0.14s ease,
          opacity 0.14s ease;
        text-decoration: none;
        white-space: nowrap;
      }
      .strct-btn:hover {
        background: var(--bg-3);
        text-decoration: none;
      }
      .strct-btn:active {
        background: var(--bg-a);
      }
      .strct-btn:disabled,
      .strct-btn[aria-disabled='true'] {
        opacity: 0.45;
        cursor: not-allowed;
      }

      /* Emphasis via accent border + text only — not a colored fill. */
      .strct-btn--primary {
        border-color: var(--acc50);
        color: var(--acc);
      }
      .strct-btn--primary:hover {
        background: var(--acc-m);
        border-color: var(--acc);
      }

      .strct-btn--critical {
        border-color: var(--critical);
        color: var(--critical);
      }
      .strct-btn--critical:hover {
        background: var(--critical-bg);
      }

      /* Neutral outline (explicit). */
      .strct-btn--outline {
        border-color: var(--b3);
        color: var(--t1);
      }
      .strct-btn--outline:hover {
        background: var(--bg-3);
      }

      /* Borderless text button. */
      .strct-btn--flat {
        border-color: transparent;
        color: var(--t2);
      }
      .strct-btn--flat:hover {
        background: var(--bg-3);
        color: var(--t1);
      }

      /* Opt-in filled call to action. */
      .strct-btn--solid {
        background: var(--bg-3);
        border-color: transparent;
        color: var(--t1);
      }
      .strct-btn--solid:hover {
        background: var(--bg-h);
      }
      .strct-btn--solid.strct-btn--primary {
        background: var(--acc);
        color: var(--inv);
      }
      .strct-btn--solid.strct-btn--primary:hover {
        background: var(--acc);
        filter: brightness(1.08);
      }
      .strct-btn--solid.strct-btn--critical {
        background: var(--critical);
        color: var(--inv);
      }
      .strct-btn--solid.strct-btn--critical:hover {
        background: var(--critical);
        filter: brightness(1.08);
      }

      .strct-btn--sm {
        padding: var(--space-1) var(--space-3);
        font-size: 12px;
        border-radius: var(--radius-sm);
      }
      .strct-btn--mini {
        padding: 2px var(--space-2);
        font-size: 12px;
        border-radius: var(--radius-sm);
      }
      .strct-btn--block {
        display: flex;
        width: 100%;
      }

      /* Square icon-only button. */
      .strct-btn--icon {
        padding: var(--space-2);
      }
      .strct-btn--icon.strct-btn--sm {
        padding: var(--space-1);
      }
      .strct-btn--icon.strct-btn--mini {
        padding: 3px;
      }
    `,
  ],
})
export class StrctButton {
  /** Visual variant. */
  readonly variant = input<StrctButtonVariant>('neutral');
  /** Size variant. */
  readonly size = input<StrctButtonSize>('md');
  /** Opt in to a filled surface (use sparingly, for the primary action). */
  readonly solid = input(false, { transform: booleanAttribute });
  /** Expand to full width. */
  readonly block = input(false, { transform: booleanAttribute });
  /** Square padding for a single-icon button. */
  readonly iconOnly = input(false, { transform: booleanAttribute });
}

/** Segments adjacent buttons into a single joined control. */
@Component({
  selector: 'strct-button-group',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `<ng-content />`,
  host: { class: 'strct-btn-group', role: 'group' },
  styles: [
    `
      .strct-btn-group {
        display: inline-flex;
      }
      .strct-btn-group > .strct-btn {
        border-radius: 0;
      }
      .strct-btn-group > .strct-btn:not(:first-child) {
        margin-inline-start: -1px;
      }
      .strct-btn-group > .strct-btn:first-child {
        border-top-left-radius: var(--radius-md);
        border-bottom-left-radius: var(--radius-md);
      }
      .strct-btn-group > .strct-btn:last-child {
        border-top-right-radius: var(--radius-md);
        border-bottom-right-radius: var(--radius-md);
      }
      .strct-btn-group > .strct-btn:hover,
      .strct-btn-group > .strct-btn:focus-visible {
        position: relative;
        z-index: 1;
      }
    `,
  ],
})
export class StrctButtonGroup {}
