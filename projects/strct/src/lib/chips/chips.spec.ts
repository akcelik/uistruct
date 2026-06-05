import { TestBed } from '@angular/core/testing';
import { StrctChips } from './chips';
describe('StrctChips', () => {
  it('renders the host element', () => {
    const fixture = TestBed.createComponent(StrctChips);
    fixture.detectChanges();
    expect(fixture.nativeElement).toBeTruthy();
  });

  it('contains the strct-chips class in its template', () => {
    const fixture = TestBed.createComponent(StrctChips);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.strct-chips')).toBeTruthy();
  });

  it('implements CVA', () => {
    const fixture = TestBed.createComponent(StrctChips);
    const cmp = fixture.componentInstance;
    fixture.detectChanges();
    expect(typeof cmp.writeValue).toBe('function');
    expect(typeof cmp.registerOnChange).toBe('function');
    expect(typeof cmp.registerOnTouched).toBe('function');
  });
});
