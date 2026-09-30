import { Component, signal } from '@angular/core';
import { By } from '@angular/platform-browser';
import { StrctCopy } from '../copy/copy';
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

// BUG-49-10 — the button copied the first text it saw, and long ids overflowed.
describe('StrctCodeInline — what gets copied', () => {
  @Component({
    imports: [StrctCodeInline],
    template: `
      <code strctCode copyable wrap class="live">{{ shown() }}</code>
      <code strctCode copyable [value]="full" class="whole">{{ shown() }}</code>
    `,
  })
  class LiveHost {
    shown = signal('loading…');
    full = 'ab:cd:ef:01:23:45:67:89';
  }

  async function setup() {
    const fixture = TestBed.createComponent(LiveHost);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return { fixture, el: fixture.nativeElement as HTMLElement };
  }

  it('follows the element’s text when it changes after the first render', async () => {
    const { fixture, el } = await setup();
    const copy = () =>
      fixture.debugElement
        .queryAll(By.directive(StrctCopy))
        .map((d) => d.componentInstance as StrctCopy);
    expect(copy()[0].text()).toBe('loading…');

    fixture.componentInstance.shown.set('host-01m3e2e0000000000000000001');
    fixture.detectChanges();
    // MutationObserver is a microtask; let it deliver.
    await new Promise((r) => setTimeout(r));
    fixture.detectChanges();
    expect(copy()[0].text()).toBe('host-01m3e2e0000000000000000001');
    expect(el.querySelector('.live')!.classList).toContain('strct-code-inline--wrap');
    expect(el.querySelector('.whole')!.classList).not.toContain('strct-code-inline--wrap');
  });

  it('copies `value` instead of the shortened text when one is given', async () => {
    const { fixture } = await setup();
    const whole = fixture.debugElement
      .queryAll(By.directive(StrctCopy))
      .map((d) => d.componentInstance as StrctCopy)[1];
    expect(whole.text()).toBe('ab:cd:ef:01:23:45:67:89');
    // A later text change does not override an explicit value.
    fixture.componentInstance.shown.set('…6789');
    fixture.detectChanges();
    await new Promise((r) => setTimeout(r));
    expect(whole.text()).toBe('ab:cd:ef:01:23:45:67:89');
  });
});
