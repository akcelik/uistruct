import {
  Component,
  ChangeDetectionStrategy,
  ViewEncapsulation,
  computed,
  input,
} from '@angular/core';
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
  compass: '<circle cx="8" cy="8" r="6"/><path d="M10.6 5.4l-1.5 3.7-3.7 1.5 1.5-3.7 3.7-1.5z"/>',
  close: '<path d="M4 4l8 8M12 4l-8 8"/>',
  check: '<path d="M3.5 8.5l3 3 6-7"/>',
  menu: '<path d="M3 4.5h10M3 8h10M3 11.5h10"/>',
  dots: '<circle cx="8" cy="3.5" r="1.1" fill="currentColor" stroke="none"/><circle cx="8" cy="8" r="1.1" fill="currentColor" stroke="none"/><circle cx="8" cy="12.5" r="1.1" fill="currentColor" stroke="none"/>',
  search: '<circle cx="7" cy="7" r="4"/><path d="M10 10l3.5 3.5"/>',
  calendar:
    '<rect x="2.5" y="3.5" width="11" height="10" rx="1.5"/><path d="M2.5 6.5h11M5.5 2v3M10.5 2v3"/>',
  eye: '<path d="M1.5 8S4 3.5 8 3.5 14.5 8 14.5 8 12 12.5 8 12.5 1.5 8 1.5 8z"/><circle cx="8" cy="8" r="2"/>',
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
  critical: '<circle cx="8" cy="8" r="6"/><path d="M8 5v3.6M8 10.8v.2"/>',
  success: '<circle cx="8" cy="8" r="6"/><path d="M5.2 8.2l2 2 3.6-4"/>',
  bell: '<path d="M8 2.6a3.4 3.4 0 00-3.4 3.4c0 2.9-1.1 3.9-1.1 3.9h9s-1.1-1-1.1-3.9A3.4 3.4 0 008 2.6z"/><path d="M6.8 12.8a1.3 1.3 0 002.4 0"/>',
  heart:
    '<path d="M8 13.3S2.7 10 2.7 6.3A2.6 2.6 0 018 4.9a2.6 2.6 0 015.3 1.4C13.3 10 8 13.3 8 13.3z"/>',
  layers:
    '<path d="M8 2l5.5 3-5.5 3-5.5-3L8 2z"/><path d="M2.5 8L8 11l5.5-3"/><path d="M2.5 11L8 14l5.5-3"/>',
  grid: '<rect x="2" y="2.5" width="5" height="5" rx="1"/><rect x="9" y="2.5" width="5" height="5" rx="1"/><rect x="2" y="9" width="5" height="5" rx="1"/><rect x="9" y="9" width="5" height="5" rx="1"/>',
  form: '<rect x="2.5" y="2.5" width="11" height="11" rx="1.5"/><path d="M5 6h6M5 8.5h6M5 11h3.5"/>',
  chart: '<path d="M2.5 13V3M2.5 13H13"/><path d="M5 10l2.3-2.3 2 1.4L12.5 5.5"/>',
  bars: '<path d="M2.5 13V3M2.5 13H13"/><rect x="4.3" y="8.5" width="1.8" height="2.5"/><rect x="7.4" y="6.5" width="1.8" height="4.5"/><rect x="10.5" y="4.5" width="1.8" height="6.5"/>',
  sidebar:
    '<rect x="2" y="3" width="12" height="10" rx="1.5"/><line x1="6.2" y1="3" x2="6.2" y2="13"/>',
  palette:
    '<path d="M8 2.2a5.8 5.8 0 100 11.6c.9 0 1.4-.7 1.4-1.4 0-.9-.8-1.2-.8-1.9 0-.5.4-.9 1-.9h1A3.2 3.2 0 0013.8 6 5.9 5.9 0 008 2.2z"/><circle cx="5.4" cy="6.6" r=".7" fill="currentColor" stroke="none"/><circle cx="8" cy="5.2" r=".7" fill="currentColor" stroke="none"/><circle cx="10.4" cy="6.6" r=".7" fill="currentColor" stroke="none"/>',
  gauge:
    '<path d="M2.6 11.5a6 6 0 1110.8 0"/><path d="M8 8.5l2.6-2.2"/><circle cx="8" cy="8.6" r=".7" fill="currentColor" stroke="none"/>',
  copy: '<rect x="5" y="5" width="8" height="8" rx="1.4"/><path d="M11 5V3.9A1.4 1.4 0 0 0 9.6 2.5H3.9A1.4 1.4 0 0 0 2.5 3.9v5.7A1.4 1.4 0 0 0 3.9 11H5"/>',
  code: '<path d="M5.5 5L2.5 8l3 3M10.5 5l3 3-3 3M9 3.5l-2 9"/>',
  book: '<path d="M3 3.2h6a1.5 1.5 0 0 1 1.5 1.5v8.1H4.5A1.5 1.5 0 0 1 3 11.3z"/><path d="M13 3.2H9.5A1.5 1.5 0 0 0 8 4.7v8.1h5z"/>',
  terminal:
    '<rect x="2" y="3" width="12" height="10" rx="1.5"/><path d="M4.8 6.5L7 8.2 4.8 9.9M8.2 10.2h3"/>',
  folder:
    '<path d="M2 4.6a1 1 0 0 1 1-1h3.1l1.3 1.6H13a1 1 0 0 1 1 1V12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1z"/>',
  template:
    '<path d="M4.3 2.5h4.6l3.1 3.1V13a.5.5 0 0 1-.5.5H4.3a.5.5 0 0 1-.5-.5V3a.5.5 0 0 1 .5-.5z"/><path d="M8.7 2.6v3.1h3.1"/><path d="M5.8 9h4.2M5.8 11h2.6"/>',
  tag: '<path d="M2.6 7.7V3.2a.6.6 0 0 1 .6-.6h4.5l5.6 5.6a1 1 0 0 1 0 1.4l-3.5 3.5a1 1 0 0 1-1.4 0z"/><circle cx="5.4" cy="5.4" r=".9" fill="currentColor" stroke="none"/>',

  // ── Actions ──────────────────────────────────────────────────
  plus: '<path d="M8 3v10M3 8h10"/>',
  minus: '<path d="M3 8h10"/>',
  pencil: '<path d="M11.5 2.5l2 2-8.5 8.5-3 .5.5-3z"/>',
  trash:
    '<path d="M3 4.5h10"/><path d="M6.3 4.5v-1a1 1 0 0 1 1-1h1.4a1 1 0 0 1 1 1v1"/><path d="M4.2 4.5L5 13.3a1 1 0 0 0 1 .9h4a1 1 0 0 0 1-.9L11.8 4.5"/><path d="M6.6 6.9v4.6M8 6.9v4.6M9.4 6.9v4.6"/>',
  refresh: '<path d="M13.5 7.5a5.5 5.5 0 11-2-5.2"/><path d="M13.5 2.5v3.5H10"/>',
  filter: '<path d="M2 3.5h12l-4.5 5.5v4.5h-3V9z"/>',
  settings:
    '<path d="M8 5.5a2.5 2.5 0 100 5 2.5 2.5 0 000-5z"/><path d="M7.2 1.5h1.6l.3 1.8c.4.1.8.3 1.2.5l1.5-1.1 1.1 1.1-1.1 1.5c.2.4.4.8.5 1.2l1.8.3v1.6l-1.8.3c-.1.4-.3.8-.5 1.2l1.1 1.5-1.1 1.1-1.5-1.1c-.4.2-.8.4-1.2.5l-.3 1.8H7.2l-.3-1.8a5.4 5.4 0 01-1.2-.5l-1.5 1.1-1.1-1.1 1.1-1.5a5.4 5.4 0 01-.5-1.2l-1.8-.3V7.2l1.8-.3c.1-.4.3-.8.5-1.2L2.7 4.2l1.1-1.1 1.5 1.1c.4-.2.8-.4 1.2-.5z"/>',
  user: '<path d="M8 8a2.5 2.5 0 100-5A2.5 2.5 0 008 8z"/><path d="M3 14.5c0-2.8 2.2-5 5-5s5 2.2 5 5"/>',
  logout: '<path d="M10 3.5h2a1 1 0 011 1v7a1 1 0 01-1 1h-2M6.5 5.5L3.5 8l3 3M3.5 8h6.5"/>',
  undo: '<path d="M4.5 5.5L2 8l2.5 2.5M2.5 8h7a3 3 0 013 3v.5"/>',
  redo: '<path d="M11.5 5.5L14 8l-2.5 2.5M13.5 8h-7a3 3 0 00-3 3v.5"/>',
  arrowUp: '<path d="M8 13V3M3.5 6.5L8 2l4.5 4.5"/>',
  arrowDown: '<path d="M8 3v10M3.5 9.5L8 14l4.5-4.5"/>',
  arrowLeft: '<path d="M13 8H3M6.5 3.5L2 8l4.5 4.5"/>',
  arrowRight: '<path d="M3 8h10M9.5 3.5L14 8l-4.5 4.5"/>',
  externalLink:
    '<path d="M9 2.5h4.5V7M13.5 2.5L8.5 7.5M11.5 9v3.5a1 1 0 01-1 1h-7a1 1 0 01-1-1v-7a1 1 0 011-1H7"/>',

  // ── Datacenter / infrastructure ─────────────────────────────
  datacenter:
    '<rect x="2.5" y="2.5" width="11" height="11" rx="1"/><path d="M5 5h6M5 7.3h6M5 9.6h3.5"/><circle cx="11" cy="9.7" r=".5" fill="currentColor" stroke="none"/>',
  rack: '<rect x="3.5" y="2" width="9" height="12" rx="1"/><path d="M3.5 5.2h9M3.5 8.4h9M3.5 11.6h9"/><circle cx="5.4" cy="3.6" r=".4" fill="currentColor" stroke="none"/><circle cx="5.4" cy="6.8" r=".4" fill="currentColor" stroke="none"/><circle cx="5.4" cy="10" r=".4" fill="currentColor" stroke="none"/>',
  cluster:
    '<rect x="3" y="3.5" width="3" height="9" rx="1"/><rect x="6.5" y="2.5" width="3" height="11" rx="1"/><rect x="10" y="3.5" width="3" height="9" rx="1"/><circle cx="4.5" cy="6" r=".5" fill="currentColor" stroke="none"/><circle cx="4.5" cy="8" r=".5" fill="currentColor" stroke="none"/><circle cx="4.5" cy="10" r=".5" fill="currentColor" stroke="none"/><circle cx="8" cy="5" r=".5" fill="currentColor" stroke="none"/><circle cx="8" cy="7" r=".5" fill="currentColor" stroke="none"/><circle cx="8" cy="9" r=".5" fill="currentColor" stroke="none"/><circle cx="8" cy="11" r=".5" fill="currentColor" stroke="none"/><circle cx="11.5" cy="6" r=".5" fill="currentColor" stroke="none"/><circle cx="11.5" cy="8" r=".5" fill="currentColor" stroke="none"/><circle cx="11.5" cy="10" r=".5" fill="currentColor" stroke="none"/>',
  host: '<rect x="2.5" y="3" width="11" height="4.2" rx="1"/><rect x="2.5" y="8.8" width="11" height="4.2" rx="1"/><circle cx="4.7" cy="5.1" r=".55" fill="currentColor" stroke="none"/><circle cx="4.7" cy="10.9" r=".55" fill="currentColor" stroke="none"/><path d="M7 5.1h4M7 10.9h4"/>',
  vm: '<rect x="2" y="3" width="12" height="8" rx="1"/><path d="M6 14h4M8 11v3"/>',
  // Network switch — front-panel view: chassis + status LEDs + a row of RJ45 ports.
  switch:
    '<rect x="1.5" y="5" width="13" height="6" rx="1"/><circle cx="3.5" cy="6.6" r=".5" fill="currentColor" stroke="none"/><circle cx="3.5" cy="9.4" r=".5" fill="currentColor" stroke="none"/><rect x="5.3" y="7.2" width="1.6" height="2.6" rx=".3"/><rect x="7.5" y="7.2" width="1.6" height="2.6" rx=".3"/><rect x="9.7" y="7.2" width="1.6" height="2.6" rx=".3"/><rect x="11.9" y="7.2" width="1.6" height="2.6" rx=".3"/>',
  storage:
    '<ellipse cx="8" cy="3.6" rx="5" ry="2"/><path d="M3 3.6v8.8c0 1.1 2.2 2 5 2s5-.9 5-2V3.6"/><path d="M3 8c0 1.1 2.2 2 5 2s5-.9 5-2"/>',
  network:
    '<circle cx="8" cy="3.4" r="1.7"/><circle cx="3.6" cy="12.4" r="1.7"/><circle cx="12.4" cy="12.4" r="1.7"/><path d="M8 5.1v2.6M7 8.8l-2.4 2M9 8.8l2.4 2"/>',
  cpu: '<rect x="4.5" y="4.5" width="7" height="7" rx="1"/><rect x="6.6" y="6.6" width="2.8" height="2.8" rx=".5"/><path d="M6.5 2.6v1.9M9.5 2.6v1.9M6.5 11.5v1.9M9.5 11.5v1.9M2.6 6.5h1.9M2.6 9.5h1.9M11.5 6.5h1.9M11.5 9.5h1.9"/>',
  memory:
    '<rect x="2" y="5" width="12" height="6" rx="1"/><path d="M4.5 11v1.6M7 11v1.6M9 11v1.6M11.5 11v1.6M5 7.2h6"/>',
  disk: '<circle cx="8" cy="8" r="5.6"/><circle cx="8" cy="8" r="1.3"/><path d="M8 2.4v2.3"/>',
  port: '<rect x="3" y="5" width="10" height="6" rx="1"/><path d="M6.5 5V3.6h3V5M5 11v1.6M11 11v1.6"/>',
  power: '<path d="M8 2.4v5"/><path d="M5.2 4.6a5 5 0 105.6 0"/>',
  // Network Adapter Card (NIC) — PCIe card with an RJ45 (square) port.
  nic: '<rect x="2.3" y="3.4" width="11.4" height="6.4" rx="1"/><rect x="3.9" y="5.1" width="3.2" height="3" rx=".4"/><path d="M8.6 6.1h3.4M8.6 7.9h3.4M5 9.8v2.6M11 9.8v2.6"/>',
  // Host Bus Adapter (HBA) — PCIe card with optical/SFP (round) ports.
  hba: '<rect x="2.3" y="3.4" width="11.4" height="6.4" rx="1"/><circle cx="5.1" cy="6.6" r="1.2"/><circle cx="8.1" cy="6.6" r="1.2"/><path d="M10.6 5.6h1.6M10.6 7.6h1.6M5 9.8v2.6M11 9.8v2.6"/>',
  // RJ45 ethernet port (switch / server) — keyed jack with contact pins.
  ethernet:
    '<rect x="2.5" y="4" width="11" height="7.4" rx="1"/><path d="M6 4V2.6h4V4"/><path d="M5.3 7.6v2M7.1 7.6v2M8.9 7.6v2M10.7 7.6v2"/>',
  // Resource pool — a proportional allocation (pie with two radii).
  resourcePool: '<circle cx="8" cy="8" r="5.6"/><path d="M8 8V2.4M8 8l4.9 2.7"/>',
  // Port group — a grouped set of switch ports under a shared rail.
  portGroup:
    '<path d="M1.8 4.4h12.4"/><rect x="2.2" y="6.2" width="3.4" height="4" rx=".5"/><rect x="6.3" y="6.2" width="3.4" height="4" rx=".5"/><rect x="10.4" y="6.2" width="3.4" height="4" rx=".5"/><path d="M3.9 10.2v1.6M8 10.2v1.6M12.1 10.2v1.6"/>',

  // ── Modern infrastructure ────────────────────────────────────
  pod: '<path d="M3 4.5c0-1.1 2.2-2 5-2s5 .9 5 2v7c0 1.1-2.2 2-5 2s-5-.9-5-2z"/><path d="M3 4.5c0 1.1 2.2 2 5 2s5-.9 5-2"/>',
  deployment:
    '<rect x="2.5" y="2.5" width="11" height="4.5" rx="1"/><rect x="2.5" y="9" width="11" height="4.5" rx="1"/><path d="M11.5 5.5l2.5-1.5v4l-2.5-1.5"/>',
  service:
    '<circle cx="4.5" cy="8" r="2"/><circle cx="11.5" cy="4.5" r="2"/><circle cx="11.5" cy="11.5" r="2"/><path d="M6.2 6.8l3.3-1.3M6.2 9.2l3.3 1.3"/>',
  node: '<rect x="2.5" y="4" width="11" height="8" rx="1"/><path d="M5 7h6M5 10h3"/><circle cx="11" cy="10" r=".7" fill="currentColor" stroke="none"/>',
  ingress: '<path d="M1.5 4.5h10M1.5 8h8M1.5 11.5h10"/><path d="M10.5 6.5l3 1.5-3 1.5"/>',
  cloud: '<path d="M11.5 10.5a2.5 2.5 0 00-1.5-4.5 2.8 2.8 0 00-5.2.3A2.5 2.5 0 004 10.5z"/>',
  container:
    '<rect x="2.5" y="2.5" width="11" height="11" rx="1.5"/><path d="M2.5 5.5h11M5.5 5.5V3M8 5.5V3M10.5 5.5V3"/>',
  firewall: '<path d="M1.5 4h13v8h-13z"/><path d="M1.5 6.5h13M5 6.5V12M8 4V12M11 6.5V12"/>',
  shield: '<path d="M8 2.3l5.2 1.9v3.3c0 3.1-2.3 5.1-5.2 6.4C5.1 12.6 2.8 10.6 2.8 7.5V4.2z"/>',
  certificate:
    '<path d="M3 2.5h10v9H3z"/><path d="M3 5.5h10M6 8h4"/><circle cx="8" cy="11" r=".6" fill="currentColor" stroke="none"/><path d="M12 3.5l2 1.5-2 1.5V3.5z"/>',
  key: '<circle cx="5" cy="9" r="2.8"/><path d="M6.9 7.1l5.6-5.6M11 4.5h2.5V7"/>',
  metrics: '<path d="M2.5 13V3M2.5 13H13"/><path d="M4.5 10l2.5-4 2 2 3-5"/>',
  logs: '<path d="M3 4.5h10M3 7h10M3 9.5h7M3 12h4"/>',
  trace:
    '<circle cx="3.5" cy="5.5" r="1.2"/><circle cx="8" cy="11" r="1.2"/><circle cx="12.5" cy="5.5" r="1.2"/><path d="M4.5 6.3l2.5 3.4M9 9.2l2.5-3.4"/>',

  // ── Accessibility (original glyphs for generic concepts) ─────
  universalAccess:
    '<circle cx="8" cy="8" r="6"/><circle cx="8" cy="4.9" r=".9" fill="currentColor" stroke="none"/><path d="M4.9 6.3c2 .8 4.2 .8 6.2 0M8 6.4v3.1M6.3 11.9 8 9.4l1.7 2.5"/>',
  wheelchair:
    '<circle cx="6.5" cy="3.1" r="1.3"/><path d="M6.5 4.5v3.3h3.1l1.7 3.4"/><circle cx="6.7" cy="11.3" r="2.6"/><path d="M9.3 11.3h2.1l-.5 1.6"/>',
  hearing:
    '<path d="M5 6.2a3 3 0 0 1 6 0c0 2.2-2.2 2.6-2.2 4.7A1.8 1.8 0 0 1 5 10.8"/><path d="M8.6 13.1a2.2 2.2 0 0 0 2.1-2.2"/>',
  lowVision:
    '<path d="M1.8 8S4.2 4 8 4s6.2 4 6.2 4"/><circle cx="8" cy="8.3" r="2.1"/><path d="M2.6 10.8 4 9.4M13.4 10.8 12 9.4"/>',
  braille:
    '<circle cx="5" cy="4.5" r=".85" fill="currentColor" stroke="none"/><circle cx="5" cy="8" r=".85" fill="currentColor" stroke="none"/><circle cx="5" cy="11.5" r=".85" fill="currentColor" stroke="none"/><circle cx="9" cy="4.5" r=".85" fill="currentColor" stroke="none"/><circle cx="9" cy="8" r=".85" fill="currentColor" stroke="none"/><circle cx="11.2" cy="6" r=".85" fill="currentColor" stroke="none"/>',
  signLanguage:
    '<path d="M5.6 9.4V5a1 1 0 0 1 2 0M7.6 8V4.3a1 1 0 0 1 2 0V8M9.6 8V5.3a1 1 0 0 1 2 0v4.2c0 2.1-1.7 3.7-3.8 3.7-1.2 0-2.3-.5-3.1-1.5L4.1 11.5a1 1 0 0 1 1.5-1.3z"/>',

  // ── Alert (original glyphs) ─────────────────────────────────
  siren: '<path d="M3.5 13h9M5 13V8a3 3 0 0 1 6 0v5M8 2.4V4M3.6 4.6l1 .9M12.4 4.6l-1 .9"/>',
  alarm:
    '<circle cx="8" cy="9" r="4.4"/><path d="M8 6.6V9l1.7 1M5 2.6 3.1 4.3M11 2.6l1.9 1.7M8 4.6V3"/>',
  megaphone: '<path d="M3 7.3v1.6l7 3V4.3zM10 5.7 12.5 4.2v7.6L10 10.3M4 9.6l.9 3.1h1.6l-.7-2.9"/>',
  flag: '<path d="M4 13.5V3M4 3.6h7.4L9.8 6.2l1.6 2.6H4"/>',
  shieldAlert:
    '<path d="M8 2.3l5.2 1.9v3.3c0 3.1-2.3 5.1-5.2 6.4C5.1 12.6 2.8 10.6 2.8 7.5V4.2z"/><path d="M8 5.5v3.1M8 10.6v.2"/>',

  // ── State / action (also usable as badges via the icon `badge` input) ─
  running: '<path d="M5.5 4l6 4-6 4z"/>',
  stopped: '<rect x="4.5" y="4.5" width="7" height="7" rx="1"/>',
  paused:
    '<rect x="5.2" y="4" width="2" height="8" rx=".5"/><rect x="8.8" y="4" width="2" height="8" rx=".5"/>',
  maintenance:
    '<path d="M10.8 3.2a2.7 2.7 0 00-3.5 3.4l-4.2 4.2L4.6 12.7l4.2-4.2a2.7 2.7 0 003.4-3.5L10.5 6.7 9.3 6.4 9 5.2z"/>',
  sync: '<path d="M12.5 7a4.5 4.5 0 00-8-2.5M3.5 9a4.5 4.5 0 008 2.5"/><path d="M12.5 3v2.5H10M3.5 13v-2.5H6"/>',
  snapshot:
    '<rect x="2.5" y="4.5" width="11" height="8" rx="1.5"/><circle cx="8" cy="8.5" r="2.3"/><path d="M6 4.5l1-1.5h2l1 1.5"/>',
  lock: '<rect x="3.5" y="7" width="9" height="6" rx="1.5"/><path d="M5.5 7V5.4a2.5 2.5 0 015 0V7"/>',

  // ── Generic vendor marks (abstract glyphs, NOT real trademarked logos) ─
  vendorVmware:
    '<rect x="2.5" y="6.5" width="3" height="3.4" rx=".5"/><rect x="6.5" y="6.5" width="3" height="3.4" rx=".5"/><rect x="10.5" y="6.5" width="3" height="3.4" rx=".5"/>',
  vendorCisco: '<path d="M2.5 10.5V7.5M5.5 10.5V5M8 10.5V3.5M10.5 10.5V5M13.5 10.5V7.5"/>',
  vendorHpe: '<rect x="2.5" y="5" width="11" height="6" rx="1"/><path d="M5.5 5v6"/>',
  vendorDell: '<circle cx="8" cy="8" r="5.6"/><path d="M5.4 8h3.4M5.4 6.6h2.6M5.4 9.4h2.6"/>',
  vendorKaytus: '<path d="M5 3v10M5 8l4.5-4.5M5 8l4.5 5"/>',
};

