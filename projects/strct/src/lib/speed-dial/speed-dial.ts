import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  ElementRef,
  HostListener,
  inject,
  input,
  signal,
} from '@angular/core';
import { StrctIcon } from '../icon/icon';
import { restoreFocus, saveFocusedElement } from '../overlay/focus';

/** Direction the speed-dial actions expand. */
export type StrctSpeedDialDirection = 'up' | 'down' | 'left' | 'right';

/**
 * Floating action button that fans out to reveal actions. Project icon buttons
 * (optionally with `strctTooltip`) as the actions.
 *   <strct-speed-dial icon="ellipsis" direction="up">
 *     <button strct-button iconOnly strctTooltip="Snapshot"><strct-icon name="snapshot" /></button>
 *     <button strct-button iconOnly strctTooltip="Restart"><strct-icon name="sync" /></button>
 *   </strct-speed-dial>
 */
@Component({
  selector: 'strct-speed-dial',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [StrctIcon],
  template: `
    <div class="strct-sd" [class]="'strct-sd--' + direction()">
      @if (open()) {
        <div class="strct-sd__actions" (click)="onActionClick()"><ng-content /></div>
      }
      <button
        type="button"
        class="strct-sd__fab"
        [class.strct-sd__fab--open]="open()"
        [attr.aria-expanded]="open()"
        [attr.aria-label]="ariaLabel()"
        (click)="toggle()"
      >
        <strct-icon [name]="icon()" [size]="18" [strokeWidth]="1.5" />
      </button>
    </div>
  `,
  host: { class: 'strct-sd-host' },
  styles: [
    `
      .strct-sd-host {
        display: inline-block;
      }
      .strct-sd {
        position: relative;
        display: inline-flex;
      }
      .strct-sd__fab {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 44px;
        height: 44px;
        border-radius: 50%;
        cursor: pointer;
        color: var(--inv);
        background: var(--acc);
        border: 0;
        box-shadow: var(--shh);
        transition:
          filter 0.14s ease,
          transform 0.16s ease;
      }
      .strct-sd__fab:hover {
        filter: brightness(1.08);
      }
      .strct-sd__fab--open {
        transform: rotate(45deg);
      }
      .strct-sd__actions {
        position: absolute;
        display: flex;
        gap: 10px;
        z-index: var(--z-sticky);
        animation: strct-sd-in 0.14s ease;
      }
      /* The projected icon buttons get a round, raised look. */
      .strct-sd__actions .strct-btn {
        border-radius: 50%;
        box-shadow: var(--sh);
        background: var(--bg-1);
      }
      .strct-sd--up .strct-sd__actions {
        flex-direction: column;
        bottom: calc(100% + 12px);
        left: 50%;
        transform: translateX(-50%);
      }
      .strct-sd--down .strct-sd__actions {
        flex-direction: column;
        top: calc(100% + 12px);
        left: 50%;
        transform: translateX(-50%);
      }
      .strct-sd--left .strct-sd__actions {
        flex-direction: row;
        right: calc(100% + 12px);
        top: 50%;
        transform: translateY(-50%);
      }
      .strct-sd--right .strct-sd__actions {
        flex-direction: row;
        left: calc(100% + 12px);
        top: 50%;
        transform: translateY(-50%);
      }
      @keyframes strct-sd-in {
        from {
          opacity: 0;
        }
      }
    `,
  ],
})
export class StrctSpeedDial {
  private readonly host = inject(ElementRef<HTMLElement>);
  /** Icon name. */
  readonly icon = input('ellipsis');
  /** Accessible name for the icon-only FAB. */
  readonly ariaLabel = input('Actions');
  /** Direction the actions fan out. */
  readonly direction = input<StrctSpeedDialDirection>('up');
  readonly open = signal(false);

  /** Trigger to hand focus back to on Escape close. */
  private trigger: HTMLElement | null = null;

  toggle(): void {
    if (!this.open()) this.trigger = saveFocusedElement();
    this.open.update((v) => !v);
  }

  /** Activating a projected action closes the dial (the FAB toggles itself). */
  protected onActionClick(): void {
    this.open.set(false);
  }

  @HostListener('document:click', ['$event'])
  protected onDocClick(event: MouseEvent): void {
    if (this.open() && !this.host.nativeElement.contains(event.target as Node)) {
      this.open.set(false);
    }
  }

  @HostListener('document:keydown.escape', ['$event'])
  protected onEscape(event: Event): void {
    if (!this.open()) return;
    // A host modal/drawer must not also close on the same Escape.
    event.stopPropagation();
    this.open.set(false);
    restoreFocus(this.trigger);
  }
}
