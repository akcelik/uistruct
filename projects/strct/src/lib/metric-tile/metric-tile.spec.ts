import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { StrctIcon } from '../icon/icon';
import { StrctMetricTile } from './metric-tile';

function make(inputs: Record<string, unknown>) {
  const f = TestBed.createComponent(StrctMetricTile);
  for (const [k, v] of Object.entries(inputs)) f.componentRef.setInput(k, v);
  f.detectChanges();
  return f;
}

describe('StrctMetricTile', () => {
  it('renders label, value and unit', () => {
    const host = make({ label: 'CPU', value: 62, unit: '%' }).nativeElement as HTMLElement;
    expect(host.querySelector('.strct-mt__label')?.textContent).toContain('CPU');
    expect(host.querySelector('.strct-mt__value')?.textContent).toContain('62');
    expect(host.querySelector('.strct-mt__unit')?.textContent).toContain('%');
  });

  it('shows a positive delta with the up tone', () => {
    const host = make({ label: 'X', value: 1, delta: 5 }).nativeElement as HTMLElement;
    expect(host.querySelector('.strct-mt__delta--up')).not.toBeNull();
  });

  it('inverts the delta tone when invertDelta is set', () => {
    const host = make({ label: 'Errors', value: 3, delta: 5, invertDelta: true })
      .nativeElement as HTMLElement;
    expect(host.querySelector('.strct-mt__delta--down')).not.toBeNull();
  });

  it('renders a flat glyph and "unchanged" for a zero delta', () => {
    const f = make({ label: 'X', value: 1, delta: 0 });
    const host = f.nativeElement as HTMLElement;
    expect(host.querySelector('.strct-mt__delta--flat')).not.toBeNull();
    expect(host.querySelector('.strct-mt__sr')?.textContent).toContain('unchanged');
    const icon = f.debugElement.query(By.directive(StrctIcon)).componentInstance as StrctIcon;
    expect(icon.name()).toBe('minus');
  });

  it('exposes the delta direction as visually-hidden text', () => {
    const host = make({ label: 'CPU', value: 62, delta: -4 }).nativeElement as HTMLElement;
    expect(host.querySelector('.strct-mt__sr')?.textContent).toContain('decreased by 4%');
  });

  it('allows localizing the delta text via deltaAriaLabel', () => {
    const host = make({
      label: 'X',
      value: 1,
      delta: 5,
      deltaAriaLabel: (d: number, s: string) => `+${d}${s}`,
    }).nativeElement as HTMLElement;
    expect(host.querySelector('.strct-mt__sr')?.textContent).toContain('+5%');
  });

  it('renders skeletons and marks the tile busy while loading', () => {
    const host = make({ label: 'CPU', value: 62, loading: true }).nativeElement as HTMLElement;
    expect(host.getAttribute('aria-busy')).toBe('true');
    expect(host.querySelector('.strct-mt__value')).toBeNull();
    expect(host.querySelector('strct-skeleton')).not.toBeNull();
  });

  it('hides the sparkline when data is empty', () => {
    const host = make({ label: 'X', value: 1 }).nativeElement as HTMLElement;
    expect(host.querySelector('.strct-mt__spark')).toBeNull();
  });

  // FR-48-21
  describe('actionable tiles, caption tone and the meter slot', () => {
    function tile(inputs: Record<string, unknown>) {
      const fixture = TestBed.createComponent(StrctMetricTile);
      fixture.componentRef.setInput('label', 'Alarms');
      fixture.componentRef.setInput('value', 7);
      for (const [k, v] of Object.entries(inputs)) fixture.componentRef.setInput(k, v);
      fixture.detectChanges();
      return { fixture, el: fixture.nativeElement as HTMLElement };
    }

    it('renders a link that covers the tile and names the KPI', () => {
      const { el } = tile({ href: '/alarms' });
      const hit = el.querySelector('a.strct-mt__hit') as HTMLAnchorElement;
      expect(hit).toBeTruthy();
      expect(hit.getAttribute('href')).toBe('/alarms');
      expect(hit.getAttribute('aria-label')).toBe('Alarms: 7');
      expect(el.classList).toContain('strct-mt--actionable');
    });

    it('renders a button that emits activated', () => {
      const { fixture, el } = tile({ interactive: true });
      let n = 0;
      fixture.componentInstance.activated.subscribe(() => n++);
      (el.querySelector('button.strct-mt__hit') as HTMLElement).click();
      expect(n).toBe(1);
    });

    it('tints only the caption with captionStatus', () => {
      const { el } = tile({ caption: '2 down', captionStatus: 'warning' });
      expect(el.querySelector('.strct-mt__caption')?.classList).toContain(
        'strct-mt__caption--warning',
      );
      expect(el.querySelector('.strct-mt__value')?.classList).toContain('strct-mt__value--neutral');
    });

    it('is a plain tile by default', () => {
      const { el } = tile({});
      expect(el.querySelector('.strct-mt__hit')).toBeNull();
      expect(el.classList).not.toContain('strct-mt--actionable');
    });
  });
});

