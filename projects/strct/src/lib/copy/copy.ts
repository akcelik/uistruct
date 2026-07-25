import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ViewEncapsulation,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { StrctIcon } from '../icon/icon';

/**
 * Click-to-copy chip with built-in feedback: an icon (or icon + label) button
 * that writes `text` to the clipboard and flips to a ✓ "Copied" state for a
 * moment; a failed write (rejection or insecure context) shows a localized
 * error state instead. The console workhorse for UUIDs, IPs, serials and
 * snippets:
 *
 *   <strct-copy text="172.16.75.100" />
 *   <strct-copy [text]="host.id" label="Copy ID" />
 */
@Component({
  selector: 'strct-copy',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [StrctIcon],
  template: `
    <button
      type="button"
      class="strct-copy"
      [class.strct-copy--done]="done()"
      [class.strct-copy--error]="error()"
      [attr.aria-label]="
        done() ? copiedLabel() : error() ? failedLabel() : ariaLabel() || copyLabel()
      "
      (click)="copy()"
    >
      <strct-icon [name]="done() ? 'check' : 'copy'" [size]="13" [strokeWidth]="1.6" />
      @if (label()) {
        <span class="strct-copy__label">{{
          done() ? copiedLabel() : error() ? failedLabel() : label()
        }}</span>
      }
      <span class="strct-copy__sr" aria-live="polite">{{
        done() ? copiedLabel() : error() ? failedLabel() : ''
      }}</span>
    </button>
  `,
  host: { class: 'strct-copy-host' },
  styles: [
    `
      .strct-copy-host {
        display: inline-flex;
      }
      .strct-copy {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        padding: 3px 6px;
        border: 0;
        border-radius: var(--radius-md);
        background: transparent;
        color: var(--t3);
        font-family: var(--font);
        font-size: 12px;
        cursor: pointer;
        transition:
          color 0.13s ease,
          background 0.13s ease;
      }
      .strct-copy:hover {
        color: var(--t1);
        background: var(--bg-3);
      }
      .strct-copy:focus-visible {
        outline: 2px solid var(--acc50);
        outline-offset: 1px;
      }
      .strct-copy--done {
        color: var(--success);
      }
      .strct-copy--done:hover {
        color: var(--success);
      }
      .strct-copy--error {
        color: var(--critical);
      }
      .strct-copy--error:hover {
        color: var(--critical);
      }
      .strct-copy__sr {
        position: absolute;
        width: 1px;
        height: 1px;
        overflow: hidden;
        clip-path: inset(50%);
        white-space: nowrap;
      }
      @media (prefers-reduced-motion: reduce) {
        .strct-copy {
          transition: none;
        }
      }
    `,
  ],
})
export class StrctCopy {
  private readonly destroyRef = inject(DestroyRef);

  /** The text written to the clipboard. */
  readonly text = input.required<string>();
  /** Optional visible label next to the icon (icon-only by default). */
  readonly label = input('');
  /** Accessible label; falls back to `copyLabel`. */
  readonly ariaLabel = input('');
  /** Localizable strings. */
  readonly copyLabel = input('Copy');
  readonly copiedLabel = input('Copied');
  readonly failedLabel = input('Copy failed');
  /** Emitted after a successful copy, with the copied text. */
  readonly copied = output<string>();

  protected readonly done = signal(false);
  protected readonly error = signal(false);
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.destroyRef.onDestroy(() => {
      if (this.timer) clearTimeout(this.timer);
    });
  }

  /** Write `text` to the clipboard and show the ✓ feedback. */
  copy(): void {
    const value = this.text();
    if (!navigator.clipboard) {
      this.fail();
      return;
    }
    void navigator.clipboard
      .writeText(value)
      .then(() => {
        this.copied.emit(value);
        this.done.set(true);
        if (this.timer) clearTimeout(this.timer);
        this.timer = setTimeout(() => this.done.set(false), 1600);
      })
      .catch(() => this.fail());
  }

  /** Surface a failed write (rejection or unavailable clipboard API). */
  private fail(): void {
    this.error.set(true);
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => this.error.set(false), 1600);
  }
}
