import { TestBed } from '@angular/core/testing';
import { StrctDivider } from './divider';

describe('StrctDivider', () => {
  it('applies the host class', () => {
    const fixture = TestBed.createComponent(StrctDivider);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.classList).toContain('strct-divider');
  });

  it('adds the vertical modifier when vertical input is true', () => {
    const fixture = TestBed.createComponent(StrctDivider);
    fixture.componentRef.setInput('vertical', true);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.classList).toContain('strct-divider--vertical');
  });
});
