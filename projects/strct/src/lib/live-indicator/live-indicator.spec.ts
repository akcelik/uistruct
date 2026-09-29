import { TestBed } from '@angular/core/testing';
import { StrctLiveIndicator } from './live-indicator';

function build(inputs: Record<string, unknown> = {}) {
  const fixture = TestBed.createComponent(StrctLiveIndicator);
  for (const [k, v] of Object.entries(inputs)) fixture.componentRef.setInput(k, v);
  fixture.detectChanges();
  return { fixture, el: fixture.nativeElement as HTMLElement };
}

describe('StrctLiveIndicator', () => {
  it('is a polite status region', () => {
    const { el } = build();
    expect(el.getAttribute('role')).toBe('status');
    expect(el.getAttribute('aria-live')).toBe('polite');
  });

  it('switches wording and tone with the state', () => {
    const cases: [string, string, string][] = [
      ['live', 'Live', 'strct-dot--success'],
      ['connecting', 'Connecting…', 'strct-dot--accent'],
      ['reconnecting', 'Reconnecting…', 'strct-dot--warning'],
      ['paused', 'Paused', 'strct-dot--neutral'],
    ];
    for (const [state, text, tone] of cases) {
      const { el } = build({ state });
      expect(el.querySelector('.strct-live__text')?.textContent?.trim()).toBe(text);
      const dot = el.querySelector('strct-status-dot') as HTMLElement;
      if (tone !== 'strct-dot--neutral') expect(dot.classList).toContain(tone);
      expect(el.getAttribute('data-state')).toBe(state);
    }
  });

  it('only a live view pulses', () => {
    expect(
      (build({ state: 'live' }).el.querySelector('strct-status-dot') as HTMLElement).classList,
    ).toContain('strct-dot--pulse');
    expect(
      (build({ state: 'reconnecting' }).el.querySelector('strct-status-dot') as HTMLElement)
        .classList,
    ).not.toContain('strct-dot--pulse');
  });

  it('says how often a live view updates', () => {
    const { el } = build({ state: 'live', interval: 5000 });
    expect(el.textContent).toContain('Live · updates every 5 s');
  });

  it('reads a stale view as a relative time', () => {
    const { el } = build({ state: 'stale', updatedAt: Date.now() - 3 * 60_000 });
    expect(el.textContent).toContain('Last updated 3 min ago');
    const { el: hours } = build({ state: 'stale', updatedAt: Date.now() - 125 * 60_000 });
    expect(hours.textContent).toContain('Last updated 2 h ago');
    const { el: fresh } = build({ state: 'stale', updatedAt: Date.now() - 5_000 });
    expect(fresh.textContent).toContain('Last updated just now');
  });

  it('takes every string from labels', () => {
    const { el } = build({
      state: 'reconnecting',
      labels: { reconnecting: 'Yeniden bağlanıyor…' },
    });
    expect(el.textContent).toContain('Yeniden bağlanıyor…');
  });
});
