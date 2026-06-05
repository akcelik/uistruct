import { TestBed } from '@angular/core/testing';
import { StrctKnob } from './knob';
describe('StrctKnob', () => {
  it('renders the host element', () => {
    const fixture = TestBed.createComponent(StrctKnob);
    fixture.detectChanges();
    expect(fixture.nativeElement).toBeTruthy();
  });

  it('contains the strct-knob class in its template', () => {
    const fixture = TestBed.createComponent(StrctKnob);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.strct-knob')).toBeTruthy();
  });

  it('implements CVA', () => {
    const fixture = TestBed.createComponent(StrctKnob);
    const cmp = fixture.componentInstance;
    fixture.detectChanges();
    expect(typeof cmp.writeValue).toBe('function');
    expect(typeof cmp.registerOnChange).toBe('function');
    expect(typeof cmp.registerOnTouched).toBe('function');
  });
});
