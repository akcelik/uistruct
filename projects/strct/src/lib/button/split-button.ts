import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  booleanAttribute,
  input,
  output,
} from '@angular/core';
import {
  StrctDropdown,
  StrctDropdownDivider,
  StrctDropdownItem,
  StrctDropdownTrigger,
} from '../dropdown/dropdown';
import { StrctIcon } from '../icon/icon';
import { StrctMenuItem } from '../context-menu/menu';

/**
 * Split button — a primary action plus a chevron opening its variants
 * (Fluent's pattern): "Deploy ▾ → Deploy with snapshot / Deploy paused".
 *
 *   <strct-split-button label="Deploy" [items]="variants"
 *                       (action)="deploy()" (picked)="run($event)" />
 *
 * The main segment fires `(action)`; menu entries fire `(picked)`.
 */
@Component({
  selector: 'strct-split-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [
    StrctDropdown,
    StrctDropdownDivider,
    StrctDropdownItem,
    StrctDropdownTrigger,
    StrctIcon,
  ],
  template: `
    <div class="strct-sbt" [class.strct-sbt--solid]="solid()">
      <button
        type="button"
        class="strct-sbt__main"
        [disabled]="disabled() || null"
        (click)="action.emit()"
      >
        @if (icon()) {
          <strct-icon [name]="icon()" [size]="13" />
        }
        {{ label() }}
      </button>
      <strct-dropdown align="end">
        <button
          type="button"
          class="strct-sbt__chev"
          strctDropdownTrigger
          [disabled]="disabled() || null"
          [attr.aria-label]="menuLabel() + ': ' + label()"
        >
          <strct-icon name="chevronDown" [size]="12" />
        </button>
        @for (item of items(); track $index) {
          @if (item.divider) {
            <strct-dropdown-divider />
          } @else {
            <strct-dropdown-item
              [critical]="item.critical ?? false"
              [disabled]="item.disabled ?? false"
              (click)="!item.disabled && picked.emit(item)"
            >
              @if (item.icon) {
                <strct-icon [name]="item.icon" [size]="13" />
              }
              {{ item.label }}
            </strct-dropdown-item>
          }
        }
      </strct-dropdown>
    </div>
  `,
  styles: [
    `
      .strct-sbt {
        display: inline-flex;
        align-items: stretch;
      }
      /* The chevron lives inside strct-dropdown's trigger wrapper — both
         layers must stretch or the two segments render at different heights. */
      .strct-sbt .strct-dd {
        display: inline-flex;
        align-self: stretch;
      }
      .strct-sbt .strct-dd__trigger {
        display: inline-flex;
        align-items: stretch;
      }
      .strct-sbt__chev {
        align-self: stretch;
        height: 100%;
      }
      .strct-sbt__main,
      .strct-sbt__chev {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        border: 1px solid var(--acc);
        background: transparent;
        color: var(--acc);
        font-family: var(--font);
        font-size: 12.5px;
        font-weight: 600;
        cursor: pointer;
        padding: 5px 12px;
      }
      .strct-sbt__main {
        border-start-start-radius: 7px;
        border-end-start-radius: 7px;
        border-inline-end: 0;
      }
      .strct-sbt__chev {
        padding: 5px 6px;
        border-start-end-radius: 7px;
        border-end-end-radius: 7px;
        border-inline-start: 1px solid var(--acc50);
      }
      .strct-sbt--solid .strct-sbt__main,
      .strct-sbt--solid .strct-sbt__chev {
        background: var(--acc);
        color: var(--inv);
      }
      .strct-sbt--solid .strct-sbt__chev {
        border-inline-start-color: color-mix(in srgb, var(--inv) 30%, var(--acc));
      }
      .strct-sbt__main:hover:not(:disabled),
      .strct-sbt__chev:hover:not(:disabled) {
        background: var(--acc18);
      }
      .strct-sbt--solid .strct-sbt__main:hover:not(:disabled),
      .strct-sbt--solid .strct-sbt__chev:hover:not(:disabled) {
        filter: brightness(1.08);
        background: var(--acc);
      }
      .strct-sbt__main:disabled,
      .strct-sbt__chev:disabled {
        opacity: 0.5;
        cursor: default;
      }
      .strct-sbt__main:focus-visible,
      .strct-sbt__chev:focus-visible {
        outline: 2px solid var(--acc50);
        outline-offset: 1px;
        position: relative;
        z-index: 1;
      }
    `,
  ],
})
export class StrctSplitButton {
  /** Main action label. */
  readonly label = input.required<string>();
  /** Menu entries (StrctMenuItem: id, label, icon?, critical?, disabled?). */
  readonly items = input<StrctMenuItem[]>([]);
  /** Optional leading icon of the main segment. */
  readonly icon = input('');
  /** Filled (solid accent) look. */
  readonly solid = input(false, { transform: booleanAttribute });
  /** Disable both segments. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Accessible name of the chevron (localizable). */
  readonly menuLabel = input('More actions');
  /** The main segment was clicked. */
  readonly action = output<void>();
  /** A menu entry was chosen. */
  readonly picked = output<StrctMenuItem>();
}
