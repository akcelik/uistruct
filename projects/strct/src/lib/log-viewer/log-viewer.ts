import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewEncapsulation,
  booleanAttribute,
  computed,
  effect,
  input,
  model,
  signal,
  viewChild,
} from '@angular/core';
import { StrctButton } from '../button/button';
import { StrctIcon } from '../icon/icon';

/** A log line: plain text plus an optional severity for tinting. */
export interface StrctLogLine {
  text: string;
  level?: 'error' | 'warn' | 'info' | 'debug';
}

/** One render segment of a line after ANSI parsing. */
interface LogSegment {
  text: string;
  cls: string;
}

interface RenderLine {
  index: number;
  level: string;
  segments: LogSegment[];
}

// SGR code → segment class. Colors map onto chart/status tokens, not raw hues.
const ANSI_CLASSES: Record<number, string> = {
  1: 'b',
  30: 'c30',
  31: 'c31',
  32: 'c32',
  33: 'c33',
  34: 'c34',
  35: 'c35',
  36: 'c36',
  37: 'c37',
  90: 'c90',
  91: 'c31',
  92: 'c32',
  93: 'c33',
  94: 'c34',
  95: 'c35',
  96: 'c36',
  97: 'c37',
};

const LEVEL_RE = /\b(ERROR|ERR|FATAL|WARN(?:ING)?|INFO|DEBUG|TRACE)\b/;

/**
 * Virtualized log tail — the `kubectl logs -f` surface as a component:
 *
 *   <strct-log-viewer [lines]="lines()" [(follow)]="follow" [height]="360" />
 *
 * - **Virtualized**: only the visible window plus overscan is in the DOM, so
 *   100k lines scroll flat.
 * - **Follow mode** (two-way): sticks to the tail as lines stream in;
 *   scrolling up pauses it, the button (or scrolling back to the bottom)
 *   resumes it — the Grafana/Loki convention.
 * - **ANSI SGR colors** (16-color + bold) parsed into safe spans — no
 *   innerHTML — and severity tinting from `StrctLogLine.level` or, for plain
 *   strings, auto-detected ERROR/WARN/INFO/DEBUG tokens.
 */
