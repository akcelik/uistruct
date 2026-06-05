import { TestBed } from '@angular/core/testing';
import { StrctSubmenu } from './submenu';

describe('StrctSubmenu', () => {
  it('applies the host class', () => {
    const fixture = TestBed.createComponent(StrctSubmenu);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.classList).toContain('strct-submenu-host');
  });
});
