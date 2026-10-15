import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  TemplateRef,
  ViewEncapsulation,
  booleanAttribute,
  computed,
  contentChildren,
  inject,
  input,
  output,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { StrctCode } from '../code/code';
import { StrctIcon } from '../icon/icon';
import {
  StrctMdBlock,
  StrctMdTokenizer,
  strctClassifyHref,
  strctParseMarkdown,
} from './markdown-parser';

/**
 * A template for a span the consumer claimed through `tokens`, keyed by the
 * token's kind:
 *
 *   <ng-template strctMarkdownToken="object" let-text let-data="data">
 *     <strct-tag [href]="data.url">{{ text }}</strct-tag>
 *   </ng-template>
 */
@Directive({ selector: 'ng-template[strctMarkdownToken]' })
export class StrctMarkdownToken {
  /** Which token kind this template draws. */
  readonly strctMarkdownToken = input('');
  readonly template = inject(TemplateRef);
}

/**
 * Markdown as a tree of components, never as HTML.
 *
 *   <strct-markdown [source]="reply()" [streaming]="busy()" />
 *
 * A model's reply is Markdown: drawn as plain text it leaves tables as rows of
 * pipes and `**` everywhere, and an app that reaches for a Markdown library
 * ends up handing the browser HTML — `innerHTML` plus a sanitiser — which a
 * sealed, reviewed build cannot accept.
 *
 * Every word reaches the page as a text node. Raw HTML is shown as the
 * characters it is. Images are never loaded: an image's alt text is all a
 * reader gets. A link opens in a new tab only when it is plainly http(s);
 * an in-app path is handed to `(navigate)`; anything else — `javascript:`,
 * `data:`, `//host` — stays the text the model wrote.
 */
