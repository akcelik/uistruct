import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  ViewEncapsulation,
  afterNextRender,
  booleanAttribute,
  computed,
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
 * One port on a device — the thing a cable actually lands on.
 *
 * A wiring map is not a graph of boxes: the answer is always "which port on
 * this goes to which port on that", so the port, not the node, is the
 * endpoint.
 */
export interface StrctWiringPort {
  /** Stable identity; a link names two of these. */
  id: string;
  /** What the port is called — "SLOT 3 Port 1", "Eth1/14". */
  label: string;
  /** The reading beside it — "25G · RDMA", "PFC 3", "not heard". */
  meta?: string;
  /** Tone of the port's dot. */
  status?: StrctStatus;
  /**
   * What this port says when no drawn link lands on it, in place of the
   * component's `unlinkedText`. A port with no cable means different things
   * in different maps — "nothing heard from a switch" on a map built from
   * LLDP, "not patched" on one built from a CMDB — and only the consumer
   * knows which, so the library never asserts the stronger one (FR-72-02).
   */
  unlinked?: string;
}

/** A device in the map: a host, a switch, a patch panel, a fabric. */
export interface StrctWiringNode {
  /** Stable identity (used as the @for track key). */
  id: string;
  /** Primary label — "HV-PRD-01", "tor-a". */
  label: string;
  /** The line beside it — "SETswitch", "Nexus 93180 · LLDP". */
  sublabel?: string;
  /**
   * Which column the device sits in. When no node declares one, the columns
   * are derived from the links: a device is one column to the right of the
   * furthest device that links into it.
   */
  column?: number;
  /** A leading glyph, where the kind of device is part of the answer. */
  icon?: string;
  /** Its ports, in the order they are read on the device. */
  ports: StrctWiringPort[];
}

/** One cable between two ports. */
export interface StrctWiringLink {
  /** Stable identity — what `selected` holds and `linkActivate` emits. */
  id: string;
  /** Port id this end lands on. */
  from: string;
  /** Port id the other end lands on. */
  to: string;
  /** Tone of the line: what the two ends' disagreement is worth. */
  status?: StrctStatus;
  /** `dashed` for a link that is inferred rather than observed. */
  style?: 'solid' | 'dashed';
  /** A pill drawn on the line itself — "PFC 3 ≠ 4", "6 flaps in 1 h". */
  label?: string;
}

/** What a port's activation reports: the port, its device, and its links. */
export interface StrctWiringPortEvent {
  node: StrctWiringNode;
  port: StrctWiringPort;
  links: StrctWiringLink[];
}

/**
 * Painting order, so a problem is never drawn under a line that agrees.
 * The selected link is painted after all of them.
 */
const WEIGHT: Record<StrctStatus, number> = {
  neutral: 0,
  success: 1,
  accent: 2,
  warning: 3,
  critical: 4,
};

/** Where in its own strip a label may sit, as a share of the strip, best first. */
const TAG_SPOTS = [0.5, 0.37, 0.63, 0.26, 0.74];
/** Clear space kept around a placed label, in px. */
const TAG_PAD = 5;
/** The shortest a cable's horizontal reach may be before the curve kinks. */
const MIN_REACH = 18;
/**
 * A label is bounded by its own run, the way a bar's label is bounded by its
 * own band: it ends in an ellipsis rather than spilling over a device. Below
 * this much room there is nothing left to read, so it is not drawn — the
 * cable keeps its tone, and both of its ports still carry the words.
 */
const MIN_TAG = 44;

interface Rect {
  l: number;
  t: number;
  r: number;
  b: number;
}

interface Cubic {
  x1: number;
  y1: number;
  cx1: number;
  cy1: number;
  cx2: number;
  cy2: number;
  x2: number;
  y2: number;
}

/** A clear vertical strip between two columns of devices. */
interface Gap {
  l: number;
  r: number;
}

interface LinkPath {
  id: string;
  d: string;
  status: StrctStatus;
  dashed: boolean;
  curve: Cubic;
  /** The widest clear strip this cable crosses — where its label may live. */
  gap: Gap | null;
}

/** The `t` at which a cubic is nearest a given x — sampled, then bisected. */
function tAtX(c: Cubic, x: number): number {
  let best = 0;
  let bestD = Infinity;
  for (let i = 0; i <= 60; i++) {
    const t = i / 60;
    const d = Math.abs(pointAt(c, t).x - x);
    if (d < bestD) {
      bestD = d;
      best = t;
    }
  }
  let lo = Math.max(0, best - 1 / 60);
  let hi = Math.min(1, best + 1 / 60);
  for (let i = 0; i < 24; i++) {
    const m = (lo + hi) / 2;
    if (Math.abs(pointAt(c, lo).x - x) < Math.abs(pointAt(c, hi).x - x)) hi = m;
    else lo = m;
  }
  return (lo + hi) / 2;
}

/** A point on a cubic Bézier at parameter `t`. */
function pointAt(c: Cubic, t: number): { x: number; y: number } {
  const u = 1 - t;
  const a = u * u * u;
  const b = 3 * u * u * t;
  const d = 3 * u * t * t;
  const e = t * t * t;
  return {
    x: a * c.x1 + b * c.cx1 + d * c.cx2 + e * c.x2,
    y: a * c.y1 + b * c.cy1 + d * c.cy2 + e * c.y2,
  };
}

/**
 * The widest clear strip a cable crosses: where a label on it can sit without
 * covering a device. A cable between neighbouring columns crosses exactly
 * one; a cable that skips a column crosses two, with a device card between
 * them, and the label belongs in whichever of them has the room.
 */
