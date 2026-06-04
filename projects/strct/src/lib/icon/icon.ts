import { Component, ChangeDetectionStrategy, ViewEncapsulation, computed, input } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { inject } from '@angular/core';

/**
 * Inner markup (path/shape contents) for each icon, drawn on a 0 0 16 16
 * viewBox with `currentColor` stroke. Keep strokes at 1.3–1.5 for crispness.
 *
 * The set is intentionally datacenter-flavoured (hosts, clusters, switches,
 * storage, VMs …). Object state — running / stopped / maintenance — is layered
 * on with the `badge` input rather than a separate icon per state.
 */
export const STRCT_ICONS: Record<string, string> = {
  // ── General UI ───────────────────────────────────────────────
  hexagon: '<path d="M8 1.6l5.5 3.2v6.4L8 14.4 2.5 11.2V4.8L8 1.6z"/>',
  chevronRight: '<path d="M6 3.5L10.5 8 6 12.5"/>',
  chevronLeft: '<path d="M10 3.5L5.5 8 10 12.5"/>',
  chevronDoubleRight: '<path d="M3.5 3.5L8 8l-4.5 4.5M8.5 3.5L13 8l-4.5 4.5"/>',
  chevronDown: '<path d="M3.5 6L8 10.5 12.5 6"/>',
  ellipsis: '<circle cx="3.5" cy="8" r=".9" fill="currentColor" stroke="none"/><circle cx="8" cy="8" r=".9" fill="currentColor" stroke="none"/><circle cx="12.5" cy="8" r=".9" fill="currentColor" stroke="none"/>',
  compass: '<circle cx="8" cy="8" r="6"/><path d="M10.6 5.4l-1.5 3.7-3.7 1.5 1.5-3.7 3.7-1.5z"/>',
  close: '<path d="M4 4l8 8M12 4l-8 8"/>',
  check: '<path d="M3.5 8.5l3 3 6-7"/>',
  menu: '<path d="M3 4.5h10M3 8h10M3 11.5h10"/>',
  dots: '<circle cx="8" cy="3.5" r="1.1" fill="currentColor" stroke="none"/><circle cx="8" cy="8" r="1.1" fill="currentColor" stroke="none"/><circle cx="8" cy="12.5" r="1.1" fill="currentColor" stroke="none"/>',
  search: '<circle cx="7" cy="7" r="4"/><path d="M10 10l3.5 3.5"/>',
  calendar: '<rect x="2.5" y="3.5" width="11" height="10" rx="1.5"/><path d="M2.5 6.5h11M5.5 2v3M10.5 2v3"/>',
  eye: '<path d="M1.5 8S4 3.5 8 3.5 14.5 8 14.5 8 12 12.5 8 12.5 1.5 8 1.5 8z"/><circle cx="8" cy="8" r="2"/>',
  eyeOff: '<path d="M6.3 6.3A2 2 0 009.7 9.7M4.8 4.9C2.8 6.1 1.5 8 1.5 8S4 12.5 8 12.5c1.1 0 2-.2 2.9-.6M13.1 11C14.1 9.9 14.5 8 14.5 8S12 3.5 8 3.5c-.5 0-1 .1-1.4.2M2.5 2.5l11 11"/>',
  upload: '<path d="M8 10.5V3M5 5.8L8 2.8l3 3M3 12.8h10"/>',
  download: '<path d="M8 2.5V10M5 7.2L8 10.2l3-3M3 12.8h10"/>',
  droplet: '<path d="M8 2.4S12 6.6 12 9.4a4 4 0 01-8 0c0-2.8 4-7 4-7z"/>',
  sortAsc: '<path d="M8 3.5v9M5 6.5L8 3.5l3 3"/>',
  sortDesc: '<path d="M8 12.5v-9M5 9.5l3 3 3-3"/>',
  sortNone: '<path d="M5.5 6.5L8 4l2.5 2.5M5.5 9.5L8 12l2.5-2.5"/>',
  sun: '<circle cx="8" cy="8" r="3.2"/><path d="M8 1.5v1.5M8 13v1.5M1.5 8H3M13 8h1.5M3.8 3.8l1 1M11.2 11.2l1 1M3.8 12.2l1-1M11.2 4.8l1-1"/>',
  moon: '<path d="M13 9a5 5 0 01-6-6 5.5 5.5 0 106 6z"/>',
  info: '<circle cx="8" cy="8" r="6"/><path d="M8 7.2v3.6M8 5.2v.2"/>',
  warning: '<path d="M8 2.5l6 11H2l6-11z"/><path d="M8 6.8v3M8 11.6v.2"/>',
  danger: '<circle cx="8" cy="8" r="6"/><path d="M8 5v3.6M8 10.8v.2"/>',
  success: '<circle cx="8" cy="8" r="6"/><path d="M5.2 8.2l2 2 3.6-4"/>',
  bell: '<path d="M8 2.6a3.4 3.4 0 00-3.4 3.4c0 2.9-1.1 3.9-1.1 3.9h9s-1.1-1-1.1-3.9A3.4 3.4 0 008 2.6z"/><path d="M6.8 12.8a1.3 1.3 0 002.4 0"/>',
  heart: '<path d="M8 13.3S2.7 10 2.7 6.3A2.6 2.6 0 018 4.9a2.6 2.6 0 015.3 1.4C13.3 10 8 13.3 8 13.3z"/>',
  layers: '<path d="M8 2l5.5 3-5.5 3-5.5-3L8 2z"/><path d="M2.5 8L8 11l5.5-3"/><path d="M2.5 11L8 14l5.5-3"/>',
  grid: '<rect x="2" y="2.5" width="5" height="5" rx="1"/><rect x="9" y="2.5" width="5" height="5" rx="1"/><rect x="2" y="9" width="5" height="5" rx="1"/><rect x="9" y="9" width="5" height="5" rx="1"/>',
  form: '<rect x="2.5" y="2.5" width="11" height="11" rx="1.5"/><path d="M5 6h6M5 8.5h6M5 11h3.5"/>',
  chart: '<path d="M2.5 13V3M2.5 13H13"/><path d="M5 10l2.3-2.3 2 1.4L12.5 5.5"/>',
  bars: '<path d="M2.5 13V3M2.5 13H13"/><rect x="4.3" y="8.5" width="1.8" height="2.5"/><rect x="7.4" y="6.5" width="1.8" height="4.5"/><rect x="10.5" y="4.5" width="1.8" height="6.5"/>',
  sidebar: '<rect x="2" y="3" width="12" height="10" rx="1.5"/><line x1="6.2" y1="3" x2="6.2" y2="13"/>',
  palette: '<path d="M8 2.2a5.8 5.8 0 100 11.6c.9 0 1.4-.7 1.4-1.4 0-.9-.8-1.2-.8-1.9 0-.5.4-.9 1-.9h1A3.2 3.2 0 0013.8 6 5.9 5.9 0 008 2.2z"/><circle cx="5.4" cy="6.6" r=".7" fill="currentColor" stroke="none"/><circle cx="8" cy="5.2" r=".7" fill="currentColor" stroke="none"/><circle cx="10.4" cy="6.6" r=".7" fill="currentColor" stroke="none"/>',
  gauge: '<path d="M2.6 11.5a6 6 0 1110.8 0"/><path d="M8 8.5l2.6-2.2"/><circle cx="8" cy="8.6" r=".7" fill="currentColor" stroke="none"/>',

  // ── Datacenter / infrastructure ─────────────────────────────
  datacenter: '<rect x="2.5" y="2.5" width="11" height="11" rx="1"/><path d="M5 5h6M5 7.3h6M5 9.6h3.5"/><circle cx="11" cy="9.7" r=".5" fill="currentColor" stroke="none"/>',
  rack: '<rect x="3.5" y="2" width="9" height="12" rx="1"/><path d="M3.5 5.2h9M3.5 8.4h9M3.5 11.6h9"/><circle cx="5.4" cy="3.6" r=".4" fill="currentColor" stroke="none"/><circle cx="5.4" cy="6.8" r=".4" fill="currentColor" stroke="none"/><circle cx="5.4" cy="10" r=".4" fill="currentColor" stroke="none"/>',
  cluster: '<rect x="2" y="2.5" width="5" height="5" rx="1"/><rect x="9" y="2.5" width="5" height="5" rx="1"/><rect x="5.5" y="9" width="5" height="5" rx="1"/><path d="M4.5 7.5l2.5 1.5M11.5 7.5L9 9"/>',
  host: '<rect x="2.5" y="3" width="11" height="4.2" rx="1"/><rect x="2.5" y="8.8" width="11" height="4.2" rx="1"/><circle cx="4.7" cy="5.1" r=".55" fill="currentColor" stroke="none"/><circle cx="4.7" cy="10.9" r=".55" fill="currentColor" stroke="none"/><path d="M7 5.1h4M7 10.9h4"/>',
  vm: '<rect x="2" y="3" width="12" height="8" rx="1"/><path d="M6 14h4M8 11v3"/>',
  switch: '<rect x="2" y="5.5" width="12" height="5" rx="1"/><path d="M4.5 5.5V3.8M7 5.5V3.8M9 5.5V3.8M11.5 5.5V3.8M4.5 10.5v1.7M7 10.5v1.7M9 10.5v1.7M11.5 10.5v1.7"/>',
  storage: '<ellipse cx="8" cy="3.6" rx="5" ry="2"/><path d="M3 3.6v8.8c0 1.1 2.2 2 5 2s5-.9 5-2V3.6"/><path d="M3 8c0 1.1 2.2 2 5 2s5-.9 5-2"/>',
  network: '<circle cx="8" cy="3.4" r="1.7"/><circle cx="3.6" cy="12.4" r="1.7"/><circle cx="12.4" cy="12.4" r="1.7"/><path d="M8 5.1v2.6M7 8.8l-2.4 2M9 8.8l2.4 2"/>',
  cpu: '<rect x="4.5" y="4.5" width="7" height="7" rx="1"/><rect x="6.6" y="6.6" width="2.8" height="2.8" rx=".5"/><path d="M6.5 2.6v1.9M9.5 2.6v1.9M6.5 11.5v1.9M9.5 11.5v1.9M2.6 6.5h1.9M2.6 9.5h1.9M11.5 6.5h1.9M11.5 9.5h1.9"/>',
  memory: '<rect x="2" y="5" width="12" height="6" rx="1"/><path d="M4.5 11v1.6M7 11v1.6M9 11v1.6M11.5 11v1.6M5 7.2h6"/>',
  disk: '<circle cx="8" cy="8" r="5.6"/><circle cx="8" cy="8" r="1.3"/><path d="M8 2.4v2.3"/>',
  port: '<rect x="3" y="5" width="10" height="6" rx="1"/><path d="M6.5 5V3.6h3V5M5 11v1.6M11 11v1.6"/>',
  power: '<path d="M8 2.4v5"/><path d="M5.2 4.6a5 5 0 105.6 0"/>',
  // Network Adapter Card (NIC) — PCIe card with an RJ45 (square) port.
  nic: '<rect x="2.3" y="3.4" width="11.4" height="6.4" rx="1"/><rect x="3.9" y="5.1" width="3.2" height="3" rx=".4"/><path d="M8.6 6.1h3.4M8.6 7.9h3.4M5 9.8v2.6M11 9.8v2.6"/>',
  // Host Bus Adapter (HBA) — PCIe card with optical/SFP (round) ports.
  hba: '<rect x="2.3" y="3.4" width="11.4" height="6.4" rx="1"/><circle cx="5.1" cy="6.6" r="1.2"/><circle cx="8.1" cy="6.6" r="1.2"/><path d="M10.6 5.6h1.6M10.6 7.6h1.6M5 9.8v2.6M11 9.8v2.6"/>',
  // RJ45 ethernet port (switch / server) — keyed jack with contact pins.
  ethernet: '<rect x="2.5" y="4" width="11" height="7.4" rx="1"/><path d="M6 4V2.6h4V4"/><path d="M5.3 7.6v2M7.1 7.6v2M8.9 7.6v2M10.7 7.6v2"/>',

  // ── Accessibility (original glyphs for generic concepts) ─────
  universalAccess: '<circle cx="8" cy="8" r="6"/><circle cx="8" cy="4.9" r=".9" fill="currentColor" stroke="none"/><path d="M4.9 6.3c2 .8 4.2 .8 6.2 0M8 6.4v3.1M6.3 11.9 8 9.4l1.7 2.5"/>',
  wheelchair: '<circle cx="6.5" cy="3.1" r="1.3"/><path d="M6.5 4.5v3.3h3.1l1.7 3.4"/><circle cx="6.7" cy="11.3" r="2.6"/><path d="M9.3 11.3h2.1l-.5 1.6"/>',
  hearing: '<path d="M5 6.2a3 3 0 0 1 6 0c0 2.2-2.2 2.6-2.2 4.7A1.8 1.8 0 0 1 5 10.8"/><path d="M8.6 13.1a2.2 2.2 0 0 0 2.1-2.2"/>',
  lowVision: '<path d="M1.8 8S4.2 4 8 4s6.2 4 6.2 4"/><circle cx="8" cy="8.3" r="2.1"/><path d="M2.6 10.8 4 9.4M13.4 10.8 12 9.4"/>',
  braille: '<circle cx="5" cy="4.5" r=".85" fill="currentColor" stroke="none"/><circle cx="5" cy="8" r=".85" fill="currentColor" stroke="none"/><circle cx="5" cy="11.5" r=".85" fill="currentColor" stroke="none"/><circle cx="9" cy="4.5" r=".85" fill="currentColor" stroke="none"/><circle cx="9" cy="8" r=".85" fill="currentColor" stroke="none"/><circle cx="11.2" cy="6" r=".85" fill="currentColor" stroke="none"/>',
  signLanguage: '<path d="M5.6 9.4V5a1 1 0 0 1 2 0M7.6 8V4.3a1 1 0 0 1 2 0V8M9.6 8V5.3a1 1 0 0 1 2 0v4.2c0 2.1-1.7 3.7-3.8 3.7-1.2 0-2.3-.5-3.1-1.5L4.1 11.5a1 1 0 0 1 1.5-1.3z"/>',

  // ── Alert (original glyphs) ─────────────────────────────────
  siren: '<path d="M3.5 13h9M5 13V8a3 3 0 0 1 6 0v5M8 2.4V4M3.6 4.6l1 .9M12.4 4.6l-1 .9"/>',
  alarm: '<circle cx="8" cy="9" r="4.4"/><path d="M8 6.6V9l1.7 1M5 2.6 3.1 4.3M11 2.6l1.9 1.7M8 4.6V3"/>',
  bellOff: '<path d="M5.5 6.5A2.6 2.6 0 0 1 8 3.7c.4 0 .8.1 1.1.3M10.6 7.1c.1 2.4 1 3.3 1 3.3H5.2M6.8 12.7a1.3 1.3 0 0 0 2.4 0M2.6 2.6l10.8 10.8"/>',
  megaphone: '<path d="M3 7.3v1.6l7 3V4.3zM10 5.7 12.5 4.2v7.6L10 10.3M4 9.6l.9 3.1h1.6l-.7-2.9"/>',
  flag: '<path d="M4 13.5V3M4 3.6h7.4L9.8 6.2l1.6 2.6H4"/>',
  shieldAlert: '<path d="M8 2.3l5.2 1.9v3.3c0 3.1-2.3 5.1-5.2 6.4C5.1 12.6 2.8 10.6 2.8 7.5V4.2z"/><path d="M8 5.5v3.1M8 10.6v.2"/>',

  // ── State / action (also usable as badges via the icon `badge` input) ─
  running: '<path d="M5.5 4l6 4-6 4z"/>',
  stopped: '<rect x="5" y="5" width="6" height="6" rx="1"/>',
  paused: '<rect x="5.2" y="4" width="2" height="8" rx=".5"/><rect x="8.8" y="4" width="2" height="8" rx=".5"/>',
  maintenance: '<path d="M10.8 3.2a2.7 2.7 0 00-3.5 3.4l-4.2 4.2L4.6 12.7l4.2-4.2a2.7 2.7 0 003.4-3.5L10.5 6.7 9.3 6.4 9 5.2z"/>',
  sync: '<path d="M12.5 7a4.5 4.5 0 00-8-2.5M3.5 9a4.5 4.5 0 008 2.5"/><path d="M12.5 3v2.5H10M3.5 13v-2.5H6"/>',
  snapshot: '<rect x="2.5" y="4.5" width="11" height="8" rx="1.5"/><circle cx="8" cy="8.5" r="2.3"/><path d="M6 4.5l1-1.5h2l1 1.5"/>',
  lock: '<rect x="3.5" y="7" width="9" height="6" rx="1.5"/><path d="M5.5 7V5.4a2.5 2.5 0 015 0V7"/>',

  // ── Generic vendor marks (abstract glyphs, NOT real trademarked logos) ─
  vendorVmware: '<rect x="2.5" y="6.5" width="3" height="3.4" rx=".5"/><rect x="6.5" y="6.5" width="3" height="3.4" rx=".5"/><rect x="10.5" y="6.5" width="3" height="3.4" rx=".5"/>',
  vendorCisco: '<path d="M2.5 10.5V7.5M5.5 10.5V5M8 10.5V3.5M10.5 10.5V5M13.5 10.5V7.5"/>',
  vendorHpe: '<rect x="2.5" y="5" width="11" height="6" rx="1"/><path d="M5.5 5v6"/>',
  vendorDell: '<circle cx="8" cy="8" r="5.6"/><path d="M5.4 8h3.4M5.4 6.6h2.6M5.4 9.4h2.6"/>',
  vendorKaytus: '<path d="M5 3v10M5 8l4.5-4.5M5 8l4.5 5"/>',
};

