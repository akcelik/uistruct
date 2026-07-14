import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  booleanAttribute,
  computed,
  input,
} from '@angular/core';
import { StrctStatus } from '../status';

/** One endpoint in a `StrctFlow`. */
export interface StrctFlowNode {
  /** Stable identity (used as the @for track key). */
  id: string;
  /** Primary terminal label. */
  label: string;
  /** Optional secondary line under the label. */
  sublabel?: string;
  /** Optional role tag (e.g. "ACTIVE", "STANDBY"). */
  role?: string;
  /** Optional status dot tone for this terminal. */
  status?: StrctStatus;
}

/** Direction of travel for the animated flow. */
export type StrctFlowDirection = 'forward' | 'reverse' | 'both';
/** Axis the terminals are laid out along. */
export type StrctFlowOrientation = 'horizontal' | 'vertical';

/**
 * Shows a connection between two (or N) endpoints with an optional animated
 * "flow" — moving dots travelling along the connector — to represent live data
 * movement (replication, sync, a pipeline).
 *
 *   <strct-flow
 *     [nodes]="[
 *       { id: 'a', label: 'node01', role: 'ACTIVE', status: 'success' },
 *       { id: 'b', label: 'node02', role: 'STANDBY', status: 'accent' }
 *     ]"
 *     [live]="true" label="live replication · 0 lag" status="success" />
 *
 * When `live` is off (or the user prefers reduced motion) the connector is a
 * static gradient with a direction arrow instead of moving dots.
 */
