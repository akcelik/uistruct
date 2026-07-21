import { Pipe, PipeTransform } from '@angular/core';

/**
 * Unit formatting for infrastructure consoles — bytes, rates, durations and
 * SI magnitudes, as pure functions plus template pipes. The functions are the
 * API charts / grids can call from TS; the pipes are the template sugar:
 *
 *   {{ vm.memBytes | strctBytes }}          → 1.5 GiB
 *   {{ nic.rxBps | strctRate }}             → 2.4 Gbit/s
 *   {{ task.elapsedMs | strctDuration }}    → 2h 14m
 *   {{ cluster.iops | strctSi : 'IOPS' }}   → 12.4k IOPS
 */

const BINARY_UNITS = ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB'];
const DECIMAL_UNITS = ['B', 'kB', 'MB', 'GB', 'TB', 'PB', 'EB'];
const SI_SUFFIXES = ['', 'k', 'M', 'G', 'T', 'P'];

function trimZeros(v: string): string {
  return v.includes('.') ? v.replace(/\.?0+$/, '') : v;
}

/**
 * Format a byte count. Binary (KiB, 1024) by default — the storage/memory
 * convention consoles actually mean; pass `binary: false` for decimal (kB).
 */
export function strctFormatBytes(
  bytes: number,
  options: { binary?: boolean; digits?: number } = {},
): string {
  if (!Number.isFinite(bytes)) return '—';
  const { binary = true, digits = 1 } = options;
  const base = binary ? 1024 : 1000;
  const units = binary ? BINARY_UNITS : DECIMAL_UNITS;
  const neg = bytes < 0 ? '-' : '';
  let v = Math.abs(bytes);
  let i = 0;
  while (v >= base && i < units.length - 1) {
    v /= base;
    i++;
  }
  return `${neg}${trimZeros(v.toFixed(i === 0 ? 0 : digits))} ${units[i]}`;
}

/**
 * Format a data rate from bits per second (network convention). Pass bytes/s
 * through `strctFormatBytes(...) + '/s'` instead if you mean throughput.
 */
export function strctFormatRate(bitsPerSecond: number, options: { digits?: number } = {}): string {
  if (!Number.isFinite(bitsPerSecond)) return '—';
  const { digits = 1 } = options;
  const units = ['bit/s', 'kbit/s', 'Mbit/s', 'Gbit/s', 'Tbit/s'];
  const neg = bitsPerSecond < 0 ? '-' : '';
  let v = Math.abs(bitsPerSecond);
  let i = 0;
  while (v >= 1000 && i < units.length - 1) {
    v /= 1000;
    i++;
  }
  return `${neg}${trimZeros(v.toFixed(i === 0 ? 0 : digits))} ${units[i]}`;
}

/**
 * Format a duration in ms as the two most significant units: "2h 14m",
 * "3d 6h", "45s", "820ms". Sub-second stays in ms; `maxUnits` widens it.
 */
export function strctFormatDuration(ms: number, options: { maxUnits?: number } = {}): string {
  if (!Number.isFinite(ms)) return '—';
  const { maxUnits = 2 } = options;
  const neg = ms < 0 ? '-' : '';
  let v = Math.abs(ms);
  if (v < 1000) return `${neg}${Math.round(v)}ms`;
  const units: [string, number][] = [
    ['d', 86_400_000],
    ['h', 3_600_000],
    ['m', 60_000],
    ['s', 1000],
  ];
  const parts: string[] = [];
  for (const [label, size] of units) {
    if (parts.length >= maxUnits) break;
    const n = Math.floor(v / size);
    if (n > 0 || parts.length > 0) {
      if (n > 0) parts.push(`${n}${label}`);
      v -= n * size;
    }
  }
  return neg + (parts.length ? parts.join(' ') : '0s');
}

/** Format a count with SI magnitude suffixes: 12400 → "12.4k". */
export function strctFormatSi(
  value: number,
  options: { digits?: number; unit?: string } = {},
): string {
  if (!Number.isFinite(value)) return '—';
  const { digits = 1, unit = '' } = options;
  const neg = value < 0 ? '-' : '';
  let v = Math.abs(value);
  let i = 0;
  while (v >= 1000 && i < SI_SUFFIXES.length - 1) {
    v /= 1000;
    i++;
  }
  const num = `${neg}${trimZeros(v.toFixed(i === 0 ? 0 : digits))}${SI_SUFFIXES[i]}`;
  return unit ? `${num} ${unit}` : num;
}

/** `{{ bytes | strctBytes }}` / `{{ bytes | strctBytes : false }}` (decimal). */
@Pipe({ name: 'strctBytes' })
export class StrctBytesPipe implements PipeTransform {
  transform(value: number, binary = true, digits = 1): string {
    return strctFormatBytes(value, { binary, digits });
  }
}

/** `{{ bps | strctRate }}` — bits per second with kbit/Mbit/Gbit steps. */
@Pipe({ name: 'strctRate' })
export class StrctRatePipe implements PipeTransform {
  transform(value: number, digits = 1): string {
    return strctFormatRate(value, { digits });
  }
}

/** `{{ ms | strctDuration }}` — "2h 14m"; optional max unit count. */
@Pipe({ name: 'strctDuration' })
export class StrctDurationPipe implements PipeTransform {
  transform(value: number, maxUnits = 2): string {
    return strctFormatDuration(value, { maxUnits });
  }
}

/** `{{ n | strctSi : 'IOPS' }}` — SI magnitude with an optional unit label. */
@Pipe({ name: 'strctSi' })
export class StrctSiPipe implements PipeTransform {
  transform(value: number, unit = '', digits = 1): string {
    return strctFormatSi(value, { unit, digits });
  }
}
