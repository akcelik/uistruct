import { TestBed } from '@angular/core/testing';
import { StrctRange } from './range';
describe('StrctRange', () => {
  it('renders the host element', () => {
    const fixture = TestBed.createComponent(StrctRange);
    fixture.detectChanges();
    expect(fixture.nativeElement).toBeTruthy();
  });

  it('contains the strct-range__input class in its template', () => {
    const fixture = TestBed.createComponent(StrctRange);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.strct-range__input')).toBeTruthy();
  });

  it('implements CVA', () => {
    const fixture = TestBed.createComponent(StrctRange);
    const cmp = fixture.componentInstance;
    fixture.detectChanges();
    expect(typeof cmp.writeValue).toBe('function');
    expect(typeof cmp.registerOnChange).toBe('function');
    expect(typeof cmp.registerOnTouched).toBe('function');
  });
});
