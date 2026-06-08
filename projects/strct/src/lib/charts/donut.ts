import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
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

/**
 * Donut / ring chart from weighted segments.
 *   <strct-donut [segments]="[{value:6,label:'Running'},{value:2,label:'Off'}]"
 *                centerValue="8" centerLabel="VMs" />
 */
@Component({
  selector: 'strct-donut',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="strct-donut__wrap" [style.width.px]="size()" [style.height.px]="size()">
      <svg
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
              [attr.cx]="half()"
              [attr.cy]="half()"
              [attr.r]="radius()"
              fill="none"
              [attr.stroke]="arc.color"
              [attr.stroke-width]="thickness()"
              [attr.stroke-dasharray]="arc.len + ' ' + (circumference() - arc.len)"
              [attr.stroke-dashoffset]="-arc.offset"
            />
          }
        </g>
      </svg>
      @if (centerValue() || centerLabel()) {
        <div class="strct-donut__center">
          <div class="strct-donut__value">{{ centerValue() }}</div>
          <div class="strct-donut__label">{{ centerLabel() }}</div>
        </div>
      }
    </div>
  `,
  host: { class: 'strct-donut' },
  styles: [
    `
      .strct-donut {
        display: inline-block;
      }
      .strct-donut__wrap {
        position: relative;
      }
      .strct-donut__track {
        stroke: var(--bg-3);
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
        font-size: 20px;
        font-weight: 600;
        color: var(--t1);
        line-height: 1;
      }
      .strct-donut__label {
        font-size: 12px;
        color: var(--t2);
        margin-top: 2px;
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
  /** Value shown in the donut center. */
  readonly centerValue = input<string | number>('');
  /** Label shown in the donut center. */
  readonly centerLabel = input('');

  protected readonly half = computed(() => this.size() / 2);
  protected readonly radius = computed(() => (this.size() - this.thickness()) / 2);
  protected readonly circumference = computed(() => 2 * Math.PI * this.radius());

  protected readonly arcs = computed(() => {
    const segs = this.segments();
    const total = segs.reduce((s, x) => s + Math.max(0, x.value), 0) || 1;
    const c = this.circumference();
    let offset = 0;
    return segs.map((seg, i) => {
      const len = (Math.max(0, seg.value) / total) * c;
      const arc = { color: seg.color ?? PALETTE[i % PALETTE.length], len, offset };
      offset += len;
      return arc;
    });
  });
}
