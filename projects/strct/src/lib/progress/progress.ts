import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  booleanAttribute,
  computed,
  input,
} from '@angular/core';
import { StrctThresholds } from '../status';

/** Progress bar color variants. `neutral` is the quiet one: queued, idle, unknown. */
export type StrctProgressStatus = 'neutral' | 'accent' | 'success' | 'warning' | 'critical';

/** One stacked fill of a multi-value bar (used now, plus what would arrive …). */
export interface StrctProgressSegment {
  value: number;
  status?: StrctProgressStatus;
  /** Names this part in the accessible text ("Used 61%, arriving 22%"). */
  label?: string;
}

/**
 * Horizontal value/usage bar. `<strct-progress [value]="72" status="warning" />`.
 *
 * **Meter mode.** A capacity bar says what it measures and how much, next to
 * the bar: `visibleLabel` puts `label` at the start of a row above the track,
 * `showValue` puts `valueText` (default `${value}%`) at its end, and `caption`
 * adds a quiet line under it. `segments` stacks more than one fill, and
 * `indeterminate` is a task that is running but reports no percentage. Every
 * one of these is off by default, so a plain bar renders exactly as before.
 */
@Component({
  selector: 'strct-progress',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    @if (visibleLabel() || (showValue() && valuePosition() === 'top')) {
      <div class="strct-progress__row">
        @if (visibleLabel()) {
          <span class="strct-progress__label">{{ label() }}</span>
        }
        @if (showValue() && valuePosition() === 'top') {
          <span class="strct-progress__value">{{ valueText() || clamped() + '%' }}</span>
        }
      </div>
    }
    <div
      class="strct-progress__track"
      role="progressbar"
      [attr.aria-label]="ariaLabel() || label() || 'Progress'"
      [attr.aria-valuenow]="indeterminate() ? null : clamped()"
      [attr.aria-valuetext]="valueDescription()"
      [attr.aria-valuemin]="indeterminate() ? null : 0"
      [attr.aria-valuemax]="indeterminate() ? null : 100"
    >
      @if (indeterminate()) {
        <div class="strct-progress__fill strct-progress__fill--indeterminate"></div>
      } @else if (stacked(); as parts) {
        @for (part of parts; track $index) {
          <div
            class="strct-progress__fill strct-progress__fill--{{ part.status }}"
            [style.width.%]="part.width"
          ></div>
        }
      } @else {
        <div class="strct-progress__fill" [style.width.%]="clamped()"></div>
      }
    </div>
    @if (showValue() && valuePosition() === 'end') {
      <!-- A bar in a cell wants its number beside the track, not above it. -->
      <span class="strct-progress__value strct-progress__value--end">{{
        valueText() || clamped() + '%'
      }}</span>
    }
    @if (caption()) {
      <p class="strct-progress__caption strct-progress__caption--{{ captionStatus() ?? 'none' }}">
        {{ caption() }}
      </p>
    }
  `,
  host: {
    class: 'strct-progress',
    '[class.strct-progress--neutral]': "resolvedStatus() === 'neutral'",
    '[class.strct-progress--success]': "resolvedStatus() === 'success'",
    '[class.strct-progress--warning]': "resolvedStatus() === 'warning'",
    '[class.strct-progress--critical]': "resolvedStatus() === 'critical'",
    '[class.strct-progress--endvalue]': "showValue() && valuePosition() === 'end'",
  },
  styles: [
    `
      .strct-progress {
        display: block;
      }
      .strct-progress__row {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: var(--space-2);
        margin-block-end: 4px;
        font-size: var(--text-sm);
      }
      .strct-progress__label {
        color: var(--t2);
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .strct-progress__value {
        color: var(--t1);
        font-variant-numeric: tabular-nums;
        white-space: nowrap;
      }
      .strct-progress__caption {
        margin: 4px 0 0;
        font-size: var(--text-sm);
        line-height: 1.5;
        color: var(--t3);
      }
      .strct-progress__caption--accent {
        color: var(--acc);
      }
      .strct-progress__caption--success {
        color: var(--success);
      }
      .strct-progress__caption--warning {
        color: var(--warning);
      }
      .strct-progress__caption--critical {
        color: var(--critical);
      }
      /* valuePosition: 'end' — the host becomes a row so the number sits
         beside the track it belongs to, in a cell that has no room above. */
      .strct-progress--endvalue {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        flex-wrap: wrap;
      }
      .strct-progress--endvalue .strct-progress__track {
        flex: 1;
        min-width: 0;
      }
      .strct-progress__value--end {
        flex: none;
        font-size: var(--text-sm);
        color: var(--t2);
        font-variant-numeric: tabular-nums;
      }
      .strct-progress--endvalue .strct-progress__caption,
      .strct-progress--endvalue .strct-progress__row {
        flex-basis: 100%;
      }
      .strct-progress__track {
        position: relative;
        display: flex;
        height: 6px;
        border-radius: var(--radius-sm);
        /* FR-47-01: a fixed surface token (--bg-3) equals the ground the bar
           sits on in some places — a datagrid row in the dark theme is exactly
           --bg-3 — and the track vanished, leaving a dash with nothing to
           measure it against. A tint of the FOREGROUND steps off any surface
           the library places the bar on, and the hairline ring keeps the full
           length readable even where the tint is subtle. Override the token to
           pin a specific colour. */
        background: var(--strct-progress-track, color-mix(in srgb, var(--t1) 12%, transparent));
        box-shadow: inset 0 0 0 1px var(--b2);
        overflow: hidden;
      }
      .strct-progress__fill {
        height: 100%;
        border-radius: var(--radius-sm);
        background: var(--acc);
        transition: width 0.3s ease;
      }
      .strct-progress--neutral .strct-progress__fill {
        background: var(--t3);
      }
      .strct-progress--success .strct-progress__fill {
        background: var(--success);
      }
      .strct-progress--warning .strct-progress__fill {
        background: var(--warning);
      }
      .strct-progress--critical .strct-progress__fill {
        background: var(--critical);
      }
      /* A segment's own tone wins over the bar's, whatever the host class. */
      .strct-progress .strct-progress__fill--neutral {
        background: var(--t3);
      }
      .strct-progress .strct-progress__fill--accent {
        background: var(--acc);
      }
      .strct-progress .strct-progress__fill--success {
        background: var(--success);
      }
      .strct-progress .strct-progress__fill--warning {
        background: var(--warning);
      }
      .strct-progress .strct-progress__fill--critical {
        background: var(--critical);
      }
      /* Stacked fills meet edge to edge; only the ends are rounded. */
      .strct-progress__track .strct-progress__fill + .strct-progress__fill {
        border-start-start-radius: 0;
        border-end-start-radius: 0;
      }
      /* Two classes: a tone rule (.strct-progress--neutral .strct-progress__fill)
         would otherwise outrank a single-class one and take the fill back. */
      .strct-progress .strct-progress__fill--indeterminate {
        width: 35%;
        animation: strct-progress-sweep 1.1s ease-in-out infinite;
      }
      @keyframes strct-progress-sweep {
        from {
          transform: translateX(-120%);
        }
        to {
          transform: translateX(340%);
        }
      }
      /* Reduced motion: a static striped fill still says "running", without
         anything moving. */
      @media (prefers-reduced-motion: reduce) {
        .strct-progress .strct-progress__fill--indeterminate {
          width: 100%;
          animation: none;
          background: repeating-linear-gradient(
            135deg,
            var(--acc) 0 6px,
            color-mix(in srgb, var(--acc) 45%, transparent) 6px 12px
          );
        }
      }
    `,
  ],
})
export class StrctProgress {
  /** Current value. */
  readonly value = input(0);
  /** Accessible name of the bar (e.g. "CPU usage"). Falls back to "Progress". */
  readonly label = input('');
  /** Visual status color. */
  readonly status = input<StrctProgressStatus>('accent');
  /** Show `label` above the bar as well as announcing it. */
  readonly visibleLabel = input(false, { transform: booleanAttribute });
  /** Show the value at the end of the row above the bar. */
  readonly showValue = input(false, { transform: booleanAttribute });
  /** What `showValue` prints — "293 GB of 512 GB". Defaults to `${value}%`. */
  readonly valueText = input('');
  /** A quiet line under the bar — "219 GB free across 2 nodes". */
  readonly caption = input('');
  /**
   * The caption's tone. A critical capacity line's note — "2 GB left after the
   * tightest node" — is the warning; `--t3` says it is an aside.
   */
  readonly captionStatus = input<StrctProgressStatus | null>(null);
  /**
   * The bar's accessible name, when the visible `label` is not it: a column of
   * per-cluster memory bars would otherwise all be named "Memory". Defaults to
   * `label`.
   */
  readonly ariaLabel = input('');
  /**
   * Where `showValue` puts the number: on its own row above the track, or
   * beside it — which is what a bar inside a table cell wants.
   */
  readonly valuePosition = input<'top' | 'end'>('top');
  /** Running, but with no percentage to report. */
  readonly indeterminate = input(false, { transform: booleanAttribute });
  /** Stack several fills (used now + what would arrive); clamped to 100 total. */
  readonly segments = input<StrctProgressSegment[] | null>(null);
  /**
   * Optional value-driven thresholds. When set, the component picks its own
   * status from the value instead of the caller computing it: `value >= critical`
   * → critical, `>= warning` → warning, else the healthy base. The healthy base is
   * `status` when it has been set to a semantic tone, or `'success'` when `status`
   * is left at its default `'accent'`.
   */
  readonly thresholds = input<StrctThresholds | null>(null);

  protected readonly clamped = computed(() => Math.max(0, Math.min(100, this.value())));

  /** Segments as widths that together never exceed the track. */
  protected readonly stacked = computed(() => {
    const segments = this.segments();
    if (!segments?.length) return null;
    let left = 100;
    return segments.map((s) => {
      const width = Math.max(0, Math.min(s.value, left));
      left -= width;
      return { width, status: s.status ?? this.resolvedStatus() };
    });
  });

  /** What a screen reader reads instead of the bare number. */
  protected readonly valueDescription = computed(() => {
    if (this.indeterminate()) return 'In progress';
    const segments = this.segments();
    if (segments?.length) {
      return segments.map((s) => `${s.label ? s.label + ' ' : ''}${s.value}%`).join(', ');
    }
    return this.valueText() || null;
  });

  /** Status after applying thresholds (falls back to `status` when none set). */
  protected readonly resolvedStatus = computed<StrctProgressStatus>(() => {
    const t = this.thresholds();
    if (!t) return this.status();
    const v = this.value();
    if (t.critical != null && v >= t.critical) return 'critical';
    if (t.warning != null && v >= t.warning) return 'warning';
    const base = this.status();
    return base === 'accent' ? 'success' : base;
  });
}
