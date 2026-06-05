import { TestBed } from '@angular/core/testing';
import { StrctColorPicker } from './color-picker';

describe('StrctColorPicker', () => {
  it('applies the strct-cp host class', () => {
    const fixture = TestBed.createComponent(StrctColorPicker);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).classList).toContain('strct-cp');
  });

  it('implements CVA and invokes registerOnChange callback on pick', () => {
    const fixture = TestBed.createComponent(StrctColorPicker);
    fixture.detectChanges();
    const cmp = fixture.componentInstance;

    expect(typeof cmp.writeValue).toBe('function');
    expect(typeof cmp.registerOnChange).toBe('function');
    expect(typeof cmp.registerOnTouched).toBe('function');

    let emitted = '';
    cmp.registerOnChange((v: string) => (emitted = v));
    cmp.pick('#ff0000');
    expect(emitted).toBe('#ff0000');
  });
});
