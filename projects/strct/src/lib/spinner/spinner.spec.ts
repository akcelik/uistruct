import { TestBed } from '@angular/core/testing';
import { StrctSpinner } from './spinner';

describe('StrctSpinner', () => {
  it('applies the strct-spinner host class', () => {
    const fixture = TestBed.createComponent(StrctSpinner);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.classList).toContain('strct-spinner');
  });

  it('applies the sm modifier class when size is sm', () => {
    const fixture = TestBed.createComponent(StrctSpinner);
    fixture.componentRef.setInput('size', 'sm');
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.classList).toContain('strct-spinner--sm');
  });

  it('applies the lg modifier class when size is lg', () => {
    const fixture = TestBed.createComponent(StrctSpinner);
    fixture.componentRef.setInput('size', 'lg');
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.classList).toContain('strct-spinner--lg');
  });
});
