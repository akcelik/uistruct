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

  it('merges the static disabled input with the CVA disabled state', () => {
    const fixture = TestBed.createComponent(StrctToggle);
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    const cmp = fixture.componentInstance;
    const native = fixture.nativeElement.querySelector('.strct-tg__native') as HTMLInputElement;

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
