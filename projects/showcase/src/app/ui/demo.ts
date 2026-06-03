import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Page heading block shown at the top of each demo page. */
@Component({
  selector: 'app-page-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="ph">
      <h2 class="ph__title">{{ title() }}</h2>
      @if (subtitle()) {
        <p class="ph__sub">{{ subtitle() }}</p>
      }
    </header>
  `,
  styles: [
    `
    .ph { margin-bottom: 22px; }
    .ph__title { margin: 0; font-size: 22px; font-weight: 600; color: var(--t1); }
    .ph__sub { margin: 6px 0 0; font-size: 14px; color: var(--t2); max-width: 70ch; }
    `,
  ],
})
export class PageHeader {
  readonly title = input.required<string>();
  readonly subtitle = input('');
}

/**
 * One documented example: a titled stage that hosts a live component plus an
 * optional code snippet.
 */
@Component({
  selector: 'app-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="demo" [id]="anchor()">
      <div class="demo__head">
        <h3 class="demo__title">{{ heading() }}</h3>
        @if (description()) {
          <p class="demo__desc">{{ description() }}</p>
        }
      </div>
      <div class="demo__stage"><ng-content /></div>
      @if (code()) {
        <pre class="demo__code"><code>{{ code() }}</code></pre>
      }
    </section>
  `,
  styles: [
    `
    .demo {
      margin-bottom: 26px; background: var(--bg-1);
      border: 1px solid var(--b2); border-radius: 10px; overflow: hidden;
      scroll-margin-top: 16px;
    }
    .demo__head { padding: 14px 18px; border-bottom: 1px solid var(--b1); }
    .demo__title { margin: 0; font-size: 14px; font-weight: 600; color: var(--t1); }
    .demo__desc { margin: 5px 0 0; font-size: 13px; color: var(--t2); }
    .demo__stage {
      display: flex; flex-wrap: wrap; align-items: center; gap: 14px;
      padding: 22px 18px; background: var(--bg-2);
    }
    .demo__code {
      margin: 0; padding: 13px 18px; overflow-x: auto;
      font-family: var(--mono); font-size: 12px; line-height: 1.6; color: var(--t2);
      background: var(--bg-0); border-top: 1px solid var(--b1);
    }
    `,
  ],
})
export class DemoBlock {
  readonly heading = input.required<string>();
  readonly description = input('');
  readonly anchor = input('');
  readonly code = input('');
}
