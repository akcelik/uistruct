import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  booleanAttribute,
  input,
} from '@angular/core';
import { StrctIcon } from '../icon/icon';
import { StrctStatus } from '../status';
import { StrctStatusDot } from '../status-dot/status-dot';

/** One row in a `StrctDescriptionList` when driven by the `items` input. */
export interface StrctDescItem {
  label: string;
  value?: string | number;
  /** Render the value in the monospace face. */
  mono?: boolean;
  /** Dim the value (secondary information). */
  muted?: boolean;
}

/**
 * Value alignment for the stacked (non-inline) layout. `grid` gives the list
 * one label column sized to its longest label, so every value starts on the
 * same vertical line — what a hand-built `auto 1fr` grid is usually for.
 */
export type StrctDescAlign = 'between' | 'start' | 'grid';

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
    <dl class="strct-dl__list">
      @for (item of items(); track $index) {
        <div
          class="strct-desc"
          [class.strct-desc--mono]="item.mono"
          [class.strct-desc--muted]="item.muted"
        >
          <dt class="strct-desc__label">{{ item.label }}</dt>
          <dd class="strct-desc__value">{{ item.value }}</dd>
        </div>
      }
      <ng-content />
    </dl>
  `,
  host: {
    class: 'strct-dl',
    '[class.strct-dl--inline]': 'inline()',
    '[class.strct-dl--start]': "align() === 'start'",
    '[class.strct-dl--grid]': "align() === 'grid'",
    '[style.--strct-dl-label-w]': 'labelWidth()',
  },
  styles: [
    `
      .strct-dl {
        display: flex;
        flex-direction: column;
        min-width: 0;
      }
      .strct-dl__list {
        display: flex;
        flex-direction: column;
        margin: 0;
        padding: 0;
        min-width: 0;
      }
      .strct-dl--inline .strct-dl__list {
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
        margin: 0;
        color: var(--t1);
        min-width: 0;
        text-align: end;
      }
      .strct-dl--inline .strct-desc__value,
      .strct-dl--start .strct-desc__value {
        text-align: start;
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

      /* ── grid: one label column, every value on one line ─────────
         The rows go display:contents so their dt / dd become the grid's own
         items; the hairline moves onto them for the same reason. */
      .strct-dl--grid .strct-dl__list {
        display: grid;
        grid-template-columns: var(--strct-dl-label-w, max-content) minmax(0, 1fr);
        column-gap: var(--space-4);
      }
      .strct-dl--grid .strct-desc {
        display: contents;
      }
      .strct-dl--grid .strct-desc__label,
      .strct-dl--grid .strct-desc__value {
        padding: 6px 0;
        text-align: start;
      }
      .strct-dl--grid .strct-desc + .strct-desc > .strct-desc__label,
      .strct-dl--grid .strct-desc + .strct-desc > .strct-desc__value {
        border-top: 1px solid var(--b1);
      }

      /* ── a fact that carries its state and a short note ──────────── */
      .strct-desc__label {
        display: inline-flex;
        align-items: center;
        gap: 6px;
      }
      .strct-desc__note {
        display: block;
        margin-top: 1px;
        font-size: var(--text-sm);
        color: var(--t3);
      }
      .strct-desc__note:empty {
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
  /** Fixes the label column of `align="grid"` (e.g. `'160px'`). */
  readonly labelWidth = input<string | null>(null);
}

/**
 * One projected `label → value` row inside a `<strct-description-list>`. The
 * value is whatever you project, so it can host a badge, icon or formatted text.
 *
 * Use **`<div strctDesc>`** inside a list: `<dl>` allows only `dt` / `dd` pairs
 * or `<div>` wrappers as children, so a `<strct-desc>` element between them is
 * invalid and assistive tech loses the pairing. `<strct-desc>` still works for a
 * row rendered outside a list.
 */
@Component({
  // Both spellings. `<strct-desc>` is the readable one, but a custom element
  // between `<dl>` and its `dt` / `dd` breaks the content model — axe reports
  // definition-list and dlitem — so inside a list, use `<div strctDesc>`, which
  // the model does allow. (`StrctInput` gained `strct-input` the same way.)
  selector: 'strct-desc, div[strctDesc]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [StrctIcon, StrctStatusDot],
  template: `
    <dt class="strct-desc__label">
      @if (status()) {
        <strct-status-dot size="sm" [status]="status()!" [label]="statusLabel()" />
      }
      @if (icon()) {
        <strct-icon [name]="icon()" [size]="14" />
      }
      {{ label() }}
    </dt>
    <dd class="strct-desc__value">
      <ng-content />
      @if (note()) {
        <span class="strct-desc__note">{{ note() }}</span>
      }
    </dd>
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
  /** A status dot before the label — "Agent · connected". */
  readonly status = input<StrctStatus | null>(null);
  /** Accessible text for that dot; empty falls back to the per-status default. */
  readonly statusLabel = input('');
  /** A leading icon before the label. */
  readonly icon = input('');
  /** A quiet second line under the value — "last seen 12 s ago". */
  readonly note = input('');
}
