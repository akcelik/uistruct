import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { StrctSplitter } from './splitter';

@Component({
  imports: [StrctSplitter],
  changeDetection: ChangeDetectionStrategy.Eager,
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

  it('parses vertical="false" as false (booleanAttribute)', () => {
    @Component({
      imports: [StrctSplitter],
      template: `
        <strct-splitter vertical="false">
          <div strctPaneStart>list</div>
          <div strctPaneEnd>detail</div>
        </strct-splitter>
      `,
    })
    class VerticalHost {}

    const fixture = TestBed.createComponent(VerticalHost);
    fixture.detectChanges();
    const gutter = (fixture.nativeElement as HTMLElement).querySelector('.strct-split__gutter')!;
    expect(gutter.getAttribute('aria-orientation')).toBe('vertical');
  });

  // FR-48-35
  describe('pixel bounds and a collapsible pane', () => {
    function build(inputs: Record<string, unknown> = {}) {
      const fixture = TestBed.createComponent(StrctSplitter);
      for (const [k, v] of Object.entries(inputs)) fixture.componentRef.setInput(k, v);
      fixture.detectChanges();
      return { fixture, el: fixture.nativeElement as HTMLElement };
    }
    const pane = (el: HTMLElement) => el.querySelector('.strct-split__pane') as HTMLElement;
    const gutter = (el: HTMLElement) => el.querySelector('.strct-split__gutter') as HTMLElement;

    it('sizes the start pane in px and keeps it above minSize', () => {
      const { fixture, el } = build({ unit: 'px', split: 280, minSize: 200, maxSize: 480 });
      expect(pane(el).style.flexBasis).toBe('280px');
      fixture.componentRef.setInput('split', 40);
      fixture.detectChanges();
      expect(pane(el).style.flexBasis).toBe('200px');
      expect(gutter(el).getAttribute('aria-valuemin')).toBe('200');
      expect(gutter(el).getAttribute('aria-valuemax')).toBe('480');
    });

    it('steps in px with the arrow keys and jumps with Home / End', () => {
      const { fixture, el } = build({ unit: 'px', split: 280, minSize: 200, maxSize: 480 });
      const g = gutter(el);
      g.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
      fixture.detectChanges();
      expect(fixture.componentInstance.split()).toBe(304); // 3 × 8px
      g.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home' }));
      fixture.detectChanges();
      expect(fixture.componentInstance.split()).toBe(200);
      g.dispatchEvent(new KeyboardEvent('keydown', { key: 'End' }));
      fixture.detectChanges();
      expect(fixture.componentInstance.split()).toBe(480);
    });

    it('collapses and restores the pane with Enter', () => {
      const { fixture, el } = build({ unit: 'px', split: 280, collapsible: true });
      const g = gutter(el);
      expect(g.getAttribute('aria-expanded')).toBe('true');
      g.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
      fixture.detectChanges();
      expect(fixture.componentInstance.collapsed()).toBe(true);
      expect(pane(el).style.flexBasis).toBe('0px');
      expect(g.getAttribute('aria-expanded')).toBe('false');
      expect(g.getAttribute('aria-valuenow')).toBe('0');
      g.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
      fixture.detectChanges();
      expect(fixture.componentInstance.collapsed()).toBe(false);
      expect(pane(el).style.flexBasis).toBe('280px');
    });

    it('leaves percent mode as it was', () => {
      const { fixture, el } = build({ split: 50 });
      expect(pane(el).style.flexBasis).toBe('50%');
      const g = gutter(el);
      expect(g.getAttribute('aria-valuemin')).toBe('15');
      expect(g.getAttribute('aria-expanded')).toBeNull();
      g.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
      fixture.detectChanges();
      expect(fixture.componentInstance.split()).toBe(53);
    });
  });
});
