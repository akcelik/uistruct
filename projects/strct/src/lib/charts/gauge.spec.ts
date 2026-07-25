import { TestBed } from '@angular/core/testing';
import { StrctGauge } from './gauge';

describe('StrctGauge', () => {
  it('applies the base host class', () => {
    const fixture = TestBed.createComponent(StrctGauge);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).classList).toContain('strct-gauge');
  });

  it('exposes a role="meter" with value bounds and an accessible name', () => {
    const fixture = TestBed.createComponent(StrctGauge);
    fixture.componentRef.setInput('value', 72);
    fixture.detectChanges();
    const meter = (fixture.nativeElement as HTMLElement).querySelector('[role="meter"]')!;
    expect(meter.getAttribute('aria-valuenow')).toBe('72');
    expect(meter.getAttribute('aria-valuemin')).toBe('0');
    expect(meter.getAttribute('aria-valuemax')).toBe('100');
    expect(meter.getAttribute('aria-label')).toBe('Gauge');
    expect(
      (fixture.nativeElement as HTMLElement).querySelector('svg')!.getAttribute('aria-hidden'),
    ).toBe('true');
  });

  it('honours a custom ariaLabel', () => {
    const fixture = TestBed.createComponent(StrctGauge);
    fixture.componentRef.setInput('ariaLabel', 'CPU usage');
    fixture.detectChanges();
    const meter = (fixture.nativeElement as HTMLElement).querySelector('[role="meter"]')!;
    expect(meter.getAttribute('aria-label')).toBe('CPU usage');
  });

  describe('thresholds', () => {
    function valueStroke(value: number, thresholds: unknown, status?: string): string | null {
      const fixture = TestBed.createComponent(StrctGauge);
      fixture.componentRef.setInput('value', value);
      fixture.componentRef.setInput('thresholds', thresholds);
      if (status) fixture.componentRef.setInput('status', status);
      fixture.detectChanges();
      return (fixture.nativeElement as HTMLElement)
        .querySelector('.strct-gauge__value')!
        .getAttribute('stroke');
    }

    it('derives the arc color from the value when thresholds are set', () => {
      const t = { warning: 80, critical: 90 };
      expect(valueStroke(95, t)).toBe('var(--critical)');
      expect(valueStroke(85, t)).toBe('var(--warning)');
      expect(valueStroke(40, t)).toBe('var(--success)');
    });

    it('uses the explicit status when no thresholds are set', () => {
      expect(valueStroke(95, null, 'accent')).toBe('var(--acc)');
    });
  });
});
