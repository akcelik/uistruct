import { Component, ChangeDetectionStrategy } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { StrctFlow, StrctFlowEdge, StrctFlowNode, StrctFlowNodeTemplate } from './flow';

@Component({
  imports: [StrctFlow],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <strct-flow
      [nodes]="nodes"
      [live]="live"
      [direction]="direction"
      [label]="label"
      status="success"
    />
  `,
})
class HostComponent {
  nodes: StrctFlowNode[] = [
    { id: 'a', label: 'node01', role: 'ACTIVE', status: 'success' },
    { id: 'b', label: 'node02', role: 'STANDBY', status: 'accent' },
  ];
  live = false;
  direction: 'forward' | 'reverse' | 'both' = 'forward';
  label = 'live replication';
}

function setup(patch: Partial<HostComponent> = {}) {
  const fixture = TestBed.createComponent(HostComponent);
  Object.assign(fixture.componentInstance, patch);
  fixture.detectChanges();
  return fixture.nativeElement.querySelector('strct-flow') as HTMLElement;
}

describe('StrctFlow', () => {
  it('renders a terminal per node and a connector between consecutive nodes', () => {
    const host = setup();
    expect(host.querySelectorAll('.strct-flow__node').length).toBe(2);
    expect(host.querySelectorAll('.strct-flow__conn').length).toBe(1);
  });

  it('handles N nodes (connectors = nodes - 1)', () => {
    const host = setup({
      nodes: [
        { id: 'a', label: 'a' },
        { id: 'b', label: 'b' },
        { id: 'c', label: 'c' },
      ],
    });
    expect(host.querySelectorAll('.strct-flow__node').length).toBe(3);
    expect(host.querySelectorAll('.strct-flow__conn').length).toBe(2);
  });

  it('summarizes the flow in role="img" + aria-label', () => {
    const host = setup({ live: true });
    expect(host.getAttribute('role')).toBe('img');
    const label = host.getAttribute('aria-label') ?? '';
    expect(label).toContain('node01');
    expect(label).toContain('node02');
    expect(label).toContain('live');
  });

  it('animates packets only when live and connected', () => {
    expect(setup({ live: false }).querySelectorAll('.strct-flow__pkt').length).toBe(0);
    expect(setup({ live: true }).querySelectorAll('.strct-flow__pkt').length).toBeGreaterThan(0);
  });

  it('degrades to a single terminal + "no connection" when given one node', () => {
    const host = setup({ nodes: [{ id: 'a', label: 'solo' }], live: true, label: '' });
    expect(host.querySelectorAll('.strct-flow__conn').length).toBe(0);
    expect(host.querySelectorAll('.strct-flow__pkt').length).toBe(0);
    expect(host.querySelector('.strct-flow__caption')?.textContent).toContain('No connection');
    expect(host.getAttribute('aria-label')).toContain('no connection');
  });

  it('shows only the forward arrow for direction="forward" and both for "both"', () => {
    const fwd = setup({ direction: 'forward' });
    expect(fwd.querySelectorAll('.strct-flow__arrow--fwd').length).toBe(1);
    expect(fwd.querySelectorAll('.strct-flow__arrow--rev').length).toBe(0);

    const both = setup({ direction: 'both' });
    expect(both.querySelectorAll('.strct-flow__arrow--fwd').length).toBe(1);
    expect(both.querySelectorAll('.strct-flow__arrow--rev').length).toBe(1);
  });
});

// FR-48-31 — infrastructure diagrams fan out.
@Component({
  imports: [StrctFlow, StrctFlowNodeTemplate],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <strct-flow
      layout="fan-out"
      [nodes]="nodes"
      [edges]="edges"
      [columns]="['This host', 'Lands on', 'Stays down']"
    >
      <ng-template strctFlowNode let-node>
        <strong class="tpl">{{ node.label }}</strong>
        <span class="vms">{{ node.data }}</span>
      </ng-template>
    </strct-flow>
  `,
})
class FanHost {
  nodes: StrctFlowNode[] = [
    { id: 'src', label: 'hv-01', column: 0, status: 'warning' },
    { id: 't1', label: 'hv-02', column: 1, status: 'success', data: '4 VMs' },
    { id: 't2', label: 'hv-03', column: 1, status: 'success', data: '2 VMs' },
    { id: 'down', label: 'sql-vm-02', column: 2, status: 'critical' },
  ];
  edges: StrctFlowEdge[] = [
    { from: 'src', to: 't1', status: 'success' },
    { from: 'src', to: 't2', status: 'success', style: 'dashed' },
    { from: 'src', to: 'down', status: 'critical' },
  ];
}