// FR-49-14 — the tone was the value's alone, and href reloaded the whole app.
describe('StrctMetricTile — status rail and in-app navigation', () => {
  function make(inputs: Record<string, unknown> = {}) {
    const fixture = TestBed.createComponent(StrctMetricTile);
    fixture.componentRef.setInput('label', 'Alarms');
    fixture.componentRef.setInput('value', 3);
    for (const [k, v] of Object.entries(inputs)) fixture.componentRef.setInput(k, v);
    fixture.detectChanges();
    return { fixture, el: fixture.nativeElement as HTMLElement };
  }

  it('marks the whole tile with its status, and says nothing when neutral', () => {
    const neutral = make();
    expect(neutral.el.classList).not.toContain('strct-mt--status');
    expect(neutral.el.getAttribute('data-status')).toBeNull();

    const critical = make({ status: 'critical' });
    expect(critical.el.classList).toContain('strct-mt--status');
    expect(critical.el.getAttribute('data-status')).toBe('critical');
    // The value keeps its own tone as well.
    expect(critical.el.querySelector('.strct-mt__value--critical')).toBeTruthy();
  });

  it('navigate="app" hands a plain click to the consumer and leaves the rest to the browser', () => {
    const { fixture, el } = make({ href: '/alarms', navigate: 'app' });
    let activated = 0;
    fixture.componentInstance.activated.subscribe(() => activated++);
    const link = el.querySelector('a.strct-mt__hit') as HTMLAnchorElement;
    expect(link.getAttribute('href')).toBe('/alarms');

    const plain = new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 });
    link.dispatchEvent(plain);
    expect(plain.defaultPrevented).toBe(true);
    expect(activated).toBe(1);

    // "Open in a new tab" is the browser's, not ours.
    for (const mod of ['metaKey', 'ctrlKey', 'shiftKey', 'altKey'] as const) {
      const e = new MouseEvent('click', { bubbles: true, cancelable: true, [mod]: true });
      link.dispatchEvent(e);
      expect(e.defaultPrevented).toBe(false);
    }
    const middle = new MouseEvent('click', { bubbles: true, cancelable: true, button: 1 });
    link.dispatchEvent(middle);
    expect(middle.defaultPrevented).toBe(false);
    expect(activated).toBe(1);
  });

  it('follows the link as before by default', () => {
    const { fixture, el } = make({ href: '/alarms' });
    let activated = 0;
    fixture.componentInstance.activated.subscribe(() => activated++);
    const e = new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 });
    (el.querySelector('a.strct-mt__hit') as HTMLAnchorElement).dispatchEvent(e);
    expect(e.defaultPrevented).toBe(false);
    expect(activated).toBe(0);
  });
});
