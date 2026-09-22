import { Component, ChangeDetectionStrategy } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { StrctMenuItem } from '../context-menu/menu';
import { StrctMenubar, StrctMenubarItem } from './menubar';

@Component({
  imports: [StrctMenubar],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `<strct-menubar [menus]="menus" (picked)="last = $event" />`,
})
class HostComponent {
  menus: StrctMenubarItem[] = [
    { id: 'vm', label: 'VM', items: [{ label: 'Power on' }, { label: 'Delete', critical: true }] },
    { id: 'host', label: 'Host', items: [{ label: 'Enter maintenance' }] },
  ];
  last: { menu: StrctMenubarItem; item: StrctMenuItem } | null = null;
}

function setup(menus?: StrctMenubarItem[]) {
  const fixture = TestBed.createComponent(HostComponent);
  if (menus) fixture.componentInstance.menus = menus;
  fixture.detectChanges();
  return { fixture, host: fixture.componentInstance, el: fixture.nativeElement as HTMLElement };
}

/** Lets the menubar's deferred (setTimeout) focus land. */
const flushFocus = () => new Promise((r) => setTimeout(r));

const key = (key: string) => new KeyboardEvent('keydown', { key, bubbles: true });

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

  it('ArrowDown opens the menu and moves focus to the first item', async () => {
    const { fixture, el } = setup();
    const top = el.querySelector<HTMLButtonElement>('.strct-mb__top')!;
    top.focus();
    top.dispatchEvent(key('ArrowDown'));
    fixture.detectChanges();
    await flushFocus();
    const first = el.querySelector<HTMLButtonElement>('.strct-mb__menu .strct-mb__item')!;
    expect(first.textContent).toContain('Power on');
    expect(document.activeElement).toBe(first);
  });

  it('roves focus with ArrowUp/Down (wrapping) and Home/End inside the open menu', async () => {
    const { fixture, el } = setup();
    const top = el.querySelector<HTMLButtonElement>('.strct-mb__top')!;
    top.focus();
    top.dispatchEvent(key('ArrowDown'));
    fixture.detectChanges();
    await flushFocus();
    const items = () =>
      Array.from(el.querySelectorAll<HTMLButtonElement>('.strct-mb__menu .strct-mb__item'));
    expect(document.activeElement).toBe(items()[0]);
    items()[0].dispatchEvent(key('ArrowDown'));
    expect(document.activeElement).toBe(items()[1]);
    items()[1].dispatchEvent(key('ArrowDown'));
    expect(document.activeElement).toBe(items()[0]); // wraps around
    items()[0].dispatchEvent(key('ArrowUp'));
    expect(document.activeElement).toBe(items()[1]); // wraps backwards
    items()[1].dispatchEvent(key('Home'));
    expect(document.activeElement).toBe(items()[0]);
    items()[0].dispatchEvent(key('End'));
    expect(document.activeElement).toBe(items()[1]);
  });

  it('ArrowRight inside the open menu switches menus and focus follows', async () => {
    const { fixture, el } = setup();
    const tops = el.querySelectorAll<HTMLButtonElement>('.strct-mb__top');
    tops[0].focus();
    tops[0].dispatchEvent(key('ArrowDown'));
    fixture.detectChanges();
    await flushFocus();
    el.querySelector<HTMLButtonElement>('.strct-mb__menu .strct-mb__item')!.dispatchEvent(
      key('ArrowRight'),
    );
    fixture.detectChanges();
    await flushFocus();
    expect(el.querySelector('[role="menu"]')?.getAttribute('aria-label')).toBe('Host');
    expect(document.activeElement).toBe(tops[1]);
  });

  it('Escape inside the menu closes it, returns focus to the top button, stops propagation', async () => {
    const { fixture, el } = setup();
    const top = el.querySelector<HTMLButtonElement>('.strct-mb__top')!;
    top.focus();
    top.dispatchEvent(key('ArrowDown'));
    fixture.detectChanges();
    await flushFocus();
    const docSpy = vi.fn();
    document.addEventListener('keydown', docSpy);
    el.querySelector<HTMLButtonElement>('.strct-mb__menu .strct-mb__item')!.dispatchEvent(
      key('Escape'),
    );
    fixture.detectChanges();
    document.removeEventListener('keydown', docSpy);
    expect(el.querySelector('[role="menu"]')).toBeNull();
    expect(document.activeElement).toBe(top);
    expect(docSpy).not.toHaveBeenCalled(); // a host modal/drawer must not also close
  });

  it('invokes item.action (with item.data) on pick', () => {
    const action = vi.fn();
    const { fixture, host, el } = setup([
      { id: 'm', label: 'M', items: [{ label: 'Run', action, data: { id: 7 } }] },
    ]);
    el.querySelector<HTMLButtonElement>('.strct-mb__top')!.click();
    fixture.detectChanges();
    el.querySelector<HTMLButtonElement>('.strct-mb__menu .strct-mb__item')!.click();
    fixture.detectChanges();
    expect(action).toHaveBeenCalledWith({ id: 7 });
    expect(host.last?.item.label).toBe('Run');
  });

  it('renders one level of children as a submenu (hover) and picks a child', () => {
    const action = vi.fn();
    const { fixture, host, el } = setup([
      {
        id: 'file',
        label: 'File',
        items: [
          { label: 'New', children: [{ label: 'File', action }, { label: 'Folder' }] },
          { label: 'Open' },
        ],
      },
    ]);
    el.querySelector<HTMLButtonElement>('.strct-mb__top')!.click();
    fixture.detectChanges();
    const parent = el.querySelector<HTMLButtonElement>('.strct-mb__menu .strct-mb__item')!;
    expect(parent.getAttribute('aria-haspopup')).toBe('menu');
    parent.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    fixture.detectChanges();
    expect(parent.getAttribute('aria-expanded')).toBe('true');
    const sub = el.querySelector('.strct-mb__submenu');
    expect(sub).toBeTruthy();
    sub!.querySelectorAll<HTMLButtonElement>('.strct-mb__subitem')[0].click();
    fixture.detectChanges();
    expect(action).toHaveBeenCalled();
    expect(host.last?.item.label).toBe('File');
    expect(el.querySelector('[role="menu"]')).toBeNull(); // closed after pick
  });

  it('ArrowRight enters the submenu (focus moves in), ArrowLeft hands focus back', async () => {
    const { fixture, el } = setup([
      {
        id: 'file',
        label: 'File',
        items: [{ label: 'New', children: [{ label: 'File' }, { label: 'Folder' }] }],
      },
    ]);
    const top = el.querySelector<HTMLButtonElement>('.strct-mb__top')!;
    top.focus();
    top.dispatchEvent(key('ArrowDown'));
    fixture.detectChanges();
    await flushFocus();
    const parent = el.querySelector<HTMLButtonElement>('.strct-mb__menu .strct-mb__item')!;
    expect(document.activeElement).toBe(parent);
    parent.dispatchEvent(key('ArrowRight'));
    fixture.detectChanges();
    await flushFocus();
    const firstChild = el.querySelector<HTMLButtonElement>('.strct-mb__subitem')!;
    expect(document.activeElement).toBe(firstChild);
    firstChild.dispatchEvent(key('ArrowLeft'));
    fixture.detectChanges();
    expect(el.querySelector('.strct-mb__submenu')).toBeNull();
    expect(document.activeElement).toBe(parent);
  });
});

