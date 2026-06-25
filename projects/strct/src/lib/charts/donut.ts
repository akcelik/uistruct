import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  booleanAttribute,
  computed,
  input,
  signal,
} from '@angular/core';

/** A single weighted slice of a donut chart. */
export interface StrctDonutSegment {
  value: number;
  label?: string;
  color?: string;
}

const PALETTE = [
  'var(--acc)',
  'var(--success)',
  'var(--warning)',
  'var(--critical)',
  'var(--acc50)',
  'var(--t3)',
];

const round = (n: number): number => Math.round(n * 100) / 100;

/**
 * Donut / ring chart from weighted segments. Rounded, gapped slices with a
 * sweep-in animation; hover a slice (or its legend row) to highlight it and read
 * its value + share in the center. Dependency-free SVG, token-coloured.
 *
 *   <strct-donut
 *     [segments]="[{ value: 36, label: 'Running' }, { value: 8, label: 'Stopped' }]"
 *     centerValue="44" centerLabel="VMs" legend />
 */
@Component({
  selector: 'strct-donut',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="strct-donut__layout">
      <div class="strct-donut__wrap" [style.width.px]="size()" [style.height.px]="size()">
        <svg
          class="strct-donut__svg"
          [attr.viewBox]="'0 0 ' + size() + ' ' + size()"
          [style.width.px]="size()"
          [style.height.px]="size()"
        >
          <g [attr.transform]="'rotate(-90 ' + half() + ' ' + half() + ')'">
            <circle
              class="strct-donut__track"
              [attr.cx]="half()"
              [attr.cy]="half()"
              [attr.r]="radius()"
              fill="none"
              [attr.stroke-width]="thickness()"
            />
            @for (arc of arcs(); track $index) {
              <circle
                class="strct-donut__arc"
                [class.is-dim]="hovered() !== null && hovered() !== $index"
                [attr.cx]="half()"
                [attr.cy]="half()"
                [attr.r]="radius()"
                fill="none"
                stroke-linecap="round"
                [attr.stroke]="arc.color"
                [attr.stroke-width]="hovered() === $index ? thickness() + 5 : thickness()"
                [attr.stroke-dasharray]="arc.dash"
                [attr.stroke-dashoffset]="arc.offset"
                (pointerenter)="enter($index)"
                (pointerleave)="leave()"
              />
            }
          </g>
        </svg>
        @if (centerMain() || centerSub()) {
          <div class="strct-donut__center">
            <div class="strct-donut__value" [style.color]="centerColor()">{{ centerMain() }}</div>
            <div class="strct-donut__label">{{ centerSub() }}</div>
          </div>
        }
      </div>

      @if (legend()) {
        <ul class="strct-donut__legend">
          @for (arc of arcs(); track $index) {
            <li
              class="strct-donut__leg"
              [class.is-active]="hovered() === $index"
              [class.is-dim]="hovered() !== null && hovered() !== $index"
              (pointerenter)="enter($index)"
              (pointerleave)="leave()"
            >
              <span class="strct-donut__swatch" [style.background]="arc.color"></span>
              <span class="strct-donut__leg-label">{{ arc.label }}</span>
              <span class="strct-donut__leg-val">{{ arc.value }}</span>
              <span class="strct-donut__leg-pct">{{ arc.pct }}%</span>
            </li>
          }
        </ul>
      }
    </div>
  `,
  host: { class: 'strct-donut' },
  styles: [
    `
      .strct-donut {
        display: inline-block;
      }
      .strct-donut__layout {
        display: inline-flex;
        align-items: center;
        gap: 20px;
      }
      .strct-donut__wrap {
        position: relative;
        flex-shrink: 0;
      }
      .strct-donut__track {
        stroke: var(--bg-3);
      }
      .strct-donut__arc {
        cursor: pointer;
        transition:
          stroke-width 0.16s ease,
          opacity 0.16s ease;
      }
      .strct-donut__arc.is-dim {
        opacity: 0.32;
      }
      .strct-donut__center {
        position: absolute;
        inset: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        pointer-events: none;
      }
      .strct-donut__value {
        font-size: 22px;
        font-weight: 650;
        color: var(--t1);
        line-height: 1;
        font-variant-numeric: tabular-nums;
        transition: color 0.16s ease;
      }
      .strct-donut__label {
        font-size: 12px;
        color: var(--t2);
        margin-top: 3px;
      }

      /* Legend */
      .strct-donut__legend {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 2px;
        min-width: 0;
      }
      .strct-donut__leg {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 3px 6px;
        border-radius: var(--radius-sm);
        font-size: 12px;
        color: var(--t2);
        cursor: pointer;
        transition:
          background 0.14s ease,
          opacity 0.14s ease;
      }
      .strct-donut__leg.is-active {
        background: var(--bg-2);
        color: var(--t1);
      }
      .strct-donut__leg.is-dim {
        opacity: 0.45;
      }
      .strct-donut__swatch {
        width: 9px;
        height: 9px;
        border-radius: 2px;
        flex-shrink: 0;
      }
      .strct-donut__leg-label {
        flex: 1;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .strct-donut__leg-val {
        font-variant-numeric: tabular-nums;
        font-weight: 600;
        color: var(--t1);
      }
      .strct-donut__leg-pct {
        font-variant-numeric: tabular-nums;
        color: var(--t3);
        min-width: 34px;
        text-align: right;
      }

      @media (prefers-reduced-motion: no-preference) {
        .strct-donut__svg {
          transform-origin: center;
          animation: strct-donut-in 0.6s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
      }
      @keyframes strct-donut-in {
        from {
          opacity: 0;
          transform: rotate(-16deg) scale(0.94);
        }
        to {
          opacity: 1;
          transform: none;
        }
      }
    `,
  ],
})
export class StrctDonut {
  /** Weighted segments. */
  readonly segments = input.required<StrctDonutSegment[]>();
  /** Size variant. */
  readonly size = input(120);
  /** Stroke thickness in pixels. */
  readonly thickness = input(14);
  /** Value shown in the donut center (when no slice is hovered). */
  readonly centerValue = input<string | number>('');
  /** Label shown in the donut center (when no slice is hovered). */
  readonly centerLabel = input('');
  /** Show a legend (color · label · value · %) beside the ring. */
  readonly legend = input(false, { transform: booleanAttribute });
  /** Gap between slices, in degrees. */
  readonly gap = input(3);
  /** Hover highlight + center readout. */
  readonly interactive = input(true, { transform: booleanAttribute });

  protected readonly hovered = signal<number | null>(null);

  protected readonly half = computed(() => this.size() / 2);
  protected readonly radius = computed(() => (this.size() - this.thickness()) / 2);
  protected readonly circumference = computed(() => 2 * Math.PI * this.radius());

  private readonly total = computed(
    () => this.segments().reduce((s, x) => s + Math.max(0, x.value), 0) || 1,
  );

  protected readonly arcs = computed(() => {
    const segs = this.segments();
    const total = this.total();
    const c = this.circumference();
    // Gap (in px along the circumference) only when there is more than one slice.
    const gapPx = segs.length > 1 ? (this.gap() / 360) * c : 0;
    let cursor = 0;
    return segs.map((seg, i) => {
      const full = (Math.max(0, seg.value) / total) * c;
      const vis = Math.max(0, full - gapPx);
      const arc = {
        color: seg.color ?? PALETTE[i % PALETTE.length],
        label: seg.label ?? `Slice ${i + 1}`,
        value: seg.value,
        pct: Math.round((Math.max(0, seg.value) / total) * 100),
        dash: `${round(vis)} ${round(c - vis)}`,
        offset: round(-(cursor + gapPx / 2)),
      };
      cursor += full;
      return arc;
    });
  });

  protected readonly centerMain = computed(() => {
    const h = this.hovered();
    if (h !== null) return this.arcs()[h]?.value ?? '';
    return this.centerValue();
  });
  protected readonly centerSub = computed(() => {
    const h = this.hovered();
    if (h !== null) {
      const a = this.arcs()[h];
      return a ? `${a.label} · ${a.pct}%` : '';
    }
    return this.centerLabel();
  });
  protected readonly centerColor = computed(() => {
    const h = this.hovered();
    return h !== null ? (this.arcs()[h]?.color ?? 'var(--t1)') : 'var(--t1)';
  });

  protected enter(i: number): void {
    if (this.interactive()) this.hovered.set(i);
  }
  protected leave(): void {
    this.hovered.set(null);
  }
}
