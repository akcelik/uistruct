import { TestBed } from '@angular/core/testing';
import { StrctMenuLink, StrctMenuSection, StrctSectionMenu } from './section-menu';

const sections: StrctMenuSection[] = [
  {
    label: 'Compute',
    icon: 'cpu',
    items: [
      { id: 'hosts', label: 'Hosts', icon: 'host' },
      { id: 'vms', label: 'VMs', icon: 'vm' },
    ],
  },
  { label: 'Storage', expanded: false, items: [{ id: 'vol', label: 'Volumes' }] },
];

function make(extra: Record<string, unknown> = {}) {
  const f = TestBed.createComponent(StrctSectionMenu);
  f.componentRef.setInput('sections', sections);
  for (const [k, v] of Object.entries(extra)) f.componentRef.setInput(k, v);
  f.detectChanges();
  return f;
}

describe('StrctSectionMenu', () => {
  it('renders categories and only the items of expanded sections', () => {
    const host = make().nativeElement as HTMLElement;
    expect(host.querySelectorAll('.strct-sm__cat').length).toBe(2);
    expect(host.querySelectorAll('.strct-sm__item').length).toBe(2); // Storage collapsed
  });

  it('marks the active item', () => {
    const host = make({ activeId: 'vms' }).nativeElement as HTMLElement;
    const active = host.querySelectorAll('.strct-sm__item--active');
    expect(active.length).toBe(1);
    expect(active[0].textContent).toContain('VMs');
  });

  it('toggling a category reveals its items', () => {
    const f = make();
    const host = f.nativeElement as HTMLElement;
    host.querySelectorAll<HTMLButtonElement>('.strct-sm__cat')[1].click();
    f.detectChanges();
    expect(host.querySelectorAll('.strct-sm__item').length).toBe(3);
  });

  it('renders static labels and all items when collapsible is false', () => {
    const host = make({ collapsible: false }).nativeElement as HTMLElement;
    expect(host.querySelectorAll('.strct-sm__cat').length).toBe(0);
    expect(host.querySelectorAll('.strct-sm__cat-static').length).toBe(2);
    expect(host.querySelectorAll('.strct-sm__item').length).toBe(3);
  });

  it('hides icons when showIcons is false', () => {
    const host = make({ showIcons: false }).nativeElement as HTMLElement;
    expect(host.querySelector('.strct-sm__item-icon')).toBeNull();
  });

  it('selecting an item emits select and sets activeId', () => {
    const f = make();
    let picked: StrctMenuLink | undefined;
    f.componentInstance.select.subscribe((i: StrctMenuLink) => (picked = i));
    (f.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('.strct-sm__item')!.click();
    f.detectChanges();
    expect(picked?.id).toBe('hosts');
    expect(f.componentInstance.activeId()).toBe('hosts');
  });
});
