import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { StrctFlow, StrctFlowNode } from './flow';

@Component({
  imports: [StrctFlow],
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
