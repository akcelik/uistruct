import {
  Directive,
  ElementRef,
  ViewContainerRef,
  afterNextRender,
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
  },
})
export class StrctCodeInline {
  /** Append a copy button that copies this element's text. */
  readonly copyable = input(false, { transform: booleanAttribute });

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly vcr = inject(ViewContainerRef);

  constructor() {
    afterNextRender(() => {
      if (!this.copyable()) return;
      const el = this.host.nativeElement;
      const ref = this.vcr.createComponent(StrctCopy);
      // The text to copy is what the element says, before the button joins it.
      ref.setInput('text', el.textContent?.trim() ?? '');
      ref.changeDetectorRef.detectChanges();
      el.appendChild(ref.location.nativeElement);
    });
  }
}