describe('StrctMenubar — item hint (FR-42-01)', () => {
  const MENUS: StrctMenubarItem[] = [
    {
      id: 'vm actions',
      label: 'VM',
      items: [
        { label: 'Power on' },
        { label: 'Drain', disabled: true },
        { label: 'Clone', disabled: true, hint: 'VM must be powered off to clone.' },
        {
          label: 'Power',
          children: [
            { label: 'Reset', disabled: true, hint: 'Guest is suspended.' },
            { label: 'Suspend' },
          ],
        },
      ],
    },
  ];

  it('tooltip + description on items and sub-items; the label stays the name', () => {
    const { fixture, el } = setup(MENUS);
    el.querySelector<HTMLButtonElement>('.strct-mb__top')!.click();
    fixture.detectChanges();
    const btn = (label: string) =>
      [...el.querySelectorAll<HTMLButtonElement>('.strct-mb__item')].find(
        (b) => b.textContent!.trim() === label,
      )!;
    const desc = (b: HTMLElement) =>
      el.querySelector(`[id="${b.getAttribute('aria-describedby')}"]`)?.textContent;
    const clone = btn('Clone');
    expect(clone.getAttribute('title')).toBe('VM must be powered off to clone.');
    expect(desc(clone)).toBe('VM must be powered off to clone.');
    expect(clone.getAttribute('aria-disabled')).toBe('true');
    expect(clone.disabled).toBe(false);
    // The menu id has a space; the generated id must not, or aria-describedby
    // (a whitespace-separated id list) would point at two ids that don't exist.
    expect(clone.getAttribute('aria-describedby')).not.toMatch(/\s/);
    expect(btn('Power on').hasAttribute('title')).toBe(false);
    expect(btn('Power on').hasAttribute('aria-describedby')).toBe(false);

    btn('Power').click();
    fixture.detectChanges();
    const reset = btn('Reset');
    expect(reset.getAttribute('title')).toBe('Guest is suspended.');
    expect(desc(reset)).toBe('Guest is suspended.');
  });

  it('arrows reach a hinted disabled item, skip an unhinted one; activating it does nothing', async () => {
    const { fixture, host, el } = setup(MENUS);
    const top = el.querySelector<HTMLButtonElement>('.strct-mb__top')!;
    top.focus();
    top.dispatchEvent(key('ArrowDown'));
    fixture.detectChanges();
    await flushFocus();
    const items = () => [
      ...el.querySelectorAll<HTMLButtonElement>('.strct-mb__item:not(.strct-mb__subitem)'),
    ];
    const menu = el.querySelector<HTMLElement>('[role="menu"]')!;
    const at = () => (document.activeElement as HTMLElement).textContent!.trim();
    const first = at();
    menu.dispatchEvent(key('ArrowDown'));
    fixture.detectChanges();
    expect([first, at()]).toEqual(['Power on', 'Clone']); // Drain skipped
    items()[2].click();
    fixture.detectChanges();
    expect(host.last).toBeNull();
  });
});
