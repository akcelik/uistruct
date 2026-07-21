import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
  model,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { StrctButton } from '../button/button';
import { StrctDropdown, StrctDropdownTrigger } from '../dropdown/dropdown';
import { StrctIcon } from '../icon/icon';

/** A resolved time window. `presetId` is set when it came from a quick range. */
export interface StrctTimeRange {
  from: Date;
  to: Date;
  presetId?: string;
}

/** A "last X" quick range. `ms` is the window length ending at now. */
export interface StrctTimeRangePreset {
  id: string;
  label: string;
  ms: number;
}

/** The Grafana-conventional quick ranges consoles expect. */
export const STRCT_TIME_RANGE_PRESETS: StrctTimeRangePreset[] = [
  { id: '15m', label: 'Last 15 minutes', ms: 15 * 60_000 },
  { id: '1h', label: 'Last 1 hour', ms: 3_600_000 },
  { id: '6h', label: 'Last 6 hours', ms: 6 * 3_600_000 },
  { id: '24h', label: 'Last 24 hours', ms: 24 * 3_600_000 },
  { id: '7d', label: 'Last 7 days', ms: 7 * 86_400_000 },
  { id: '30d', label: 'Last 30 days', ms: 30 * 86_400_000 },
];

/**
 * Monitoring time-range picker — the "Last 1 hour ▾" control charts hang off:
 * quick relative ranges plus an absolute from/to editor, in one popover.
 *
 *   <strct-time-range [(range)]="range" />
 *
 * Picking a preset resolves it against "now" immediately and stamps
 * `presetId`, so a consumer can re-resolve the same preset on its own refresh
 * tick. The popover reuses `strct-dropdown`'s dialog semantics: inner clicks
 * keep it open, outside click / Escape dismiss.
 */
@Component({
  selector: 'strct-time-range',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [StrctButton, StrctDropdown, StrctDropdownTrigger, StrctIcon],
  template: `
    <strct-dropdown #dd popover [popoverLabel]="dialogLabel()" [align]="align()">
      <button strct-button variant="neutral" strctDropdownTrigger class="strct-tr__trigger">
        <strct-icon name="clock" [size]="13" />
        <span class="strct-tr__label">{{ triggerLabel() }}</span>
        <strct-icon name="chevronDown" [size]="12" />
      </button>

      <div class="strct-tr__panel">
        <div class="strct-tr__group" role="group" [attr.aria-label]="quickLabel()">
          <div class="strct-tr__head">{{ quickLabel() }}</div>
          @for (p of presets(); track p.id) {
            <button
              type="button"
              class="strct-tr__preset"
              [class.strct-tr__preset--active]="range()?.presetId === p.id"
              [attr.aria-pressed]="range()?.presetId === p.id"
              (click)="pickPreset(p); dd.close()"
            >
              {{ p.label }}
            </button>
          }
        </div>

        <div class="strct-tr__group" role="group" [attr.aria-label]="absoluteLabel()">
          <div class="strct-tr__head">{{ absoluteLabel() }}</div>
          <label class="strct-tr__field">
            <span>{{ fromLabel() }}</span>
            <input
              type="datetime-local"
              class="strct-tr__input"
              [value]="draftFrom()"
              (input)="draftFrom.set($any($event.target).value)"
            />
          </label>
          <label class="strct-tr__field">
            <span>{{ toLabel() }}</span>
            <input
              type="datetime-local"
              class="strct-tr__input"
              [value]="draftTo()"
              (input)="draftTo.set($any($event.target).value)"
            />
          </label>
          @if (draftError()) {
            <div class="strct-tr__error" role="alert">{{ invalidLabel() }}</div>
          }
          <button
            strct-button
            variant="primary"
            size="sm"
            class="strct-tr__apply"
            [disabled]="draftError()"
            (click)="applyAbsolute() && dd.close()"
          >
            {{ applyLabel() }}
          </button>
        </div>
      </div>
    </strct-dropdown>
  `,
  host: { class: 'strct-tr' },
  styles: [
    `
      .strct-tr {
        display: inline-block;
      }
      .strct-tr__trigger .strct-tr__label {
        max-width: 220px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .strct-tr__panel {
        display: flex;
        gap: 16px;
      }
      .strct-tr__group {
        display: flex;
        flex-direction: column;
        gap: 2px;
        min-width: 150px;
      }
      .strct-tr__head {
        font-size: 10.5px;
        font-weight: 600;
        letter-spacing: 0.7px;
        text-transform: uppercase;
        color: var(--t3);
        margin-bottom: 5px;
      }
      .strct-tr__preset {
        text-align: start;
        padding: 6px 9px;
        border: 0;
        border-radius: var(--radius-sm);
        background: transparent;
        font-family: var(--font);
        font-size: 12.5px;
        color: var(--t1);
        cursor: pointer;
      }
      .strct-tr__preset:hover {
        background: var(--bg-3);
      }
      .strct-tr__preset--active {
        background: var(--acc18);
        color: var(--acc);
        font-weight: 600;
      }
      .strct-tr__preset:focus-visible,
      .strct-tr__input:focus-visible {
        outline: 2px solid var(--acc50);
        outline-offset: 1px;
      }
      .strct-tr__field {
        display: flex;
        flex-direction: column;
        gap: 3px;
        font-size: 11.5px;
        color: var(--t2);
        margin-bottom: 7px;
      }
      .strct-tr__input {
        padding: 5px 8px;
        border: 1px solid var(--b2);
        border-radius: var(--radius-sm);
        background: var(--bg-2);
        color: var(--t1);
        font-family: var(--font);
        font-size: 12px;
        color-scheme: light dark;
      }
      .strct-tr__error {
        font-size: 11.5px;
        color: var(--critical);
        margin-bottom: 6px;
      }
      .strct-tr__apply {
        align-self: flex-start;
      }
    `,
  ],
})
export class StrctTimeRangePicker {
  /** The selected window, two-way. Null until the user (or you) picks one. */
  readonly range = model<StrctTimeRange | null>(null);
  /** Quick ranges shown in the left column. */
  readonly presets = input<StrctTimeRangePreset[]>(STRCT_TIME_RANGE_PRESETS);
  /** Popover alignment, as in strct-dropdown. */
  readonly align = input<'start' | 'end'>('start');
  /** Localizable strings. */
  readonly dialogLabel = input('Time range');
  readonly quickLabel = input('Quick ranges');
  readonly absoluteLabel = input('Absolute range');
  readonly fromLabel = input('From');
  readonly toLabel = input('To');
  readonly applyLabel = input('Apply');
  readonly invalidLabel = input('"From" must be before "To".');
  readonly placeholderLabel = input('Select time range');
  /** Fires on every commit (preset pick or absolute apply). */
  readonly applied = output<StrctTimeRange>();

