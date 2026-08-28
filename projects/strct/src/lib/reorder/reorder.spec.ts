import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { StrctReorder, StrctReorderEvent, StrctReorderItem } from './reorder';

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
