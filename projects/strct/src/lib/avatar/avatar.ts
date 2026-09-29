import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
} from '@angular/core';
import { StrctIcon } from '../icon/icon';
import { StrctStatus } from '../status';

/** Avatar size variants. */
export type StrctAvatarSize = 'sm' | 'md' | 'lg';
/** Avatar presence status variants. */
export type StrctAvatarStatus = 'none' | 'online' | 'busy' | 'offline';

/**
 * Circular avatar: an image when `src` is set, otherwise initials from `name`.
 *   <strct-avatar name="Ada Lovelace" status="online" />
 */
@Component({
  selector: 'strct-avatar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [StrctIcon],
  template: `
    @if (src()) {
      <img class="strct-av__img" [src]="src()" [alt]="name()" />
    } @else if (icon()) {
      <!-- Not every avatar is a person with initials: a group, an assistant, a
           brand mark. -->
      <strct-icon class="strct-av__icon" [name]="icon()" [size]="iconSize()" />
    } @else {
      <span class="strct-av__initials">{{ initials() }}</span>
    }
    @if (status() !== 'none') {
      <span class="strct-av__status"></span>
    }
  `,
  host: {
    class: 'strct-av',
    '[class.strct-av--square]': "shape() === 'square'",
    '[attr.data-tone]': 'tone()',
    '[class.strct-av--sm]': "size() === 'sm'",
    '[class.strct-av--lg]': "size() === 'lg'",
    '[class.strct-av--online]': "status() === 'online'",
    '[class.strct-av--busy]': "status() === 'busy'",
    '[class.strct-av--offline]': "status() === 'offline'",
    '[attr.title]': 'name() || null',
  },
  styles: [
    `
      .strct-av {
        position: relative;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        border-radius: 50%;
        flex-shrink: 0;
        background: var(--bg-3);
        color: var(--t1);
        overflow: visible;
        font-size: 13px;
        font-weight: 600;
        user-select: none;
        border: 1px solid var(--b2);
      }
      .strct-av--square {
        border-radius: var(--radius-md);
      }
      .strct-av--square .strct-av__img {
        border-radius: var(--radius-md);
      }
      .strct-av__icon {
        line-height: 0;
      }
      /* Tone paints the tile; the default keeps today's neutral surface. */
      .strct-av[data-tone='accent'] {
        background: var(--acc);
        border-color: transparent;
        color: var(--inv);
      }
      .strct-av[data-tone='accent-soft'] {
        background: var(--acc-m);
        border-color: var(--acc30);
        color: var(--acc);
      }
      .strct-av[data-tone='success'] {
        background: var(--success);
        border-color: transparent;
        color: var(--inv);
      }
      .strct-av[data-tone='warning'] {
        background: var(--warning);
        border-color: transparent;
        color: var(--inv);
      }
      .strct-av[data-tone='critical'] {
        background: var(--critical);
        border-color: transparent;
        color: var(--inv);
      }
      .strct-av--sm {
        width: 26px;
        height: 26px;
        font-size: 12px;
      }
      .strct-av--lg {
        width: 48px;
        height: 48px;
        font-size: 17px;
      }
      .strct-av__img {
        width: 100%;
        height: 100%;
        border-radius: 50%;
        object-fit: cover;
      }
      .strct-av__initials {
        line-height: 1;
      }
      .strct-av__status {
        position: absolute;
        inset-inline-end: -1px;
        bottom: -1px;
        width: 30%;
        height: 30%;
        min-width: 8px;
        min-height: 8px;
        border-radius: 50%;
        border: 2px solid var(--bg-1);
        background: var(--t3);
      }
      .strct-av--online .strct-av__status {
        background: var(--success);
      }
      .strct-av--busy .strct-av__status {
        background: var(--critical);
      }
      .strct-av--offline .strct-av__status {
        background: var(--t3);
      }
    `,
  ],
})
export class StrctAvatar {
  /**
   * An icon instead of initials — a group, an assistant, a brand mark. An
   * `src` image still wins.
   */
  readonly icon = input('');
  /** `square` for a thing rather than a person (a group, an app). */
  readonly shape = input<'circle' | 'square'>('circle');
  /** Surface tone. `neutral` keeps the default grey tile. */
  readonly tone = input<StrctStatus | 'accent-soft'>('neutral');
  /** The icon scales with the avatar. */
  protected readonly iconSize = computed(() =>
    this.size() === 'lg' ? 22 : this.size() === 'sm' ? 13 : 17,
  );
  /** Image URL. */
  readonly src = input('');
  /** Display name (used for initials when src is absent). */
  readonly name = input('');
  /** Size variant. */
  readonly size = input<StrctAvatarSize>('md');
  /** Visual status color. */
  readonly status = input<StrctAvatarStatus>('none');

  protected readonly initials = computed(() => {
    const parts = this.name().trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return '?';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  });
}
