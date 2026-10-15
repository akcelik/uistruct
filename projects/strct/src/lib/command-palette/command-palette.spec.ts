import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { StrctCommandItem, StrctCommandPalette } from './command-palette';

const ITEMS: StrctCommandItem[] = [
  { id: 'deploy', label: 'Deploy cluster', group: 'Actions', icon: 'cluster', hint: '⌘D' },
  { id: 'hosts', label: 'Go to hosts', group: 'Navigate', icon: 'host' },
  { id: 'dark', label: 'Toggle dark mode', group: 'Theme', keywords: ['appearance'] },
];

@Component({
  imports: [StrctCommandPalette],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `<strct-command-palette
    [items]="items()"
    [(open)]="open"
    [(query)]="q"
    [filter]="filter()"
    [sectionOrder]="order()"
    [loading]="loading()"
    [maxResults]="maxResults()"
    (picked)="last = $event"
  />`,
})
class HostComponent {
  items = signal(ITEMS);
  open = signal(false);
  q = signal('');
  filter = signal(true);
  order = signal<readonly string[]>([]);
  loading = signal(false);
  maxResults = signal(50);
  last: StrctCommandItem | null = null;
}

function setup(
  open = true,
  opts: {
    items?: StrctCommandItem[];
    filter?: boolean;
    order?: readonly string[];
    loading?: boolean;
    maxResults?: number;
  } = {},
) {
  const fixture = TestBed.createComponent(HostComponent);
  const host = fixture.componentInstance;
  host.open.set(open);
  if (opts.items !== undefined) host.items.set(opts.items);
  if (opts.filter !== undefined) host.filter.set(opts.filter);
  if (opts.order !== undefined) host.order.set(opts.order);
  if (opts.loading !== undefined) host.loading.set(opts.loading);
  if (opts.maxResults !== undefined) host.maxResults.set(opts.maxResults);
  fixture.detectChanges();
  return { fixture, host, el: fixture.nativeElement as HTMLElement };
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
    expect(host.open()).toBe(true);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));
    fixture.detectChanges();
    expect(host.open()).toBe(false);
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
    expect(host.open()).toBe(false);
  });

  it('closes on Escape without picking', () => {
    const { fixture, host } = setup(true);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();
    expect(host.open()).toBe(false);
    expect(host.last).toBeNull();
  });

  it('exposes the query as a two-way model, reset on open', () => {
    const { fixture, host, el } = setup(true);
    const input = el.querySelector('input')!;
    input.value = 'vm';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(host.q()).toBe('vm');
    // Reopen: query resets so a stale search never greets the next open.
    host.open.set(false);
    fixture.detectChanges();
    host.open.set(true);
    fixture.detectChanges();
    expect(host.q()).toBe('');
  });

  it('filter=false renders items as given (server-backed), maxResults still caps', () => {
    const { fixture, host, el } = setup(true, { filter: false, maxResults: 2 });
    // Internal ranking is off: a query that matches nothing locally hides nothing.
    const input = el.querySelector('input')!;
    input.value = 'zzz-no-local-match';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(host.q()).toBe('zzz-no-local-match');
    const labels = [...el.querySelectorAll('.strct-cmdp__label')].map((n) => n.textContent?.trim());
    expect(labels).toEqual(['Deploy cluster', 'Go to hosts']); // given order, capped at 2
  });

  it('loading shows the searching row and suppresses the empty row', () => {
    const { fixture, el } = setup(true, { filter: false, loading: true, items: [] });
    expect(el.querySelector('.strct-cmdp__loading')?.textContent).toContain('Searching');
    expect(el.querySelector('.strct-cmdp__empty')).toBeNull();
    fixture.componentInstance.loading.set(false);
    fixture.detectChanges();
    expect(el.querySelector('.strct-cmdp__loading')).toBeNull();
    expect(el.querySelector('.strct-cmdp__empty')).toBeTruthy();
  });

  it('keeps the active option in range when async results shrink', () => {
    const { fixture, host, el } = setup(true, { filter: false });
    const dialog = el.querySelector('.strct-cmdp')!;
    dialog.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    dialog.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    fixture.detectChanges();
    host.items.set(ITEMS.slice(0, 1)); // server returns fewer results
    fixture.detectChanges();
    const active = el.querySelector('[role="option"][aria-selected="true"]')!;
    expect(active.textContent).toContain('Deploy cluster');
  });
});

