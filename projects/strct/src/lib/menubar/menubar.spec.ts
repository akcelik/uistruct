import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { StrctMenuItem } from '../context-menu/menu';
import { StrctMenubar, StrctMenubarItem } from './menubar';

@Component({
  imports: [StrctMenubar],
  template: `<strct-menubar [menus]="menus" (picked)="last = $event" />`,
})
class HostComponent {
  menus: StrctMenubarItem[] = [
    { id: 'vm', label: 'VM', items: [{ label: 'Power on' }, { label: 'Delete', critical: true }] },
    { id: 'host', label: 'Host', items: [{ label: 'Enter maintenance' }] },
  ];
  last: { menu: StrctMenubarItem; item: StrctMenuItem } | null = null;
}

function setup() {
  const fixture = TestBed.createComponent(HostComponent);
  fixture.detectChanges();
  return { fixture, host: fixture.componentInstance, el: fixture.nativeElement as HTMLElement };
}

describe('StrctMenubar', () => {
  it('renders a menubar of menuitems; click opens the menu and picking emits', () => {
    const { fixture, host, el } = setup();
    expect(el.querySelector('[role="menubar"]')).toBeTruthy();
    const tops = el.querySelectorAll<HTMLButtonElement>('.strct-mb__top');
    expect(tops.length).toBe(2);
    tops[0].click();
    fixture.detectChanges();
    const menu = el.querySelector('[role="menu"]')!;
    expect(menu.getAttribute('aria-label')).toBe('VM');
    menu.querySelectorAll<HTMLButtonElement>('.strct-mb__item')[0].click();
    fixture.detectChanges();
    expect(host.last?.item.label).toBe('Power on');
    expect(el.querySelector('[role="menu"]')).toBeNull(); // closed after pick
  });

  it('ArrowRight while open switches the open menu (APG menubar)', () => {
    const { fixture, el } = setup();
    const tops = el.querySelectorAll<HTMLButtonElement>('.strct-mb__top');
    tops[0].click();
    fixture.detectChanges();
    tops[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    fixture.detectChanges();
    expect(el.querySelector('[role="menu"]')?.getAttribute('aria-label')).toBe('Host');
  });

  it('Escape and outside click close', () => {
    const { fixture, el } = setup();
    el.querySelector<HTMLButtonElement>('.strct-mb__top')!.click();
    fixture.detectChanges();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();
    expect(el.querySelector('[role="menu"]')).toBeNull();
  });
});
