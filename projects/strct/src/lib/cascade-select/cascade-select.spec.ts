import { TestBed } from '@angular/core/testing';
import { StrctCascadeSelect } from './cascade-select';

describe('StrctCascadeSelect', () => {
  it('applies the strct-cs host class', () => {
    const fixture = TestBed.createComponent(StrctCascadeSelect);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).classList).toContain('strct-cs');
  });

  it('implements CVA and invokes registerOnChange callback on pick', () => {
    const fixture = TestBed.createComponent(StrctCascadeSelect);
    fixture.detectChanges();
    const cmp = fixture.componentInstance;

    expect(typeof cmp.writeValue).toBe('function');
    expect(typeof cmp.registerOnChange).toBe('function');
    expect(typeof cmp.registerOnTouched).toBe('function');

    let emitted: unknown;
    cmp.registerOnChange((v: unknown) => (emitted = v));
    cmp.pick('leaf-value');
    expect(emitted).toBe('leaf-value');
  });
});
