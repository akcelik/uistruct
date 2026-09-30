import { Directive } from '@angular/core';

/**
 * Applies the shared `.strct-control` look to a native input / textarea / select.
 *   <input strctInput placeholder="Name" />
 *   <select strctInput>…</select>
 * The visual definition lives in `strct/styles/_forms.scss` (shipped via the
 * theme entry point), so this directive only attaches the class.
 */
@Directive({
  // Both spellings: `<button strct-button>` is kebab-case, so `strct-input` is
  // what a consumer writes by analogy — and an unstyled input is the silent
  // failure that follows. The alias is kinder than a warning and costs nothing.
  selector:
    'input[strctInput], textarea[strctInput], select[strctInput], ' +
    'input[strct-input], textarea[strct-input], select[strct-input]',
  host: { class: 'strct-control' },
})
export class StrctInput {}
