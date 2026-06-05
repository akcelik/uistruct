import { TestBed } from '@angular/core/testing';
import { StrctFile } from './file';

describe('StrctFile', () => {
  it('applies the strct-file host class', () => {
    const fixture = TestBed.createComponent(StrctFile);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).classList).toContain('strct-file');
  });

  it('implements CVA', () => {
    const fixture = TestBed.createComponent(StrctFile);
    const cmp = fixture.componentInstance;
    fixture.detectChanges();
    expect(typeof cmp.writeValue).toBe('function');
    expect(typeof cmp.registerOnChange).toBe('function');
    expect(typeof cmp.registerOnTouched).toBe('function');
  });
});
