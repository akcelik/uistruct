import {
  DOCUMENT,
  Directive,
  ElementRef,
  HostListener,
  Renderer2,
  inject,
  input,
} from '@angular/core';

/** Tooltip placement relative to the host element. */
export type StrctTooltipPosition = 'top' | 'bottom' | 'left' | 'right';

/**
 * Lightweight hover/focus tooltip. Renders a fixed-positioned bubble so it is
 * never clipped by an ancestor's `overflow`.
 *   <button strct-button strctTooltip="More info">?</button>
 */
@Directive({ selector: '[strctTooltip]' })
export class StrctTooltip {
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly renderer = inject(Renderer2);
  private readonly doc = inject(DOCUMENT);
  private bubble: HTMLElement | null = null;

  /** Tooltip text. */
  readonly strctTooltip = input.required<string>();
  /** Tooltip placement relative to the host. */
  readonly tooltipPosition = input<StrctTooltipPosition>('top');

  @HostListener('mouseenter')
  @HostListener('focus')
  protected show(): void {
    const text = this.strctTooltip();
    if (!text || this.bubble) return;

    const el = this.renderer.createElement('span') as HTMLElement;
    this.renderer.appendChild(el, this.renderer.createText(text));
    const s = el.style;
    s.position = 'fixed';
    s.zIndex = '1300';
    s.pointerEvents = 'none';
    s.whiteSpace = 'nowrap';
    s.padding = '5px 8px';
    s.fontSize = '11px';
    s.fontWeight = '500';
    s.lineHeight = '1';
    s.color = 'var(--t1)';
    s.background = 'var(--bg-0)';
    s.border = '1px solid var(--b3)';
    s.borderRadius = '5px';
    s.boxShadow = 'var(--shh)';
    s.top = '0';
    s.left = '0';
    s.visibility = 'hidden';

    // Append to <body> so the fixed bubble can't be trapped by a transformed
    // ancestor's containing block (e.g. a translated speed-dial / animation).
    this.renderer.appendChild(this.doc.body, el);
    this.bubble = el;
    this.place(el);
  }

  @HostListener('mouseleave')
  @HostListener('blur')
  protected hide(): void {
    if (this.bubble) {
      this.renderer.removeChild(this.doc.body, this.bubble);
      this.bubble = null;
    }
  }

  private place(el: HTMLElement): void {
    const a = this.host.nativeElement.getBoundingClientRect();
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    const gap = 7;
    let top: number;
    let left: number;

    switch (this.tooltipPosition()) {
      case 'bottom':
        top = a.bottom + gap;
        left = a.left + a.width / 2 - w / 2;
        break;
      case 'left':
        left = a.left - gap - w;
        top = a.top + a.height / 2 - h / 2;
        break;
      case 'right':
        left = a.right + gap;
        top = a.top + a.height / 2 - h / 2;
        break;
      default:
        top = a.top - gap - h;
        left = a.left + a.width / 2 - w / 2;
    }

    const m = 4;
    left = Math.max(m, Math.min(left, window.innerWidth - w - m));
    top = Math.max(m, Math.min(top, window.innerHeight - h - m));
    el.style.left = `${Math.round(left)}px`;
    el.style.top = `${Math.round(top)}px`;
    el.style.visibility = 'visible';
  }
}
