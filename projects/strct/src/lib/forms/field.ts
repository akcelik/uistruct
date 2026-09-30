import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  ElementRef,
  TemplateRef,
  ViewEncapsulation,
  afterNextRender,
  booleanAttribute,
  computed,
  contentChild,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { StrctIcon } from '../icon/icon';
import { StrctSpinner } from '../spinner/spinner';
import { StrctValidationState, strctValidationIcon } from '../validation/validation';

let fieldCounter = 0;

/** Text or a control rendered inside the field's box, before the input. */
@Directive({ selector: '[strctFieldPrefix]' })
export class StrctFieldPrefix {}

/** Text or a control rendered inside the field's box, after the input. */
@Directive({ selector: '[strctFieldSuffix]' })
export class StrctFieldSuffix {}

/**
 * A hint with markup in it, rendered where the string `hint` renders and
 * carrying the same id, so it is still the control's description.
 *
 *   <ng-template strctFieldHint>Hosts with a switch named <strong>{{ n }}</strong> join it.</ng-template>
 */
@Directive({ selector: 'ng-template[strctFieldHint]' })
export class StrctFieldHint {}

/**
 * A value that is read-only *here* — a name, a badge, a switch that only shows
 * state — placed in an inline field's control column. Without it the text sits
 * 9px above the label's line, because the column centres on a 34px control.
 */
@Directive({ selector: '[strctFieldValue]', host: { class: 'strct-field__value' } })
export class StrctFieldValue {}

/**
 * Wrapper that opts a run of `layout="inline"` fields out of the hairlines
 * between them — for settings that belong together and should read as one
 * block.
 */
@Directive({ selector: '[strctFieldGroup]', host: { class: 'strct-field-group' } })
export class StrctFieldGroup {}

/**
 * Form-field wrapper: a label (with optional required marker), the projected
 * control, and a hint or error message. It auto-links the control via
 * `aria-describedby` and sets `aria-invalid` when an error is present.
 *
 *   <strct-field label="Email" required hint="We never share it." [error]="emailError()">
 *     <input strctInput type="email" [(ngModel)]="email" />
 *   </strct-field>
 */
