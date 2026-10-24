import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { StrctResizeHandle } from './resize-handle';

@Component({
  imports: [StrctResizeHandle],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <div
      [strctResizeHandle]="'y'"
      [(size)]="height"
      [min]="120"
      [max]="600"
      collapsible
      aria-label="Resize the task panel"
    ></div>
  `,
})
class Host {
  height = signal(240);
}

function build() {
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  const el = (fixture.nativeElement as HTMLElement).querySelector('.strct-resize') as HTMLElement;
  return { fixture, el };
}

describe('StrctResizeHandle', () => {
  it('is a separator with the splitter’s semantics', () => {
    const { el } = build();
    expect(el.getAttribute('role')).toBe('separator');
    expect(el.getAttribute('tabindex')).toBe('0');
    expect(el.getAttribute('aria-orientation')).toBe('horizontal');
    expect(el.getAttribute('aria-valuenow')).toBe('240');
    expect(el.getAttribute('aria-valuemin')).toBe('120');
    expect(el.getAttribute('aria-valuemax')).toBe('600');
    expect(el.getAttribute('aria-label')).toBe('Resize the task panel');
    expect(el.classList).toContain('strct-resize--y');
  });

  it('steps with the arrows, four times with Shift, and clamps', () => {
    const { fixture, el } = build();
    const key = (key: string, shiftKey = false) => {
      el.dispatchEvent(new KeyboardEvent('keydown', { key, shiftKey }));
      fixture.detectChanges();
    };
    key('ArrowDown');
    expect(fixture.componentInstance.height()).toBe(256);
    key('ArrowUp', true);
    expect(fixture.componentInstance.height()).toBe(192);
    key('Home');
    expect(fixture.componentInstance.height()).toBe(120);
    key('ArrowUp');
    expect(fixture.componentInstance.height()).toBe(120); // clamped at min
    key('End');
    expect(fixture.componentInstance.height()).toBe(600);
  });

  it('collapses with Enter and restores on the next step', () => {
    const { fixture, el } = build();
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    fixture.detectChanges();
    // Value text and a value of 0, not aria-expanded, which a separator may
    // not carry (axe aria-allowed-attr).
    expect(el.hasAttribute('aria-expanded')).toBe(false);
    expect(el.getAttribute('aria-valuetext')).toBe('Collapsed');
    expect(el.getAttribute('aria-valuenow')).toBe('0');
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    fixture.detectChanges();
    expect(el.getAttribute('aria-valuetext')).toBeNull();
    expect(el.getAttribute('data-collapsed')).toBe('false');
    expect(fixture.componentInstance.height()).toBe(256);
  });
});
