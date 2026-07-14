import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  booleanAttribute,
  inject,
  input,
  model,
} from '@angular/core';
import { StrctIcon } from '../icon/icon';
import { StrctStatus } from '../status';

/**
 * Surface container. Compose with the header / block / footer pieces:
 *
 *   <strct-card status="warning" collapsible [(collapsed)]="hidden">
 *     <strct-card-header icon="host">Host hv-02</strct-card-header>
 *     <strct-card-block>…</strct-card-block>
 *     <strct-card-footer><button strct-button>OK</button></strct-card-footer>
 *   </strct-card>
 *
 * Rich options (all opt-in; defaults preserve the plain card):
 * - `status` — tone rail on the leading edge (same language as alert / hero).
 * - `interactive` — hover lift + accent border for clickable cards.
 * - `selected` — accent ring for picker layouts.
 * - `dense` — tighter paddings for dashboards.
 * - `loading` — indeterminate top bar + `aria-busy` (reduced-motion safe).
 * - `collapsible` + two-way `collapsed` — the header gains a chevron toggle;
 *   block and footer hide while collapsed.
 */
@Component({
  selector: 'strct-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `<ng-content />`,
  host: {
    class: 'strct-card',
    '[class.strct-card--accent]': "status() === 'accent'",
    '[class.strct-card--success]': "status() === 'success'",
    '[class.strct-card--warning]': "status() === 'warning'",
    '[class.strct-card--critical]': "status() === 'critical'",
    '[class.strct-card--interactive]': 'interactive()',
    '[class.strct-card--selected]': 'selected()',
    '[class.strct-card--dense]': 'dense()',
    '[class.strct-card--loading]': 'loading()',
    '[class.strct-card--collapsed]': 'collapsible() && collapsed()',
    '[attr.aria-busy]': 'loading() ? "true" : null',
  },
  styles: [
    `
      .strct-card {
        position: relative;
        display: block;
        background: var(--bg-1);
        border: 1px solid var(--b2);
        border-radius: var(--radius-lg);
        box-shadow: var(--sh);
        overflow: hidden;
      }

      /* Tone rail on the leading edge — same language as alert / hero. */
      .strct-card--accent {
        border-inline-start: 3px solid var(--acc);
      }
      .strct-card--success {
        border-inline-start: 3px solid var(--success);
      }
      .strct-card--warning {
        border-inline-start: 3px solid var(--warning);
      }
      .strct-card--critical {
        border-inline-start: 3px solid var(--critical);
      }

      /* Clickable affordance (style-only — wrap in <a>/<button> or handle click). */
      .strct-card--interactive {
        cursor: pointer;
        transition:
          border-color 0.14s ease,
          transform 0.14s ease,
          box-shadow 0.14s ease;
      }
      .strct-card--interactive:hover {
        border-color: var(--acc50);
        transform: translateY(-1px);
        box-shadow: var(--shh);
      }
      .strct-card--interactive:focus-within {
        border-color: var(--acc);
      }

      .strct-card--selected {
        border-color: var(--acc);
        box-shadow:
          0 0 0 1px var(--acc),
          var(--sh);
      }

      /* Density: the pieces read these vars (fallbacks keep standalone use intact). */
      .strct-card--dense {
        --strct-card-px: var(--space-3);
        --strct-card-py: var(--space-2);
        --strct-card-pb: var(--space-3);
      }

      /* Loading: indeterminate accent bar along the top. */
      .strct-card--loading::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        height: 2px;
        width: 40%;
        background: var(--acc);
        animation: strct-card-load 1.1s ease-in-out infinite;
        z-index: 1;
      }
      .strct-card--loading > strct-card-block,
      .strct-card--loading > strct-card-footer {
        opacity: 0.55;
        pointer-events: none;
      }
      @keyframes strct-card-load {
        0% {
          transform: translateX(-100%);
        }
        100% {
          transform: translateX(280%);
        }
      }

      /* Collapsed: only the header stays. */
      .strct-card--collapsed > strct-card-block,
      .strct-card--collapsed > strct-card-footer {
        display: none;
      }
      .strct-card--collapsed > strct-card-header {
        border-bottom: 0;
      }

      @media (prefers-reduced-motion: reduce) {
        .strct-card--interactive {
          transition: none;
        }
        .strct-card--interactive:hover {
          transform: none;
        }
        .strct-card--loading::before {
          animation: none;
          width: 100%;
          opacity: 0.4;
        }
      }
    `,
  ],
})
export class StrctCard {
  /** Tone rail on the leading edge. */
  readonly status = input<StrctStatus>('neutral');
  /** Hover lift + accent border for clickable cards (style-only affordance). */
  readonly interactive = input(false, { transform: booleanAttribute });
  /** Accent ring — for picker / multi-select card layouts. */
  readonly selected = input(false, { transform: booleanAttribute });
  /** Tighter paddings for dense dashboards. */
  readonly dense = input(false, { transform: booleanAttribute });
  /** Indeterminate top bar + aria-busy; body/footer dim and ignore input. */
  readonly loading = input(false, { transform: booleanAttribute });
  /** Allow collapsing to just the header (a chevron appears in the header). */
  readonly collapsible = input(false, { transform: booleanAttribute });
  /** Collapsed state (two-way; only meaningful with `collapsible`). */
  readonly collapsed = model(false);