describe('StrctFlow — fan-out (FR-48-31)', () => {
  function build() {
    const fixture = TestBed.createComponent(FanHost);
    fixture.detectChanges();
    return { fixture, el: fixture.nativeElement as HTMLElement };
  }

  it('lays the nodes out in columns with their headings', () => {
    const { el } = build();
    const cols = el.querySelectorAll('.strct-flow__col');
    expect(cols.length).toBe(3);
    expect([...cols].map((c) => c.getAttribute('aria-label'))).toEqual([
      'This host',
      'Lands on',
      'Stays down',
    ]);
    expect([...cols].map((c) => c.getAttribute('role'))).toEqual(['group', 'group', 'group']);
    expect(cols[1].querySelectorAll('.strct-flow__box').length).toBe(2);
  });

  it('renders each node from the template, with its data', () => {
    const { el } = build();
    expect([...el.querySelectorAll('.tpl')].map((n) => n.textContent)).toEqual([
      'hv-01',
      'hv-02',
      'hv-03',
      'sql-vm-02',
    ]);
    expect([...el.querySelectorAll('.vms')].map((n) => n.textContent).filter(Boolean)).toEqual([
      '4 VMs',
      '2 VMs',
    ]);
  });

  it('describes the diagram structurally and hides the edges from assistive tech', () => {
    const { el } = build();
    const boxes = el.querySelectorAll('.strct-flow__box');
    expect(boxes[0].querySelector('.strct-flow__sr')?.textContent).toBe(
      '→ hv-02, hv-03, sql-vm-02',
    );
    expect(boxes[1].querySelector('.strct-flow__sr')?.textContent).toBe('');
    expect(el.querySelector('svg.strct-flow__edges')?.getAttribute('aria-hidden')).toBe('true');
    // and the host is no longer a bare role="img" with one label
    expect(el.querySelector('strct-flow')?.getAttribute('role')).toBeNull();
  });

  it('derives tree columns from the edge depth', () => {
    const fixture = TestBed.createComponent(StrctFlow);
    fixture.componentRef.setInput('layout', 'tree');
    fixture.componentRef.setInput('nodes', [
      { id: 'sw', label: 'Switch' },
      { id: 'h1', label: 'Host 1' },
      { id: 'h2', label: 'Host 2' },
      { id: 'up', label: 'Uplink' },
    ]);
    fixture.componentRef.setInput('edges', [
      { from: 'sw', to: 'h1' },
      { from: 'sw', to: 'h2' },
      { from: 'h1', to: 'up' },
    ]);
    fixture.detectChanges();
    const cols = (fixture.nativeElement as HTMLElement).querySelectorAll('.strct-flow__col');
    expect(cols.length).toBe(3);
    expect(cols[0].querySelectorAll('.strct-flow__box').length).toBe(1);
    expect(cols[1].querySelectorAll('.strct-flow__box').length).toBe(2);
    expect(cols[2].querySelectorAll('.strct-flow__box').length).toBe(1);
  });

  it('leaves chain mode exactly as it was', () => {
    const fixture = TestBed.createComponent(StrctFlow);
    fixture.componentRef.setInput('nodes', [
      { id: 'a', label: 'node01' },
      { id: 'b', label: 'node02' },
    ]);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.strct-flow__row')).toBeTruthy();
    expect(el.querySelector('.strct-flow__fan')).toBeNull();
    expect(el.getAttribute('role')).toBe('img');
    expect(el.getAttribute('aria-label')).toContain('node01');
  });
});
