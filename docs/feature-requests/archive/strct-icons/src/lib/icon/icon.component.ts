import { ChangeDetectionStrategy, Component, computed, input, isDevMode } from '@angular/core';
import { STRCT_ICON_STROKE_PX, StrctIconName, StrctIconSize, StrctIconState } from './icon.types';

let uid = 0;

/**
 * UIStruct sanallaştırma ikonu.
 *
 * Kural seti:
 *  - Kimlik çerçevede: düz çerçeve = fiziksel (host), kesikli çerçeve = sanal (vm*).
 *  - Türev nesne (template/snapshot/clone/migration) ve power state sağ altta rozet olarak gelir.
 *  - Renk yalnızca state rozetinde kullanılır; gövde daima currentColor.
 *  - Rozet alanı SVG mask ile gövdeden oyulur, böylece ikon her zemin rengi üzerinde doğru görünür.
 *
 * Örnek:
 *  <strct-icon name="vm" state="running" />
 *  <strct-icon name="vm-snapshot" [size]="48" label="Snapshot" />
 */
@Component({
  selector: 'strct-icon',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'strct-icon',
    '[class.strct-icon--off]': "state() === 'off'",
    '[style.width.px]': 'size()',
    '[style.height.px]': 'size()',
  },
  styleUrl: './icon.component.scss',
  template: `
    @if (size() === 16) {
      <svg
        viewBox="0 0 16 16"
        [attr.width]="16"
        [attr.height]="16"
        [attr.role]="label() ? 'img' : null"
        [attr.aria-label]="label() || null"
        [attr.aria-hidden]="label() ? null : 'true'"
        focusable="false"
        fill="none"
        stroke="currentColor"
        stroke-width="1"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        @if (state() && !isVirtual()) {
          <mask
            [attr.id]="maskId"
            maskUnits="userSpaceOnUse"
            x="0"
            y="0"
            width="100%"
            height="100%"
          >
            <path
              fill="#fff"
              fill-rule="evenodd"
              d="M0 0H16V16H0ZM13 9.4A3.6 3.6 0 1 0 13 16.6A3.6 3.6 0 1 0 13 9.4Z"
            />
          </mask>
        }
        <g class="strct-icon__body">
          @if (isVirtual()) {
            <!-- Köşe parantezleri; state varken sağ alt parantez rozete yer açmak için çizilmez (maske yok → hayalet iz yok). -->
            <path
              d="M2 6V4.5A2.5 2.5 0 0 1 4.5 2H6M10 2H11.5A2.5 2.5 0 0 1 14 4.5V6M6 14H4.5A2.5 2.5 0 0 1 2 11.5V10"
            />
            @if (!state()) {
              <path d="M14 10V11.5A2.5 2.5 0 0 1 11.5 14H10" />
            }
          } @else {
            <rect
              x="2"
              y="2"
              width="12"
              height="12"
              rx="2.5"
              [attr.mask]="state() ? 'url(#' + maskId + ')' : null"
            />
          }
          <rect x="4.5" y="6" width="7" height="4" rx="0.8" />
        </g>
        @if (state(); as s) {
          @if (s === 'off') {
            <circle class="strct-icon__state strct-icon__state--off" cx="13" cy="13" r="2" />
          } @else {
            <circle
              [attr.class]="'strct-icon__state strct-icon__state--' + s"
              cx="13"
              cy="13"
              r="2.4"
              stroke="none"
            />
          }
        }
      </svg>
    } @else {
      <svg
        viewBox="0 0 36 36"
        [attr.width]="size()"
        [attr.height]="size()"
        [attr.role]="label() ? 'img' : null"
        [attr.aria-label]="label() || null"
        [attr.aria-hidden]="label() ? null : 'true'"
        focusable="false"
        fill="none"
        stroke="currentColor"
        [attr.stroke-width]="strokeWidth()"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        @if (badged() && !isVirtual()) {
          <mask
            [attr.id]="maskId"
            maskUnits="userSpaceOnUse"
            x="0"
            y="0"
            width="100%"
            height="100%"
          >
            <path
              fill="#fff"
              fill-rule="evenodd"
              d="M0 0H36V36H0ZM29 19.5A9.5 9.5 0 1 0 29 38.5A9.5 9.5 0 1 0 29 19.5Z"
            />
          </mask>
        }
        <g class="strct-icon__body">
          @if (isVirtual() && badged()) {
            <!-- Rozet çemberinin (r=9.5) dışında kalan açık yol; pathLength=90 + offset=8 ile iki uçta da eşit boşluk kalır. -->
            <path
              d="M20.383 33H8A5 5 0 0 1 3 28V8A5 5 0 0 1 8 3H28A5 5 0 0 1 33 8V20.383"
              pathLength="90"
              stroke-dasharray="6 4"
              stroke-dashoffset="8"
            />
          } @else if (isVirtual()) {
            <!-- pathLength=110 → tam 11 periyot; başlangıç/bitiş dikişi görünmez. -->
            <rect
              x="3"
              y="3"
              width="30"
              height="30"
              rx="5"
              pathLength="110"
              stroke-dasharray="6 4"
              stroke-dashoffset="8"
            />
          } @else {
            <rect
              x="3"
              y="3"
              width="30"
              height="30"
              rx="5"
              [attr.mask]="badged() ? 'url(#' + maskId + ')' : null"
            />
          }
          @if (badged()) {
            <rect x="8" y="9" width="17" height="9" rx="1.5" />
            <path d="M15.5 13.5H21" />
            <circle cx="11.5" cy="13.5" r="1.1" />
          } @else {
            <rect x="9" y="13" width="18" height="10" rx="1.5" />
            <path d="M17 18H23" />
            <circle cx="13" cy="18" r="1.2" />
          }
        </g>

        @if (state(); as s) {
          @switch (s) {
            @case ('running') {
              <circle
                class="strct-icon__state strct-icon__state--running"
                cx="29"
                cy="29"
                r="6.6"
                stroke="none"
              />
            }
            @case ('off') {
              <circle
                class="strct-icon__state strct-icon__state--off"
                cx="29"
                cy="29"
                r="5.6"
                stroke-width="1.9"
              />
            }
            @case ('suspended') {
              <circle
                class="strct-icon__state strct-icon__state--suspended"
                cx="29"
                cy="29"
                r="6.8"
                stroke="none"
              />
              <path
                class="strct-icon__state-mark"
                d="M27 26.4V31.6M31 26.4V31.6"
                stroke-width="1.8"
              />
            }
            @case ('error') {
              <circle
                class="strct-icon__state strct-icon__state--error"
                cx="29"
                cy="29"
                r="6.8"
                stroke="none"
              />
              <path
                class="strct-icon__state-mark"
                d="M29 25.6V29.6M29 32.4H29.01"
                stroke-width="2"
              />
            }
          }
        } @else {
          @switch (name()) {
            @case ('vm-template') {
              <rect x="24.2" y="23" width="9.6" height="12" rx="1.4" />
              <path d="M26.7 27H31.3M26.7 30.5H30" />
            }
            @case ('vm-snapshot') {
              <circle cx="29" cy="29" r="6.3" />
              <path d="M29 25.6V29L31.4 30.9" />
            }
            @case ('vm-clone') {
              <rect x="22.8" y="25.8" width="8" height="8" rx="1.3" />
              <path
                d="M26.3 25.8V23.8A1.3 1.3 0 0 1 27.6 22.5H33.9A1.3 1.3 0 0 1 35.2 23.8V30.1A1.3 1.3 0 0 1 33.9 31.4H30.8"
              />
            }
            @case ('vm-migration') {
              <path
                d="M22.8 26H34.6M31.8 23.2L34.6 26L31.8 28.8M35.2 32H23.4M26.2 29.2L23.4 32L26.2 34.8"
              />
            }
          }
        }
      </svg>
    }
  `,
})
export class StrctIconComponent {
  readonly name = input<StrctIconName>('vm');
  readonly size = input<StrctIconSize>(24);
  readonly state = input<StrctIconState | null>(null);
  /** Verilirse ikon role="img" + aria-label alır; verilmezse dekoratif kabul edilir. */
  readonly label = input<string>('');

