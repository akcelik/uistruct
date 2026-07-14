import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  booleanAttribute,
  input,
} from '@angular/core';

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
        z-index: 1;
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        padding: 34px 36px;
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
}