  toggle(): void {
    this.collapsed.update((v) => !v);
  }
}

/** Header section of a {@link StrctCard}. */
@Component({
  selector: 'strct-card-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [StrctIcon],
  template: `
    @if (icon()) {
      <strct-icon class="strct-card__hicon" [name]="icon()" [size]="16" [strokeWidth]="1.4" />
    }
    <ng-content />
    @if (card?.collapsible()) {
      <button
        type="button"
        class="strct-card__collapse"
        [attr.aria-expanded]="!card!.collapsed()"
        [attr.aria-label]="card!.collapsed() ? expandLabel() : collapseLabel()"
        (click)="card!.toggle()"
      >
        <strct-icon
          name="chevronDown"
          [size]="14"
          [strokeWidth]="1.6"
          [class.strct-card__chev--collapsed]="card!.collapsed()"
        />
      </button>
    }
  `,
  host: { class: 'strct-card__header' },
  styles: [
    `
      .strct-card__header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--space-2);
        padding: var(--strct-card-py, var(--space-3)) var(--strct-card-px, var(--space-4));
        border-bottom: 1px solid var(--b1);
        font-size: 13px;
        font-weight: 600;
        color: var(--t1);
      }
      .strct-card__hicon {
        color: var(--t2);
        flex-shrink: 0;
      }
      .strct-card__collapse {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        margin: -4px;
        margin-inline-start: 0;
        padding: 0;
        border: 0;
        border-radius: var(--radius-sm);
        background: transparent;
        color: var(--t3);
        cursor: pointer;
        flex-shrink: 0;
      }
      .strct-card__collapse:hover {
        color: var(--t1);
        background: var(--bg-3);
      }
      .strct-card__collapse:focus-visible {
        outline: none;
        box-shadow: 0 0 0 2px var(--acc50);
      }
      .strct-card__collapse strct-icon {
        transition: transform 0.15s ease;
      }
      .strct-card__chev--collapsed {
        transform: rotate(-90deg);
      }
      @media (prefers-reduced-motion: reduce) {
        .strct-card__collapse strct-icon {
          transition: none;
        }
      }
    `,
  ],
})
export class StrctCardHeader {
  /** Optional leading icon (StrctIcon set). */
  readonly icon = input('');
  /** Accessible labels for the collapse toggle (localizable). */
  readonly collapseLabel = input('Collapse');
  readonly expandLabel = input('Expand');

  protected readonly card = inject(StrctCard, { optional: true });
}

/** Body section of a {@link StrctCard}. */
@Component({
  selector: 'strct-card-block',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `<ng-content />`,
  host: { class: 'strct-card__block' },
  styles: [
    `
      .strct-card__block {
        display: block;
        padding: var(--strct-card-pb, var(--space-4)) var(--strct-card-px, var(--space-4));
        color: var(--t2);
        font-size: 13px;
      }
    `,
  ],
})
export class StrctCardBlock {}

/** Footer section of a {@link StrctCard}. */
@Component({
  selector: 'strct-card-footer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `<ng-content />`,
  host: { class: 'strct-card__footer' },
  styles: [
    `
      .strct-card__footer {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: var(--space-2);
        padding: var(--strct-card-py, var(--space-3)) var(--strct-card-px, var(--space-4));
        border-top: 1px solid var(--b1);
        background: var(--bg-2);
      }
    `,
  ],
})
export class StrctCardFooter {}
