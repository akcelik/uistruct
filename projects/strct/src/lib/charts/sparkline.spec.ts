import { TestBed } from '@angular/core/testing';
import { StrctSparkline } from './sparkline';

describe('StrctSparkline', () => {
  it('applies the base host class', () => {
    const fixture = TestBed.createComponent(StrctSparkline);
    fixture.componentRef.setInput('data', [1, 2, 3]);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).classList).toContain('strct-spark');
  });
});
