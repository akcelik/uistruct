import {
  Directive,
  ElementRef,
  ViewContainerRef,
  afterNextRender,
  untracked,
  signal,
  ComponentRef,
  effect,
  DestroyRef,
  booleanAttribute,
  inject,
  input,
} from '@angular/core';
import { StrctCopy } from '../copy/copy';

/**
 * A command, a path or an identifier **inside a sentence**, set as code:
 *
 *   Run <code strctCode>hyperstructctl doctor</code> on the appliance.
 *   <code strctCode copyable>host-01m3e2e0000000000000000001</code>
 *
 * `strct-code` is a block and `strct-kbd` means a key on the keyboard, so an
 * identifier in running text had nothing but hand-written CSS. The padding is
 * horizontal only and the line-height is inherited, so a code span never
 * changes the leading of the paragraph it sits in.
 *
 * `copyable` appends the library's own `strct-copy` button (icon-only, with its
 * copied / failed feedback) rather than re-implementing the clipboard.
 */
@Directive({
  selector: '[strctCode]',
  host: {
    class: 'strct-code-inline',
    '[class.strct-code-inline--copyable]': 'copyable()',
    '[class.strct-code-inline--wrap]': 'wrap()',
  },
})
export class StrctCodeInline {
  /** Append a copy button that copies this element's text. */
  readonly copyable = input(false, { transform: booleanAttribute });
  /**
   * What the copy button puts on the clipboard, when that is not simply what
   * the element says — a span showing a shortened thumbprint copies the whole
   * one. Empty follows the element's own text, including later changes.
   */
  readonly value = input('');
  /** Long ids wrap instead of overflowing a narrow card. */
  readonly wrap = input(false, { transform: booleanAttribute });

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly vcr = inject(ViewContainerRef);
  private readonly destroyRef = inject(DestroyRef);

  /** The button, once it exists; and a counter the observer bumps. */
  private readonly copyRef = signal<ComponentRef<StrctCopy> | null>(null);
  private readonly revision = signal(0);

  constructor() {
    afterNextRender(() => {
      if (!this.copyable()) return;
      const el = this.host.nativeElement;
      const ref = this.vcr.createComponent(StrctCopy);
      el.appendChild(ref.location.nativeElement);
      this.copyRef.set(ref);
      // The element's text is not a signal, so watch it: a path or a thumbprint
      // that loads later must be the text that gets copied, not the first one.
      if (typeof MutationObserver !== 'undefined') {
        const mo = new MutationObserver(() => this.revision.update((n) => n + 1));
        mo.observe(el, { childList: true, characterData: true, subtree: true });
        this.destroyRef.onDestroy(() => mo.disconnect());
      }
    });
    // Keeps the button's text in step with `value`, or with the element.
    effect(() => {
      const ref = this.copyRef();
      if (!ref) return;
      this.revision(); // re-read the element whenever its text changed
      const text = this.value() || this.ownText();
      untracked(() => {
        ref.setInput('text', text);
        ref.changeDetectorRef.detectChanges();
      });
    });
  }

  /** What the element says, without the copy button's own content. */
  private ownText(): string {
    const clone = this.host.nativeElement.cloneNode(true) as HTMLElement;
    clone.querySelector('strct-copy')?.remove();
    return clone.textContent?.trim() ?? '';
  }
}
