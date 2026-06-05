import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { StrctRadioGroup, StrctRadio } from './radio';

@Component({
  standalone: true,
  imports: [StrctRadioGroup, StrctRadio],
  template: `
    <strct-radio-group>
      <strct-radio [value]="'a'">A</strct-radio>
      <strct-radio [value]="'b'">B</strct-radio>
    </strct-radio-group>
  `,
})
class RadioHost {}

describe('StrctRadioGroup', () => {
  it('applies the strct-radio-group host class', () => {
    const fixture = TestBed.createComponent(StrctRadioGroup);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).classList).toContain('strct-radio-group');
  });
});

describe('StrctRadio', () => {
  it('renders inside a group and contains strct-rb class', () => {
    const fixture = TestBed.createComponent(RadioHost);
    fixture.detectChanges();
    const radios = fixture.nativeElement.querySelectorAll('.strct-rb');
    expect(radios.length).toBe(2);
  });
});
