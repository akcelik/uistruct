import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  booleanAttribute,
  computed,
  input,
  signal,
} from '@angular/core';
import { StrctCopy } from '../copy/copy';

/** One row of a computed line diff. */
export interface StrctDiffRow {
  type: 'ctx' | 'add' | 'del';
  oldNo: number | null;
  newNo: number | null;
  text: string;
}

interface DisplayRow extends StrctDiffRow {
  kind: 'row';
}

interface SkipRow {
  kind: 'skip';
  count: number;
  startIndex: number;
}

type AnyRow = DisplayRow | SkipRow;

/** Split-view pairing: a left (old) and right (new) cell per visual row. */
interface SplitCell {
  type: 'ctx' | 'add' | 'del' | 'empty';
  no: number | null;
  text: string;
}

interface SplitPair {
  kind: 'row';
  left: SplitCell;
  right: SplitCell;
}

type AnySplitRow = SplitPair | SkipRow;

/**
 * Compute a line diff (LCS-based). Exported for programmatic use — change
 * counts, gating "anything changed?" logic, custom renderings.
 */
export function strctComputeDiff(before: string, after: string): StrctDiffRow[] {
  const a = before.split('\n');
  const b = after.split('\n');
  // Trim common prefix/suffix first — configs mostly match, keeping DP small.
  let start = 0;
  while (start < a.length && start < b.length && a[start] === b[start]) start++;
  let endA = a.length;
  let endB = b.length;
  while (endA > start && endB > start && a[endA - 1] === b[endB - 1]) {
    endA--;
    endB--;
  }
  const midA = a.slice(start, endA);
  const midB = b.slice(start, endB);

  const rows: StrctDiffRow[] = [];
  for (let i = 0; i < start; i++)
    rows.push({ type: 'ctx', oldNo: i + 1, newNo: i + 1, text: a[i] });

  // LCS DP on the changed middle; fall back to replace-all when it is huge.
  if (midA.length * midB.length <= 4_000_000) {
    const n = midA.length;
    const m = midB.length;
    const dp = new Uint32Array((n + 1) * (m + 1));
    for (let i = n - 1; i >= 0; i--) {
      for (let j = m - 1; j >= 0; j--) {
        dp[i * (m + 1) + j] =
          midA[i] === midB[j]
            ? dp[(i + 1) * (m + 1) + j + 1] + 1
            : Math.max(dp[(i + 1) * (m + 1) + j], dp[i * (m + 1) + j + 1]);
      }
    }
    let i = 0;
    let j = 0;
    while (i < n && j < m) {
      if (midA[i] === midB[j]) {
        rows.push({ type: 'ctx', oldNo: start + i + 1, newNo: start + j + 1, text: midA[i] });
        i++;
        j++;
      } else if (dp[(i + 1) * (m + 1) + j] >= dp[i * (m + 1) + j + 1]) {
        rows.push({ type: 'del', oldNo: start + i + 1, newNo: null, text: midA[i] });
        i++;
      } else {
        rows.push({ type: 'add', oldNo: null, newNo: start + j + 1, text: midB[j] });
        j++;
      }
    }
    while (i < n) {
      rows.push({ type: 'del', oldNo: start + i + 1, newNo: null, text: midA[i] });
      i++;
    }
    while (j < m) {
      rows.push({ type: 'add', oldNo: null, newNo: start + j + 1, text: midB[j] });
      j++;
    }
  } else {
    for (let i = 0; i < midA.length; i++)
      rows.push({ type: 'del', oldNo: start + i + 1, newNo: null, text: midA[i] });
    for (let j = 0; j < midB.length; j++)
      rows.push({ type: 'add', oldNo: null, newNo: start + j + 1, text: midB[j] });
  }

  for (let i = endA, j = endB; i < a.length; i++, j++) {
    rows.push({ type: 'ctx', oldNo: i + 1, newNo: j + 1, text: a[i] });
  }
  return rows;
}

