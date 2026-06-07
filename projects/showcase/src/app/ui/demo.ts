import {
  ChangeDetectionStrategy,
  Component,
  Injectable,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { StrctIcon } from 'strct';

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
      .ph {
        margin-bottom: 22px;
      }
      .ph__title {
        margin: 0;
        font-size: 22px;
        font-weight: 600;
        color: var(--t1);
      }
      .ph__sub {
        margin: 6px 0 0;
        font-size: 14px;
        color: var(--t2);
        max-width: 70ch;
      }
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
 * optional code snippet (toggled + copyable). Hidden when a DemoFilter targets a
 * different `owner`.
 */
@Component({
  selector: 'app-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [StrctIcon],
  template: `
    @if (!hidden()) {
      <section class="demo" [id]="anchor()" data-toc [attr.data-toc-label]="heading()">
        <div class="demo__head">
          <div class="demo__headtext">
            <h3 class="demo__title">{{ heading() }}</h3>
            @if (description()) {
              <p class="demo__desc">{{ description() }}</p>
            }
          </div>
          @if (code()) {
            <div class="demo__tools">
              <button
                type="button"
                class="demo__tool"
                [class.demo__tool--on]="showCode()"
                [attr.aria-pressed]="showCode()"
                (click)="showCode.set(!showCode())"
                aria-label="Toggle code"
                title="View code"
              >
                <strct-icon name="code" [size]="14" />
              </button>
              <button
                type="button"
                class="demo__tool"
                (click)="copy()"
                aria-label="Copy code"
                [title]="copied() ? 'Copied' : 'Copy code'"
              >
                <strct-icon [name]="copied() ? 'check' : 'copy'" [size]="14" />
              </button>
            </div>
          }
        </div>
        <div class="demo__stage"><ng-content /></div>
        @if (code() && showCode()) {
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
        margin-bottom: 26px;
        background: var(--bg-1);
        border: 1px solid var(--b2);
        border-radius: 10px;
        scroll-margin-top: 16px;
      }
      .demo > :first-child {
        border-top-left-radius: 9px;
        border-top-right-radius: 9px;
      }
      .demo > :last-child {
        border-bottom-left-radius: 9px;
        border-bottom-right-radius: 9px;
      }
      .demo__head {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 12px;
        padding: 14px 18px;
        border-bottom: 1px solid var(--b1);
      }
      .demo__headtext {
        min-width: 0;
      }
      .demo__title {
        margin: 0;
        font-size: 14px;
        font-weight: 600;
        color: var(--t1);
      }
      .demo__desc {
        margin: 5px 0 0;
        font-size: 13px;
        color: var(--t2);
      }
      .demo__tools {
        display: flex;
        gap: 4px;
        flex-shrink: 0;
      }
      .demo__tool {
        display: inline-flex;
        padding: 5px;
        border: 1px solid var(--b2);
        border-radius: 6px;
        background: var(--bg-1);
        color: var(--t3);
        cursor: pointer;
        transition:
          color 0.12s ease,
          background 0.12s ease,
          border-color 0.12s ease;
      }
      .demo__tool:hover {
        color: var(--t1);
        background: var(--bg-3);
      }
      .demo__tool--on {
        color: var(--acc);
        border-color: var(--acc30);
        background: var(--acc-m);
      }
      .demo__stage {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 14px;
        padding: 22px 18px;
        background: var(--bg-2);
      }
      .demo__code {
        margin: 0;
        padding: 13px 18px;
        overflow-x: auto;
        font-family: var(--mono);
        font-size: 12px;
        line-height: 1.6;
        color: var(--t2);
        background: var(--bg-0);
        border-top: 1px solid var(--b1);
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

  protected readonly showCode = signal(false);
  protected readonly copied = signal(false);

  private readonly filter = inject(DemoFilter, { optional: true });
  private readonly ownerId = computed(() => this.owner() || this.anchor());
  protected readonly hidden = computed(() => {
    const only = this.filter?.only();
    return !!only && only !== this.ownerId();
  });

  protected copy(): void {
    void navigator.clipboard?.writeText(this.code());
    this.showCode.set(true);
    this.copied.set(true);
    setTimeout(() => this.copied.set(false), 1600);
  }
}
