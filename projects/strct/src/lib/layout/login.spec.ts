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

// FR-76-01: a sign-in page is the one screen with nothing else on it. The
// geometry is gated in scripts/login-layout.mjs against a real browser; what
// is drawn, and what it is called, is settled here.
@Component({
  imports: [StrctLogin],
  template: `
    <strct-login [layout]="layout" [bandTone]="tone" bandLabel="Environment" [art]="art">
    </strct-login>
  `,
})
class BareLoginHost {
  layout: 'center' | 'split' | 'full' = 'full';
  tone: 'critical' | 'warning' = 'critical';
  art: 'none' | 'network' | 'grid' = 'none';
}

@Component({
  imports: [StrctLogin],
  template: `
    <strct-login layout="full" bandTone="warning" bandLabel="Environment" art="none">
      <div strctLoginBand>TEST</div>
      <img strctLoginArt src="x.svg" alt="" />
    </strct-login>
  `,
})
class FilledLoginHost {}

describe('StrctLogin — full, the band and the art slot', () => {
  function bare(patch: Partial<BareLoginHost> = {}) {
    const fixture = TestBed.createComponent(BareLoginHost);
    Object.assign(fixture.componentInstance, patch);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('draws the two panels, and marks the card as full', () => {
    const el = bare();
    expect(el.querySelector('.strct-login__card--full')).not.toBeNull();
    expect(el.querySelector('.strct-login__aside')).not.toBeNull();
    expect(el.querySelector('.strct-login__main')).not.toBeNull();
  });

  it('layout="split" is the card, and center is the single column', () => {
    expect(bare({ layout: 'split' }).querySelector('.strct-login__card--full')).toBeNull();
    expect(bare({ layout: 'split' }).querySelector('.strct-login__card')).not.toBeNull();
    expect(bare({ layout: 'center' }).querySelector('.strct-login__inner')).not.toBeNull();
  });

  it('the band is a note, named and toned — and carries nothing while empty', () => {
    const band = bare().querySelector('.strct-login__band')!;
    expect(band.getAttribute('role')).toBe('note');
    expect(band.getAttribute('aria-label')).toBe('Environment');
    expect(band.classList).toContain('strct-login__band--critical');
    expect(band.textContent!.trim()).toBe('');
  });

  // The filed complaint: the node diagram's lines ran through the tagline.
  // The art is a band of its own now, so its layers are inside that band.
  it('the built-in art is drawn inside the art slot, not over the whole aside', () => {
    const el = bare({ art: 'network' });
    const slot = el.querySelector('.strct-login__artslot')!;
    expect(slot.querySelector('.strct-login__net')).not.toBeNull();
    expect(slot.querySelector('.strct-login__matrix')).not.toBeNull();
    const aside = el.querySelector('.strct-login__aside')!;
    expect([...aside.children].some((c) => c.classList.contains('strct-login__net'))).toBe(false);
  });

  it('what is projected lands where it was asked to', () => {
    const fixture = TestBed.createComponent(FilledLoginHost);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const band = el.querySelector('.strct-login__band')!;
    expect(band.textContent!.trim()).toBe('TEST');
    expect(band.classList).toContain('strct-login__band--warning');
    expect(el.querySelector('.strct-login__artslot img')).not.toBeNull();
  });
});
