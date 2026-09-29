import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  TemplateRef,
  ViewEncapsulation,
  booleanAttribute,
  computed,
  contentChild,
  input,
} from '@angular/core';

/** Where one step of a watched process has got to. */
export type StrctStepPhase = 'pending' | 'active' | 'done' | 'failed' | 'skipped' | 'blocked';

/** One step of a process the user watches rather than drives. */
export interface StrctStepState {
  id: string;
  label: string;
  state: StrctStepPhase;
  /** Shown by `cards`; the tooltip for `pills` and `dots`. */
  description?: string;
}

/** The state words assistive tech reads after each label — localisable. */
export type StrctStepsLabels = Record<StrctStepPhase, string>;

const STEP_LABELS: StrctStepsLabels = {
  pending: 'pending',
  active: 'in progress',
  done: 'done',
  failed: 'failed',
  skipped: 'skipped',
  blocked: 'blocked',
};

/**
 * Per-step action for `appearance="cards"`. The template's context is the step:
 *
 *   <ng-template strctStepAction let-step>
 *     <button strct-button size="sm" (click)="run(step)">Run</button>
 *   </ng-template>
 */
@Directive({ selector: 'ng-template[strctStepAction]' })
export class StrctStepAction {}

/**
 * A process the user *watches* rather than drives: an update run per host
 * (Check → Download → Install → Verify), or a numbered method on a landing
 * page. A wizard's rail is the wrong control — the user did not start each step
 * and cannot go back to one — and a timeline implies history. Neither says
 * "skipped" or "blocked".
 *
 *   <strct-steps [steps]="run" appearance="pills" />
 *   <strct-steps [steps]="method" appearance="cards" numbered />
 */
