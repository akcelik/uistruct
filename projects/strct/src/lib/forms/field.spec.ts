import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { StrctField } from './field';
import { StrctInput } from './input';

@Component({
  standalone: true,
  imports: [StrctField, StrctInput],
  template: `
    <strct-field label="Name" required hint="Your full name">
      <input strctInput />
    </strct-field>
  `,
})
class FieldHost {}

describe('StrctField', () => {
  it('applies the strct-field host class', () => {
    const fixture = TestBed.createComponent(StrctField);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).classList).toContain('strct-field');
  });

  it('adds strct-field--invalid when error is set', () => {
    const fixture = TestBed.createComponent(StrctField);
    fixture.componentRef.setInput('error', 'Required');
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).classList).toContain('strct-field--invalid');
  });

  it('projects the label and required marker', () => {
    const fixture = TestBed.createComponent(FieldHost);
    fixture.detectChanges();
    const label = fixture.nativeElement.querySelector('.strct-field__label');
    expect(label?.textContent).toContain('Name');
    expect(label?.textContent).toContain('*');
  });

  it('projects the hint text', () => {
    const fixture = TestBed.createComponent(FieldHost);
    fixture.detectChanges();
    const hint = fixture.nativeElement.querySelector('.strct-field__msg--hint');
    expect(hint?.textContent).toContain('Your full name');
  });

  describe('validationState', () => {
    function build(state: unknown) {
      const fixture = TestBed.createComponent(StrctField);
      fixture.componentRef.setInput('validationState', state);
      fixture.detectChanges();
      return fixture.nativeElement as HTMLElement;
    }

    it('shows a spinner adornment while checking', () => {
      const el = build({ status: 'checking', message: 'Checking…' });
      expect(el.classList).toContain('strct-field--validating');
      expect(el.querySelector('.strct-field__adorn strct-spinner')).toBeTruthy();
      expect(el.querySelector('.strct-field__msg--checking')?.textContent).toContain('Checking…');
    });

    it('shows an ok adornment + message when ok', () => {
      const el = build({ status: 'ok', message: 'stratum 3' });
      expect(el.querySelector('.strct-field__adorn--ok strct-icon')).toBeTruthy();
      expect(el.querySelector('.strct-field__msg--ok')?.textContent).toContain('stratum 3');
    });

    it('marks the field invalid and the message as an alert on error', () => {
      const el = build({ status: 'error', message: 'unreachable' });
      expect(el.classList).toContain('strct-field--invalid');
      const msg = el.querySelector('.strct-field__msg--error');
      expect(msg?.getAttribute('role')).toBe('alert');
      expect(msg?.textContent).toContain('unreachable');
    });

    it('is idle (no adornment) by default', () => {
      const fixture = TestBed.createComponent(StrctField);
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;
      expect(el.classList).not.toContain('strct-field--validating');
      expect(el.querySelector('.strct-field__adorn')).toBeNull();
    });

    it('lets an explicit error take precedence over the validation message', () => {
      const fixture = TestBed.createComponent(StrctField);
      fixture.componentRef.setInput('error', 'Required');
      fixture.componentRef.setInput('validationState', { status: 'ok', message: 'looks good' });
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector('.strct-field__msg--error')?.textContent).toContain('Required');
      expect(el.textContent).not.toContain('looks good');
    });
  });
});
