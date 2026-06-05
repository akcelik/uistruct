import { TestBed } from '@angular/core/testing';
import { StrctRating } from './rating';

describe('StrctRating', () => {
  it('renders the host element', () => {
    const fixture = TestBed.createComponent(StrctRating);
    fixture.detectChanges();
    expect(fixture.nativeElement).toBeTruthy();
  });

  it('contains the strct-rating class in its template', () => {
    const fixture = TestBed.createComponent(StrctRating);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.strct-rating')).toBeTruthy();
  });

  it('implements CVA and invokes registerOnChange callback on pick', () => {
    const fixture = TestBed.createComponent(StrctRating);
    fixture.detectChanges();
    const cmp = fixture.componentInstance;

    expect(typeof cmp.writeValue).toBe('function');
    expect(typeof cmp.registerOnChange).toBe('function');
    expect(typeof cmp.registerOnTouched).toBe('function');

    let emitted = 0;
    cmp.registerOnChange((v: number) => (emitted = v));
    cmp.pick(3);
    expect(emitted).toBe(3);
  });
});
