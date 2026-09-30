import {
  DestroyRef,
  Directive,
  ElementRef,
  booleanAttribute,
  computed,
  inject,
  input,
  model,
  signal,
} from '@angular/core';

/**
 * The splitter's gutter, for layouts the splitter does not own — a shell grid,
 * a docked panel. It draws the library's grip and brings the separator
 * semantics with it: `role="separator"`, a tab stop, arrows that step, Home and
 * End for the bounds, and Enter to collapse when `collapsible`.
 *
 *   <div [strctResizeHandle]="'y'" [(size)]="panelHeight" [min]="120" [max]="600"
 *        aria-label="Resize the task panel"></div>
 *
 * The consumer owns the size — the handle only reports it, so the value can be
 * persisted, clamped or animated as the layout needs.
 */
@Directive({
  selector: '[strctResizeHandle]',
  host: {
    class: 'strct-resize',
    role: 'separator',
    tabindex: '0',
    '[class.strct-resize--y]': "axis() === 'y'",
    '[class.strct-resize--dragging]': 'dragging()',
    '[attr.aria-orientation]': "axis() === 'y' ? 'horizontal' : 'vertical'",
    '[attr.aria-valuenow]': 'size()',
    '[attr.aria-valuemin]': 'min()',
    '[attr.aria-valuemax]': 'max()',
    '[attr.aria-expanded]': 'collapsible() ? !collapsed() : null',
    '(pointerdown)': 'onDown($event)',
    '(keydown)': 'onKeydown($event)',
  },
})
export class StrctResizeHandle {
  /** Which axis the handle resizes along: `'x'` (default) or `'y'`. */
  readonly axis = input<'x' | 'y'>('x', { alias: 'strctResizeHandle' });
  /** The size being dragged, in px (two-way). */
  readonly size = model(240);
  /** Bounds, in px. */
  readonly min = input(0);
  readonly max = input(Number.POSITIVE_INFINITY);
  /** Arrow-key step in px; Shift multiplies it by four. */
  readonly step = input(16);
  /** Enter collapses the pane the handle sizes. */
  readonly collapsible = input(false, { transform: booleanAttribute });
  /** Whether it is collapsed (two-way). */
  readonly collapsed = model(false);
  /**
   * Which side of the handle the sized pane is on. `'before'` (default) grows
   * the pane as the pointer moves toward the inline/block end.
   */
  readonly side = input<'before' | 'after'>('before');

  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
  protected readonly dragging = signal(false);
  private origin = 0;
  private originSize = 0;

  private readonly rtl = computed(
    () => getComputedStyle(this.el.nativeElement).direction === 'rtl',
  );

  private readonly move = (e: PointerEvent) => this.onMove(e);
  private readonly up = () => this.onUp();

  constructor() {
    inject(DestroyRef).onDestroy(() => this.detach());
  }

  protected onDown(event: PointerEvent): void {
    event.preventDefault();
    this.el.nativeElement.setPointerCapture?.(event.pointerId);
    this.origin = this.axis() === 'y' ? event.clientY : event.clientX;
    this.originSize = this.size();
    this.dragging.set(true);
    document.addEventListener('pointermove', this.move);
    document.addEventListener('pointerup', this.up);
    document.addEventListener('pointercancel', this.up);
  }

  private onMove(event: PointerEvent): void {
    let delta = (this.axis() === 'y' ? event.clientY : event.clientX) - this.origin;
    // Pointer coordinates are physical; the pane is logical.
    if (this.axis() === 'x' && this.rtl()) delta = -delta;
    if (this.side() === 'after') delta = -delta;
    if (this.collapsed()) this.collapsed.set(false);
    this.commit(this.originSize + delta);
  }

  private onUp(): void {
    this.dragging.set(false);
    this.detach();
  }

  private detach(): void {
    document.removeEventListener('pointermove', this.move);
    document.removeEventListener('pointerup', this.up);
    document.removeEventListener('pointercancel', this.up);
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (this.collapsible() && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      this.collapsed.update((v) => !v);
      return;
    }
    let dec = this.axis() === 'y' ? 'ArrowUp' : 'ArrowLeft';
    let inc = this.axis() === 'y' ? 'ArrowDown' : 'ArrowRight';
    if (this.axis() === 'x' && this.rtl()) [dec, inc] = [inc, dec];
    if (this.side() === 'after') [dec, inc] = [inc, dec];
    const step = this.step() * (event.shiftKey ? 4 : 1);
    let next: number | null = null;
    if (event.key === dec) next = this.size() - step;
    else if (event.key === inc) next = this.size() + step;
    else if (event.key === 'Home') next = this.min();
    else if (event.key === 'End')
      next = Number.isFinite(this.max()) ? this.max() : this.size() + step * 4;
    if (next == null) return;
    event.preventDefault();
    if (this.collapsed()) this.collapsed.set(false);
    this.commit(next);
  }

  private commit(value: number): void {
    this.size.set(Math.round(Math.min(this.max(), Math.max(this.min(), value))));
  }
}
