import { TestBed } from '@angular/core/testing';
import { StrctBreadcrumb, StrctBreadcrumbItem } from './breadcrumb';

describe('StrctBreadcrumb', () => {
  it('applies the host class', () => {
    const fixture = TestBed.createComponent(StrctBreadcrumb);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.classList).toContain('strct-bc');
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
});