@Component({
  selector: 'strct-steps',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [NgTemplateOutlet],
  template: `
    <ol class="strct-steps__list">
      @for (step of steps(); track step.id; let i = $index) {
        <li
          class="strct-steps__step"
          [attr.data-state]="step.state"
          [attr.aria-current]="step.state === 'active' ? 'step' : null"
          [attr.title]="appearance() === 'cards' ? null : step.description || null"
        >
          <span class="strct-steps__marker" aria-hidden="true">
            @if (numbered() || appearance() === 'cards') {
              {{ i + 1 }}
            }
          </span>
          <span class="strct-steps__text">
            <span class="strct-steps__label">{{ step.label }}</span>
            @if (appearance() === 'cards' && step.description) {
              <span class="strct-steps__desc">{{ step.description }}</span>
            }
          </span>
          @if (actionTpl(); as tpl) {
            <span class="strct-steps__action">
              <ng-container
                [ngTemplateOutlet]="tpl"
                [ngTemplateOutletContext]="{ $implicit: step, step }"
              />
            </span>
          }
          <!-- The colour says the state; this says it in words. -->
          <span class="strct-steps__sr">{{ stateWord(step.state) }}</span>
        </li>
      }
    </ol>
  `,
  host: {
    class: 'strct-steps',
    '[class.strct-steps--dots]': "appearance() === 'dots'",
    '[class.strct-steps--cards]': "appearance() === 'cards'",
    '[class.strct-steps--vertical]': "orientation() === 'vertical'",
    '[class.strct-steps--numbered]': 'numbered()',
    '[class.strct-steps--dense]': 'dense()',
  },
  styles: [
    `
      .strct-steps {
        display: block;
        min-width: 0;
      }
      .strct-steps__list {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 6px 4px;
      }
      .strct-steps--vertical .strct-steps__list {
        flex-direction: column;
        align-items: stretch;
        flex-wrap: nowrap;
      }

      /* ── pills (default): joined by a hairline, wrapping when narrow ── */
      .strct-steps__step {
        position: relative;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 4px 10px;
        border: 1px solid var(--b2);
        border-radius: 999px;
        font-size: var(--text-sm);
        color: var(--t2);
        background: var(--bg-1);
        min-width: 0;
      }
      .strct-steps--dense .strct-steps__step {
        padding: 2px 8px;
      }
      /* The connector between two pills on the same line. */
      .strct-steps__list > .strct-steps__step + .strct-steps__step::before {
        content: '';
        position: absolute;
        inset-inline-start: -5px;
        width: 5px;
        height: 1px;
        background: var(--b2);
      }
      .strct-steps--vertical .strct-steps__list > .strct-steps__step + .strct-steps__step::before {
        inset-inline-start: 14px;
        top: -7px;
        width: 1px;
        height: 7px;
      }
      .strct-steps__marker:empty {
        display: none;
      }
      .strct-steps__marker {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        flex: none;
        width: 18px;
        height: 18px;
        border-radius: 50%;
        font-size: 11px;
        font-weight: 600;
        background: var(--bg-3);
        color: var(--t2);
      }
      .strct-steps__text {
        display: flex;
        flex-direction: column;
        min-width: 0;
      }
      .strct-steps__label {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .strct-steps__desc {
        font-size: var(--text-sm);
        color: var(--t3);
        white-space: normal;
      }
      .strct-steps__action {
        margin-inline-start: auto;
        padding-inline-start: 8px;
        flex: none;
      }
      .strct-steps__sr {
        position: absolute;
        width: 1px;
        height: 1px;
        overflow: hidden;
        clip-path: inset(50%);
        white-space: nowrap;
      }

      /* ── tones ──────────────────────────────────────────────────── */
      .strct-steps__step[data-state='done'] {
        border-color: var(--success);
        color: var(--success);
      }
      .strct-steps__step[data-state='done'] .strct-steps__marker {
        background: var(--success);
        color: var(--inv);
      }
      .strct-steps__step[data-state='active'] {
        border-color: var(--acc);
        color: var(--acc);
        background: var(--acc-s);
      }
      .strct-steps__step[data-state='active'] .strct-steps__marker {
        background: var(--acc);
        color: var(--inv);
      }
      .strct-steps__step[data-state='failed'] {
        border-color: var(--critical);
        color: var(--critical);
      }
      .strct-steps__step[data-state='failed'] .strct-steps__marker {
        background: var(--critical);
        color: var(--inv);
      }
      .strct-steps__step[data-state='blocked'] {
        border-color: var(--warning);
        color: var(--warning);
      }
      .strct-steps__step[data-state='blocked'] .strct-steps__marker {
        background: var(--warning);
        color: var(--inv);
      }
      .strct-steps__step[data-state='skipped'] {
        color: var(--t3);
        border-style: dashed;
      }
      .strct-steps__step[data-state='skipped'] .strct-steps__label {
        text-decoration: line-through;
      }
      .strct-steps__step[data-state='pending'] {
        color: var(--t3);
        border-color: var(--t4);
      }

      /* The step happening now says so by pulsing its own edge. */
      .strct-steps__step[data-state='active']::after {
        content: '';
        position: absolute;
        inset: -1px;
        border-radius: inherit;
        border: 1px solid var(--acc);
        animation: strct-steps-pulse 1.4s ease-out infinite;
        pointer-events: none;
      }
      @keyframes strct-steps-pulse {
        from {
          opacity: 0.9;
          transform: scale(1);
        }
        to {
          opacity: 0;
          transform: scale(1.06);
        }
      }
      @media (prefers-reduced-motion: reduce) {
        .strct-steps__step[data-state='active']::after {
          animation: none;
          opacity: 0.5;
          transform: none;
        }
      }

      /* ── dots: the same states, room for a long run ─────────────── */
      .strct-steps--dots .strct-steps__step {
        padding: 0;
        border: 0;
        background: none;
        gap: 4px;
      }
      .strct-steps--dots .strct-steps__label {
        display: none;
      }
      .strct-steps--dots .strct-steps__marker {
        display: inline-flex;
        width: 9px;
        height: 9px;
        font-size: 0;
      }
      .strct-steps--dots .strct-steps__step[data-state='pending'] .strct-steps__marker {
        background: var(--bg-3);
        box-shadow: inset 0 0 0 1px var(--b3);
      }
      .strct-steps--dots .strct-steps__list > .strct-steps__step + .strct-steps__step::before {
        inset-inline-start: -4px;
        width: 4px;
      }

      /* ── cards: number, label, description, an action ───────────── */
      .strct-steps--cards .strct-steps__list {
        display: grid;
        grid-template-columns: repeat(
          auto-fit,
          minmax(min(var(--strct-steps-card-min, 220px), 100%), 1fr)
        );
        gap: var(--space-3);
      }
      .strct-steps--cards .strct-steps__step {
        align-items: flex-start;
        border-radius: var(--radius-lg);
        padding: var(--space-3);
        background: var(--bg-1);
      }
      .strct-steps--cards .strct-steps__label {
        font-weight: 600;
        white-space: normal;
      }
      .strct-steps--cards .strct-steps__list > .strct-steps__step + .strct-steps__step::before {
        content: none;
      }
    `,
  ],
})
export class StrctSteps {
  /** The steps, in order. */
  readonly steps = input.required<StrctStepState[]>();
  /** `pills` (default), `dots` for a long run, `cards` for a numbered method. */
  readonly appearance = input<'pills' | 'dots' | 'cards'>('pills');
  /** Vertical stacks the steps and turns the connector into a rail. */
  readonly orientation = input<'horizontal' | 'vertical'>('horizontal');
  /** Numbers the pills (cards are always numbered). */
  readonly numbered = input(false, { transform: booleanAttribute });
  /** Tighter pills, for one row per host in a long list. */
  readonly dense = input(false, { transform: booleanAttribute });
  /** The state words read after each label. */
  readonly labels = input<Partial<StrctStepsLabels>>({});

  protected readonly actionTpl = contentChild(StrctStepAction, { read: TemplateRef });
  private readonly L = computed<StrctStepsLabels>(() => ({ ...STEP_LABELS, ...this.labels() }));

  protected stateWord(state: StrctStepPhase): string {
    return this.L()[state];
  }
}
