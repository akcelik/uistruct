import { ChangeDetectionStrategy, Component, ViewEncapsulation, inject } from '@angular/core';
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
        title="Light"
        aria-label="Light theme"
        (click)="theme.setMode('light')"
      >
        <strct-icon name="sun" [size]="16" [strokeWidth]="1.5" />
      </button>
      <button
        type="button"
        class="strct-ts__pbtn"
        [class.strct-ts__pbtn--on]="theme.isDark()"
        title="Dark"
        aria-label="Dark theme"
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
        border: 1.5px solid rgba(255, 255, 255, 0.35);
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
        box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.25);
      }

      .strct-ts__pill {
        display: inline-flex;
        padding: 2px;
        gap: 2px;
        border-radius: 7px;
        background: rgba(255, 255, 255, 0.1);
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
        color: rgba(255, 255, 255, 0.6);
        transition:
          background 0.14s ease,
          color 0.14s ease;
      }
      .strct-ts__pbtn--on {
        background: rgba(255, 255, 255, 0.18);
        color: var(--hdr-fg);
      }
    `,
  ],
})
export class StrctThemeSwitcher {
  protected readonly theme = inject(StrctThemeService);
}