@Component({
  selector: 'strct-log-viewer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [StrctButton, StrctIcon],
  template: `
    <div class="strct-lv__bar">
      <span class="strct-lv__title">{{ title() }}</span>
      <span class="strct-lv__count">{{ normalized().length }} {{ linesLabel() }}</span>
      <span class="strct-lv__grow"></span>
      <button
        strct-button
        size="sm"
        [variant]="wrapMode() ? 'primary' : 'flat'"
        [attr.aria-pressed]="wrapMode()"
        (click)="wrapMode.set(!wrapMode())"
      >
        {{ wrapLabel() }}
      </button>
      <button
        strct-button
        size="sm"
        [variant]="follow() ? 'primary' : 'flat'"
        [attr.aria-pressed]="follow()"
        (click)="toggleFollow()"
      >
        <strct-icon name="chevronDoubleDown" [size]="12" />
        {{ followLabel() }}
      </button>
    </div>
    <div
      #scroller
      class="strct-lv__scroll"
      role="log"
      tabindex="0"
      [attr.aria-label]="title()"
      [style.height.px]="height()"
      (scroll)="onScroll()"
    >
      <div class="strct-lv__spacer" [style.height.px]="totalHeight()">
        <div
          class="strct-lv__window"
          [class.strct-lv__window--wrap]="wrapMode()"
          [style.transform]="'translateY(' + offsetY() + 'px)'"
        >
          @for (line of window(); track line.index) {
            <div class="strct-lv__line strct-lv__line--{{ line.level }}">
              <span class="strct-lv__no" aria-hidden="true">{{ line.index + 1 }}</span>
              <span class="strct-lv__text">
                @for (seg of line.segments; track $index) {
                  <span class="strct-lv__seg-{{ seg.cls }}">{{ seg.text }}</span>
                }
              </span>
            </div>
          } @empty {
            <div class="strct-lv__empty">{{ emptyLabel() }}</div>
          }
        </div>
      </div>
    </div>
  `,
  host: { class: 'strct-lv' },
  styles: [
    `
      .strct-lv {
        display: block;
        border: 1px solid var(--b2);
        border-radius: 9px;
        background: var(--bg-2);
        overflow: hidden;
      }
      .strct-lv__bar {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 6px 10px;
        border-bottom: 1px solid var(--b1);
      }
      .strct-lv__title {
        font-size: 12.5px;
        font-weight: 600;
        color: var(--t1);
      }
      .strct-lv__count {
        font-size: 11px;
        color: var(--t3);
        font-variant-numeric: tabular-nums;
      }
      .strct-lv__grow {
        flex: 1;
      }
      .strct-lv__scroll {
        overflow: auto;
        overscroll-behavior: contain;
      }
      .strct-lv__scroll:focus-visible {
        outline: 2px solid var(--acc50);
        outline-offset: -2px;
      }
      .strct-lv__spacer {
        position: relative;
      }
      .strct-lv__window {
        position: absolute;
        inset-inline: 0;
        top: 0;
      }
      .strct-lv__line {
        display: flex;
        gap: 10px;
        height: var(--strct-lv-line-height, 20px);
        line-height: var(--strct-lv-line-height, 20px);
        padding-inline: 10px;
        font-family: var(--mono);
        font-size: 12px;
        color: var(--t1);
        white-space: pre;
      }
      .strct-lv__window--wrap .strct-lv__line {
        height: auto;
        min-height: var(--strct-lv-line-height, 20px);
      }
      .strct-lv__window--wrap .strct-lv__text {
        white-space: pre-wrap;
        overflow-wrap: anywhere;
      }
      .strct-lv__no {
        flex-shrink: 0;
        min-width: 4ch;
        text-align: end;
        color: var(--t4);
        user-select: none;
        font-variant-numeric: tabular-nums;
      }
      .strct-lv__line--error {
        background: var(--critical-bg);
      }
      .strct-lv__line--error .strct-lv__text {
        color: var(--critical);
      }
      .strct-lv__line--warn {
        background: var(--warning-bg);
      }
      .strct-lv__line--warn .strct-lv__text {
        color: var(--warning);
      }
      .strct-lv__line--debug .strct-lv__text {
        color: var(--t3);
      }
      .strct-lv__empty {
        padding: 14px 12px;
        font-size: 12.5px;
        color: var(--t3);
      }
      /* ANSI palette — semantic tokens first, chart hues for the rest. */
      .strct-lv__seg-b {
        font-weight: 700;
      }
      .strct-lv__seg-c31 {
        color: var(--critical);
      }
      .strct-lv__seg-c32 {
        color: var(--success);
      }
      .strct-lv__seg-c33 {
        color: var(--warning);
      }
      .strct-lv__seg-c34 {
        color: var(--chart-1, var(--acc));
      }
      .strct-lv__seg-c35 {
        color: var(--chart-4, var(--acc));
      }
      .strct-lv__seg-c36 {
        color: var(--chart-5, var(--acc));
      }
      .strct-lv__seg-c37 {
        color: var(--t1);
      }
      .strct-lv__seg-c30,
      .strct-lv__seg-c90 {
        color: var(--t3);
      }
    `,
  ],
})
export class StrctLogViewer {
  /** Log lines — plain strings or `{ text, level }` objects. */
  readonly lines = input<(string | StrctLogLine)[]>([]);
  /** Viewport height in px. */
  readonly height = input(320);
  /** Follow the tail as new lines arrive (two-way; pauses on scroll-up). */
  readonly follow = model(true);
  /** Soft-wrap long lines instead of horizontal scrolling (two-way). */
  readonly wrapMode = model(false);
  /** Auto-detect ERROR/WARN/INFO/DEBUG tokens on plain-string lines. */
  readonly autoLevel = input(true, { transform: booleanAttribute });
  /** Localizable strings. */
  readonly title = input('Logs');
  readonly followLabel = input('Follow');
  readonly wrapLabel = input('Wrap');
  readonly linesLabel = input('lines');
  readonly emptyLabel = input('No log lines.');

