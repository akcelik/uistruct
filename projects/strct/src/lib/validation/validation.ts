import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
} from '@angular/core';
import { StrctIcon } from '../icon/icon';
import { StrctSpinner } from '../spinner/spinner';

/** Lifecycle of an async (or deferred) validation check. */
export type StrctValidationStatus = 'idle' | 'checking' | 'ok' | 'warning' | 'error';

/**
 * A first-class "validating… → ok / warning / error (reason)" model, so apps stop
 * composing a spinner + badge by hand (e.g. live reachability checks while typing).
 * Consumed by `StrctField`'s `validationState` input and the `[strctCellStatus]`
 * datagrid-cell helper.
 */
export interface StrctValidationState {
  status: StrctValidationStatus;
  /** Optional human-readable reason, shown beside the affordance / in the hint slot. */
  message?: string;
}

/** Tone class suffix per validation status (used by field + cell helper styles). */
export function strctValidationTone(status: StrctValidationStatus): string {
  return status;
}

/** Leading icon name per (non-checking) validation status; '' for idle/checking. */
export function strctValidationIcon(status: StrctValidationStatus): string {
  switch (status) {
    case 'ok':
      return 'success';
    case 'warning':
      return 'warning';
    case 'error':
      return 'critical';
    default:
      return '';
  }
}

/**
 * Renders the shared "checking / ok / warning / error (reason)" affordance from a
 * small `StrctValidationState` model — a spinner while checking, then an icon and
 * an optional message. Drop it into a `StrctDatagrid` cell template for
 * list-building flows, as an element or an attribute:
 *
 *   <strct-cell-status [state]="probe(row)" />
 *   <span strct-cell-status [state]="probe(row)"></span>
 */
@Component({
  selector: 'strct-cell-status, [strct-cell-status]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [StrctIcon, StrctSpinner],
  template: `
    @if (state().status !== 'idle') {
      <span class="strct-vstate strct-vstate--{{ state().status }}">
        @if (state().status === 'checking') {
          <strct-spinner size="sm" />
        } @else if (icon()) {
          <strct-icon [name]="icon()" [size]="16" />
        }
        @if (state().message) {
          <span class="strct-vstate__msg" aria-live="polite">{{ state().message }}</span>
        }
      </span>
    }
  `,
  styles: [
    `
      .strct-vstate {
        display: inline-flex;
        align-items: center;
        gap: var(--space-1);
        font-size: var(--text-sm);
        line-height: 1;
        color: var(--t3);
      }
      .strct-vstate strct-icon {
        flex-shrink: 0;
      }
      .strct-vstate--ok {
        color: var(--success);
      }
      .strct-vstate--warning {
        color: var(--warning);
      }
      .strct-vstate--error {
        color: var(--critical);
      }
      .strct-vstate__msg {
        color: var(--t2);
      }
    `,
  ],
})
export class StrctCellStatus {
  /** The validation state to render. */
  readonly state = input.required<StrctValidationState>();
  protected readonly icon = computed(() => strctValidationIcon(this.state().status));
}
