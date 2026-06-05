import { TestBed } from '@angular/core/testing';
import { StrctNav, StrctNavItem } from './nav';

describe('StrctNav', () => {
  it('applies the strct-nav host class', () => {
    const fixture = TestBed.createComponent(StrctNav);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.classList).toContain('strct-nav');
  });
});

describe('StrctNavItem', () => {
  it('applies the strct-nav-item host class', () => {
    const fixture = TestBed.createComponent(StrctNavItem);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.classList).toContain('strct-nav-item');
  });

  it('applies the active modifier class when active is true', () => {
    const fixture = TestBed.createComponent(StrctNavItem);
    fixture.componentRef.setInput('active', true);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.classList).toContain('strct-nav-item--active');
  });

  it('does not apply the active modifier class when active is false', () => {
    const fixture = TestBed.createComponent(StrctNavItem);
    fixture.componentRef.setInput('active', false);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.classList).not.toContain('strct-nav-item--active');
  });
});