/** Icon names grouped for galleries / documentation. */
export const STRCT_ICON_GROUPS: { label: string; names: string[] }[] = [
  {
    label: 'General',
    names: [
      'hexagon', 'search', 'menu', 'ellipsis', 'dots', 'close', 'check', 'calendar',
      'eye', 'eyeOff', 'upload', 'download', 'sun', 'moon', 'bell', 'heart', 'layers',
      'grid', 'form', 'chart', 'bars', 'gauge', 'palette', 'sidebar', 'compass',
    ],
  },
  {
    label: 'Status',
    names: ['info', 'success', 'warning', 'danger', 'sync', 'lock', 'snapshot'],
  },
  {
    label: 'Alert',
    names: ['bell', 'bellOff', 'siren', 'alarm', 'megaphone', 'flag', 'shieldAlert', 'warning'],
  },
  {
    label: 'Accessibility',
    names: ['universalAccess', 'wheelchair', 'hearing', 'lowVision', 'braille', 'signLanguage'],
  },
  {
    label: 'Datacenter',
    names: [
      'datacenter', 'rack', 'cluster', 'host', 'vm', 'switch', 'storage',
      'network', 'cpu', 'memory', 'disk', 'port', 'nic', 'hba', 'ethernet', 'power',
    ],
  },
  {
    label: 'Object state',
    names: ['running', 'stopped', 'paused', 'maintenance'],
  },
  {
    label: 'Vendor (generic)',
    names: ['vendorVmware', 'vendorCisco', 'vendorHpe', 'vendorDell', 'vendorKaytus'],
  },
];

