import { TestBed } from '@angular/core/testing';
import { StrctInputMask } from './input-mask';

describe('StrctInputMask', () => {
  it('renders the host element', () => {
    const fixture = TestBed.createComponent(StrctInputMask);
    fixture.componentRef.setInput('mask', '999-999');
    fixture.detectChanges();
    expect(fixture.nativeElement).toBeTruthy();
  });

  it('contains the strct-mask__input class in its template', () => {
    const fixture = TestBed.createComponent(StrctInputMask);
    fixture.componentRef.setInput('mask', '999-999');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.strct-mask__input')).toBeTruthy();
  });

  it('implements CVA and invokes registerOnChange callback on input', () => {
    const fixture = TestBed.createComponent(StrctInputMask);
    fixture.componentRef.setInput('mask', '999-999');
    fixture.detectChanges();
    const cmp = fixture.componentInstance;

    expect(typeof cmp.writeValue).toBe('function');
    expect(typeof cmp.registerOnChange).toBe('function');
    expect(typeof cmp.registerOnTouched).toBe('function');

    let emitted = '';
    cmp.registerOnChange((v: string) => (emitted = v));
    cmp.onInput({ target: { value: '12345' } } as unknown as Event);
    expect(emitted).toBe('123-45');
  });
});
