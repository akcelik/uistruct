import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { StrctTree, StrctTreeNode, StrctTreeNodeData } from './tree';

describe('StrctTree', () => {
  it('applies the host class', () => {
    const fixture = TestBed.createComponent(StrctTree);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.classList).toContain('strct-tree');
  });
});

const NODES = (): StrctTreeNodeData[] => [
  {
    id: 'root',
    label: 'Root',
    expanded: true,
    children: [
      { id: 'a', label: 'A', children: [{ id: 'a1', label: 'A1' }] },
      { id: 'b', label: 'B' },
    ],
  },
];

@Component({
  imports: [StrctTree],
  template: `
    <strct-tree
      [nodes]="nodes"
      [(expandedIds)]="expandedIds"
      (expandedChange)="lastChange = $event"
      (nodeToggled)="lastToggle = $event"
    />
  `,
})
class HostComponent {
  nodes: StrctTreeNodeData[] = NODES();
  expandedIds: string[] | null = null;
  lastChange: string[] | null = null;
  lastToggle: { node: StrctTreeNodeData; expanded: boolean } | null = null;
}

function setup(patch: Partial<HostComponent> = {}) {
  const fixture = TestBed.createComponent(HostComponent);
  Object.assign(fixture.componentInstance, patch);
  fixture.detectChanges();
  const el = fixture.nativeElement as HTMLElement;
  return { fixture, host: fixture.componentInstance, el };
}

/** The chevron toggle of the node with the given data-node-id. */
function chevron(el: HTMLElement, id: string): HTMLElement {
  return el
    .querySelector(`[data-node-id="${id}"]`)!
    .querySelector('.strct-tnode__chevron') as HTMLElement;
}

describe('StrctTree — density', () => {
  @Component({
    imports: [StrctTree],
    template: `<strct-tree [nodes]="nodes" [density]="density" />`,
  })
  class DensityHost {
    nodes: StrctTreeNodeData[] = [{ id: 'x', label: 'X', icon: 'vm', expanded: true }];
    density: 'compact' | 'comfortable' = 'compact';
  }

  it('defaults to compact — no modifier class, 16px icons', () => {
    const fixture = TestBed.createComponent(DensityHost);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.strct-tree')!.classList).not.toContain('strct-tree--comfortable');
    expect((el.querySelector('.strct-tnode__icon svg') as SVGElement).style.width).toBe('16px');
  });

  it('comfortable adds the modifier class and scales icons to 18px', () => {
    const fixture = TestBed.createComponent(DensityHost);
    fixture.componentInstance.density = 'comfortable';
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.strct-tree')!.classList).toContain('strct-tree--comfortable');
    expect((el.querySelector('.strct-tnode__icon svg') as SVGElement).style.width).toBe('18px');
  });
});

describe('StrctTree — identity & expansion', () => {
  it('renders a data-node-id attribute per rendered node', () => {
    const { el } = setup();
    // root is expanded (seed), so its children A / B render; A is collapsed so A1 does not.
    expect(el.querySelector('[data-node-id="root"]')).toBeTruthy();
    expect(el.querySelector('[data-node-id="a"]')).toBeTruthy();
    expect(el.querySelector('[data-node-id="b"]')).toBeTruthy();
    expect(el.querySelector('[data-node-id="a1"]')).toBeNull();
  });

  it('seeds uncontrolled expansion from node.expanded (back-compat)', () => {
    const { el } = setup(); // expandedIds null → uncontrolled
    const rootRow = el.querySelector('[data-node-id="root"] > .strct-tnode__row');
    expect(rootRow?.getAttribute('aria-expanded')).toBe('true'); // seeded expanded
    // A is not seeded → collapsed → its child A1 is not rendered
    expect(el.querySelector('[data-node-id="a1"]')).toBeNull();
  });

  it('emits expandedChange + nodeToggled on toggle (uncontrolled)', () => {
    const { fixture, host, el } = setup();
    chevron(el, 'a').click(); // expand A
    fixture.detectChanges();
    expect(host.lastToggle).toEqual({ node: expect.objectContaining({ id: 'a' }), expanded: true });
    expect(host.lastChange).toContain('a');
    expect(host.lastChange).toContain('root');
    // A1 now visible
    expect(el.querySelector('[data-node-id="a1"]')).toBeTruthy();
  });

  it('derives open state from expandedIds when controlled', () => {
    const { el } = setup({ expandedIds: ['root', 'a'] });
    // root + A expanded via the controlled set → A1 rendered
    expect(el.querySelector('[data-node-id="a1"]')).toBeTruthy();
    // collapse via input change
  });

  it('writes back to expandedIds (two-way) on toggle', () => {
    const { fixture, host, el } = setup({ expandedIds: ['root'] });
    chevron(el, 'a').click(); // expand A
    fixture.detectChanges();
    expect(host.expandedIds).toContain('a');
    expect(host.expandedIds).toContain('root');
    chevron(el, 'root').click(); // collapse root
    fixture.detectChanges();
    expect(host.expandedIds).not.toContain('root');
  });
});

describe('StrctTreeNode', () => {
  it('applies the host class', () => {
    const fixture = TestBed.createComponent(StrctTreeNode);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.classList).toContain('strct-tnode');
  });
});

describe('StrctTree — keyboard navigation (ARIA tree pattern)', () => {
  function kb(el: HTMLElement, key: string): void {
    el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
  }
  function rows(el: HTMLElement): HTMLElement[] {
    return [...el.querySelectorAll('.strct-tnode__row')] as HTMLElement[];
  }

  it('uses a roving tabindex: exactly one row is tabbable', () => {
    const { el } = setup({ expandedIds: ['root', 'a'] });
    const tabbables = rows(el).filter((r) => r.getAttribute('tabindex') === '0');
    expect(tabbables.length).toBe(1);
    expect(rows(el).every((r) => ['0', '-1'].includes(r.getAttribute('tabindex')!))).toBe(true);
  });

  it('exposes aria-level per depth', () => {
    const { el } = setup({ expandedIds: ['root', 'a'] });
    const level = (id: string) =>
      el.querySelector(`[data-node-id="${id}"] > .strct-tnode__row`)?.getAttribute('aria-level');
    expect(level('root')).toBe('1');
    expect(level('a')).toBe('2');
    expect(level('a1')).toBe('3');
  });

  it('moves focus with ArrowDown / ArrowUp', () => {
    const { fixture, el } = setup({ expandedIds: ['root'] });
    const [rootRow, aRow] = rows(el);
    rootRow.focus();
    kb(rootRow, 'ArrowDown');
    fixture.detectChanges();
    expect(document.activeElement).toBe(aRow);
    kb(aRow, 'ArrowUp');
    fixture.detectChanges();
    expect(document.activeElement).toBe(rootRow);
  });

  it('expands a closed parent with ArrowRight and collapses with ArrowLeft', () => {
    const { fixture, el } = setup({ expandedIds: ['root'] });
    const aRow = el.querySelector('[data-node-id="a"] > .strct-tnode__row') as HTMLElement;
    kb(aRow, 'ArrowRight');
    fixture.detectChanges();
    expect(el.querySelector('[data-node-id="a1"]')).toBeTruthy();
    kb(aRow, 'ArrowLeft');
    fixture.detectChanges();
    expect(el.querySelector('[data-node-id="a1"]')).toBeNull();
  });
});
