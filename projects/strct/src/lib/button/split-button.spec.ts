import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { StrctMenuItem } from '../context-menu/menu';
import { StrctSplitButton } from './split-button';

@Component({
  imports: [StrctSplitButton],
  template: `<strct-split-button
    label="Deploy"
    [items]="items"
    (action)="actions = actions + 1"
    (picked)="last = $event"
  />`,
})
class HostComponent {
  items: StrctMenuItem[] = [
    { label: 'Deploy with snapshot' },
    { divider: true },
    { label: 'Force deploy', critical: true },
  ];
  actions = 0;
  last: StrctMenuItem | null = null;
}

function setup() {
  const fixture = TestBed.createComponent(HostComponent);
  fixture.detectChanges();
  return { fixture, host: fixture.componentInstance, el: fixture.nativeElement as HTMLElement };
}

describe('StrctSplitButton', () => {
  it('main segment fires (action) without opening the menu', () => {
    const { fixture, host, el } = setup();
    el.querySelector<HTMLButtonElement>('.strct-sbt__main')!.click();
    fixture.detectChanges();
    expect(host.actions).toBe(1);
    expect(el.querySelector('[role="menu"]')).toBeNull();
  });

  it('chevron opens the variants; picking one emits and closes', () => {
    const { fixture, host, el } = setup();
    const chev = el.querySelector<HTMLButtonElement>('.strct-sbt__chev')!;
    expect(chev.getAttribute('aria-haspopup')).toBe('menu');
    chev.click();
    fixture.detectChanges();
    const menu = el.querySelector('[role="menu"]')!;
    expect(menu.querySelectorAll('strct-dropdown-item').length).toBe(2);
    expect(menu.querySelector('strct-dropdown-divider')).toBeTruthy();
    menu.querySelectorAll<HTMLElement>('strct-dropdown-item')[1].click();
    fixture.detectChanges();
    expect(host.last?.label).toBe('Force deploy');
    expect(host.actions).toBe(0);
    expect(el.querySelector('[role="menu"]')).toBeNull();
  });
});
