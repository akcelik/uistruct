import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { StrctSplitter } from './splitter';

@Component({
  imports: [StrctSplitter],
  template: `
    <strct-splitter style="width: 400px" [(split)]="split" [min]="20" [max]="80">
      <div strctPaneStart>list</div>
      <div strctPaneEnd>detail</div>
    </strct-splitter>
  `,
})
class HostComponent {
  split = signal(50);
}

function setup() {
  const fixture = TestBed.createComponent(HostComponent);
  fixture.detectChanges();
  const el = fixture.nativeElement as HTMLElement;
  return { fixture, host: fixture.componentInstance, el };
}

describe('StrctSplitter', () => {
  it('renders both panes and a keyboard separator with value semantics', () => {
    const { el } = setup();
    const gutter = el.querySelector('.strct-split__gutter')!;
    expect(gutter.getAttribute('role')).toBe('separator');
    expect(gutter.getAttribute('aria-valuenow')).toBe('50');
    expect(gutter.getAttribute('aria-valuemin')).toBe('20');
    expect(gutter.getAttribute('aria-valuemax')).toBe('80');
    expect(el.textContent).toContain('list');
    expect(el.textContent).toContain('detail');
  });

  it('arrow keys nudge the split, Home/End jump to the bounds, all clamped', () => {
    const { fixture, host, el } = setup();
    const gutter = el.querySelector<HTMLElement>('.strct-split__gutter')!;
    gutter.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    fixture.detectChanges();
    expect(host.split()).toBe(53);
    gutter.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home' }));
    fixture.detectChanges();
    expect(host.split()).toBe(20);
    gutter.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
    fixture.detectChanges();
    expect(host.split()).toBe(20); // clamped at min
    gutter.dispatchEvent(new KeyboardEvent('keydown', { key: 'End' }));
    fixture.detectChanges();
    expect(host.split()).toBe(80);
  });

  it('the start pane takes the split percentage as flex-basis', () => {
    const { el } = setup();
    const pane = el.querySelector<HTMLElement>('.strct-split__pane')!;
    expect(pane.style.flexBasis).toBe('50%');
  });
});
