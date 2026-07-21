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

  it('hides clear-all with a single filter and the count when null', () => {
    const { el } = make({ filters: [CHIPS[0]] });
    expect(el.querySelector('.strct-fb__clear')).toBeNull();
    expect(el.querySelector('.strct-fb__count')).toBeNull();
  });
});
