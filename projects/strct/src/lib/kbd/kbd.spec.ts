import { TestBed } from '@angular/core/testing';
import { StrctKbd } from './kbd';

describe('StrctKbd', () => {
  it('renders projected content inside a kbd element', () => {
    const fixture = TestBed.createComponent(StrctKbd);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('kbd')).toBeTruthy();
    expect((fixture.nativeElement as HTMLElement).classList).toContain('strct-kbd');
  });
});
