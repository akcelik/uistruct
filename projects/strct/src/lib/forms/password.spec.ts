import { TestBed } from '@angular/core/testing';
import { StrctPassword } from './password';

describe('StrctPassword', () => {
  it('applies the strct-pw host class', () => {
    const fixture = TestBed.createComponent(StrctPassword);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).classList).toContain('strct-pw');
  });

  it('implements CVA and invokes registerOnChange callback on input', () => {
    const fixture = TestBed.createComponent(StrctPassword);
    fixture.detectChanges();
    const cmp = fixture.componentInstance;

    expect(typeof cmp.writeValue).toBe('function');
    expect(typeof cmp.registerOnChange).toBe('function');
    expect(typeof cmp.registerOnTouched).toBe('function');

    let emitted = '';
    cmp.registerOnChange((v: string) => (emitted = v));
    cmp.onInput({ target: { value: 'secret123' } } as unknown as Event);
    expect(emitted).toBe('secret123');
  });

  it('exposes the strength meter as an aria-live status', () => {
    const fixture = TestBed.createComponent(StrctPassword);
    fixture.componentRef.setInput('meter', true);
    fixture.componentInstance.writeValue('Secr3t!pw');
    fixture.detectChanges();
    const meter = fixture.nativeElement.querySelector('.strct-pw__meter') as HTMLElement;
    expect(meter.getAttribute('role')).toBe('status');
    expect(meter.getAttribute('aria-live')).toBe('polite');
    expect(meter.textContent).toContain('Strong');
  });

  it('uses localized strength labels when provided', () => {
    const fixture = TestBed.createComponent(StrctPassword);
    fixture.componentRef.setInput('meter', true);
    fixture.componentRef.setInput('strengthLabels', ['Faible', 'Moyen', 'Bon', 'Fort']);
    fixture.componentInstance.writeValue('weak');
    fixture.detectChanges();
    const label = fixture.nativeElement.querySelector('.strct-pw__label') as HTMLElement;
    expect(label.textContent).toContain('Faible');
  });

  it('defaults autocomplete to current-password and localizes the toggle label', () => {
    const fixture = TestBed.createComponent(StrctPassword);
    fixture.componentRef.setInput('showLabel', 'Afficher le mot de passe');
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    const toggle = fixture.nativeElement.querySelector('.strct-pw__toggle') as HTMLElement;
    expect(input.getAttribute('autocomplete')).toBe('current-password');
    expect(toggle.getAttribute('aria-label')).toBe('Afficher le mot de passe');
  });
});

// FR-76-02 (HyperStruct, O480 sign-in): a browser cannot be asked whether
// Caps Lock is on; only a key event can say. So the field says nothing until
// something is typed into it, and then says it in a place the control itself
// owns — which a surrounding strct-field must not overwrite.
describe('StrctPassword — Caps Lock', () => {
  function build(patch: Record<string, unknown> = {}) {
    const fixture = TestBed.createComponent(StrctPassword);
    for (const [k, v] of Object.entries(patch)) fixture.componentRef.setInput(k, v);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const input = el.querySelector('input')!;
    const key = (on: boolean, type: 'keydown' | 'keyup' = 'keydown') => {
      const e = new KeyboardEvent(type, { key: 'a', bubbles: true });
      // jsdom builds the event without modifier state, so it is supplied here
      // the way a browser would report it.
      Object.defineProperty(e, 'getModifierState', {
        value: (m: string) => m === 'CapsLock' && on,
      });
      input.dispatchEvent(e);
      fixture.detectChanges();
    };
    const hint = () => el.querySelector('.strct-pw__caps');
    return { fixture, el, input, key, hint };
  }

  it('says nothing before a key is typed', () => {
    const { hint } = build();
    expect(hint()).toBeNull();
  });

  it('shows the hint while Caps Lock is on and removes it when it goes off', () => {
    const { key, hint } = build();
    key(true);
    expect(hint()!.textContent!.trim()).toBe('Caps Lock is on');
    key(false);
    expect(hint()).toBeNull();
  });

  it('a key-up says it too — the key that turns it on is read on the way back up', () => {
    const { key, hint } = build();
    key(true, 'keyup');
    expect(hint()).not.toBeNull();
  });

  it('reports the change once per change, not once per key', () => {
    const { fixture, key } = build();
    const seen: boolean[] = [];
    fixture.componentInstance.capsLock.subscribe((v: boolean) => seen.push(v));
    key(true);
    key(true);
    key(true);
    key(false);
    expect(seen).toEqual([true, false]);
  });

  it('the hint is the control’s own description, named before anything is typed', () => {
    const { input, key, el } = build();
    const id = input.getAttribute('aria-describedby');
    expect(id).toBeTruthy();
    // Declared up front, so a strct-field reads it when it links — and
    // declared again where the field can find it without clobbering.
    expect(input.getAttribute('data-strct-described-by')).toBe(id);
    key(true);
    expect(el.querySelector('.strct-pw__caps')!.id).toBe(id);
  });

  it('capsLockText renames it, and an empty one draws nothing at all', () => {
    const named = build({ capsLockText: 'Büyük harf kilidi açık' });
    named.key(true);
    expect(named.hint()!.textContent!.trim()).toBe('Büyük harf kilidi açık');

    const silent = build({ capsLockText: '' });
    const seen: boolean[] = [];
    silent.fixture.componentInstance.capsLock.subscribe((v: boolean) => seen.push(v));
    silent.key(true);
    expect(silent.hint()).toBeNull();
    // Still reported, for a consumer putting its own words somewhere else.
    expect(seen).toEqual([true]);
  });
});