/**
 * Config / YAML diff viewer — change-approval screens without a hand-rolled
 * diff. Unified by default, `split` for side-by-side; long unchanged runs
 * collapse to an expandable "· N unchanged lines ·" row.
 *
 *   <strct-diff [before]="saved" [after]="draft" beforeLabel="Running" afterLabel="Draft" />
 *
 * Rows are marked by symbol (+/−) as well as tint, so the diff reads without
 * color — the same CVD rule the icon badges follow.
 */
@Component({
  selector: 'strct-diff',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [StrctCopy],
  template: `
    <div class="strct-diff__head">
      <span class="strct-diff__title">{{ title() }}</span>
      @if (language()) {
        <span class="strct-diff__lang">{{ language() }}</span>
      }
      <span class="strct-diff__stat strct-diff__stat--add">+{{ addCount() }}</span>
      <span class="strct-diff__stat strct-diff__stat--del">−{{ delCount() }}</span>
      <span class="strct-diff__grow"></span>
      @if (copyable()) {
        <strct-copy [text]="after()" [copyLabel]="copyAfterLabel()" />
      }
    </div>
    @if (mode() === 'split') {
      <div class="strct-diff__cols" aria-hidden="true">
        <span>{{ beforeLabel() }}</span>
        <span>{{ afterLabel() }}</span>
      </div>
    }
    <div
      class="strct-diff__scroll"
      tabindex="0"
      role="region"
      [attr.aria-label]="title()"
      [style.max-height.px]="maxHeight()"
    >
      @if (mode() === 'unified') {
        <table class="strct-diff__table">
          <tbody>
            @for (row of unifiedRows(); track $index) {
              @if (row.kind === 'skip') {
                <tr class="strct-diff__skip-row">
                  <td colspan="4">
                    <button type="button" class="strct-diff__skip" (click)="expand(row.startIndex)">
                      · {{ row.count }} {{ unchangedLabel() }} ·
                    </button>
                  </td>
                </tr>
              } @else {
                <tr class="strct-diff__row strct-diff__row--{{ row.type }}">
                  <td class="strct-diff__no">{{ row.oldNo ?? '' }}</td>
                  <td class="strct-diff__no">{{ row.newNo ?? '' }}</td>
                  <td class="strct-diff__sign">{{ sign(row.type) }}</td>
                  <td class="strct-diff__text" [textContent]="row.text"></td>
                </tr>
              }
            }
          </tbody>
        </table>
      } @else {
        <table class="strct-diff__table strct-diff__table--split">
          <tbody>
            @for (row of splitRows(); track $index) {
              @if (row.kind === 'skip') {
                <tr class="strct-diff__skip-row">
                  <td colspan="6">
                    <button type="button" class="strct-diff__skip" (click)="expand(row.startIndex)">
                      · {{ row.count }} {{ unchangedLabel() }} ·
                    </button>
                  </td>
                </tr>
              } @else {
                <tr>
                  <td class="strct-diff__no strct-diff__cell--{{ row.left.type }}">
                    {{ row.left.no ?? '' }}
                  </td>
                  <td class="strct-diff__sign strct-diff__cell--{{ row.left.type }}">
                    {{ sign(row.left.type) }}
                  </td>
                  <td
                    class="strct-diff__text strct-diff__cell--{{ row.left.type }}"
                    [textContent]="row.left.text"
                  ></td>
                  <td class="strct-diff__no strct-diff__cell--{{ row.right.type }}">
                    {{ row.right.no ?? '' }}
                  </td>
                  <td class="strct-diff__sign strct-diff__cell--{{ row.right.type }}">
                    {{ sign(row.right.type) }}
                  </td>
                  <td
                    class="strct-diff__text strct-diff__cell--{{ row.right.type }}"
                    [textContent]="row.right.text"
                  ></td>
                </tr>
              }
            }
          </tbody>
        </table>
      }
    </div>
  `,
  host: { class: 'strct-diff' },
  styles: [
    `
      .strct-diff {
        display: block;
        border: 1px solid var(--b2);
        border-radius: 9px;
        background: var(--bg-2);
        overflow: hidden;
      }
      .strct-diff__head {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 6px 10px;
        border-bottom: 1px solid var(--b1);
      }
      .strct-diff__title {
        font-size: 12.5px;
        font-weight: 600;
        color: var(--t1);
      }
      .strct-diff__lang {
        font-family: var(--mono);
        font-size: 10px;
        letter-spacing: 0.6px;
        text-transform: uppercase;
        color: var(--t3);
        border: 1px solid var(--b2);
        border-radius: 4px;
        padding: 2px 6px;
      }
      .strct-diff__stat {
        font-family: var(--mono);
        font-size: 11px;
        font-weight: 600;
        font-variant-numeric: tabular-nums;
      }
      .strct-diff__stat--add {
        color: var(--success);
      }
      .strct-diff__stat--del {
        color: var(--critical);
      }
      .strct-diff__grow {
        flex: 1;
      }
      .strct-diff__cols {
        display: grid;
        grid-template-columns: 1fr 1fr;
        padding: 4px 10px;
        border-bottom: 1px solid var(--b1);
        font-size: 11px;
        font-weight: 600;
        color: var(--t3);
      }
      .strct-diff__scroll {
        overflow: auto;
      }
      .strct-diff__scroll:focus-visible {
        outline: 2px solid var(--acc50);
        outline-offset: -2px;
      }
      .strct-diff__table {
        width: 100%;
        border-collapse: collapse;
        font-family: var(--mono);
        font-size: 12px;
        line-height: 1.55;
      }
      .strct-diff__no {
        width: 1%;
        min-width: 3.5ch;
        padding: 0 6px;
        text-align: end;
        color: var(--t4);
        user-select: none;
        font-variant-numeric: tabular-nums;
        vertical-align: top;
      }
      .strct-diff__sign {
        width: 1%;
        padding: 0 2px;
        text-align: center;
        user-select: none;
        vertical-align: top;
      }
      .strct-diff__text {
        padding: 0 10px 0 4px;
        white-space: pre-wrap;
        overflow-wrap: anywhere;
        color: var(--t1);
      }
      .strct-diff__row--add,
      .strct-diff__cell--add {
        background: var(--success-bg);
      }
      .strct-diff__row--add .strct-diff__sign,
      .strct-diff__cell--add.strct-diff__sign {
        color: var(--success);
        font-weight: 700;
      }
      .strct-diff__row--del,
      .strct-diff__cell--del {
        background: var(--critical-bg);
      }
      .strct-diff__row--del .strct-diff__sign,
      .strct-diff__cell--del.strct-diff__sign {
        color: var(--critical);
        font-weight: 700;
      }
      .strct-diff__table--split .strct-diff__text {
        width: 50%;
      }
      .strct-diff__skip-row td {
        padding: 0;
      }
      .strct-diff__skip {
        display: block;
        width: 100%;
        padding: 3px 10px;
        border: 0;
        border-block: 1px dashed var(--b2);
        background: var(--bg-3);
        color: var(--t3);
        font-family: var(--mono);
        font-size: 11px;
        cursor: pointer;
      }
      .strct-diff__skip:hover {
        color: var(--t1);
      }
      .strct-diff__skip:focus-visible {
        outline: 2px solid var(--acc50);
        outline-offset: -2px;
      }
    `,
  ],
})
export class StrctDiff {
  /** The two texts to compare. */
  readonly before = input.required<string>();
  readonly after = input.required<string>();
  /** Unified (default) or side-by-side split view. */
  readonly mode = input<'unified' | 'split'>('unified');
  /** Context lines kept around changes before collapsing (0 disables collapsing). */
  readonly context = input(3);
  /** Header bits. */
  readonly title = input('Diff');
  readonly language = input('');
  readonly beforeLabel = input('Before');
  readonly afterLabel = input('After');
  readonly copyable = input(true, { transform: booleanAttribute });
  readonly copyAfterLabel = input('Copy new version');
  readonly unchangedLabel = input('unchanged lines');
  /** Scroll the body past this height (px); null grows freely. */
  readonly maxHeight = input<number | null>(null);

