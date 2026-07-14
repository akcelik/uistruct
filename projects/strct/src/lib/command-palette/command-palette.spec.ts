import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { StrctCommandItem, StrctCommandPalette } from './command-palette';

const ITEMS: StrctCommandItem[] = [
  { id: 'deploy', label: 'Deploy cluster', group: 'Actions', icon: 'cluster', hint: '⌘D' },
  { id: 'hosts', label: 'Go to hosts', group: 'Navigate', icon: 'host' },
  { id: 'dark', label: 'Toggle dark mode', group: 'Theme', keywords: ['appearance'] },
];

@Component({
  imports: [StrctCommandPalette],
  template: `<strct-command-palette [items]="items" [(open)]="open" (picked)="last = $event" />`,
})
class HostComponent {
  items = ITEMS;
  open = false;
  last: StrctCommandItem | null = null;
}

function setup(open = true) {
  const fixture = TestBed.createComponent(HostComponent);
  fixture.componentInstance.open = open;
  fixture.detectChanges();
  return { fixture, host: fixture.componentInstance, el: fixture.nativeElement as HTMLElement };
}

describe('StrctCommandPalette', () => {
  it('renders nothing while closed and a combobox dialog when open', () => {
    const closed = setup(false);
    expect(closed.el.querySelector('.strct-cmdp')).toBeNull();
    const { el } = setup(true);
    expect(el.querySelector('[role="dialog"]')).toBeTruthy();
    const input = el.querySelector('input')!;
    expect(input.getAttribute('role')).toBe('combobox');
    expect(el.querySelectorAll('[role="option"]').length).toBe(3);
  });

  it('toggles with the global Ctrl/Cmd-K hotkey', () => {
    const { fixture, host } = setup(false);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));
    fixture.detectChanges();
    expect(host.open).toBe(true);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));
    fixture.detectChanges();
    expect(host.open).toBe(false);
  });

  it('filters and ranks by query (prefix first), searching keywords too', () => {
    const { fixture, el } = setup(true);
    const input = el.querySelector('input')!;
    input.value = 'de';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    const labels = [...el.querySelectorAll('.strct-cmdp__label')].map((n) => n.textContent?.trim());
    expect(labels[0]).toBe('Deploy cluster'); // prefix beats substring ('mode')
    input.value = 'appearance';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(el.querySelectorAll('[role="option"]').length).toBe(1);
  });

  it('moves the active option with arrows and reflects aria-activedescendant', () => {
    const { fixture, el } = setup(true);
    const dialog = el.querySelector('.strct-cmdp')!;
    dialog.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    fixture.detectChanges();
    const input = el.querySelector('input')!;
    const active = el.querySelector('[role="option"][aria-selected="true"]')!;
    expect(active.textContent).toContain('Go to hosts');
    expect(input.getAttribute('aria-activedescendant')).toBe(active.id);
  });

  it('picks with Enter, emits the item and closes', () => {
    const { fixture, host, el } = setup(true);
    const dialog = el.querySelector('.strct-cmdp')!;
    dialog.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    fixture.detectChanges();
    expect(host.last?.id).toBe('deploy');
    expect(host.open).toBe(false);
  });

  it('closes on Escape without picking', () => {
    const { fixture, host } = setup(true);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();
    expect(host.open).toBe(false);
    expect(host.last).toBeNull();
  });
});
