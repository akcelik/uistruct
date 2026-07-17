import { provideRouter } from '@angular/router';
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

  it('plain items render as buttons, byte-identical structure to before', () => {
    const f = TestBed.createComponent(StrctRail);
    f.componentRef.setInput('items', items);
    f.detectChanges();
    const rows = (f.nativeElement as HTMLElement).querySelectorAll('.strct-rail__item');
    expect([...rows].every((r) => r.tagName === 'BUTTON')).toBe(true);
    expect((f.nativeElement as HTMLElement).querySelector('.strct-rail__group--bottom')).toBeNull();
  });

  it('pins placement:"bottom" items into the bottom group, in order', () => {
    const f = TestBed.createComponent(StrctRail);
    f.componentRef.setInput('items', [
      { id: 'top1', label: 'Compute', icon: 'host' },
      { id: 'admin', label: 'Administration', icon: 'settings', placement: 'bottom' },
      { id: 'top2', label: 'Network', icon: 'network' },
    ] satisfies StrctRailItem[]);
    f.detectChanges();
    const host = f.nativeElement as HTMLElement;
    const top = host.querySelector('.strct-rail__group--top')!;
    const bottom = host.querySelector('.strct-rail__group--bottom')!;
    expect(top.textContent).toContain('Compute');
    expect(top.textContent).toContain('Network');
    expect(top.textContent).not.toContain('Administration');
    expect(bottom.textContent).toContain('Administration');
  });

  it('routerLink items are real <a> links; plain click emits, ctrl-click does not', async () => {
    // A resolvable route, so the click's navigation settles inside the test
    // (an unmatched route would reject after teardown → NG0205 in CI).
    TestBed.configureTestingModule({
      providers: [provideRouter([{ path: 'compute', children: [] }])],
    });
    const f = TestBed.createComponent(StrctRail);
    f.componentRef.setInput('items', [
      { id: 'compute', label: 'Compute', icon: 'host', routerLink: '/compute' },
    ] satisfies StrctRailItem[]);
    f.detectChanges();
    const a = (f.nativeElement as HTMLElement).querySelector('a.strct-rail__item')!;
    expect(a.getAttribute('href')).toBe('/compute');

    const picked: string[] = [];
    f.componentInstance.select.subscribe((i: StrctRailItem) => picked.push(i.id));
    a.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, ctrlKey: true }));
    f.detectChanges();
    expect(picked).toEqual([]); // browser's click (new tab), not ours
    a.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    f.detectChanges();
    await f.whenStable(); // let the RouterLink navigation finish before teardown
    expect(picked).toEqual(['compute']);
    expect(f.componentInstance.activeId()).toBe('compute');
  });

  it('href items render as plain <a href>', () => {
    const f = TestBed.createComponent(StrctRail);
    f.componentRef.setInput('items', [
      { id: 'docs', label: 'Docs', icon: 'file', href: 'https://example.com' },
    ] satisfies StrctRailItem[]);
    f.detectChanges();
    const a = (f.nativeElement as HTMLElement).querySelector('a.strct-rail__item')!;
    expect(a.getAttribute('href')).toBe('https://example.com');
  });

  it('renders a trailing dot / trailing icon when set (shared nav vocabulary)', () => {
    const f = TestBed.createComponent(StrctRail);
    f.componentRef.setInput('items', [
      { id: 'x', label: 'X', icon: 'vm', dot: true, dotStatus: 'warning', trailingIcon: 'sync' },
    ] satisfies StrctRailItem[]);
    f.detectChanges();
    const host = f.nativeElement as HTMLElement;
    expect(host.querySelector('.strct-rail__dot--warning')).toBeTruthy();
    expect(host.querySelector('.strct-rail__trailing')).toBeTruthy();
  });
});
