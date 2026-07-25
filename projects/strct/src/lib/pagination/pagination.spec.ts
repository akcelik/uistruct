import { TestBed } from '@angular/core/testing';
import { StrctPagination } from './pagination';

describe('StrctPagination', () => {
  function numberTokens(
    fixture: ReturnType<typeof TestBed.createComponent<StrctPagination>>,
  ): string[] {
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

  it('clamps page back when total/pageSize shrink the page count', () => {
    const fixture = TestBed.createComponent(StrctPagination);
    fixture.componentRef.setInput('total', 240);
    fixture.componentRef.setInput('pageSize', 20);
    fixture.detectChanges();
    fixture.componentInstance.go(12);
    expect(fixture.componentInstance.page()).toBe(12);

    fixture.componentRef.setInput('total', 40);
    fixture.detectChanges();
    expect(fixture.componentInstance.pageCount()).toBe(2);
    expect(fixture.componentInstance.page()).toBe(2);

    fixture.componentRef.setInput('pageSize', 40);
    fixture.detectChanges();
    expect(fixture.componentInstance.page()).toBe(1);
  });

  it('labels numbered page buttons with the localizable pageLabel', () => {
    const fixture = TestBed.createComponent(StrctPagination);
    fixture.componentRef.setInput('total', 30);
    fixture.componentRef.setInput('pageSize', 10);
    fixture.detectChanges();

    const button = [...fixture.nativeElement.querySelectorAll('.strct-pg__btn')].find(
      (b) => (b as HTMLElement).textContent!.trim() === '2',
    ) as HTMLElement;
    expect(button.getAttribute('aria-label')).toBe('Page 2');

    fixture.componentRef.setInput('pageLabel', 'Sayfa');
    fixture.detectChanges();
    expect(button.getAttribute('aria-label')).toBe('Sayfa 2');
  });
});
