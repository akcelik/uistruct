import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
} from '@angular/core';
import { StrctQrEcc, strctQrMatrix } from './encoder';

/**
 * A QR code the library draws, with the quiet zone and contrast a scanner needs
 * in every theme — not an image the consumer frames on white by hand.
 *
 *   <strct-qr [value]="otpauthUri" label="Scan with your authenticator app" />
 *
 * **Dark modules on a light quiet zone, in every scheme.** That is a deliberate
 * exception to "tokens only": a themed QR code is an unscannable one. Show the
 * secret as text beside it, so enrolment works without a camera.
 */
@Component({
  selector: 'strct-qr',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <svg
      class="strct-qr__svg"
      [attr.viewBox]="viewBox()"
      [attr.width]="size()"
      [attr.height]="size()"
      role="img"
      [attr.aria-label]="label()"
      shape-rendering="crispEdges"
    >
      <rect class="strct-qr__quiet" [attr.width]="span()" [attr.height]="span()" />
      @for (row of rows(); track row.y) {
        @for (run of row.runs; track run.x) {
          <rect
            class="strct-qr__module"
            [attr.x]="run.x"
            [attr.y]="row.y"
            [attr.width]="run.width"
            height="1"
          />
        }
      }
    </svg>
  `,
  host: { class: 'strct-qr' },
  styles: [
    `
      .strct-qr {
        display: inline-flex;
        line-height: 0;
      }
      .strct-qr__svg {
        border-radius: var(--radius-md);
      }
      /* Fixed colours, on purpose: a themed QR code is an unscannable one. */
      .strct-qr__quiet {
        fill: #fff;
      }
      .strct-qr__module {
        fill: #000;
      }
    `,
  ],
})
export class StrctQr {
  /** What the code carries — an `otpauth://` URI, a URL, any text. */
  readonly value = input.required<string>();
  /** Rendered size in px (the code is square). */
  readonly size = input(176);
  /** The code's accessible name. */
  readonly label = input('QR code');
  /** How much of the code a scanner may lose and still read it. */
  readonly errorCorrection = input<StrctQrEcc>('M');
  /** The quiet zone, in modules. Four is what the spec asks for. */
  readonly quietZone = input(4);

  private readonly matrix = computed(() => strctQrMatrix(this.value(), this.errorCorrection()));
  /** The whole drawing's span in modules: the code plus its quiet zone. */
  protected readonly span = computed(() => this.matrix().length + this.quietZone() * 2);
  protected readonly viewBox = computed(() => `0 0 ${this.span()} ${this.span()}`);

  /** Dark modules merged into horizontal runs — far fewer rects to paint. */
  protected readonly rows = computed(() => {
    const m = this.matrix();
    const pad = this.quietZone();
    return m.map((row, y) => {
      const runs: { x: number; width: number }[] = [];
      let start = -1;
      for (let x = 0; x <= row.length; x++) {
        if (row[x]) {
          if (start < 0) start = x;
        } else if (start >= 0) {
          runs.push({ x: start + pad, width: x - start });
          start = -1;
        }
      }
      return { y: y + pad, runs };
    });
  });
}
