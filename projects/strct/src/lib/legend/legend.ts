import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  booleanAttribute,
  input,
  output,
} from '@angular/core';
import { StrctStatus } from '../status';

/** One row of a key: a swatch, what it is, and (often) how many. */
export interface StrctLegendItem {
  label: string;
  /** The count or reading shown at the row's end. */
  value?: string | number;
  /** Semantic tone — paints the swatch from the status tokens. */
  status?: StrctStatus;
  /** An explicit colour (a chart palette entry, `--c1`…), used over `status`. */
  color?: string;
  /** What the swatch looks like: a fill, a dot, a solid line, a dashed line. */
  shape?: 'square' | 'dot' | 'line' | 'dash';
  /** Quiet row — a category with nothing in it, which is still information. */
  muted?: boolean;
  /** Only with `interactive`: the row reads as switched off. */
  off?: boolean;
}

/**
 * A chart's key is a component. The same swatch · label · value rows serve a
 * line chart's series picker, a diagram's edge styles and a donut's categories
 * — instead of 9px squares with inline backgrounds written per screen.
 *
 *   <strct-legend [items]="series" orientation="vertical" />
 *   <strct-legend [items]="edges" interactive (itemToggle)="toggle($event)" />
 *
 * A category with zero items still belongs in the key: pass it `muted`, because
 * "0 failed" is information.
 */
@Component({
  selector: 'strct-legend',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <ul class="strct-legend__list" role="list">
      @for (item of items(); track item.label) {
        <li class="strct-legend__row" [class.strct-legend__row--muted]="item.muted">
          @if (interactive()) {
            <button
              type="button"
              class="strct-legend__hit"
              [attr.aria-pressed]="!item.off"
              (click)="itemToggle.emit(item.label)"
            >
              <span
                class="strct-legend__swatch strct-legend__swatch--{{ item.shape ?? 'square' }}"
                [style.--strct-legend-color]="swatchColor(item)"
                aria-hidden="true"
              ></span>
              <span class="strct-legend__label">{{ item.label }}</span>
              @if (item.value !== undefined) {
                <span class="strct-legend__value">{{ item.value }}</span>
              }
            </button>
          } @else {
            <span
              class="strct-legend__swatch strct-legend__swatch--{{ item.shape ?? 'square' }}"
              [style.--strct-legend-color]="swatchColor(item)"
              aria-hidden="true"
            ></span>
            <span class="strct-legend__label">{{ item.label }}</span>
            @if (item.value !== undefined) {
              <span class="strct-legend__value">{{ item.value }}</span>
            }
          }
        </li>
      }
    </ul>
  `,
  host: {
    class: 'strct-legend',
    '[class.strct-legend--vertical]': "orientation() === 'vertical'",
  },
  styles: [
    `
      .strct-legend {
        display: block;
        font-size: var(--text-sm);
        color: var(--t2);
      }
      .strct-legend__list {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-wrap: wrap;
        gap: 4px 14px;
      }
      .strct-legend--vertical .strct-legend__list {
        flex-direction: column;
        flex-wrap: nowrap;
        gap: 2px;
      }
      .strct-legend__row {
        display: flex;
        align-items: center;
        gap: 7px;
        min-width: 0;
      }
      /* A category with nothing in it stays in the key, quietly. */
      .strct-legend__row--muted {
        opacity: 0.55;
      }
      .strct-legend__hit {
        display: flex;
        align-items: center;
        gap: 7px;
        min-width: 0;
        padding: 2px 4px;
        margin: -2px -4px;
        border: 0;
        border-radius: var(--radius-sm);
        background: none;
        font: inherit;
        color: inherit;
        cursor: pointer;
      }
      .strct-legend__hit:hover {
        background: var(--bg-3);
      }
      .strct-legend__hit:focus-visible {
        outline: 2px solid var(--acc50);
        outline-offset: 1px;
      }
      /* Switched off: the row says so by going quiet, not by disappearing. */
      .strct-legend__hit[aria-pressed='false'] {
        opacity: 0.45;
      }
      .strct-legend__hit[aria-pressed='false'] .strct-legend__label {
        text-decoration: line-through;
      }
      .strct-legend__swatch {
        flex: none;
        background: var(--strct-legend-color, var(--t3));
      }
      .strct-legend__swatch--square {
        width: 9px;
        height: 9px;
        border-radius: 2px;
      }
      .strct-legend__swatch--dot {
        width: 9px;
        height: 9px;
        border-radius: 50%;
      }
      .strct-legend__swatch--line {
        width: 14px;
        height: 2px;
        border-radius: 1px;
      }
      /* A dashed edge reads as dashed in the key too. */
      .strct-legend__swatch--dash {
        width: 14px;
        height: 2px;
        background: repeating-linear-gradient(
          to right,
          var(--strct-legend-color, var(--t3)) 0 4px,
          transparent 4px 7px
        );
      }
      .strct-legend__label {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .strct-legend__value {
        margin-inline-start: auto;
        padding-inline-start: 8px;
        color: var(--t3);
        font-variant-numeric: tabular-nums;
      }
    `,
  ],
})
export class StrctLegend {
  /** The rows of the key. */
  readonly items = input.required<StrctLegendItem[]>();
  /** `vertical` stacks the rows and aligns their values. */
  readonly orientation = input<'horizontal' | 'vertical'>('horizontal');
  /** Rows become toggle buttons carrying `aria-pressed`. */
  readonly interactive = input(false, { transform: booleanAttribute });
  /** The label of the row that was toggled. */
  readonly itemToggle = output<string>();

  /** The status vocabulary's own tokens — 'accent' is `--acc`, not `--accent`. */
  private static readonly TONE: Record<StrctStatus, string> = {
    neutral: 'var(--t3)',
    accent: 'var(--acc)',
    success: 'var(--success)',
    warning: 'var(--warning)',
    critical: 'var(--critical)',
  };

  protected swatchColor(item: StrctLegendItem): string {
    return item.color ?? StrctLegend.TONE[item.status ?? 'accent'];
  }
}
