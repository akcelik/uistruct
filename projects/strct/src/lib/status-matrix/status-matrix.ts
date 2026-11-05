import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  booleanAttribute,
  computed,
  inject,
  input,
  model,
  output,
  signal,
  ElementRef,
} from '@angular/core';
import { StrctIcon } from '../icon/icon';
import { StrctStatus } from '../status';

/**
 * The five canonical tones, plus the two absences a judgement grid needs.
 *
 * They are not the same absence and must not be drawn as one: `unjudged` is a
 * gap in the reading — the check applies here and nothing came back — while
 * `off-subject` is the shape of the data, a check that has no meaning for this
 * subject. On a monitoring screen the first is an operational fact about the
 * fleet and the second is a fact about the catalogue.
 */
export type StrctMatrixState = StrctStatus | 'unjudged' | 'off-subject';

/** A row or a column of the matrix. */
export interface StrctMatrixAxis {
  /** The catalogue's own id — "H19" — gaps and all. Never renumbered. */
  id: string;
  /** What it is called. */
  label: string;
  /** A second line under the label, or a title on a column head. */
  hint?: string;
  /**
   * A `summary` entry is a roll-up of the subjects beside it, not another
   * subject: a "Cluster" column against four nodes. It is ruled off from them
   * and says so in every cell it owns.
   */
  kind?: 'subject' | 'summary';
}

/** One judgement. */
export interface StrctMatrixCell {
  row: string;
  col: string;
  state: StrctMatrixState;
  /** The reading behind it — "PFC 3 · policy and adapter ≠ 4 · LLDP and link peer". */
  detail?: string;
}

/** Which cell is picked. */
export interface StrctMatrixCellRef {
  row: string;
  col: string;
}

/** What `cellActivate` carries. */
export interface StrctMatrixCellEvent {
  row: StrctMatrixAxis;
  col: StrctMatrixAxis;
  state: StrctMatrixState;
  /** The declared cell, or `null` where the matrix fell back to its default. */
  cell: StrctMatrixCell | null;
}

/** Where the roll-ups go: an extra row along the bottom, a column at the end. */
export type StrctMatrixRollup = 'none' | 'row' | 'col' | 'both';

/**
 * A shape per state, so no two are told apart by hue alone. Measured under a
 * colour-vision simulation by `scripts/status-matrix.mjs`: warning against
 * critical is 1.44:1 in luminance, which is nothing a deuteranope can use.
 */
const GLYPH: Record<StrctMatrixState, string | null> = {
  success: 'check',
  warning: 'warning',
  critical: 'critical',
  // Not `info` and not `help`, though both are the obvious words: at 12px
  // each is a ring with a stroke inside it, and against `critical` — also a
  // ring — they measured 0.63% and 1.9% of differing pixels in greyscale.
  // A ring is the shape `critical` has to own, so the other two leave it.
  accent: 'flag',
  neutral: 'minus',
  unjudged: 'eyeOff',
  // Not a mark but the absence of one: an empty, dashed outline. The absence
  // is itself the shape, which is why it needs no glyph.
  'off-subject': null,
};

/** What each state is called, unless the consumer renames it. */
const WORD: Record<StrctMatrixState, string> = {
  success: 'passed',
  warning: 'warning',
  critical: 'critical',
  accent: 'note',
  neutral: 'no finding',
  unjudged: 'not judged',
  'off-subject': 'not on this subject',
};

/**
 * Which state wins a roll-up. Severity, with one deliberate placement:
 * `unjudged` outranks `accent` and `success`, because a line with an unread
 * check in it cannot be reported as clean. `off-subject` ranks lowest, so a
 * line that is entirely off-subject rolls up to off-subject rather than to a
 * judgement nobody made.
 */
const RANK: Record<StrctMatrixState, number> = {
  critical: 6,
  warning: 5,
  unjudged: 4,
  accent: 3,
  success: 2,
  neutral: 1,
  'off-subject': 0,
};

const ROLLUP_ID = '__strct_rollup__';

