import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { StrctCodeInline } from './code-inline';

describe('StrctCodeInline (FR-48-17)', () => {
  @Component({
    imports: [StrctCodeInline],
    template: `
      Run <code strctCode class="plain">hyperstructctl doctor</code> on the appliance.
      <code strctCode copyable class="copy">host-01m3e2e</code>
    `,
  })
  class Host {}

  async function setup() {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('styles an inline code span without a copy button by default', async () => {
    const el = await setup();
    const plain = el.querySelector('.plain')!;
    expect(plain.classList).toContain('strct-code-inline');
    expect(plain.querySelector('strct-copy')).toBeNull();
  });

  it('copyable appends the library’s own copy button, carrying the element’s text', async () => {
    const el = await setup();
    const code = el.querySelector('.copy')!;
    expect(code.classList).toContain('strct-code-inline--copyable');
    const copy = code.querySelector('strct-copy');
    expect(copy).toBeTruthy();
    // The button copies what the code says — not the button's own label.
    expect(copy!.querySelector('button')!.getAttribute('aria-label')).toBe('Copy');
    expect(code.textContent).toContain('host-01m3e2e');
  });
});
