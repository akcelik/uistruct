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

  it('merges the static disabled input with the CVA disabled state', () => {
    const fixture = TestBed.createComponent(StrctRange);
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    const cmp = fixture.componentInstance;
    const native = fixture.nativeElement.querySelector('.strct-range__input') as HTMLInputElement;

    expect(cmp.isDisabled()).toBe(true);
    expect(native.disabled).toBe(true);

    // Static disable stays even if the form re-enables.
    cmp.setDisabledState(false);
    expect(cmp.isDisabled()).toBe(true);

    // A static input change must not clobber the forms-driven disabled state.
    cmp.setDisabledState(true);
    fixture.componentRef.setInput('disabled', false);
    fixture.detectChanges();
    expect(cmp.isDisabled()).toBe(true);
    expect(native.disabled).toBe(true);
  });
});
