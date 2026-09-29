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

  // FR-48-09 — a crumb that does not route is still reachable.
  it('makes an interactive crumb a focusable control that emits activated', () => {
    const fixture = TestBed.createComponent(StrctBreadcrumbItem);
    fixture.componentRef.setInput('interactive', true);
    fixture.detectChanges();
    const crumb = fixture.nativeElement.querySelector('.strct-bc__crumb') as HTMLElement;
    expect(crumb.getAttribute('role')).toBe('button');
    expect(crumb.getAttribute('tabindex')).toBe('0');
    let n = 0;
    fixture.componentInstance.activated.subscribe(() => n++);
    crumb.click();
    crumb.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    crumb.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));
    expect(n).toBe(3);
  });

  it('leaves a plain crumb inert', () => {
    const fixture = TestBed.createComponent(StrctBreadcrumbItem);
    fixture.detectChanges();
    const crumb = fixture.nativeElement.querySelector('.strct-bc__crumb') as HTMLElement;
    expect(crumb.getAttribute('role')).toBeNull();
    expect(crumb.getAttribute('tabindex')).toBeNull();
    let n = 0;
    fixture.componentInstance.activated.subscribe(() => n++);
    crumb.click();
    expect(n).toBe(0);
  });
});
