import { TestBed } from '@angular/core/testing';
import { Component, ChangeDetectionStrategy } from '@angular/core';
import { StrctField, StrctFieldHint, StrctFieldPrefix, StrctFieldSuffix } from './field';
import { StrctInput } from './input';

@Component({
  standalone: true,
  imports: [StrctField, StrctInput],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <strct-field label="Name" required hint="Your full name">
      <input strctInput />
    </strct-field>
  `,
})
class FieldHost {}

@Component({
  standalone: true,
  imports: [StrctField, StrctInput, StrctFieldPrefix, StrctFieldSuffix],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <strct-field label="Minimum memory">
      <input strctInput type="number" />
      <span strctFieldSuffix>MB</span>
    </strct-field>
    <strct-field label="Ask">
      <input strctInput />
      <button strctFieldSuffix type="button" class="strct-btn">Send</button>
    </strct-field>
    <strct-field label="Path">
      <span strctFieldPrefix>/var</span>
      <input strctInput />
    </strct-field>
  `,
})
class AddonHost {}

@Component({
  standalone: true,
  imports: [StrctField, StrctInput, StrctFieldHint],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <strct-field label="Switch name" hint="plain">
      <input strctInput />
      <ng-template strctFieldHint>Hosts with <strong>vSwitch0</strong> join it.</ng-template>
    </strct-field>
  `,
})
class RichHintHost {}

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

  describe('layout (FR-48-05)', () => {
    it('stacks by default and takes the label column on inline', () => {
      const fixture = TestBed.createComponent(StrctField);
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;
      expect(el.classList).not.toContain('strct-field--inline');
      fixture.componentRef.setInput('layout', 'inline');
      fixture.detectChanges();
      expect(el.classList).toContain('strct-field--inline');
    });
  });

  describe('addons (FR-48-06)', () => {
    it('renders the addons in their slots and marks the side on the host', () => {
      const fixture = TestBed.createComponent(AddonHost);
      fixture.detectChanges();
      const fields = fixture.nativeElement.querySelectorAll('strct-field');
      expect(fields[0].classList).toContain('strct-field--suffix');
      expect(fields[0].classList).not.toContain('strct-field--prefix');
      expect(fields[0].querySelector('.strct-field__addon--suffix')?.textContent).toContain('MB');
      expect(fields[2].classList).toContain('strct-field--prefix');
      expect(fields[2].querySelector('.strct-field__addon--prefix')?.textContent).toContain('/var');
    });

    it('describes the control with a text addon but not with a control addon', async () => {
      const fixture = TestBed.createComponent(AddonHost);
      fixture.detectChanges();
      await fixture.whenStable();
      const fields = fixture.nativeElement.querySelectorAll('strct-field');
      const unit = fields[0].querySelector('input') as HTMLInputElement;
      const suffixId = fields[0].querySelector('.strct-field__addon--suffix')?.id;
      expect(unit.getAttribute('aria-describedby')?.split(' ')).toContain(suffixId);

      const ask = fields[1].querySelector('input') as HTMLInputElement;
      const btnId = fields[1].querySelector('.strct-field__addon--suffix')?.id;
      expect(ask.getAttribute('aria-describedby')?.split(' ') ?? []).not.toContain(btnId);
    });
  });

  describe('projected hint (FR-48-07)', () => {
    it('renders the template in the hint slot, with the hint id, over the string', async () => {
      const fixture = TestBed.createComponent(RichHintHost);
      fixture.detectChanges();
      await fixture.whenStable();
      const hint = fixture.nativeElement.querySelector('.strct-field__msg--hint') as HTMLElement;
      expect(hint.querySelector('strong')?.textContent).toBe('vSwitch0');
      expect(hint.textContent).not.toContain('plain');
      const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
      expect(input.getAttribute('aria-describedby')?.split(' ')).toContain(hint.id);
    });
  });
});
