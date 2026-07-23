import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  ViewEncapsulation,
  booleanAttribute,
  computed,
  contentChild,
  contentChildren,
  effect,
  input,
  model,
  output,
  signal,
  untracked,
} from '@angular/core';
import { StrctButton } from '../button/button';

/** A single wizard step. `label` names it in the step header / rail. */
@Component({
  selector: 'strct-step',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `@if (active()) {
    <ng-content />
  }`,
  host: { class: 'strct-step', '[hidden]': '!active()' },
})
export class StrctStep {
  /** Label text. */
  readonly label = input.required<string>();
  /** Rail sublabel (vertical mode; shown while the step is active). */
  readonly description = input('');
  /** When false, the wizard's Next / Finish is disabled on this step. */
  readonly canAdvance = input(true, { transform: booleanAttribute });
  private readonly _active = signal(false);
  readonly active = this._active.asReadonly();

  /** @internal */
  setActive(value: boolean): void {
    this._active.set(value);
  }
}

/** Marks the live-summary column projected beside a vertical wizard. */
@Directive({ selector: '[strctWizardAside]' })
export class StrctWizardAside {}

/**
 * Multi-step flow with Back / Next / Finish controls.
 *
 * Default: a numbered horizontal header. With `vertical`, steps become a left
 * rail — dashed-ring states (idle ⊙ / active ●⊙ / done ✓), a progress bar
 * with an “n/N” counter, and click-back navigation to visited steps — plus an
 * optional right column projected via `strctWizardAside` (live summaries).
 * The rail never flips horizontal: under ~720px of component width it
 * collapses to a compact vertical ring column (container query).
 *
 *   <strct-wizard vertical title="Create virtual machine">
 *     <strct-step label="Identity" description="Name, environment">…</strct-step>
 *     …
 *     <aside strctWizardAside>…live summary…</aside>
 *   </strct-wizard>
 */