/**
 * A matrix of judgements: N checks against M subjects, each cell one of five
 * tones or one of two absences.
 *
 *   <strct-status-matrix
 *     [rows]="checks"
 *     [cols]="nodes"
 *     [cells]="cells"
 *     rollup="both"
 *     navigable
 *     (cellActivate)="open($event)" />
 *
 * It is not a heatmap: `strct-heatmap`'s cell is a number on a single-hue
 * intensity ramp, which invents an order between "note" and "warning" and has
 * nowhere to put either absence. Here the states are categorical, each drawn
 * with a shape as well as a tone, and every cell says its own sentence —
 * "H9 Priority flow control, HV-PRD-03: critical — PFC 3 ≠ 4" — which is also
 * the line that becomes visible when the columns stop fitting.
 */
@Component({
  selector: 'strct-status-matrix',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [StrctIcon],
  template: `
    @if (!rowsView().length || !colsView().length) {
      <p class="strct-status-matrix__empty">{{ emptyText() }}</p>
    } @else {
      <table
        class="strct-status-matrix__grid"
        role="grid"
        [attr.aria-label]="ariaLabel()"
        [attr.aria-rowcount]="rowsView().length + 1"
        [attr.aria-colcount]="colsView().length + 1"
      >
        <thead>
          <tr role="row">
            <th class="strct-status-matrix__corner" role="columnheader" scope="col">
              {{ rowHeading() }}
            </th>
            @for (c of colsView(); track c.id) {
              <th
                class="strct-status-matrix__colhead"
                role="columnheader"
                scope="col"
                [class.strct-status-matrix__colhead--summary]="c.kind === 'summary'"
              >
                <span class="strct-status-matrix__colname">{{ c.label }}</span>
                @if (c.hint) {
                  <span class="strct-status-matrix__colhint">{{ c.hint }}</span>
                }
              </th>
            }
          </tr>
        </thead>
        <tbody>
          @for (r of rowsView(); track r.id; let ri = $index) {
            <tr
              role="row"
              class="strct-status-matrix__row"
              [class.strct-status-matrix__row--summary]="r.kind === 'summary'"
            >
              <th class="strct-status-matrix__rowhead" role="rowheader" scope="row">
                @if (r.id !== ROLLUP) {
                  <span class="strct-status-matrix__rowid">{{ r.id }}</span>
                }
                <span class="strct-status-matrix__rowlabel">{{ r.label }}</span>
                @if (r.hint) {
                  <span class="strct-status-matrix__rowhint">{{ r.hint }}</span>
                }
              </th>
              @for (c of colsView(); track c.id; let ci = $index) {
                <td
                  class="strct-status-matrix__cell"
                  role="gridcell"
                  [class.strct-status-matrix__cell--summary]="c.kind === 'summary'"
                  [class.strct-status-matrix__cell--picked]="isPicked(r.id, c.id)"
                  [attr.data-matrix-cell]="r.id + '/' + c.id"
                  [attr.tabindex]="navigable() ? (isCursor(ri, ci) ? 0 : -1) : null"
                  [attr.aria-selected]="navigable() ? isPicked(r.id, c.id) : null"
                  (click)="activate(ri, ci)"
                  (focus)="cursor.set({ r: ri, c: ci })"
                  (keydown)="onKeydown($event, ri, ci)"
                >
                  <span
                    class="strct-status-matrix__mark strct-status-matrix__mark--{{
                      stateAt(r.id, c.id)
                    }}"
                    aria-hidden="true"
                  >
                    @if (glyphFor(stateAt(r.id, c.id)); as g) {
                      <strct-icon [name]="g" [size]="12" />
                    }
                  </span>
                  <span class="strct-status-matrix__sr">{{ sentence(r, c) }}</span>
                </td>
              }
            </tr>
          }
        </tbody>
      </table>
      @if (legend() && statesPresent().length) {
        <ul class="strct-status-matrix__legend">
          @for (s of statesPresent(); track s) {
            <li class="strct-status-matrix__key">
              <span
                class="strct-status-matrix__mark strct-status-matrix__mark--{{ s }}"
                aria-hidden="true"
              >
                @if (glyphFor(s); as g) {
                  <strct-icon [name]="g" [size]="12" />
                }
              </span>
              {{ word(s) }}
            </li>
          }
        </ul>
      }
      @if (label()) {
        <div class="strct-status-matrix__caption">{{ label() }}</div>
      }
    }
  `,
  styles: [
    `
      .strct-status-matrix {
        display: block;
        container-type: inline-size;
      }
      .strct-status-matrix__grid {
        width: 100%;
        border-collapse: collapse;
        table-layout: auto;
      }
      .strct-status-matrix__corner,
      .strct-status-matrix__colhead {
        padding: 0 var(--space-2) var(--space-2);
        font-size: var(--text-sm);
        font-weight: 600;
        color: var(--t2);
        text-align: center;
        vertical-align: bottom;
        border-block-end: 1px solid var(--b1);
      }
      .strct-status-matrix__corner {
        text-align: start;
        padding-inline-start: 0;
      }
      .strct-status-matrix__colname {
        display: block;
      }
      .strct-status-matrix__colhint {
        display: block;
        font-size: var(--text-xs);
        font-weight: 400;
        color: var(--t3);
      }
      /* A summary column is a roll-up of the subjects beside it, not another
         subject, so it is ruled off from them rather than sitting in line. */
      .strct-status-matrix__colhead--summary,
      .strct-status-matrix__cell--summary {
        border-inline-start: 1px solid var(--b2);
      }
      .strct-status-matrix__colhead--summary {
        font-weight: 500;
        color: var(--t3);
      }
      .strct-status-matrix__rowhead {
        padding: var(--space-1) var(--space-3) var(--space-1) 0;
        font-size: var(--text-sm);
        font-weight: 400;
        color: var(--t1);
        text-align: start;
        /* The marks sit on the row's centre line whatever the label does: a
           label that wraps to two lines must not drag its row's marks up to
           the first of them. */
        vertical-align: middle;
      }
      .strct-status-matrix__rowid {
        display: inline-block;
        min-width: 2.4em;
        color: var(--t3);
        font-variant-numeric: tabular-nums;
      }
      .strct-status-matrix__rowhint {
        display: block;
        font-size: var(--text-xs);
        color: var(--t3);
      }
      .strct-status-matrix__row--summary .strct-status-matrix__rowhead,
      .strct-status-matrix__row--summary .strct-status-matrix__cell {
        border-block-start: 1px solid var(--b2);
      }
      .strct-status-matrix__row--summary .strct-status-matrix__rowhead {
        color: var(--t2);
      }
      .strct-status-matrix__cell {
        padding: var(--space-1) var(--space-2);
        text-align: center;
        vertical-align: middle;
        /* No line box: an inline mark sits on the text baseline, which put it
           3.25px above its row's centre line however the cell was aligned.
           With the line box gone the mark's own box is what vertical-align
           centres, and the mark lands on the row's middle whatever the label
           beside it does. */
        line-height: 0;
      }
      .strct-status-matrix__cell[tabindex] {
        cursor: pointer;
      }
      .strct-status-matrix__cell:focus-visible {
        outline: 2px solid var(--acc);
        outline-offset: -2px;
      }
      .strct-status-matrix__cell--picked .strct-status-matrix__mark {
        box-shadow: 0 0 0 2px var(--acc30);
      }
      /* The mark. Each state carries a shape as well as a tone, because the
         pair that decides whether anyone is paged — warning against critical
         — is 1.44:1 in luminance, and hue is the one channel a deuteranope
         does not have. */
      .strct-status-matrix__mark {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 22px;
        height: 18px;
        border: 1px solid transparent;
        border-radius: var(--radius-sm);
      }
      .strct-status-matrix__mark--success {
        background: var(--success-bg);
        color: var(--success);
      }
      .strct-status-matrix__mark--warning {
        background: var(--warning-bg);
        color: var(--warning);
      }
      .strct-status-matrix__mark--critical {
        background: var(--critical-bg);
        color: var(--critical);
      }
      .strct-status-matrix__mark--accent {
        background: var(--acc-m);
        color: var(--acc);
      }
      .strct-status-matrix__mark--neutral {
        background: var(--bg-3);
        color: var(--t2);
      }
      /* Judged nowhere: the question mark is the point, so it is drawn in
         text ink on a plain ground rather than hinted at. */
      .strct-status-matrix__mark--unjudged {
        background: var(--bg-2);
        border-color: var(--b3);
        color: var(--t2);
      }
      /* Not a subject for this check: an empty outline, dashed, carrying no
         glyph — the absence is the shape. */
      .strct-status-matrix__mark--off-subject {
        border: 1px dashed var(--b3);
        background: none;
      }
      .strct-status-matrix__sr {
        position: absolute;
        line-height: 1.5;
        width: 1px;
        height: 1px;
        overflow: hidden;
        clip-path: inset(50%);
        white-space: nowrap;
      }
      .strct-status-matrix__legend {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-2) var(--space-4);
        margin: var(--space-3) 0 0;
        padding: 0;
        list-style: none;
        font-size: var(--text-sm);
        color: var(--t2);
      }
      .strct-status-matrix__key {
        display: flex;
        align-items: center;
        gap: var(--space-2);
      }
      .strct-status-matrix__caption {
        margin-block-start: var(--space-2);
        font-size: var(--text-sm);
        color: var(--t3);
      }
      .strct-status-matrix__empty {
        margin: 0;
        padding: var(--space-3);
        border: 1px dashed var(--b2);
        border-radius: var(--radius-md);
        font-size: var(--text-sm);
        color: var(--t3);
      }
      /* Narrow: the columns stop fitting, so the grid stacks by row and every
         cell says the sentence it was drawing. The same fallback the wiring
         map takes, for the same reason — the meaning must not scroll off the
         side of the screen. */
      @container (max-width: 560px) {
        .strct-status-matrix__grid,
        .strct-status-matrix__grid tbody,
        .strct-status-matrix__row,
        .strct-status-matrix__rowhead,
        .strct-status-matrix__cell {
          display: block;
          width: auto;
        }
        .strct-status-matrix__grid thead {
          display: none;
        }
        .strct-status-matrix__row {
          padding-block: var(--space-2);
          border-block-end: 1px solid var(--b1);
        }
        .strct-status-matrix__rowhead {
          padding: 0 0 var(--space-1);
          font-weight: 600;
        }
        .strct-status-matrix__cell {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          padding: 2px 0;
          text-align: start;
          border-inline-start: none;
        }
        .strct-status-matrix__row--summary .strct-status-matrix__cell {
          border-block-start: none;
        }
        .strct-status-matrix__sr {
          position: static;
          width: auto;
          height: auto;
          clip-path: none;
          white-space: normal;
          font-size: var(--text-sm);
          color: var(--t2);
        }
      }
    `,
  ],
  host: {
    class: 'strct-status-matrix',
  },
})
export class StrctStatusMatrix {
  /** The checks, in the order they are read. */
  readonly rows = input<StrctMatrixAxis[]>([]);
  /** The subjects they are judged against. */
  readonly cols = input<StrctMatrixAxis[]>([]);
  /** The judgements. A pair with no cell falls back to `defaultState`. */
  readonly cells = input<StrctMatrixCell[]>([]);
  /**
   * What a pair with no declared cell means. `off-subject` by default — the
   * weaker claim, and the one an omission usually is. Say `unjudged` where a
   * missing cell means the reading never arrived.
   */
  readonly defaultState = input<StrctMatrixState>('off-subject');
  /** Heading over the row labels. */
  readonly rowHeading = input('');
  /** Caption under the grid. */
  readonly label = input('');
  /** What is said when there is nothing to draw. */
  readonly emptyText = input('No checks to show.');
  /**
   * Add a roll-up: `row` puts one along the bottom (the worst state in each
   * column), `col` one at the end (the worst in each row), `both` does both.
   */
  readonly rollup = input<StrctMatrixRollup>('none');
  /** What a roll-up line is called. */
  readonly rollupLabel = input('Worst');
  /** Rename a state — for another language, or another vocabulary. */
  readonly stateText = input<Partial<Record<StrctMatrixState, string>> | null>(null);
  /**
   * One tab stop for the whole grid with the arrow keys inside it: ← / → and
   * ↑ / ↓ move a cell, Home / End jump to the ends of the line, Ctrl+Home /
   * Ctrl+End to the corners of the grid, and Enter or Space — or a click —
   * emits `(cellActivate)`. Off by default, so a grid nobody acts on keeps no
   * tab stop at all.
   */
  readonly navigable = input(false, { transform: booleanAttribute });
  /** The picked cell, two-way bound. */
  readonly selected = model<StrctMatrixCellRef | null>(null);
  /**
   * Draw a key under the grid, naming every state that is actually in the
   * data. A shape the reader cannot name is a shape they have to guess at,
   * and the key is built from the same table the cells are, so the two can
   * never disagree.
   */
  readonly legend = input(false, { transform: booleanAttribute });
  /** The cell a click or Enter / Space acted on. */
  readonly cellActivate = output<StrctMatrixCellEvent>();

