import { TestBed } from '@angular/core/testing';
import {
  StrctMatrixAxis,
  StrctMatrixCell,
  StrctMatrixCellEvent,
  StrctStatusMatrix,
} from './status-matrix';

const ROWS: StrctMatrixAxis[] = [
  { id: 'H4', label: 'Link stability' },
  { id: 'H9', label: 'Priority flow control' },
  { id: 'H16', label: 'Cluster network roles' },
];
const COLS: StrctMatrixAxis[] = [
  { id: 'n1', label: 'HV-PRD-01' },
  { id: 'n2', label: 'HV-PRD-02' },
  { id: 'cl', label: 'Cluster', hint: 'cross-node rows', kind: 'summary' },
];
const CELLS: StrctMatrixCell[] = [
  { row: 'H4', col: 'n1', state: 'success' },
  { row: 'H4', col: 'n2', state: 'warning', detail: '6 flaps in 1 h' },
  { row: 'H9', col: 'n1', state: 'success' },
  { row: 'H9', col: 'n2', state: 'critical', detail: 'PFC 3 ≠ 4' },
  { row: 'H9', col: 'cl', state: 'unjudged' },
  { row: 'H16', col: 'cl', state: 'success' },
];

function build(patch: Record<string, unknown> = {}) {
  const fixture = TestBed.createComponent(StrctStatusMatrix);
  fixture.componentRef.setInput('rows', ROWS);
  fixture.componentRef.setInput('cols', COLS);
  fixture.componentRef.setInput('cells', CELLS);
  for (const [k, v] of Object.entries(patch)) fixture.componentRef.setInput(k, v);
  fixture.detectChanges();
  const el = fixture.nativeElement as HTMLElement;
  document.body.appendChild(el);
  const cell = (row: string, col: string) =>
    el.querySelector<HTMLElement>(`[data-matrix-cell="${row}/${col}"]`)!;
  const says = (row: string, col: string) =>
    cell(row, col).querySelector('.strct-status-matrix__sr')!.textContent!.trim();
  const state = (row: string, col: string) =>
    (cell(row, col)
      .querySelector('.strct-status-matrix__mark')!
      .getAttribute('class')!
      .match(/__mark--([a-z-]+)/) ?? [])[1];
  const key = (row: string, col: string, k: string, opts: KeyboardEventInit = {}) => {
    cell(row, col).dispatchEvent(
      new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true, ...opts }),
    );
    fixture.detectChanges();
  };
  return { fixture, el, cell, says, state, key };
}

