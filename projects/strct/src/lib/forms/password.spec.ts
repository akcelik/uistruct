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
