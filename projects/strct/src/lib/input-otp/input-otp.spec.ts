import { TestBed } from '@angular/core/testing';
import { StrctInputOtp } from './input-otp';
describe('StrctInputOtp', () => {
  it('renders the host element', () => {
    const fixture = TestBed.createComponent(StrctInputOtp);
    fixture.detectChanges();
    expect(fixture.nativeElement).toBeTruthy();
  });

  it('contains the strct-otp class in its template', () => {
    const fixture = TestBed.createComponent(StrctInputOtp);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.strct-otp')).toBeTruthy();
  });

  it('renders the correct number of boxes based on length input', () => {
    const fixture = TestBed.createComponent(StrctInputOtp);
    fixture.componentRef.setInput('length', 4);
    fixture.detectChanges();
    const boxes = fixture.nativeElement.querySelectorAll('.strct-otp__box');
    expect(boxes.length).toBe(4);
  });

  it('implements CVA', () => {
    const fixture = TestBed.createComponent(StrctInputOtp);
    const cmp = fixture.componentInstance;
    fixture.detectChanges();
    expect(typeof cmp.writeValue).toBe('function');
    expect(typeof cmp.registerOnChange).toBe('function');
    expect(typeof cmp.registerOnTouched).toBe('function');
  });
});
