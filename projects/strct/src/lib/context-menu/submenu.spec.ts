import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { StrctDropdownItem } from '../dropdown/dropdown';
import { StrctSubmenu } from './submenu';

@Component({
  imports: [StrctSubmenu, StrctDropdownItem],
  template: `
    <strct-submenu label="Power">
      <strct-dropdown-item>Power on</strct-dropdown-item>
      <strct-dropdown-item>Power off</strct-dropdown-item>
      <strct-dropdown-item disabled>Power nap</strct-dropdown-item>
    </strct-submenu>
  `,
})
class HostComponent {}

function setup() {
  const fixture = TestBed.createComponent(HostComponent);
  fixture.detectChanges();
  const el = fixture.nativeElement as HTMLElement;
  const trigger = el.querySelector<HTMLElement>('.strct-submenu__trigger')!;
  const panel = () => el.querySelector<HTMLElement>('.strct-submenu__panel');
  const items = () => [...el.querySelectorAll<HTMLElement>('strct-dropdown-item')];
  const key = (target: HTMLElement, key: string) =>
    target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
  /** Keyboard-open the fly-out and let the post-render focus move happen. */
  const openFromKeyboard = async (k = 'Enter') => {
    key(trigger, k);
    fixture.detectChanges();
    await new Promise((r) => setTimeout(r));
    fixture.detectChanges();
  };
  return { fixture, el, trigger, panel, items, key, openFromKeyboard };
}

describe('StrctSubmenu', () => {
  it('applies the host class', () => {
    const fixture = TestBed.createComponent(StrctSubmenu);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.classList).toContain('strct-submenu-host');
  });

  it('keyboard open (Enter / Space / →) focuses the first fly-out item', async () => {
    const { fixture, panel, items, key, openFromKeyboard } = setup();
    for (const k of ['Enter', ' ', 'ArrowRight']) {
      await openFromKeyboard(k);
      expect(panel()).toBeTruthy();
      expect(document.activeElement).toBe(items()[0]);
      key(items()[0], 'Escape'); // close before trying the next open key
      fixture.detectChanges();
    }
  });

  it('arrows rove the fly-out (wrapping, skipping disabled); Home/End jump', async () => {
    const { fixture, items, key, openFromKeyboard } = setup();
    await openFromKeyboard();
    const [on, off] = items();
    key(on, 'ArrowDown');
    expect(document.activeElement).toBe(off);
    key(off, 'ArrowDown');
    fixture.detectChanges();
    expect(document.activeElement).toBe(on); // disabled row skipped — wraps
    key(on, 'ArrowUp');
    expect(document.activeElement).toBe(off); // wraps backwards
    key(off, 'Home');
    expect(document.activeElement).toBe(on);
    key(on, 'End');
    expect(document.activeElement).toBe(off);
  });

  it('ArrowLeft closes the fly-out and returns focus to the trigger', async () => {
    const { fixture, trigger, panel, items, key, openFromKeyboard } = setup();
    await openFromKeyboard();
    key(items()[0], 'ArrowLeft');
    fixture.detectChanges();
    expect(panel()).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it('Escape closes the fly-out and returns focus to the trigger', async () => {
    const { fixture, trigger, panel, items, key, openFromKeyboard } = setup();
    await openFromKeyboard();
    key(items()[0], 'Escape');
    fixture.detectChanges();
    expect(panel()).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it('flips upward when the fly-out would overflow the viewport bottom', () => {
    const { fixture, el, trigger, panel } = setup();
    const host = el.querySelector('strct-submenu')!;
    vi.spyOn(host, 'getBoundingClientRect').mockReturnValue({
      right: 0,
      bottom: window.innerHeight,
    } as DOMRect);
    trigger.click();
    fixture.detectChanges();
    expect(panel()!.classList).toContain('strct-submenu__panel--up');
    expect(panel()!.classList).not.toContain('strct-submenu__panel--flip');
  });
});
