import {
  Directive,
  ElementRef,
  NgZone,
  OnDestroy,
  Renderer2,
  afterNextRender,
  inject,
  input,
} from '@angular/core';

export type StrctOverlayPlacement =
  | 'bottom-start'
  | 'bottom-end'
  | 'top-start'
  | 'top-end'
  | 'right'
  | 'left';

/**
 * Positions an overlay panel with `position: fixed` relative to an anchor
 * element, so it escapes any ancestor's `overflow: hidden/scroll` clipping.
 * Repositions on scroll/resize and flips vertically near the viewport edge.
 *
 *   <button #trigger>…</button>
 *   <div class="menu" [strctOverlay]="trigger" strctOverlayPlacement="bottom-end">…</div>
 *
 * Apply it to the panel element that lives inside an `@if (open())` block; it
 * cleans up its listeners when that block is torn down.
 */
@Directive({ selector: '[strctOverlay]' })
export class StrctOverlay implements OnDestroy {
  private readonly el = inject(ElementRef<HTMLElement>).nativeElement as HTMLElement;
  private readonly renderer = inject(Renderer2);
  private readonly zone = inject(NgZone);

  readonly anchor = input.required<HTMLElement>({ alias: 'strctOverlay' });
  readonly placement = input<StrctOverlayPlacement>('bottom-start', {
    alias: 'strctOverlayPlacement',
  });
  /** Match the panel width to the anchor (combobox / date / cascade fields). */
  readonly matchWidth = input(false, { alias: 'strctOverlayMatchWidth' });
  readonly gap = input(5, { alias: 'strctOverlayGap' });

  private readonly onScrollResize = () => this.position();
  private bound = false;

  constructor() {
    const s = this.el.style;
    s.position = 'fixed';
    s.top = '0';
    s.left = '0';
    s.right = 'auto';
    s.bottom = 'auto';
    s.margin = '0';
    afterNextRender(() => {
      this.position();
      this.zone.runOutsideAngular(() => {
        window.addEventListener('scroll', this.onScrollResize, true);
        window.addEventListener('resize', this.onScrollResize);
        this.bound = true;
      });
    });
  }

  /** Recompute and apply the fixed coordinates. */
  position(): void {
    const anchor = this.anchor();
    if (!anchor) return;
    const a = anchor.getBoundingClientRect();
    const el = this.el;
    if (this.matchWidth()) el.style.width = `${a.width}px`;

    const w = el.offsetWidth;
    const h = el.offsetHeight;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const gap = this.gap();
    const p = this.placement();
    const margin = 4;

    let top: number;
    let left: number;

    if (p === 'right') {
      left = a.right + gap;
      top = a.top;
    } else if (p === 'left') {
      left = a.left - gap - w;
      top = a.top;
    } else {
      // bottom-* / top-*
      const below = p.startsWith('bottom');
      top = below ? a.bottom + gap : a.top - gap - h;
      // vertical flip when it would overflow the viewport
      if (below && top + h > vh - margin && a.top - gap - h > margin) {
        top = a.top - gap - h;
      } else if (!below && top < margin && a.bottom + gap + h < vh - margin) {
        top = a.bottom + gap;
      }
      left = p.endsWith('end') ? a.right - w : a.left;
    }

    left = Math.max(margin, Math.min(left, vw - w - margin));
    top = Math.max(margin, Math.min(top, vh - h - margin));

    el.style.left = `${Math.round(left)}px`;
    el.style.top = `${Math.round(top)}px`;
  }

  ngOnDestroy(): void {
    if (this.bound) {
      window.removeEventListener('scroll', this.onScrollResize, true);
      window.removeEventListener('resize', this.onScrollResize);
    }
  }
}
