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
export type StrctStepPhase =
  'planned' | 'pending' | 'active' | 'done' | 'failed' | 'skipped' | 'blocked';

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
  planned: 'planned',
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
    <ol class="strct-steps__list" [attr.aria-label]="label() || null">
      @for (step of steps(); track step.id; let i = $index) {
        <li
          class="strct-steps__step"
          [attr.data-state]="step.state"
          [attr.aria-current]="step.state === 'active' && !namesOnly() ? 'step' : null"
          [attr.title]="appearance() === 'cards' ? null : step.description || null"
        >
          @if (appearance() === 'rail' && !namesOnly()) {
            <!-- The state is the segment's fill; it never leaves this box. -->
            <span class="strct-steps__bar" aria-hidden="true"></span>
          }
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
          <!-- The colour says the state; this says it in words. A names-only
               row is a heading for the rails under it, so it says no state:
               the rails below are what carry one. -->
          @if (!namesOnly()) {
            <span class="strct-steps__sr">{{ stateWord(step.state) }}</span>
          }
        </li>
      }
    </ol>
  `,
  host: {
    class: 'strct-steps',
    '[class.strct-steps--dots]': "appearance() === 'dots'",
    '[class.strct-steps--rail]': "appearance() === 'rail'",
    '[class.strct-steps--rail-quiet]': "appearance() === 'rail' && names() === 'none'",
    '[class.strct-steps--rail-names]': 'namesOnly()',
    '[class.strct-steps--cards]': "appearance() === 'cards'",
    '[class.strct-steps--vertical]': "orientation() === 'vertical'",
    '[class.strct-steps--numbered]': 'numbered()',
    '[class.strct-steps--dense]': 'dense()',
    '[class.strct-steps--wrap]': 'wrap()',
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
        /* 6px, not 4px: the gap has to hold the connector with daylight on
           both sides of it (BUG-80-01). */
        gap: 6px;
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
        border-radius: var(--radius-pill);
        font-size: var(--text-sm);
        color: var(--t2);
        background: var(--bg-1);
        min-width: 0;
      }
      .strct-steps--dense .strct-steps__step {
        padding: 2px 8px;
      }
      /* The connector between two pills on the same line. It lives inside
         the gap and touches neither border (BUG-80-01): a 5px line in a 4px
         gap spans it edge to edge and crosses the pill's own 1px border, so
         two pills read as links of one chain whose ends collide. */
      .strct-steps__list > .strct-steps__step + .strct-steps__step::before {
        content: '';
        position: absolute;
        inset-inline-start: -4px;
        width: 2px;
        height: 1px;
        background: var(--b2);
      }
      .strct-steps--vertical .strct-steps__list > .strct-steps__step + .strct-steps__step::before {
        inset-inline-start: 14px;
        top: -5px;
        width: 1px;
        height: 4px;
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
        font-size: var(--text-xs);
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
      /* "Back in service" is a label, not an overflow: at narrow widths the
         pill grows a line rather than cutting the word. */
      .strct-steps--wrap .strct-steps__label {
        overflow: visible;
        text-overflow: clip;
        white-space: normal;
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
      /* A plan shown before anything runs is not greyed-out waiting: every
         step of it is going to happen, so it reads in the body colour with a
         plain numbered marker. */
      .strct-steps__step[data-state='planned'] {
        color: var(--t1);
        border-color: var(--b2);
      }
      .strct-steps--dots .strct-steps__step[data-state='planned'] .strct-steps__marker {
        background: var(--bg-3);
        box-shadow: inset 0 0 0 1px var(--b2);
      }

      /* The step happening now says so by breathing its own edge — inside
         its own box. The ring used to be the box grown by 1px and scaled to
         1.06 about its centre, which reaches 1 + 0.03 x (w + 2) px past the
         border on each side: 4.66px for a 120px step, into a gap of 6px that
         also holds a connector, and over the neighbour's border for anything
         wider than ~98px. Nothing scales now, so the emphasis cannot leave
         the step that owns it (BUG-80-01). */
      .strct-steps__step[data-state='active']::after {
        content: '';
        position: absolute;
        inset: 0;
        border-radius: inherit;
        border: 1px solid var(--acc);
        animation: strct-steps-pulse 1.4s ease-in-out infinite alternate;
        pointer-events: none;
      }
      @keyframes strct-steps-pulse {
        from {
          opacity: 0.85;
        }
        to {
          opacity: 0.1;
        }
      }
      @media (prefers-reduced-motion: reduce) {
        .strct-steps__step[data-state='active']::after {
          animation: none;
          opacity: 0.5;
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
        width: 2px;
      }

      /* ── rail: one flat segment per step, equal widths, names under ──
         A run of hosts is read down a column: five chips of five widths in
         five colours line up with nothing, so "which host is at which step"
         cannot be read at all (FR-80-02). The segments are grid columns, so
         a names-only row over a column of rails stands exactly over them. */
      .strct-steps--rail .strct-steps__list {
        display: grid;
        grid-auto-flow: column;
        grid-auto-columns: 1fr;
        align-items: start;
        gap: 0 var(--strct-steps-rail-gap, 3px);
        flex-wrap: nowrap;
      }
      .strct-steps--rail .strct-steps__step {
        display: grid;
        gap: 5px;
        padding: 0;
        border: 0;
        border-radius: 0;
        background: none;
        color: var(--t2);
        min-width: 0;
      }
      .strct-steps--rail .strct-steps__marker,
      .strct-steps--rail .strct-steps__desc {
        display: none;
      }
      /* The segment's own fill is the rail's emphasis; the pill's ring
         would draw a box around the segment and its name. */
      .strct-steps--rail .strct-steps__step[data-state='active']::after {
        content: none;
      }
      /* No connector: the rail is the connection. */
      .strct-steps--rail .strct-steps__list > .strct-steps__step + .strct-steps__step::before {
        content: none;
      }
      .strct-steps--rail .strct-steps__bar {
        height: 6px;
        background: var(--bg-3);
        box-shadow: inset 0 0 0 1px var(--b2);
      }
      /* Rounded at the rail's two ends only, so the segments read as one bar. */
      .strct-steps--rail .strct-steps__step:first-child .strct-steps__bar {
        border-start-start-radius: var(--radius-xs);
        border-end-start-radius: var(--radius-xs);
      }
      .strct-steps--rail .strct-steps__step:last-child .strct-steps__bar {
        border-start-end-radius: var(--radius-xs);
        border-end-end-radius: var(--radius-xs);
      }
      .strct-steps--rail .strct-steps__step[data-state='done'] .strct-steps__bar {
        background: var(--success);
        box-shadow: none;
      }
      .strct-steps--rail .strct-steps__step[data-state='failed'] .strct-steps__bar {
        background: var(--critical);
        box-shadow: none;
      }
      .strct-steps--rail .strct-steps__step[data-state='blocked'] .strct-steps__bar {
        background: var(--warning);
        box-shadow: none;
      }
      /* The step running now: the accent, striped. Two states that differ
         only in hue are one state to a reader who cannot see the hue, and
         done/active is the pair a run is read for (the house rule from
         FR-72-01), so the stripe carries it in greyscale as well. */
      .strct-steps--rail .strct-steps__step[data-state='active'] .strct-steps__bar {
        background:
          repeating-linear-gradient(
            135deg,
            var(--acc) 0 4px,
            color-mix(in srgb, var(--acc) 38%, var(--bg-1)) 4px 8px
          ),
          var(--bg-3);
        box-shadow: none;
      }
      /* A step nobody ran: the track, dashed. */
      .strct-steps--rail .strct-steps__step[data-state='skipped'] .strct-steps__bar {
        background: repeating-linear-gradient(90deg, var(--b2) 0 5px, transparent 5px 10px);
        box-shadow: none;
      }
      .strct-steps--rail .strct-steps__label {
        font-size: var(--text-sm);
        line-height: 16px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .strct-steps--rail .strct-steps__step[data-state='done'] .strct-steps__label {
        color: var(--success);
      }
      .strct-steps--rail .strct-steps__step[data-state='active'] .strct-steps__label {
        color: var(--acc);
        font-weight: 600;
      }
      .strct-steps--rail .strct-steps__step[data-state='failed'] .strct-steps__label {
        color: var(--critical);
        font-weight: 600;
      }
      .strct-steps--rail .strct-steps__step[data-state='blocked'] .strct-steps__label {
        color: var(--warning);
      }
      .strct-steps--rail .strct-steps__step[data-state='skipped'] .strct-steps__label {
        color: var(--t3);
      }
      .strct-steps--rail .strct-steps__step[data-state='pending'] .strct-steps__label {
        color: var(--t3);
      }
      /* names="none": the rail under a shared row of names. The name is
         still the list item's own, for anyone reading it rather than
         looking at it. */
      .strct-steps--rail-quiet .strct-steps__text {
        position: absolute;
        width: 1px;
        height: 1px;
        overflow: hidden;
        clip-path: inset(50%);
        white-space: nowrap;
      }
      /* names="only": that shared row. Same grid, same gap, so each name
         stands over its own segment in the rails below. */
      .strct-steps--rail-names .strct-steps__label {
        color: var(--t2);
        font-weight: 600;
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
  /**
   * `pills` (default), `dots` for a long run, `cards` for a numbered method,
   * or `rail` — one flat segment per step, equal widths, so a run of hosts
   * can be read down a column with the names once above it.
   */
  readonly appearance = input<'pills' | 'dots' | 'cards' | 'rail'>('pills');
  /**
   * Where a `rail`'s names go: `under` it (the default), `none` for a rail
   * that sits under a shared row of names, or `only` for that row — the same
   * grid with the segments left out, so every name stands over its own
   * column of rails.
   */
  readonly names = input<'under' | 'none' | 'only'>('under');
  /** Vertical stacks the steps and turns the connector into a rail. */
  readonly orientation = input<'horizontal' | 'vertical'>('horizontal');
  /** Numbers the pills (cards are always numbered). */
  readonly numbered = input(false, { transform: booleanAttribute });
  /** Tighter pills, for one row per host in a long list. */
  readonly dense = input(false, { transform: booleanAttribute });
  /**
   * The list's accessible name — "Migration plan", "Upgrade progress". An
   * `<ol>` of steps with no name is one of several lists on a page.
   */
  readonly label = input('');
  /** Let a long pill label wrap instead of ending in an ellipsis. */
  readonly wrap = input(false, { transform: booleanAttribute });
  /** The state words read after each label. */
  readonly labels = input<Partial<StrctStepsLabels>>({});

  /** The shared heading row: names, no segments, and no state to hear. */
  protected readonly namesOnly = computed(
    () => this.appearance() === 'rail' && this.names() === 'only',
  );

  protected readonly actionTpl = contentChild(StrctStepAction, { read: TemplateRef });
  private readonly L = computed<StrctStepsLabels>(() => ({ ...STEP_LABELS, ...this.labels() }));

  protected stateWord(state: StrctStepPhase): string {
    return this.L()[state];
  }
}
