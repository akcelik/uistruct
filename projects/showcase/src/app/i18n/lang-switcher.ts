import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Lang, LangService } from './lang';

/**
 * TR / EN, in the header beside the palette switcher — the two things on
 * this site that change it without leaving the page.
 */
@Component({
  selector: 'app-lang-switcher',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="lang" role="group" [attr.aria-label]="lang.t().language">
      @for (opt of options; track opt.code) {
        <button
          type="button"
          class="lang__btn"
          [class.is-on]="lang.lang() === opt.code"
          [attr.aria-pressed]="lang.lang() === opt.code"
          [attr.lang]="opt.code"
          (click)="lang.set(opt.code)"
        >
          {{ opt.label }}
        </button>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: inline-flex;
      }
      .lang {
        display: inline-flex;
        gap: 2px;
        padding: 3px;
        border-radius: var(--radius-md);
        background: var(--bg-h);
      }
      .lang__btn {
        font: inherit;
        font-size: var(--text-xs);
        font-weight: 600;
        letter-spacing: 0.04em;
        line-height: 1;
        padding: 5px 9px;
        border: 0;
        border-radius: var(--radius-sm);
        background: transparent;
        color: var(--t3);
        cursor: pointer;
      }
      .lang__btn:hover {
        color: var(--t1);
      }
      .lang__btn.is-on {
        background: var(--bg-1);
        color: var(--t1);
      }
      .lang__btn:focus-visible {
        outline: 2px solid var(--acc);
        outline-offset: 1px;
      }
    `,
  ],
})
export class LangSwitcher {
  protected readonly lang = inject(LangService);
  protected readonly options: { code: Lang; label: string }[] = [
    { code: 'tr', label: 'TR' },
    { code: 'en', label: 'EN' },
  ];
}
