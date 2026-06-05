import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  booleanAttribute,
  input,
  output,
} from '@angular/core';
import { StrctIcon } from '../icon/icon';

/** Tag color variants. */
export type StrctTagStatus = 'neutral' | 'accent' | 'success' | 'warning' | 'critical';

/**
 * Compact, optionally removable chip.
 *   <strct-tag status="accent" removable (removed)="drop()">Frontend</strct-tag>
 */
@Component({
  selector: 'strct-tag',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [StrctIcon],
  template: `
    <span class="strct-tag__text"><ng-content /></span>
    @if (removable()) {
      <button type="button" class="strct-tag__remove" aria-label="Remove" (click)="removed.emit()">
        <strct-icon name="close" [size]="11" [strokeWidth]="1.6" />
      </button>
    }
  `,
  host: {
    class: 'strct-tag',
    '[class.strct-tag--accent]': "status() === 'accent'",
    '[class.strct-tag--success]': "status() === 'success'",
    '[class.strct-tag--warning]': "status() === 'warning'",
    '[class.strct-tag--critical]': "status() === 'critical'",
  },
  styles: [
    `
      .strct-tag {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        padding: 3px 4px 3px 9px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: 500;
        color: var(--t1);
        background: var(--bg-3);
        border: 1px solid var(--b2);
      }
      .strct-tag:not(:has(.strct-tag__remove)) {
        padding-right: 9px;
      }
      .strct-tag--accent {
        color: var(--acc);
        border-color: var(--acc30);
        background: var(--acc-s);
      }
      .strct-tag--success {
        color: var(--success);
        border-color: var(--success);
        background: transparent;
      }
      .strct-tag--warning {
        color: var(--warning);
        border-color: var(--warning);
        background: transparent;
      }
      .strct-tag--critical {
        color: var(--critical);
        border-color: var(--critical);
        background: transparent;
      }
      .strct-tag__remove {
        display: inline-flex;
        padding: 2px;
        border: 0;
        border-radius: 3px;
        background: transparent;
        color: currentColor;
        opacity: 0.65;
        cursor: pointer;
      }
      .strct-tag__remove:hover {
        opacity: 1;
        background: var(--dn);
      }
    `,
  ],
})
export class StrctTag {
  /** Visual status color. */
  readonly status = input<StrctTagStatus>('neutral');
  /** Show a remove button. */
  readonly removable = input(false, { transform: booleanAttribute });
  /** Emitted when the user clicks the remove button. */
  readonly removed = output<void>();
}
