import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  StrctButton,
  StrctField,
  StrctInput,
  StrctLiveIndicator,
  StrctLogin,
  StrctPassword,
} from 'strct';

/**
 * FR-76-01: the sign-in screen as a full-bleed page — the one screen with
 * nothing else on it, so a centred 960px card leaves a 1600px window two
 * thirds empty. The aside takes what is left of the width, the form is a
 * column of its own on the end, and the environment band runs across both.
 */
@Component({
  selector: 'app-sign-in-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    StrctLogin,
    StrctField,
    StrctInput,
    StrctPassword,
    StrctButton,
    StrctLiveIndicator,
  ],
  template: `
    <strct-login
      layout="full"
      art="network"
      brandIcon="hexagon"
      brandName="STRUCT OPS"
      tagline="Datacenter operations"
      bandTone="critical"
      bandLabel="Environment"
    >
      <div strctLoginBand>Production · DC2</div>

      <div strctLoginAside>
        <h1 class="sign-in__head">Command your infrastructure.</h1>
        <p class="sign-in__lede">
          Hosts, virtual machines, storage and alarms in one console — with the audit trail your
          compliance team expects.
        </p>
      </div>

      <strct-live-indicator strctLoginStatus state="live" [interval]="5000" />

      <form strctLoginMain class="sign-in__form" (submit)="$event.preventDefault()">
        <h2 class="sign-in__title">Sign in</h2>
        <strct-field label="Email">
          <input strctInput type="email" placeholder="you@example.com" autocomplete="username" />
        </strct-field>
        <strct-field label="Password" hint="Your directory password">
          <strct-password
            [ngModel]="pw()"
            (ngModelChange)="pw.set($event)"
            name="pw"
            placeholder="••••••••"
          />
        </strct-field>
        <button strct-button variant="primary" block type="submit">Sign in</button>
      </form>
    </strct-login>
  `,
  styles: [
    `
      app-sign-in-page {
        display: block;
        min-height: 100vh;
      }
      .sign-in__head {
        margin: 0 0 var(--space-3);
        font-size: 26px;
        line-height: 1.15;
        font-weight: 700;
      }
      .sign-in__lede {
        margin: 0;
        max-width: 38ch;
        font-size: var(--text-sm);
        line-height: 1.6;
        color: var(--t2);
      }
      .sign-in__form {
        display: flex;
        flex-direction: column;
        gap: var(--space-4);
        width: 100%;
      }
      .sign-in__title {
        margin: 0;
        font-size: 20px;
      }
    `,
  ],
})
export class SignInPage {
  protected readonly pw = signal('');
}
