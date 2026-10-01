import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { StrctBadge } from '../badge/badge';
import { StrctLogin } from './login';

describe('StrctLogin', () => {
  it('applies the strct-login host class', () => {
    const fixture = TestBed.createComponent(StrctLogin);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.classList).toContain('strct-login');
  });
});

// FR-49-19 — the brand row had nowhere to put "APPLIANCE".
describe('StrctLogin — [strctLoginBrandMeta]', () => {
  @Component({
    imports: [StrctLogin, StrctBadge],
    changeDetection: ChangeDetectionStrategy.Eager,
    template: `
      <strct-login split brandIcon="shield" brandName="HyperStruct" heading="Sign in">
        <strct-badge strctLoginBrandMeta class="pill">APPLIANCE</strct-badge>
      </strct-login>
    `,
  })
  class Host {}

  it('projects the pill on the brand’s own line', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const brand = el.querySelector('.strct-login__brand')!;
    const meta = brand.querySelector('.strct-login__brandmeta')!;
    expect(meta.querySelector('.pill')!.textContent!.trim()).toBe('APPLIANCE');
    // It follows the name, inside the same row.
    expect(brand.querySelector('.strct-login__brandname')).toBeTruthy();
  });
});
