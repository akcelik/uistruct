import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { StrctTree, StrctTreeNode, StrctTreeNodeData } from './tree';

describe('StrctTree', () => {
  it('applies the host class', () => {
    const fixture = TestBed.createComponent(StrctTree);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.classList).toContain('strct-tree');
  });

  it('parses active="false" as false (booleanAttribute)', () => {
    @Component({
      imports: [StrctTreeNode],
      template: `<strct-tree-node label="X" active="false" />`,
    })
    class ActiveHost {}

    const fixture = TestBed.createComponent(ActiveHost);
    fixture.detectChanges();
    const row = (fixture.nativeElement as HTMLElement).querySelector('.strct-tnode__row')!;
    expect(row.classList).not.toContain('strct-tnode__row--active');
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
  changeDetection: ChangeDetectionStrategy.Eager,
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

describe('StrctTree — chevron aria-labels', () => {
  @Component({
    imports: [StrctTree],
    template: `<strct-tree [nodes]="nodes" [chevronAriaLabel]="chevronAriaLabel" />`,
  })
  class I18nHost {
    nodes: StrctTreeNodeData[] = NODES();
    chevronAriaLabel = (expanded: boolean, label: string): string =>
      `${expanded ? 'Zuklappen' : 'Aufklappen'} ${label}`;
  }

  it('defaults to Expand/Collapse + node label', () => {
    const { el } = setup();
    // root is expanded (seed), A is collapsed.
    expect(chevron(el, 'root').getAttribute('aria-label')).toBe('Collapse Root');
    expect(chevron(el, 'a').getAttribute('aria-label')).toBe('Expand A');
  });

  it('localizes the chevron aria-labels via chevronAriaLabel', () => {
    const fixture = TestBed.createComponent(I18nHost);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(chevron(el, 'root').getAttribute('aria-label')).toBe('Zuklappen Root');
    expect(chevron(el, 'a').getAttribute('aria-label')).toBe('Aufklappen A');
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

  it('keeps the roving tabindex on the first row after a nodes reorder', () => {
    @Component({
      imports: [StrctTree],
      template: `<strct-tree [nodes]="nodes()" />`,
    })
    class ReorderHost {
      nodes = signal<StrctTreeNodeData[]>([
        { id: 'z', label: 'Zulu' },
        { id: 'm', label: 'Mike' },
      ]);
    }
    const fixture = TestBed.createComponent(ReorderHost);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(rows(el)[0].getAttribute('tabindex')).toBe('0');

    // @for moves the existing views in place — no register/unregister happens.
    const tree = fixture.debugElement.query((de) => de.componentInstance instanceof StrctTree)
      .componentInstance as StrctTree;
    let registrations = 0;
    const registerNode = tree.registerNode.bind(tree);
    tree.registerNode = (n) => {
      registrations++;
      registerNode(n);
    };
    fixture.componentInstance.nodes.update((ns) => [ns[1], ns[0]]);
    fixture.detectChanges();
    expect(registrations).toBe(0);

    expect(rows(el)[0].textContent).toContain('Mike');
    expect(rows(el)[0].getAttribute('tabindex')).toBe('0');
  });
});

describe('StrctTree — ARIA tree structure', () => {
  function row(el: HTMLElement, id: string): HTMLElement {
    return el.querySelector(`[data-node-id="${id}"] > .strct-tnode__row`) as HTMLElement;
  }

  it('marks the node host as presentational so it does not break ownership', () => {
    const { el } = setup({ expandedIds: ['root', 'a'] });
    const hosts = [...el.querySelectorAll('strct-tree-node')];
    expect(hosts.length).toBeGreaterThan(0);
    for (const host of hosts) expect(host.getAttribute('role')).toBe('none');
  });

  it('owns the children group from the treeitem row via aria-owns', () => {
    const { el } = setup({ expandedIds: ['root'] });
    const owns = row(el, 'root').getAttribute('aria-owns');
    expect(owns).toBeTruthy();
    const group = el.querySelector('[data-node-id="root"] > .strct-tnode__children')!;
    expect(group.getAttribute('role')).toBe('group');
    expect(group.id).toBe(owns);
  });

  it('drops aria-owns while the node is collapsed', () => {
    const { el } = setup({ expandedIds: ['root'] });
    expect(row(el, 'a').getAttribute('aria-owns')).toBeNull();
  });

  it('exposes aria-setsize / aria-posinset per sibling group (data mode)', () => {
    const { el } = setup({ expandedIds: ['root', 'a'] });
    const meta = (id: string) => [
      row(el, id).getAttribute('aria-setsize'),
      row(el, id).getAttribute('aria-posinset'),
    ];
    expect(meta('root')).toEqual(['1', '1']);
    expect(meta('a')).toEqual(['2', '1']);
    expect(meta('b')).toEqual(['2', '2']);
    expect(meta('a1')).toEqual(['1', '1']);
  });

  it('exposes aria-setsize / aria-posinset for projected content nodes', () => {
    @Component({
      imports: [StrctTree, StrctTreeNode],
      template: `
        <strct-tree>
          <strct-tree-node label="One" [expanded]="true">
            <strct-tree-node label="Nested" />
          </strct-tree-node>
          <strct-tree-node label="Two" />
        </strct-tree>
      `,
    })
    class ContentHost {}
    const fixture = TestBed.createComponent(ContentHost);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const rows = [...el.querySelectorAll('.strct-tnode__row')] as HTMLElement[];
    // DOM order: One, Nested (child of One), Two — nested nodes must not leak
    // into the root sibling count.
    expect(rows.map((r) => r.getAttribute('aria-setsize'))).toEqual(['2', '1', '2']);
    expect(rows.map((r) => r.getAttribute('aria-posinset'))).toEqual(['1', '1', '2']);
  });
});

describe('StrctTree — typeahead (APG)', () => {
  function kb(el: HTMLElement, key: string, init: KeyboardEventInit = {}): void {
    el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, ...init }));
  }
  function row(el: HTMLElement, id: string): HTMLElement {
    return el.querySelector(`[data-node-id="${id}"] > .strct-tnode__row`) as HTMLElement;
  }

  it('jumps to the next visible node whose label starts with the typed character', () => {
    const { fixture, el } = setup({ expandedIds: ['root', 'a'] });
    row(el, 'root').focus();
    kb(row(el, 'root'), 'b');
    fixture.detectChanges();
    expect(document.activeElement).toBe(row(el, 'b'));
  });

  it('cycles through matches when the same character is repeated', () => {
    const { fixture, el } = setup({ expandedIds: ['root', 'a'] });
    const aRow = row(el, 'a');
    aRow.focus();
    kb(aRow, 'a');
    fixture.detectChanges();
    expect(document.activeElement).toBe(row(el, 'a1'));
    kb(row(el, 'a1'), 'a');
    fixture.detectChanges();
    expect(document.activeElement).toBe(aRow); // wraps around
  });

  it('accumulates characters into a search prefix', () => {
    @Component({
      imports: [StrctTree],
      template: `<strct-tree [nodes]="nodes" />`,
    })
    class PrefixHost {
      nodes: StrctTreeNodeData[] = [
        { id: 'alpha', label: 'Alpha' },
        { id: 'alpine', label: 'Alpine' },
        { id: 'beta', label: 'Beta' },
      ];
    }
    const fixture = TestBed.createComponent(PrefixHost);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    row(el, 'alpha').focus();
    for (const key of ['a', 'l', 'p', 'i']) {
      kb(document.activeElement as HTMLElement, key);
      fixture.detectChanges();
    }
    expect(document.activeElement).toBe(row(el, 'alpine'));
  });

  it('ignores modified keys and space (space still activates the row)', () => {
    const { fixture, el } = setup({ expandedIds: ['root'] });
    const rootRow = row(el, 'root');
    rootRow.focus();
    kb(rootRow, 'b', { ctrlKey: true });
    fixture.detectChanges();
    expect(document.activeElement).toBe(rootRow);
    kb(rootRow, ' ');
    fixture.detectChanges();
    expect(document.activeElement).toBe(rootRow);
  });
});
