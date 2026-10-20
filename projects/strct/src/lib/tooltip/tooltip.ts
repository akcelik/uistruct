import {
  DOCUMENT,
  Directive,
  ElementRef,
  HostListener,
  OnDestroy,
  Renderer2,
  inject,
  input,
} from '@angular/core';

/** Tooltip placement relative to the host element. */
export type StrctTooltipPosition = 'top' | 'bottom' | 'left' | 'right';

let tooltipCounter = 0;

/**
 * Raises the tooltip bubble beside `host` and returns the handle that takes it
 * down. Shared, because a component that owns a reason of its own —
 * `strct-button [disabledReason]` — must not apply `[strctTooltip]` to its own
 * host: the same directive twice on one element is an error.
 */
export function strctShowTooltip(
  host: HTMLElement,
  text: string,
  position: StrctTooltipPosition = 'top',
  doc: Document = document,
): { id: string; dispose: () => void } | null {
  if (!text) return null;
  const id = `strct-tt-${++tooltipCounter}`;
  const el = doc.createElement('span');
  el.id = id;
  el.setAttribute('role', 'tooltip');
  el.textContent = text;
  const s = el.style;
  s.position = 'fixed';
  s.zIndex = '1300';
  s.pointerEvents = 'none';
  s.whiteSpace = 'normal';
  s.maxInlineSize = '240px';
  s.padding = '5px 8px';
  s.fontSize = '11px';
  s.fontWeight = '500';
  s.lineHeight = '1.4';
  s.color = 'var(--t1)';
  s.background = 'var(--bg-0)';
  s.border = '1px solid var(--b3)';
  s.borderRadius = '5px';
  s.boxShadow = 'var(--shh)';
  s.top = '0';
  s.left = '0';
  s.visibility = 'hidden';
  // Appended to <body> so the fixed bubble cannot be trapped by a transformed
  // ancestor's containing block.
  doc.body.appendChild(el);
  placeTooltip(host, el, position);
  return {
    id,
    dispose: () => {
      el.remove();
    },
  };
}

/** Places a raised bubble beside its host, inside the viewport. */
export function placeTooltip(
  host: HTMLElement,
  el: HTMLElement,
  position: StrctTooltipPosition,
): void {
  const a = host.getBoundingClientRect();
  const w = el.offsetWidth;
  const h = el.offsetHeight;
  const gap = 7;
  let top: number;
  let left: number;

  switch (position) {
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

/**
 * Lightweight hover/focus tooltip. Renders a fixed-positioned bubble so it is
 * never clipped by an ancestor's `overflow`.
 *   <button strct-button strctTooltip="More info">?</button>
 */
@Directive({ selector: '[strctTooltip]' })
export class StrctTooltip implements OnDestroy {
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly renderer = inject(Renderer2);
  private readonly doc = inject(DOCUMENT);
  private readonly bubbleId = `strct-tt-${++tooltipCounter}`;
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
    this.renderer.setAttribute(el, 'id', this.bubbleId);
    this.renderer.setAttribute(el, 'role', 'tooltip');
    this.renderer.appendChild(el, this.renderer.createText(text));
    const s = el.style;
    s.position = 'fixed';
    s.zIndex = '1300';
    s.pointerEvents = 'none';
    s.whiteSpace = 'normal';
    s.maxInlineSize = '240px';
    s.padding = '5px 8px';
    s.fontSize = '11px';
    s.fontWeight = '500';
    s.lineHeight = '1.4';
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
    this.renderer.setAttribute(this.host.nativeElement, 'aria-describedby', this.bubbleId);
    this.bubble = el;
    this.place(el);
  }

  @HostListener('mouseleave')
  @HostListener('blur')
  protected hide(): void {
    if (this.bubble) {
      this.renderer.removeChild(this.doc.body, this.bubble);
      this.bubble = null;
      this.renderer.removeAttribute(this.host.nativeElement, 'aria-describedby');
    }
  }

  @HostListener('document:keydown.escape', ['$event'])
  protected onEscape(event: Event): void {
    if (!this.bubble) return;
    // Document-level: stopImmediatePropagation so a host modal/drawer with its
    // own document listener doesn't also see the Escape the tooltip consumed.
    event.stopImmediatePropagation();
    this.hide();
  }

  // The bubble is fixed and doesn't track position, so hide it on scroll
  // instead of leaving it stranded where the host used to be.
  @HostListener('document:scroll')
  protected onScroll(): void {
    this.hide();
  }

  ngOnDestroy(): void {
    this.hide();
  }

  private place(el: HTMLElement): void {
    placeTooltip(this.host.nativeElement, el, this.tooltipPosition());
  }
}
