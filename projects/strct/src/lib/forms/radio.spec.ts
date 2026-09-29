import { Component, ChangeDetectionStrategy } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { StrctRadioGroup, StrctRadio } from './radio';
import { StrctControlDescription } from './description';

@Component({
  standalone: true,
  imports: [StrctRadioGroup, StrctRadio],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <strct-radio-group>
      <strct-radio [value]="'a'">A</strct-radio>
      <strct-radio [value]="'b'">B</strct-radio>
    </strct-radio-group>
  `,
})
class RadioHost {}

@Component({
  standalone: true,
  imports: [StrctRadioGroup, StrctRadio, StrctControlDescription],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <strct-radio-group variant="card">
      <strct-radio value="ldap" icon="users" description="Any LDAP v3 directory.">LDAP</strct-radio>
      <strct-radio value="oidc">
        OpenID Connect
        <span strctControlDescription>Entra ID, <strong>Okta</strong>, Keycloak.</span>
      </strct-radio>
    </strct-radio-group>
  `,
})
class CardHost {}

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

  // FR-48-02 / FR-48-04
  it('lays cards out in a grid and keeps the group a native radiogroup', () => {
    const fixture = TestBed.createComponent(CardHost);
    fixture.detectChanges();
    const group = fixture.nativeElement.querySelector('strct-radio-group') as HTMLElement;
    expect(group.classList).toContain('strct-radio-group--card');
    expect(group.getAttribute('role')).toBe('radiogroup');
    const radios = fixture.nativeElement.querySelectorAll('input[type="radio"]');
    expect(radios.length).toBe(2);
    expect(radios[0].name).toBe(radios[1].name);
    expect(fixture.nativeElement.querySelectorAll('.strct-rb--card').length).toBe(2);
    expect(fixture.nativeElement.querySelector('.strct-rb__icon')).toBeTruthy();
  });

  it('marks the chosen card and links both description forms', () => {
    const fixture = TestBed.createComponent(CardHost);
    fixture.detectChanges();
    const radios = fixture.nativeElement.querySelectorAll(
      'input[type="radio"]',
    ) as NodeListOf<HTMLInputElement>;
    const labels = fixture.nativeElement.querySelectorAll('.strct-rb');

    const strDesc = fixture.nativeElement.querySelector(
      '.strct-rb__desc:not(.strct-rb__desc--projected)',
    );
    expect(strDesc?.textContent).toContain('Any LDAP v3 directory.');
    expect(radios[0].getAttribute('aria-describedby')).toBe(strDesc.id);

    const projDesc = fixture.nativeElement.querySelector('.strct-rb__desc--projected');
    expect(projDesc?.querySelector('strong')?.textContent).toBe('Okta');
    expect(radios[1].getAttribute('aria-describedby')).toBe(projDesc.id);

    radios[1].click();
    fixture.detectChanges();
    expect(labels[1].classList).toContain('strct-rb--checked');
    expect(labels[0].classList).not.toContain('strct-rb--checked');
  });

  it('is unchanged without a description or the card variant', () => {
    const fixture = TestBed.createComponent(RadioHost);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.strct-rb--card')).toBeNull();
    expect(fixture.nativeElement.querySelector('.strct-rb__desc')).toBeNull();
    expect(
      fixture.nativeElement.querySelector('input[type="radio"]').getAttribute('aria-describedby'),
    ).toBeNull();
  });
});
