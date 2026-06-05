import { TestBed } from '@angular/core/testing';
import { StrctToggle } from './toggle';
describe('StrctToggle', () => {
  it('renders the host element', () => {
    const fixture = TestBed.createComponent(StrctToggle);
    fixture.detectChanges();
    expect(fixture.nativeElement).toBeTruthy();
  });

  it('contains the strct-tg class in its template', () => {
    const fixture = TestBed.createComponent(StrctToggle);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.strct-tg')).toBeTruthy();
  });

  it('reflects checked state via writeValue', () => {
    const fixture = TestBed.createComponent(StrctToggle);
    const cmp = fixture.componentInstance;
    cmp.writeValue(true);
    fixture.detectChanges();
    const native = fixture.nativeElement.querySelector('.strct-tg__native') as HTMLInputElement;
    expect(native?.checked).toBe(true);
  });

  it('implements CVA', () => {
    const fixture = TestBed.createComponent(StrctToggle);
    const cmp = fixture.componentInstance;
    fixture.detectChanges();
    expect(typeof cmp.writeValue).toBe('function');
    expect(typeof cmp.registerOnChange).toBe('function');
    expect(typeof cmp.registerOnTouched).toBe('function');
  });
});