  protected readonly maskId = `strct-icon-mask-${++uid}`;

  protected readonly isVirtual = computed(() => this.name() !== 'host');

  /** Türev nesne rozeti mi var? (state rozeti türev rozetin önüne geçer) */
  private readonly typeBadge = computed(() => this.name() !== 'host' && this.name() !== 'vm');

  protected readonly badged = computed(() => !!this.state() || this.typeBadge());

  /** 36'lık viewBox içinde, ekranda hedef px kalınlığını verecek stroke-width. */
  protected readonly strokeWidth = computed(() => {
    const s = this.size();
    return s === 16 ? 1 : (STRCT_ICON_STROKE_PX[s] * 36) / s;
  });

  constructor() {
    if (isDevMode()) {
      queueMicrotask(() => {
        if (this.size() === 16 && this.typeBadge()) {
          console.warn(
            `[strct-icon] "${this.name()}" türev rozeti 16px'te okunmaz; 16px'te temel VM ikonu çizildi. ` +
              `Nesne tipinin önemli olduğu yerlerde 24px kullanın.`,
          );
        }
        if (this.state() && this.typeBadge()) {
          console.warn(
            `[strct-icon] "${this.name()}" için hem tip hem state rozeti istendi; yalnızca state rozeti gösterilir.`,
          );
        }
      });
    }
  }
}