function widestGap(gaps: Gap[], c: Cubic): Gap | null {
  const lo = Math.min(c.x1, c.x2);
  const hi = Math.max(c.x1, c.x2);
  let best: Gap | null = null;
  for (const g of gaps) {
    const l = Math.max(g.l, lo);
    const r = Math.min(g.r, hi);
    if (r - l > (best ? best.r - best.l : 0)) best = { l, r };
  }
  // A cable that loops back into its own column has no strip inside its own
  // span: it uses the one it loops into.
  if (!best && hi - lo < 1) {
    for (const g of gaps) if (g.l >= lo - 1) return g;
  }
  return best;
}

/** How much of `a` and `b` overlap, in px² — 0 when they clear each other. */
function overlap(a: Rect, b: Rect): number {
  const w = Math.min(a.r, b.r) - Math.max(a.l, b.l);
  const h = Math.min(a.b, b.b) - Math.max(a.t, b.t);
  return w > 0 && h > 0 ? w * h : 0;
}

const round = (n: number): number => Math.round(n * 100) / 100;

/**
 * A port-level wiring map: columns of devices, each device's ports in order,
 * and one curve per cable drawn **between the two ports** rather than between
 * the two boxes.
 *
 *   <strct-wiring
 *     [nodes]="nodes" [links]="links"
 *     [columns]="['Nodes · SET team', 'Switches']"
 *     navigable [(selected)]="link" />
 *
 * It answers the question every fabric review starts from — node port → switch
 * port, as LLDP heard them; initiator → target; patch panel A → B; vNIC → pNIC
 * — and it answers the second question too, which is whether the two ends
 * agree: a link carries a tone and a label that sits on the line itself.
 *
 * Selecting a link lifts it and its two ports and lets everything else recede
 * (`isolate`, on by default), because a wiring map is read one cable at a
 * time. The curve leaves and arrives horizontally, so a cable reads as a
 * cable; labels are placed from the rendered text and pushed along their own
 * line until they clear each other.
 *
 * Keyboard: the map is one tab stop. ↑ / ↓ walk the ports of a column,
 * → and ← **follow the cable** to the port at its far end, Home / End jump to
 * the column's ends, and Enter / Space selects the link the port is on.
 */
