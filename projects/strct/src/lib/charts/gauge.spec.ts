import { TestBed } from '@angular/core/testing';
import { StrctGauge } from './gauge';

describe('StrctGauge', () => {
  it('applies the base host class', () => {
    const fixture = TestBed.createComponent(StrctGauge);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).classList).toContain('strct-gauge');
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