  /** The states the data actually uses, worst first. */
  protected readonly statesPresent = computed<StrctMatrixState[]>(() => {
    const seen = new Set<StrctMatrixState>();
    for (const r of this.rowsView())
      for (const c of this.colsView()) seen.add(this.stateAt(r.id, c.id));
    return [...seen].sort((a, b) => RANK[b] - RANK[a]);
  });

  protected readonly ROLLUP = ROLLUP_ID;
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  /** Where the tab stop is, as row and column indices into the drawn grid. */
  protected readonly cursor = signal<{ r: number; c: number }>({ r: 0, c: 0 });

  /** The declared judgements, by `row|col`. */
  private readonly index = computed(() => {
    const map = new Map<string, StrctMatrixCell>();
    for (const c of this.cells()) map.set(`${c.row}|${c.col}`, c);
    return map;
  });

  /** The columns as drawn: the declared ones, then a roll-up if asked for. */
  protected readonly colsView = computed<StrctMatrixAxis[]>(() => {
    const cols = this.cols();
    const add = this.rollup() === 'col' || this.rollup() === 'both';
    if (!add || !cols.length) return cols;
    return [...cols, { id: ROLLUP_ID, label: this.rollupLabel(), kind: 'summary' as const }];
  });

  /** The rows as drawn, with the roll-up row last when it is asked for. */
  protected readonly rowsView = computed<StrctMatrixAxis[]>(() => {
    const rows = this.rows();
    const add = this.rollup() === 'row' || this.rollup() === 'both';
    if (!add || !rows.length) return rows;
    return [...rows, { id: ROLLUP_ID, label: this.rollupLabel(), kind: 'summary' as const }];
  });

