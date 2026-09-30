import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  booleanAttribute,
  computed,
  input,
  output,
} from '@angular/core';
import { StrctIcon } from '../icon/icon';
import { StrctSpinner } from '../spinner/spinner';

/** What the frame is showing instead of a picture. */
export type StrctMediaState = 'content' | 'loading' | 'empty' | 'off' | 'error';

const STATE_ICON: Record<Exclude<StrctMediaState, 'content' | 'loading'>, string> = {
  empty: 'monitor',
  off: 'stopped',
  error: 'warning',
};

/**
 * A live picture — a console thumbnail, a camera — sits in a fixed-ratio frame,
 * and when there is no picture yet, or none at all, the frame says why **in its
 * own small space**: an empty state is too large for a 240px card.
 *
 *   <strct-media-frame ratio="4 / 3"><img [src]="thumb" alt="" /></strct-media-frame>
 *   <strct-media-frame state="off" message="The VM is off" />
 */
@Component({
  selector: 'strct-media-frame',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [StrctIcon, StrctSpinner],
  template: `
    @if (state() === 'content') {
      <ng-content />
    } @else {
      <span class="strct-mf__placeholder">
        @if (state() === 'loading') {
          <strct-spinner size="sm" />
        } @else if (iconName()) {
          <strct-icon [name]="iconName()" [size]="20" />
        }
        @if (message()) {
          <span class="strct-mf__msg">{{ message() }}</span>
        }
      </span>
    }
    @if (interactive()) {
      <button
        type="button"
        class="strct-mf__hit"
        [attr.aria-label]="activateLabel() || message() || null"
        (click)="activated.emit()"
      ></button>
    }
  `,
  host: {
    class: 'strct-mf',
    '[style.aspect-ratio]': 'ratio()',
    '[attr.data-state]': 'state()',
    '[class.strct-mf--interactive]': 'interactive()',
    '[class.strct-mf--contain]': "fit() === 'contain'",
  },
  styles: [
    `
      .strct-mf {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        border: 1px solid var(--b2);
        border-radius: var(--radius-md);
        background: var(--bg-3);
        min-width: 0;
      }
      .strct-mf > img,
      .strct-mf > video,
      .strct-mf > canvas {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
      }
      /* fit="contain" — a console thumbnail shows the whole guest screen;
         cropping it loses the corner where the error is. */
      .strct-mf--contain > img,
      .strct-mf--contain > video,
      .strct-mf--contain > canvas {
        object-fit: contain;
      }
      /* A screen that is off is black, not grey — it reads as a screen. */
      .strct-mf[data-state='off'] {
        background: #000;
      }
      .strct-mf__placeholder {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
        padding: var(--space-2);
        color: var(--t3);
        text-align: center;
      }
      .strct-mf[data-state='off'] .strct-mf__placeholder {
        color: rgba(255, 255, 255, 0.6);
      }
      .strct-mf[data-state='error'] .strct-mf__placeholder {
        color: var(--critical);
      }
      .strct-mf__msg {
        font-size: var(--text-sm);
        line-height: 1.35;
      }
      /* One tab stop over the whole frame — the thumbnail is the button. */
      .strct-mf__hit {
        position: absolute;
        /* Over the border too, so the whole frame is the target. */
        inset: -1px;
        padding: 0;
        border: 0;
        background: none;
        cursor: pointer;
      }
      .strct-mf__hit:focus-visible {
        outline: 2px solid var(--acc50);
        outline-offset: 2px;
      }
      .strct-mf--interactive:hover {
        border-color: var(--b3);
      }
    `,
  ],
})
export class StrctMediaFrame {
  /** The frame's aspect ratio, as a CSS `aspect-ratio` value. */
  readonly ratio = input('4 / 3');
  /**
   * How the media fills the frame. `cover` crops to fill, as today; `contain`
   * shows all of it — what a console thumbnail needs, since the corner it
   * would crop is where the error is.
   */
  readonly fit = input<'cover' | 'contain'>('cover');
  /** What the frame shows: the projected picture, or why there is none. */
  readonly state = input<StrctMediaState>('content');
  /** The placeholder's line ("The VM is off"). */
  readonly message = input('');
  /** Overrides the icon derived from `state`. */
  readonly icon = input('');
  /** The whole frame becomes one tab stop that emits `activated`. */
  readonly interactive = input(false, { transform: booleanAttribute });
  /** The accessible name of that control; falls back to `message`. */
  readonly activateLabel = input('');
  /** The frame was activated. */
  readonly activated = output<void>();

  protected readonly iconName = computed(() => {
    const explicit = this.icon();
    if (explicit) return explicit;
    const state = this.state();
    return state === 'content' || state === 'loading' ? '' : STATE_ICON[state];
  });
}