@Component({
  selector: 'strct-field',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [StrctIcon, StrctSpinner, NgTemplateOutlet],
  template: `
    @if (label()) {
      <label class="strct-field__label" [attr.for]="controlId() || null">
        {{ label() }}
        @if (required()) {
          <span class="strct-field__req" aria-hidden="true">*</span>
        }
      </label>
    }
    <div class="strct-field__control">
      <!-- The addon slots come first so their selectors win over the catch-all
           below (Angular matches in template order); CSS order puts them
           either side of the control. -->
      <span class="strct-field__addon strct-field__addon--prefix" [id]="prefixId">
        <ng-content select="[strctFieldPrefix]" />
      </span>
      <span class="strct-field__addon strct-field__addon--suffix" [id]="suffixId">
        <ng-content select="[strctFieldSuffix]" />
      </span>
      <ng-content />
      @if (stateActive()) {
        <span class="strct-field__adorn strct-field__adorn--{{ stateStatus() }}" aria-hidden="true">
          @if (stateStatus() === 'checking') {
            <strct-spinner size="sm" />
          } @else if (stateIcon()) {
            <strct-icon [name]="stateIcon()" [size]="16" />
          }
        </span>
      }
    </div>
    @if (errorText()) {
      <div class="strct-field__msg strct-field__msg--error" [id]="errorId" role="alert">
        {{ errorText() }}
      </div>
    } @else if (stateMessage()) {
      <div
        class="strct-field__msg strct-field__msg--{{ stateStatus() }}"
        [id]="hintId"
        [attr.role]="stateStatus() === 'error' ? 'alert' : null"
        aria-live="polite"
      >
        {{ stateMessage() }}
      </div>
    } @else if (hintTpl()) {
      <div class="strct-field__msg strct-field__msg--hint" [id]="hintId">
        <ng-container [ngTemplateOutlet]="hintTpl()!" />
      </div>
    } @else if (hint()) {
      <div class="strct-field__msg strct-field__msg--hint" [id]="hintId">{{ hint() }}</div>
    }
  `,
  host: {
    class: 'strct-field',
    '[class.strct-field--invalid]': 'isInvalid()',
    '[class.strct-field--validating]': 'stateActive()',
    '[class.strct-field--inline]': "layout() === 'inline'",
    '[class.strct-field--prefix]': 'hasPrefix()',
    '[class.strct-field--suffix]': 'hasSuffix()',
  },
  styles: [
    `
      .strct-field {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .strct-field__label {
        font-size: 12px;
        font-weight: 600;
        color: var(--t2);
      }
      .strct-field__req {
        color: var(--critical);
        margin-inline-start: 2px;
      }
      .strct-field__control {
        position: relative;
        display: flex;
        flex-direction: column;
      }
      /* Trailing validation adornment, vertically centred on a single-line control. */
      .strct-field__adorn {
        position: absolute;
        top: 50%;
        inset-inline-end: 10px;
        transform: translateY(-50%);
        display: inline-flex;
        align-items: center;
        pointer-events: none;
      }
      .strct-field__adorn--ok {
        color: var(--success);
      }
      .strct-field__adorn--warning {
        color: var(--warning);
      }
      .strct-field__adorn--error {
        color: var(--critical);
      }
      /* Make room for the adornment so it never overlaps the text. */
      .strct-field--validating .strct-control {
        padding-inline-end: 32px;
      }
      .strct-field__msg {
        font-size: 12px;
        line-height: 1.4;
      }
      .strct-field__msg--hint,
      .strct-field__msg--checking {
        color: var(--t3);
      }
      .strct-field__msg--ok {
        color: var(--success);
      }
      .strct-field__msg--warning {
        color: var(--warning);
      }
      .strct-field__msg--error {
        color: var(--critical);
      }

      /* ── Addons (prefix / suffix) ─────────────────────────────────────────
         The field takes the border, radius and focus ring over from the input,
         so one box holds the unit and the value. */
      .strct-field__addon {
        display: none;
        align-items: center;
        flex: none;
        font-size: 13px;
        color: var(--t3);
      }
      .strct-field__addon--prefix {
        order: -1;
        padding-inline-start: var(--space-3);
      }
      .strct-field__addon--suffix {
        order: 1;
        padding-inline-end: var(--space-3);
      }
      .strct-field--prefix .strct-field__addon--prefix,
      .strct-field--suffix .strct-field__addon--suffix {
        display: inline-flex;
      }
      /* A control addon keeps its own look and sits snug in the box. */
      .strct-field__addon:has(.strct-btn) {
        padding: 3px;
      }
      .strct-field--prefix .strct-field__control,
      .strct-field--suffix .strct-field__control {
        flex-direction: row;
        align-items: center;
        background: var(--bg-2);
        border: 1px solid var(--b2);
        border-radius: var(--radius-md);
        transition:
          border-color 0.14s ease,
          box-shadow 0.14s ease,
          background 0.14s ease;
      }
      .strct-field--prefix .strct-field__control:hover,
      .strct-field--suffix .strct-field__control:hover {
        border-color: var(--b3);
      }
      .strct-field--prefix .strct-field__control:focus-within,
      .strct-field--suffix .strct-field__control:focus-within {
        border-color: var(--acc50);
        box-shadow: 0 0 0 3px var(--acc18);
        background: var(--bg-1);
      }
      .strct-field--invalid.strct-field--prefix .strct-field__control,
      .strct-field--invalid.strct-field--suffix .strct-field__control {
        border-color: var(--critical);
      }
      /* The inner control gives its box up: one border, one ring. */
      .strct-field--prefix .strct-control,
      .strct-field--suffix .strct-control {
        flex: 1;
        min-width: 0;
        border: 0;
        background: transparent;
      }
      .strct-field--prefix .strct-control:focus,
      .strct-field--prefix .strct-control:focus-visible,
      .strct-field--suffix .strct-control:focus,
      .strct-field--suffix .strct-control:focus-visible {
        box-shadow: none;
        background: transparent;
      }
      .strct-field--prefix textarea.strct-control,
      .strct-field--suffix textarea.strct-control {
        min-height: 0;
      }

      /* ── Inline (label column) layout ─────────────────────────────────────
         A long settings form reads as two columns: what the setting is, and
         its value. The hint stays under the label, the error under the
         control. */
      .strct-field--inline {
        container-type: inline-size;
        display: grid;
        grid-template-columns: var(--strct-field-label-w, 220px) minmax(0, 1fr);
        column-gap: var(--space-3);
        row-gap: 4px;
        align-items: start;
      }
      .strct-field--inline > .strct-field__label {
        grid-column: 1;
        grid-row: 1;
        /* Optically centres the label on a single-line control's first line;
           a taller control simply grows downwards from it. */
        padding-block-start: 9px;
      }
      .strct-field--inline > .strct-field__control {
        grid-column: 2;
        grid-row: 1;
      }
      .strct-field--inline > .strct-field__msg {
        grid-column: 2;
        grid-row: 2;
      }
      /* After the rule above, so the hint wins its column back. */
      .strct-field--inline > .strct-field__msg--hint {
        grid-column: 1;
        padding-block-end: var(--space-2);
      }
      /* A read-only value reads on the label's own line, not 9px above it. */
      .strct-field__value {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: var(--space-2);
        min-height: 20px;
        font-size: var(--text-md);
        color: var(--t1);
      }
      .strct-field--inline .strct-field__value {
        padding-block-start: 9px;
      }
      /* Consecutive settings get a hairline; [strctFieldGroup] opts out. */
      .strct-field--inline + .strct-field--inline {
        border-block-start: 1px solid var(--b1);
        margin-block-start: var(--space-3);
        padding-block-start: var(--space-3);
      }
      .strct-field-group .strct-field--inline + .strct-field--inline {
        border-block-start: 0;
        padding-block-start: 0;
      }
      /* Narrow: the column would leave nothing for the control, so it stacks.
         The width is fixed rather than a custom property because a container
         query cannot read one. */
      @container (max-width: 480px) {
        .strct-field--inline > .strct-field__label,
        .strct-field--inline > .strct-field__control,
        .strct-field--inline > .strct-field__msg {
          grid-column: 1 / -1;
          grid-row: auto;
        }
        .strct-field--inline > .strct-field__label,
        .strct-field--inline .strct-field__value {
          padding-block-start: 0;
        }
        .strct-field--inline > .strct-field__msg--hint {
          padding-block-end: 0;
        }
      }
    `,
  ],
})
export class StrctField {
  /** Label text. */
  readonly label = input('');
  /** Show a required marker on the label. */
  readonly required = input(false, { transform: booleanAttribute });
  /** Helper text shown below the field. */
  readonly hint = input('');
  /** Error message (string or first-of array); falsy clears the error state. */
  readonly error = input<string | string[] | null | undefined>(null);
  /**
   * `'inline'` puts the label and its hint in a fixed-width column
   * (`--strct-field-label-w`, 220px) and the control beside them — how a long
   * settings form reads. Below 480px of field width it falls back to stacked.
   */
  readonly layout = input<'stacked' | 'inline'>('stacked');
  /**
   * Async-validation state rendered as a trailing adornment (spinner / check /
   * warning) plus its message in the hint/error slot — so apps stop composing a
   * spinner + badge by hand for live "checking… → ok / warning / error" checks.
   */
  readonly validationState = input<StrctValidationState | null>(null);

