import { TestBed } from '@angular/core/testing';
import { StrctSparkline } from './sparkline';

describe('StrctSparkline', () => {
  it('applies the base host class', () => {
    const fixture = TestBed.createComponent(StrctSparkline);
    fixture.componentRef.setInput('data', [1, 2, 3]);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).classList).toContain('strct-spark');
  });

  it('exposes role="img" with a localizable accessible name', () => {
    const fixture = TestBed.createComponent(StrctSparkline);
    fixture.componentRef.setInput('data', [1, 2, 3]);
    fixture.detectChanges();
    const svg = (fixture.nativeElement as HTMLElement).querySelector('svg')!;
    expect(svg.getAttribute('role')).toBe('img');
    expect(svg.getAttribute('aria-label')).toBe('Sparkline chart');

    fixture.componentRef.setInput('ariaLabel', 'Requests per minute');
    fixture.detectChanges();
    expect(svg.getAttribute('aria-label')).toBe('Requests per minute');
  });
});
