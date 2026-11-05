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
  model,
  output,
  signal,
} from '@angular/core';
import { StrctIcon } from '../icon/icon';
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
  /**
   * A word on the line itself — "LACP · 2 × 10 GbE", "down 2 d", "trunk
   * 200–209". Drawn in the clear strip the edge turns in, never over a box,
   * and bounded by that strip with an ellipsis. The column gap grows to make
   * room for the widest one.
   */
  label?: string;
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
  /** A leading icon, for a node whose kind is part of the answer. */
  icon?: string;
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

/** How far an anchor stays off a box's rounded corner. */
const ANCHOR_INSET = 9;
/** The least room between two anchors on one side of one box. */
const MIN_ANCHOR_PITCH = 7;
/** Corner radius where a run turns into its trunk. */
const CORNER = 6;
/** Breathing room around an edge label inside its strip. */
const TAG_PAD = 5;
/** Below this much strip a label is not drawn at all. */
const MIN_TAG = 44;
/** The widest gap the labels may ask the columns for. */
const MAX_LABEL_GAP = 184;
/** The width a column keeps whatever the labels ask for. */
const MIN_COL = 112;
/** Radius of the tick where an edge meets a box it has to share. */
const ANCHOR_R = 2.5;
/** Where along its trunk a label may sit, best first. */
const TAG_SPOTS = [0.5, 0.36, 0.64, 0.26, 0.74];
/** Worst first: a critical label keeps the middle of its own run. */
const WEIGHT: Record<string, number> = {
  neutral: 0,
  success: 1,
  accent: 2,
  warning: 3,
  critical: 4,
};

/** A box, an anchor or a label, in the fan's own coordinates. */
interface FlowBox {
  x: number;
  y: number;
  w: number;
  h: number;
}
interface FlowRect {
  l: number;
  t: number;
  r: number;
  b: number;
}
/** An x range no box occupies: where a trunk and a label may go. */
interface FlowStrip {
  l: number;
  r: number;
}
interface FlowEdgePath {
  key: string;
  from: string;
  to: string;
  d: string;
  status: string;
  dashed: boolean;
  animated: boolean;
}
interface FlowEdgeTag {
  key: string;
  from: string;
  to: string;
  text: string;
  status: string;
  x: number;
  y: number;
  max: number;
}
interface FlowAnchor {
  key: string;
  from: string;
  to: string;
  x: number;
  y: number;
  status: string;
}

