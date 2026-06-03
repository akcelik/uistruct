import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  ElementRef,
  HostListener,
  forwardRef,
  inject,
  input,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

const DEFAULT_SWATCHES = [
  '#7b9ec8', '#5a7ea3', '#7da87e', '#5e8a60', '#bfae6a', '#9a8a3e',
  '#b87872', '#a0635c', '#96724e', '#c49a6c', '#8d7bc8', '#5a5a64',
];

const HEX = /^#([0-9a-f]{6})$/i;

/**
 * Swatch-based color picker with a hex field. CVA value is a `#rrggbb` string.
 *   <strct-color-picker [(ngModel)]="color" />
 */
@Component({
  selector: 'strct-color-picker',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => StrctColorPicker), multi: true },
  ],
  template: `
    <button
      type="button"
      class="strct-cp__trigger"
      [disabled]="isDisabled()"
      [attr.aria-expanded]="open()"
      (click)="toggle()"
    >
      <span class="strct-cp__swatch" [style.background]="value() || 'transparent'"></span>
      <span class="strct-cp__value">{{ value() || 'Pick a color' }}</span>
    </button>

    @if (open()) {
      <div class="strct-cp__panel" role="dialog">
        <div class="strct-cp__grid">
          @for (color of swatches(); track color) {
            <button
              type="button"
              class="strct-cp__chip"
              [class.strct-cp__chip--active]="eq(color)"
              [style.background]="color"
              [attr.aria-label]="color"
              (click)="pick(color)"
            ></button>
          }
        </div>
        <input
          class="strct-control strct-cp__hex"
          spellcheck="false"
          placeholder="#000000"
          [value]="draft()"
          (input)="onHex($event)"
        />
      </div>
    }
  `,
  host: { class: 'strct-cp' },
  styles: [
    `
    .strct-cp { position: relative; display: inline-block; }
    .strct-cp__trigger {
      display: inline-flex; align-items: center; gap: 9px;
      padding: 6px 11px 6px 7px; border-radius: 6px; cursor: pointer;
      font-family: var(--font); font-size: 13px; color: var(--t1);
      background: var(--bg-2); border: 1px solid var(--b2);
    }
    .strct-cp__trigger:hover { border-color: var(--b3); }
    .strct-cp__swatch {
      width: 20px; height: 20px; border-radius: 5px; flex-shrink: 0;
      border: 1px solid var(--b3); background-clip: padding-box;
    }
    .strct-cp__value { font-family: var(--mono); font-size: 12px; }
    .strct-cp__panel {
      position: absolute; top: calc(100% + 5px); left: 0; z-index: 250; width: 196px; padding: 10px;
      background: var(--bg-1); border: 1px solid var(--b2); border-radius: 9px; box-shadow: var(--shh);
    }
    .strct-cp__grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 6px; margin-bottom: 9px; }
    .strct-cp__chip {
      aspect-ratio: 1; border-radius: 5px; cursor: pointer; padding: 0;
      border: 1px solid var(--b2); background-clip: padding-box;
      transition: transform .12s ease;
    }
    .strct-cp__chip:hover { transform: scale(1.1); }
    .strct-cp__chip--active { box-shadow: 0 0 0 2px var(--bg-1), 0 0 0 4px var(--acc); }
    .strct-cp__hex { font-family: var(--mono); font-size: 12px; text-transform: lowercase; }
    `,
  ],
})
export class StrctColorPicker implements ControlValueAccessor {
  private readonly host = inject(ElementRef<HTMLElement>);
  readonly swatches = input<string[]>(DEFAULT_SWATCHES);

  readonly value = signal('');
  readonly draft = signal('');
  readonly open = signal(false);
  readonly isDisabled = signal(false);

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  toggle(): void {
    if (this.isDisabled()) return;
    this.draft.set(this.value());
    this.open.update((v) => !v);
  }

  protected eq(color: string): boolean {
    return color.toLowerCase() === this.value().toLowerCase();
  }

  pick(color: string): void {
    this.commit(color);
    this.open.set(false);
  }

  onHex(event: Event): void {
    const raw = (event.target as HTMLInputElement).value.trim();
    this.draft.set(raw);
    if (HEX.test(raw)) this.commit(raw.toLowerCase());
  }

  private commit(color: string): void {
    this.value.set(color);
    this.draft.set(color);
    this.onChange(color);
    this.onTouched();
  }

  @HostListener('document:click', ['$event'])
  protected onDocClick(event: MouseEvent): void {
    if (this.open() && !this.host.nativeElement.contains(event.target as Node)) {
      this.open.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    this.open.set(false);
  }

  writeValue(value: string): void {
    this.value.set(value || '');
    this.draft.set(value || '');
  }
  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(isDisabled: boolean): void {
    this.isDisabled.set(isDisabled);
  }
}
