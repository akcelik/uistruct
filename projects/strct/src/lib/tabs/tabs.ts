import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  booleanAttribute,
  contentChildren,
  effect,
  input,
  model,
  signal,
} from '@angular/core';

let tabsCounter = 0;

/** A single tab. Place inside `<strct-tabs>`; `label` names its button. */
@Component({
  selector: 'strct-tab',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `@if (active() || keepAlive()) {
    <ng-content />
  }`,
  host: {
    class: 'strct-tab',
    role: 'tabpanel',
    '[id]': 'panelId',
    '[attr.aria-labelledby]': 'buttonId',
    '[hidden]': '!active()',
  },
})
export class StrctTab {
  /** Label text. */
  readonly label = input.required<string>();
  /** Static disable flag. */
  readonly disabled = input(false, { transform: booleanAttribute });
  private readonly _id = ++tabsCounter;
  /** Id of this tab's panel element. */
  readonly panelId = `strct-tab-panel-${this._id}`;
  /** Id of this tab's button element. */
  readonly buttonId = `strct-tab-btn-${this._id}`;
  private readonly _active = signal(false);
  readonly active = this._active.asReadonly();
  private readonly _keepAlive = signal(false);
  /** Whether inactive content stays in the DOM (hidden) instead of being destroyed. */
  readonly keepAlive = this._keepAlive.asReadonly();

  /** @internal called by the parent tab group */
  setActive(value: boolean): void {
    this._active.set(value);
  }

  /** @internal called by the parent tab group */
  setKeepAlive(value: boolean): void {
    this._keepAlive.set(value);
  }
}

/** Tab group. Wraps `<strct-tab>` children and renders the tab bar. */
@Component({
  selector: 'strct-tabs',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="strct-tabs__bar" role="tablist" #bar (keydown)="onKeydown($event, bar)">
      @for (tab of tabs(); track tab; let i = $index) {
        <button
          type="button"
          role="tab"
          class="strct-tabs__btn"
          [id]="tab.buttonId"
          [class.strct-tabs__btn--active]="i === selectedIndex()"
          [attr.aria-selected]="i === selectedIndex()"
          [attr.aria-controls]="tab.panelId"
          [attr.tabindex]="i === selectedIndex() ? 0 : -1"
          [disabled]="tab.disabled()"
          (click)="select(i)"
        >
          {{ tab.label() }}
        </button>
      }
    </div>
    <div class="strct-tabs__panels"><ng-content /></div>
  `,
  host: { class: 'strct-tabs' },
  styles: [
    `
      .strct-tabs {
        display: block;
      }
      .strct-tabs__bar {
        display: flex;
        gap: 2px;
        border-bottom: 1px solid var(--b2);
        overflow-x: auto;
        white-space: nowrap;
        scrollbar-width: none;
      }
      .strct-tabs__btn {
        appearance: none;
        background: transparent;
        border: 0;
        cursor: pointer;
        font-family: var(--font);
        font-size: 13px;
        font-weight: 500;
        color: var(--t2);
        padding: 9px 14px;
        border-bottom: 2px solid transparent;
        margin-bottom: -1px;
        transition:
          color 0.14s ease,
          border-color 0.14s ease;
      }
      .strct-tabs__btn:hover {
        color: var(--t1);
      }
      .strct-tabs__btn--active {
        color: var(--acc);
        border-bottom-color: var(--acc);
      }
      .strct-tabs__btn:disabled {
        color: var(--t4);
        cursor: not-allowed;
      }
      .strct-tabs__panels {
        padding-top: 16px;
      }
      .strct-tab[hidden] {
        display: none;
      }
    `,
  ],
})
export class StrctTabs {
  readonly tabs = contentChildren(StrctTab);
  readonly selectedIndex = model(0);
  /**
   * Keep inactive panels in the DOM with the `hidden` attribute instead of
   * destroying them, preserving their state (e.g. form values) across switches.
   */
  readonly keepAlive = input(false, { transform: booleanAttribute });

  constructor() {
    // Keep each child panel's visibility in sync with the selected index.
    effect(() => {
      const idx = this.selectedIndex();
      const keepAlive = this.keepAlive();
      this.tabs().forEach((tab, i) => {
        tab.setActive(i === idx);
        tab.setKeepAlive(keepAlive);
      });
    });
  }

  select(index: number): void {
    if (!this.tabs()[index]?.disabled()) this.selectedIndex.set(index);
  }

  onKeydown(event: KeyboardEvent, bar: HTMLElement): void {
    const key = event.key;
    if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(key)) return;
    event.preventDefault();
    const count = this.tabs().length;
    if (!count) return;
    let idx = this.selectedIndex();
    if (key === 'Home') {
      idx = 0;
      while (idx < count && this.tabs()[idx].disabled()) idx++;
    } else if (key === 'End') {
      idx = count - 1;
      while (idx >= 0 && this.tabs()[idx].disabled()) idx--;
    } else {
      // APG: horizontal arrows mirror under RTL — read the effective direction.
      const rtl = getComputedStyle(bar).direction === 'rtl';
      const step = (key === 'ArrowRight') !== rtl ? 1 : -1;
      for (let n = 0; n < count; n++) {
        idx = (idx + step + count) % count;
        if (!this.tabs()[idx].disabled()) break;
      }
    }
    if (idx < 0 || idx >= count || this.tabs()[idx]?.disabled()) return;
    this.selectedIndex.set(idx);
    const buttons = bar.querySelectorAll<HTMLElement>('button.strct-tabs__btn');
    buttons[idx]?.focus();
  }
}
