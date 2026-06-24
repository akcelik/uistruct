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
