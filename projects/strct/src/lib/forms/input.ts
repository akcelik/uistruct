import { Directive, booleanAttribute, computed, input } from '@angular/core';
import { StrctControlSize, strctControlHeight, strctIconSize } from '../control-size';

/**
 * Applies the shared `.strct-control` look to a native input / textarea / select.
 *   <input strctInput placeholder="Name" />
 *   <select strctInput>…</select>
 * The visual definition lives in `strct/styles/_forms.scss` (shipped via the
 * theme entry point), so this directive only attaches the class.
 *
 * `mono` sets the monospace face, for a PEM block, a `key=value` mapping or an
 * identifier — the three things consumers were restyling by hand.
 */
@Directive({
  // Both spellings: `<button strct-button>` is kebab-case, so `strct-input` is
  // what a consumer writes by analogy — and an unstyled input is the silent
  // failure that follows. The alias is kinder than a warning and costs nothing.
  selector:
    'input[strctInput], textarea[strctInput], select[strctInput], ' +
    'input[strct-input], textarea[strct-input], select[strct-input]',
  host: {
    class: 'strct-control',
    '[class.strct-control--mono]': 'mono()',
    '[style.--control-h]': 'controlHeight()',
    '[style.--icon-size]': 'controlIconSize()',
  },
})
export class StrctInput {
  /**
   * Control size — the shared scale, so this lines up with the buttons and
   * fields beside it. Left unset it follows an enclosing [strctControlSize],
   * or the default height when there is none.
   */
  readonly size = input<StrctControlSize | undefined>(undefined);
  /** The height its size asks for; nothing while it states no size. */
  protected readonly controlHeight = computed(() => {
    const s = this.size();
    return s ? strctControlHeight(s) : null;
  });
  /** And the icon size that goes with it, for the icons it holds. */
  protected readonly controlIconSize = computed(() => {
    const s = this.size();
    return s ? strctIconSize(s) : null;
  });

  /** Monospace text with tabular figures — a PEM block, an id, a mapping. */
  readonly mono = input(false, { transform: booleanAttribute });
}