describe('StrctStatusMatrix', () => {
  it('draws a real grid: column and row heads, one gridcell per pair', () => {
    const { el } = build();
    const grid = el.querySelector('table')!;
    expect(grid.getAttribute('role')).toBe('grid');
    expect(grid.querySelectorAll('thead th').length).toBe(COLS.length + 1);
    expect(grid.querySelectorAll('tbody tr').length).toBe(ROWS.length);
    expect(el.querySelectorAll('[data-matrix-cell]').length).toBe(ROWS.length * COLS.length);
    expect(
      [...grid.querySelectorAll('tbody th')].every((th) => th.getAttribute('scope') === 'row'),
    ).toBe(true);
  });

  // The two absences are the whole reason this is not a heatmap, so an
  // undeclared pair must not quietly become the other one.
  it('an undeclared pair is off-subject, and says so', () => {
    const { state, says } = build();
    expect(state('H4', 'cl')).toBe('off-subject');
    expect(says('H4', 'cl')).toContain('not on this subject');
    expect(state('H9', 'cl')).toBe('unjudged');
    expect(says('H9', 'cl')).toContain('not judged');
  });

  it('defaultState moves the undeclared pairs without touching the declared ones', () => {
    const { state } = build({ defaultState: 'unjudged' });
    expect(state('H4', 'cl')).toBe('unjudged');
    expect(state('H4', 'n1')).toBe('success');
  });

  // The sentence is the cell's accessible name and the line the narrow layout
  // shows, so it is asserted whole rather than in pieces.
  it('every cell says its row, its subject, its state and its reading', () => {
    const { says } = build();
    expect(says('H9', 'n2')).toBe('H9 Priority flow control, HV-PRD-02: critical — PFC 3 ≠ 4');
    // A summary column says which kind of subject it is.
    expect(says('H16', 'cl')).toBe('H16 Cluster network roles, Cluster (summary): passed');
  });

  it('stateText renames a state in the sentence and in the key together', () => {
    const { says, el } = build({
      legend: true,
      stateText: { 'off-subject': 'not applicable', unjudged: 'nothing heard' },
    });
    expect(says('H4', 'cl')).toContain('not applicable');
    const key = [...el.querySelectorAll('.strct-status-matrix__key')].map((k) =>
      k.textContent!.trim(),
    );
    expect(key).toContain('nothing heard');
    expect(key).toContain('not applicable');
  });

  it('the key names every state in the data, worst first, and nothing else', () => {
    const { el } = build({ legend: true });
    const key = [...el.querySelectorAll('.strct-status-matrix__key')].map((k) =>
      k.textContent!.trim(),
    );
    expect(key).toEqual(['critical', 'warning', 'not judged', 'passed', 'not on this subject']);
    // 'note' is in the vocabulary but not in this data, so it is not in the key.
    expect(key).not.toContain('note');
  });

  // Severity, with the one placement the component argues for: a line with an
  // unread check in it cannot be reported as clean.
  it('a roll-up is the worst state in its own line, and an unread check beats a pass', () => {
    const { state } = build({ rollup: 'both' });
    expect(state('H4', '__strct_rollup__')).toBe('warning');
    expect(state('H9', '__strct_rollup__')).toBe('critical');
    // H16: off-subject, off-subject, passed.
    expect(state('H16', '__strct_rollup__')).toBe('success');
    expect(state('__strct_rollup__', 'n2')).toBe('critical');
    // The Cluster column holds one unjudged and one passed.
    expect(state('__strct_rollup__', 'cl')).toBe('unjudged');
    // Where the two roll-ups meet: the worst judgement anywhere.
    expect(state('__strct_rollup__', '__strct_rollup__')).toBe('critical');
  });

  it('a line with nothing on it rolls up to off-subject, not to a judgement nobody made', () => {
    const { state } = build({
      rollup: 'col',
      cells: [{ row: 'H4', col: 'n1', state: 'success' } as StrctMatrixCell],
    });
    expect(state('H16', '__strct_rollup__')).toBe('off-subject');
  });

  it('is one tab stop, and holds no tab stop at all without navigable', () => {
    const nav = build({ navigable: true });
    const stops = [...nav.el.querySelectorAll('[data-matrix-cell]')].filter(
      (c) => c.getAttribute('tabindex') === '0',
    );
    expect(stops.length).toBe(1);

    const ro = build();
    expect(
      [...ro.el.querySelectorAll('[data-matrix-cell]')].some((c) => c.hasAttribute('tabindex')),
    ).toBe(false);
  });

  it('the arrow keys move a cell on both axes and stop at the edges', () => {
    const { cell, key } = build({ navigable: true });
    cell('H4', 'n1').focus();
    key('H4', 'n1', 'ArrowDown');
    expect(document.activeElement).toBe(cell('H9', 'n1'));
    key('H9', 'n1', 'ArrowRight');
    expect(document.activeElement).toBe(cell('H9', 'n2'));
    key('H9', 'n2', 'End');
    expect(document.activeElement).toBe(cell('H9', 'cl'));
    // The edges hold rather than wrapping: a grid has corners.
    key('H9', 'cl', 'ArrowRight');
    expect(document.activeElement).toBe(cell('H9', 'cl'));
    key('H9', 'cl', 'End', { ctrlKey: true });
    expect(document.activeElement).toBe(cell('H16', 'cl'));
    key('H16', 'cl', 'Home', { ctrlKey: true });
    expect(document.activeElement).toBe(cell('H4', 'n1'));
  });

  it('Enter picks a cell and reports it; picking it again lets the grid back', () => {
    const { fixture, cell, key } = build({ navigable: true });
    const seen: StrctMatrixCellEvent[] = [];
    fixture.componentInstance.cellActivate.subscribe((e: StrctMatrixCellEvent) => seen.push(e));

    key('H9', 'n2', 'Enter');
    expect(fixture.componentInstance.selected()).toEqual({ row: 'H9', col: 'n2' });
    expect(cell('H9', 'n2').classList).toContain('strct-status-matrix__cell--picked');
    expect(seen.length).toBe(1);
    expect(seen[0].row.id).toBe('H9');
    expect(seen[0].col.label).toBe('HV-PRD-02');
    expect(seen[0].state).toBe('critical');
    expect(seen[0].cell?.detail).toBe('PFC 3 ≠ 4');

    key('H9', 'n2', 'Enter');
    expect(fixture.componentInstance.selected()).toBeNull();
  });

  it('a cell the matrix filled in itself reports no declared cell', () => {
    const { fixture, key } = build({ navigable: true });
    const seen: StrctMatrixCellEvent[] = [];
    fixture.componentInstance.cellActivate.subscribe((e: StrctMatrixCellEvent) => seen.push(e));
    key('H4', 'cl', 'Enter');
    expect(seen[0].cell).toBeNull();
    expect(seen[0].state).toBe('off-subject');
  });

  it('a read-only grid picks nothing', () => {
    const { fixture, cell } = build();
    cell('H9', 'n2').click();
    fixture.detectChanges();
    expect(fixture.componentInstance.selected()).toBeNull();
  });

  it('says what it is in one line, counting what is worth counting', () => {
    const { el } = build();
    const said = el.querySelector('table')!.getAttribute('aria-label') ?? '';
    expect(said).toContain('3 checks across 3 subjects');
    expect(said).toContain('1 critical');
    expect(said).toContain('1 warning');
    expect(said).toContain('1 not judged');
  });

  it('draws nothing but its empty text when there is nothing to draw', () => {
    const { el } = build({ rows: [], emptyText: 'No checks ran.' });
    expect(el.querySelector('table')).toBeNull();
    expect(el.querySelector('.strct-status-matrix__empty')!.textContent!.trim()).toBe(
      'No checks ran.',
    );
  });
});

