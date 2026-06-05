import { TestBed } from '@angular/core/testing';
import { StrctCheckbox } from './checkbox';

describe('StrctCheckbox', () => {
  it('renders the host element', () => {
    const fixture = TestBed.createComponent(StrctCheckbox);
    fixture.detectChanges();
    expect(fixture.nativeElement).toBeTruthy();
  });

  it('contains the strct-cb class in its template', () => {
    const fixture = TestBed.createComponent(StrctCheckbox);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.strct-cb')).toBeTruthy();
  });

  it('implements CVA and invokes registerOnChange callback on toggle', () => {
    const fixture = TestBed.createComponent(StrctCheckbox);
    fixture.detectChanges();
    const cmp = fixture.componentInstance;

    expect(typeof cmp.writeValue).toBe('function');
    expect(typeof cmp.registerOnChange).toBe('function');
    expect(typeof cmp.registerOnTouched).toBe('function');

    let emitted = false;
    cmp.registerOnChange((v: boolean) => (emitted = v));
    cmp.onToggle({ target: { checked: true } } as unknown as Event);
    expect(emitted).toBe(true);
  });
});
