import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { StrctReorder, StrctReorderEvent, StrctReorderItem } from './reorder';

@Component({
  imports: [StrctReorder, StrctReorderItem],
  template: `
    <ul strctReorder (reordered)="move($event)">
      @for (item of items(); track item) {
        <li strctReorderItem>{{ item }}</li>
      }
    </ul>
  `,
})
class HostComponent {
  items = signal(['alpha', 'beta', 'gamma']);
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
  const rows = () => [...el.querySelectorAll<HTMLElement>('[strctReorderItem]')];
  const labels = () => rows().map((r) => r.textContent!.trim());
  return { fixture, host: fixture.componentInstance, rows, labels };
}

describe('StrctReorder', () => {
  it('items are draggable, focusable and marked sortable', () => {
    const { rows } = setup();
    const first = rows()[0];
    expect(first.getAttribute('draggable')).toBe('true');
    expect(first.getAttribute('tabindex')).toBe('0');
    expect(first.getAttribute('aria-roledescription')).toBe('sortable');
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
});
