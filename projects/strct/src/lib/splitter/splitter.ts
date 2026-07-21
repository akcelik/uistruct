import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewEncapsulation,
  computed,
  inject,
  input,
  model,
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
      (mousedown)="onDragStart($event)"
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
    '[class.strct-split--dragging]': 'dragging',
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
  readonly vertical = input(false);
  /** Accessible name of the separator (localizable). */
  readonly gutterLabel = input('Resize panes');
  /** Keyboard nudge step in percent. */
  readonly step = input(3);

  protected readonly clamped = computed(() =>
    Math.min(this.max(), Math.max(this.min(), this.split())),
  );

  protected dragging = false;
  private moveHandler = (e: MouseEvent) => this.onDragMove(e);
  private upHandler = () => this.onDragEnd();

  protected onDragStart(event: MouseEvent): void {
    event.preventDefault();
    this.dragging = true;
    document.addEventListener('mousemove', this.moveHandler);
    document.addEventListener('mouseup', this.upHandler);
  }

  private onDragMove(event: MouseEvent): void {
    const rect = this.host.nativeElement.getBoundingClientRect();
    const ratio = this.vertical()
      ? (event.clientY - rect.top) / rect.height
      : (event.clientX - rect.left) / rect.width;
    this.split.set(Math.min(this.max(), Math.max(this.min(), Math.round(ratio * 100))));
  }

  private onDragEnd(): void {
    this.dragging = false;
    document.removeEventListener('mousemove', this.moveHandler);
    document.removeEventListener('mouseup', this.upHandler);
  }

  protected onKeydown(event: KeyboardEvent): void {
    const dec = this.vertical() ? 'ArrowUp' : 'ArrowLeft';
    const inc = this.vertical() ? 'ArrowDown' : 'ArrowRight';
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
