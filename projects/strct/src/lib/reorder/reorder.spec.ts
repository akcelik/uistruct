import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  StrctReorder,
  StrctReorderEvent,
  StrctReorderItem,
  StrctReorderGroup,
  StrctReorderHandle,
  StrctReorderMoveEvent,
} from './reorder';

@Component({
  imports: [StrctReorder, StrctReorderItem],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <ul strctReorder [instructions]="hint()" [announcement]="announce()" (reordered)="move($event)">
      @for (item of items(); track item) {
        <li strctReorderItem>{{ item }}</li>
      }
    </ul>
  `,
})
class HostComponent {
  items = signal(['alpha', 'beta', 'gamma']);
  hint = signal('Press Alt+ArrowUp or Alt+ArrowDown to move this item');
  announce = signal(
    (label: string, position: number, total: number) =>
      `Moved ${label} to position ${position} of ${total}`,
  );
  move(e: StrctReorderEvent): void {
    this.items.update((list) => {
      const next = [...list];
      next.splice(e.to, 0, ...next.splice(e.from, 1));
      return next;
    });
  }
}

function setup() {
  const fixture = TestBed.createComponent(HostComponent);
  fixture.detectChanges();
  const el = fixture.nativeElement as HTMLElement;
  const list = () => el.querySelector('ul')!;
  const rows = () => [...el.querySelectorAll<HTMLElement>('[strctReorderItem]')];
  const labels = () => rows().map((r) => r.textContent!.trim());
  return { fixture, host: fixture.componentInstance, list, rows, labels };
}

describe('StrctReorder', () => {
  it('items are draggable, focusable and marked sortable', () => {
    const { rows } = setup();
    const first = rows()[0];
    expect(first.getAttribute('draggable')).toBe('true');
    expect(first.getAttribute('tabindex')).toBe('0');
    expect(first.getAttribute('aria-roledescription')).toBe('sortable');
  });

  it('items expose keyboard shortcuts and set position semantics', () => {
    const { rows } = setup();
    const [a, b] = rows();
    expect(a.getAttribute('aria-keyshortcuts')).toBe('Alt+ArrowUp Alt+ArrowDown');
    expect(a.getAttribute('aria-posinset')).toBe('1');
    expect(b.getAttribute('aria-posinset')).toBe('2');
    expect(a.getAttribute('aria-setsize')).toBe('3');
  });

  it('renders localizable sr-only instructions referenced by aria-describedby', () => {
    const { fixture, host, rows } = setup();
    const id = rows()[0].getAttribute('aria-describedby')!;
    expect(document.getElementById(id)!.textContent).toBe(
      'Press Alt+ArrowUp or Alt+ArrowDown to move this item',
    );
    host.hint.set('Alt+Pfeiltasten zum Verschieben');
    fixture.detectChanges();
    expect(document.getElementById(id)!.textContent).toBe('Alt+Pfeiltasten zum Verschieben');
  });

  it('drag from one row to another emits and the consumer array reorders', () => {
    const { fixture, rows, labels } = setup();
    const [a, , c] = rows();
    a.dispatchEvent(new Event('dragstart') as DragEvent);
    c.dispatchEvent(new Event('dragover', { cancelable: true }) as DragEvent);
    c.dispatchEvent(new Event('drop', { cancelable: true }) as DragEvent);
    fixture.detectChanges();
    expect(labels()).toEqual(['beta', 'gamma', 'alpha']);
  });

  it('a bubbled item drop is not committed twice by the container', () => {
    const { fixture, rows, labels } = setup();
    const [a, , c] = rows();
    a.dispatchEvent(new Event('dragstart') as DragEvent);
    c.dispatchEvent(new Event('drop', { cancelable: true, bubbles: true }) as DragEvent);
    fixture.detectChanges();
    expect(labels()).toEqual(['beta', 'gamma', 'alpha']);
  });

  it('dropping into empty container space moves the item to the end', () => {
    const { fixture, rows, list, labels } = setup();
    rows()[0].dispatchEvent(new Event('dragstart') as DragEvent);
    list().dispatchEvent(new Event('dragover', { cancelable: true }) as DragEvent);
    list().dispatchEvent(new Event('drop', { cancelable: true }) as DragEvent);
    fixture.detectChanges();
    expect(labels()).toEqual(['beta', 'gamma', 'alpha']);
  });

  it('clears the drop highlight when the drag leaves the container', () => {
    const { fixture, rows, list } = setup();
    const [a, , c] = rows();
    a.dispatchEvent(new Event('dragstart') as DragEvent);
    c.dispatchEvent(new Event('dragover', { cancelable: true }) as DragEvent);
    fixture.detectChanges();
    expect(c.classList.contains('strct-reorder--over')).toBe(true);
    const leave = new Event('dragleave') as DragEvent;
    Object.defineProperty(leave, 'relatedTarget', { value: document.body });
    list().dispatchEvent(leave);
    fixture.detectChanges();
    expect(c.classList.contains('strct-reorder--over')).toBe(false);
  });

  it('keeps the drop highlight when moving between children', () => {
    const { fixture, rows, list } = setup();
    const [a, b, c] = rows();
    a.dispatchEvent(new Event('dragstart') as DragEvent);
    c.dispatchEvent(new Event('dragover', { cancelable: true }) as DragEvent);
    fixture.detectChanges();
    const leave = new Event('dragleave') as DragEvent;
    Object.defineProperty(leave, 'relatedTarget', { value: b });
    list().dispatchEvent(leave);
    fixture.detectChanges();
    expect(c.classList.contains('strct-reorder--over')).toBe(true);
  });

  it('Alt+Arrow moves the focused row by one', () => {
    const { fixture, rows, labels } = setup();
    rows()[1].dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowUp', altKey: true, bubbles: true }),
    );
    fixture.detectChanges();
    expect(labels()).toEqual(['beta', 'alpha', 'gamma']);
    // Out-of-range moves are ignored.
    rows()[0].dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowUp', altKey: true, bubbles: true }),
    );
    fixture.detectChanges();
    expect(labels()).toEqual(['beta', 'alpha', 'gamma']);
  });

  it('announces a completed move in the live region', async () => {
    const { rows } = setup();
    rows()[1].dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowUp', altKey: true, bubbles: true }),
    );
    await new Promise((r) => setTimeout(r, 10));
    expect(document.querySelector('.strct-announcer')!.textContent).toBe(
      'Moved beta to position 1 of 3',
    );
  });

  it('announcement text is localizable', async () => {
    const { fixture, host, rows } = setup();
    host.announce.set((label, position, total) => `${label} verschoben nach ${position}/${total}`);
    fixture.detectChanges();
    rows()[1].dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowUp', altKey: true, bubbles: true }),
    );
    await new Promise((r) => setTimeout(r, 10));
    expect(document.querySelector('.strct-announcer')!.textContent).toBe(
      'beta verschoben nach 1/3',
    );
  });

  it('parses reorderDisabled="false" as false (booleanAttribute)', () => {
    @Component({
      imports: [StrctReorder, StrctReorderItem],
      template: `
        <ul strctReorder reorderDisabled="false">
          <li strctReorderItem>alpha</li>
        </ul>
      `,
    })
    class DisabledHost {}

    const fixture = TestBed.createComponent(DisabledHost);
    fixture.detectChanges();
    const item = fixture.nativeElement.querySelector('[strctReorderItem]') as HTMLElement;
    expect(item.getAttribute('draggable')).toBe('true');
  });
});

// FR-48-36 — a board's cards move within a column and between columns.
@Component({
  imports: [StrctReorder, StrctReorderItem, StrctReorderGroup, StrctReorderHandle],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <div strctReorderGroup (moved)="moves.push($event)">
      <div strctReorder listId="left">
        @for (c of left(); track c) {
          <div strctReorderItem class="card">
            <span strctReorderHandle class="grip"></span>
            {{ c }}
          </div>
        }
      </div>
      <div strctReorder listId="right">
        @for (c of right(); track c) {
          <div strctReorderItem class="card">
            <span strctReorderHandle class="grip"></span>
            {{ c }}
          </div>
        }
      </div>
    </div>
  `,
})
class BoardHost {
  left = signal(['Capacity', 'Alarms']);
  right = signal(['Storage']);
  moves: StrctReorderMoveEvent[] = [];
}

