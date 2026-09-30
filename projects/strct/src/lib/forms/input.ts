import { Directive, booleanAttribute, input } from '@angular/core';

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
  },
})
export class StrctInput {
  /** Monospace text with tabular figures — a PEM block, an id, a mapping. */
  readonly mono = input(false, { transform: booleanAttribute });
}
