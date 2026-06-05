import { TestBed } from '@angular/core/testing';
import { StrctPassword } from './password';

describe('StrctPassword', () => {
  it('applies the strct-pw host class', () => {
    const fixture = TestBed.createComponent(StrctPassword);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).classList).toContain('strct-pw');
  });

  it('implements CVA and invokes registerOnChange callback on input', () => {
    const fixture = TestBed.createComponent(StrctPassword);
    fixture.detectChanges();
    const cmp = fixture.componentInstance;

    expect(typeof cmp.writeValue).toBe('function');
    expect(typeof cmp.registerOnChange).toBe('function');
    expect(typeof cmp.registerOnTouched).toBe('function');

    let emitted = '';
    cmp.registerOnChange((v: string) => (emitted = v));
    cmp.onInput({ target: { value: 'secret123' } } as unknown as Event);
    expect(emitted).toBe('secret123');
  });
});