  protected readonly dd = viewChild.required(StrctDropdown);

  // Absolute-editor draft (datetime-local strings), seeded from the range.
  protected readonly draftFrom = signal('');
  protected readonly draftTo = signal('');

  protected readonly draftError = computed(() => {
    const f = this.draftFrom();
    const t = this.draftTo();
    if (!f || !t) return false;
    return new Date(f).getTime() >= new Date(t).getTime();
  });

  protected readonly triggerLabel = computed(() => {
    const r = this.range();
    if (!r) return this.placeholderLabel();
    const preset = this.presets().find((p) => p.id === r.presetId);
    if (preset) return preset.label;
    return `${this.formatStamp(r.from)} → ${this.formatStamp(r.to)}`;
  });

  protected pickPreset(p: StrctTimeRangePreset): void {
    const to = new Date();
    const next: StrctTimeRange = { from: new Date(to.getTime() - p.ms), to, presetId: p.id };
    this.range.set(next);
    this.applied.emit(next);
    this.seedDraft(next);
  }

  protected applyAbsolute(): boolean {
    const f = this.draftFrom();
    const t = this.draftTo();
    if (!f || !t || this.draftError()) return false;
    const next: StrctTimeRange = { from: new Date(f), to: new Date(t) };
    this.range.set(next);
    this.applied.emit(next);
    return true;
  }

  /** Re-resolve a preset range against "now" — call from your refresh tick. */
  refresh(): void {
    const r = this.range();
    const preset = r && this.presets().find((p) => p.id === r.presetId);
    if (!preset) return;
    this.pickPreset(preset);
  }

  private seedDraft(r: StrctTimeRange): void {
    this.draftFrom.set(this.toLocal(r.from));
    this.draftTo.set(this.toLocal(r.to));
  }

  private toLocal(d: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  private formatStamp(d: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
}