@Component({
  selector: 'strct-markdown',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [NgTemplateOutlet, StrctCode, StrctIcon],
  template: `
    @for (block of blocks(); track $index) {
      @switch (block.kind) {
        @case ('p') {
          <p class="strct-md__p">
            <ng-container
              [ngTemplateOutlet]="inlineRun"
              [ngTemplateOutletContext]="{ $implicit: block.inlines }"
            />
            @if (caretOn($index)) {
              <span class="strct-md__caret" aria-hidden="true"></span>
            }
          </p>
        }
        @case ('heading') {
          <!-- A message is a region inside a dialog, so the document's own
               outline is not the model's to set: the offset pulls them down. -->
          @switch (level(block.level)) {
            @case (1) {
              <h1 class="strct-md__h">
                <ng-container
                  [ngTemplateOutlet]="inlineRun"
                  [ngTemplateOutletContext]="{ $implicit: block.inlines }"
                />
              </h1>
            }
            @case (2) {
              <h2 class="strct-md__h">
                <ng-container
                  [ngTemplateOutlet]="inlineRun"
                  [ngTemplateOutletContext]="{ $implicit: block.inlines }"
                />
              </h2>
            }
            @case (3) {
              <h3 class="strct-md__h">
                <ng-container
                  [ngTemplateOutlet]="inlineRun"
                  [ngTemplateOutletContext]="{ $implicit: block.inlines }"
                />
              </h3>
            }
            @case (4) {
              <h4 class="strct-md__h">
                <ng-container
                  [ngTemplateOutlet]="inlineRun"
                  [ngTemplateOutletContext]="{ $implicit: block.inlines }"
                />
              </h4>
            }
            @case (5) {
              <h5 class="strct-md__h">
                <ng-container
                  [ngTemplateOutlet]="inlineRun"
                  [ngTemplateOutletContext]="{ $implicit: block.inlines }"
                />
              </h5>
            }
            @default {
              <h6 class="strct-md__h">
                <ng-container
                  [ngTemplateOutlet]="inlineRun"
                  [ngTemplateOutletContext]="{ $implicit: block.inlines }"
                />
              </h6>
            }
          }
        }
        @case ('code') {
          <strct-code class="strct-md__code" [code]="block.text" [language]="block.lang" wrap />
        }
        @case ('rule') {
          <hr class="strct-md__rule" />
        }
        @case ('quote') {
          <blockquote class="strct-md__quote">
            <ng-container
              [ngTemplateOutlet]="blockRun"
              [ngTemplateOutletContext]="{ $implicit: block.blocks }"
            />
          </blockquote>
        }
        @case ('list') {
          @if (block.ordered) {
            <ol class="strct-md__list" [attr.start]="block.start">
              @for (item of block.items; track $index) {
                <li>
                  <ng-container
                    [ngTemplateOutlet]="blockRun"
                    [ngTemplateOutletContext]="{ $implicit: item }"
                  />
                </li>
              }
            </ol>
          } @else {
            <ul class="strct-md__list">
              @for (item of block.items; track $index) {
                <li>
                  <ng-container
                    [ngTemplateOutlet]="blockRun"
                    [ngTemplateOutletContext]="{ $implicit: item }"
                  />
                </li>
              }
            </ul>
          }
        }
        @case ('table') {
          <div class="strct-md__tablewrap">
            <table class="strct-md__table">
              <thead>
                <tr>
                  @for (cell of block.head; track $index) {
                    <th scope="col" [style.text-align]="block.align[$index] ?? 'start'">
                      <ng-container
                        [ngTemplateOutlet]="inlineRun"
                        [ngTemplateOutletContext]="{ $implicit: cell }"
                      />
                    </th>
                  }
                </tr>
              </thead>
              <tbody>
                @for (row of block.rows; track $index) {
                  <tr>
                    @for (cell of row; track $index) {
                      <td [style.text-align]="block.align[$index] ?? 'start'">
                        <ng-container
                          [ngTemplateOutlet]="inlineRun"
                          [ngTemplateOutletContext]="{ $implicit: cell }"
                        />
                      </td>
                    }
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      }
    }

    <!-- Blocks inside a list item or a quote. -->
    <ng-template #blockRun let-blocks>
      @for (b of blocks; track $index) {
        <strct-markdown
          [tree]="[b]"
          [headingOffset]="headingOffset()"
          [linkPolicy]="linkPolicy()"
          (navigate)="navigate.emit($event)"
        />
      }
    </ng-template>

    <!-- One run of inline nodes. -->
    <ng-template #inlineRun let-inlines>
      @for (node of inlines; track $index) {
        @switch (node.kind) {
          @case ('text') {
            <ng-container>{{ node.text }}</ng-container>
          }
          @case ('code') {
            <code class="strct-md__codespan">{{ node.text }}</code>
          }
          @case ('break') {
            <br />
          }
          @case ('strong') {
            <strong>
              <ng-container
                [ngTemplateOutlet]="inlineRun"
                [ngTemplateOutletContext]="{ $implicit: node.children }"
              />
            </strong>
          }
          @case ('em') {
            <em>
              <ng-container
                [ngTemplateOutlet]="inlineRun"
                [ngTemplateOutletContext]="{ $implicit: node.children }"
              />
            </em>
          }
          @case ('del') {
            <del>
              <ng-container
                [ngTemplateOutlet]="inlineRun"
                [ngTemplateOutletContext]="{ $implicit: node.children }"
              />
            </del>
          }
          @case ('token') {
            @if (tokenTemplate(node.token); as tpl) {
              <ng-container
                [ngTemplateOutlet]="tpl"
                [ngTemplateOutletContext]="{ $implicit: node.text, data: node.data }"
              />
            } @else {
              <ng-container>{{ node.text }}</ng-container>
            }
          }
          @case ('link') {
            @switch (hrefKind(node.href)) {
              @case ('external') {
                <a
                  class="strct-md__link"
                  [attr.href]="node.href"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ng-container
                    [ngTemplateOutlet]="inlineRun"
                    [ngTemplateOutletContext]="{ $implicit: node.children }"
                  />
                  <strct-icon
                    class="strct-md__ext"
                    strictName="externalLink"
                    [size]="11"
                    aria-hidden="true"
                  />
                </a>
              }
              @case ('internal') {
                <a
                  class="strct-md__link"
                  [attr.href]="node.href"
                  (click)="onInternal($event, node.href)"
                >
                  <ng-container
                    [ngTemplateOutlet]="inlineRun"
                    [ngTemplateOutletContext]="{ $implicit: node.children }"
                  />
                </a>
              }
              @default {
                <!-- Not a link we will follow: the characters, as written. -->
                <ng-container
                  [ngTemplateOutlet]="inlineRun"
                  [ngTemplateOutletContext]="{ $implicit: node.children }"
                />
              }
            }
          }
        }
      }
    </ng-template>
  `,
  host: { class: 'strct-md' },
  styles: [
    `
      .strct-md {
        display: block;
        color: var(--t1);
        font-size: 13px;
        line-height: 1.55;
      }
      .strct-md__p {
        margin: 0 0 var(--space-2);
      }
      .strct-md__p:last-child {
        margin-bottom: 0;
      }
      .strct-md__h {
        margin: var(--space-3) 0 var(--space-2);
        font-size: 14px;
        font-weight: 600;
        color: var(--t1);
      }
      .strct-md__h:first-child {
        margin-top: 0;
      }
      .strct-md__list {
        margin: 0 0 var(--space-2);
        padding-inline-start: 20px;
      }
      .strct-md__list li {
        margin-block: 2px;
      }
      .strct-md__quote {
        margin: 0 0 var(--space-2);
        padding-inline-start: var(--space-3);
        border-inline-start: 2px solid var(--b2);
        color: var(--t2);
      }
      .strct-md__rule {
        border: 0;
        border-block-start: 1px solid var(--b1);
        margin: var(--space-3) 0;
      }
      .strct-md__codespan {
        font-family: var(--mono);
        font-size: 0.92em;
        background: var(--bg-2);
        border-radius: var(--radius-sm);
        padding: 1px 4px;
      }
      .strct-md__code {
        margin-block-end: var(--space-2);
      }
      .strct-md__link {
        color: var(--acc);
      }
      .strct-md__ext {
        margin-inline-start: 2px;
        vertical-align: -1px;
      }
      .strct-md__tablewrap {
        overflow-x: auto;
        margin-block-end: var(--space-2);
      }
      .strct-md__table {
        border-collapse: collapse;
        width: max-content;
        min-width: 100%;
      }
      .strct-md__table th,
      .strct-md__table td {
        border: 1px solid var(--b1);
        padding: 4px 8px;
        text-align: start;
      }
      .strct-md__table th {
        background: var(--bg-2);
        font-weight: 600;
      }
      /* The caret sits at the end of the last inline run, not after the last
         block — otherwise a reply streaming a table puts it on its own line. */
      .strct-md__caret {
        display: inline-block;
        width: 2px;
        height: 1em;
        margin-inline-start: 2px;
        vertical-align: -2px;
        background: var(--acc);
        animation: strct-md-caret 1s steps(2) infinite;
      }
      @keyframes strct-md-caret {
        50% {
          opacity: 0;
        }
      }
      @media (prefers-reduced-motion: reduce) {
        .strct-md__caret {
          animation: none;
        }
      }
    `,
  ],
})
export class StrctMarkdown {
  /** The Markdown to read. */
  readonly source = input('');
  /**
   * A tree read elsewhere, instead of `source` — how the component draws the
   * blocks inside a list item or a quote without re-reading them.
   */
  readonly tree = input<StrctMdBlock[] | null>(null);
  /**
   * The reply is still arriving: an unterminated fence is already a code
   * block, so streamed code does not flash as a paragraph first, and the
   * caret sits at the end of the last line.
   */
  readonly streaming = input(false, { transform: booleanAttribute });
  /**
   * How far the model's headings are pulled down. A message is a region
   * inside a dialog, so `#` should not be the page's `h1`: the default of 2
   * makes it an `h3`.
   */
  readonly headingOffset = input(2);
  /**
   * What a link may do, when the default rule is not what the app wants.
   * Returning `null` leaves the link as text.
   */
  readonly linkPolicy = input<((href: string) => 'external' | 'internal' | null) | null>(null);
  /** Claim runs of plain text — an inventory id becomes an object chip. */
  readonly tokens = input<StrctMdTokenizer | null>(null);
  /** An in-app link was followed; the consumer routes it. */
  readonly navigate = output<string>();

  private readonly tokenDefs = contentChildren(StrctMarkdownToken);

  protected readonly blocks = computed<StrctMdBlock[]>(() => {
    const given = this.tree();
    if (given) return given;
    return strctParseMarkdown(this.source(), {
      streaming: this.streaming(),
      tokenize: this.tokens() ?? undefined,
    });
  });

  protected level(level: number): number {
    return Math.min(6, Math.max(1, level + this.headingOffset()));
  }

  protected hrefKind(href: string): 'external' | 'internal' | null {
    const own = this.linkPolicy();
    return own ? own(href) : strctClassifyHref(href);
  }

  protected tokenTemplate(kind: string): TemplateRef<unknown> | null {
    return this.tokenDefs().find((d) => d.strctMarkdownToken() === kind)?.template ?? null;
  }

  /** The caret belongs to the last block, and only while streaming. */
  protected caretOn(index: number): boolean {
    return this.streaming() && !this.tree() && index === this.blocks().length - 1;
  }

  protected onInternal(event: Event, href: string): void {
    // A modified click is the browser's — a new tab, a saved link.
    const e = event as MouseEvent;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    event.preventDefault();
    this.navigate.emit(href);
  }
}
