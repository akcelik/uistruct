import { TestBed } from '@angular/core/testing';
import { StrctPagination } from './pagination';

describe('StrctPagination', () => {
  function numberTokens(fixture: ReturnType<typeof TestBed.createComponent<StrctPagination>>): string[] {
    return [...fixture.nativeElement.querySelectorAll('.strct-pg__btn')]
      .map((b) => (b as HTMLElement).textContent!.trim())
      .filter((t) => /^\d+$/.test(t));
  }

  it('windows the page range with ellipsis gaps for large sets', () => {
    const fixture = TestBed.createComponent(StrctPagination);
    fixture.componentRef.setInput('total', 240);
    fixture.componentRef.setInput('pageSize', 20);
    fixture.componentInstance.page.set(5);
    fixture.detectChanges();

    expect(fixture.componentInstance.pageCount()).toBe(12);
    const tokens = numberTokens(fixture);
    expect(tokens).toContain('1');
    expect(tokens).toContain('5');
    expect(tokens).toContain('12');
    expect(fixture.nativeElement.querySelectorAll('.strct-pg__dots').length).toBeGreaterThan(0);
  });

  it('clamps go() within range', () => {
    const fixture = TestBed.createComponent(StrctPagination);
    fixture.componentRef.setInput('total', 30);
    fixture.componentRef.setInput('pageSize', 10);
    fixture.detectChanges();

    fixture.componentInstance.go(99);
    expect(fixture.componentInstance.page()).toBe(3);
    fixture.componentInstance.go(-5);
    expect(fixture.componentInstance.page()).toBe(1);
  });
});
