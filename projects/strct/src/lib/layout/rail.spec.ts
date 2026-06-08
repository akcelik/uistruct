import { TestBed } from '@angular/core/testing';
import { StrctRail, StrctRailItem } from './rail';

const items: StrctRailItem[] = [
  { id: 'a', label: 'Alpha', icon: 'host' },
  { id: 'b', label: 'Beta', icon: 'vm', badge: 3, badgeStatus: 'warning' },
];

describe('StrctRail', () => {
  it('renders one button per item and applies the host class', () => {
    const f = TestBed.createComponent(StrctRail);
    f.componentRef.setInput('items', items);
    f.detectChanges();

    const host = f.nativeElement as HTMLElement;
    expect(host.classList).toContain('strct-rail');
    expect(host.querySelectorAll('.strct-rail__item').length).toBe(2);
  });

  it('marks exactly the active item', () => {
    const f = TestBed.createComponent(StrctRail);
    f.componentRef.setInput('items', items);
    f.componentRef.setInput('activeId', 'b');
    f.detectChanges();

    const host = f.nativeElement as HTMLElement;
    expect(host.querySelectorAll('.strct-rail__item--active').length).toBe(1);
  });

  it('applies the collapsed modifier and hides labels', () => {
    const f = TestBed.createComponent(StrctRail);
    f.componentRef.setInput('items', items);
    f.componentRef.setInput('collapsed', true);
    f.detectChanges();

    const host = f.nativeElement as HTMLElement;
    expect(host.classList).toContain('strct-rail--collapsed');
    expect(host.querySelector('.strct-rail__label')).toBeNull();
  });

  it('selecting an item emits select and updates activeId', () => {
    const f = TestBed.createComponent(StrctRail);
    f.componentRef.setInput('items', items);
    f.detectChanges();

    let picked: StrctRailItem | undefined;
    f.componentInstance.select.subscribe((i: StrctRailItem) => (picked = i));
    (f.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('.strct-rail__item')!.click();
    f.detectChanges();

    expect(picked?.id).toBe('a');
    expect(f.componentInstance.activeId()).toBe('a');
  });
});