// Composite "off" variants — re-use base glyph + diagonal slash.
STRCT_ICONS['eyeOff'] = `${STRCT_ICONS['eye']}<path d="M2.5 2.5l11 11"/>`;
STRCT_ICONS['bellOff'] = `${STRCT_ICONS['bell']}<path d="M2.6 2.6l10.8 10.8"/>`;

/** Icon names grouped for galleries / documentation. */
export const STRCT_ICON_GROUPS: { label: string; names: string[] }[] = [
  {
    label: 'General',
    names: [
      'hexagon',
      'search',
      'menu',
      'dots',
      'close',
      'check',
      'calendar',
      'eye',
      'eyeOff',
      'upload',
      'download',
      'sun',
      'moon',
      'bell',
      'heart',
      'layers',
      'grid',
      'form',
      'chart',
      'bars',
      'gauge',
      'palette',
      'sidebar',
      'compass',
      'copy',
      'code',
      'book',
      'terminal',
      'folder',
      'template',
      'tag',
    ],
  },
  {
    label: 'Actions',
    names: [
      'plus',
      'minus',
      'pencil',
      'trash',
      'refresh',
      'filter',
      'settings',
      'user',
      'logout',
      'undo',
      'redo',
      'arrowUp',
      'arrowDown',
      'arrowLeft',
      'arrowRight',
      'externalLink',
    ],
  },
  {
    label: 'Status',
    names: ['info', 'success', 'warning', 'critical', 'sync', 'lock', 'snapshot'],
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
      'datacenter',
      'rack',
      'cluster',
      'host',
      'vm',
      'switch',
      'storage',
      'network',
      'cpu',
      'memory',
      'disk',
      'port',
      'nic',
      'hba',
      'ethernet',
      'power',
      'resourcePool',
      'portGroup',
    ],
  },
  {
    label: 'Infrastructure',
    names: [
      'pod',
      'deployment',
      'service',
      'node',
      'ingress',
      'cloud',
      'container',
      'firewall',
      'shield',
      'certificate',
      'key',
      'metrics',
      'logs',
      'trace',
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

/** Icon status dot variants. */
export type StrctIconBadge =
  | 'none'
  | 'success'
  | 'warning'
  | 'critical'
  | 'off'
  | 'info'
  | 'maintenance';

/**
 * Inline stroke icon. `<strct-icon name="host" badge="success" />` renders the host
 * glyph with a green status dot (a "running host"). Unknown names render
 * nothing rather than throwing.
 */
@Component({
  selector: 'strct-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `@if (isRaw()) {
      <span
        class="strct-icon__raw"
        [style.width.px]="size()"
        [style.height.px]="size()"
        [innerHTML]="rawSvg()"
      ></span>
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
        role="img"
        [attr.aria-label]="ariaLabel() || null"
        [attr.aria-hidden]="ariaLabel() ? null : 'true'"
      ></svg>
    }
    @if (badge() !== 'none') {
      <span class="strct-icon__badge strct-icon__badge--{{ badge() }}">
        @if (badge() === 'maintenance') {
          <svg
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path
              d="M3.5 2.5c-1.5 0-2.5 1.5-1.5 3l3.5 3.5c-.5 1.5 0 3 1.5 3.5s3 0 3.5-1.5M6.5 5.5l6 6M7.5 10.5c1 1.5 2.5 2.5 4 1.5s1.5-2.5.5-4"
            />
          </svg>
        }
      </span>
    }`,
  host: { class: 'strct-icon' },
  styles: [
    `
      .strct-icon {
        position: relative;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        line-height: 0;
      }
      .strct-icon__raw {
        display: inline-flex;
      }
      .strct-icon__raw > svg {
        width: 100%;
        height: 100%;
        display: block;
      }
      .strct-icon__badge {
        position: absolute;
        right: -3px;
        bottom: -3px;
        width: 50%;
        height: 50%;
        min-width: 8px;
        min-height: 8px;
        max-width: 12px;
        max-height: 12px;
        border-radius: 50%;
        box-shadow: 0 0 0 1.5px var(--bg-1);
      }
      .strct-icon__badge--success {
        background: var(--success);
      }
      .strct-icon__badge--warning {
        background: var(--warning);
        border-radius: 1px;
        clip-path: polygon(50% 10%, 92% 90%, 8% 90%);
        box-shadow: none;
        filter: drop-shadow(0 0 1.5px var(--bg-1));
        right: -2px;
        bottom: -2px;
        width: 60%;
        height: 60%;
        min-width: 11px;
        min-height: 11px;
        max-width: 18px;
        max-height: 18px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: clamp(6px, 70%, 10px);
        font-weight: 800;
        color: rgba(0, 0, 0, 0.85);
        line-height: 1;
      }
      .strct-icon__badge--warning::before {
        content: '!';
      }
      .strct-icon__badge--critical {
        background: var(--critical);
      }
      .strct-icon__badge--off {
        background: var(--t3);
      }
      .strct-icon__badge--info {
        background: var(--acc);
      }
      .strct-icon__badge--maintenance {
        background: var(--warning);
        right: -2px;
        bottom: -2px;
        width: 58%;
        height: 58%;
        min-width: 10px;
        min-height: 10px;
        max-width: 16px;
        max-height: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 1px;
        box-shadow: 0 0 0 1.5px var(--bg-1);
      }
      .strct-icon__badge--maintenance svg {
        width: 84%;
        height: 84%;
        color: rgba(0, 0, 0, 0.85);
      }
    `,
  ],
})
export class StrctIcon {
  private readonly sanitizer = inject(DomSanitizer);

  /** Icon name from the STRCT_ICONS registry. */
  readonly name = input.required<string>();
  /** Icon size in pixels. */
  readonly size = input(16);
  /** Stroke width for outline icons. */
  readonly strokeWidth = input(1.4);
  /** Optional status dot overlaid on the glyph (object state). */
  readonly badge = input<StrctIconBadge>('none');
  /** Accessible label for the icon. When empty the icon is hidden from assistive tech. */
  readonly ariaLabel = input<string>('');

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