// BUG-74-01 and FR-75-01 (HyperStruct, against 7.9.1): a matrix's rows are
// whatever the consumer judges, and their ids are not always a catalogue's
// two characters — nor always meant to be read at all. The geometry (the gap
// between a code and its label) is measured in scripts/status-matrix.mjs;
// what is printed, and what is said, is settled here.
describe('StrctStatusMatrix — a row that is not a catalogue entry', () => {
  const NAMED: StrctMatrixAxis[] = [
    { id: 'v711', code: 'VLAN 711', label: 'DC2.mVS.Prd.Int.Gen.1' },
    { id: 'h:1', label: 'HV-PRD-01' },
    { id: 'x9', code: '', label: 'Quietly keyed' },
  ];
  const COL: StrctMatrixAxis[] = [{ id: 'a', label: 'tor-a' }];

  function grid(patch: Record<string, unknown> = {}) {
    const fixture = TestBed.createComponent(StrctStatusMatrix);
    fixture.componentRef.setInput('rows', NAMED);
    fixture.componentRef.setInput('cols', COL);
    fixture.componentRef.setInput('cells', [
      { row: 'v711', col: 'a', state: 'success' } as StrctMatrixCell,
    ]);
    for (const [k, v] of Object.entries(patch)) fixture.componentRef.setInput(k, v);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    return {
      el,
      printed: () =>
        [...el.querySelectorAll('.strct-status-matrix__rowid')].map((n) => n.textContent!.trim()),
      says: (row: string) =>
        el
          .querySelector(`[data-matrix-cell="${row}/a"] .strct-status-matrix__sr`)!
          .textContent!.trim(),
    };
  }

  it("prints a row's code where it has one, and falls back to the id where it does not", () => {
    const g = grid();
    expect(g.printed()).toEqual(['VLAN 711', 'h:1']);
  });

  it('a row with an empty code prints nothing, whatever the matrix says', () => {
    const g = grid();
    // 'x9' set code: '' — it is keyed but not coded.
    expect(g.printed()).not.toContain('x9');
    expect(g.says('x9')).toBe('Quietly keyed, tor-a: not on this subject');
  });

  it('rowIds="false" prints nothing at all, and no cell reads a key out loud', () => {
    const g = grid({ rowIds: false });
    expect(g.printed()).toEqual([]);
    expect(g.says('h:1')).toBe('HV-PRD-01, tor-a: not on this subject');
    expect(g.says('v711')).toBe('DC2.mVS.Prd.Int.Gen.1, tor-a: passed');
  });

  // What it shows is what it says: a key nobody prints is a key nobody should
  // have read out either.
  it('the spoken sentence carries the code that is printed, not the key behind it', () => {
    const g = grid();
    expect(g.says('v711')).toBe('VLAN 711 DC2.mVS.Prd.Int.Gen.1, tor-a: passed');
    expect(g.says('h:1')).toBe('h:1 HV-PRD-01, tor-a: not on this subject');
  });

  it('the roll-up line is still named by its label, never by its key', () => {
    const g = grid({ rollup: 'row' });
    expect(g.printed()).toEqual(['VLAN 711', 'h:1']);
    expect(g.says('__strct_rollup__')).toBe('Worst, tor-a: passed');
  });
});
