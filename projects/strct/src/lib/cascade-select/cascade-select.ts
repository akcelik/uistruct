import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  ElementRef,
  HostListener,
  computed,
  forwardRef,
  inject,
  input,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { StrctIcon } from '../icon/icon';
import { StrctOverlay } from '../overlay/overlay';

/** One option in a cascade select. */
export interface StrctCascadeOption {
  label: string;
  value?: unknown;
  children?: StrctCascadeOption[];
}

/** DI token the nodes use to talk back to the host control (avoids a circular type). */
export abstract class StrctCascadeHost {
  abstract pick(value: unknown): void;
  abstract isSelected(value: unknown): boolean;
}

/**
 * One row in the cascade. Leaf rows select on click; group rows reveal a
 * fly-out of their children on hover. Recurses to any depth.
 */
@Component({
  selector: 'strct-cascade-node',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [StrctIcon, forwardRef(() => StrctCascadeNode)],
  template: `
    <div
      class="strct-csn"
      [class.strct-csn--selected]="isLeafSelected()"
      role="menuitem"
      tabindex="0"
      (mouseenter)="hasChildren() && open.set(true)"
      (mouseleave)="open.set(false)"
      (click)="onClick($event)"
      (keydown.enter)="onClick($event)"
      (keydown.space)="onClick($event)"
    >
      <span class="strct-csn__label">{{ option().label }}</span>
      @if (hasChildren()) {
        <strct-icon class="strct-csn__arrow" name="chevronRight" [size]="12" [strokeWidth]="1.6" />
      }
      @if (hasChildren() && open()) {
        <div class="strct-csn__flyout" role="menu">
          @for (child of option().children; track child) {
            <strct-cascade-node [option]="child" />
          }
        </div>
      }
    </div>
  `,
  styles: [
    `
      .strct-csn {
        position: relative;
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 7px 8px 7px 10px;
        border-radius: 5px;
        cursor: pointer;
        font-size: 13px;
        color: var(--t1);
      }
      .strct-csn:hover {
        background: var(--bg-3);
      }
      .strct-csn--selected {
        color: var(--acc);
        background: var(--acc-m);
      }
      .strct-csn__label {
        flex: 1;
        white-space: nowrap;
      }
      .strct-csn__arrow {
        color: var(--t3);
      }
      .strct-csn__flyout {
        position: absolute;
        top: -5px;
        left: 100%;
        z-index: 1;
        min-width: 160px;
        margin-left: 2px;
        padding: 4px;
        background: var(--bg-1);
        border: 1px solid var(--b2);
        border-radius: 7px;
        box-shadow: var(--shh);
      }
    `,
  ],
})
export class StrctCascadeNode {
  private readonly host = inject(StrctCascadeHost);
  /** Option. */
  readonly option = input.required<StrctCascadeOption>();
  readonly open = signal(false);

  protected readonly hasChildren = computed(() => !!this.option().children?.length);
  protected readonly isLeafSelected = computed(
    () => !this.hasChildren() && this.host.isSelected(this.option().value),
  );

  protected onClick(event: Event): void {
    if (this.hasChildren()) {
      event.stopPropagation(); // group rows only expand
    } else {
      this.host.pick(this.option().value);
    }
  }
}

/**
 * Hierarchical single-select — pick a leaf from nested groups (e.g. a port
 * group under a virtual switch). CVA-compatible.
 *   <strct-cascade-select [options]="switches" [(ngModel)]="portGroup" />
 */
@Component({
  selector: 'strct-cascade-select',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [StrctCascadeNode, StrctIcon, StrctOverlay],
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => StrctCascadeSelect), multi: true },
    { provide: StrctCascadeHost, useExisting: forwardRef(() => StrctCascadeSelect) },
  ],
  template: `
    <button
      #trigger
      type="button"
      class="strct-cs__trigger"
      [attr.aria-expanded]="open()"
      [disabled]="isDisabled()"
      (click)="toggle()"
    >
      <span class="strct-cs__value" [class.strct-cs__value--empty]="!selectedLabel()">
        {{ selectedLabel() || placeholder() }}
      </span>
      <strct-icon class="strct-cs__caret" name="chevronDown" [size]="14" />
    </button>
    @if (open()) {
      <div
        class="strct-cs__panel"
        role="menu"
        [strctOverlay]="trigger"
        strctOverlayPlacement="bottom-start"
      >
        @for (opt of options(); track opt) {
          <strct-cascade-node [option]="opt" />
        }
      </div>
    }
  `,
  host: { class: 'strct-cs' },
  styles: [
    `
      .strct-cs {
        position: relative;
        display: inline-block;
        width: 100%;
        max-width: 280px;
      }
      .strct-cs__trigger {
        display: flex;
        align-items: center;
        gap: 8px;
        width: 100%;
        padding: 7px 10px;
        border-radius: 6px;
        cursor: pointer;
        font-family: var(--font);
        font-size: 13px;
        color: var(--t1);
        background: var(--bg-2);
        border: 1px solid var(--b2);
        text-align: left;
      }
      .strct-cs__trigger:hover {
        border-color: var(--b3);
      }
      .strct-cs__value {
        flex: 1;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .strct-cs__value--empty {
        color: var(--t3);
      }
      .strct-cs__caret {
        color: var(--t3);
      }
      .strct-cs__panel {
        position: absolute;
        top: calc(100% + 4px);
        left: 0;
        z-index: 200;
        min-width: 180px;
        padding: 4px;
        background: var(--bg-1);
        border: 1px solid var(--b2);
        border-radius: 7px;
        box-shadow: var(--shh);
      }
    `,
  ],
})
export class StrctCascadeSelect extends StrctCascadeHost implements ControlValueAccessor {
  private readonly elementRef = inject(ElementRef<HTMLElement>);

  /** Available options. */
  readonly options = input<StrctCascadeOption[]>([]);
  /** Placeholder text when empty. */
  readonly placeholder = input('Select…');

  readonly value = signal<unknown>(null);
  readonly open = signal(false);
  readonly isDisabled = signal(false);

  protected readonly selectedLabel = computed(() => this.findLabel(this.options(), this.value()));

  private onChange: (value: unknown) => void = () => {};
  private onTouched: () => void = () => {};

  toggle(): void {
    if (!this.isDisabled()) this.open.update((v) => !v);
  }

  override pick(value: unknown): void {
    this.value.set(value);
    this.open.set(false);
    this.onChange(value);
    this.onTouched();
  }

  override isSelected(value: unknown): boolean {
    return value !== undefined && value === this.value();
  }

  private findLabel(opts: StrctCascadeOption[], value: unknown): string {
    for (const o of opts) {
      if (o.value !== undefined && o.value === value) return o.label;
      if (o.children) {
        const found = this.findLabel(o.children, value);
        if (found) return found;
      }
    }
    return '';
  }

  @HostListener('document:click', ['$event'])
  protected onDocClick(event: MouseEvent): void {
    if (this.open() && !this.elementRef.nativeElement.contains(event.target as Node)) {
      this.open.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    this.open.set(false);
  }

  writeValue(value: unknown): void {
    this.value.set(value);
  }
  registerOnChange(fn: (value: unknown) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(isDisabled: boolean): void {
    this.isDisabled.set(isDisabled);
  }
}