  private readonly scroller = viewChild.required<ElementRef<HTMLElement>>('scroller');
  private readonly scrollTop = signal(0);
  private suppressScrollEvent = false;

  private static readonly LINE_H = 20;
  private static readonly OVERSCAN = 10;

  protected readonly normalized = computed<StrctLogLine[]>(() =>
    this.lines().map((l) => (typeof l === 'string' ? { text: l } : l)),
  );

  protected readonly totalHeight = computed(
    () => this.normalized().length * StrctLogViewer.LINE_H || StrctLogViewer.LINE_H,
  );

  private readonly windowStart = computed(() => {
    const start = Math.floor(this.scrollTop() / StrctLogViewer.LINE_H) - StrctLogViewer.OVERSCAN;
    return Math.max(0, start);
  });

  protected readonly offsetY = computed(() => this.windowStart() * StrctLogViewer.LINE_H);

  protected readonly window = computed<RenderLine[]>(() => {
    const all = this.normalized();
    const start = this.windowStart();
    const visible = Math.ceil(this.height() / StrctLogViewer.LINE_H) + StrctLogViewer.OVERSCAN * 2;
    return all.slice(start, start + visible).map((line, i) => ({
      index: start + i,
      level: line.level ?? (this.autoLevel() ? detectLevel(line.text) : 'none'),
      segments: parseAnsi(line.text),
    }));
  });

  constructor() {
    // Stick to the tail whenever content grows while following.
    effect(() => {
      this.totalHeight();
      if (!this.follow()) return;
      const el = this.scroller().nativeElement;
      // After the DOM height settles.
      requestAnimationFrame(() => {
        this.suppressScrollEvent = true;
        el.scrollTop = el.scrollHeight;
        this.scrollTop.set(el.scrollTop);
      });
    });
  }

  protected onScroll(): void {
    const el = this.scroller().nativeElement;
    this.scrollTop.set(el.scrollTop);
    if (this.suppressScrollEvent) {
      this.suppressScrollEvent = false;
      return;
    }
    const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - StrctLogViewer.LINE_H;
    // Manual scroll: leaving the tail pauses follow, reaching it resumes.
    if (this.follow() && !atBottom) this.follow.set(false);
    else if (!this.follow() && atBottom) this.follow.set(true);
  }

  protected toggleFollow(): void {
    const next = !this.follow();
    this.follow.set(next);
    if (next) {
      const el = this.scroller().nativeElement;
      this.suppressScrollEvent = true;
      el.scrollTop = el.scrollHeight;
      this.scrollTop.set(el.scrollTop);
    }
  }
}

function detectLevel(text: string): string {
  const m = LEVEL_RE.exec(text);
  if (!m) return 'none';
  const tok = m[1];
  if (tok.startsWith('ERR') || tok === 'FATAL') return 'error';
  if (tok.startsWith('WARN')) return 'warn';
  if (tok === 'DEBUG' || tok === 'TRACE') return 'debug';
  return 'info';
}

/** Parse ANSI SGR sequences into class-tagged segments (16-color + bold). */
export function parseAnsi(text: string): LogSegment[] {
  if (!text.includes('\u001b[')) return [{ text, cls: 'c37' }];
  const segments: LogSegment[] = [];
  const re = /\u001b\[([0-9;]*)m/g;
  let last = 0;
  let current = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) {
      segments.push({ text: text.slice(last, m.index), cls: clsOf(current) });
    }
    for (const raw of (m[1] || '0').split(';')) {
      const code = Number(raw || '0');
      if (code === 0) current = new Set();
      else if (ANSI_CLASSES[code]) {
        // A new foreground color replaces the previous one; bold stacks.
        if (code !== 1) for (const c of [...current]) if (c !== 'b') current.delete(c);
        current.add(ANSI_CLASSES[code]);
      }
    }
    last = re.lastIndex;
  }
  if (last < text.length) segments.push({ text: text.slice(last), cls: clsOf(current) });
  return segments.length ? segments : [{ text: '', cls: 'c37' }];
}

function clsOf(set: Set<string>): string {
  return set.size ? [...set].join(' strct-lv__seg-') : 'c37';
}
