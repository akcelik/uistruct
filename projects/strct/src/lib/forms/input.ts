import { Directive } from '@angular/core';

/**
 * Applies the shared `.strct-control` look to a native input / textarea / select.
 *   <input strctInput placeholder="Name" />
 *   <select strctInput>…</select>
 * The visual definition lives in `strct/styles/_forms.scss` (shipped via the
 * theme entry point), so this directive only attaches the class.
 */
@Directive({
  selector: 'input[strctInput], textarea[strctInput], select[strctInput]',
  host: { class: 'strct-control' },
})
export class StrctInput {}
