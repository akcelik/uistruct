import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { StrctWiring, StrctWiringLink, StrctWiringNode, StrctWiringPortEvent } from './wiring';

const FABRIC: StrctWiringNode[] = [
  {
    id: 'hv1',
    label: 'HV-PRD-01',
    sublabel: 'SETswitch',
    column: 0,
    ports: [
      { id: 'p1', label: 'SLOT 3 Port 1', meta: '25G · RDMA', status: 'success' },
      { id: 'p2', label: 'SLOT 3 Port 2', meta: 'PFC 3', status: 'critical' },
    ],
  },
  {
    id: 'tora',
    label: 'tor-a',
    sublabel: 'Nexus 93180',
    column: 1,
    ports: [
      { id: 'a11', label: 'Eth1/11' },
      { id: 'a12', label: 'Eth1/12' },
    ],
  },
];

const LINKS: StrctWiringLink[] = [
  { id: 'l1', from: 'p1', to: 'a11', status: 'success' },
  { id: 'l2', from: 'p2', to: 'a12', status: 'critical', label: 'PFC 3 ≠ 4' },
];

@Component({
  imports: [StrctWiring],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <strct-wiring
      [nodes]="nodes"
      [links]="links"
      [columns]="columns"
      [navigable]="navigable"
      [isolate]="isolate"
      [label]="label"
      [(selected)]="selected"
      (portActivate)="lastPort = $event"
    />
  `,
})
class HostComponent {
  nodes: StrctWiringNode[] = FABRIC;
  links: StrctWiringLink[] = LINKS;
  columns: string[] | null = ['Nodes', 'Switches'];
  navigable = false;
  isolate = true;
  label = '';
  selected = signal<string | null>(null);
  lastPort: StrctWiringPortEvent | null = null;
}

function setup(patch: Partial<HostComponent> = {}) {
  const fixture = TestBed.createComponent(HostComponent);
  Object.assign(fixture.componentInstance, patch);
  fixture.detectChanges();
  return {
    fixture,
    host: fixture.nativeElement.querySelector('strct-wiring') as HTMLElement,
    vm: fixture.componentInstance,
  };
}

const port = (host: HTMLElement, id: string) =>
  host.querySelector<HTMLElement>(`[data-wiring-port="${id}"]`)!;

describe('StrctWiring', () => {
  it('draws a card per device and a row per port, in column order', () => {
    const { host } = setup();
    expect(host.querySelectorAll('.strct-wiring__node').length).toBe(2);
    expect(host.querySelectorAll('[data-wiring-port]').length).toBe(4);
    const heads = [...host.querySelectorAll('.strct-wiring__colhead')].map((h) =>
      h.textContent?.trim(),
    );
    expect(heads).toEqual(['Nodes', 'Switches']);
    expect(host.querySelector('.strct-wiring__portmeta')?.textContent?.trim()).toBe('25G · RDMA');
  });

  it('derives the columns from the cabling when no device declares one', () => {
    const { host } = setup({
      nodes: [
        { id: 'a', label: 'hv-a', ports: [{ id: 'pa', label: 'nic0' }] },
        {
          id: 'b',
          label: 'leaf',
          ports: [
            { id: 'pb', label: 'Eth1/1' },
            { id: 'pc', label: 'Eth1/49' },
          ],
        },
        { id: 'c', label: 'spine', ports: [{ id: 'pd', label: 'Eth1/7' }] },
      ],
      links: [
        { id: 'x', from: 'pa', to: 'pb' },
        { id: 'y', from: 'pc', to: 'pd' },
      ],
      columns: ['Hosts', 'Leaf', 'Spine'],
    });
    const cols = [...host.querySelectorAll('.strct-wiring__col')];
    expect(cols.length).toBe(3);
    expect(
      cols.map((c) => c.querySelector('.strct-wiring__nodelabel')?.textContent?.trim()),
    ).toEqual(['hv-a', 'leaf', 'spine']);
  });

  it('tells each port where its cable lands, and says so when it has none', () => {
    const { host } = setup();
    expect(port(host, 'p2').querySelector('.strct-wiring__sr')?.textContent).toContain(
      '→ tor-a Eth1/12, critical — PFC 3 ≠ 4',
    );
    const { host: lone } = setup({ links: [] });
    expect(lone.querySelector('.strct-wiring__sr')?.textContent?.trim()).toBe('not wired');
  });

  it('neither draws nor announces a link whose far end is not on the map', () => {
    const { host } = setup({
      links: [{ id: 'ghost', from: 'p1', to: 'nowhere', status: 'critical' }],
    });
    expect(port(host, 'p1').querySelector('.strct-wiring__sr')?.textContent?.trim()).toBe(
      'not wired',
    );
  });

  it('keeps no tab stop at all unless navigable', () => {
    const { host } = setup();
    expect(host.querySelectorAll('button').length).toBe(0);
    const { host: live } = setup({ navigable: true });
    expect(live.querySelectorAll('button').length).toBe(4);
    const stops = [...live.querySelectorAll('button')].filter((b) => b.tabIndex === 0);
    expect(stops.length).toBe(1);
  });

  it('selects the cable a port is on, and reports the port with it', () => {
    const { host, vm } = setup({ navigable: true });
    port(host, 'p2').click();
    expect(vm.selected()).toBe('l2');
    expect(vm.lastPort?.port.id).toBe('p2');
    expect(vm.lastPort?.node.id).toBe('hv1');
    expect(vm.lastPort?.links.map((l) => l.id)).toEqual(['l2']);
  });

  it('does not guess which cable a port with more than one is', () => {
    const { host, vm } = setup({
      navigable: true,
      links: [
        { id: 'l1', from: 'p1', to: 'a11' },
        { id: 'l2', from: 'p1', to: 'a12' },
      ],
    });
    port(host, 'p1').click();
    expect(vm.selected()).toBe(null);
    expect(vm.lastPort?.links.map((l) => l.id)).toEqual(['l1', 'l2']);
  });

  it('a read-only map reports nothing when a port is clicked', () => {
    const { host, vm } = setup({ navigable: false });
    port(host, 'p2').click();
    expect(vm.selected()).toBe(null);
    expect(vm.lastPort).toBe(null);
  });

  it('marks both ends of the selection, each on the edge its cable uses', () => {
    const { fixture, host, vm } = setup({ navigable: true });
    vm.selected.set('l2');
    fixture.detectChanges();
    const on = [...host.querySelectorAll('.strct-wiring__port--on')];
    expect(on.map((p) => p.getAttribute('data-wiring-port')).sort()).toEqual(['a12', 'p2']);
    expect(port(host, 'p2').classList).toContain('strct-wiring__port--on-end');
    expect(port(host, 'a12').classList).toContain('strct-wiring__port--on-start');
  });

  it('isolates only while something is selected, and only when asked', () => {
    const { fixture, host, vm } = setup();
    expect(host.classList).not.toContain('strct-wiring--isolated');
    vm.selected.set('l2');
    fixture.detectChanges();
    expect(host.classList).toContain('strct-wiring--isolated');

    const { fixture: f2, host: h2, vm: vm2 } = setup({ isolate: false });
    vm2.selected.set('l2');
    f2.detectChanges();
    expect(h2.classList).not.toContain('strct-wiring--isolated');
  });

  it('does not isolate for a selection this map is not drawing', () => {
    // A filter that hides the selected cable would otherwise dim every cable
    // and lift none of them.
    const { fixture, host, vm } = setup();
    vm.selected.set('l2');
    fixture.detectChanges();
    expect(host.classList).toContain('strct-wiring--isolated');

    // The same selection, against a map drawing only the other cable.
    const filtered = setup({ links: [LINKS[0]], selected: signal<string | null>('l2') });
    expect(filtered.host.classList).not.toContain('strct-wiring--isolated');
    expect(filtered.host.querySelectorAll('.strct-wiring__port--on').length).toBe(0);
  });

  it('→ follows the cable, ↓ walks the column, Home/End jump to its ends', () => {
    const { host } = setup({ navigable: true });
    const press = (from: string, key: string) => {
      const el = port(host, from);
      el.focus();
      el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
      return document.activeElement?.getAttribute('data-wiring-port');
    };
    expect(press('p1', 'ArrowRight')).toBe('a11');
    expect(press('a11', 'ArrowLeft')).toBe('p1');
    expect(press('p1', 'ArrowDown')).toBe('p2');
    expect(press('p2', 'ArrowDown')).toBe('p1');
    expect(press('p2', 'Home')).toBe('p1');
    expect(press('p1', 'End')).toBe('p2');
  });

  it('→ falls through to the next column where a port has no cable that way', () => {
    const { host } = setup({
      navigable: true,
      links: [],
    });
    const el = port(host, 'p2');
    el.focus();
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(document.activeElement?.getAttribute('data-wiring-port')).toBe('a11');
  });

  it('Enter and Space act on the port the keyboard is on', () => {
    for (const key of ['Enter', ' ']) {
      const { host, vm } = setup({ navigable: true });
      const el = port(host, 'p2');
      el.focus();
      el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
      expect(vm.selected()).toBe('l2');
    }
  });

  it('hides the cables from assistive tech and summarises the map instead', () => {
    const { host } = setup({ label: 'as LLDP heard them' });
    expect(host.querySelector('.strct-wiring__links')?.getAttribute('aria-hidden')).toBe('true');
    expect(host.getAttribute('role')).toBe('group');
    const label = host.getAttribute('aria-label') ?? '';
    expect(label).toContain('2 devices');
    expect(label).toContain('4 ports');
    expect(label).toContain('2 links');
    expect(label).toContain('as LLDP heard them');
  });

  it('says so when there is nothing to draw', () => {
    const { host } = setup({ nodes: [], links: [] });
    expect(host.querySelector('.strct-wiring__empty')?.textContent?.trim()).toBe(
      'No wiring to show.',
    );
    expect(host.querySelector('.strct-wiring__map')).toBe(null);
  });
});

// FR-72-02 (HyperStruct, against 7.7.0): a port with no cable says what the
// consumer knows. On a map read from LLDP "not wired" claims a fact the page
// does not have — nothing was heard, which is unknown, not absent.
describe('StrctWiring — a port with no cable', () => {
  const nodes: StrctWiringNode[] = [
    {
      id: 'hv1',
      label: 'HV-PRD-01',
      column: 0,
      ports: [
        { id: 'p1', label: 'SLOT 3 Port 1' },
        { id: 'p2', label: 'SLOT 3 Port 2', unlinked: 'not patched' },
      ],
    },
  ];

  function build(patch: Record<string, unknown> = {}) {
    const fixture = TestBed.createComponent(StrctWiring);
    fixture.componentRef.setInput('nodes', nodes);
    fixture.componentRef.setInput('links', []);
    for (const [k, v] of Object.entries(patch)) fixture.componentRef.setInput(k, v);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    return (id: string) =>
      el.querySelector(`[data-wiring-port="${id}"] .strct-wiring__sr`)!.textContent;
  }

  it('says "not wired" unless it is told otherwise', () => {
    expect(build()('p1')).toBe('not wired');
  });

  it("takes the map's own sentence for every port that sets none", () => {
    const said = build({ unlinkedText: 'nothing heard from a switch' });
    expect(said('p1')).toBe('nothing heard from a switch');
    // A port that knows its own answer keeps it.
    expect(said('p2')).toBe('not patched');
  });
});
