import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  booleanAttribute,
  input,
} from '@angular/core';

/** One row in a `StrctDescriptionList` when driven by the `items` input. */
export interface StrctDescItem {
  label: string;
  value?: string | number;
  /** Render the value in the monospace face. */
  mono?: boolean;
  /** Dim the value (secondary information). */
  muted?: boolean;
}

/** Value alignment for the stacked (non-inline) layout. */
export type StrctDescAlign = 'between' | 'start';

/**
 * Compact definition list: aligned `label : value` rows with an optional trailing
 * slot. The `inline` variant is the horizontal "stat strip" (label-value pairs in
 * a row). Replaces the hand-rolled `<dl>` + flex.
 *
 * Drive it with the `items` input, or project `<strct-desc>` rows so a value can
 * host a badge, icon or any rich content:
 *
 *   <strct-description-list>
 *     <strct-desc label="IPv4" mono>172.16.75.100/24</strct-desc>
 *     <strct-desc label="IPv6"><strct-badge status="success">Enabled</strct-badge></strct-desc>
 *   </strct-description-list>
 *
 *   <strct-description-list [items]="[{ label: 'Gateway', value: '172.16.75.2', mono: true }]" />
 */
@Component({
  selector: 'strct-description-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    @for (item of items(); track $index) {
      <div
        class="strct-desc"
        [class.strct-desc--mono]="item.mono"
        [class.strct-desc--muted]="item.muted"
      >
        <span class="strct-desc__label">{{ item.label }}</span>
        <span class="strct-desc__value">{{ item.value }}</span>
      </div>
    }
    <ng-content />
  `,
  host: {
    class: 'strct-dl',
    '[class.strct-dl--inline]': 'inline()',
    '[class.strct-dl--start]': "align() === 'start'",
  },
  styles: [
    `
      .strct-dl {
        display: flex;
        flex-direction: column;
        min-width: 0;
      }
      .strct-dl--inline {
        flex-direction: row;
        flex-wrap: wrap;
        gap: var(--space-3) var(--space-5);
        align-items: flex-start;
      }

      /* ── A single row / pair ──────────────────────────────────── */
      .strct-desc {
        display: flex;
        align-items: baseline;
        gap: var(--space-3);
        padding: 6px 0;
        font-size: var(--text-md);
        min-width: 0;
      }
      /* Stacked default: label left, value right. */
      .strct-dl:not(.strct-dl--inline) .strct-desc {
        justify-content: space-between;
      }
      .strct-dl:not(.strct-dl--inline) .strct-desc + .strct-desc {
        border-top: 1px solid var(--b1);
      }
      .strct-dl--start .strct-desc {
        justify-content: flex-start;
      }

      /* Inline stat strip: small label caption above the value. */
      .strct-dl--inline .strct-desc {
        flex-direction: column;
        align-items: flex-start;
        gap: 3px;
        padding: 0;
      }

      .strct-desc__label {
        color: var(--t3);
        font-size: var(--text-sm);
        font-weight: 500;
        flex-shrink: 0;
        white-space: nowrap;
      }
      .strct-desc__value {
        color: var(--t1);
        min-width: 0;
        text-align: right;
      }
      .strct-dl--inline .strct-desc__value,
      .strct-dl--start .strct-desc__value {
        text-align: left;
      }
      .strct-desc--mono .strct-desc__value {
        font-family: var(--mono);
        font-size: var(--text-sm);
      }
      .strct-desc--muted .strct-desc__value {
        color: var(--t3);
      }
      /* Collapse an empty value wrapper (e.g. items with no value). */
      .strct-desc__value:empty {
        display: none;
      }
    `,
  ],
})
export class StrctDescriptionList {
  /** Rows, as an alternative to projecting `<strct-desc>` children. */
  readonly items = input<StrctDescItem[]>([]);
  /** Horizontal stat-strip layout instead of stacked rows. */
  readonly inline = input(false, { transform: booleanAttribute });
  /** Value alignment in stacked mode. */
  readonly align = input<StrctDescAlign>('between');
}

/**
 * One projected `label → value` row inside a `<strct-description-list>`. The
 * value is whatever you project, so it can host a badge, icon or formatted text.
 */
@Component({
  selector: 'strct-desc',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <span class="strct-desc__label">{{ label() }}</span>
    <span class="strct-desc__value"><ng-content /></span>
  `,
  host: {
    class: 'strct-desc',
    '[class.strct-desc--mono]': 'mono()',
    '[class.strct-desc--muted]': 'muted()',
  },
})
export class StrctDesc {
  /** The row's label. */
  readonly label = input.required<string>();
  /** Render the projected value in the monospace face. */
  readonly mono = input(false, { transform: booleanAttribute });
  /** Dim the projected value. */
  readonly muted = input(false, { transform: booleanAttribute });
}
