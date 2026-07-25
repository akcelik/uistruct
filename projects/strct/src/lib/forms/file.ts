import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  booleanAttribute,
  forwardRef,
  input,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { StrctIcon } from '../icon/icon';

/**
 * Drag-and-drop file picker. CVA value is a `File[]`.
 *   <strct-file [(ngModel)]="files" multiple accept="image/*" />
 */
@Component({
  selector: 'strct-file',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [StrctIcon],
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => StrctFile), multi: true },
  ],
  template: `
    <div
      class="strct-file__zone"
      [class.strct-file__zone--drag]="dragging()"
      [class.strct-file__zone--disabled]="isDisabled()"
      role="button"
      tabindex="0"
      (click)="!isDisabled() && input.click()"
      (keydown.enter)="!isDisabled() && input.click()"
      (keydown.space)="$event.preventDefault(); !isDisabled() && input.click()"
      (dragover)="onDragOver($event)"
      (dragleave)="dragging.set(false)"
      (drop)="onDrop($event)"
    >
      <strct-icon name="upload" [size]="20" />
      <div class="strct-file__prompt">
        <strong>{{ dropLabel() }}</strong> or
        <span class="strct-file__browse">{{ browseLabel() }}</span>
      </div>
      <input
        #input
        type="file"
        class="strct-file__native"
        [multiple]="multiple()"
        [accept]="accept()"
        [disabled]="isDisabled()"
        (change)="onSelect($event)"
        (blur)="onTouched()"
      />
    </div>

    @if (files().length) {
      <ul class="strct-file__list">
        @for (file of files(); track file.name + file.size) {
          <li class="strct-file__file">
            <span class="strct-file__name">{{ file.name }}</span>
            <span class="strct-file__size">{{ humanSize(file.size) }}</span>
            <button
              type="button"
              class="strct-file__remove"
              [attr.aria-label]="removeLabel()"
              (click)="remove(file)"
            >
              <strct-icon name="close" [size]="12" />
            </button>
          </li>
        }
      </ul>
    }
  `,
  host: { class: 'strct-file' },
  styles: [
    `
      .strct-file {
        display: block;
        width: 100%;
      }
      .strct-file__zone {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
        padding: 22px 16px;
        text-align: center;
        cursor: pointer;
        color: var(--t2);
        background: var(--bg-2);
        border: 1px dashed var(--b3);
        border-radius: 8px;
        transition:
          border-color 0.14s ease,
          background 0.14s ease,
          color 0.14s ease;
      }
      .strct-file__zone:hover {
        border-color: var(--acc30);
        color: var(--t1);
      }
      .strct-file__zone strct-icon {
        color: var(--t3);
      }
      .strct-file__zone--drag {
        border-color: var(--acc);
        background: var(--acc-m);
        color: var(--t1);
      }
      .strct-file__zone--drag strct-icon {
        color: var(--acc);
      }
      .strct-file__zone--disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      .strct-file__prompt {
        font-size: 13px;
      }
      .strct-file__browse {
        color: var(--acc);
      }
      .strct-file__native {
        display: none;
      }
      .strct-file__list {
        list-style: none;
        margin: 10px 0 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .strct-file__file {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 7px 10px;
        font-size: 13px;
        background: var(--bg-1);
        border: 1px solid var(--b2);
        border-radius: 6px;
      }
      .strct-file__name {
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        color: var(--t1);
      }
      .strct-file__size {
        font-size: 12px;
        color: var(--t3);
        font-family: var(--mono);
      }
      .strct-file__remove {
        display: inline-flex;
        padding: 3px;
        border: 0;
        border-radius: 4px;
        background: transparent;
        color: var(--t3);
        cursor: pointer;
      }
      .strct-file__remove:hover {
        color: var(--critical);
        background: var(--critical-bg);
      }
    `,
  ],
})
export class StrctFile implements ControlValueAccessor {
  /** Multiple. */
  readonly multiple = input(false, { transform: booleanAttribute });
  /** Accept. */
  readonly accept = input('');
  /** Static disable flag. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Localized prompt text above the "browse" link. */
  readonly dropLabel = input('Drag files here');
  /** Localized text of the "browse" link. */
  readonly browseLabel = input('browse');
  /** aria-label of the per-file remove button. */
  readonly removeLabel = input('Remove');

  readonly files = signal<File[]>([]);
  readonly dragging = signal(false);
  readonly isDisabled = signal(false);

  private onChange: (value: File[]) => void = () => {};
  protected onTouched: () => void = () => {};

  onSelect(event: Event): void {
    const target = event.target as HTMLInputElement;
    const list = target.files;
    if (list) this.setFiles(Array.from(list));
    // Reset so re-picking the same file fires change again.
    target.value = '';
  }

  onDragOver(event: DragEvent): void {
    if (this.isDisabled()) return;
    event.preventDefault();
    this.dragging.set(true);
  }

  onDrop(event: DragEvent): void {
    if (this.isDisabled()) return;
    event.preventDefault();
    this.dragging.set(false);
    const dropped = event.dataTransfer?.files;
    if (dropped?.length) {
      const accepted = this.filterAccepted(Array.from(dropped));
      if (accepted.length) this.setFiles(accepted);
    }
  }

  remove(file: File): void {
    this.setFiles(this.files().filter((f) => f !== file));
  }

  protected humanSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }

  private setFiles(incoming: File[]): void {
    const next = this.multiple() ? incoming : incoming.slice(0, 1);
    this.files.set(next);
    this.onChange(next);
    this.onTouched();
  }

  /** Keep only files matching `accept` (extension or mime pattern), like the native picker. */
  private filterAccepted(files: File[]): File[] {
    const patterns = this.accept()
      .split(',')
      .map((p) => p.trim().toLowerCase())
      .filter(Boolean);
    if (!patterns.length) return files;
    return files.filter((file) =>
      patterns.some((pattern) => {
        if (pattern.startsWith('.')) return file.name.toLowerCase().endsWith(pattern);
        if (pattern.endsWith('/*')) return file.type.toLowerCase().startsWith(pattern.slice(0, -1));
        return file.type.toLowerCase() === pattern;
      }),
    );
  }

  writeValue(value: File[]): void {
    this.files.set(Array.isArray(value) ? value : []);
  }
  registerOnChange(fn: (value: File[]) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(isDisabled: boolean): void {
    this.isDisabled.set(isDisabled);
  }
}
