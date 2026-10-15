import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { StrctProductItem, StrctProductSwitcher } from './product-switcher';

const PRODUCTS: StrctProductItem[] = [
  {
    id: 'manager',
    name: 'HyperStruct Manager',
    shortLabel: 'Manager',
    icon: 'cluster',
    description: '128 hosts · 2 alarms',
    status: 'success',
    routerLink: '/manager',
  },
  {
    id: 'backup',
    name: 'HyperStruct Backup',
    shortLabel: 'Backup',
    icon: 'archive',
    description: '2 VMs past RPO',
    status: 'warning',
    routerLink: '/backup',
  },
  { id: 'recovery', name: 'HyperStruct Site Recovery', shortLabel: 'Recovery', icon: 'refresh' },
];
const ADMIN: StrctProductItem[] = [
  { id: 'admin', name: 'Administration', shortLabel: 'Admin', icon: 'settings', href: '/admin' },
];

@Component({
  imports: [StrctProductSwitcher],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `<strct-product-switcher
    [items]="items()"
    [footerItems]="footer()"
    [(current)]="current"
    (opened)="opens = opens + 1"
    (select)="picked.push($event.id)"
  />`,
})
class Host {
  items = signal<readonly StrctProductItem[]>(PRODUCTS);
  footer = signal<readonly StrctProductItem[]>(ADMIN);
  current = signal<string | null>('backup');
  opens = 0;
  picked: string[] = [];
}

function media(narrow: boolean) {
  const listeners = new Set<() => void>();
  const mql = {
    matches: narrow,
    addEventListener: (_: string, fn: () => void) => listeners.add(fn),
    removeEventListener: (_: string, fn: () => void) => listeners.delete(fn),
  };
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => mql),
  );
  return {
    set(value: boolean) {
      mql.matches = value;
      listeners.forEach((fn) => fn());
    },
  };
}

function build() {
  TestBed.configureTestingModule({ providers: [provideRouter([])] });
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  const el = fixture.nativeElement as HTMLElement;
  return { fixture, el, host: fixture.componentInstance };
}

async function openMenu(fixture: ReturnType<typeof build>['fixture'], el: HTMLElement) {
  el.querySelector<HTMLElement>('.strct-ps__chip')!.click();
  fixture.detectChanges();
  await new Promise((resolve) => setTimeout(resolve));
  fixture.detectChanges();
}

describe('StrctProductSwitcher', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('says where you are, and what the chip is for', () => {
    media(false);
    const { el } = build();
    const chip = el.querySelector<HTMLElement>('.strct-ps__chip')!;
    expect(chip.querySelector('.strct-ps__label')!.textContent!.trim()).toBe('HyperStruct Backup');
    // The visible text is part of the accessible name, and the name says the job.
    expect(chip.getAttribute('aria-label')).toBe('HyperStruct Backup — switch product');
  });

  it('shows the short label on a narrow screen, keeping the full name in the name', () => {
    const screen = media(false);
    const { fixture, el } = build();
    const chip = el.querySelector<HTMLElement>('.strct-ps__chip')!;

    screen.set(true);
    fixture.detectChanges();
    expect(chip.querySelector('.strct-ps__label')!.textContent!.trim()).toBe('Backup');
    expect(chip.getAttribute('aria-label')).toContain('HyperStruct Backup');
  });

  it('lists the products as checkable rows, the platform after a divider', async () => {
    media(false);
    const { fixture, el } = build();
    await openMenu(fixture, el);

    const rows = [...el.querySelectorAll<HTMLElement>('[role="menuitemradio"]')];
    // The health dot's own word is part of the row, so a reader hears the
    // state as well as the line: "HyperStruct Backup, Warning, 2 VMs past RPO".
    expect(rows.map((r) => r.textContent!.replace(/\s+/g, ' ').trim())).toEqual([
      'HyperStruct ManagerOK 128 hosts · 2 alarms',
      'HyperStruct BackupWarning 2 VMs past RPO',
      'HyperStruct Site Recovery',
      'Administration',
    ]);
    expect(rows.map((r) => r.getAttribute('aria-checked'))).toEqual([
      'false',
      'true',
      'false',
      'false',
    ]);
    expect(el.querySelector('[role="separator"]')).toBeTruthy();

    // A product with an address is a real link.
    expect(rows.slice(0, 2).map((r) => r.tagName)).toEqual(['A', 'A']);
    expect(rows[0].getAttribute('href')).toBe('/manager');
    expect(rows[3].getAttribute('href')).toBe('/admin');
    expect(rows[2].tagName).toBe('STRCT-DROPDOWN-ITEM');
  });

  it('opens on the keyboard, roves, and returns focus to the chip on Escape', async () => {
    media(false);
    const { fixture, el } = build();
    const chip = el.querySelector<HTMLElement>('.strct-ps__chip')!;
    chip.focus();

    chip.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    fixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve));
    fixture.detectChanges();
    const rows = [...el.querySelectorAll<HTMLElement>('[role="menuitemradio"]')];
    // Opening lands on the product you are in.
    expect(document.activeElement).toBe(rows[1]);

    const press = (key: string) =>
      (document.activeElement as HTMLElement).dispatchEvent(
        new KeyboardEvent('keydown', { key, bubbles: true }),
      );
    press('ArrowDown');
    fixture.detectChanges();
    expect(document.activeElement).toBe(rows[2]);
    press('Home');
    fixture.detectChanges();
    expect(document.activeElement).toBe(rows[0]);
    press('End');
    fixture.detectChanges();
    expect(document.activeElement).toBe(rows[3]);

    press('Escape');
    fixture.detectChanges();
    expect(el.querySelector('[role="menu"]')).toBeNull();
    expect(document.activeElement).toBe(chip);
  });

  it('emits opened once per opening, so health is read then and not before', async () => {
    media(false);
    const { fixture, el, host } = build();
    expect(host.opens).toBe(0);

    await openMenu(fixture, el);
    expect(host.opens).toBe(1);

    el.querySelector<HTMLElement>('[role="menuitemradio"]')!.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    );
    fixture.detectChanges();
    await openMenu(fixture, el);
    expect(host.opens).toBe(2);
  });

  it('switches on a plain click and leaves a ⌘-click to the browser', async () => {
    media(false);
    const { fixture, el, host } = build();
    await openMenu(fixture, el);
    const rows = [...el.querySelectorAll<HTMLElement>('[role="menuitemradio"]')];

    rows[0].dispatchEvent(new MouseEvent('click', { bubbles: true, button: 0, metaKey: true }));
    fixture.detectChanges();
    expect(host.current()).toBe('backup');
    expect(host.picked).toEqual([]);

    rows[0].dispatchEvent(new MouseEvent('click', { bubbles: true, button: 0 }));
    fixture.detectChanges();
    expect(host.current()).toBe('manager');
    expect(host.picked).toEqual(['manager']);
  });

  it('is a plain chip, not a menu of one, when there is nowhere else to go', () => {
    media(false);
    const { fixture, el, host } = build();
    host.items.set([PRODUCTS[1]]);
    host.footer.set([]);
    fixture.detectChanges();

    expect(el.querySelector('[strctDropdownTrigger]')).toBeNull();
    expect(el.querySelector('button')).toBeNull();
    const chip = el.querySelector<HTMLElement>('.strct-ps__chip')!;
    expect(chip.classList).toContain('strct-ps__chip--plain');
    expect(chip.textContent!.trim()).toBe('HyperStruct Backup');
  });
});
