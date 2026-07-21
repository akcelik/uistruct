import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
} from '@angular/core';
import { DomSanitizer, SafeStyle } from '@angular/platform-browser';
import { inject } from '@angular/core';

/**
 * Repeating diagonal text watermark over its content — compliance overlays
 * for classified/internal consoles ("CONFIDENTIAL", "user@corp · 2026-07-21"):
 *
 *   <strct-watermark text="CONFIDENTIAL">…page…</strct-watermark>
 *
 * Rendered as a pointer-transparent tiled SVG layer, so the content below
 * stays fully interactive and selectable. Purely visual — `aria-hidden`.
 */
@Component({
  selector: 'strct-watermark',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <ng-content />
    <div class="strct-wm__layer" aria-hidden="true" [style.background-image]="tile()"></div>
  `,
  host: { class: 'strct-wm' },
  styles: [
    `
      .strct-wm {
        position: relative;
        display: block;
      }
      .strct-wm__layer {
        position: absolute;
        inset: 0;
        pointer-events: none;
        background-repeat: repeat;
        z-index: 5;
      }
    `,
  ],
})
export class StrctWatermark {
  private readonly sanitizer = inject(DomSanitizer);
  /** The repeated watermark text. */
  readonly text = input.required<string>();
  /** Layer opacity (0–1). */
  readonly opacity = input(0.06);
  /** Rotation in degrees (negative = up-slope). */
  readonly angle = input(-24);
  /** Tile size in px — larger spreads the marks out. */
  readonly gap = input(220);
  /** Font size in px. */
  readonly fontSize = input(15);

  protected readonly tile = computed<SafeStyle>(() => {
    const size = this.gap();
    const svg =
      `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">` +
      `<text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" ` +
      `transform="rotate(${this.angle()} ${size / 2} ${size / 2})" ` +
      `font-family="sans-serif" font-size="${this.fontSize()}" font-weight="600" ` +
      `fill="currentColor" fill-opacity="${this.opacity()}">${escapeXml(this.text())}</text></svg>`;
    return this.sanitizer.bypassSecurityTrustStyle(
      `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`,
    );
  });
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
