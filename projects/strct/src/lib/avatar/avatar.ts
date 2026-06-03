import { ChangeDetectionStrategy, Component, ViewEncapsulation, computed, input } from '@angular/core';

export type StrctAvatarSize = 'sm' | 'md' | 'lg';
export type StrctAvatarStatus = 'none' | 'online' | 'busy' | 'offline';

/**
 * Circular avatar: an image when `src` is set, otherwise initials from `name`.
 *   <strct-avatar name="Ada Lovelace" status="online" />
 */
@Component({
  selector: 'strct-avatar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    @if (src()) {
      <img class="strct-av__img" [src]="src()" [alt]="name()" />
    } @else {
      <span class="strct-av__initials">{{ initials() }}</span>
    }
    @if (status() !== 'none') {
      <span class="strct-av__status"></span>
    }
  `,
  host: {
    class: 'strct-av',
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
      position: relative; display: inline-flex; align-items: center; justify-content: center;
      width: 36px; height: 36px; border-radius: 50%; flex-shrink: 0;
      background: var(--bg-3); color: var(--t1); overflow: visible;
      font-size: 13px; font-weight: 600; user-select: none;
      border: 1px solid var(--b2);
    }
    .strct-av--sm { width: 26px; height: 26px; font-size: 11px; }
    .strct-av--lg { width: 48px; height: 48px; font-size: 17px; }
    .strct-av__img { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; }
    .strct-av__initials { line-height: 1; }
    .strct-av__status {
      position: absolute; right: -1px; bottom: -1px;
      width: 30%; height: 30%; min-width: 8px; min-height: 8px; border-radius: 50%;
      border: 2px solid var(--bg-1); background: var(--t3);
    }
    .strct-av--online .strct-av__status { background: var(--ok); }
    .strct-av--busy .strct-av__status { background: var(--crt); }
    .strct-av--offline .strct-av__status { background: var(--t3); }
    `,
  ],
})
export class StrctAvatar {
  readonly src = input('');
  readonly name = input('');
  readonly size = input<StrctAvatarSize>('md');
  readonly status = input<StrctAvatarStatus>('none');

  protected readonly initials = computed(() => {
    const parts = this.name().trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return '?';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  });
}
