import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  contentChildren,
  effect,
  input,
  output,
  signal,
} from '@angular/core';
import { StrctButton } from '../button/button';

/** A single wizard step. `label` names it in the step header. */
@Component({
  selector: 'strct-step',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `@if (active()) {
    <ng-content />
  }`,
  host: { class: 'strct-step', '[hidden]': '!active()' },
})
export class StrctStep {
  readonly label = input.required<string>();
  private readonly _active = signal(false);
  readonly active = this._active.asReadonly();

  /** @internal */
  setActive(value: boolean): void {
    this._active.set(value);
  }
}

/** Multi-step flow with a numbered header and Back / Next / Finish controls. */
@Component({
  selector: 'strct-wizard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [StrctButton],
  template: `
    <div class="strct-wiz__steps">
      @for (step of steps(); track step; let i = $index; let last = $last) {
        <div
          class="strct-wiz__step"
          [class.strct-wiz__step--active]="i === current()"
          [class.strct-wiz__step--done]="i < current()"
        >
          <span class="strct-wiz__dot">{{ i + 1 }}</span>
          <span class="strct-wiz__label">{{ step.label() }}</span>
        </div>
        @if (!last) {
          <span class="strct-wiz__sep"></span>
        }
      }
    </div>

    <div class="strct-wiz__content"><ng-content /></div>

    <div class="strct-wiz__foot">
      <button strct-button variant="flat" [disabled]="current() === 0" (click)="back()">Back</button>
      @if (isLast()) {
        <button strct-button variant="primary" (click)="finish()">Finish</button>
      } @else {
        <button strct-button variant="primary" (click)="next()">Next</button>
      }
    </div>
  `,
  host: { class: 'strct-wiz' },
  styles: [
    `
    .strct-wiz { display: block; }
    .strct-wiz__steps { display: flex; align-items: center; gap: 6px; }
    .strct-wiz__step { display: flex; align-items: center; gap: 8px; }
    .strct-wiz__dot {
      display: inline-flex; align-items: center; justify-content: center;
      width: 22px; height: 22px; border-radius: 50%; font-size: 11px; font-weight: 600;
      color: var(--t2); background: var(--bg-3); border: 1px solid var(--b2);
    }
    .strct-wiz__label { font-size: 12px; color: var(--t2); }
    .strct-wiz__step--active .strct-wiz__dot { background: var(--acc-m); color: var(--acc); border-color: var(--acc); }
    .strct-wiz__step--active .strct-wiz__label { color: var(--t1); font-weight: 600; }
    .strct-wiz__step--done .strct-wiz__dot { background: var(--acc-m); color: var(--acc); border-color: var(--acc30); }
    .strct-wiz__sep { flex: 1; height: 1px; background: var(--b2); min-width: 18px; }
    .strct-wiz__content {
      margin: 18px 0; padding: 16px; min-height: 80px;
      background: var(--bg-1); border: 1px solid var(--b2); border-radius: 8px;
      color: var(--t2); font-size: 13px;
    }
    .strct-wiz__foot { display: flex; justify-content: flex-end; gap: 8px; }
    `,
  ],
})
export class StrctWizard {
  readonly steps = contentChildren(StrctStep);
  readonly current = signal(0);
  readonly finished = output<void>();

  protected readonly isLast = computed(() => this.current() >= this.steps().length - 1);

  constructor() {
    effect(() => {
      const idx = this.current();
      this.steps().forEach((step, i) => step.setActive(i === idx));
    });
  }

  next(): void {
    if (!this.isLast()) this.current.update((i) => i + 1);
  }

  back(): void {
    if (this.current() > 0) this.current.update((i) => i - 1);
  }

  finish(): void {
    this.finished.emit();
  }
}
