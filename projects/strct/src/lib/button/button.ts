import { DOCUMENT } from '@angular/common';
import { StrctTooltipPosition, strctShowTooltip } from '../tooltip/tooltip';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  OnDestroy,
  ViewEncapsulation,
  booleanAttribute,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { StrctControlSize } from '../control-size';

/** Button visual variants. */
export type StrctButtonVariant = 'primary' | 'critical' | 'outline' | 'flat' | 'neutral' | 'link';
/**
 * The shared control sizes, plus the button's own `mini` — a 22px chip for a
 * toolbar's corner, below the scale on purpose and the one size that does not
 * line up with a field.
 */
export type StrctButtonSize = StrctControlSize | 'mini';

/**
 * Styles a native `<button>` / `<a>` so it stays fully accessible and form-aware.
 *
 * Weight carries rank (7.0): `primary` and `critical` are filled, the default
 * `neutral` is a solid with an edge, `outline` is quieter still, `flat` is a
 * word, and a disabled action is the lightest thing in the row. `solid` still
 * fills a neutral; on a primary or a critical it is now what the variant
 * already is.
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
    '[class.strct-btn--link]': "variant() === 'link'",
    '[class.strct-btn--solid]': 'solid()',
    '[class.strct-btn--sm]': "size() === 'sm'",
    '[class.strct-btn--lg]': "size() === 'lg'",
    '[class.strct-btn--mini]': "size() === 'mini'",
    '[class.strct-btn--block]': 'block()',
    '[class.strct-btn--icon]': 'iconOnly()',
    // With a reason to give, the control stays reachable: aria-disabled
    // instead of the native attribute, because a disabled button takes no
    // focus and so can never show why it is disabled.
    '[attr.disabled]': 'nativeDisabled() ? "" : null',
    '[attr.aria-disabled]': 'softDisabled() ? "true" : null',
    '[attr.aria-describedby]': 'reasonId()',
    '(mouseenter)': 'showReason()',
    '(focus)': 'showReason()',
    '(mouseleave)': 'hideReason()',
    '(blur)': 'hideReason()',
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
        font-size: var(--text-md);
        font-weight: 500;
        line-height: 1;
        /* The height is the token, not the sum of the padding and whatever
           the button holds: an icon used to add 1-4px and a spinner another,
           so two buttons of one size stood 31px and 32px side by side, and a
           field beside them stood 34.9px (FR-63-01). */
        box-sizing: border-box;
        height: var(--control-h);
        padding: 0 var(--space-4);
        border-radius: var(--radius-md);
        cursor: pointer;
        user-select: none;
        color: var(--t1);
        /* Neutral is the outlined rank: a solid object with an edge, so a
           filled primary beside it reads as one step up rather than as the
           only thing on the row (FR-67-04). */
        background: var(--bg-1);
        border: 1px solid var(--b3);
        transition:
          background 0.14s ease,
          border-color 0.14s ease,
          color 0.14s ease,
          opacity 0.14s ease;
        text-decoration: none;
        white-space: nowrap;
      }
      .strct-btn:not(:disabled):not([aria-disabled='true']):hover {
        background: var(--bg-3);
        text-decoration: none;
      }
      .strct-btn:not(:disabled):not([aria-disabled='true']):active {
        background: var(--bg-a);
      }

      /* Weight carries rank. A primary action is heavier, not merely bluer
         (FR-67-04): before 7.0 every variant was a 1px outline at the same
         height and radius and only the text colour changed, so a toolbar had
         nothing for the eye to land on and the destructive action weighed the
         same as the safe one. */
      .strct-btn--primary {
        background: var(--acc);
        border-color: var(--acc);
        color: var(--inv);
        font-weight: 600;
      }
      .strct-btn--primary:not(:disabled):not([aria-disabled='true']):hover {
        background: var(--acc);
        border-color: var(--acc);
        filter: brightness(1.08);
      }

      .strct-btn--critical {
        background: var(--critical);
        border-color: var(--critical);
        color: var(--inv);
        font-weight: 600;
      }
      .strct-btn--critical:not(:disabled):not([aria-disabled='true']):hover {
        background: var(--critical);
        border-color: var(--critical);
        filter: brightness(1.08);
      }

      /* Quieter than neutral: no surface, a lighter edge. */
      .strct-btn--outline {
        background: transparent;
        border-color: var(--b2);
        color: var(--t2);
      }
      .strct-btn--outline:not(:disabled):not([aria-disabled='true']):hover {
        background: var(--bg-3);
        color: var(--t1);
      }

      /* The bottom rank is a word, not a box. */
      .strct-btn--flat {
        background: transparent;
        border-color: transparent;
        color: var(--acc);
        padding-inline: var(--space-2);
      }
      .strct-btn--flat:not(:disabled):not([aria-disabled='true']):hover {
        background: var(--acc-s);
        color: var(--acc);
      }

      /* An action inside running text: looks like a link, behaves like a
         button — "Show all", a folder name in a cell, "Use another method".
         A flat button is too heavy inline, and an <a> without href cannot be
         reached with Tab. */
      .strct-btn--link {
        display: inline;
        height: auto;
        padding: 0;
        border: 0;
        border-radius: 0;
        background: none;
        color: var(--acc);
        font-weight: inherit;
        line-height: inherit;
        white-space: normal;
        text-align: start;
      }
      .strct-btn--link:hover,
      .strct-btn--link:focus-visible {
        background: none;
        text-decoration: underline;
      }
      .strct-btn--link:active {
        background: none;
      }
      .strct-btn--link:disabled,
      .strct-btn--link[aria-disabled='true'] {
        color: var(--t4);
        text-decoration: none;
      }
      /* Size scales the text only — the link has no box to scale. */
      .strct-btn--link.strct-btn--sm,
      .strct-btn--link.strct-btn--mini {
        padding: 0;
      }

      /* Opt-in filled call to action — for a neutral, which is the only
         variant that is not already filled.

         BUG-76-03: this rule used to be written unscoped. It sits after
         --primary and --critical at the same specificity, so it won over
         both and a primary asked to be solid came out at --bg-3 — pixel for
         pixel the same grey as a plain solid neutral, the main action on a
         sign-in page reading as disabled. The comment under it already said
         solid was a no-op there; only the selector did not. It is excluded
         rather than reordered so that the order of the variant rules among
         themselves stays free to change. */
      .strct-btn--solid:not(.strct-btn--primary):not(.strct-btn--critical) {
        background: var(--bg-3);
        border-color: transparent;
        color: var(--t1);
      }
      .strct-btn--solid:not(.strct-btn--primary):not(.strct-btn--critical):not(:disabled):not(
          [aria-disabled='true']
        ):hover {
        background: var(--bg-h);
      }

      /* A disabled action is never the heaviest thing in the row. It comes
         last so it wins over every variant and state above it.

         BUG-77-01: it took the fill away and left the variant's ink behind,
         so a disabled primary kept --inv on no background — white on white,
         measured at 1.06:1 in the light palette and 1.03:1 in the dark, and
         every wizard's Next was an unreadable empty box until its step could
         advance. A disabled link kept the same shape of mistake at 1.17:1.
         The ink is reset here with the fill, so what is left is the one
         colour that reads on the surface whatever the variant was.

         And the quietness is in the tokens, not in an opacity. A blanket
         --disabled-opacity halves the label along with everything else, and
         near-black ink at 0.5 tops out at 2.63:1 on a light surface — there
         is no ink dark enough to reach 3:1 through it. It is the rule the
         wiring map arrived at one component over: text taken out of
         contrast is not de-emphasised, it is unreadable. No fill, a hairline
         border, normal weight and muted ink say "not now" without taking the
         words away. */
      .strct-btn:disabled,
      .strct-btn[aria-disabled='true'] {
        background: transparent;
        border-color: var(--b1);
        color: var(--t3);
        font-weight: 400;
        cursor: not-allowed;
      }

      .strct-btn--sm {
        --control-h: var(--control-h-sm);
        --icon-size: var(--icon-size-sm);
        padding: 0 var(--space-3);
        font-size: var(--text-sm);
        border-radius: var(--radius-sm);
      }
      .strct-btn--lg {
        --control-h: var(--control-h-lg);
        --icon-size: var(--icon-size-lg);
        padding: 0 var(--space-5);
        font-size: var(--text-lg);
      }
      /* mini is the button's own: a 22px chip for a toolbar's corner, below
         the shared scale on purpose. It keeps its own height. */
      /* mini keeps a 14px icon: at 18px tall a 16px one has nowhere to sit. */
      .strct-btn--mini {
        --icon-size: var(--icon-size-sm);
        height: auto;
        padding: 2px var(--space-2);
        font-size: var(--text-sm);
        border-radius: var(--radius-sm);
      }
      .strct-btn--block {
        display: flex;
        width: 100%;
      }

      /* Square icon-only button: as wide as it is tall, whatever icon it
         holds. It used to be its icon plus its padding — 33px around a 16px
         icon, 24px around a 13px one — so two icon buttons of one size were
         different heights. */
      .strct-btn--icon {
        width: var(--control-h);
        padding: 0;
      }
      .strct-btn--icon.strct-btn--mini {
        width: auto;
        padding: 3px;
      }
    `,
  ],
})
export class StrctButton implements OnDestroy {
  private readonly hostEl = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly doc = inject(DOCUMENT);
  private reason: { id: string; dispose: () => void } | null = null;
  /** The raised reason's id, so the host can describe itself with it. */
  protected readonly reasonId = signal<string | null>(null);

  /** Visual variant. */
  readonly variant = input<StrctButtonVariant>('neutral');
  /** Size variant. */
  readonly size = input<StrctButtonSize>('md');
  /**
   * Fill a neutral button's surface, for the one action a row is really for.
   * A `primary` or a `critical` is filled already, so it is a no-op there —
   * never a way to turn one of them grey (BUG-76-03).
   */
  readonly solid = input(false, { transform: booleanAttribute });
  /** Expand to full width. */
  readonly block = input(false, { transform: booleanAttribute });
  /** Square padding for a single-icon button. */
  readonly iconOnly = input(false, { transform: booleanAttribute });
  /**
   * Disabled. Declared here so `disabledReason` can decide *how* it is
   * disabled; without a reason it is the native attribute, exactly as before.
   */
  readonly disabled = input(false, { transform: booleanAttribute });
  /**
   * Why the action cannot be taken. With one, the button keeps its tab stop
   * and says no through `aria-disabled`, and the reason appears on hover and
   * on focus (and in `aria-describedby`) — a disabled button cannot be
   * focused, so the reason it carries can never be read.
   */
  readonly disabledReason = input('');
  /** Where the reason appears. */
  readonly disabledReasonPosition = input<StrctTooltipPosition>('top');

  /** Disabled with no reason to give: the native attribute, as before. */
  protected readonly nativeDisabled = computed(() => this.disabled() && !this.disabledReason());
  /** Disabled with a reason: focusable, and refusing clicks itself. */
  protected readonly softDisabled = computed(() => this.disabled() && !!this.disabledReason());

  constructor() {
    // The refusal runs in the CAPTURE phase, registered on the element
    // itself. A host listener is a bubble listener, and Angular attaches a
    // (click) written in the consumer's template to the element before the
    // component's own — so the consumer's handler had already run by the time
    // a bubble-phase refusal saw the event (BUG-60-01). At the target,
    // capture listeners run before bubble ones, so stopImmediatePropagation
    // here stops the element's own listeners and the bubbling with them.
    const el = this.hostEl.nativeElement;
    const refuse = (event: Event) => {
      if (!this.softDisabled()) return;
      // A link is the other half of this: an <a strct-button> has no disabled
      // attribute at all, so the click is stopped here either way.
      event.preventDefault();
      event.stopImmediatePropagation();
    };
    el.addEventListener('click', refuse, { capture: true });
    inject(DestroyRef).onDestroy(() => el.removeEventListener('click', refuse, { capture: true }));
  }

  protected showReason(): void {
    if (!this.softDisabled() || this.reason) return;
    this.reason = strctShowTooltip(
      this.hostEl.nativeElement,
      this.disabledReason(),
      this.disabledReasonPosition(),
      this.doc,
    );
    this.reasonId.set(this.reason?.id ?? null);
  }

  protected hideReason(): void {
    this.reason?.dispose();
    this.reason = null;
    this.reasonId.set(null);
  }

  ngOnDestroy(): void {
    this.hideReason();
  }
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
        border-start-start-radius: var(--radius-md);
        border-end-start-radius: var(--radius-md);
      }
      .strct-btn-group > .strct-btn:last-child {
        border-start-end-radius: var(--radius-md);
        border-end-end-radius: var(--radius-md);
      }
      .strct-btn-group > .strct-btn:hover,
      .strct-btn-group > .strct-btn:focus-visible {
        position: relative;
        z-index: var(--z-base);
      }
    `,
  ],
})
export class StrctButtonGroup {}
