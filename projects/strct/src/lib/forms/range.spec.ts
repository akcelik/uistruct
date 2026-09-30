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

// FR-49-10 — memory is "4 GB" and a weight is "20%", not 4 and 20.
describe('StrctRange — valueFormat', () => {
  it('formats the shown value, and the model stays the number', () => {
    const fixture = TestBed.createComponent(StrctRange);
    fixture.componentRef.setInput('showValue', true);
    fixture.componentRef.setInput('min', 1);
    fixture.componentRef.setInput('max', 64);
    fixture.componentInstance.writeValue(4);
    fixture.detectChanges();
    const shown = () =>
      (fixture.nativeElement as HTMLElement).querySelector('.strct-range__value')!.textContent;
    expect(shown()).toBe('4');

    fixture.componentRef.setInput('valueFormat', (v: number) => `${v} GB`);
    fixture.detectChanges();
    expect(shown()).toBe('4 GB');
    expect(fixture.componentInstance.value()).toBe(4);

    const input = (fixture.nativeElement as HTMLElement).querySelector('input')!;
    input.value = '16';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(shown()).toBe('16 GB');
    expect(fixture.componentInstance.value()).toBe(16);
  });
});