  /** The state in a cell — declared, rolled up, or the default. */
  protected stateAt(rowId: string, colId: string): StrctMatrixState {
    // Where the two roll-ups meet: the worst judgement anywhere in the grid.
    if (rowId === ROLLUP_ID && colId === ROLLUP_ID) {
      const all: StrctMatrixState[] = [];
      for (const r of this.rows()) for (const c of this.cols()) all.push(this.declared(r.id, c.id));
      return this.worst(all);
    }
    if (rowId === ROLLUP_ID) return this.worst(this.rows().map((r) => this.declared(r.id, colId)));
    if (colId === ROLLUP_ID) return this.worst(this.cols().map((c) => this.declared(rowId, c.id)));
    return this.declared(rowId, colId);
  }

  private declared(rowId: string, colId: string): StrctMatrixState {
    return this.index().get(`${rowId}|${colId}`)?.state ?? this.defaultState();
  }

  /** The worst of a line, by `RANK`. An empty line is off-subject. */
  private worst(states: StrctMatrixState[]): StrctMatrixState {
    let out: StrctMatrixState = 'off-subject';
    for (const s of states) if (RANK[s] > RANK[out]) out = s;
    return out;
  }

  protected glyphFor(state: StrctMatrixState): string | null {
    return GLYPH[state];
  }

