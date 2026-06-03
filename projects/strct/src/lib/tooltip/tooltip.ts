import { Directive, ElementRef, HostListener, Renderer2, inject, input } from '@angular/core';

export type StrctTooltipPosition = 'top' | 'bottom' | 'left' | 'right';

/**
 * Lightweight hover/focus tooltip with no overlay dependency. Renders a small
 * bubble as a child of the host (which is made `position: relative`).
 *   <button strct-button strctTooltip="More info">?</button>
 */
@Directive({
  selector: '[strctTooltip]',
  host: { '[style.position]': '"relative"' },
})
export class StrctTooltip {
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly renderer = inject(Renderer2);
  private bubble: HTMLElement | null = null;

  readonly strctTooltip = input.required<string>();
  readonly tooltipPosition = input<StrctTooltipPosition>('top');

  @HostListener('mouseenter')
  @HostListener('focus')
  protected show(): void {
    const text = this.strctTooltip();
    if (!text || this.bubble) return;

    const el = this.renderer.createElement('span') as HTMLElement;
    this.renderer.appendChild(el, this.renderer.createText(text));
    const s = el.style;
    s.position = 'absolute';
    s.zIndex = '500';
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
    this.position(s, this.tooltipPosition());

    this.renderer.appendChild(this.host.nativeElement, el);
    this.bubble = el;
  }

  @HostListener('mouseleave')
  @HostListener('blur')
  protected hide(): void {
    if (this.bubble) {
      this.renderer.removeChild(this.host.nativeElement, this.bubble);
      this.bubble = null;
    }
  }

  private position(s: CSSStyleDeclaration, pos: StrctTooltipPosition): void {
    const gap = '7px';
    switch (pos) {
      case 'bottom':
        s.top = `calc(100% + ${gap})`;
        s.left = '50%';
        s.transform = 'translateX(-50%)';
        break;
      case 'left':
        s.right = `calc(100% + ${gap})`;
        s.top = '50%';
        s.transform = 'translateY(-50%)';
        break;
      case 'right':
        s.left = `calc(100% + ${gap})`;
        s.top = '50%';
        s.transform = 'translateY(-50%)';
        break;
      default:
        s.bottom = `calc(100% + ${gap})`;
        s.left = '50%';
        s.transform = 'translateX(-50%)';
    }
  }
}
