import { TestBed } from '@angular/core/testing';
import { StrctProgress } from './progress';

describe('StrctProgress', () => {
  function fillWidth(fixture: ReturnType<typeof TestBed.createComponent<StrctProgress>>): string {
    return (fixture.nativeElement.querySelector('.strct-progress__fill') as HTMLElement).style
      .width;
  }

  it('clamps the value between 0 and 100', () => {
    const fixture = TestBed.createComponent(StrctProgress);
    fixture.componentRef.setInput('value', 140);
    fixture.detectChanges();
    expect(fillWidth(fixture)).toBe('100%');

    fixture.componentRef.setInput('value', -10);
    fixture.detectChanges();
    expect(fillWidth(fixture)).toBe('0%');

    fixture.componentRef.setInput('value', 42);
    fixture.detectChanges();
    expect(fillWidth(fixture)).toBe('42%');
  });

  it('reflects the status on the host', () => {
    const fixture = TestBed.createComponent(StrctProgress);
    fixture.componentRef.setInput('status', 'critical');
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).classList).toContain('strct-progress--critical');
  });

  describe('thresholds', () => {
    function classesFor(value: number, thresholds: unknown, status?: string): DOMTokenList {
      const fixture = TestBed.createComponent(StrctProgress);
      fixture.componentRef.setInput('value', value);
      fixture.componentRef.setInput('thresholds', thresholds);
      if (status) fixture.componentRef.setInput('status', status);
      fixture.detectChanges();
      return (fixture.nativeElement as HTMLElement).classList;
    }

    it('derives status from the value when thresholds are set', () => {
      const t = { warning: 80, critical: 90 };
      expect(classesFor(95, t)).toContain('strct-progress--critical');
      expect(classesFor(85, t)).toContain('strct-progress--warning');
      // Below warning and status left at default → success (not accent).
      const healthy = classesFor(40, t);
      expect(healthy).toContain('strct-progress--success');
      expect(healthy).not.toContain('strct-progress--warning');
    });

    it('keeps an explicit status as the healthy base below the warning threshold', () => {
      const healthy = classesFor(40, { warning: 80, critical: 90 }, 'warning');
      expect(healthy).toContain('strct-progress--warning');
    });

    it('falls back to the explicit status when no thresholds are set', () => {
      const cls = classesFor(95, null, 'accent');
      expect(cls).not.toContain('strct-progress--critical');
      expect(cls).not.toContain('strct-progress--success');
    });
  });
});

describe('StrctProgress — the track stays visible on its surface (FR-47-01)', () => {
  it('tints the foreground instead of painting a fixed surface token, and rings the length', () => {
    const fixture = TestBed.createComponent(StrctProgress);
    fixture.componentRef.setInput('value', 37);
    fixture.detectChanges();
    const track = fixture.nativeElement.querySelector('.strct-progress__track') as HTMLElement;
    const style = getComputedStyle(track);
    // --bg-3 is exactly a datagrid row's ground in the dark theme, so the track
    // used to disappear there; a foreground tint steps off any surface.
    expect(style.background).not.toContain('var(--bg-3)');
    expect(style.background + style.backgroundColor).toContain('--t1');
    expect(style.boxShadow).toContain('inset');
  });

  it('exposes --strct-progress-track as the override, with the tint as its fallback', () => {
    const fixture = TestBed.createComponent(StrctProgress);
    fixture.detectChanges();
    const track = fixture.nativeElement.querySelector('.strct-progress__track') as HTMLElement;
    // jsdom does not resolve var(); it hands back the declaration, which is
    // what this pins. The resolved colours are measured in Chrome (see the PR).
    expect(getComputedStyle(track).background).toContain('var(--strct-progress-track,');
  });
});

describe('StrctProgress — meter mode (FR-48-18)', () => {
  function make(inputs: Record<string, unknown>) {
    const fixture = TestBed.createComponent(StrctProgress);
    for (const [k, v] of Object.entries(inputs)) fixture.componentRef.setInput(k, v);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }
  const track = (el: HTMLElement) => el.querySelector('.strct-progress__track')!;
  const fills = (el: HTMLElement) =>
    [...el.querySelectorAll<HTMLElement>('.strct-progress__fill')].map((f) => f.style.width);

  it('renders the Overview capacity row: label, value and caption around the bar', () => {
    const el = make({
      value: 57,
      label: 'Memory',
      visibleLabel: true,
      showValue: true,
      valueText: '293 GB of 512 GB',
      caption: '219 GB free across 2 nodes',
    });
    expect(el.querySelector('.strct-progress__label')!.textContent!.trim()).toBe('Memory');
    expect(el.querySelector('.strct-progress__value')!.textContent!.trim()).toBe(
      '293 GB of 512 GB',
    );
    expect(el.querySelector('.strct-progress__caption')!.textContent!.trim()).toBe(
      '219 GB free across 2 nodes',
    );
    // The label stays the accessible name; the text becomes the value.
    expect(track(el).getAttribute('aria-label')).toBe('Memory');
    expect(track(el).getAttribute('aria-valuetext')).toBe('293 GB of 512 GB');
  });

  it('showValue without valueText prints the percentage', () => {
    expect(
      make({ value: 42, showValue: true })
        .querySelector('.strct-progress__value')!
        .textContent!.trim(),
    ).toBe('42%');
  });

  it('stacks segments, clamps their sum to the track, and names them to a screen reader', () => {
    const el = make({
      segments: [
        { value: 61, status: 'accent', label: 'Used' },
        { value: 22, status: 'warning', label: 'Arriving' },
      ],
    });
    expect(fills(el)).toEqual(['61%', '22%']);
    expect(track(el).getAttribute('aria-valuetext')).toBe('Used 61%, Arriving 22%');
    expect(el.querySelectorAll('.strct-progress__fill--warning').length).toBe(1);

    // A total over 100 cannot overflow the track.
    const over = make({ segments: [{ value: 80 }, { value: 50 }] });
    expect(fills(over)).toEqual(['80%', '20%']);
  });

  it('indeterminate drops the numeric value and says it is running', () => {
    const el = make({ indeterminate: true, value: 40 });
    expect(el.querySelector('.strct-progress__fill--indeterminate')).toBeTruthy();
    expect(track(el).hasAttribute('aria-valuenow')).toBe(false);
    expect(track(el).getAttribute('aria-valuetext')).toBe('In progress');
  });

  it('status="neutral" is a real tone for queued / idle', () => {
    expect(make({ status: 'neutral', value: 10 }).classList).toContain('strct-progress--neutral');
  });

  it('defaults are unchanged: one fill, a value, no extra rows', () => {
    const el = make({ value: 30 });
    expect(fills(el)).toEqual(['30%']);
    expect(el.querySelector('.strct-progress__row')).toBeNull();
    expect(el.querySelector('.strct-progress__caption')).toBeNull();
    expect(track(el).getAttribute('aria-valuenow')).toBe('30');
    expect(track(el).hasAttribute('aria-valuetext')).toBe(false);
  });
});