  /** What a state is called, with the consumer's wording where it gave one. */
  protected word(state: StrctMatrixState): string {
    return this.stateText()?.[state] ?? WORD[state];
  }

  /**
   * The sentence the cell is drawing. It is the cell's accessible name, and
   * the line that becomes visible when the grid stacks — one source, so the
   * two can never drift apart.
   */
  protected sentence(row: StrctMatrixAxis, col: StrctMatrixAxis): string {
    const state = this.stateAt(row.id, col.id);
    const detail = this.index().get(`${row.id}|${col.id}`)?.detail;
    const rowName = row.id === ROLLUP_ID ? row.label : `${row.id} ${row.label}`;
    const colName = col.id === ROLLUP_ID ? `${col.label} of the row` : col.label;
    const summary = col.kind === 'summary' && col.id !== ROLLUP_ID ? ' (summary)' : '';
    return `${rowName}, ${colName}${summary}: ${this.word(state)}${detail ? ` — ${detail}` : ''}`;
  }

  protected isCursor(r: number, c: number): boolean {
    const at = this.cursor();
    return at.r === r && at.c === c;
  }

  protected isPicked(rowId: string, colId: string): boolean {
    const sel = this.selected();
    return !!sel && sel.row === rowId && sel.col === colId;
  }

  protected activate(r: number, c: number): void {
    if (!this.navigable()) return;
    const row = this.rowsView()[r];
    const col = this.colsView()[c];
    if (!row || !col) return;
    this.cursor.set({ r, c });
    // Picking the picked one clears it, so the grid can always be read whole
    // again without reaching for a control outside it.
    const already = this.isPicked(row.id, col.id);
    this.selected.set(already ? null : { row: row.id, col: col.id });
    this.cellActivate.emit({
      row,
      col,
      state: this.stateAt(row.id, col.id),
      cell: this.index().get(`${row.id}|${col.id}`) ?? null,
    });
  }

