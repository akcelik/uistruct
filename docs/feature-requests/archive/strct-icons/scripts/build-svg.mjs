// strct-icon geometrisinden statik SVG dosyaları üretir (Figma, dokümantasyon, Angular dışı kullanım).
// Kullanım: node scripts/build-svg.mjs <çıktı-klasörü>
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const out = process.argv[2] ?? 'svg';
const STATE_FILL = {
  running: 'var(--strct-icon-state-running,#24a148)',
  suspended: 'var(--strct-icon-state-suspended,#d2a106)',
  error: 'var(--strct-icon-state-error,#da1e28)',
  off: 'var(--strct-icon-state-off,#8a8f98)',
};
const ON = 'var(--strct-icon-state-on-color,#fff)';

const frame36 = (virtual, badged, maskId) =>
  virtual && badged
    ? '<path d="M20.383 33H8A5 5 0 0 1 3 28V8A5 5 0 0 1 8 3H28A5 5 0 0 1 33 8V20.383" pathLength="90" stroke-dasharray="6 4" stroke-dashoffset="8"/>'
    : virtual
      ? '<rect x="3" y="3" width="30" height="30" rx="5" pathLength="110" stroke-dasharray="6 4" stroke-dashoffset="8"/>'
      : `<rect x="3" y="3" width="30" height="30" rx="5"${badged ? ` mask="url(#${maskId})"` : ''}/>`;
const slab36 = (badged) =>
  badged
    ? '<rect x="8" y="9" width="17" height="9" rx="1.5"/><path d="M15.5 13.5H21"/><circle cx="11.5" cy="13.5" r="1.1"/>'
    : '<rect x="9" y="13" width="18" height="10" rx="1.5"/><path d="M17 18H23"/><circle cx="13" cy="18" r="1.2"/>';

const TYPE36 = {
  'vm-template': '<rect x="24.2" y="23" width="9.6" height="12" rx="1.4"/><path d="M26.7 27H31.3M26.7 30.5H30"/>',
  'vm-snapshot': '<circle cx="29" cy="29" r="6.3"/><path d="M29 25.6V29L31.4 30.9"/>',
  'vm-clone':
    '<rect x="22.8" y="25.8" width="8" height="8" rx="1.3"/><path d="M26.3 25.8V23.8A1.3 1.3 0 0 1 27.6 22.5H33.9A1.3 1.3 0 0 1 35.2 23.8V30.1A1.3 1.3 0 0 1 33.9 31.4H30.8"/>',
  'vm-migration': '<path d="M22.8 26H34.6M31.8 23.2L34.6 26L31.8 28.8M35.2 32H23.4M26.2 29.2L23.4 32L26.2 34.8"/>',
};
const STATE36 = {
  running: `<circle cx="29" cy="29" r="6.6" stroke="none" style="fill:${STATE_FILL.running}"/>`,
  off: `<circle cx="29" cy="29" r="5.6" stroke-width="1.9" style="stroke:${STATE_FILL.off}"/>`,
  suspended: `<circle cx="29" cy="29" r="6.8" stroke="none" style="fill:${STATE_FILL.suspended}"/><path d="M27 26.4V31.6M31 26.4V31.6" stroke-width="1.8" style="stroke:${ON}"/>`,
  error: `<circle cx="29" cy="29" r="6.8" stroke="none" style="fill:${STATE_FILL.error}"/><path d="M29 25.6V29.6M29 32.4H29.01" stroke-width="2" style="stroke:${ON}"/>`,
};

function svg36({ name, state, sizePx }) {
  const stroke = ({ 24: 1.5, 32: 1.75, 48: 2 }[sizePx] * 36) / sizePx;
  const virtual = name !== 'host';
  const badged = !!state || !!TYPE36[name];
  const id = `m-${name}${state ? '-' + state : ''}`;
  const mask = badged && !virtual
    ? `<mask id="${id}" maskUnits="userSpaceOnUse" x="0" y="0" width="100%" height="100%"><path fill="#fff" fill-rule="evenodd" d="M0 0H36V36H0ZM29 19.5A9.5 9.5 0 1 0 29 38.5A9.5 9.5 0 1 0 29 19.5Z"/></mask>`
    : '';
  const bodyStyle = state === 'off' ? ` style="color:${STATE_FILL.off}"` : '';
  const body = `<g${bodyStyle}>${frame36(virtual, badged, id)}${slab36(badged)}</g>`;
  const badge = state ? STATE36[state] : TYPE36[name] ?? '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${sizePx}" height="${sizePx}" viewBox="0 0 36 36" fill="none" stroke="currentColor" stroke-width="${+stroke.toFixed(3)}" stroke-linecap="round" stroke-linejoin="round">${mask}${body}${badge}</svg>\n`;
}

function svg16({ name, state }) {
  const virtual = name !== 'host';
  const id = `m16-${name}${state ? '-' + state : ''}`;
  const frame = virtual
    ? '<path d="M2 6V4.5A2.5 2.5 0 0 1 4.5 2H6M10 2H11.5A2.5 2.5 0 0 1 14 4.5V6M6 14H4.5A2.5 2.5 0 0 1 2 11.5V10"/>' +
      (state ? '' : '<path d="M14 10V11.5A2.5 2.5 0 0 1 11.5 14H10"/>')
    : `<rect x="2" y="2" width="12" height="12" rx="2.5"${state ? ` mask="url(#${id})"` : ''}/>`;
  const mask = state && !virtual
    ? `<mask id="${id}" maskUnits="userSpaceOnUse" x="0" y="0" width="100%" height="100%"><path fill="#fff" fill-rule="evenodd" d="M0 0H16V16H0ZM13 9.4A3.6 3.6 0 1 0 13 16.6A3.6 3.6 0 1 0 13 9.4Z"/></mask>`
    : '';
  const bodyStyle = state === 'off' ? ` style="color:${STATE_FILL.off}"` : '';
  const body = `<g${bodyStyle}>${frame}<rect x="4.5" y="6" width="7" height="4" rx="0.8"/></g>`;
  const dot = !state
    ? ''
    : state === 'off'
      ? `<circle cx="13" cy="13" r="2" style="stroke:${STATE_FILL.off}"/>`
      : `<circle cx="13" cy="13" r="2.4" stroke="none" style="fill:${STATE_FILL[state]}"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">${mask}${body}${dot}</svg>\n`;
}

const NAMES = ['host', 'vm', 'vm-template', 'vm-snapshot', 'vm-clone', 'vm-migration'];
const STATES = ['running', 'off', 'suspended', 'error'];
const files = [];
const emit = (dir, file, content) => {
  mkdirSync(join(out, dir), { recursive: true });
  writeFileSync(join(out, dir, file), content);
  files.push(join(dir, file));
};

for (const sizePx of [24, 32, 48]) {
  for (const name of NAMES) emit(String(sizePx), `${name}.svg`, svg36({ name, sizePx }));
  for (const state of STATES) emit(String(sizePx), `vm-${state}.svg`, svg36({ name: 'vm', state, sizePx }));
}
for (const name of ['host', 'vm']) emit('16', `${name}.svg`, svg16({ name }));
for (const state of STATES) emit('16', `vm-${state}.svg`, svg16({ name: 'vm', state }));

console.log(`${files.length} SVG yazıldı → ${out}`);
