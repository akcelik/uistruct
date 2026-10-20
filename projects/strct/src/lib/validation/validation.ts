import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  booleanAttribute,
  computed,
  input,
} from '@angular/core';
import { StrctIcon } from '../icon/icon';
import { StrctSpinner } from '../spinner/spinner';

/**
 * Lifecycle of an async (or deferred) validation check — plus the two tones a
 * line uses when it states a fact rather than a verdict: `accent` for
 * something offered ("an update is available") and `info` for a plain note.
 */
export type StrctValidationStatus =
  'idle' | 'checking' | 'ok' | 'warning' | 'error' | 'accent' | 'info';

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
    case 'accent':
      return 'arrowUp';
    case 'info':
      return 'info';
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
          <strct-spinner size="sm" [label]="loadingLabel()" />
        } @else if (shownIcon()) {
          <strct-icon [name]="shownIcon()" [size]="16" />
        }
        @if (state().message) {
          <!-- A verdict that has just arrived is announced; a line that simply
               says what is true is not, or every row of a grid speaks when it
               is drawn (FR-59-02). -->
          <span class="strct-vstate__msg" [attr.aria-live]="announce() ? 'polite' : null">{{
            state().message
          }}</span>
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
      .strct-vstate--accent {
        color: var(--acc);
      }
      .strct-vstate--info {
        color: var(--t2);
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
  /** Accessible label for the 'checking' spinner (localizable). */
  readonly loadingLabel = input('Loading');
  /**
   * An icon of your own, in place of the one the status carries — "an update
   * is available" is an `arrowUp`, not a tick.
   */
  readonly icon = input('');
  /**
   * Whether the message is announced when it changes. True for a verdict that
   * has just arrived (the default, as before); false for a line that states a
   * fact, which is not a change to announce.
   */
  readonly announce = input(true, { transform: booleanAttribute });
  protected readonly shownIcon = computed(
    () => this.icon() || strctValidationIcon(this.state().status),
  );
}
