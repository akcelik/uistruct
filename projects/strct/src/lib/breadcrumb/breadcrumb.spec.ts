import { TestBed } from '@angular/core/testing';
import { StrctBreadcrumb, StrctBreadcrumbItem } from './breadcrumb';

describe('StrctBreadcrumb', () => {
  it('applies the host class', () => {
    const fixture = TestBed.createComponent(StrctBreadcrumb);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.classList).toContain('strct-bc');
  });

  it('has a localizable navigation label (defaults to "Breadcrumb")', () => {
    const fixture = TestBed.createComponent(StrctBreadcrumb);
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    expect(host.getAttribute('aria-label')).toBe('Breadcrumb');

    fixture.componentRef.setInput('regionLabel', 'Fil d’Ariane');
    fixture.detectChanges();
    expect(host.getAttribute('aria-label')).toBe('Fil d’Ariane');
  });

  it('renders the trail as an ordered list', () => {
    const fixture = TestBed.createComponent(StrctBreadcrumb);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector('ol.strct-bc__list')).toBeTruthy();
  });
});

describe('StrctBreadcrumbItem', () => {
  it('applies the host class and current modifier', () => {
    const fixture = TestBed.createComponent(StrctBreadcrumbItem);
    fixture.componentRef.setInput('current', true);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.classList).toContain('strct-bc__item');
    expect(host.classList).toContain('strct-bc__item--current');
  });

  it('exposes listitem semantics and aria-current only when current', () => {
    const fixture = TestBed.createComponent(StrctBreadcrumbItem);
    fixture.componentRef.setInput('current', true);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.getAttribute('role')).toBe('listitem');
    expect(host.getAttribute('aria-current')).toBe('page');

    fixture.componentRef.setInput('current', false);
    fixture.detectChanges();
    expect(host.getAttribute('aria-current')).toBeNull();
  });
});
