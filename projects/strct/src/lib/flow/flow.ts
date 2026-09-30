import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
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
import { StrctStatus } from '../status';

/**
 * A node's own content in a fan-out diagram — chips, a bar, a count. The
 * template's context is the node (`let-node`), including its `data`.
 */
@Directive({ selector: 'ng-template[strctFlowNode]' })
export class StrctFlowNodeTemplate {}

/** An edge between two nodes, for `layout="fan-out"` / `"tree"`. */
export interface StrctFlowEdge {
  from: string;
  to: string;
  status?: StrctStatus;
  style?: 'solid' | 'dashed';
  animated?: boolean;
}

/**
 * A column of a `fan-out` / `tree`, when a heading alone is not enough: a
 * column that no node lands in is still part of the answer — "Lands on: no
 * other member" — so it is drawn with its note in it.
 */
export interface StrctFlowColumn {
  heading: string;
  /** What the column says when nothing is in it. Empty keeps it undrawn. */
  emptyText?: string;
}

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
  /** Which column this node sits in (`fan-out`). Derived from depth in `tree`. */
  column?: number;
  /**
   * How far the node's `status` reaches. `border` (the default) tints the
   * outline; `surface` tints the whole box — for a node that *is* the finding,
   * like a blast radius's "Nowhere".
   */
  emphasis?: 'border' | 'surface';
  /** Anything the node template needs — chips, a bar, a count. */
  data?: unknown;
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
  imports: [NgTemplateOutlet],
  template: `
    @if (layout() !== 'chain') {
      <div class="strct-flow__fan" #fan>
        <!-- The edges are geometry, not content: they are measured from the
             boxes after they render, and hidden from assistive tech, which is
             given the structure instead. -->
        <svg class="strct-flow__edges" aria-hidden="true" [attr.viewBox]="viewBox()">
          @for (e of edgePaths(); track e.key) {
            <path
              class="strct-flow__edge strct-flow__edge--{{ e.status }}"
              [class.strct-flow__edge--dashed]="e.dashed"
              [class.strct-flow__edge--animated]="e.animated"
              [attr.d]="e.d"
              fill="none"
            />
          }
        </svg>
        @for (col of columnsView(); track col.index) {
          <div class="strct-flow__col" role="group" [attr.aria-label]="col.heading || null">
            @if (col.heading) {
              <div class="strct-flow__colhead">{{ col.heading }}</div>
            }
            @if (!col.nodes.length && col.emptyText) {
              <p class="strct-flow__colempty">{{ col.emptyText }}</p>
            }
            <ul class="strct-flow__boxes">
              @for (node of col.nodes; track node.id) {
                <li
                  class="strct-flow__box strct-flow__box--{{ node.status ?? 'neutral' }}"
                  [class.strct-flow__box--surface]="node.emphasis === 'surface'"
                  [attr.data-flow-node]="node.id"
                >
                  @if (nodeTpl(); as tpl) {
                    <ng-container
                      [ngTemplateOutlet]="tpl"
                      [ngTemplateOutletContext]="{ $implicit: node, node }"
                    />
                  } @else {
                    <span class="strct-flow__label">{{ node.label }}</span>
                    @if (node.role) {
                      <span class="strct-flow__role">{{ node.role }}</span>
                    }
                    @if (node.sublabel) {
                      <span class="strct-flow__sub">{{ node.sublabel }}</span>
                    }
                  }
                  <span class="strct-flow__sr">{{ nodeSummary(node) }}</span>
                </li>
              }
            </ul>
          </div>
        }
      </div>
      @if (label()) {
        <div class="strct-flow__caption">{{ label() }}</div>
      }
    } @else {
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
    }
  `,
  host: {
    class: 'strct-flow',
    '[attr.role]': "layout() === 'chain' ? 'img' : null",
    '[class.strct-flow--fan]': "layout() !== 'chain'",
    '[class.strct-flow--vertical]': "orientation() === 'vertical'",
    '[class.strct-flow--neutral]': "status() === 'neutral'",
    '[class.strct-flow--accent]': "status() === 'accent'",
    '[class.strct-flow--success]': "status() === 'success'",
    '[class.strct-flow--warning]': "status() === 'warning'",
    '[class.strct-flow--critical]': "status() === 'critical'",
    '[class.strct-flow--live]': 'animated()',
    '[attr.aria-label]': "layout() === 'chain' ? ariaLabel() : null",
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

      /* ── Fan-out / tree ───────────────────────────────────────────
         Columns of boxes over an SVG underlay of orthogonal connectors. */
      .strct-flow--fan {
        container-type: inline-size;
      }
      .strct-flow__fan {
        position: relative;
        display: flex;
        align-items: flex-start;
        gap: var(--strct-flow-col-gap, 48px);
      }
      .strct-flow__edges {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        overflow: visible;
      }
      .strct-flow__edge {
        stroke: var(--b3);
        stroke-width: 1.5;
      }
      .strct-flow__edge--accent {
        stroke: var(--acc);
      }
      .strct-flow__edge--success {
        stroke: var(--success);
      }
      .strct-flow__edge--warning {
        stroke: var(--warning);
      }
      .strct-flow__edge--critical {
        stroke: var(--critical);
      }
      .strct-flow__edge--dashed {
        stroke-dasharray: 4 3;
      }
      .strct-flow__edge--animated {
        stroke-dasharray: 5 4;
        animation: strct-flow-dash 1s linear infinite;
      }
      @keyframes strct-flow-dash {
        to {
          stroke-dashoffset: -9;
        }
      }
      @media (prefers-reduced-motion: reduce) {
        .strct-flow__edge--animated {
          animation: none;
        }
      }
      .strct-flow__col {
        position: relative;
        flex: 1 1 0;
        min-width: 0;
      }
      .strct-flow__colhead {
        font-size: var(--text-sm);
        font-weight: 600;
        color: var(--t3);
        margin-block-end: var(--space-2);
      }
      .strct-flow__boxes {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
      }
      .strct-flow__box {
        display: flex;
        flex-direction: column;
        gap: 3px;
        padding: var(--space-2) var(--space-3);
        border: 1px solid var(--b2);
        border-radius: var(--radius-md);
        background: var(--bg-1);
        min-width: 0;
      }
      .strct-flow__box--accent {
        border-color: var(--acc30);
      }
      .strct-flow__box--success {
        border-color: var(--success);
      }
      .strct-flow__box--warning {
        border-color: var(--warning);
      }
      .strct-flow__box--critical {
        border-color: var(--critical);
      }
      /* emphasis: 'surface' — the node is the finding, not a node that merely
         has a state, so the tone fills it. The tints are the same ones the
         alerts and badges use. */
      .strct-flow__box--surface.strct-flow__box--accent {
        background: var(--acc-m);
        color: var(--acc);
      }
      .strct-flow__box--surface.strct-flow__box--success {
        background: var(--success-bg);
        color: var(--success);
      }
      .strct-flow__box--surface.strct-flow__box--warning {
        background: var(--warning-bg);
        color: var(--warning);
      }
      .strct-flow__box--surface.strct-flow__box--critical {
        background: var(--critical-bg);
        color: var(--critical);
      }
      .strct-flow__box--surface .strct-flow__sub,
      .strct-flow__box--surface .strct-flow__role {
        color: inherit;
        opacity: 0.85;
      }
      .strct-flow__colempty {
        margin: 0;
        padding: var(--space-2) var(--space-3);
        border: 1px dashed var(--b2);
        border-radius: var(--radius-md);
        font-size: var(--text-sm);
        color: var(--t3);
      }
      .strct-flow__sr {
        position: absolute;
        width: 1px;
        height: 1px;
        overflow: hidden;
        clip-path: inset(50%);
        white-space: nowrap;
      }
      /* Narrow: the columns stack and the connectors become a leading rail,
         because orthogonal edges between stacked columns say nothing. */
      @container (max-width: 480px) {
        .strct-flow__fan {
          flex-direction: column;
          gap: var(--space-3);
        }
        .strct-flow__edges {
          display: none;
        }
        .strct-flow__col {
          padding-inline-start: var(--space-3);
          border-inline-start: 2px solid var(--b2);
        }
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
  /**
   * `chain` (default) is the straight A → B connector. `fan-out` places nodes
   * in columns and draws the edges between them; `tree` is `fan-out` with the
   * columns derived from each node's depth.
   */
  readonly layout = input<'chain' | 'fan-out' | 'tree'>('chain');
  /** The edges of a fan-out / tree. `null` keeps the consecutive chain. */
  readonly edges = input<StrctFlowEdge[] | null>(null);
  /**
   * Column headings, in order — a string, or a `{ heading, emptyText }` for a
   * column that must be drawn even when no node lands in it.
   */
  readonly columns = input<readonly (string | StrctFlowColumn)[] | null>(null);
  /** The columns as declared, normalised. */
  private readonly columnDefs = computed(() =>
    (this.columns() ?? []).map((c) => (typeof c === 'string' ? { heading: c } : c)),
  );

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly nodeTpl = contentChild(StrctFlowNodeTemplate, { read: TemplateRef });

  /** Which column each node sits in: its own, or its depth in the edge graph. */
  private readonly columnOf = computed<Map<string, number>>(() => {
    const nodes = this.nodes();
    const map = new Map<string, number>();
    if (this.layout() === 'tree') {
      const parents = new Map<string, string>();
      for (const e of this.edges() ?? []) parents.set(e.to, e.from);
      const depth = (id: string, seen = new Set<string>()): number => {
        const parent = parents.get(id);
        if (parent === undefined || seen.has(id)) return 0;
        seen.add(id);
        return depth(parent, seen) + 1;
      };
      for (const n of nodes) map.set(n.id, n.column ?? depth(n.id));
      return map;
    }
    for (const [i, n] of nodes.entries()) map.set(n.id, n.column ?? i);
    return map;
  });

  /** The columns as rendered: a heading (when given) and the nodes in it. */
  protected readonly columnsView = computed(() => {
    const byColumn = new Map<number, StrctFlowNode[]>();
    for (const n of this.nodes()) {
      const c = this.columnOf().get(n.id) ?? 0;
      byColumn.set(c, [...(byColumn.get(c) ?? []), n]);
    }
    const defs = this.columnDefs();
    // A column with an emptyText is drawn even with nothing in it: "no other
    // member" is the answer, and an absent column cannot say it.
    const declared = defs.map((d, i) => (d.emptyText ? i : -1)).filter((i) => i >= 0);
    return [...new Set([...byColumn.keys(), ...declared])]
      .sort((a, b) => a - b)
      .map((index) => ({
        index,
        heading: defs[index]?.heading ?? '',
        emptyText: defs[index]?.emptyText ?? '',
        nodes: byColumn.get(index) ?? [],
      }));
  });

  /** What a node says to assistive tech: itself, then where it leads. */
  protected nodeSummary(node: StrctFlowNode): string {
    const out = (this.edges() ?? [])
      .filter((e) => e.from === node.id)
      .map((e) => this.nodes().find((n) => n.id === e.to)?.label ?? e.to);
    return out.length ? `→ ${out.join(', ')}` : '';
  }

  /** Measured edge geometry — recomputed whenever the boxes move or resize. */
  protected readonly edgePaths = signal<
    { key: string; d: string; status: string; dashed: boolean; animated: boolean }[]
  >([]);
  protected readonly viewBox = signal('0 0 0 0');

  constructor() {
    afterNextRender(() => this.observe());
    // Re-measure when the data changes; the observer covers size changes.
    effect(() => {
      this.nodes();
      this.edges();
      this.layout();
      queueMicrotask(() => this.measure());
    });
  }

  private observe(): void {
    if (this.layout() === 'chain' || typeof ResizeObserver === 'undefined') return;
    const fan = this.host.nativeElement.querySelector<HTMLElement>('.strct-flow__fan');
    if (!fan) return;
    const ro = new ResizeObserver(() => this.measure());
    ro.observe(fan);
    for (const box of fan.querySelectorAll('.strct-flow__box')) ro.observe(box);
    this.destroyRef.onDestroy(() => ro.disconnect());
    this.measure();
  }

  /**
   * Orthogonal connectors, from the boxes' real positions: out of the source's
   * inline end, across the gap, then into the target's inline start.
   */
  private measure(): void {
    if (this.layout() === 'chain') return;
    const fan = this.host.nativeElement.querySelector<HTMLElement>('.strct-flow__fan');
    const edges = this.edges();
    if (!fan || !edges?.length) {
      this.edgePaths.set([]);
      return;
    }
    const base = fan.getBoundingClientRect();
    this.viewBox.set(`0 0 ${Math.round(base.width)} ${Math.round(base.height)}`);
    // Looked up from the boxes themselves rather than through a selector: a
    // node id is consumer data, and CSS.escape is not everywhere (jsdom).
    const boxes = new Map<string, HTMLElement>();
    for (const el of fan.querySelectorAll<HTMLElement>('[data-flow-node]')) {
      const id = el.dataset['flowNode'];
      if (id) boxes.set(id, el);
    }
    const rect = (id: string) => {
      const el = boxes.get(id);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: r.left - base.left, y: r.top - base.top, w: r.width, h: r.height };
    };
    const paths = [];
    for (const [i, e] of edges.entries()) {
      const a = rect(e.from);
      const b = rect(e.to);
      if (!a || !b) continue;
      const x1 = a.x + a.w;
      const y1 = a.y + a.h / 2;
      const x2 = b.x;
      const y2 = b.y + b.h / 2;
      const mid = x1 + (x2 - x1) / 2;
      const d =
        Math.abs(y1 - y2) < 1
          ? `M ${x1} ${y1} L ${x2} ${y2}`
          : `M ${x1} ${y1} H ${mid} V ${y2} H ${x2}`;
      paths.push({
        key: `${e.from}-${e.to}-${i}`,
        d,
        status: e.status ?? 'neutral',
        dashed: e.style === 'dashed',
        animated: !!e.animated,
      });
    }
    this.edgePaths.set(paths);
  }

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
