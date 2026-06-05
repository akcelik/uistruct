import { TestBed } from '@angular/core/testing';
import { StrctTimeline, StrctTimelineItem } from './timeline';

describe('StrctTimeline', () => {
  it('applies the base host class', () => {
    const fixture = TestBed.createComponent(StrctTimeline);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).classList).toContain('strct-tl');
  });
});

describe('StrctTimelineItem', () => {
  it('applies the base host class', () => {
    const fixture = TestBed.createComponent(StrctTimelineItem);
    fixture.componentRef.setInput('title', 'Step');
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).classList).toContain('strct-tli');
  });

  it('applies state modifier classes', () => {
    const fixture = TestBed.createComponent(StrctTimelineItem);
    fixture.componentRef.setInput('title', 'Step');
    fixture.componentRef.setInput('state', 'success');
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).classList).toContain('strct-tli--success');

    fixture.componentRef.setInput('state', 'warning');
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).classList).toContain('strct-tli--warning');

    fixture.componentRef.setInput('state', 'critical');
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).classList).toContain('strct-tli--critical');

    fixture.componentRef.setInput('state', 'current');
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).classList).toContain('strct-tli--current');
  });
});
