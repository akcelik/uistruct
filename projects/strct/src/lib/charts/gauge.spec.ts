import { TestBed } from '@angular/core/testing';
import { StrctGauge } from './gauge';

describe('StrctGauge', () => {
  it('applies the base host class', () => {
    const fixture = TestBed.createComponent(StrctGauge);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).classList).toContain('strct-gauge');
  });
});
