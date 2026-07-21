import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { StrctTransfer, StrctTransferItem } from './transfer';

const ITEMS: StrctTransferItem[] = [
  { id: 'hv-01', label: 'hv-01' },
  { id: 'hv-02', label: 'hv-02' },
  { id: 'hv-03', label: 'hv-03' },
];

@Component({
  imports: [StrctTransfer],
  template: `<strct-transfer
    [items]="items"
    [(assigned)]="assigned"
    (moved)="moves.push($event)"
  />`,
})
class HostComponent {
  items = ITEMS;
  assigned = signal<string[]>(['hv-03']);
  moves: { direction: string; ids: string[] }[] = [];
}

function setup() {
  const fixture = TestBed.createComponent(HostComponent);
  fixture.detectChanges();
  const el = fixture.nativeElement as HTMLElement;
  const lists = () => el.querySelectorAll('.strct-tf__list');
  const labels = (list: Element) =>
    [...list.querySelectorAll('.strct-tf__label')].map((n) => n.textContent!.trim());
  return { fixture, host: fixture.componentInstance, el, lists, labels };
}

describe('StrctTransfer', () => {
  it('splits items into available and assigned by the two-way id set', () => {
    const { lists, labels } = setup();
    expect(labels(lists()[0])).toEqual(['hv-01', 'hv-02']);
    expect(labels(lists()[1])).toEqual(['hv-03']);
  });

  it('checking and assigning moves items right and emits moved', () => {
    const { fixture, host, el, lists, labels } = setup();
    const firstCheckbox = lists()[0].querySelector<HTMLElement>('strct-checkbox input')!;
    firstCheckbox.click();
    fixture.detectChanges();
    const assignBtn = el.querySelectorAll<HTMLButtonElement>('.strct-tf__mid button')[0];
    expect(assignBtn.disabled).toBe(false);
    assignBtn.click();
    fixture.detectChanges();
    expect(host.assigned()).toEqual(['hv-03', 'hv-01']);
    expect(labels(lists()[1])).toEqual(['hv-01', 'hv-03']);
    expect(host.moves).toEqual([{ direction: 'assign', ids: ['hv-01'] }]);
  });

  it('unassign moves items back left', () => {
    const { fixture, host, lists, el } = setup();
    lists()[1].querySelector<HTMLElement>('strct-checkbox input')!.click();
    fixture.detectChanges();
    el.querySelectorAll<HTMLButtonElement>('.strct-tf__mid button')[1].click();
    fixture.detectChanges();
    expect(host.assigned()).toEqual([]);
  });

  it('per-side search narrows only that list', () => {
    const { fixture, el, lists, labels } = setup();
    const input = el.querySelector<HTMLInputElement>('.strct-tf__search input')!;
    input.value = 'hv-02';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(labels(lists()[0])).toEqual(['hv-02']);
    expect(labels(lists()[1])).toEqual(['hv-03']); // right side untouched
  });
});
