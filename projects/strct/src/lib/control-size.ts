import { Directive, computed, input } from '@angular/core';

/**
 * The one size scale every single-line control shares — a field, a button, a
 * select's trigger, a searchbox, a segmented track.
 *
 * Each size is a height token (`--control-h-sm` / `-md` / `-lg`, see
 * `_forms.scss`), so controls of one size are exactly as tall as each other
 * whatever they hold. Before 6.2.0 only `strct-button` and `strct-segmented`
 * had a size at all, and a `size="sm"` button stood 13px shorter than the
 * field beside it with nothing able to close the gap (FR-63-02).
 */
export type StrctControlSize = 'sm' | 'md' | 'lg';

/** The custom property a size sets, for a host binding. */
export function strctControlHeight(size: StrctControlSize): string {
  return `var(--control-h-${size})`;
}

/**
 * Sets the control size for everything inside it.
 *
 * ```html
 * <div strctControlSize="sm">
 *   <input strctInput /> <strct-select /> <button strct-button>Apply</button>
 * </div>
 * ```
 *
 * It sets `--control-h`, which every control reads, so a row of them agrees
 * without each one being told. A control that states its own `size` wins,
 * because that sets the same property on itself and the nearer declaration
 * is the one that applies.
 */
@Directive({
  selector: '[strctControlSize]',
  host: { '[style.--control-h]': 'height()' },
})
export class StrctControlSizeDirective {
  /** The size for the controls inside. */
  readonly strctControlSize = input<StrctControlSize>('md');
  protected readonly height = computed(() => strctControlHeight(this.strctControlSize()));
}
