import { ChangeDetectionStrategy, Component, ViewEncapsulation, booleanAttribute, input } from '@angular/core';

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
  template: `
    @if (split()) {
      <div class="strct-login__card" [style.max-width.px]="maxWidth()">
        <aside class="strct-login__aside">
          <div class="strct-login__aside-inner">
            <ng-content select="[strctLoginAside]" />
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
      display: flex; align-items: center; justify-content: center;
      width: 100%; min-height: 100%; padding: 32px;
      background:
        radial-gradient(120% 80% at 50% -10%, var(--acc-s), transparent 60%),
        var(--bg-2);
    }
    .strct-login__inner { width: 100%; }

    /* Split card */
    .strct-login__card {
      display: grid; grid-template-columns: 1.05fr 1fr;
      width: 100%; overflow: hidden;
      background: var(--bg-1); border: 1px solid var(--b2);
      border-radius: 14px; box-shadow: var(--shh);
    }
    .strct-login__main { padding: 40px 38px; display: flex; flex-direction: column; justify-content: center; }

    /* Decorative aside — accent gradient + faint grid + soft glows, all token-driven. */
    .strct-login__aside {
      position: relative; overflow: hidden; min-height: 420px; color: #fff;
      background: linear-gradient(155deg, var(--acc) 0%, var(--acc) 45%, rgba(0,0,0,.28) 130%);
    }
    .strct-login__aside::before {
      content: ''; position: absolute; inset: 0; opacity: .16;
      background-image:
        linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px);
      background-size: 30px 30px;
      -webkit-mask-image: linear-gradient(to bottom, transparent, #000 25%, #000 72%, transparent);
      mask-image: linear-gradient(to bottom, transparent, #000 25%, #000 72%, transparent);
    }
    .strct-login__aside::after {
      content: ''; position: absolute; inset: 0; pointer-events: none;
      background:
        radial-gradient(140px 140px at 82% 14%, rgba(255,255,255,.20), transparent 70%),
        radial-gradient(220px 220px at 12% 92%, rgba(255,255,255,.14), transparent 70%);
    }
    .strct-login__aside-inner {
      position: relative; z-index: 1; height: 100%;
      display: flex; flex-direction: column; justify-content: space-between;
      padding: 34px 36px;
    }

    @media (max-width: 720px) {
      .strct-login__card { grid-template-columns: 1fr; }
      .strct-login__aside { min-height: 220px; }
      .strct-login__main { padding: 30px 26px; }
    }
    `,
  ],
})
export class StrctLogin {
  readonly maxWidth = input(880);
  readonly split = input(false, { transform: booleanAttribute });
}
