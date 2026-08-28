import { Component, ChangeDetectionStrategy } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { StrctButton } from '../button/button';
import { StrctSignpost, StrctSignpostTrigger } from './signpost';

@Component({
  imports: [StrctSignpost, StrctSignpostTrigger, StrctButton],
  // The library's own demo markup (showcase feedback.page signpost demo).
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <strct-signpost position="bottom">
      <button strct-button size="sm" strctSignpostTrigger>Open below</button>
      <h4>About signposts</h4>
      <p>Any projected content fits here — text, lists or controls.</p>
    </strct-signpost>
  `,
})
class HostComponent {}

function setup() {
  const fixture = TestBed.createComponent(HostComponent);
  fixture.detectChanges();
  const el = fixture.nativeElement as HTMLElement;
  const wrapper = el.querySelector<HTMLElement>('.strct-sp__trigger')!;
  const btn = el.querySelector<HTMLElement>('[strctSignpostTrigger]')!;
  return { fixture, el, wrapper, btn };
}

describe('StrctSignpost', () => {
  it('applies the base host class', () => {
    const fixture = TestBed.createComponent(StrctSignpost);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).classList).toContain('strct-sp');
  });

  it('the wrapper stays inert — aria-haspopup/aria-expanded live on the real button', () => {
    const { fixture, el, wrapper, btn } = setup();
    // Interactives must not nest (axe): no role/tabindex on the wrapper div.
    expect(wrapper.getAttribute('role')).toBeNull();
    expect(wrapper.getAttribute('tabindex')).toBeNull();
    expect(btn.tagName).toBe('BUTTON');
    expect(btn.getAttribute('aria-haspopup')).toBe('dialog');
    expect(btn.getAttribute('aria-expanded')).toBe('false');
    btn.click();
    fixture.detectChanges();
    expect(btn.getAttribute('aria-expanded')).toBe('true');
    expect(el.querySelector('[role="dialog"]')).toBeTruthy();
  });

  it('renders the panel as a labeled dialog (ariaLabel input)', () => {
    const { fixture, el, btn } = setup();
    btn.click();
    fixture.detectChanges();
    const dialog = el.querySelector<HTMLElement>('[role="dialog"]')!;
    expect(dialog.getAttribute('aria-label')).toBe('Details');
  });

  it('Enter/Space on the trigger toggles exactly once (native button click)', () => {
    const { fixture, el, btn } = setup();
    // Browser sequence for Enter on a button: keydown, then a native click.
    // The old wrapper ALSO toggled on keydown — the net effect was no toggle.
    btn.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    btn.click();
    fixture.detectChanges();
    expect(el.querySelector('[role="dialog"]')).toBeTruthy(); // toggled ONCE, not twice
    // Space: keydown + keyup, then the native click — again exactly one toggle.
    btn.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    btn.dispatchEvent(new KeyboardEvent('keyup', { key: ' ', bubbles: true }));
    btn.click();
    fixture.detectChanges();
    expect(el.querySelector('[role="dialog"]')).toBeNull();
  });

  it('Escape closes the popover and returns focus to the trigger', () => {
    const { fixture, el, btn } = setup();
    btn.focus();
    btn.click();
    fixture.detectChanges();
    expect(el.querySelector('[role="dialog"]')).toBeTruthy();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();
    expect(el.querySelector('[role="dialog"]')).toBeNull();
    expect(document.activeElement).toBe(btn);
  });

  it('Escape consumed by the open popover never reaches a host modal/drawer', () => {
    const { fixture, btn } = setup();
    // Registered after the component's own document listener — only
    // stopImmediatePropagation keeps this spy from seeing the keydown.
    const spy = vi.fn();
    document.addEventListener('keydown', spy);
    try {
      btn.click();
      fixture.detectChanges();
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      expect(spy).not.toHaveBeenCalled();
      // Closed popover consumes nothing — a host modal may have its Escape.
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      expect(spy).toHaveBeenCalledTimes(1);
    } finally {
      document.removeEventListener('keydown', spy);
    }
  });

  it('an outside click closes the popover without touching focus', () => {
    const { fixture, el, btn } = setup();
    btn.focus();
    btn.click();
    fixture.detectChanges();
    document.body.click();
    fixture.detectChanges();
    expect(el.querySelector('[role="dialog"]')).toBeNull();
  });
});
