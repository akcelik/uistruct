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

describe('StrctInputOtp FR-16-05/06', () => {
  it('autofocus puts the caret on box 0 at first render', async () => {
    const fixture = TestBed.createComponent(StrctInputOtp);
    fixture.componentRef.setInput('autofocus', true);
    fixture.detectChanges();
    await fixture.whenStable();
    const first = fixture.nativeElement.querySelector('.strct-otp__box');
    expect(document.activeElement).toBe(first);
  });

  it('focus(index) moves the caret programmatically (fresh-attempt refocus)', () => {
    const fixture = TestBed.createComponent(StrctInputOtp);
    fixture.detectChanges();
    fixture.componentInstance.focus(2);
    const boxes = fixture.nativeElement.querySelectorAll('.strct-otp__box');
    expect(document.activeElement).toBe(boxes[2]);
    fixture.componentInstance.focus();
    expect(document.activeElement).toBe(boxes[0]);
  });

  it('groupSize renders aria-hidden separators between groups only', () => {
    const fixture = TestBed.createComponent(StrctInputOtp);
    fixture.componentRef.setInput('length', 6);
    fixture.componentRef.setInput('groupSize', 3);
    fixture.detectChanges();
    const seps = fixture.nativeElement.querySelectorAll('.strct-otp__sep');
    expect(seps.length).toBe(1); // nnn – nnn: one separator, none trailing
    expect(seps[0].getAttribute('aria-hidden')).toBe('true');
    // Auto-advance still skips the separator (it is not an input).
    expect(fixture.nativeElement.querySelectorAll('.strct-otp__box').length).toBe(6);

    fixture.componentRef.setInput('groupSize', 2);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.strct-otp__sep').length).toBe(2);

    fixture.componentRef.setInput('groupSize', 0);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.strct-otp__sep').length).toBe(0);
  });
});
