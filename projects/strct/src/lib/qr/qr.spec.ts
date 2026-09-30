import { TestBed } from '@angular/core/testing';
import { StrctQr } from './qr';

function build(inputs: Record<string, unknown> = {}) {
  const fixture = TestBed.createComponent(StrctQr);
  fixture.componentRef.setInput('value', 'otpauth://totp/UIStruct:ada?secret=JBSWY3DPEHPK3PXP');
  for (const [k, v] of Object.entries(inputs)) fixture.componentRef.setInput(k, v);
  fixture.detectChanges();
  return { fixture, el: fixture.nativeElement as HTMLElement };
}

describe('StrctQr', () => {
  it('draws an svg named for assistive tech, at the asked size', () => {
    const { el } = build({ size: 200, label: 'Scan with your authenticator app' });
    const svg = el.querySelector('svg') as SVGElement;
    expect(svg.getAttribute('role')).toBe('img');
    expect(svg.getAttribute('aria-label')).toBe('Scan with your authenticator app');
    expect(svg.getAttribute('width')).toBe('200');
    expect(svg.getAttribute('height')).toBe('200');
  });

  it('keeps the four-module quiet zone the spec asks for', () => {
    const { el } = build();
    const svg = el.querySelector('svg') as SVGElement;
    const [, , span] = svg.getAttribute('viewBox')!.split(' ').map(Number);
    const modules = el.querySelectorAll('.strct-qr__module');
    const xs = [...modules].map((m) => Number(m.getAttribute('x')));
    const ys = [...modules].map((m) => Number(m.getAttribute('y')));
    expect(Math.min(...xs)).toBeGreaterThanOrEqual(4);
    expect(Math.min(...ys)).toBeGreaterThanOrEqual(4);
    expect(Math.max(...xs)).toBeLessThanOrEqual(span - 4 - 1);
  });

  it('paints dark modules on a light quiet zone, whatever the theme', () => {
    const { el } = build();
    // Fixed colours on purpose: a themed QR code is an unscannable one.
    const quiet = getComputedStyle(el.querySelector('.strct-qr__quiet') as Element).fill;
    const module = getComputedStyle(el.querySelector('.strct-qr__module') as Element).fill;
    expect([quiet, module]).toEqual(['rgb(255, 255, 255)', 'rgb(0, 0, 0)']);
  });

  it('merges dark modules into runs instead of one rect per module', () => {
    const { el } = build();
    const rects = [...el.querySelectorAll('.strct-qr__module')];
    expect(rects.length).toBeGreaterThan(0);
    // a finder pattern's solid rows become single wide rects
    expect(rects.some((r) => Number(r.getAttribute('width')) >= 7)).toBe(true);
  });
});