describe('StrctReorder — connected lists and a handle (FR-48-36)', () => {
  function build() {
    const fixture = TestBed.createComponent(BoardHost);
    fixture.detectChanges();
    return { fixture, el: fixture.nativeElement as HTMLElement };
  }

  it('moves a card to the neighbouring list with Alt+ArrowRight', () => {
    const { fixture, el } = build();
    const card = el.querySelectorAll('.card')[0] as HTMLElement;
    card.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight', altKey: true, bubbles: true }),
    );
    fixture.detectChanges();
    const moves = fixture.componentInstance.moves;
    expect(moves.length).toBe(1);
    expect(moves[0].fromList).toBe('left');
    expect(moves[0].toList).toBe('right');
    expect(moves[0].fromIndex).toBe(0);
    expect(moves[0].toIndex).toBe(0);
    expect(moves[0].item.textContent).toContain('Capacity');
  });

  it('has nowhere to go past the last list', () => {
    const { fixture, el } = build();
    const card = el.querySelectorAll('.card')[2] as HTMLElement; // in the right list
    card.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight', altKey: true, bubbles: true }),
    );
    fixture.detectChanges();
    expect(fixture.componentInstance.moves.length).toBe(0);
  });

  it('advertises the sideways shortcuts only inside a group', () => {
    const { el } = build();
    expect((el.querySelector('.card') as HTMLElement).getAttribute('aria-keyshortcuts')).toBe(
      'Alt+ArrowUp Alt+ArrowDown Alt+ArrowLeft Alt+ArrowRight',
    );
  });

  it('starts a drag only from the handle', () => {
    const { el } = build();
    const card = el.querySelector('.card') as HTMLElement;
    const grip = card.querySelector('.grip') as HTMLElement;

    // pointerdown on the card body: the drag is refused
    card.dispatchEvent(new Event('pointerdown', { bubbles: true }) as PointerEvent);
    const refused = new Event('dragstart', { bubbles: true, cancelable: true }) as DragEvent;
    card.dispatchEvent(refused);
    expect(refused.defaultPrevented).toBe(true);

    // pointerdown on the handle: the drag starts
    grip.dispatchEvent(new Event('pointerdown', { bubbles: true }) as PointerEvent);
    const allowed = new Event('dragstart', { bubbles: true, cancelable: true }) as DragEvent;
    card.dispatchEvent(allowed);
    expect(allowed.defaultPrevented).toBe(false);
  });
});

// BUG-49-09 — a display-only list must not announce itself as sortable.
@Component({
  imports: [StrctReorder, StrctReorderItem],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <ul strctReorder [reorderDisabled]="disabled()">
      <li strctReorderItem>A</li>
      <li strctReorderItem>B</li>
    </ul>
  `,
})
class DisabledHost {
  disabled = signal(true);
}

describe('StrctReorderItem — reorderDisabled', () => {
  it('drops the tab stop and the sorting semantics while disabled', () => {
    const fixture = TestBed.createComponent(DisabledHost);
    fixture.detectChanges();
    const item = (fixture.nativeElement as HTMLElement).querySelector('li') as HTMLElement;
    expect(item.getAttribute('tabindex')).toBeNull();
    expect(item.getAttribute('aria-roledescription')).toBeNull();
    expect(item.getAttribute('aria-keyshortcuts')).toBeNull();
    expect(item.getAttribute('aria-describedby')).toBeNull();
    expect(item.getAttribute('draggable')).toBe('false');

    fixture.componentInstance.disabled.set(false);
    fixture.detectChanges();
    expect(item.getAttribute('tabindex')).toBe('0');
    expect(item.getAttribute('aria-roledescription')).toBe('sortable');
  });
});
