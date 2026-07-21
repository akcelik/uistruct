import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { StrctHotkeysHelp, StrctHotkeysService } from './hotkeys';

function key(init: KeyboardEventInit & { key: string }, target?: HTMLElement): void {
  const ev = new KeyboardEvent('keydown', { ...init, bubbles: true, cancelable: true });
  (target ?? document.body).dispatchEvent(ev);
}

describe('StrctHotkeysService', () => {
  it('fires on matching combos, mod matches both ctrl and meta, dispose unregisters', () => {
    const svc = TestBed.inject(StrctHotkeysService);
    let fired = 0;
    const dispose = svc.register({
      combo: 'mod+k',
      description: 'Palette',
      handler: () => fired++,
    });
    key({ key: 'k', ctrlKey: true });
    key({ key: 'k', metaKey: true });
    key({ key: 'k' }); // no modifier — no match
    expect(fired).toBe(2);
    dispose();
    key({ key: 'k', ctrlKey: true });
    expect(fired).toBe(2);
    expect(svc.hotkeys().length).toBe(0);
  });

  it('suppresses plain-key combos while typing but lets modifier combos through', () => {
    const svc = TestBed.inject(StrctHotkeysService);
    let plain = 0;
    let mod = 0;
    const d1 = svc.register({ combo: 'g', description: 'Go', handler: () => plain++ });
    const d2 = svc.register({ combo: 'ctrl+s', description: 'Save', handler: () => mod++ });
    const input = document.createElement('input');
    document.body.appendChild(input);
    key({ key: 'g' }, input);
    key({ key: 's', ctrlKey: true }, input);
    expect(plain).toBe(0);
    expect(mod).toBe(1);
    key({ key: 'g' });
    expect(plain).toBe(1);
    input.remove();
    d1();
    d2();
  });
});

describe('StrctHotkeysHelp', () => {
  @Component({
    imports: [StrctHotkeysHelp],
    template: `<strct-hotkeys-help />`,
  })
  class HostComponent {}

  it('registers "?", toggles open on it and lists hotkeys grouped', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const svc = TestBed.inject(StrctHotkeysService);
    const dispose = svc.register({
      combo: 'mod+k',
      description: 'Open palette',
      group: 'Global',
      handler: () => {},
    });
    key({ key: '?', shiftKey: true });
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const dialog = el.querySelector('.strct-hkh')!;
    expect(dialog.getAttribute('role')).toBe('dialog');
    expect(dialog.textContent).toContain('Open palette');
    expect(dialog.textContent).toContain('Global');
    expect(dialog.textContent).toContain('Show this help');
    // Escape closes without swallowing app-wide Escape semantics.
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();
    expect(el.querySelector('.strct-hkh')).toBeNull();
    dispose();
  });
});
