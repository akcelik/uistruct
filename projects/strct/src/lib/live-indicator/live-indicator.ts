import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ViewEncapsulation,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { StrctStatus } from '../status';
import { StrctStatusDot } from '../status-dot/status-dot';

/** What a live view is currently doing. */
export type StrctLiveState = 'live' | 'connecting' | 'reconnecting' | 'paused' | 'stale';

/** Every string the indicator can say, so it can be localised. */
export interface StrctLiveLabels {
  live: string;
  /** With an `interval`: "Live · updates every 5 s". */
  liveEvery: (seconds: number) => string;
  connecting: string;
  reconnecting: string;
  paused: string;
  /** With an `updatedAt`: "Last updated 3 min ago". */
  stale: (relative: string) => string;
  justNow: string;
  minutesAgo: (n: number) => string;
  hoursAgo: (n: number) => string;
}

const DEFAULT_LABELS: StrctLiveLabels = {
  live: 'Live',
  liveEvery: (s) => `Live · updates every ${s} s`,
  connecting: 'Connecting…',
  reconnecting: 'Reconnecting…',
  paused: 'Paused',
  stale: (relative) => `Last updated ${relative}`,
  justNow: 'just now',
  minutesAgo: (n) => `${n} min ago`,
  hoursAgo: (n) => `${n} h ago`,
};

const TONE: Record<StrctLiveState, StrctStatus> = {
  live: 'success',
  connecting: 'accent',
  reconnecting: 'warning',
  paused: 'neutral',
  stale: 'warning',
};

/**
 * "Live · updates every 5 s" and "Reconnecting…" are states of one indicator,
 * not three captions written by hand next to three hand-rolled dots. A dot that
 * is live and a dot that is merely green are different facts.
 *
 *   <strct-live-indicator state="live" [interval]="5000" />
 *   <strct-live-indicator state="stale" [updatedAt]="lastRead" />
 *
 * It is a `role="status"`, so a change of state is announced politely — and the
 * relative time re-renders on its own every 30 s without announcing each tick.
 */
@Component({
  selector: 'strct-live-indicator',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [StrctStatusDot],
  template: `
    <strct-status-dot size="sm" [status]="tone()" [pulse]="pulsing()" [label]="text()" />
    <span class="strct-live__text">{{ text() }}</span>
  `,
  host: {
    class: 'strct-live',
    role: 'status',
    'aria-live': 'polite',
    '[attr.data-state]': 'state()',
  },
  styles: [
    `
      .strct-live {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: var(--text-sm);
        color: var(--t3);
      }
      .strct-live[data-state='reconnecting'] .strct-live__text,
      .strct-live[data-state='stale'] .strct-live__text {
        color: var(--warning);
      }
      /* The dot already says the state for assistive tech; the text is the
         same sentence, so it is not read twice. */
      .strct-live .strct-dot__sr {
        display: none;
      }
    `,
  ],
})
export class StrctLiveIndicator {
  /** What the view is doing. */
  readonly state = input<StrctLiveState>('live');
  /** Refresh period in ms — turns "Live" into "Live · updates every 5 s". */
  readonly interval = input<number | null>(null);
  /** When the data last arrived; drives the relative time of `stale`. */
  readonly updatedAt = input<Date | number | null>(null);
  /** Every string, for localisation. */
  readonly labels = input<Partial<StrctLiveLabels>>({});

  protected readonly tone = computed(() => TONE[this.state()]);
  /** Only a view that is actually receiving data pulses. */
  protected readonly pulsing = computed(() => this.state() === 'live');

  private readonly L = computed<StrctLiveLabels>(() => ({ ...DEFAULT_LABELS, ...this.labels() }));

  /** Re-read every 30 s, so "3 min ago" does not go stale on screen. */
  private readonly now = signal(Date.now());

  constructor() {
    const timer = setInterval(() => this.now.set(Date.now()), 30_000);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));
  }

  protected readonly relative = computed(() => {
    const at = this.updatedAt();
    if (at == null) return '';
    const ms = this.now() - (at instanceof Date ? at.getTime() : at);
    const mins = Math.floor(ms / 60_000);
    if (mins < 1) return this.L().justNow;
    if (mins < 60) return this.L().minutesAgo(mins);
    return this.L().hoursAgo(Math.floor(mins / 60));
  });

  protected readonly text = computed(() => {
    const l = this.L();
    switch (this.state()) {
      case 'live': {
        const ms = this.interval();
        return ms ? l.liveEvery(Math.round(ms / 1000)) : l.live;
      }
      case 'connecting':
        return l.connecting;
      case 'reconnecting':
        return l.reconnecting;
      case 'paused':
        return l.paused;
      case 'stale':
        return this.relative() ? l.stale(this.relative()) : l.stale('');
    }
  });
}