// FR-53-01 … 03 — a palette fed from several sources: sections, a badge per
// result, and a tag that yields its room to the label.
describe('StrctCommandPalette — sections, badges and a second line', () => {
  const MIXED: StrctCommandItem[] = [
    { id: 'a', label: 'Payments VM', section: 'Manager', group: 'Virtual machine' },
    { id: 'b', label: 'Payments backup', section: 'Backup', group: 'Backup · daily' },
    { id: 'c', label: 'Payments plan', section: 'Site Recovery', group: 'Recovery plan' },
    { id: 'd', label: 'Payments host', section: 'Manager', group: 'Host' },
  ];

  it('draws each section as a named group, and the headings are not options', () => {
    const { el } = setup(true, { items: MIXED });
    const groups = [...el.querySelectorAll('[role="group"]')];
    expect(groups.length).toBe(3);

    const named = groups.map((g) => {
      const id = g.getAttribute('aria-labelledby')!;
      return el.querySelector(`#${id}`)!.textContent!.trim();
    });
    // The section a result is in keeps its results together.
    expect(named).toEqual(['Manager', 'Backup', 'Site Recovery']);
    expect(groups[0].querySelectorAll('[role="option"]').length).toBe(2);

    // A heading is never an option, so the arrows never land on one.
    expect(el.querySelectorAll('[role="option"]').length).toBe(4);
    for (const heading of el.querySelectorAll('.strct-cmdp__section')) {
      expect(heading.getAttribute('role')).toBeNull();
      expect(heading.closest('[role="option"]')).toBeNull();
    }
  });

  it('moves through every option across the sections, in the drawn order', () => {
    const { fixture, el, host } = setup(true, { items: MIXED });
    const dialog = el.querySelector('[role="dialog"]') as HTMLElement;
    const press = (key: string) =>
      dialog.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
    const active = () =>
      el.querySelector('[aria-selected="true"]')!.textContent!.replace(/\s+/g, ' ').trim();

    expect(active()).toContain('Payments VM');
    press('ArrowDown');
    fixture.detectChanges();
    expect(active()).toContain('Payments host'); // still in Manager
    press('ArrowDown');
    fixture.detectChanges();
    expect(active()).toContain('Payments backup'); // into the next section
    press('End');
    fixture.detectChanges();
    expect(active()).toContain('Payments plan');

    press('Enter');
    fixture.detectChanges();
    expect(host.last?.id).toBe('c');
  });

  it('draws the sections in the order given, the rest as they arrive', () => {
    const { el } = setup(true, { items: MIXED, order: ['Site Recovery', 'Backup'] });
    const named = [...el.querySelectorAll('[role="group"]')].map((g) =>
      el.querySelector(`#${g.getAttribute('aria-labelledby')}`)!.textContent!.trim(),
    );
    expect(named).toEqual(['Site Recovery', 'Backup', 'Manager']);
    // The first option is the first result of the first section.
    expect(el.querySelector('[role="option"]')!.textContent).toContain('Payments plan');
  });

  it('draws a badge and a second line, and keeps both in the option’s name', () => {
    const { el } = setup(true, {
      items: [
        {
          id: 'a',
          label: 'Payments VM',
          group: 'Virtual machine',
          description: 'esx-04 · 8 vCPU',
          badge: { label: 'Backup', tone: 'var(--prod-acc)' },
        },
      ],
    });
    const option = el.querySelector('[role="option"]') as HTMLElement;
    const badge = option.querySelector('strct-badge') as HTMLElement;
    expect(badge.textContent!.trim()).toBe('Backup');
    expect(badge.classList).toContain('strct-badge--tone');
    expect(option.querySelector('.strct-cmdp__desc')!.textContent!.trim()).toBe('esx-04 · 8 vCPU');
    // Nothing is hidden from assistive technology: the row reads as it looks.
    expect(option.querySelector('[aria-hidden="true"]')).toBeNull();
    const name = option.textContent!.replace(/\s+/g, ' ').trim();
    expect(name).toContain('Payments VM');
    expect(name).toContain('Backup');
  });

  it('finds a result by the section it is in', () => {
    const { fixture, el } = setup(true, { items: MIXED });
    const input = el.querySelector('input')!;
    input.value = 'site recovery';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    const options = [...el.querySelectorAll('[role="option"]')];
    expect(options.length).toBe(1);
    expect(options[0].textContent).toContain('Payments plan');
  });
});
