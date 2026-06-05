import { TestBed } from '@angular/core/testing';
import { StrctDropdown } from './dropdown';

describe('StrctDropdown', () => {
  it('applies the host class', () => {
    const fixture = TestBed.createComponent(StrctDropdown);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.classList).toContain('strct-dd');
  });
});