const round = (n: number): number => Math.round(n * 100) / 100;
const overlapArea = (a: FlowRect, b: FlowRect): number =>
  Math.max(0, Math.min(a.r, b.r) - Math.max(a.l, b.l)) *
  Math.max(0, Math.min(a.b, b.b) - Math.max(a.t, b.t));
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
  imports: [NgTemplateOutlet, StrctIcon],
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
              [class.strct-flow__edge--on]="isOn(e)"
              [attr.d]="e.d"
              fill="none"
            />
          }
          <!-- A tick where an edge meets a box, drawn only where the box has
               more than one on that side: that is the only place the eye has
               to be told which line leaves from where. -->
          @for (a of edgeAnchors(); track a.key) {
            <circle
              class="strct-flow__anchor strct-flow__anchor--{{ a.status }}"
              [class.strct-flow__anchor--on]="isOn(a)"
              [attr.cx]="a.x"
              [attr.cy]="a.y"
              [attr.r]="anchorR"
            />
          }
        </svg>
        @if (edgeTags().length) {
          <div class="strct-flow__tags" aria-hidden="true">
            @for (t of edgeTags(); track t.key) {
              <span
                class="strct-flow__tag strct-flow__tag--{{ t.status }}"
                [class.strct-flow__tag--on]="isOn(t)"
                [attr.data-flow-tag]="t.key"
                [style.left.px]="t.x"
                [style.top.px]="t.y"
                [style.max-width.px]="t.max"
                [title]="t.text"
                >{{ t.text }}</span
              >
            }
          </div>
        }
        @for (col of columnsView(); track col.index; let i = $index) {
          <div
            class="strct-flow__col"
            role="group"
            [attr.aria-label]="col.heading || null"
            [style.margin-inline-start.px]="extraGap()[i] || null"
          >
            @if (col.heading) {
              <div class="strct-flow__colhead">{{ col.heading }}</div>
            }
            @if (!col.nodes.length && col.emptyText) {
              <p class="strct-flow__colempty">{{ col.emptyText }}</p>
            }
            <!-- A read-only diagram is a list of items. A navigable one is a
                 group of buttons: an <li> may not take role="button" and a <ul>
                 may only hold list items (axe \`aria-allowed-role\` / \`list\`),
                 so its boxes are plain <div>s inside a plain <div>. -->
            @if (navigable()) {
              <div class="strct-flow__boxes">
                @for (node of col.nodes; track node.id) {
                  <div
                    class="strct-flow__box strct-flow__box--navigable strct-flow__box--{{
                      node.status ?? 'neutral'
                    }}"
                    [class.strct-flow__box--surface]="node.emphasis === 'surface'"
                    [class.strct-flow__box--picked]="node.id === selected()"
                    [class.strct-flow__box--on]="isLit(node.id)"
                    [attr.data-flow-node]="node.id"
                    role="button"
                    [attr.tabindex]="isCursor(node) ? 0 : -1"
                    (click)="activate(node)"
                    (focus)="cursor.set(node.id)"
                    (keydown)="onNodeKeydown($event, node)"
                  >
                    <ng-container
                      [ngTemplateOutlet]="boxContent"
                      [ngTemplateOutletContext]="{ $implicit: node }"
                    />
                  </div>
                }
              </div>
            } @else {
              <ul class="strct-flow__boxes">
                @for (node of col.nodes; track node.id) {
                  <li
                    class="strct-flow__box strct-flow__box--{{ node.status ?? 'neutral' }}"
                    [class.strct-flow__box--surface]="node.emphasis === 'surface'"
                    [class.strct-flow__box--picked]="node.id === selected()"
                    [class.strct-flow__box--on]="isLit(node.id)"
                    [attr.data-flow-node]="node.id"
                  >
                    <ng-container
                      [ngTemplateOutlet]="boxContent"
                      [ngTemplateOutletContext]="{ $implicit: node }"
                    />
                  </li>
                }
              </ul>
            }
          </div>
        }
      </div>
      @if (label()) {
        <div class="strct-flow__caption">{{ label() }}</div>
      }
      <!-- One box's content, shared by the list and the button forms. -->
      <ng-template #boxContent let-node>
        @if (nodeTpl(); as tpl) {
          <ng-container
            [ngTemplateOutlet]="tpl"
            [ngTemplateOutletContext]="{ $implicit: node, node }"
          />
        } @else {
          @if (node.icon) {
            <strct-icon class="strct-flow__icon" [name]="node.icon" [size]="15" />
          }
          <span class="strct-flow__label">{{ node.label }}</span>
          @if (node.role) {
            <span class="strct-flow__role">{{ node.role }}</span>
          }
          @if (node.sublabel) {
            <span class="strct-flow__sub">{{ node.sublabel }}</span>
          }
        }
        <span class="strct-flow__sr">{{ nodeSummary(node) }}</span>
      </ng-template>
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
    '[class.strct-flow--measured]': 'measured()',
    '[class.strct-flow--isolated]': "layout() !== 'chain' && isolate() && !!selected()",
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
        /* The floor under every strip. A strip that carries labels is widened
           past it by a margin on the column after it, so a gap with nothing
           written in it is not made to pay for one that has. */
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
        stroke-width: var(--data-stroke-sm);
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
      /* Where an edge meets a box it has to share, so the eye can count the
         attachments instead of guessing at one crowded point. */
      .strct-flow__anchor {
        fill: var(--b3);
      }
      .strct-flow__anchor--accent {
        fill: var(--acc);
      }
      .strct-flow__anchor--success {
        fill: var(--success);
      }
      .strct-flow__anchor--warning {
        fill: var(--warning);
      }
      .strct-flow__anchor--critical {
        fill: var(--critical);
      }

      /* ── A word on the line ────────────────────────────────────
         The same pill the wiring map puts on a cable, for the same reason: a
         line's tone says how it is, and only a word says what it is. */
      .strct-flow__tags {
        position: absolute;
        inset: 0;
        pointer-events: none;
      }
      .strct-flow__tag {
        position: absolute;
        display: block;
        overflow: hidden;
        text-overflow: ellipsis;
        transform: translate(-50%, -50%);
        padding: 1px var(--space-2);
        border: 1px solid var(--b2);
        border-radius: var(--radius-pill);
        background: var(--bg-1);
        font-size: var(--text-xs);
        line-height: 1.5;
        color: var(--t2);
        white-space: nowrap;
        /* Placed from its own rendered size, so it is not drawn until it has
           been measured. */
        opacity: 0;
      }
      .strct-flow--measured .strct-flow__tag {
        opacity: 1;
      }
      .strct-flow__tag--accent {
        border-color: var(--acc30);
        color: var(--acc);
      }
      .strct-flow__tag--success {
        border-color: var(--success);
        color: var(--success);
      }
      .strct-flow__tag--warning {
        border-color: var(--warning);
        color: var(--warning);
      }
      .strct-flow__tag--critical {
        border-color: var(--critical);
        color: var(--critical);
      }
      /* The tone layers over the pill's own surface instead of replacing it,
         so the label keeps a ground to be read against. */
      .strct-flow__tag--on.strct-flow__tag--accent {
        background-image: linear-gradient(var(--acc-m), var(--acc-m));
      }
      .strct-flow__tag--on.strct-flow__tag--success {
        background-image: linear-gradient(var(--success-bg), var(--success-bg));
      }
      .strct-flow__tag--on.strct-flow__tag--warning {
        background-image: linear-gradient(var(--warning-bg), var(--warning-bg));
      }
      .strct-flow__tag--on.strct-flow__tag--critical {
        background-image: linear-gradient(var(--critical-bg), var(--critical-bg));
      }
      .strct-flow__tag--on {
        font-weight: 500;
      }

      /* ── One path at a time ────────────────────────────────────
         Picking a node lifts what it is wired to and lets the rest recede.
         Isolation acts on the drawing and never on the words: text taken out
         of contrast is not de-emphasised, it is unreadable — the wiring map
         measured a dimmed warning label at 3.31:1 against a light surface,
         under the 4.5:1 it needs. So the lines and the ticks recede, and
         every label and every box keeps the contrast it had. */
      .strct-flow--isolated .strct-flow__edge:not(.strct-flow__edge--on) {
        opacity: 0.22;
      }
      .strct-flow--isolated .strct-flow__anchor:not(.strct-flow__anchor--on) {
        opacity: 0.22;
      }
      .strct-flow__edge--on {
        stroke-width: calc(var(--data-stroke-sm) + 1);
      }
      .strct-flow__box--picked {
        box-shadow: 0 0 0 2px var(--acc30);
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
        /* A column narrowed by the labels' strip still holds its own words. */
        overflow-wrap: anywhere;
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
      /* A node you can walk to and act on: one tab stop for the diagram, the
         arrow keys inside it. Off unless navigable is set, so a decorative
         pipeline keeps no tab stop at all. */
      .strct-flow__box--navigable {
        cursor: pointer;
      }
      .strct-flow__box--navigable:focus-visible {
        outline: 2px solid var(--acc);
        outline-offset: 2px;
      }
      .strct-flow__icon {
        color: var(--t2);
        flex: none;
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
        .strct-flow__edges,
        .strct-flow__tags {
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
        font-size: var(--text-sm);
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
        border-radius: var(--radius-xs);
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

  /**
   * One tab stop for the whole diagram, with the arrow keys walking it:
   * ← / → follow the edges (or the columns, where a node has none), ↑ / ↓ move
   * within a column, Home / End jump to its ends. Off by default, so a
   * decorative pipeline keeps no tab stop at all.
   */
  readonly navigable = input(false, { transform: booleanAttribute });
  /** Emitted when a node is clicked, or Enter / Space is pressed on it. */
  readonly nodeActivate = output<StrctFlowNode>();
  /**
   * The picked node's id. Activating a node sets it; two-way bound so a screen
   * can drive the diagram from a list beside it, and `null` clears it.
   */
  readonly selected = model<string | null>(null);
  /**
   * While a node is picked, let the edges it is not on recede. On by default:
   * a topology is read one path at a time. It acts on the drawing only — no
   * text is ever dimmed.
   */
  readonly isolate = input(true, { transform: booleanAttribute });

  /** The nodes the picked one is wired to, itself included. */
  private readonly lit = computed<Set<string>>(() => {
    const id = this.selected();
    const out = new Set<string>();
    if (!id) return out;
    out.add(id);
    for (const e of this.edges() ?? []) {
      if (e.from === id) out.add(e.to);
      if (e.to === id) out.add(e.from);
    }
    return out;
  });

  /** Whether an edge, a tick or a label is on the picked node's path. */
  protected isOn(e: { from: string; to: string }): boolean {
    const id = this.selected();
    return !!id && (e.from === id || e.to === id);
  }

  /** Whether a box is the picked node or something it is wired to. */
  protected isLit(id: string): boolean {
    return this.lit().has(id);
  }
  /** The node the tab stop is on (its id). */
  protected readonly cursor = signal<string | null>(null);

  protected isCursor(node: StrctFlowNode): boolean {
    const at = this.cursor();
    if (at) return at === node.id;
    // Nothing focused yet: the first node of the first column holds the stop.
    return this.columnsView()[0]?.nodes[0]?.id === node.id;
  }

  protected activate(node: StrctFlowNode): void {
    if (!this.navigable()) return;
    this.cursor.set(node.id);
    // Picking the picked one clears it, so the diagram can always be read
    // whole again without reaching for a control that is not in the picture.
    this.selected.set(this.selected() === node.id ? null : node.id);
    this.nodeActivate.emit(node);
  }

  protected onNodeKeydown(event: KeyboardEvent, node: StrctFlowNode): void {
    if (!this.navigable()) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.activate(node);
      return;
    }
    const keys = ['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown', 'Home', 'End'];
    if (!keys.includes(event.key)) return;
    event.preventDefault();
    const next = this.neighbour(node, event.key);
    if (next) this.focusNode(next);
  }

  /** Where a key leads from `node`: along an edge, or within the column. */
  private neighbour(node: StrctFlowNode, key: string): string | null {
    const cols = this.columnsView();
    const col = cols.find((c) => c.nodes.some((n) => n.id === node.id));
    if (!col) return null;
    const within = col.nodes.findIndex((n) => n.id === node.id);
    const edges = this.edges() ?? [];
    switch (key) {
      case 'ArrowDown':
        return col.nodes[within + 1]?.id ?? col.nodes[0]?.id ?? null;
      case 'ArrowUp':
        return col.nodes[within - 1]?.id ?? col.nodes[col.nodes.length - 1]?.id ?? null;
      case 'Home':
        return col.nodes[0]?.id ?? null;
      case 'End':
        return col.nodes[col.nodes.length - 1]?.id ?? null;
      case 'ArrowRight': {
        // The edge is the structure: the first node this one leads to.
        const out = edges.find((e) => e.from === node.id)?.to;
        if (out) return out;
        const at = cols.indexOf(col);
        return cols[at + 1]?.nodes[0]?.id ?? null;
      }
      default: {
        const into = edges.find((e) => e.to === node.id)?.from;
        if (into) return into;
        const at = cols.indexOf(col);
        return cols[at - 1]?.nodes[0]?.id ?? null;
      }
    }
  }

  private focusNode(id: string): void {
    this.cursor.set(id);
    // Matched by reading the attribute rather than by building a selector:
    // an id is the consumer's string, and CSS.escape is not everywhere (jsdom
    // has none, and a throw here would silently leave the focus behind).
    const el = [...this.host.nativeElement.querySelectorAll<HTMLElement>('[data-flow-node]')].find(
      (n) => n.getAttribute('data-flow-node') === id,
    );
    el?.focus();
  }

  /** What a node says to assistive tech: itself, then where it leads. */
  protected nodeSummary(node: StrctFlowNode): string {
    const out = (this.edges() ?? [])
      .filter((e) => e.from === node.id)
      .map((e) => {
        const to = this.nodes().find((n) => n.id === e.to)?.label ?? e.to;
        // The word on the line is part of the answer and the line is never
        // read aloud, so it is said here: a label ellipsised inside a narrow
        // strip, or dropped with the drawing when the columns stack, would
        // otherwise be lost to everyone who is not looking at the picture.
        return e.label ? `${to} (${e.label})` : to;
      });
    return out.length ? `→ ${out.join(', ')}` : '';
  }

  /** Measured edge geometry — recomputed whenever the boxes move or resize. */
  protected readonly edgePaths = signal<FlowEdgePath[]>([]);
  /** Ticks where an edge meets a box that carries more than one on that side. */
  protected readonly edgeAnchors = signal<FlowAnchor[]>([]);
  /** The words on the lines, placed from their own rendered size. */
  protected readonly edgeTags = signal<FlowEdgeTag[]>([]);
  protected readonly viewBox = signal('0 0 0 0');
  /** Extra room reserved before each column for the labels in the strip
   *  ahead of it, in CSS px, in the order the columns are rendered. */
  protected readonly extraGap = signal<number[]>([]);
  /** False until the labels have been measured and placed. */
  protected readonly measured = signal(false);
  /** Radius of an anchor tick, so the template and the geometry agree. */
  protected readonly anchorR = ANCHOR_R;
  /** Each labelled edge's trunk, kept for placing its label a frame later. */
  private trunks = new Map<
    string,
    { x: number; y0: number; y1: number; strip: FlowStrip; at: number }
  >();
  /** How many strips and columns the last measure found, so the labels know
   *  which column stands after the strip they are in. */
  private stripCount = 0;

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
   * Orthogonal connectors, from the boxes' real positions — and from each
   * edge's own place on them. An edge leaves its source at its own anchor,
   * turns in its own lane inside a clear strip, and arrives at its own anchor
   * on the target, so two edges never leave one pixel and never run down one.
   */
  private measure(): void {
    if (this.layout() === 'chain') return;
    const fan = this.host.nativeElement.querySelector<HTMLElement>('.strct-flow__fan');
    const edges = this.edges();
    const clear = () => {
      this.edgePaths.set([]);
      this.edgeAnchors.set([]);
      this.edgeTags.set([]);
      this.trunks.clear();
      this.measured.set(true);
    };
    if (!fan || !edges?.length) {
      clear();
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
    const rect = (id: string): FlowBox | null => {
      const el = boxes.get(id);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: r.left - base.left, y: r.top - base.top, w: r.width, h: r.height };
    };

    interface Run {
      e: StrctFlowEdge;
      i: number;
      a: FlowBox;
      b: FlowBox;
      y1: number;
      y2: number;
      lane: number;
      strip: FlowStrip | null;
      stripAt: number;
    }
    const runs: Run[] = [];
    for (const [i, e] of edges.entries()) {
      const a = rect(e.from);
      const b = rect(e.to);
      if (!a || !b) continue;
      runs.push({
        e,
        i,
        a,
        b,
        y1: a.y + a.h / 2,
        y2: b.y + b.h / 2,
        lane: 0,
        strip: null,
        stripAt: -1,
      });
    }
    if (!runs.length) {
      clear();
      return;
    }

    // ── The clear strips: the x no box occupies. A trunk turns in one and a
    //    label lives in one — the rule the wiring map's labels follow, for
    //    the same reason: a line drawn through a box says nothing, and a word
    //    written over one says less.
    const merged: FlowStrip[] = [];
    const bands = [...boxes.values()]
      .map((el) => {
        const r = el.getBoundingClientRect();
        return { l: r.left - base.left, r: r.right - base.left };
      })
      .sort((p, q) => p.l - q.l);
    for (const band of bands) {
      const last = merged[merged.length - 1];
      if (last && band.l <= last.r + 0.5) last.r = Math.max(last.r, band.r);
      else merged.push({ ...band });
    }
    const strips = merged.slice(0, -1).map((m, i) => ({ l: m.r, r: merged[i + 1].l }));

    // ── Anchors. Where a node carries more than one edge on a side they
    //    spread across it, ordered by the far end so two of them never cross
    //    on their way out. One edge keeps the centre, as before.
    const spread = (box: FlowBox, k: number, at: number): number => {
      if (k <= 1) return box.y + box.h / 2;
      const inset = Math.min(ANCHOR_INSET, Math.max(2, box.h / 2 - 2));
      let top = box.y + inset;
      let bottom = box.y + box.h - inset;
      if (bottom - top < MIN_ANCHOR_PITCH * (k - 1)) {
        top = box.y + 2;
        bottom = box.y + box.h - 2;
      }
      return top + ((bottom - top) * at) / (k - 1);
    };
    const bySide = (id: string, out: boolean): Run[] =>
      runs
        .filter((r) => (out ? r.e.from : r.e.to) === id)
        .sort((p, q) => {
          const pf = out ? p.b : p.a;
          const qf = out ? q.b : q.a;
          return pf.y + pf.h / 2 - (qf.y + qf.h / 2);
        });
    const outCount = new Map<string, number>();
    const inCount = new Map<string, number>();
    for (const id of new Set(runs.map((r) => r.e.from))) {
      const set = bySide(id, true);
      outCount.set(id, set.length);
      set.forEach((r, at) => (r.y1 = spread(r.a, set.length, at)));
    }
    for (const id of new Set(runs.map((r) => r.e.to))) {
      const set = bySide(id, false);
      inCount.set(id, set.length);
      set.forEach((r, at) => (r.y2 = spread(r.b, set.length, at)));
    }

    // ── Lanes. Every trunk in a strip gets an x of its own, so no stretch of
    //    line is ever drawn twice — which is what made a down uplink and a
    //    healthy one share pixels before.
    const inStrip = new Map<number, Run[]>();
    for (const r of runs) {
      const lo = Math.min(r.a.x + r.a.w, r.b.x);
      const hi = Math.max(r.a.x + r.a.w, r.b.x);
      let best = -1;
      let widest = 0;
      strips.forEach((st, at) => {
        const w = Math.min(st.r, hi) - Math.max(st.l, lo);
        if (w > widest) {
          widest = w;
          best = at;
        }
      });
      r.strip =
        best >= 0 ? { l: Math.max(strips[best].l, lo), r: Math.min(strips[best].r, hi) } : null;
      r.stripAt = best;
      inStrip.set(best, [...(inStrip.get(best) ?? []), r]);
    }
    for (const list of inStrip.values()) {
      const order = [...list].sort((p, q) => p.y2 - q.y2 || p.y1 - q.y1);
      order.forEach((r, at) => {
        r.lane = r.strip
          ? r.strip.l + ((r.strip.r - r.strip.l) * (at + 1)) / (order.length + 1)
          : (r.a.x + r.a.w + r.b.x) / 2;
      });
    }

    const paths: FlowEdgePath[] = [];
    const anchors: FlowAnchor[] = [];
    const tags: FlowEdgeTag[] = [];
    const trunks = new Map<
      string,
      { x: number; y0: number; y1: number; strip: FlowStrip; at: number }
    >();
    this.stripCount = strips.length;
    for (const r of runs) {
      const x1 = r.a.x + r.a.w;
      const x2 = r.b.x;
      const { y1, y2, lane } = r;
      const key = `${r.e.from}-${r.e.to}-${r.i}`;
      const status = r.e.status ?? 'neutral';
      let d: string;
      if (Math.abs(y1 - y2) < 0.5) {
        d = `M ${round(x1)} ${round(y1)} L ${round(x2)} ${round(y2)}`;
      } else {
        const dy = y2 > y1 ? 1 : -1;
        const sx = lane >= x1 ? 1 : -1;
        const ex = x2 >= lane ? 1 : -1;
        // A turn the eye can follow where several lanes run side by side.
        const rad = Math.min(
          CORNER,
          Math.abs(y2 - y1) / 2,
          Math.abs(lane - x1),
          Math.abs(x2 - lane),
        );
        d =
          rad < 1
            ? `M ${round(x1)} ${round(y1)} H ${round(lane)} V ${round(y2)} H ${round(x2)}`
            : `M ${round(x1)} ${round(y1)} H ${round(lane - sx * rad)} ` +
              `Q ${round(lane)} ${round(y1)} ${round(lane)} ${round(y1 + dy * rad)} ` +
              `V ${round(y2 - dy * rad)} ` +
              `Q ${round(lane)} ${round(y2)} ${round(lane + ex * rad)} ${round(y2)} ` +
              `H ${round(x2)}`;
      }
      paths.push({
        key,
        from: r.e.from,
        to: r.e.to,
        d,
        status,
        dashed: r.e.style === 'dashed',
        animated: !!r.e.animated,
      });
      // The tick sits tangent to the box, not on its edge: the boxes paint
      // over the edge layer, and half a dot under a card is not a mark.
      const away = Math.sign(x2 - x1) || 1;
      if ((outCount.get(r.e.from) ?? 0) > 1)
        anchors.push({
          key: `${key}-out`,
          from: r.e.from,
          to: r.e.to,
          x: round(x1 + away * ANCHOR_R),
          y: round(y1),
          status,
        });
      if ((inCount.get(r.e.to) ?? 0) > 1)
        anchors.push({
          key: `${key}-in`,
          from: r.e.from,
          to: r.e.to,
          x: round(x2 - away * ANCHOR_R),
          y: round(y2),
          status,
        });
      if (r.e.label && r.strip && r.strip.r - r.strip.l >= MIN_TAG) {
        trunks.set(key, {
          x: lane,
          y0: Math.min(y1, y2),
          y1: Math.max(y1, y2),
          strip: r.strip,
          at: r.stripAt,
        });
        tags.push({
          key,
          from: r.e.from,
          to: r.e.to,
          text: r.e.label,
          status,
          x: round(lane),
          y: round((y1 + y2) / 2),
          max: Math.round(r.strip.r - r.strip.l - TAG_PAD * 2),
        });
      }
    }
    this.trunks = trunks;
    this.edgePaths.set(paths);
    this.edgeAnchors.set(anchors);
    const before = this.edgeTags();
    const same =
      tags.length === before.length &&
      tags.every((t, i) => before[i]?.key === t.key && before[i]?.text === t.text);
    this.edgeTags.set(same ? before.map((t, i) => ({ ...t, max: tags[i].max })) : tags);
    if (!tags.length) {
      this.measured.set(true);
      return;
    }
    // A label is placed from its own rendered size, which is only known once
    // the browser has laid it out with the bound max-width.
    const place = () => this.placeTags(base.height);
    if (typeof requestAnimationFrame === 'function') requestAnimationFrame(place);
    else queueMicrotask(place);
  }

  /**
   * The labels. First the columns are pushed apart until the widest one has a
   * strip to live in — a word bounded to nothing is not a word — then each
   * slides along its own trunk, worst first, until it clears every label
   * already placed. A critical label keeps the middle of its own run and an
   * agreeing one moves, the order the wiring map settled on.
   */
  private placeTags(height: number): void {
    const fan = this.host.nativeElement.querySelector<HTMLElement>('.strct-flow__fan');
    if (!fan) return;
    const sizes = new Map<string, { w: number; h: number; natural: number }>();
    for (const el of fan.querySelectorAll<HTMLElement>('[data-flow-tag]')) {
      const key = el.getAttribute('data-flow-tag');
      if (!key) continue;
      const r = el.getBoundingClientRect();
      // scrollWidth is the content's own width while it is being clipped; the
      // border sits outside it.
      // scrollWidth is an integer and the border sits outside it, so the
      // natural width is that plus the two borders plus a pixel of slack —
      // one subpixel short and the text ellipsises inside a box built to fit.
      sizes.set(key, { w: r.width, h: r.height, natural: el.scrollWidth + 3 });
    }
    if (!sizes.size) {
      this.measured.set(true);
      return;
    }
    // What each strip's own labels need, against what the columns can spare.
    // Only a strip that carries a word is widened: making every gap pay for
    // the busiest one is what starves the boxes. A diagram that hands its
    // gaps to the words until its boxes cannot hold theirs has moved the
    // problem, not solved it, so under MIN_COL the labels take the strip they
    // are given and ellipsise inside it, with the full text in each node's
    // description either way.
    const cols = fan.querySelectorAll('.strct-flow__col').length;
    const base =
      Number.parseFloat(getComputedStyle(fan).getPropertyValue('--strct-flow-col-gap')) || 48;
    const want = new Array<number>(cols).fill(0);
    const aligned = this.stripCount === cols - 1;
    for (const tag of this.edgeTags()) {
      const trunk = this.trunks.get(tag.key);
      const size = sizes.get(tag.key);
      if (!trunk || !size) continue;
      // Strip i stands between column i and column i + 1, so the room goes
      // on the column after it. Where a column holds no box there is no band
      // for it and the strips no longer line up: then every gap takes the
      // widest label, which is the old, safe answer.
      const owner = aligned ? trunk.at + 1 : -1;
      const need = Math.min(MAX_LABEL_GAP, size.natural + TAG_PAD * 2);
      if (owner > 0 && owner < cols) want[owner] = Math.max(want[owner], need);
      else for (let i = 1; i < cols; i++) want[i] = Math.max(want[i], need);
    }
    const extra = want.map((w) => Math.max(0, w - base));
    // The columns keep their floor: anything over it is shared out in
    // proportion to what each strip asked for.
    const room = Math.max(
      0,
      fan.getBoundingClientRect().width - MIN_COL * cols - base * (cols - 1),
    );
    const asked = extra.reduce((a, b) => a + b, 0);
    const scale = asked > room ? room / asked : 1;
    const give = extra.map((e) => Math.round(e * scale));
    const have = this.extraGap();
    // The text does not change width when the columns move, so this settles
    // on the second pass and never oscillates.
    if (give.length !== have.length || give.some((g, i) => Math.abs(g - (have[i] ?? 0)) > 0.5)) {
      this.extraGap.set(give);
      const again = () => this.measure();
      if (typeof requestAnimationFrame === 'function') requestAnimationFrame(again);
      else queueMicrotask(again);
      return;
    }

    const placed: FlowRect[] = [];
    const at = new Map<string, { x: number; y: number }>();
    const order = [...this.edgeTags()].sort(
      (p, q) => (WEIGHT[q.status] ?? 0) - (WEIGHT[p.status] ?? 0),
    );
    for (const tag of order) {
      const trunk = this.trunks.get(tag.key);
      const size = sizes.get(tag.key);
      if (!trunk || !size) continue;
      const halfW = size.w / 2 + TAG_PAD;
      const halfH = size.h / 2 + TAG_PAD;
      const lo = trunk.y0 + halfH;
      const hi = trunk.y1 - halfH;
      // Along the trunk where the trunk is tall enough to hold it; across the
      // strip, on the runs into and out of the turn, where it is not.
      const tall = hi > lo;
      let best: { x: number; y: number; r: FlowRect } | null = null;
      let least = Infinity;
      // Bounded by its own strip on both axes: a label that leaves the strip
      // is a label over a box, and the boxes are what the picture is made of.
      const left = trunk.strip.l + halfW;
      const right = Math.max(left, trunk.strip.r - halfW);
      const clamp = (v: number) => Math.min(Math.max(v, left), right);
      for (const spot of TAG_SPOTS) {
        const x = clamp(tall ? trunk.x : trunk.strip.l + (trunk.strip.r - trunk.strip.l) * spot);
        const y = tall
          ? Math.min(Math.max(trunk.y0 + (trunk.y1 - trunk.y0) * spot, lo), hi)
          : (trunk.y0 + trunk.y1) / 2;
        const r = { l: x - halfW, t: y - halfH, r: x + halfW, b: y + halfH };
        if (r.t < 0 || r.b > height) continue;
        let ov = 0;
        for (const q of placed) ov += overlapArea(r, q);
        if (ov === 0) {
          best = { x, y, r };
          break;
        }
        if (ov < least) {
          least = ov;
          best = { x, y, r };
        }
      }
      if (!best) continue;
      placed.push(best.r);
      at.set(tag.key, { x: round(best.x), y: round(best.y) });
    }
    // Written only when something moved, so a resize that changes nothing
    // does not re-render the labels.
    const moved = this.edgeTags().some((t) => {
      const p = at.get(t.key);
      return !!p && (p.x !== t.x || p.y !== t.y);
    });
    if (moved) this.edgeTags.set(this.edgeTags().map((t) => ({ ...t, ...(at.get(t.key) ?? {}) })));
    this.measured.set(true);
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
