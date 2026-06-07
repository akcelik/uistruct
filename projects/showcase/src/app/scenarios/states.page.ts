import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { StrctButton, StrctIcon, StrctSkeleton, StrctSpinner } from 'strct';

/**
 * Scenario: the empty / error / loading states every real app needs — empty
 * collection, 404, 403 and a loading skeleton — composed from strct primitives.
 */
@Component({
  selector: 'app-states-scenario',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, StrctButton, StrctIcon, StrctSkeleton, StrctSpinner],
  template: `
    <header class="st__head">
      <h1 class="st__title">Empty &amp; error states</h1>
      <p class="st__sub">The states a real console needs — ready to drop into routes and panels.</p>
    </header>

    <div class="st__grid">
      <!-- Empty collection -->
      <section class="st__card">
        <span class="st__art st__art--accent"
          ><strct-icon name="datacenter" [size]="34" [strokeWidth]="1.2"
        /></span>
        <h2 class="st__h">No clusters yet</h2>
        <p class="st__p">Create your first cluster to start placing hosts and virtual machines.</p>
        <button strct-button variant="primary" solid size="sm" routerLink="/scenarios/new-cluster">
          <strct-icon name="cluster" [size]="14" /> New cluster
        </button>
      </section>

      <!-- 404 -->
      <section class="st__card">
        <span class="st__art"><strct-icon name="compass" [size]="34" [strokeWidth]="1.2" /></span>
        <div class="st__code">404</div>
        <h2 class="st__h">Page not found</h2>
        <p class="st__p">The object you’re looking for may have been moved or decommissioned.</p>
        <button strct-button size="sm" routerLink="/scenarios/dashboard">
          <strct-icon name="chevronLeft" [size]="14" /> Back to dashboard
        </button>
      </section>

      <!-- 403 -->
      <section class="st__card">
        <span class="st__art st__art--critical"
          ><strct-icon name="lock" [size]="32" [strokeWidth]="1.3"
        /></span>
        <div class="st__code">403</div>
        <h2 class="st__h">Access denied</h2>
        <p class="st__p">
          You don’t have permission to view this resource. Contact your administrator.
        </p>
        <button strct-button size="sm">
          <strct-icon name="universalAccess" [size]="14" /> Request access
        </button>
      </section>

      <!-- Loading -->
      <section class="st__card st__card--left">
        <div class="st__loadhead"><strct-spinner size="sm" /><span>Loading inventory…</span></div>
        <div class="st__skel">
          @for (r of [1, 2, 3, 4]; track r) {
            <div class="st__skelrow">
              <strct-skeleton width="28px" height="28px" circle />
              <div class="st__skelcol">
                <strct-skeleton width="60%" height="11px" />
                <strct-skeleton width="40%" height="10px" />
              </div>
              <strct-skeleton width="48px" height="20px" />
            </div>
          }
        </div>
      </section>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .st__head {
        margin-bottom: 18px;
      }
      .st__title {
        margin: 0;
        font-size: 24px;
        font-weight: 650;
        color: var(--t1);
        letter-spacing: -0.01em;
      }
      .st__sub {
        margin: 4px 0 0;
        font-size: 13px;
        color: var(--t3);
      }
      .st__grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 14px;
      }
      .st__card {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        gap: 8px;
        padding: 36px 24px;
        border: 1px solid var(--b2);
        border-radius: 12px;
        background: var(--bg-1);
      }
      .st__card--left {
        align-items: stretch;
        text-align: left;
        gap: 14px;
        padding: 22px;
      }
      .st__art {
        display: inline-flex;
        padding: 16px;
        border-radius: 16px;
        margin-bottom: 4px;
        color: var(--t2);
        background: var(--bg-3);
        border: 1px solid var(--b2);
      }
      .st__art--accent {
        color: var(--acc);
        background: var(--acc-s);
        border-color: var(--acc30);
      }
      .st__art--critical {
        color: var(--critical);
        background: var(--critical-bg);
        border-color: var(--critical);
      }
      .st__code {
        font-size: 13px;
        font-weight: 700;
        letter-spacing: 1px;
        color: var(--t3);
        font-family: var(--mono);
      }
      .st__h {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        color: var(--t1);
      }
      .st__p {
        margin: 0 0 6px;
        font-size: 13px;
        line-height: 1.55;
        color: var(--t2);
        max-width: 34ch;
      }

      .st__loadhead {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 13px;
        color: var(--t2);
      }
      .st__skel {
        display: flex;
        flex-direction: column;
        gap: 14px;
      }
      .st__skelrow {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .st__skelcol {
        display: flex;
        flex-direction: column;
        gap: 6px;
        flex: 1;
      }
    `,
  ],
})
export class StatesPage {}
