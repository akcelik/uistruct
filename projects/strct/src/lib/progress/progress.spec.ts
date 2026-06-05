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
});
