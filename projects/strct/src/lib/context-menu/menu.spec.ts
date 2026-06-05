import { TestBed } from '@angular/core/testing';
import { StrctMenuPanel } from './menu';

describe('StrctMenuPanel', () => {
  it('applies the host class', () => {
    const fixture = TestBed.createComponent(StrctMenuPanel);
    fixture.componentRef.setInput('items', []);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.classList).toContain('strct-menu-host');
  });
});
