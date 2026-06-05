import { TestBed } from '@angular/core/testing';
import { StrctChart } from './chart';

describe('StrctChart', () => {
  it('applies the base host class', () => {
    const fixture = TestBed.createComponent(StrctChart);
    fixture.componentRef.setInput('data', [1, 2, 3]);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).classList).toContain('strct-chart');
  });
});
