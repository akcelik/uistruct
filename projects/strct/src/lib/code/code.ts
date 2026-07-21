import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  booleanAttribute,
  computed,
  input,
  model,
} from '@angular/core';
import { StrctCopy } from '../copy/copy';
import { StrctIcon } from '../icon/icon';

/**
 * Copyable mono code / rendered-config block — the component form of the
 * `<details><pre>` pattern consoles keep hand-rolling. A header row carries an
 * optional title, a language tag, a copy button and (when `collapsible`) a
 * chevron; the body is a scrollable, keyboard-focusable `<pre>`.
 *
 *   <strct-code [code]="yaml" language="yaml" title="cloud-init" collapsible />
 */
@Component({
  selector: 'strct-code',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [StrctCopy, StrctIcon],
  template: `
    @if (title() || language() || copyable() || collapsible()) {
      <div class="strct-code__head">
        @if (collapsible()) {
          <button
            type="button"
            class="strct-code__toggle"
            [attr.aria-expanded]="!collapsed()"
            [attr.aria-label]="
              (collapsed() ? expandLabel() : collapseLabel()) +
              ' ' +
              (title() || language() || 'code')
            "
            (click)="collapsed.set(!collapsed())"
          >
            <strct-icon
              name="chevronRight"
              [size]="12"
              [strokeWidth]="1.7"
              [class.strct-code__chev--open]="!collapsed()"
            />
          </button>
        }
        @if (title()) {
          <span class="strct-code__title">{{ title() }}</span>
        }
        @if (language()) {
          <span class="strct-code__lang">{{ language() }}</span>
        }
        <span class="strct-code__grow"></span>
        @if (copyable()) {
          <strct-copy [text]="code()" />
        }
      </div>
    }
    @if (!collapsible() || !collapsed()) {
      <div
        class="strct-code__scroll"
        [class.strct-code__scroll--wrap]="wrap()"
        tabindex="0"
        role="region"
        [attr.aria-label]="title() || language() || 'code'"
        [style.max-height.px]="maxHeight()"
      >
        <pre class="strct-code__pre"><!--
       -->@if (lineNumbers() && !wrap()) {<!--
         --><span class="strct-code__gutter" aria-hidden="true">@for (n of lineNos(); track n) {<span class="strct-code__ln">{{ n }}</span>}</span><!--
       -->}<!--
       --><code class="strct-code__code">{{ code() }}</code></pre>
      </div>
    }
  `,
  host: {
    class: 'strct-code',
    '[class.strct-code--collapsed]': 'collapsible() && collapsed()',
  },
  styles: [
    `
      .strct-code {
        display: block;
        border: 1px solid var(--b2);
        border-radius: 9px;
        background: var(--bg-2);
        overflow: hidden;
      }
      .strct-code__head {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 6px 10px;
        border-bottom: 1px solid var(--b1);
      }
      .strct-code--collapsed .strct-code__head {
        border-bottom: 0;
      }
      .strct-code__toggle {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 22px;
        height: 22px;
        margin: -3px 0 -3px -4px;
        padding: 0;
        border: 0;
        border-radius: 5px;
        background: transparent;
        color: var(--t3);
        cursor: pointer;
      }
      .strct-code__toggle:hover {
        color: var(--t1);
        background: var(--bg-3);
      }
      .strct-code__toggle:focus-visible {
        outline: 2px solid var(--acc50);
        outline-offset: 1px;
      }
      .strct-code__toggle strct-icon {
        transition: transform 0.15s ease;
      }
      .strct-code__chev--open {
        transform: rotate(90deg);
      }
      @media (prefers-reduced-motion: reduce) {
        .strct-code__toggle strct-icon {
          transition: none;
        }
      }
      .strct-code__title {
        font-size: 12.5px;
        font-weight: 600;
        color: var(--t1);
      }
      .strct-code__lang {
        font-family: var(--mono);
        font-size: 10px;
        letter-spacing: 0.6px;
        text-transform: uppercase;
        color: var(--t3);
        border: 1px solid var(--b2);
        border-radius: 4px;
        padding: 2px 6px;
      }
      .strct-code__grow {
        flex: 1;
      }
      .strct-code__scroll {
        overflow: auto;
      }
      .strct-code__scroll:focus-visible {
        outline: 2px solid var(--acc50);
        outline-offset: -2px;
      }
      .strct-code__pre {
        display: flex;
        margin: 0;
        padding: 10px 12px;
        font-family: var(--mono);
        font-size: 12px;
        line-height: 1.55;
        color: var(--t1);
      }
      .strct-code__gutter {
        display: flex;
        flex-direction: column;
        flex-shrink: 0;
        margin-inline-end: 12px;
        padding-inline-end: 10px;
        border-inline-end: 1px solid var(--b1);
        color: var(--t3);
        text-align: end;
        user-select: none;
        font-variant-numeric: tabular-nums;
      }
      .strct-code__code {
        display: block;
        white-space: pre;
      }
      /* Soft wrap: 'anywhere' so unbroken base64/PEM breaks, prose still
         breaks at spaces. */
      .strct-code__scroll--wrap .strct-code__code {
        white-space: pre-wrap;
        overflow-wrap: anywhere;
      }
    `,
  ],
})
export class StrctCode {
  /** The code / rendered config text (copied verbatim). */
  readonly code = input.required<string>();
  /** Header title (e.g. a filename). */
  readonly title = input('');
  /** Small uppercase language tag (yaml, json, bash …). */
  readonly language = input('');
  /** Show the copy button. */
  readonly copyable = input(true, { transform: booleanAttribute });
  /** Collapse to just the header (the `<details><pre>` pattern, done right). */
  readonly collapsible = input(false, { transform: booleanAttribute });
  /** Collapsed state (two-way; only meaningful with `collapsible`). */
  readonly collapsed = model(false);
  /** Show a line-number gutter (numbers are never copied — `code` is). */
  readonly lineNumbers = input(false, { transform: booleanAttribute });
  /**
   * Soft-wrap long unbroken text (PEM/CSR blocks, base64, long commands) so a
   * dialog never scrolls horizontally. Wrapping breaks the gutter's visual
   * alignment, so `wrap` takes precedence and hides `lineNumbers`.
   */
  readonly wrap = input(false, { transform: booleanAttribute });
  /** Scroll the body past this height (px); null grows freely. */
  readonly maxHeight = input<number | null>(null);
  /** Localizable labels for the collapse toggle. */
  readonly collapseLabel = input('Collapse');
  readonly expandLabel = input('Expand');

  protected readonly lineNos = computed(() => {
    const n = this.code().split('\n').length;
    return Array.from({ length: n }, (_, i) => i + 1);
  });
}
