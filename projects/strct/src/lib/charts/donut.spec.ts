import { TestBed } from '@angular/core/testing';
import { StrctDonut } from './donut';

describe('StrctDonut', () => {
  it('applies the base host class', () => {
    const fixture = TestBed.createComponent(StrctDonut);
    fixture.componentRef.setInput('segments', [{ value: 1 }]);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).classList).toContain('strct-donut');
  });
});