@Component({
  selector: 'strct-flow',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="strct-flow__row">
      @for (node of nodes(); track node.id; let last = $last) {
        <div class="strct-flow__node strct-flow__node--{{ node.status ?? 'neutral' }}">
          <span class="strct-flow__dot" aria-hidden="true"></span>
          <span class="strct-flow__node-text">
            <span class="strct-flow__label">{{ node.label }}</span>
            @if (node.role) {
              <span class="strct-flow__role">{{ node.role }}</span>
            }
            @if (node.sublabel) {
              <span class="strct-flow__sub">{{ node.sublabel }}</span>
            }
          </span>
        </div>

        @if (!last) {
          <div class="strct-flow__conn" aria-hidden="true">
            <span class="strct-flow__line"></span>
            @if (showArrow('forward')) {
              <span class="strct-flow__arrow strct-flow__arrow--fwd"></span>
            }
            @if (showArrow('reverse')) {
              <span class="strct-flow__arrow strct-flow__arrow--rev"></span>
            }
            @if (animated()) {
              @if (showArrow('forward')) {
                <span class="strct-flow__pkt strct-flow__pkt--fwd strct-flow__pkt--1"></span>
                <span class="strct-flow__pkt strct-flow__pkt--fwd strct-flow__pkt--2"></span>
                <span class="strct-flow__pkt strct-flow__pkt--fwd strct-flow__pkt--3"></span>
              }
              @if (showArrow('reverse')) {
                <span class="strct-flow__pkt strct-flow__pkt--rev strct-flow__pkt--1"></span>
                <span class="strct-flow__pkt strct-flow__pkt--rev strct-flow__pkt--2"></span>
                <span class="strct-flow__pkt strct-flow__pkt--rev strct-flow__pkt--3"></span>
              }
            }
          </div>
        }
      }
    </div>

    @if (caption()) {
      <div class="strct-flow__caption">{{ caption() }}</div>
    }
  `,
  host: {
    class: 'strct-flow',
    role: 'img',
    '[class.strct-flow--vertical]': "orientation() === 'vertical'",
    '[class.strct-flow--neutral]': "status() === 'neutral'",
    '[class.strct-flow--accent]': "status() === 'accent'",
    '[class.strct-flow--success]': "status() === 'success'",
    '[class.strct-flow--warning]': "status() === 'warning'",
    '[class.strct-flow--critical]': "status() === 'critical'",
    '[class.strct-flow--live]': 'animated()',
    '[attr.aria-label]': 'ariaLabel()',
  },
  styles: [
    `
      .strct-flow {
        --strct-flow-color: var(--acc);
        display: block;
      }
      .strct-flow--neutral {
        --strct-flow-color: var(--t3);
      }
      .strct-flow--accent {
        --strct-flow-color: var(--acc);
      }
      .strct-flow--success {
        --strct-flow-color: var(--success);
      }
      .strct-flow--warning {
        --strct-flow-color: var(--warning);
      }
      .strct-flow--critical {
        --strct-flow-color: var(--critical);
      }

      .strct-flow__row {
        display: flex;
        align-items: center;
        gap: var(--space-2);
      }
      .strct-flow--vertical .strct-flow__row {
        flex-direction: column;
        align-items: stretch;
      }

      /* ── Terminal ─────────────────────────────────────────────── */
      .strct-flow__node {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        padding: var(--space-2) var(--space-3);
        border: 1px solid var(--b2);
        border-radius: var(--radius-md);
        background: var(--bg-1);
        flex-shrink: 0;
      }
      .strct-flow__dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        flex-shrink: 0;
        background: var(--t3);
      }
      .strct-flow__node--accent .strct-flow__dot {
        background: var(--acc);
      }
      .strct-flow__node--success .strct-flow__dot {
        background: var(--success);
      }
      .strct-flow__node--warning .strct-flow__dot {
        background: var(--warning);
      }
      .strct-flow__node--critical .strct-flow__dot {
        background: var(--critical);
      }
      .strct-flow__node-text {
        display: flex;
        flex-direction: column;
        gap: 1px;
        min-width: 0;
      }
      .strct-flow__label {
        font-size: var(--text-md);
        font-weight: 600;
        color: var(--t1);
        line-height: 1.2;
      }
      .strct-flow__role {
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.4px;
        color: var(--t3);
      }
      .strct-flow__sub {
        font-size: var(--text-sm);
        color: var(--t3);
      }

      /* ── Connector ────────────────────────────────────────────── */
      .strct-flow__conn {
        position: relative;
        flex: 1 1 auto;
        min-width: 40px;
        height: 2px;
        align-self: center;
      }
      .strct-flow--vertical .strct-flow__conn {
        width: 2px;
        min-width: 0;
        height: 28px;
        flex: 0 0 28px;
        align-self: center;
      }
      .strct-flow__line {
        position: absolute;
        inset: 0;
        border-radius: 2px;
        background: linear-gradient(
          to right,
          var(--b3),
          color-mix(in srgb, var(--strct-flow-color) 55%, transparent),
          var(--b3)
        );
      }
      .strct-flow--vertical .strct-flow__line {
        background: linear-gradient(
          to bottom,
          var(--b3),
          color-mix(in srgb, var(--strct-flow-color) 55%, transparent),
          var(--b3)
        );
      }

      /* Direction arrowheads (always shown, even when not live). */
      .strct-flow__arrow {
        position: absolute;
        top: 50%;
        width: 0;
        height: 0;
        border-top: 4px solid transparent;
        border-bottom: 4px solid transparent;
      }
      .strct-flow__arrow--fwd {
        right: -1px;
        transform: translateY(-50%);
        border-inline-start: 6px solid var(--strct-flow-color);
      }
      .strct-flow__arrow--rev {
        left: -1px;
        transform: translateY(-50%);
        border-inline-end: 6px solid var(--strct-flow-color);
      }
      .strct-flow--vertical .strct-flow__arrow {
        top: auto;
        left: 50%;
      }
      .strct-flow--vertical .strct-flow__arrow--fwd {
        right: auto;
        bottom: -1px;
        transform: translateX(-50%);
        border-inline-start: 4px solid transparent;
        border-inline-end: 4px solid transparent;
        border-top: 6px solid var(--strct-flow-color);
        border-bottom: 0;
      }
      .strct-flow--vertical .strct-flow__arrow--rev {
        left: 50%;
        top: -1px;
        transform: translateX(-50%);
        border-inline-start: 4px solid transparent;
        border-inline-end: 4px solid transparent;
        border-bottom: 6px solid var(--strct-flow-color);
        border-top: 0;
      }

      /* Travelling packets. */
      .strct-flow__pkt {
        position: absolute;
        top: 50%;
        width: 5px;
        height: 5px;
        margin: -2.5px 0 0 -2.5px;
        border-radius: 50%;
        background: var(--strct-flow-color);
        box-shadow: 0 0 5px var(--strct-flow-color);
      }
      .strct-flow--vertical .strct-flow__pkt {
        top: 0;
        left: 50%;
      }
      .strct-flow__pkt--fwd {
        animation: strct-flow-fwd 1.8s linear infinite;
      }
      .strct-flow__pkt--rev {
        animation: strct-flow-rev 1.8s linear infinite;
      }
      .strct-flow--vertical .strct-flow__pkt--fwd {
        animation-name: strct-flow-fwd-v;
      }
      .strct-flow--vertical .strct-flow__pkt--rev {
        animation-name: strct-flow-rev-v;
      }
      .strct-flow__pkt--2 {
        animation-delay: 0.6s;
      }
      .strct-flow__pkt--3 {
        animation-delay: 1.2s;
      }

      @keyframes strct-flow-fwd {
        from {
          left: 0;
          opacity: 0;
        }
        15%,
        85% {
          opacity: 1;
        }
        to {
          left: 100%;
          opacity: 0;
        }
      }
      @keyframes strct-flow-rev {
        from {
          left: 100%;
          opacity: 0;
        }
        15%,
        85% {
          opacity: 1;
        }
        to {
          left: 0;
          opacity: 0;
        }
      }
      @keyframes strct-flow-fwd-v {
        from {
          top: 0;
          opacity: 0;
        }
        15%,
        85% {
          opacity: 1;
        }
        to {
          top: 100%;
          opacity: 0;
        }
      }
      @keyframes strct-flow-rev-v {
        from {
          top: 100%;
          opacity: 0;
        }
        15%,
        85% {
          opacity: 1;
        }
        to {
          top: 0;
          opacity: 0;
        }
      }

      .strct-flow__caption {
        margin-top: var(--space-2);
        text-align: center;
        font-size: var(--text-sm);
        color: var(--t3);
      }
      .strct-flow--vertical .strct-flow__caption {
        text-align: start;
      }

      /* Reduced motion: keep the static gradient + arrows, drop the packets. */
      @media (prefers-reduced-motion: reduce) {
        .strct-flow__pkt {
          display: none;
        }
      }
    `,
  ],
})
export class StrctFlow {
  /** Ordered endpoints. */
  readonly nodes = input<StrctFlowNode[]>([]);
  /** Animate the flow (packets travel along the connector). */
  readonly live = input(false, { transform: booleanAttribute });
  /** Direction of travel. */
  readonly direction = input<StrctFlowDirection>('forward');
  /** Caption under the connector (e.g. "live replication", "0 lag"). */
  readonly label = input('');
  /** Connector + packet color. */
  readonly status = input<StrctStatus>('accent');
  /** Layout axis. */
  readonly orientation = input<StrctFlowOrientation>('horizontal');

  /** A flow needs at least two terminals to animate. */
  protected readonly connected = computed(() => this.nodes().length > 1);
  protected readonly animated = computed(() => this.live() && this.connected());

  /** Whether to show packets / arrow in the given travel direction. */
  protected showArrow(dir: 'forward' | 'reverse'): boolean {
    const d = this.direction();
    return d === 'both' || d === dir;
  }

  /** Caption text, falling back to a "no connection" hint for a lone terminal. */
  protected readonly caption = computed(() => {
    if (!this.connected()) return this.label() || 'No connection';
    return this.label();
  });

  /** Human-readable summary for assistive tech. */
  protected readonly ariaLabel = computed(() => {
    const labels = this.nodes().map((n) => n.label);
    if (labels.length === 0) return this.label() || 'Flow';
    if (labels.length === 1) return `${labels[0]}, no connection`;
    const sep =
      this.direction() === 'both' ? ' ↔ ' : this.direction() === 'reverse' ? ' ← ' : ' → ';
    const live = this.live() ? ', live' : '';
    const cap = this.label() ? ` (${this.label()})` : '';
    return `Flow ${labels.join(sep)}${live}${cap}`;
  });
}
