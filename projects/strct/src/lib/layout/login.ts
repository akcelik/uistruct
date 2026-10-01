import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  booleanAttribute,
  input,
} from '@angular/core';
import { StrctIcon } from '../icon/icon';

/**
 * Authentication layout. Two modes:
 *  - default: a single centered column (drop a card + form inside).
 *  - `split`: a two-panel card — a decorative accent aside (`[strctLoginAside]`)
 *    on the left and the form (default content) on the right.
 *
 *   <strct-login split>
 *     <div strctLoginAside>… brand + welcome …</div>
 *     <form strctLoginMain>… inputs + button …</form>
 *   </strct-login>
 */
@Component({
  selector: 'strct-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [StrctIcon],
  template: `
    @if (split()) {
      <div class="strct-login__card" [style.max-width.px]="maxWidth()">
        <aside class="strct-login__aside" [attr.data-art]="art() === 'none' ? null : art()">
          @if (art() !== 'none') {
            <!-- Ambient layers, from palette tokens only, so the art follows
                 every scheme. Decorative: hidden from assistive tech. -->
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
          <div class="strct-login__aside-inner">
            <div class="strct-login__brand">
              @if (brandIcon()) {
                <span class="strct-login__mark">
                  <strct-icon [name]="brandIcon()" [size]="18" [strokeWidth]="1.5" />
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
        align-items: center;
        justify-content: center;
        width: 100%;
        min-height: 100%;
        padding: 32px;
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
        border-radius: 9px;
        background: var(--acc-m);
        border: 1px solid var(--acc30);
        color: var(--acc);
      }
      .strct-login__brandname {
        font-size: 13px;
        font-weight: 700;
        letter-spacing: 2px;
        color: var(--t1);
      }
      .strct-login__asidebody {
        position: relative;
      }
      .strct-login__kicker {
        font-size: 11.5px;
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
      }
    `,
  ],
})
export class StrctLogin {
  /** Maximum width in pixels. */
  readonly maxWidth = input(880);
  /** Enable two-panel split layout. */
  readonly split = input(false, { transform: booleanAttribute });
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