@Component({
  selector: 'strct-wiring',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [NgTemplateOutlet, StrctIcon],
  template: `
    @if (!nodes().length) {
      <div class="strct-wiring__empty">{{ emptyText() }}</div>
    } @else {
      <div class="strct-wiring__map">
        <!-- The cables are geometry, not content: they are measured from the
             port rows after they render, and hidden from assistive tech, which
             is given each port and where it leads instead. The paths are a
             second way to reach a selection the ports already carry, so they
             take a pointer but never a tab stop. -->
        <svg class="strct-wiring__links" aria-hidden="true" [attr.viewBox]="viewBox()">
          @for (l of linkPaths(); track l.id) {
            <path
              class="strct-wiring__hit"
              [class.strct-wiring__hit--live]="navigable()"
              [attr.d]="l.d"
              fill="none"
              (click)="pickLink(l.id)"
            />
            <path
              class="strct-wiring__link strct-wiring__link--{{ l.status }}"
              [class.strct-wiring__link--dashed]="l.dashed"
              [class.strct-wiring__link--on]="l.id === selected()"
              [attr.d]="l.d"
              fill="none"
            />
          }
        </svg>

        @for (col of columnsView(); track col.index) {
          <div class="strct-wiring__col" role="group" [attr.aria-label]="col.heading || null">
            @if (col.heading) {
              <div class="strct-wiring__colhead">{{ col.heading }}</div>
            }
            @for (node of col.nodes; track node.id) {
              <div class="strct-wiring__node" [attr.data-wiring-node]="node.id">
                <div class="strct-wiring__nodehead">
                  @if (node.icon) {
                    <strct-icon class="strct-wiring__nodeicon" [name]="node.icon" [size]="14" />
                  }
                  <span class="strct-wiring__nodelabel" [title]="node.label">{{ node.label }}</span>
                  @if (node.sublabel) {
                    <span class="strct-wiring__nodesub" [title]="node.sublabel">{{
                      node.sublabel
                    }}</span>
                  }
                </div>
                <ul class="strct-wiring__ports">
                  @for (p of node.ports; track p.id) {
                    <li class="strct-wiring__portrow">
                      @if (navigable()) {
                        <button
                          type="button"
                          class="strct-wiring__port strct-wiring__port--{{ p.status ?? 'neutral' }}"
                          [class.strct-wiring__port--on]="isOn(p.id)"
                          [class.strct-wiring__port--on-start]="sideOf(p.id) === 'start'"
                          [class.strct-wiring__port--on-end]="sideOf(p.id) === 'end'"
                          [attr.data-wiring-port]="p.id"
                          [attr.tabindex]="isCursor(p.id) ? 0 : -1"
                          (click)="activatePort(node, p)"
                          (focus)="cursor.set(p.id)"
                          (keydown)="onPortKeydown($event, node, p)"
                        >
                          <ng-container
                            [ngTemplateOutlet]="portBody"
                            [ngTemplateOutletContext]="{ $implicit: p, node }"
                          />
                        </button>
                      } @else {
                        <span
                          class="strct-wiring__port strct-wiring__port--{{ p.status ?? 'neutral' }}"
                          [class.strct-wiring__port--on]="isOn(p.id)"
                          [class.strct-wiring__port--on-start]="sideOf(p.id) === 'start'"
                          [class.strct-wiring__port--on-end]="sideOf(p.id) === 'end'"
                          [attr.data-wiring-port]="p.id"
                        >
                          <ng-container
                            [ngTemplateOutlet]="portBody"
                            [ngTemplateOutletContext]="{ $implicit: p, node }"
                          />
                        </span>
                      }
                    </li>
                  }
                </ul>
              </div>
            }
          </div>
        }

        <!-- A link's label belongs on its link. These are HTML, not SVG text,
             so they take the page's type and can end in an ellipsis. -->
        <div class="strct-wiring__tags" aria-hidden="true">
          @for (t of tagsView(); track t.id) {
            <span
              class="strct-wiring__tag strct-wiring__tag--{{ t.status }}"
              [class.strct-wiring__tag--on]="t.id === selected()"
              [attr.data-wiring-tag]="t.id"
              [attr.title]="t.label"
              [style.left.px]="t.x"
              [style.top.px]="t.y"
              [style.max-width.px]="t.max"
              >{{ t.label }}</span
            >
          }
        </div>
      </div>

      @if (label()) {
        <div class="strct-wiring__caption">{{ label() }}</div>
      }

      <ng-template #portBody let-p let-node="node">
        <span class="strct-wiring__dot" aria-hidden="true"></span>
        <span class="strct-wiring__portlabel">{{ p.label }}</span>
        @if (p.meta) {
          <span class="strct-wiring__portmeta">{{ p.meta }}</span>
        }
        <span class="strct-wiring__sr">{{ portSummary(node, p) }}</span>
      </ng-template>
    }
  `,
  host: {
    class: 'strct-wiring',
    role: 'group',
    '[attr.aria-label]': 'ariaLabel()',
    '[class.strct-wiring--measured]': 'measured()',
    '[class.strct-wiring--isolated]': 'isolate() && activePorts().size > 0',
    // The selected cable's tone, so both of its ports wear the same one.
    '[style.--strct-wiring-on]': 'onTone().line',
    '[style.--strct-wiring-on-bg]': 'onTone().ground',
  },
  styles: [
    `
      .strct-wiring {
        display: block;
        container-type: inline-size;
      }
      .strct-wiring__map {
        position: relative;
        display: flex;
        align-items: flex-start;
        /* The run between the columns is the drawing. The columns take the
           width their own content needs and the space left over becomes the
           run, rather than the columns eating it and the cables turning into
           near-vertical jumps. */
        justify-content: space-between;
        gap: var(--strct-wiring-gap, 56px);
      }
      .strct-wiring__col {
        position: relative;
        flex: 0 1 auto;
        min-width: 0;
        max-width: var(--strct-wiring-col-max, 340px);
        display: flex;
        flex-direction: column;
        gap: var(--space-3);
      }
      .strct-wiring__colhead {
        font-size: var(--text-xs);
        font-weight: 600;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: var(--t3);
      }

      /* ── The devices ─────────────────────────────────────────── */
      .strct-wiring__node {
        border: 1px solid var(--b2);
        border-radius: var(--radius-md);
        background: var(--bg-1);
        overflow: hidden;
      }
      /* BUG-72-03: the device's name is its identity and wins over its
         reading. The head wraps, so a sublabel too long to share the line
         takes its own instead of squeezing the name — which, with the name
         breakable at any glyph and the sublabel unable to shrink at all, put
         a 14-character host name down the card one letter a line. */
      .strct-wiring__nodehead {
        display: flex;
        flex-wrap: wrap;
        align-items: baseline;
        gap: var(--space-1) var(--space-2);
        padding: var(--space-2) var(--space-3);
        border-block-end: 1px solid var(--b1);
      }
      .strct-wiring__nodeicon {
        color: var(--t2);
        align-self: center;
        flex: none;
      }
      .strct-wiring__nodelabel {
        font-size: var(--text-md);
        font-weight: 600;
        color: var(--t1);
        min-width: 0;
        /* Never inside a word: a host name broken between two glyphs is not
           the host name. An ellipsis is the last resort, and the full name
           stays in the title and in the map's own summary. */
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .strct-wiring__nodesub {
        margin-inline-start: auto;
        min-width: 0;
        font-size: var(--text-sm);
        color: var(--t3);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .strct-wiring__ports {
        list-style: none;
        margin: 0;
        padding: 0;
      }

      /* ── A port ──────────────────────────────────────────────── */
      .strct-wiring__port {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        width: 100%;
        padding: 6px var(--space-3);
        border: 0;
        /* The tone rides on a layer, so the row keeps the card's surface
           underneath it instead of replacing it. */
        background: transparent;
        font: inherit;
        font-size: var(--text-sm);
        color: var(--t1);
        text-align: start;
        /* The cable leaves the card's edge; the row must not round away
           from it. */
        border-radius: 0;
        position: relative;
      }
      .strct-wiring__dot {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        flex: none;
        background: var(--t4);
      }
      .strct-wiring__port--accent .strct-wiring__dot {
        background: var(--acc);
      }
      .strct-wiring__port--success .strct-wiring__dot {
        background: var(--success);
      }
      .strct-wiring__port--warning .strct-wiring__dot {
        background: var(--warning);
      }
      .strct-wiring__port--critical .strct-wiring__dot {
        background: var(--critical);
      }
      .strct-wiring__portlabel {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .strct-wiring__portmeta {
        margin-inline-start: auto;
        padding-inline-start: var(--space-2);
        font-size: var(--text-xs);
        color: var(--t3);
        white-space: nowrap;
      }
      .strct-wiring__sr {
        position: absolute;
        width: 1px;
        height: 1px;
        overflow: hidden;
        clip-path: inset(50%);
        white-space: nowrap;
      }
      button.strct-wiring__port {
        cursor: pointer;
      }
      button.strct-wiring__port:hover {
        background-image: linear-gradient(var(--bg-h), var(--bg-h));
      }
      button.strct-wiring__port:focus-visible {
        outline: 2px solid var(--acc);
        outline-offset: -2px;
      }
      /* The port at an end of the selected cable. The tone layers over the
         card rather than replacing it, and the rail sits on the edge the
         cable itself uses — so the two rails and the curve between them read
         as one gesture instead of three marks. */
      .strct-wiring__port--on {
        background-image: linear-gradient(
          var(--strct-wiring-on-bg, var(--acc-m)),
          var(--strct-wiring-on-bg, var(--acc-m))
        );
      }
      .strct-wiring__port--on::after {
        content: '';
        position: absolute;
        inset-block: 0;
        width: 3px;
        background: var(--strct-wiring-on, var(--acc));
      }
      .strct-wiring__port--on-start::after {
        inset-inline-start: 0;
      }
      .strct-wiring__port--on-end::after {
        inset-inline-end: 0;
      }
      .strct-wiring__port--on .strct-wiring__portlabel {
        font-weight: 500;
      }

      /* ── The cables ──────────────────────────────────────────── */
      .strct-wiring__links {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        overflow: visible;
        pointer-events: none;
      }
      .strct-wiring__link {
        /* A cable with nothing to say is still a cable: the resting stroke is
           a text tone, not a border tone, or an unremarked link reads as an
           absent one. */
        stroke: var(--t3);
        stroke-width: var(--data-stroke-sm);
        stroke-linecap: round;
        transition: opacity 120ms ease-out;
      }
      .strct-wiring__link--accent {
        stroke: var(--acc);
      }
      .strct-wiring__link--success {
        stroke: var(--success);
      }
      .strct-wiring__link--warning {
        stroke: var(--warning);
      }
      .strct-wiring__link--critical {
        stroke: var(--critical);
      }
      .strct-wiring__link--dashed {
        stroke-dasharray: 5 4;
      }
      .strct-wiring__link--on {
        stroke-width: calc(var(--data-stroke-sm) + 1);
      }
      /* A wide transparent stroke so the cable is as easy to hit as it is to
         see. It is pointer-only on purpose: everything it does is also on the
         port buttons, which are the keyboard's way in. */
      .strct-wiring__hit {
        stroke: transparent;
        stroke-width: 14;
        fill: none;
      }
      .strct-wiring__hit--live {
        pointer-events: stroke;
        cursor: pointer;
      }

      /* ── A cable's label ─────────────────────────────────────── */
      .strct-wiring__tags {
        position: absolute;
        inset: 0;
        pointer-events: none;
      }
      .strct-wiring__tag {
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
      .strct-wiring--measured .strct-wiring__tag {
        opacity: 1;
      }
      .strct-wiring__tag--accent {
        border-color: var(--acc30);
        color: var(--acc);
      }
      .strct-wiring__tag--success {
        border-color: var(--success);
        color: var(--success);
      }
      .strct-wiring__tag--warning {
        border-color: var(--warning);
        color: var(--warning);
      }
      .strct-wiring__tag--critical {
        border-color: var(--critical);
        color: var(--critical);
      }
      /* The tone layers over the pill's own surface instead of replacing it,
         so the label keeps a ground to be read against. */
      .strct-wiring__tag--on.strct-wiring__tag--success {
        background-image: linear-gradient(var(--success-bg), var(--success-bg));
      }
      .strct-wiring__tag--on.strct-wiring__tag--warning {
        background-image: linear-gradient(var(--warning-bg), var(--warning-bg));
      }
      .strct-wiring__tag--on.strct-wiring__tag--critical {
        background-image: linear-gradient(var(--critical-bg), var(--critical-bg));
      }
      .strct-wiring__tag--on.strct-wiring__tag--accent {
        background-image: linear-gradient(var(--acc-m), var(--acc-m));
      }

      /* ── One cable at a time ───────────────────────────────────
         Isolation acts on the drawing, never on the words. The cables and the
         dots recede, because what a line says is also written on both of its
         ports; no text is dimmed, because text taken out of contrast is not
         de-emphasised, it is unreadable — a warning label at 0.78 opacity
         measures 3.31:1 against a light surface, under the 4.5:1 it needs.
         The selection is lifted instead: a full-strength curve among faint
         ones, a thicker stroke, and both of its ports wearing its tone. */
      .strct-wiring--isolated .strct-wiring__link:not(.strct-wiring__link--on) {
        opacity: 0.3;
      }
      .strct-wiring--isolated .strct-wiring__port:not(.strct-wiring__port--on) .strct-wiring__dot {
        opacity: 0.4;
      }
      .strct-wiring__tag--on {
        font-weight: 500;
      }

      .strct-wiring__caption {
        margin-block-start: var(--space-3);
        font-size: var(--text-sm);
        color: var(--t3);
      }
      .strct-wiring__empty {
        padding: var(--space-3);
        border: 1px dashed var(--b2);
        border-radius: var(--radius-md);
        font-size: var(--text-sm);
        color: var(--t3);
      }

      /* Narrow: the columns stack and the cables go away, because a curve
         between stacked columns says nothing. Each port keeps its own
         "→ where it lands", which is the sentence the picture was drawing. */
      @container (max-width: 560px) {
        .strct-wiring__map {
          flex-direction: column;
          gap: var(--space-4);
          /* Stacked, the columns are rows of the page and take its width.
             flex-start would size each one to its widest card instead, and a
             device name is wider than a phone. */
          align-items: stretch;
        }
        /* The cap exists to leave room for the run, and there is no run. */
        .strct-wiring__col {
          max-width: none;
        }
        .strct-wiring__links,
        .strct-wiring__tags {
          display: none;
        }
        /* The sentence the cables were drawing, now written under its port. */
        .strct-wiring__port {
          flex-wrap: wrap;
        }
        .strct-wiring__sr {
          position: static;
          flex: 1 0 100%;
          width: auto;
          height: auto;
          clip-path: none;
          white-space: normal;
          /* Under the label, past the dot. */
          padding-inline-start: calc(7px + var(--space-2));
          font-size: var(--text-xs);
          color: var(--t3);
        }
        .strct-wiring__sr:empty {
          display: none;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .strct-wiring__link {
          transition: none;
        }
      }
    `,
  ],
})
export class StrctWiring {
  /** The devices, each with its ports. */
  readonly nodes = input<readonly StrctWiringNode[]>([]);
  /** The cables between those devices' ports. */
  readonly links = input<readonly StrctWiringLink[]>([]);
  /** Column headings, in order. */
  readonly columns = input<readonly string[] | null>(null);
  /** Caption under the map. */
  readonly label = input('');
  /** What is said when there is nothing to draw. */
  readonly emptyText = input('No wiring to show.');
  /**
   * What a port with no drawn link says, unless it sets its own `unlinked`.
   * On a map read from a live protocol this is an unknown, not a fact:
   * `unlinkedText="nothing heard from a switch"` (FR-72-02).
   */
  readonly unlinkedText = input('not wired');
  /**
   * Makes the map one tab stop with the arrow keys inside it, the ports
   * buttons, and the cables clickable. Off by default, so a read-only diagram
   * keeps no tab stop at all.
   */
  readonly navigable = input(false, { transform: booleanAttribute });
  /**
   * While a link is selected, everything that is not on it recedes — a wiring
   * map is read one cable at a time. Pass `false` to keep a selection that
   * only marks a link.
   */
  readonly isolate = input(true, { transform: booleanAttribute });
  /** The selected link's id. Two-way: a click on a cable or a port sets it. */
  readonly selected = model<string | null>(null);
  /** The link a click, or Enter / Space on one of its ports, acted on. */
  readonly linkActivate = output<StrctWiringLink>();
  /** The port a click, or Enter / Space, acted on — with the links it carries. */
  readonly portActivate = output<StrctWiringPortEvent>();

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);

  /** Where each port is, by id. */
  private readonly portIndex = computed(() => {
    const map = new Map<string, { node: StrctWiringNode; port: StrctWiringPort }>();
    for (const node of this.nodes()) {
      for (const port of node.ports ?? []) map.set(port.id, { node, port });
    }
    return map;
  });

  /**
   * Which column each device sits in: its own, or — when no device declares
   * one — one past the furthest device that links into it, so host → leaf →
   * spine falls out of the cabling rather than being spelled out.
   */
  private readonly columnOf = computed<Map<string, number>>(() => {
    const nodes = this.nodes();
    const out = new Map<string, number>();
    if (nodes.some((n) => n.column !== undefined)) {
      for (const n of nodes) out.set(n.id, n.column ?? 0);
      return out;
    }
    const ports = this.portIndex();
    const into = new Map<string, string[]>();
    for (const l of this.links()) {
      const a = ports.get(l.from)?.node.id;
      const b = ports.get(l.to)?.node.id;
      if (!a || !b || a === b) continue;
      into.set(b, [...(into.get(b) ?? []), a]);
    }
    const depth = (id: string, seen: Set<string>): number => {
      if (seen.has(id)) return 0;
      seen.add(id);
      const parents = into.get(id) ?? [];
      let d = 0;
      for (const p of parents) d = Math.max(d, depth(p, seen) + 1);
      seen.delete(id);
      return d;
    };
    for (const n of nodes) out.set(n.id, depth(n.id, new Set()));
    return out;
  });

  /** The columns as rendered: a heading (when given) and the devices in it. */
  protected readonly columnsView = computed(() => {
    const byColumn = new Map<number, StrctWiringNode[]>();
    for (const n of this.nodes()) {
      const c = this.columnOf().get(n.id) ?? 0;
      byColumn.set(c, [...(byColumn.get(c) ?? []), n]);
    }
    const headings = this.columns() ?? [];
    return [...byColumn.keys()]
      .sort((a, b) => a - b)
      .map((index, at) => ({
        index,
        heading: headings[at] ?? '',
        nodes: byColumn.get(index) ?? [],
      }));
  });

  /** The links both of whose ports exist, painted problems-last. */
  private readonly drawable = computed(() => {
    const ports = this.portIndex();
    const sel = this.selected();
    return this.links()
      .filter((l) => ports.has(l.from) && ports.has(l.to))
      .map((l, i) => ({ l, i }))
      .sort((a, b) => {
        // The selected cable is painted over every other one; below it,
        // severity decides, so a problem is never hidden under agreement.
        const sa = a.l.id === sel ? 1 : 0;
        const sb = b.l.id === sel ? 1 : 0;
        if (sa !== sb) return sa - sb;
        const wa = WEIGHT[a.l.status ?? 'neutral'];
        const wb = WEIGHT[b.l.status ?? 'neutral'];
        return wa !== wb ? wa - wb : a.i - b.i;
      })
      .map((e) => e.l);
  });

  /** The links a port is an end of. */
  private linksOf(portId: string): StrctWiringLink[] {
    return this.links().filter((l) => l.from === portId || l.to === portId);
  }

  /**
   * The two ports the selected link lands on — empty when the selection names
   * a link this map is not drawing, which is what keeps a filter that hides
   * the selected cable from dimming everything and lifting nothing.
   */
  protected readonly activePorts = computed(() => {
    const id = this.selected();
    const link = this.links().find((l) => l.id === id);
    return new Set(link ? [link.from, link.to] : []);
  });

  protected isOn(portId: string): boolean {
    return this.activePorts().has(portId);
  }

  /**
   * Which edge of its card each end of the selected cable leaves by. The rail
   * goes there, so it points at the run instead of away from it.
   */
  private readonly activeSides = computed(() => {
    const id = this.selected();
    const link = this.links().find((l) => l.id === id);
    const sides = new Map<string, 'start' | 'end'>();
    if (!link) return sides;
    const ports = this.portIndex();
    const columnOf = this.columnOf();
    const ca = columnOf.get(ports.get(link.from)?.node.id ?? '') ?? 0;
    const cb = columnOf.get(ports.get(link.to)?.node.id ?? '') ?? 0;
    if (cb > ca) {
      sides.set(link.from, 'end');
      sides.set(link.to, 'start');
    } else if (cb < ca) {
      sides.set(link.from, 'start');
      sides.set(link.to, 'end');
    } else {
      sides.set(link.from, 'end');
      sides.set(link.to, 'end');
    }
    return sides;
  });

  protected sideOf(portId: string): 'start' | 'end' | null {
    return this.activeSides().get(portId) ?? null;
  }

  /** The tone of the selected link, so its two ports wear the same one. */
  private readonly selectedStatus = computed(() => {
    const id = this.selected();
    return this.links().find((l) => l.id === id)?.status ?? 'accent';
  });

  /** The rail and the ground both ends of the selected cable wear. */
  protected readonly onTone = computed(() => {
    const tone = this.selectedStatus();
    return {
      line: tone === 'neutral' ? 'var(--t3)' : `var(--${tone === 'accent' ? 'acc' : tone})`,
      ground: tone === 'accent' || tone === 'neutral' ? 'var(--acc-m)' : `var(--${tone}-bg)`,
    };
  });

  constructor() {
    afterNextRender(() => this.observe());
    effect(() => {
      // Re-measure when the data changes; the observer covers size changes.
      this.nodes();
      this.links();
      this.columns();
      this.navigable();
      queueMicrotask(() => this.measure());
    });
  }

  // ── Geometry ───────────────────────────────────────────────────

  /** Measured cable geometry — recomputed whenever the ports move or resize. */
  protected readonly linkPaths = signal<LinkPath[]>([]);
  protected readonly viewBox = signal('0 0 0 0');
  /** Label positions, by link id — set once the labels have been measured. */
  private readonly tagAt = signal<Map<string, { x: number; y: number }>>(new Map());
  /** Whether the labels have been placed from their own rendered size. */
  protected readonly measured = signal(false);

  /**
   * Every label that has room, with the tone of its own cable and the width
   * of the run it has to live in.
   */
  protected readonly tagsView = computed(() => {
    const at = this.tagAt();
    const strips = new Map(this.linkPaths().map((p) => [p.id, p.gap]));
    const room = (id: string) => {
      const g = strips.get(id);
      return g ? g.r - g.l - 2 * TAG_PAD : 0;
    };
    return this.links()
      .filter((l) => !!l.label && room(l.id) >= MIN_TAG)
      .map((l) => ({
        id: l.id,
        label: l.label as string,
        status: l.status ?? 'neutral',
        max: Math.round(room(l.id)),
        x: at.get(l.id)?.x ?? 0,
        y: at.get(l.id)?.y ?? 0,
      }));
  });

  private observe(): void {
    if (typeof ResizeObserver === 'undefined') return;
    const map = this.host.nativeElement.querySelector<HTMLElement>('.strct-wiring__map');
    if (!map) return;
    const ro = new ResizeObserver(() => this.measure());
    ro.observe(map);
    // The port rows, not the labels: a label's position is written back, and
    // observing it would chase its own tail.
    for (const row of map.querySelectorAll('.strct-wiring__port')) ro.observe(row);
    this.destroyRef.onDestroy(() => ro.disconnect());
    this.measure();
  }

  /**
   * One curve per cable, from the real port rows: it leaves the device card's
   * inline edge at the port's own centre line, and arrives at the other port's
   * centre line. Both control points sit on those centre lines, so the cable
   * leaves and arrives horizontally instead of stabbing the card.
   */
  private measure(): void {
    const root = this.host.nativeElement;
    const map = root.querySelector<HTMLElement>('.strct-wiring__map');
    if (!map) {
      this.linkPaths.set([]);
      return;
    }
    const base = map.getBoundingClientRect();
    if (!base.width || !base.height) return; // not laid out yet
    this.viewBox.set(`0 0 ${round(base.width)} ${round(base.height)}`);

    // Read by attribute rather than through a selector: a port id is the
    // consumer's string, and CSS.escape is not everywhere (jsdom has none).
    const anchors = new Map<string, { left: number; right: number; y: number }>();
    for (const el of map.querySelectorAll<HTMLElement>('[data-wiring-port]')) {
      const id = el.getAttribute('data-wiring-port');
      if (!id) continue;
      const card = el.closest<HTMLElement>('.strct-wiring__node') ?? el;
      const r = el.getBoundingClientRect();
      const c = card.getBoundingClientRect();
      anchors.set(id, {
        left: c.left - base.left,
        right: c.right - base.left,
        y: r.top + r.height / 2 - base.top,
      });
    }

    // The clear strips: the devices occupy bands of x, and what is left
    // between them is where a label can live without covering anything. A
    // strip is defined by x alone, so a label narrower than its strip cannot
    // land on a device however tall the strip's neighbours are.
    const bands: Gap[] = [];
    for (const card of map.querySelectorAll<HTMLElement>('.strct-wiring__node')) {
      const r = card.getBoundingClientRect();
      bands.push({ l: r.left - base.left, r: r.right - base.left });
    }
    bands.sort((a, b) => a.l - b.l);
    const merged: Gap[] = [];
    for (const b of bands) {
      const last = merged[merged.length - 1];
      if (last && b.l <= last.r + 1) last.r = Math.max(last.r, b.r);
      else merged.push({ ...b });
    }
    const gaps: Gap[] = [];
    for (let i = 1; i < merged.length; i++) {
      if (merged[i].l - merged[i - 1].r > 1) gaps.push({ l: merged[i - 1].r, r: merged[i].l });
    }

    // Which way the inline axis runs in x. The columns are logical; a cable
    // leaving "the inline end" of a card leaves its left edge under RTL.
    const flow = getComputedStyle(map).direction === 'rtl' ? -1 : 1;
    const columnOf = this.columnOf();
    const ports = this.portIndex();
    const paths: LinkPath[] = [];
    for (const link of this.drawable()) {
      const a = anchors.get(link.from);
      const b = anchors.get(link.to);
      if (!a || !b) continue;
      const ca = columnOf.get(ports.get(link.from)?.node.id ?? '') ?? 0;
      const cb = columnOf.get(ports.get(link.to)?.node.id ?? '') ?? 0;
      let x1: number;
      let x2: number;
      let k1: number;
      let k2: number;
      if (ca === cb) {
        // Same column: both ends leave by the inline end and the cable loops
        // back, so it is never drawn through the card it starts in.
        x1 = flow > 0 ? a.right : a.left;
        x2 = flow > 0 ? b.right : b.left;
        const reach = Math.max(MIN_REACH * 2, Math.abs(b.y - a.y) * 0.5);
        k1 = flow * reach;
        k2 = flow * reach;
      } else {
        // Which column is further along is logical; which way that is in x is
        // not, so the direction of travel is the two combined.
        const dir = cb > ca ? flow : -flow;
        x1 = dir > 0 ? a.right : a.left;
        x2 = dir > 0 ? b.left : b.right;
        const reach = Math.max(MIN_REACH, Math.abs(x2 - x1) * 0.5);
        k1 = dir * reach;
        k2 = -dir * reach;
      }
      const curve: Cubic = {
        x1: round(x1),
        y1: round(a.y),
        cx1: round(x1 + k1),
        cy1: round(a.y),
        cx2: round(x2 + k2),
        cy2: round(b.y),
        x2: round(x2),
        y2: round(b.y),
      };
      paths.push({
        id: link.id,
        d: `M ${curve.x1} ${curve.y1} C ${curve.cx1} ${curve.cy1}, ${curve.cx2} ${curve.cy2}, ${curve.x2} ${curve.y2}`,
        status: link.status ?? 'neutral',
        dashed: link.style === 'dashed',
        curve,
        gap: widestGap(gaps, curve),
      });
    }
    this.linkPaths.set(paths);
    // A label is sized by the run it was just given, so its placement waits
    // for the frame that applies that width — a microtask can run before
    // Angular has written it, and the label would then be measured at its
    // natural width and placed for a box it does not have.
    const place = () => this.placeTags(base.height);
    if (typeof requestAnimationFrame === 'function') requestAnimationFrame(place);
    else queueMicrotask(place);
  }

  /**
   * A label sits on its own cable, inside the clear strip that cable crosses,
   * at the first spot along it that clears every label already placed. The
   * worst links go first, so a critical label keeps the middle of its strip
   * and an agreeing one moves aside.
   */
  private placeTags(height: number): void {
    const map = this.host.nativeElement.querySelector<HTMLElement>('.strct-wiring__map');
    if (!map) return;
    const curves = new Map(this.linkPaths().map((p) => [p.id, p.curve]));
    const strips = new Map(this.linkPaths().map((p) => [p.id, p.gap]));
    const sizes = new Map<string, { w: number; h: number }>();
    for (const el of map.querySelectorAll<HTMLElement>('[data-wiring-tag]')) {
      const id = el.getAttribute('data-wiring-tag');
      if (!id) continue;
      const r = el.getBoundingClientRect();
      sizes.set(id, { w: r.width, h: r.height });
    }
    if (!sizes.size) {
      this.measured.set(true);
      return;
    }

    const order = this.links()
      .filter((l) => l.label && curves.has(l.id))
      .map((l, i) => ({ l, i }))
      .sort((a, b) => {
        const wa = WEIGHT[a.l.status ?? 'neutral'];
        const wb = WEIGHT[b.l.status ?? 'neutral'];
        return wa !== wb ? wb - wa : a.i - b.i;
      });

    const placed: Rect[] = [];
    const at = new Map<string, { x: number; y: number }>();
    for (const { l } of order) {
      const curve = curves.get(l.id);
      const strip = strips.get(l.id);
      const size = sizes.get(l.id);
      if (!curve || !strip || !size) continue;
      const halfW = size.w / 2 + TAG_PAD;
      const halfH = size.h / 2 + TAG_PAD;
      // Slide it along the cable, but only within its own strip, so it stays
      // on the line it describes and off every device.
      const lo = strip.l + halfW;
      const hi = Math.max(lo, strip.r - halfW);
      let best: { p: { x: number; y: number }; r: Rect } | null = null;
      let bestOverlap = Infinity;
      for (const spot of TAG_SPOTS) {
        const target = Math.min(Math.max(strip.l + (strip.r - strip.l) * spot, lo), hi);
        const p = pointAt(curve, tAtX(curve, target));
        const r = { l: p.x - halfW, t: p.y - halfH, r: p.x + halfW, b: p.y + halfH };
        if (r.t < 0 || r.b > height) continue;
        let ov = 0;
        for (const q of placed) ov += overlap(r, q);
        if (ov === 0) {
          best = { p, r };
          break;
        }
        if (ov < bestOverlap) {
          bestOverlap = ov;
          best = { p, r };
        }
      }
      if (!best) continue;
      placed.push(best.r);
      at.set(l.id, { x: round(best.p.x), y: round(best.p.y) });
    }
    // Written only when something moved, so a resize that changes nothing does
    // not re-render the labels.
    const prev = this.tagAt();
    const same =
      prev.size === at.size &&
      [...at].every(([id, p]) => prev.get(id)?.x === p.x && prev.get(id)?.y === p.y);
    if (!same) this.tagAt.set(at);
    this.measured.set(true);
  }

  // ── Selection and keyboard ─────────────────────────────────────

  /** The port the single tab stop is on. */
  protected readonly cursor = signal<string | null>(null);

  protected isCursor(portId: string): boolean {
    const at = this.cursor();
    if (at) return at === portId;
    return this.firstPortId() === portId;
  }

  private readonly firstPortId = computed(
    () => this.columnsView()[0]?.nodes[0]?.ports?.[0]?.id ?? null,
  );

  protected pickLink(id: string): void {
    if (!this.navigable()) return;
    const link = this.links().find((l) => l.id === id);
    if (!link) return;
    this.selected.set(id);
    this.linkActivate.emit(link);
  }

  protected activatePort(node: StrctWiringNode, port: StrctWiringPort): void {
    if (!this.navigable()) return;
    this.cursor.set(port.id);
    const links = this.linksOf(port.id);
    this.portActivate.emit({ node, port, links });
    // A port with one cable *is* that cable: selecting it is what both the
    // click on the line and the click on the port mean.
    if (links.length === 1) {
      this.selected.set(links[0].id);
      this.linkActivate.emit(links[0]);
    }
  }

  protected onPortKeydown(
    event: KeyboardEvent,
    node: StrctWiringNode,
    port: StrctWiringPort,
  ): void {
    if (!this.navigable()) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.activatePort(node, port);
      return;
    }
    const keys = ['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown', 'Home', 'End'];
    if (!keys.includes(event.key)) return;
    event.preventDefault();
    const next = this.neighbour(port.id, event.key);
    if (next) this.focusPort(next);
  }

  /** Every port of a column, in the order the columns stack them. */
  private columnPorts(index: number): string[] {
    const col = this.columnsView().find((c) => c.index === index);
    return (col?.nodes ?? []).flatMap((n) => (n.ports ?? []).map((p) => p.id));
  }

  /**
   * Where a key leads. → and ← follow the cable to the port at its far end,
   * which is the question a wiring map is read to answer; with no cable that
   * way they fall through to the next column. ↑ / ↓ walk the column.
   */
  private neighbour(portId: string, key: string): string | null {
    const ports = this.portIndex();
    const here = ports.get(portId);
    if (!here) return null;
    const columnOf = this.columnOf();
    const col = columnOf.get(here.node.id) ?? 0;
    const inColumn = this.columnPorts(col);
    const at = inColumn.indexOf(portId);
    const columns = this.columnsView().map((c) => c.index);
    const colAt = columns.indexOf(col);

    switch (key) {
      case 'ArrowDown':
        return inColumn[at + 1] ?? inColumn[0] ?? null;
      case 'ArrowUp':
        return inColumn[at - 1] ?? inColumn[inColumn.length - 1] ?? null;
      case 'Home':
        return inColumn[0] ?? null;
      case 'End':
        return inColumn[inColumn.length - 1] ?? null;
      default: {
        const forward = key === 'ArrowRight';
        for (const l of this.linksOf(portId)) {
          const far = l.from === portId ? l.to : l.from;
          const farCol = columnOf.get(ports.get(far)?.node.id ?? '') ?? col;
          if (forward ? farCol > col : farCol < col) return far;
        }
        const next = columns[colAt + (forward ? 1 : -1)];
        return next === undefined ? null : (this.columnPorts(next)[0] ?? null);
      }
    }
  }

  private focusPort(id: string): void {
    this.cursor.set(id);
    const el = [
      ...this.host.nativeElement.querySelectorAll<HTMLElement>('[data-wiring-port]'),
    ].find((n) => n.getAttribute('data-wiring-port') === id);
    el?.focus();
  }

  // ── What it says ───────────────────────────────────────────────

  /** What a port tells assistive tech: where its cable lands, and how it is. */
  protected portSummary(node: StrctWiringNode, port: StrctWiringPort): string {
    const ports = this.portIndex();
    const out = this.linksOf(port.id)
      // A link whose far end is not on the map is not drawn, so it is not
      // announced either: the picture and the sentence say the same thing.
      .filter((l) => ports.has(l.from) && ports.has(l.to))
      .map((l) => {
        const far = l.from === port.id ? l.to : l.from;
        const end = ports.get(far);
        const where = end ? `${end.node.label} ${end.port.label}` : far;
        const tone = l.status && l.status !== 'neutral' ? `, ${l.status}` : '';
        return `${where}${tone}${l.label ? ` — ${l.label}` : ''}`;
      });
    if (!out.length) return port.unlinked ?? this.unlinkedText();
    return `→ ${out.join('; ')}`;
  }

  /** A one-line summary of the whole map. */
  protected readonly ariaLabel = computed(() => {
    const given = this.label();
    const nodes = this.nodes().length;
    const ports = this.nodes().reduce((n, d) => n + (d.ports?.length ?? 0), 0);
    const links = this.links().length;
    const shape = `Wiring map: ${nodes} device${nodes === 1 ? '' : 's'}, ${ports} port${
      ports === 1 ? '' : 's'
    }, ${links} link${links === 1 ? '' : 's'}`;
    return given ? `${shape} — ${given}` : shape;
  });
}
