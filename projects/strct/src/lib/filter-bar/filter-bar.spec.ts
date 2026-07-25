import { TestBed } from '@angular/core/testing';
import { StrctFilterBar, StrctFilterChip } from './filter-bar';

const CHIPS: StrctFilterChip[] = [
  { id: 'state', label: 'state: running' },
  { id: 'zone', label: 'zone: eu-1' },
];

describe('StrctFilterBar', () => {
  function make(inputs: Record<string, unknown> = {}) {
    const fixture = TestBed.createComponent(StrctFilterBar);
    for (const [k, v] of Object.entries(inputs)) fixture.componentRef.setInput(k, v);
    fixture.detectChanges();
    return { fixture, el: fixture.nativeElement as HTMLElement, cmp: fixture.componentInstance };
  }

  it('renders search, chips, clear-all and the live result count', () => {
    const { el } = make({ filters: CHIPS, count: 12 });
    expect(el.querySelector('strct-searchbox')).toBeTruthy();
    const chips = [...el.querySelectorAll('.strct-fb__chip-label')].map((c) => c.textContent);
    expect(chips).toEqual(['state: running', 'zone: eu-1']);
    expect(el.querySelector('.strct-fb__clear')).toBeTruthy();
    expect(el.querySelector('.strct-fb__count')?.textContent?.trim()).toBe('12 results');
  });

  it('chip × emits (removed); clear-all emits (cleared); search forwards', () => {
    const { el, cmp } = make({ filters: CHIPS, count: 3 });
    const removed: string[] = [];
    let cleared = 0;
    const searched: string[] = [];
    cmp.removed.subscribe((c) => removed.push(c.id));
    cmp.cleared.subscribe(() => cleared++);
    cmp.search.subscribe((q) => searched.push(q));
    el.querySelectorAll<HTMLButtonElement>('.strct-fb__chip-x')[1].click();
    expect(removed).toEqual(['zone']);
    el.querySelector<HTMLButtonElement>('.strct-fb__clear')!.click();
    expect(cleared).toBe(1);
    const input = el.querySelector<HTMLInputElement>('.strct-sb__input')!;
    input.value = 'hv';
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(cmp.query()).toBe('hv');
    expect(searched).toEqual(['hv']);
  });

  it('shows clear-all with a single filter; hides it and the count when empty/null', () => {
    const { el } = make({ filters: [CHIPS[0]] });
    expect(el.querySelector('.strct-fb__clear')).toBeTruthy();
    expect(el.querySelector('.strct-fb__count')).toBeNull();
    const empty = make({ filters: [] });
    expect(empty.el.querySelector('.strct-fb__clear')).toBeNull();
  });

  it('moves focus to the next chip × when the focused chip is removed', () => {
    const { fixture, el, cmp } = make({ filters: CHIPS });
    cmp.removed.subscribe((c) =>
      fixture.componentRef.setInput(
        'filters',
        CHIPS.filter((x) => x.id !== c.id),
      ),
    );
    const first = el.querySelectorAll<HTMLButtonElement>('.strct-fb__chip-x')[0];
    first.focus();
    first.click();
    fixture.detectChanges();
    expect(el.querySelectorAll('.strct-fb__chip-x')).toHaveLength(1);
    expect(document.activeElement).toBe(el.querySelector('.strct-fb__chip-x'));
  });

  it('moves focus to the search field when the last chip is removed', () => {
    const { fixture, el, cmp } = make({ filters: [CHIPS[0]] });
    cmp.removed.subscribe(() => fixture.componentRef.setInput('filters', []));
    const x = el.querySelector<HTMLButtonElement>('.strct-fb__chip-x')!;
    x.focus();
    x.click();
    fixture.detectChanges();
    expect(document.activeElement).toBe(el.querySelector('.strct-sb__input'));
  });
});
