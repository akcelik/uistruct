import { TestBed } from '@angular/core/testing';
import { StrctDatepicker } from './datepicker';

describe('StrctDatepicker', () => {
  it('applies the strct-dp host class', () => {
    const fixture = TestBed.createComponent(StrctDatepicker);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).classList).toContain('strct-dp');
  });

  it('implements CVA and invokes registerOnChange callback on pick', () => {
    const fixture = TestBed.createComponent(StrctDatepicker);
    fixture.detectChanges();
    const cmp = fixture.componentInstance;

    expect(typeof cmp.writeValue).toBe('function');
    expect(typeof cmp.registerOnChange).toBe('function');
    expect(typeof cmp.registerOnTouched).toBe('function');

    let emitted = '';
    cmp.registerOnChange((v: string) => (emitted = v));
    cmp.pick('2024-06-04');
    expect(emitted).toBe('2024-06-04');
  });
});
