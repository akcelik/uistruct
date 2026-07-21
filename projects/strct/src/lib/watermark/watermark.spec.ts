import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { StrctWatermark } from './watermark';

@Component({
  imports: [StrctWatermark],
  template: `<strct-watermark text="CONFIDENTIAL"><p>content</p></strct-watermark>`,
})
class HostComponent {}

describe('StrctWatermark', () => {
  it('overlays a pointer-transparent, aria-hidden tiled layer over its content', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('content');
    const layer = el.querySelector<HTMLElement>('.strct-wm__layer')!;
    expect(layer.getAttribute('aria-hidden')).toBe('true');
    expect(layer.style.backgroundImage).toContain('data:image/svg+xml');
    expect(decodeURIComponent(layer.style.backgroundImage)).toContain('CONFIDENTIAL');
  });

  it('escapes markup in the text (no SVG injection)', () => {
    const fixture = TestBed.createComponent(StrctWatermark);
    fixture.componentRef.setInput('text', '<script>x</script>');
    fixture.detectChanges();
    const layer = (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>(
      '.strct-wm__layer',
    )!;
    const decoded = decodeURIComponent(layer.style.backgroundImage);
    expect(decoded).not.toContain('<script>');
    expect(decoded).toContain('&lt;script&gt;');
  });
});
