import { TestBed } from '@angular/core/testing';
import { StrctDiff, strctComputeDiff } from './diff';

const BEFORE = ['a: 1', 'b: 2', 'c: 3', 'd: 4', 'e: 5'].join('\n');
const AFTER = ['a: 1', 'b: 2', 'c: 30', 'd: 4', 'e: 5', 'f: 6'].join('\n');

function make(inputs: Record<string, unknown>) {
  const fixture = TestBed.createComponent(StrctDiff);
  for (const [k, v] of Object.entries(inputs)) fixture.componentRef.setInput(k, v);
  fixture.detectChanges();
  return { fixture, el: fixture.nativeElement as HTMLElement };
}

describe('strctComputeDiff', () => {
  it('marks changed lines as del+add and keeps context with line numbers', () => {
    const rows = strctComputeDiff(BEFORE, AFTER);
    const types = rows.map((r) => r.type);
    expect(types).toEqual(['ctx', 'ctx', 'del', 'add', 'ctx', 'ctx', 'add']);
    const del = rows.find((r) => r.type === 'del')!;
    expect(del.text).toBe('c: 3');
    expect(del.oldNo).toBe(3);
    expect(del.newNo).toBeNull();
    const adds = rows.filter((r) => r.type === 'add');
    expect(adds.map((r) => r.text)).toEqual(['c: 30', 'f: 6']);
  });

  it('returns pure context for identical inputs', () => {
    const rows = strctComputeDiff('x\ny', 'x\ny');
    expect(rows.every((r) => r.type === 'ctx')).toBe(true);
  });
});

describe('StrctDiff', () => {
  it('renders +/− signed rows (not color-only) with add/del counts', () => {
    const { el } = make({ before: BEFORE, after: AFTER });
    expect(el.querySelector('.strct-diff__stat--add')?.textContent).toContain('+2');
    expect(el.querySelector('.strct-diff__stat--del')?.textContent).toContain('−1');
    const addRow = el.querySelector('.strct-diff__row--add')!;
    expect(addRow.querySelector('.strct-diff__sign')?.textContent?.trim()).toBe('+');
    const delRow = el.querySelector('.strct-diff__row--del')!;
    expect(delRow.querySelector('.strct-diff__sign')?.textContent?.trim()).toBe('−');
  });

  it('collapses long unchanged runs and expands them on click', () => {
    const before = Array.from({ length: 40 }, (_, i) => `line ${i}`).join('\n');
    const after = before.replace('line 0', 'line zero');
    const { fixture, el } = make({ before, after, context: 2 });
    const skip = el.querySelector<HTMLButtonElement>('.strct-diff__skip')!;
    expect(skip.textContent).toContain('37 unchanged lines');
    const rowsBefore = el.querySelectorAll('.strct-diff__row').length;
    skip.click();
    fixture.detectChanges();
    expect(el.querySelector('.strct-diff__skip')).toBeNull();
    expect(el.querySelectorAll('.strct-diff__row').length).toBeGreaterThan(rowsBefore);
  });

  it('split mode pairs a del-run with its add-run side by side', () => {
    const { el } = make({ before: 'a\nb\nc', after: 'a\nB\nc', mode: 'split' });
    const row = [...el.querySelectorAll('.strct-diff__table--split tr')].find((tr) =>
      tr.textContent?.includes('B'),
    )!;
    const cells = row.querySelectorAll('.strct-diff__text');
    expect(cells[0].textContent).toBe('b');
    expect(cells[1].textContent).toBe('B');
    expect(cells[0].classList).toContain('strct-diff__cell--del');
    expect(cells[1].classList).toContain('strct-diff__cell--add');
  });
});
