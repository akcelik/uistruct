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
});
