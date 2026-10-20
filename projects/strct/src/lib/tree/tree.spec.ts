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

describe('StrctTree — drag and drop (FR-43-04)', () => {
  /** folder ▸ (vm-1, sub ▸ vm-2), plus a host outside the folder. */
  const DND = (): StrctTreeNodeData[] => [
    {
      id: 'folder',
      label: 'Folder',
      expanded: true,
      children: [
        { id: 'vm-1', label: 'VM 1' },
        { id: 'sub', label: 'Subfolder', children: [{ id: 'vm-2', label: 'VM 2' }] },
      ],
    },
    { id: 'host', label: 'Host' },
  ];

  type DragFn = ((n: StrctTreeNodeData) => boolean) | null;
  type DropFn = ((s: StrctTreeNodeData, t: StrctTreeNodeData) => boolean | string) | null;

  @Component({
    imports: [StrctTree],
    template: `
      <strct-tree
        [nodes]="nodes()"
        [canDrag]="canDrag()"
        [canDrop]="canDrop()"
        [dragExpandDelay]="delay()"
        (nodeDrop)="drops.push($event)"
        (dropRefused)="refusals.push($event)"
      />
    `,
  })
  class DndHost {
    readonly nodes = signal<StrctTreeNodeData[]>(DND());
    readonly canDrag = signal<DragFn>((n) => n.id !== 'host');
    readonly canDrop = signal<DropFn>(() => true);
    readonly delay = signal(700);
    drops: { source: StrctTreeNodeData; target: StrctTreeNodeData; position: string }[] = [];
    refusals: { source: StrctTreeNodeData; target: StrctTreeNodeData; reason: string }[] = [];
  }

  function setupDnd(patch: { canDrag?: DragFn; canDrop?: DropFn; delay?: number } = {}) {
    const fixture = TestBed.createComponent(DndHost);
    if ('canDrag' in patch) fixture.componentInstance.canDrag.set(patch.canDrag ?? null);
    if ('canDrop' in patch) fixture.componentInstance.canDrop.set(patch.canDrop ?? null);
    if (patch.delay != null) fixture.componentInstance.delay.set(patch.delay);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const row = (id: string) =>
      el.querySelector(`[data-node-id="${id}"] > .strct-tnode__row`) as HTMLElement;
    /** A drag event carrying a dataTransfer stub (jsdom has none). */
    const drag = (type: string, target: HTMLElement, clientY = 0) => {
      const event = new MouseEvent(type, {
        bubbles: true,
        cancelable: true,
        clientY,
      }) as MouseEvent & {
        dataTransfer: { setData: () => void; effectAllowed: string; dropEffect: string };
      };
      Object.defineProperty(event, 'dataTransfer', {
        value: { setData: () => {}, effectAllowed: '', dropEffect: '' },
      });
      target.dispatchEvent(event);
      fixture.detectChanges();
      return event;
    };
    return { fixture, host: fixture.componentInstance, el, row, drag };
  }

  it('only canDrag nodes are draggable, and the default is none', () => {
    const { row } = setupDnd();
    expect(row('vm-1').getAttribute('draggable')).toBe('true');
    expect(row('host').hasAttribute('draggable')).toBe(false);

    const plain = setupDnd({ canDrag: null });
    expect(plain.row('vm-1').hasAttribute('draggable')).toBe(false);
  });

  it('canDrag is asked again when nodes change', () => {
    const { fixture, host, row } = setupDnd({ canDrag: () => false });
    expect(row('vm-1').hasAttribute('draggable')).toBe(false);
    host.canDrag.set((n) => n.id === 'vm-1');
    host.nodes.set(DND()); // a refresh, as a re-fetch would produce
    fixture.detectChanges();
    expect(row('vm-1').getAttribute('draggable')).toBe('true');
  });

  it('an accepted target is highlighted and takes the drop; the source is dimmed', () => {
    const { host, row, drag } = setupDnd();
    drag('dragstart', row('vm-1'));
    expect(row('vm-1').classList).toContain('strct-tnode__row--dragging');

    const over = drag('dragover', row('host'));
    expect(over.defaultPrevented).toBe(true); // prevented = "you may drop here"
    expect(row('host').classList).toContain('strct-tnode__row--droptarget');

    drag('drop', row('host'));
    expect(host.drops).toEqual([
      { source: host.nodes()[0].children![0], target: host.nodes()[1], position: 'into' },
    ]);
    // Drag state is cleared by the drop.
    expect(row('vm-1').classList).not.toContain('strct-tnode__row--dragging');
    expect(row('host').classList).not.toContain('strct-tnode__row--droptarget');
  });

  it('a refused target is not prevented, not highlighted, and never emits', () => {
    const { host, row, drag } = setupDnd({ canDrop: (_s, t) => t.id === 'sub' });
    drag('dragstart', row('vm-1'));
    const over = drag('dragover', row('host'));
    expect(over.defaultPrevented).toBe(false); // the browser shows "not allowed"
    expect(row('host').classList).not.toContain('strct-tnode__row--droptarget');
    drag('drop', row('host'));
    expect(host.drops).toEqual([]);
  });

  it("without canDrop nothing is accepted — the rule is the consumer's", () => {
    const { host, row, drag } = setupDnd({ canDrop: null });
    drag('dragstart', row('vm-1'));
    expect(drag('dragover', row('host')).defaultPrevented).toBe(false);
    drag('drop', row('host'));
    expect(host.drops).toEqual([]);
  });

  it('never drops a node on itself or into its own subtree, whatever canDrop says', () => {
    const { host, row, drag } = setupDnd({ canDrop: () => true });
    drag('dragstart', row('folder'));
    // itself
    expect(drag('dragover', row('folder')).defaultPrevented).toBe(false);
    // its own descendants (a folder into its own subfolder is a cycle)
    expect(drag('dragover', row('sub')).defaultPrevented).toBe(false);
    expect(drag('dragover', row('vm-1')).defaultPrevented).toBe(false);
    drag('drop', row('sub'));
    expect(host.drops).toEqual([]);
    // …but a node outside the subtree is still fine. (A drop ends the drag, as
    // the browser's own dragend would, so start a fresh one.)
    drag('dragstart', row('folder'));
    expect(drag('dragover', row('host')).defaultPrevented).toBe(true);
  });

  it('the highlight clears on dragleave and on a drag that ends outside the tree', () => {
    const { row, drag } = setupDnd();
    drag('dragstart', row('vm-1'));
    drag('dragover', row('host'));
    expect(row('host').classList).toContain('strct-tnode__row--droptarget');
    drag('dragleave', row('host'));
    expect(row('host').classList).not.toContain('strct-tnode__row--droptarget');

    drag('dragover', row('host'));
    drag('dragend', row('vm-1')); // dropped on the desktop, say
    expect(row('host').classList).not.toContain('strct-tnode__row--droptarget');
    expect(row('vm-1').classList).not.toContain('strct-tnode__row--dragging');
  });

  it('hovering a collapsed node expands it, so an unseen target can be reached', () => {
    vi.useFakeTimers();
    try {
      const { el, row, drag } = setupDnd({ delay: 700 });
      expect(el.querySelector('[data-node-id="vm-2"]')).toBeNull(); // 'sub' is collapsed
      drag('dragstart', row('vm-1'));
      drag('dragover', row('sub'));
      vi.advanceTimersByTime(699);
      expect(el.querySelector('[data-node-id="vm-2"]')).toBeNull();
      vi.advanceTimersByTime(1);
      drag('dragover', row('sub'));
      expect(el.querySelector('[data-node-id="vm-2"]')).toBeTruthy();
    } finally {
      vi.useRealTimers();
    }
  });

  it('leaving before the delay does not expand, and a finished drag cancels it', () => {
    vi.useFakeTimers();
    try {
      const { el, row, drag } = setupDnd({ delay: 700 });
      drag('dragstart', row('vm-1'));
      drag('dragover', row('sub'));
      drag('dragleave', row('sub'));
      vi.advanceTimersByTime(1000);
      expect(el.querySelector('[data-node-id="vm-2"]')).toBeNull();

      drag('dragover', row('sub'));
      drag('dragend', row('vm-1'));
      vi.advanceTimersByTime(1000);
      expect(el.querySelector('[data-node-id="vm-2"]')).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it('announces the drag and the drop politely', async () => {
    const { row, drag } = setupDnd();
    const live = () => document.querySelector('[aria-live="polite"]')?.textContent ?? '';
    // StrctAnnouncer clears the region and writes in a macrotask, so identical
    // consecutive messages still fire; wait for it rather than for a tick.
    const settle = () => new Promise((r) => setTimeout(r));
    drag('dragstart', row('vm-1'));
    await settle();
    expect(live()).toContain('Dragging VM 1');
    drag('dragover', row('host'));
    drag('drop', row('host'));
    await settle();
    expect(live()).toContain('Dropped VM 1 on Host');
  });

  // FR-59-07: a refusal the operator should read — instead of a target that
  // simply will not take the drop, or a toast after the fact.
  describe('a refused drop with its reason', () => {
    const reason = 'A resource pool cannot be moved into another cluster';

    it('shows the reason beside the pointer, announces it once, and refuses the drop', async () => {
      const { host, el, row, drag } = setupDnd({
        canDrop: (_s: StrctTreeNodeData, t: StrctTreeNodeData) => (t.id === 'host' ? reason : true),
      });
      const live = () => document.querySelector('[aria-live="polite"]')?.textContent ?? '';
      const settle = () => new Promise((r) => setTimeout(r));

      drag('dragstart', row('vm-1'));
      drag('dragover', row('host'), 120);
      await settle();

      const bubble = el.querySelector('.strct-tree__refusal')!;
      expect(bubble.textContent!.trim()).toBe(reason);
      expect(bubble.getAttribute('aria-hidden')).toBe('true');
      expect(live()).toContain(reason);
      expect(row('host').classList).not.toContain('strct-tnode__row--droptarget');
      expect(host.refusals.map((r) => r.reason)).toEqual([reason]);

      drag('dragover', row('host'), 121);
      drag('dragover', row('host'), 122);
      expect(host.refusals.length).toBe(1);

      drag('drop', row('host'));
      expect(host.drops).toEqual([]);
      expect(el.querySelector('.strct-tree__refusal')).toBeNull();
    });

    it('a target that accepts clears the reason, and still takes the drop', () => {
      const { host, el, row, drag } = setupDnd({
        canDrop: (_s: StrctTreeNodeData, t: StrctTreeNodeData) => (t.id === 'host' ? reason : true),
      });
      drag('dragstart', row('vm-1'));
      drag('dragover', row('host'));
      expect(el.querySelector('.strct-tree__refusal')).toBeTruthy();

      drag('dragover', row('sub'));
      expect(el.querySelector('.strct-tree__refusal')).toBeNull();
      drag('drop', row('sub'));
      expect(host.drops.map((d) => d.target.id)).toEqual(['sub']);
    });

    it('a plain false still refuses with nothing said', () => {
      const { host, el, row, drag } = setupDnd({ canDrop: () => false });
      drag('dragstart', row('vm-1'));
      drag('dragover', row('host'));
      expect(el.querySelector('.strct-tree__refusal')).toBeNull();
      expect(host.refusals).toEqual([]);
      drag('drop', row('host'));
      expect(host.drops).toEqual([]);
    });
  });

  it('rows stay treeitems, focusable and operable while drag-and-drop is wired', () => {
    const { host, row, drag } = setupDnd();
    expect(row('vm-1').getAttribute('role')).toBe('treeitem');
    expect(row('vm-1').getAttribute('tabindex')).toBe('-1');
    drag('dragstart', row('vm-1'));
    row('host').click(); // a click during a drag still activates the row
    expect(host.drops).toEqual([]);
  });

  // FR-48-28
  it('frames the tree and bounds its height', () => {
    const fixture = TestBed.createComponent(StrctTree);
    fixture.componentRef.setInput('nodes', [{ id: 'a', label: 'A' }]);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.classList).not.toContain('strct-tree--framed');
    expect(el.style.maxHeight).toBe('');

    fixture.componentRef.setInput('framed', true);
    fixture.componentRef.setInput('maxHeight', 260);
    fixture.detectChanges();
    expect(el.classList).toContain('strct-tree--framed');
    expect(el.style.maxHeight).toBe('260px');
  });
});

// FR-58-05 / FR-58-06: trailing marks on a data node, and a node whose
// children have not been read yet.
describe('StrctTree data nodes', () => {
  const build = (nodes: StrctTreeNodeData[], loadingLabel?: string) => {
    const fixture = TestBed.createComponent(StrctTree);
    fixture.componentRef.setInput('nodes', nodes);
    if (loadingLabel !== undefined) fixture.componentRef.setInput('loadingLabel', loadingLabel);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    return {
      fixture,
      el,
      row: (id: string) =>
        el.querySelector<HTMLElement>(`[data-node-id="${id}"] > .strct-tnode__row`)!,
    };
  };

  it('draws a trailing tag and a quiet meta on the row', () => {
    const { row } = build([
      { id: 'vm', label: 'VM 1', meta: '4 vCPU', tag: { label: 'Running', status: 'success' } },
    ]);
    const r = row('vm');
    const tag = r.querySelector('.strct-tnode__tag')!;
    expect(tag.textContent?.trim()).toBe('Running');
    expect(tag.classList).toContain('strct-badge--success');
    expect(r.querySelector('.strct-tnode__meta')?.textContent?.trim()).toBe('4 vCPU');
    // They follow the label, and the label is still the row's first text.
    expect(r.textContent?.trim().startsWith('VM 1')).toBe(true);
  });

  it('a tag without a status falls back to neutral, and no marks means no markup', () => {
    const { row } = build([
      { id: 'a', label: 'A', tag: { label: 'Draft' } },
      { id: 'b', label: 'B' },
    ]);
    const tag = row('a').querySelector('.strct-tnode__tag')!;
    expect([...tag.classList].some((c) => c.startsWith('strct-badge--'))).toBe(false);
    expect(row('b').querySelector('.strct-tnode__tag')).toBeNull();
    expect(row('b').querySelector('.strct-tnode__meta')).toBeNull();
  });

  it('hasChildren gives a chevron and aria-expanded before the children arrive', () => {
    const { fixture, el, row } = build([{ id: 'host', label: 'Host', hasChildren: true }]);
    const r = row('host');
    expect(r.querySelector('.strct-tnode__chevron')).toBeTruthy();
    expect(r.getAttribute('aria-expanded')).toBe('false');

    const toggled: { node: StrctTreeNodeData; expanded: boolean }[] = [];
    fixture.componentInstance.nodeToggled.subscribe((e) => toggled.push(e));
    r.querySelector<HTMLElement>('.strct-tnode__chevron')!.click();
    fixture.detectChanges();
    // It opens and asks for its listing, with no children to show yet.
    expect(r.getAttribute('aria-expanded')).toBe('true');
    expect(toggled).toEqual([
      { node: { id: 'host', label: 'Host', hasChildren: true }, expanded: true },
    ]);
    expect(el.querySelectorAll('.strct-tnode').length).toBe(1);
  });

  it('shows one quiet row while the children are being read, then the children', () => {
    const { fixture, el, row } = build(
      [{ id: 'host', label: 'Host', hasChildren: true, loading: true, expanded: true }],
      'Reading…',
    );
    expect(row('host').getAttribute('aria-busy')).toBe('true');
    const loading = el.querySelector('.strct-tnode__loading')!;
    expect(loading.textContent).toContain('Reading…');
    expect(loading.querySelector('.strct-spinner')?.getAttribute('aria-label')).toBe('Reading…');

    fixture.componentRef.setInput('nodes', [
      {
        id: 'host',
        label: 'Host',
        hasChildren: true,
        expanded: true,
        children: [{ id: 'vm', label: 'VM 1' }],
      },
    ]);
    fixture.detectChanges();
    expect(el.querySelector('.strct-tnode__loading')).toBeNull();
    expect(row('host').getAttribute('aria-busy')).toBeNull();
    expect(row('vm').textContent).toContain('VM 1');
  });

  it('a node that turns out to be empty loses its chevron', () => {
    const { fixture, row } = build([
      { id: 'host', label: 'Host', hasChildren: true, expanded: true },
    ]);
    expect(row('host').querySelector('.strct-tnode__chevron')).toBeTruthy();

    fixture.componentRef.setInput('nodes', [
      { id: 'host', label: 'Host', hasChildren: false, expanded: true, children: [] },
    ]);
    fixture.detectChanges();
    const r = row('host');
    expect(r.querySelector('.strct-tnode__chevron')).toBeNull();
    expect(r.querySelector('.strct-tnode__spacer')).toBeTruthy();
    expect(r.getAttribute('aria-expanded')).toBeNull();
  });
});