  // Indices of collapsed runs the user has expanded.
  private readonly expanded = signal<ReadonlySet<number>>(new Set());

  protected readonly rows = computed(() => strctComputeDiff(this.before(), this.after()));
  protected readonly addCount = computed(() => this.rows().filter((r) => r.type === 'add').length);
  protected readonly delCount = computed(() => this.rows().filter((r) => r.type === 'del').length);

  protected readonly unifiedRows = computed<AnyRow[]>(() => {
    const out: AnyRow[] = [];
    for (const chunk of this.chunks()) {
      if (chunk.skip) out.push({ kind: 'skip', count: chunk.rows.length, startIndex: chunk.start });
      else for (const r of chunk.rows) out.push({ kind: 'row', ...r });
    }
    return out;
  });

  protected readonly splitRows = computed<AnySplitRow[]>(() => {
    const out: AnySplitRow[] = [];
    for (const chunk of this.chunks()) {
      if (chunk.skip) {
        out.push({ kind: 'skip', count: chunk.rows.length, startIndex: chunk.start });
        continue;
      }
      // Pair del-runs with the add-run that follows them (classic split view).
      let i = 0;
      const rows = chunk.rows;
      while (i < rows.length) {
        const r = rows[i];
        if (r.type === 'ctx') {
          out.push({
            kind: 'row',
            left: { type: 'ctx', no: r.oldNo, text: r.text },
            right: { type: 'ctx', no: r.newNo, text: r.text },
          });
          i++;
          continue;
        }
        const dels: StrctDiffRow[] = [];
        const adds: StrctDiffRow[] = [];
        while (i < rows.length && rows[i].type === 'del') dels.push(rows[i++]);
        while (i < rows.length && rows[i].type === 'add') adds.push(rows[i++]);
        const len = Math.max(dels.length, adds.length);
        for (let k = 0; k < len; k++) {
          const d = dels[k];
          const a = adds[k];
          out.push({
            kind: 'row',
            left: d
              ? { type: 'del', no: d.oldNo, text: d.text }
              : { type: 'empty', no: null, text: '' },
            right: a
              ? { type: 'add', no: a.newNo, text: a.text }
              : { type: 'empty', no: null, text: '' },
          });
        }
      }
    }
    return out;
  });

