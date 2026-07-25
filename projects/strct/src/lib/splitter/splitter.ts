import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  ViewEncapsulation,
  booleanAttribute,
  computed,
  inject,
  input,
  model,
  signal,
} from '@angular/core';

/**
 * Two resizable panes with a draggable gutter — master/detail layouts where
 * the split is the user's to own:
 *
 *   <strct-splitter [(split)]="pct" [min]="20" [max]="80">
 *     <div strctPaneStart>…list…</div>
 *     <div strctPaneEnd>…detail…</div>
 *   </strct-splitter>
 *
 * `split` is the start pane's share in percent (two-way, persistable).
 * The gutter is a keyboard separator: arrows nudge, Home/End jump to min/max.
 */
@Component({
  selector: 'strct-splitter',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="strct-split__pane" [style.flex-basis.%]="clamped()">
      <ng-content select="[strctPaneStart]" />
    </div>
    <div
      class="strct-split__gutter"
      role="separator"
      tabindex="0"
      [attr.aria-label]="gutterLabel()"
      [attr.aria-orientation]="vertical() ? 'horizontal' : 'vertical'"
      [attr.aria-valuenow]="clamped()"
      [attr.aria-valuemin]="min()"
      [attr.aria-valuemax]="max()"
      (pointerdown)="onDragStart($event)"
      (keydown)="onKeydown($event)"
    >
      <span class="strct-split__grip" aria-hidden="true"></span>
    </div>
    <div class="strct-split__pane strct-split__pane--end">
      <ng-content select="[strctPaneEnd]" />
    </div>
  `,
  host: {
    class: 'strct-split',
    '[class.strct-split--vertical]': 'vertical()',
    '[class.strct-split--dragging]': 'dragging()',
  },
  styles: [
    `
      .strct-split {
        display: flex;
        width: 100%;
        min-height: 0;
      }
      .strct-split--vertical {
        flex-direction: column;
      }
      .strct-split__pane {
        flex-grow: 0;
        flex-shrink: 0;
        overflow: auto;
        min-width: 0;
        min-height: 0;
      }
      .strct-split__pane--end {
        flex: 1 1 0;
      }
      .strct-split__gutter {
        flex: 0 0 auto;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 7px;
        cursor: col-resize;
        background: transparent;
        touch-action: none;
      }
      .strct-split--vertical > .strct-split__gutter {
        width: auto;
        height: 7px;
        cursor: row-resize;
      }
      .strct-split__gutter:hover,
      .strct-split--dragging > .strct-split__gutter {
        background: var(--acc18);
      }
      .strct-split__gutter:focus-visible {
        outline: 2px solid var(--acc50);
        outline-offset: -2px;
      }
      .strct-split__grip {
        width: 1.5px;
        height: 26px;
        border-radius: 1px;
        background: var(--b2);
      }
      .strct-split--vertical .strct-split__grip {
        width: 26px;
        height: 1.5px;
      }
      .strct-split--dragging {
        user-select: none;
      }
    `,
  ],
})
export class StrctSplitter {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  /** Start pane share in percent (two-way). */
  readonly split = model(50);
  /** Clamp bounds for the split (percent). */
  readonly min = input(15);
  readonly max = input(85);
  /** Stack panes vertically (gutter drags up/down). */
  readonly vertical = input(false, { transform: booleanAttribute });
  /** Accessible name of the separator (localizable). */
  readonly gutterLabel = input('Resize panes');
  /** Keyboard nudge step in percent. */
  readonly step = input(3);

  protected readonly clamped = computed(() =>
    Math.min(this.max(), Math.max(this.min(), this.split())),
  );

  protected readonly dragging = signal(false);
  private moveHandler = (e: PointerEvent) => this.onDragMove(e);
  private upHandler = () => this.onDragEnd();

  constructor() {
    // Remove document drag listeners if the component is destroyed mid-drag.
    inject(DestroyRef).onDestroy(() => this.removeDragListeners());
  }

  protected onDragStart(event: PointerEvent): void {
    event.preventDefault();
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    this.dragging.set(true);
    document.addEventListener('pointermove', this.moveHandler);
    document.addEventListener('pointerup', this.upHandler);
    document.addEventListener('pointercancel', this.upHandler);
  }

  private onDragMove(event: PointerEvent): void {
    const rect = this.host.nativeElement.getBoundingClientRect();
    // clientX/clientY are physical, but the start pane sits at the inline
    // start: in RTL a horizontal drag is measured from the rect's right edge.
    let ratio = this.vertical()
      ? (event.clientY - rect.top) / rect.height
      : (event.clientX - rect.left) / rect.width;
    if (!this.vertical() && this.isRtl()) ratio = 1 - ratio;
    this.split.set(Math.min(this.max(), Math.max(this.min(), Math.round(ratio * 100))));
  }

  private onDragEnd(): void {
    this.dragging.set(false);
    this.removeDragListeners();
  }

  private removeDragListeners(): void {
    document.removeEventListener('pointermove', this.moveHandler);
    document.removeEventListener('pointerup', this.upHandler);
    document.removeEventListener('pointercancel', this.upHandler);
  }

  /** Document direction — pointer coordinates and arrow keys are physical, panes are logical. */
  private isRtl(): boolean {
    return getComputedStyle(this.host.nativeElement).direction === 'rtl';
  }

  protected onKeydown(event: KeyboardEvent): void {
    let dec = this.vertical() ? 'ArrowUp' : 'ArrowLeft';
    let inc = this.vertical() ? 'ArrowDown' : 'ArrowRight';
    // RTL: the start pane extends to the left, so Left grows and Right shrinks.
    if (!this.vertical() && this.isRtl()) [dec, inc] = [inc, dec];
    let next: number | null = null;
    if (event.key === dec) next = this.clamped() - this.step();
    else if (event.key === inc) next = this.clamped() + this.step();
    else if (event.key === 'Home') next = this.min();
    else if (event.key === 'End') next = this.max();
    if (next == null) return;
    event.preventDefault();
    this.split.set(Math.min(this.max(), Math.max(this.min(), next)));
  }
}