  protected onKeydown(event: KeyboardEvent, r: number, c: number): void {
    if (!this.navigable()) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.activate(r, c);
      return;
    }
    const rows = this.rowsView().length;
    const cols = this.colsView().length;
    let next: { r: number; c: number } | null = null;
    switch (event.key) {
      case 'ArrowRight':
        next = { r, c: Math.min(c + 1, cols - 1) };
        break;
      case 'ArrowLeft':
        next = { r, c: Math.max(c - 1, 0) };
        break;
      case 'ArrowDown':
        next = { r: Math.min(r + 1, rows - 1), c };
        break;
      case 'ArrowUp':
        next = { r: Math.max(r - 1, 0), c };
        break;
      case 'Home':
        next = event.ctrlKey ? { r: 0, c: 0 } : { r, c: 0 };
        break;
      case 'End':
        next = event.ctrlKey ? { r: rows - 1, c: cols - 1 } : { r, c: cols - 1 };
        break;
      default:
        return;
    }
    event.preventDefault();
    this.focusCell(next.r, next.c);
  }

  private focusCell(r: number, c: number): void {
    this.cursor.set({ r, c });
    const row = this.rowsView()[r];
    const col = this.colsView()[c];
    if (!row || !col) return;
    // Matched by reading the attribute rather than by building a selector: an
    // id is the consumer's string, and CSS.escape is not everywhere (jsdom).
    const want = `${row.id}/${col.id}`;
    const el = [
      ...this.host.nativeElement.querySelectorAll<HTMLElement>('[data-matrix-cell]'),
    ].find((n) => n.getAttribute('data-matrix-cell') === want);
    el?.focus();
  }

  /** One line for the whole grid, so it is not read cell by cell to be placed. */
  protected readonly ariaLabel = computed(() => {
    const given = this.label();
    const r = this.rows().length;
    const c = this.cols().length;
    const counted = new Map<StrctMatrixState, number>();
    for (const row of this.rows())
      for (const col of this.cols()) {
        const s = this.declared(row.id, col.id);
        counted.set(s, (counted.get(s) ?? 0) + 1);
      }
    const worth: StrctMatrixState[] = ['critical', 'warning', 'unjudged'];
    const notes = worth
      .filter((s) => counted.get(s))
      .map((s) => `${counted.get(s)} ${this.word(s)}`)
      .join(', ');
    const head = given ? `${given}. ` : '';
    return `${head}${r} checks across ${c} subjects${notes ? `: ${notes}` : ''}`;
  });
}