@Component({
  selector: 'strct-wizard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [StrctButton],
  template: `
    <div
      class="strct-wiz__layout"
      [class.strct-wiz__layout--v]="vertical()"
      [class.strct-wiz__layout--aside]="vertical() && asideDef()"
    >
      @if (vertical()) {
        <nav class="strct-wiz__rail" [attr.aria-label]="stepsLabel()">
          @if (title()) {
            <div class="strct-wiz__vtitle">{{ title() }}</div>
          }
          <div class="strct-wiz__pbar" aria-hidden="true">
            <i [style.width.%]="progressPct()"></i>
          </div>
          <div class="strct-wiz__pcount">
            {{ maxVisited() }}/{{ steps().length }} {{ progressLabel() }}
          </div>
          <div class="strct-wiz__vsteps">
            @for (step of steps(); track step; let i = $index) {
              <button
                type="button"
                class="strct-wiz__vstep"
                [class.strct-wiz__vstep--done]="i < maxVisited() && i !== current()"
                [class.strct-wiz__vstep--active]="i === current()"
                [disabled]="i > maxVisited() || null"
                [attr.aria-current]="i === current() ? 'step' : null"
                [attr.title]="step.label()"
                (click)="goTo(i)"
              >
                <span class="strct-wiz__ring" aria-hidden="true"></span>
                <span class="strct-wiz__vmeta">
                  <span class="strct-wiz__vlabel">{{ step.label() }}</span>
                  @if (step.description()) {
                    <span class="strct-wiz__vdesc">{{ step.description() }}</span>
                  }
                </span>
              </button>
            }
          </div>
        </nav>
      } @else {
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
      }

      <div class="strct-wiz__main">
        <div class="strct-wiz__content"><ng-content /></div>

        <div class="strct-wiz__foot">
          @if (cancelable()) {
            <button
              strct-button
              variant="flat"
              class="strct-wiz__cancel"
              (click)="cancelled.emit()"
            >
              {{ cancelLabel() }}
            </button>
          }
          <button strct-button variant="flat" [disabled]="current() === 0" (click)="back()">
            {{ backLabel() }}
          </button>
          @if (isLast()) {
            <button
              strct-button
              variant="primary"
              [disabled]="submitting() || !canAdvance()"
              (click)="finish()"
            >
              {{ submitting() ? submittingLabel() : finishLabel() }}
            </button>
          } @else {
            <button strct-button variant="primary" [disabled]="!canAdvance()" (click)="next()">
              {{ nextLabel() }}
            </button>
          }
        </div>
      </div>

      <aside class="strct-wiz__aside">
        <ng-content select="[strctWizardAside]" />
      </aside>
    </div>
  `,
  host: { class: 'strct-wiz', '[class.strct-wiz--vertical]': 'vertical()' },
  styles: [
    `
      .strct-wiz {
        display: block;
      }
      /* ── shared (horizontal keeps its exact pre-vertical look) ── */
      .strct-wiz__steps {
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .strct-wiz__step {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .strct-wiz__dot {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 22px;
        height: 22px;
        border-radius: 50%;
        font-size: 12px;
        font-weight: 600;
        color: var(--t2);
        background: var(--bg-3);
        border: 1px solid var(--b2);
      }
      .strct-wiz__label {
        font-size: 12px;
        color: var(--t2);
      }
      .strct-wiz__step--active .strct-wiz__dot {
        background: var(--acc-m);
        color: var(--acc);
        border-color: var(--acc);
      }
      .strct-wiz__step--active .strct-wiz__label {
        color: var(--t1);
        font-weight: 600;
      }
      .strct-wiz__step--done .strct-wiz__dot {
        background: var(--acc-m);
        color: var(--acc);
        border-color: var(--acc30);
      }
      .strct-wiz__sep {
        flex: 1;
        height: 1px;
        background: var(--b2);
        min-width: 18px;
      }
      .strct-wiz__content {
        margin: 18px 0;
        padding: 16px;
        min-height: 80px;
        background: var(--bg-1);
        border: 1px solid var(--b2);
        border-radius: 8px;
        color: var(--t2);
        font-size: 13px;
      }
      .strct-wiz__foot {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
      }
      .strct-wiz__cancel {
        margin-inline-end: auto;
      }
      /* Aside only exists in vertical mode. */
      .strct-wiz__aside {
        display: none;
      }

      /* ── vertical ────────────────────────────────────────────── */
      .strct-wiz--vertical {
        container-type: inline-size;
      }
      .strct-wiz__layout--v {
        display: grid;
        grid-template-columns: 232px minmax(0, 1fr);
        border: 1px solid var(--b2);
        border-radius: 12px;
        background: var(--bg-1);
        overflow: hidden;
      }
      .strct-wiz__layout--v.strct-wiz__layout--aside {
        grid-template-columns: 232px minmax(0, 1fr) 280px;
      }
      .strct-wiz__layout--v .strct-wiz__aside {
        display: block;
        background: var(--bg-2);
        border-inline-start: 1px solid var(--b1);
        overflow-y: auto;
      }
      .strct-wiz__layout--v .strct-wiz__main {
        display: flex;
        flex-direction: column;
        min-width: 0;
      }
      .strct-wiz__layout--v .strct-wiz__content {
        flex: 1;
        margin: 0;
        padding: 20px 24px;
        border: 0;
        border-radius: 0;
        background: transparent;
        overflow-y: auto;
      }
      .strct-wiz__layout--v .strct-wiz__foot {
        padding: 13px 24px;
        border-top: 1px solid var(--b1);
      }

      .strct-wiz__rail {
        display: flex;
        flex-direction: column;
        padding: 20px 18px 16px;
        background: var(--bg-2);
        border-inline-end: 1px solid var(--b1);
        min-width: 0;
      }
      .strct-wiz__vtitle {
        font-size: 15px;
        font-weight: 600;
        letter-spacing: -0.2px;
        line-height: 1.3;
        margin-bottom: 12px;
      }
      .strct-wiz__pbar {
        height: 4px;
        border-radius: 99px;
        background: var(--bg-a);
        overflow: hidden;
        flex: none;
      }
      .strct-wiz__pbar i {
        display: block;
        height: 100%;
        border-radius: 99px;
        background: var(--acc);
        transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      }
      .strct-wiz__pcount {
        font-family: var(--mono);
        font-size: 10.5px;
        letter-spacing: 0.4px;
        color: var(--t3);
        margin: 7px 0 16px;
        font-variant-numeric: tabular-nums;
      }
      .strct-wiz__vsteps {
        display: flex;
        flex-direction: column;
      }
      .strct-wiz__vstep {
        display: grid;
        grid-template-columns: 22px 1fr;
        gap: 11px;
        align-items: start;
        width: 100%;
        padding: 8px 0;
        border: 0;
        background: none;
        text-align: start;
        font: inherit;
        color: inherit;
        cursor: pointer;
      }
      .strct-wiz__vstep:disabled {
        cursor: default;
        opacity: 0.55;
      }
      .strct-wiz__ring {
        width: 20px;
        height: 20px;
        margin-top: 1px;
        border-radius: 50%;
        border: 2px dashed var(--b3);
        display: grid;
        place-items: center;
        transition:
          border-color 0.2s,
          background 0.2s;
      }
      .strct-wiz__vlabel {
        display: block;
        font-size: 13px;
        color: var(--t2);
        transition: color 0.15s;
      }
      .strct-wiz__vdesc {
        display: block;
        font-size: 11px;
        color: var(--t3);
        margin-top: 1px;
        opacity: 0;
        height: 0;
        overflow: hidden;
        transition: opacity 0.25s;
      }
      .strct-wiz__vstep--done .strct-wiz__ring {
        border: 0;
        background: var(--success);
      }
      .strct-wiz__vstep--done .strct-wiz__ring::after {
        content: '';
        width: 8px;
        height: 4px;
        border-left: 2px solid var(--inv);
        border-bottom: 2px solid var(--inv);
        transform: rotate(-45deg) translate(1px, -1px);
      }
      .strct-wiz__vstep--done .strct-wiz__vlabel {
        color: var(--t1);
      }
      .strct-wiz__vstep--active .strct-wiz__ring {
        border-style: solid;
        border-color: var(--acc);
        box-shadow: 0 0 0 3px var(--acc18);
      }
      .strct-wiz__vstep--active .strct-wiz__ring::after {
        content: '';
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: var(--acc);
      }
      .strct-wiz__vstep--active .strct-wiz__vlabel {
        color: var(--t1);
        font-weight: 600;
      }
      .strct-wiz__vstep--active .strct-wiz__vdesc {
        opacity: 1;
        height: auto;
      }

      /* mid width: the aside yields first */
      @container (max-width: 800px) {
        .strct-wiz__layout--v.strct-wiz__layout--aside {
          grid-template-columns: 232px minmax(0, 1fr);
        }
        .strct-wiz__layout--v .strct-wiz__aside {
          display: none;
        }
      }
      /* narrow: the rail STAYS vertical — compact ring column */
      @container (max-width: 720px) {
        .strct-wiz__layout--v,
        .strct-wiz__layout--v.strct-wiz__layout--aside {
          grid-template-columns: 56px minmax(0, 1fr);
        }
        .strct-wiz__rail {
          padding: 18px 0 12px;
          align-items: center;
        }
        .strct-wiz__vtitle,
        .strct-wiz__pbar,
        .strct-wiz__pcount,
        .strct-wiz__vmeta {
          display: none;
        }
        .strct-wiz__vsteps {
          gap: 3px;
          align-items: center;
        }
        .strct-wiz__vstep {
          grid-template-columns: 22px;
          justify-items: center;
          position: relative;
          padding: 7px 0;
        }
        .strct-wiz__vstep:not(:last-child)::after {
          content: '';
          position: absolute;
          left: 50%;
          top: 30px;
          height: 10px;
          width: 1.5px;
          background: var(--b3);
        }
        .strct-wiz__vstep--done:not(:last-child)::after {
          background: var(--success);
          opacity: 0.6;
        }
        .strct-wiz__layout--v .strct-wiz__content {
          padding: 16px 18px;
        }
        .strct-wiz__layout--v .strct-wiz__foot {
          padding: 12px 18px;
        }
      }
      @media (prefers-reduced-motion: reduce) {
        .strct-wiz__pbar i,
        .strct-wiz__ring,
        .strct-wiz__vlabel,
        .strct-wiz__vdesc {
          transition: none;
        }
      }
    `,
  ],
})
export class StrctWizard {
  readonly steps = contentChildren(StrctStep);
  protected readonly asideDef = contentChild(StrctWizardAside);
  readonly current = model(0);
  /**
   * Vertical mode: steps become a left rail with dashed-ring states, a
   * progress bar and click-back navigation; `strctWizardAside` projects a
   * right column. The rail collapses to a compact vertical ring column under
   * ~720px of component width — it never flips horizontal.
   */
  readonly vertical = input(false, { transform: booleanAttribute });
  /** Rail heading shown above the progress bar (vertical mode). */
  readonly title = input('');
  /** Label for the final-step button (default "Finish"). */
  readonly finishLabel = input('Finish');
  /** Labels for the Back / Next / Cancel buttons (localizable). */
  readonly backLabel = input('Back');
  readonly nextLabel = input('Next');
  readonly cancelLabel = input('Cancel');
  /** Busy label while `submitting` (localizable). */
  readonly submittingLabel = input('Submitting…');
  /** Counter suffix in the rail: "2/5 {progressLabel}". */
  readonly progressLabel = input('completed');
  /** Accessible name of the vertical step rail. */
  readonly stepsLabel = input('Steps');
  /** Disable Finish and show a busy label while an async submit is in flight. */
  readonly submitting = input(false, { transform: booleanAttribute });
  /** Show a Cancel button on the left. */
  readonly cancelable = input(false, { transform: booleanAttribute });
  /** Emitted when the user clicks Finish. */
  readonly finished = output<void>();
  /** Emitted when the user clicks Cancel. */
  readonly cancelled = output<void>();
  /** Emits the new step index after a Back / Next / rail move. */
  readonly stepChange = output<number>();

