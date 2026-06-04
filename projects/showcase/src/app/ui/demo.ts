import {
  ChangeDetectionStrategy,
  Component,
  Injectable,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';

/**
 * Provided by the per-component documentation page through a child injector.
 * When `only` is set, the hosted category page hides its own header and every
 * demo whose `owner` does not match — leaving just that component's examples.
 */
@Injectable()
export class DemoFilter {
  readonly only = signal<string>('');
}

/** Page heading block shown at the top of each gallery / demo page. */
@Component({
  selector: 'app-page-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (!filtered()) {
      <header class="ph">
        <h2 class="ph__title">{{ title() }}</h2>
        @if (subtitle()) {
          <p class="ph__sub">{{ subtitle() }}</p>
        }
      </header>
    }
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

  private readonly filter = inject(DemoFilter, { optional: true });
  protected readonly filtered = computed(() => !!this.filter?.only());
}

/**
 * One documented example: a titled stage that hosts a live component plus an
 * optional code snippet. Hidden when a DemoFilter targets a different `owner`.
 */
@Component({
  selector: 'app-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (!hidden()) {
      <section
        class="demo"
        [id]="anchor()"
        data-toc
        [attr.data-toc-label]="heading()"
      >
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
    }
  `,
  styles: [
    `
    .demo {
      /* No overflow:hidden — overlays (dropdowns, tooltips, menus) must be able
         to escape the card. Rounded corners are kept by rounding the children. */
      margin-bottom: 26px; background: var(--bg-1);
      border: 1px solid var(--b2); border-radius: 10px;
      scroll-margin-top: 16px;
    }
    .demo > :first-child { border-top-left-radius: 9px; border-top-right-radius: 9px; }
    .demo > :last-child { border-bottom-left-radius: 9px; border-bottom-right-radius: 9px; }
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
  /** Component this demo belongs to; defaults to the anchor. */
  readonly owner = input('');

  private readonly filter = inject(DemoFilter, { optional: true });
  private readonly ownerId = computed(() => this.owner() || this.anchor());
  protected readonly hidden = computed(() => {
    const only = this.filter?.only();
    return !!only && only !== this.ownerId();
  });
}
