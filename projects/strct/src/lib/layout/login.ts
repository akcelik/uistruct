import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  booleanAttribute,
  computed,
  input,
} from '@angular/core';
import { StrctIcon } from '../icon/icon';

/**
 * Authentication layout. Three modes:
 *  - `center` (default): a single centered column (drop a card + form inside).
 *  - `split`: a two-panel card — a decorative accent aside (`[strctLoginAside]`)
 *    on the left and the form (default content) on the right.
 *  - `full`: the same two panels taken to the window's edges, the aside
 *    filling what is left of the width and the form a fixed column on the
 *    end. A centred card leaves a 1600px window two thirds empty, and the
 *    sign-in page is the one screen with nothing else on it (FR-76-01).
 *
 *   <strct-login layout="full" art="network" bandTone="critical">
 *     <div strctLoginBand>PRODUCTION</div>
 *     <div strctLoginAside>… brand + welcome …</div>
 *     <img strctLoginArt src="…" />
 *     <form strctLoginMain>… inputs + button …</form>
 *   </strct-login>
 */
@Component({
  selector: 'strct-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [StrctIcon],
  template: `
    <!-- Across both columns, because what this install IS is not a property
         of the form or of the aside. Drawn only when something was projected
         into it: the wrapper hides itself while empty, the way the status
         and brand-meta slots below do. -->
    <div
      class="strct-login__band strct-login__band--{{ bandTone() }}"
      role="note"
      [attr.aria-label]="bandLabel() || null"
    >
      <ng-content select="[strctLoginBand]" />
    </div>
    @if (mode() !== 'center') {
      <div
        class="strct-login__card"
        [class.strct-login__card--full]="mode() === 'full'"
        [style.max-width.px]="mode() === 'full' ? null : maxWidth()"
        [style.--strct-login-main]="mode() === 'full' ? mainWidth() + 'px' : null"
      >
        <aside class="strct-login__aside" [attr.data-art]="art() === 'none' ? null : art()">
          <div class="strct-login__aside-inner">
            <div class="strct-login__brand">
              @if (brandIcon()) {
                <span class="strct-login__mark">
                  <strct-icon [name]="brandIcon()" [size]="18" />
                </span>
              }
              @if (brandName()) {
                <span class="strct-login__brandname">{{ brandName() }}</span>
              }
              <!-- What this install is: "APPLIANCE", "EVALUATION". It belongs
                   on the brand's line, not in the tagline under it. -->
              <span class="strct-login__brandmeta">
                <ng-content select="[strctLoginBrandMeta]" />
              </span>
            </div>
            <!-- The consumer's illustration takes the middle, between the
                 brand row and the words, so it never sits under them. The
                 built-in art is this slot's background, not the whole
                 aside's — which is how its lines came to cross the tagline. -->
            <div class="strct-login__artslot">
              @if (art() !== 'none') {
                <!-- Ambient layers, from palette tokens only, so the art
                     follows every scheme. Decorative: hidden from assistive
                     tech. They are drawn inside this band and clipped to it:
                     laid over the whole panel, the node diagram's lines ran
                     straight through the tagline under it. -->
                <div class="strct-login__glow strct-login__glow--a" aria-hidden="true"></div>
                <div class="strct-login__glow strct-login__glow--b" aria-hidden="true"></div>
                <div class="strct-login__matrix" aria-hidden="true"></div>
                @if (art() === 'network') {
                  <svg class="strct-login__net" viewBox="0 0 340 430" aria-hidden="true">
                    <path
                      class="strct-login__link"
                      d="M48 96 L142 158 L262 118 M142 158 L104 272 L224 312 L300 222 L262 118"
                    />
                    @for (n of NODES; track $index) {
                      <circle
                        class="strct-login__node strct-login__node--p{{ n.phase }}"
                        [attr.cx]="n.x"
                        [attr.cy]="n.y"
                        [attr.r]="n.r"
                      />
                    }
                  </svg>
                }
              }
              <ng-content select="[strctLoginArt]" />
            </div>
            <div class="strct-login__asidebody">
              @if (tagline()) {
                <div class="strct-login__kicker">{{ tagline() }}</div>
              }
              <ng-content select="[strctLoginAside]" />
            </div>
            <div class="strct-login__status"><ng-content select="[strctLoginStatus]" /></div>
          </div>
        </aside>
        <div class="strct-login__main"><ng-content select="[strctLoginMain]" /></div>
      </div>
    } @else {
      <div class="strct-login__inner" [style.max-width.px]="maxWidth()"><ng-content /></div>
    }
  `,
  host: { class: 'strct-login' },
  styles: [
    `
      .strct-login {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: center;
        width: 100%;
        min-height: 100%;
        padding: 32px;
        /* A sign-in page is the one screen many people open from a tablet,
           and its controls are the only thing on it (FR-76-01). */
        --control-h: 44px;
      }
      /* full takes the window, so the page's own padding would only put a
         margin round something meant to reach the edges. */
      /* Two rows, not two wrapped flex lines: a wrapping flex container
         shares its height between the lines, which gave a one-line band a
         third of the window, and pinning the lines to the top then left the
         card not filling what was under it. The band is auto, the card takes
         the rest, and the card is placed in the second row explicitly so it
         still fills when there is no band to sit under. */
      .strct-login:has(> .strct-login__card--full) {
        display: grid;
        grid-template-columns: 1fr;
        grid-template-rows: auto 1fr;
        align-items: stretch;
        /* The centring the other two modes want would centre the grid's one
           column instead, leaving the band narrower than the card under it. */
        justify-content: stretch;
        justify-items: stretch;
        padding: 0;
      }
      .strct-login__card--full {
        grid-row: 2;
      }

      /* ── The environment band ─────────────────────────────────────
         What this install is, across both columns. Mixed at 23% rather than
         taken from a -bg token, because it has to be read at a glance from
         across a room and the -bg tints are built to sit under text quietly. */
      .strct-login__band {
        flex: 1 0 100%;
        padding: var(--space-2) var(--space-4);
        font-size: var(--text-sm);
        font-weight: 600;
        letter-spacing: 1.4px;
        text-transform: uppercase;
        text-align: center;
        color: var(--t1);
      }
      .strct-login__band:not(:has(*)):empty,
      .strct-login__band:not(:has(*)) {
        display: none;
      }
      .strct-login__band:has(*) {
        display: block;
      }
      .strct-login__band--critical {
        background: color-mix(in srgb, var(--critical) 23%, var(--bg-0));
      }
      .strct-login__band--warning {
        background: color-mix(in srgb, var(--warning) 23%, var(--bg-0));
      }
      .strct-login__band--success {
        background: color-mix(in srgb, var(--success) 23%, var(--bg-0));
      }
      .strct-login__band--accent {
        background: color-mix(in srgb, var(--acc) 23%, var(--bg-0));
      }
      .strct-login__band--neutral {
        background: var(--bg-3);
      }
      .strct-login__inner {
        width: 100%;
      }

      /* Split card */
      .strct-login__card {
        display: grid;
        grid-template-columns: 1.05fr 1fr;
        width: 100%;
        overflow: hidden;
      }
      .strct-login__main {
        padding: 40px 38px;
        display: flex;
        flex-direction: column;
        justify-content: center;
      }

      /* ── full ─────────────────────────────────────────────────────
         The aside takes what is left; the form is a column of its own width
         on the end, which is the measurement the operator asked for. */
      .strct-login__card--full {
        flex: 1 1 100%;
        max-width: none;
        min-height: 100%;
        grid-template-columns: minmax(0, 1fr) var(--strct-login-main, 572px);
      }
      .strct-login__card--full .strct-login__aside {
        min-height: 0;
      }
      .strct-login__card--full .strct-login__main {
        padding: 48px;
      }

      /* Aside — stripped of background images/colors and borders. */
      .strct-login__aside {
        position: relative;
        overflow: hidden;
        min-height: 420px;
        color: var(--t1);
        border-inline-end: 1px solid var(--b2);
      }
      .strct-login__aside::before,
      .strct-login__aside::after {
        display: none;
      }
      .strct-login__aside-inner {
        position: relative;
        z-index: var(--z-base);
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        gap: var(--space-5);
        padding: 34px 36px;
      }

      /* ── Built-in aside art ───────────────────────────────────────
         What the library shows as its login screen, a consumer can have by
         asking for it — from palette tokens only, so it follows all six
         schemes, and static under prefers-reduced-motion. */
      .strct-login__glow,
      .strct-login__matrix,
      .strct-login__net {
        position: absolute;
        inset: -36px;
        pointer-events: none;
      }
      .strct-login__glow {
        filter: blur(46px);
      }
      .strct-login__glow--a {
        background: radial-gradient(360px 300px at 12% 8%, var(--acc30), transparent 70%);
      }
      .strct-login__glow--b {
        background: radial-gradient(320px 300px at 92% 96%, var(--acc18), transparent 70%);
      }
      .strct-login__matrix {
        background-image: radial-gradient(var(--acc30) 1px, transparent 1.4px);
        background-size: 22px 22px;
        opacity: 0.4;
        mask-image: linear-gradient(155deg, rgba(0, 0, 0, 0.9), transparent 72%);
      }
      .strct-login__net {
        width: calc(100% + 72px);
        height: calc(100% + 72px);
      }
      .strct-login__link {
        fill: none;
        stroke: var(--acc30);
        stroke-width: 1;
      }
      .strct-login__node {
        fill: var(--acc);
        opacity: 0.55;
      }
      @media (prefers-reduced-motion: no-preference) {
        .strct-login__node {
          animation: strct-login-pulse 4.5s ease-in-out infinite;
        }
        .strct-login__node--p2 {
          animation-delay: 1.4s;
        }
        .strct-login__node--p3 {
          animation-delay: 2.8s;
        }
      }
      @keyframes strct-login-pulse {
        0%,
        100% {
          opacity: 0.35;
        }
        50% {
          opacity: 0.85;
        }
      }
      .strct-login__brand:not(:has(*)) {
        display: none;
      }
      .strct-login__brandmeta:empty {
        display: none;
      }
      .strct-login__brandmeta {
        display: inline-flex;
        align-items: center;
        gap: var(--space-2);
      }
      .strct-login__brand {
        position: relative;
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 10px;
      }
      .strct-login__mark {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 34px;
        height: 34px;
        border-radius: var(--radius-lg);
        background: var(--acc-m);
        border: 1px solid var(--acc30);
        color: var(--acc);
      }
      .strct-login__brandname {
        font-size: var(--text-md);
        font-weight: 700;
        letter-spacing: 2px;
        color: var(--t1);
      }
      /* The middle of the aside: a consumer's illustration, or the built-in
         art's own ground. Either way it is a band of its own between the
         brand row and the words, so nothing is drawn across them. */
      .strct-login__artslot {
        position: relative;
        flex: 1 1 auto;
        min-height: 120px;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
      }
      .strct-login__artslot > * {
        max-width: 100%;
        max-height: 100%;
      }
      .strct-login__asidebody {
        position: relative;
      }
      .strct-login__kicker {
        font-size: var(--text-sm);
        font-weight: 700;
        letter-spacing: 1.6px;
        text-transform: uppercase;
        margin-block-end: 10px;
        color: var(--acc);
      }
      .strct-login__status:empty {
        display: none;
      }
      .strct-login__status {
        position: relative;
      }

      @media (max-width: 720px) {
        .strct-login__card {
          grid-template-columns: 1fr;
        }
        .strct-login__aside {
          min-height: 220px;
        }
        .strct-login__main {
          padding: 30px 26px;
        }
        /* The form first, and the aside cut to brand and one line: on a phone
           the sign-in field has to be above the fold, not under a picture. */
        .strct-login__card--full {
          grid-template-columns: 1fr;
          grid-template-rows: auto auto;
        }
        .strct-login__card--full .strct-login__main {
          grid-row: 1;
          padding: 24px 20px;
        }
        .strct-login__card--full .strct-login__aside {
          grid-row: 2;
          min-height: 0;
          border-inline-end: none;
          border-block-start: 1px solid var(--b2);
        }
        .strct-login__card--full .strct-login__aside-inner {
          padding: 20px;
          gap: var(--space-3);
        }
        .strct-login__card--full .strct-login__artslot,
        .strct-login__card--full .strct-login__net,
        .strct-login__card--full .strct-login__matrix,
        .strct-login__card--full .strct-login__glow {
          display: none;
        }
        .strct-login__card--full .strct-login__status {
          display: none;
        }
      }
    `,
  ],
})
export class StrctLogin {
  /** Maximum width in pixels. Ignored by `full`, which has no card to bound. */
  readonly maxWidth = input(880);
  /**
   * `center` (the default), `split` — the two-panel card — or `full`, the
   * same two panels taken to the window's edges.
   */
  readonly layout = input<'center' | 'split' | 'full'>('center');
  /** Enable two-panel split layout. Superseded by `layout="split"`. */
  readonly split = input(false, { transform: booleanAttribute });
  /** The width of the form column in `full`. */
  readonly mainWidth = input(572);
  /**
   * The tone of the environment band. A stronger mix than the `-bg` tokens,
   * because a band saying PRODUCTION has to be read from across a room.
   */
  readonly bandTone = input<'critical' | 'warning' | 'success' | 'accent' | 'neutral'>('neutral');
  /** What the band is, for a screen reader; its content is the value. */
  readonly bandLabel = input('Environment');

  /** `split` is the old spelling of `layout="split"`. */
  protected readonly mode = computed<'center' | 'split' | 'full'>(() =>
    this.layout() !== 'center' ? this.layout() : this.split() ? 'split' : 'center',
  );
  /**
   * The aside's built-in art: `network` is the node diagram over the glow and
   * dot grid; `grid` is the glow and grid alone. Palette tokens only, so it
   * follows every scheme, and it is decorative — hidden from assistive tech.
   */
  readonly art = input<'none' | 'network' | 'grid'>('none');
  /** An icon tile beside the product name. */
  readonly brandIcon = input('');
  /** The product name, in the aside's brand row. */
  readonly brandName = input('');
  /** The kicker line above the aside's content. */
  readonly tagline = input('');

  /** The network's nodes: x, y, radius and which pulse phase they follow. */
  protected readonly NODES = [
    { x: 48, y: 96, r: 3, phase: 1 },
    { x: 142, y: 158, r: 4.5, phase: 2 },
    { x: 262, y: 118, r: 3, phase: 3 },
    { x: 104, y: 272, r: 3, phase: 2 },
    { x: 224, y: 312, r: 4.5, phase: 3 },
    { x: 300, y: 222, r: 3, phase: 1 },
  ];
}
