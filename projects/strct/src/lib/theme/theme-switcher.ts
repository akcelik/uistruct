import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  inject,
  input,
} from '@angular/core';
import { StrctIcon } from '../icon/icon';
import { StrctThemeService } from './theme.service';

/** Palette dots + light/dark pill, wired to {@link StrctThemeService}. */
@Component({
  selector: 'strct-theme-switcher',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [StrctIcon],
  template: `
    <div class="strct-ts__pal">
      @for (p of theme.palettes; track p.id) {
        <button
          type="button"
          class="strct-ts__dot"
          [class.strct-ts__dot--on]="theme.palette() === p.id"
          [title]="p.label"
          [attr.aria-label]="p.label"
          [attr.aria-pressed]="theme.palette() === p.id"
          (click)="theme.setPalette(p.id)"
        >
          <span class="strct-ts__inner" [style.background]="p.swatch"></span>
        </button>
      }
    </div>
    <div class="strct-ts__pill">
      <button
        type="button"
        class="strct-ts__pbtn"
        [class.strct-ts__pbtn--on]="!theme.isDark()"
        [title]="lightLabel()"
        [attr.aria-label]="lightLabel()"
        [attr.aria-pressed]="!theme.isDark()"
        (click)="theme.setMode('light')"
      >
        <strct-icon name="sun" [size]="16" [strokeWidth]="1.5" />
      </button>
      <button
        type="button"
        class="strct-ts__pbtn"
        [class.strct-ts__pbtn--on]="theme.isDark()"
        [title]="darkLabel()"
        [attr.aria-label]="darkLabel()"
        [attr.aria-pressed]="theme.isDark()"
        (click)="theme.setMode('dark')"
      >
        <strct-icon name="moon" [size]="16" [strokeWidth]="1.5" />
      </button>
    </div>
  `,
  host: { class: 'strct-ts' },
  styles: [
    `
      .strct-ts {
        display: inline-flex;
        align-items: center;
        gap: 14px;
      }
      .strct-ts__pal {
        display: inline-flex;
        gap: 7px;
      }
      .strct-ts__dot {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 18px;
        height: 18px;
        border-radius: 50%;
        padding: 0;
        cursor: pointer;
        background: transparent;
        border: 1.5px solid color-mix(in srgb, var(--hdr-fg) 40%, transparent);
        transition:
          transform 0.15s ease,
          border-color 0.15s ease;
      }
      .strct-ts__dot:hover {
        transform: scale(1.12);
      }
      .strct-ts__inner {
        width: 11px;
        height: 11px;
        border-radius: 50%;
        display: block;
      }
      .strct-ts__dot--on {
        border-color: var(--hdr-fg);
        box-shadow: 0 0 0 2px color-mix(in srgb, var(--hdr-fg) 28%, transparent);
      }

      .strct-ts__pill {
        display: inline-flex;
        padding: 2px;
        gap: 2px;
        border-radius: 7px;
        background: color-mix(in srgb, var(--hdr-fg) 12%, transparent);
      }
      .strct-ts__pbtn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 26px;
        height: 22px;
        border: 0;
        border-radius: 5px;
        cursor: pointer;
        background: transparent;
        color: color-mix(in srgb, var(--hdr-fg) 65%, transparent);
        transition:
          background 0.14s ease,
          color 0.14s ease;
      }
      .strct-ts__pbtn--on {
        background: color-mix(in srgb, var(--hdr-fg) 20%, transparent);
        color: var(--hdr-fg);
      }
      .strct-ts__dot:focus-visible,
      .strct-ts__pbtn:focus-visible {
        outline: 2px solid var(--acc50);
        outline-offset: 1px;
      }
    `,
  ],
})
export class StrctThemeSwitcher {
  protected readonly theme = inject(StrctThemeService);

  /** Labels for the Light / Dark mode buttons (localizable). */
  readonly lightLabel = input('Light');
  readonly darkLabel = input('Dark');
}