  private readonly host: ElementRef<HTMLElement> = inject(ElementRef);
  private readonly n = ++fieldCounter;
  protected readonly hintId = `strct-field-hint-${this.n}`;
  protected readonly errorId = `strct-field-err-${this.n}`;
  protected readonly prefixId = `strct-field-pre-${this.n}`;
  protected readonly suffixId = `strct-field-suf-${this.n}`;
  protected readonly controlId = signal('');

  protected readonly hintTpl = contentChild(StrctFieldHint, { read: TemplateRef });
  protected readonly hasPrefix = contentChild(StrctFieldPrefix);
  protected readonly hasSuffix = contentChild(StrctFieldSuffix);

  protected readonly errorText = computed(() => {
    const e = this.error();
    return (Array.isArray(e) ? e[0] : e) ?? '';
  });

  /** Effective validation status ('idle' when no state supplied). */
  protected readonly stateStatus = computed(() => this.validationState()?.status ?? 'idle');
  /** Whether to show the trailing adornment (an explicit error suppresses it). */
  protected readonly stateActive = computed(
    () => !this.errorText() && this.stateStatus() !== 'idle',
  );
  protected readonly stateIcon = computed(() => strctValidationIcon(this.stateStatus()));
  /** Validation message, shown only when there is no explicit error. */
  protected readonly stateMessage = computed(() =>
    this.errorText() ? '' : (this.validationState()?.message ?? ''),
  );
  /** Invalid when an explicit error is set or the validation state is 'error'. */
  protected readonly isInvalid = computed(
    () => !!this.errorText() || this.stateStatus() === 'error',
  );

  constructor() {
    afterNextRender(() => this.link());
    // Keep aria in sync as the error / hint / validation state change.
    effect(() => {
      this.errorText();
      this.hint();
      this.hintTpl();
      this.hasPrefix();
      this.hasSuffix();
      this.stateStatus();
      this.stateMessage();
      this.applyAria();
    });
  }

  private control(): HTMLElement | null {
    return this.host.nativeElement.querySelector<HTMLElement>(
      'input, select, textarea, [strctInput], [strctField]',
    );
  }

  private link(): void {
    const el = this.control();
    if (!el) return;
    if (!el.id) el.id = `strct-field-ctrl-${this.n}`;
    this.controlId.set(el.id);
    this.applyAria();
  }

  /**
   * A text addon belongs to the control's description — "Minimum memory, MB" —
   * while an addon holding its own control (a send button) is a tab stop of its
   * own and says nothing about the value.
   */
  private addonDescription(sel: string, id: string): string {
    const el = this.host.nativeElement.querySelector<HTMLElement>(sel);
    if (!el || !el.textContent?.trim()) return '';
    if (el.matches('button, a, input, select, textarea')) return '';
    if (el.querySelector('button, a, input, select, textarea')) return '';
    return id;
  }

  private applyAria(): void {
    const el = this.control();
    if (!el) return;
    const message = this.errorText()
      ? this.errorId
      : this.stateMessage() || this.hintTpl() || this.hint()
        ? this.hintId
        : '';
    const describedBy = [
      this.addonDescription('[strctFieldPrefix]', this.prefixId),
      this.addonDescription('[strctFieldSuffix]', this.suffixId),
      message,
    ]
      .filter(Boolean)
      .join(' ');
    if (describedBy) el.setAttribute('aria-describedby', describedBy);
    else el.removeAttribute('aria-describedby');
    if (this.isInvalid()) el.setAttribute('aria-invalid', 'true');
    else el.removeAttribute('aria-invalid');
  }
}