  /** Group rows into visible chunks and collapsible unchanged runs. */
  private readonly chunks = computed<{ skip: boolean; start: number; rows: StrctDiffRow[] }[]>(
    () => {
      const rows = this.rows();
      const ctx = this.context();
      const expanded = this.expanded();
      if (ctx <= 0) return [{ skip: false, start: 0, rows }];

      // Mark rows within `ctx` of any change as visible.
      const visible = new Array<boolean>(rows.length).fill(false);
      rows.forEach((r, i) => {
        if (r.type !== 'ctx') {
          for (let k = Math.max(0, i - ctx); k <= Math.min(rows.length - 1, i + ctx); k++) {
            visible[k] = true;
          }
        }
      });

      const out: { skip: boolean; start: number; rows: StrctDiffRow[] }[] = [];
      let i = 0;
      while (i < rows.length) {
        const vis = visible[i] || expanded.has(startOfRun(visible, i));
        const start = i;
        while (i < rows.length && (visible[i] || expanded.has(startOfRun(visible, i))) === vis) i++;
        const slice = rows.slice(start, i);
        // Tiny hidden runs are not worth a fold row.
        if (!vis && slice.length <= 2) out.push({ skip: false, start, rows: slice });
        else out.push({ skip: !vis, start, rows: slice });
      }
      return out;
    },
  );

  protected expand(startIndex: number): void {
    const next = new Set(this.expanded());
    next.add(startIndex);
    this.expanded.set(next);
  }

  protected sign(type: string): string {
    return type === 'add' ? '+' : type === 'del' ? '−' : '';
  }
}

function startOfRun(visible: boolean[], i: number): number {
  let s = i;
  while (s > 0 && visible[s - 1] === visible[i]) s--;
  return s;
}