  /** Furthest step reached — drives the progress bar and rail clickability. */
  protected readonly maxVisited = signal(0);
  protected readonly progressPct = computed(() =>
    this.steps().length ? (this.maxVisited() / this.steps().length) * 100 : 0,
  );

  protected readonly isLast = computed(() => this.current() >= this.steps().length - 1);
  /** Whether the current step permits advancing (its `canAdvance`). */
  protected readonly canAdvance = computed(
    () => this.steps()[this.current()]?.canAdvance() ?? true,
  );

  constructor() {
    effect(() => {
      const idx = this.current();
      this.steps().forEach((step, i) => step.setActive(i === idx));
      untracked(() => {
        if (idx > this.maxVisited()) this.maxVisited.set(idx);
      });
    });
  }

  next(): void {
    if (!this.isLast() && this.canAdvance()) {
      this.current.update((i) => i + 1);
      this.stepChange.emit(this.current());
    }
  }

  back(): void {
    if (this.current() > 0) {
      this.current.update((i) => i - 1);
      this.stepChange.emit(this.current());
    }
  }

  /** Jump to a visited step (rail click). Forward moves still go through Next. */
  goTo(index: number): void {
    if (index === this.current() || index < 0 || index > this.maxVisited()) return;
    this.current.set(index);
    this.stepChange.emit(index);
  }

  finish(): void {
    if (this.canAdvance() && !this.submitting()) this.finished.emit();
  }
}
