import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  ViewEncapsulation,
  computed,
  effect,
  input,
  model,
  output,
  signal,
} from '@angular/core';
import { StrctButton } from '../button/button';

/** One coach-mark step. `target` is a CSS selector; null centers the card. */
export interface StrctTourStep {
  target: string | null;
  title: string;
  body: string;
}

/**
 * Feature tour (coach marks) — "what's new" onboarding over live UI:
 *
 *   <strct-tour [(open)]="tourOpen" [steps]="steps" (finished)="done()" />
 *
 * Each step spotlights its `target` selector with a ring cut out of a dimmed
 * backdrop and anchors a card next to it. Arrows / buttons step, Escape
 * closes, and the card is a labeled dialog. Purely DOM-driven: targets are
 * looked up when the step shows, so it works over any page.
 */
@Component({
  selector: 'strct-tour',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [StrctButton],
  template: `
    @if (open() && current(); as step) {
      <!-- Always the click-catcher; dims only when no ring (its shadow dims). -->
      <div
        class="strct-tour__backdrop"
        [class.strct-tour__backdrop--dim]="!spot()"
        (click)="close()"
      ></div>
      @if (spot(); as r) {
        <div
          class="strct-tour__ring"
          [style.top.px]="r.top - 6"
          [style.left.px]="r.left - 6"
          [style.width.px]="r.width + 12"
          [style.height.px]="r.height + 12"
        ></div>
      }
      <div
        class="strct-tour__card"
        role="dialog"
        [attr.aria-label]="step.title"
        [style.top.px]="cardPos().top"
        [style.left.px]="cardPos().left"
      >
        <div class="strct-tour__step">{{ index() + 1 }} / {{ steps().length }}</div>
        <div class="strct-tour__title">{{ step.title }}</div>
        <div class="strct-tour__body">{{ step.body }}</div>
        <div class="strct-tour__nav">
          <button strct-button size="sm" variant="flat" (click)="close()">
            {{ skipLabel() }}
          </button>
          <span class="strct-tour__grow"></span>
          @if (index() > 0) {
            <button strct-button size="sm" variant="neutral" (click)="prev()">
              {{ backLabel() }}
            </button>
          }
          <button strct-button size="sm" variant="primary" solid (click)="next()">
            {{ index() === steps().length - 1 ? doneLabel() : nextLabel() }}
          </button>
        </div>
      </div>
    }
  `,
  styles: [
    `
      .strct-tour__backdrop {
        position: fixed;
        inset: 0;
        z-index: 400;
        background: transparent;
      }
      .strct-tour__backdrop--dim {
        background: rgba(0, 0, 0, 0.45);
      }
      .strct-tour__ring {
        position: fixed;
        z-index: 401;
        border: 2px solid var(--acc);
        border-radius: 9px;
        box-shadow:
          0 0 0 4px var(--acc30),
          0 0 0 9999px rgba(0, 0, 0, 0.45);
        pointer-events: none;
      }
      .strct-tour__card {
        position: fixed;
        z-index: 402;
        width: 300px;
        padding: 14px 16px;
        background: var(--bg-1);
        border: 1px solid var(--b2);
        border-radius: 9px;
        box-shadow: var(--shh);
      }
      .strct-tour__step {
        font-size: 10.5px;
        font-weight: 600;
        letter-spacing: 0.6px;
        color: var(--t3);
        margin-bottom: 4px;
        font-variant-numeric: tabular-nums;
      }
      .strct-tour__title {
        font-size: 13.5px;
        font-weight: 650;
        color: var(--t1);
        margin-bottom: 6px;
      }
      .strct-tour__body {
        font-size: 12.5px;
        line-height: 1.5;
        color: var(--t2);
        margin-bottom: 12px;
      }
      .strct-tour__nav {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .strct-tour__grow {
        flex: 1;
      }
    `,
  ],
})
export class StrctTour {
  /** Whether the tour is showing (two-way). */
  readonly open = model(false);
  /** The steps, in order. */
  readonly steps = input.required<StrctTourStep[]>();
  /** Localizable strings. */
  readonly nextLabel = input('Next');
  readonly backLabel = input('Back');
  readonly skipLabel = input('Skip');
  readonly doneLabel = input('Done');
  /** The last step's Done was clicked (Escape / Skip emit `dismissed`). */
  readonly finished = output<void>();
  readonly dismissed = output<void>();

  protected readonly index = signal(0);
  /** Bumped on open/step/resize to re-measure the target. */
  private readonly measureTick = signal(0);

  protected readonly current = computed(() => this.steps()[this.index()] ?? null);

  protected readonly spot = computed(() => {
    this.measureTick();
    const step = this.current();
    if (!this.open() || !step?.target) return null;
    const el = document.querySelector(step.target);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { top: r.top, left: r.left, width: r.width, height: r.height };
  });

  protected readonly cardPos = computed(() => {
    const r = this.spot();
    const w = 300;
    const h = 170;
    if (!r) {
      return {
        top: Math.max(20, window.innerHeight / 2 - h / 2),
        left: Math.max(20, window.innerWidth / 2 - w / 2),
      };
    }
    // Below the target if it fits, else above; clamped into the viewport.
    let top = r.top + r.height + 14;
    if (top + h > window.innerHeight - 12) top = Math.max(12, r.top - h - 14);
    const left = Math.min(Math.max(12, r.left), window.innerWidth - w - 12);
    return { top, left };
  });

  constructor() {
    // Restart from step 0 on open; scroll the first target into view.
    effect(() => {
      if (this.open()) {
        this.index.set(0);
        this.scrollToTarget();
      }
    });
  }

  protected next(): void {
    if (this.index() >= this.steps().length - 1) {
      this.open.set(false);
      this.finished.emit();
      return;
    }
    this.index.update((i) => i + 1);
    this.scrollToTarget();
  }

  protected prev(): void {
    this.index.update((i) => Math.max(0, i - 1));
    this.scrollToTarget();
  }

  protected close(): void {
    this.open.set(false);
    this.dismissed.emit();
  }

  private scrollToTarget(): void {
    setTimeout(() => {
      const sel = this.steps()[this.index()]?.target;
      if (sel) document.querySelector(sel)?.scrollIntoView?.({ block: 'center' });
      this.measureTick.update((n) => n + 1);
    });
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    if (this.open()) this.close();
  }

  @HostListener('window:resize')
  @HostListener('window:scroll')
  protected onReflow(): void {
    if (this.open()) this.measureTick.update((n) => n + 1);
  }
}