/**
 * Full-SVG icons that keep their own viewBox and colors (no stroke wrapper).
 * Use this for brand / vendor logos you have the rights to ship — register the
 * official asset's markup yourself; the library does not bundle any logos.
 */
export const STRCT_RAW_ICONS: Record<string, string> = {};

/**
 * Register an icon at runtime.
 *   registerStrctIcon('mything', '<path d="…"/>');                 // stroke glyph
 *   registerStrctIcon('vendorDell', '<svg viewBox="…">…</svg>', { raw: true });
 */
export function registerStrctIcon(
  name: string,
  content: string,
  options: { raw?: boolean } = {},
): void {
  if (options.raw) {
    STRCT_RAW_ICONS[name] = content;
  } else {
    STRCT_ICONS[name] = content;
  }
}

export type StrctIconBadge = 'none' | 'ok' | 'warn' | 'crit' | 'off' | 'info';

/**
 * Inline stroke icon. `<strct-icon name="host" badge="ok" />` renders the host
 * glyph with a green status dot (a "running host"). Unknown names render
 * nothing rather than throwing.
 */
@Component({
  selector: 'strct-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `@if (isRaw()) {
      <span class="strct-icon__raw" [style.width.px]="size()" [style.height.px]="size()" [innerHTML]="rawSvg()"></span>
    } @else {
      <svg
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        [attr.stroke-width]="strokeWidth()"
        stroke-linecap="round"
        stroke-linejoin="round"
        [style.width.px]="size()"
        [style.height.px]="size()"
        [innerHTML]="svg()"
      ></svg>
    }
    @if (badge() !== 'none') {
      <span class="strct-icon__badge strct-icon__badge--{{ badge() }}"></span>
    }`,
  host: { class: 'strct-icon' },
  styles: [
    `
    .strct-icon { position: relative; display: inline-flex; align-items: center; justify-content: center; line-height: 0; }
    .strct-icon__raw { display: inline-flex; }
    .strct-icon__raw > svg { width: 100%; height: 100%; display: block; }
    .strct-icon__badge {
      position: absolute; right: -1px; bottom: -1px;
      width: 38%; height: 38%; min-width: 6px; min-height: 6px; max-width: 9px; max-height: 9px;
      border-radius: 50%; box-shadow: 0 0 0 1.5px var(--bg-1);
    }
    .strct-icon__badge--ok { background: var(--ok); }
    .strct-icon__badge--warn { background: var(--wrn); }
    .strct-icon__badge--crit { background: var(--crt); }
    .strct-icon__badge--off { background: var(--t3); }
    .strct-icon__badge--info { background: var(--acc); }
    `,
  ],
})
export class StrctIcon {
  private readonly sanitizer = inject(DomSanitizer);

  readonly name = input.required<string>();
  readonly size = input(16);
  readonly strokeWidth = input(1.4);
  /** Optional status dot overlaid on the glyph (object state). */
  readonly badge = input<StrctIconBadge>('none');

  /** True when the named icon is a full-SVG (raw) icon registered by the app. */
  protected readonly isRaw = computed(() =>
    Object.prototype.hasOwnProperty.call(STRCT_RAW_ICONS, this.name()),
  );

  protected readonly svg = computed<SafeHtml>(() =>
    this.sanitizer.bypassSecurityTrustHtml(STRCT_ICONS[this.name()] ?? ''),
  );
  protected readonly rawSvg = computed<SafeHtml>(() =>
    this.sanitizer.bypassSecurityTrustHtml(STRCT_RAW_ICONS[this.name()] ?? ''),
  );
}
