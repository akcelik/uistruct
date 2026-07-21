import {
  strctFormatBytes,
  strctFormatDuration,
  strctFormatRate,
  strctFormatSi,
  StrctBytesPipe,
  StrctDurationPipe,
} from './format';

describe('strct format utilities', () => {
  it('formats bytes in binary units by default (the storage convention)', () => {
    expect(strctFormatBytes(0)).toBe('0 B');
    expect(strctFormatBytes(1023)).toBe('1023 B');
    expect(strctFormatBytes(1024)).toBe('1 KiB');
    expect(strctFormatBytes(1536)).toBe('1.5 KiB');
    expect(strctFormatBytes(1.5 * 1024 ** 3)).toBe('1.5 GiB');
    expect(strctFormatBytes(-2048)).toBe('-2 KiB');
  });

  it('formats bytes in decimal units on request', () => {
    expect(strctFormatBytes(1000, { binary: false })).toBe('1 kB');
    expect(strctFormatBytes(2_500_000, { binary: false })).toBe('2.5 MB');
  });

  it('formats rates in bit/s with 1000 steps', () => {
    expect(strctFormatRate(950)).toBe('950 bit/s');
    expect(strctFormatRate(2_400_000_000)).toBe('2.4 Gbit/s');
  });

  it('formats durations as the two most significant units', () => {
    expect(strctFormatDuration(820)).toBe('820ms');
    expect(strctFormatDuration(45_000)).toBe('45s');
    expect(strctFormatDuration(2 * 3_600_000 + 14 * 60_000)).toBe('2h 14m');
    expect(strctFormatDuration(3 * 86_400_000 + 6 * 3_600_000)).toBe('3d 6h');
    expect(strctFormatDuration(3 * 86_400_000 + 6 * 3_600_000, { maxUnits: 3 })).toBe('3d 6h');
    expect(strctFormatDuration(-45_000)).toBe('-45s');
  });

  it('formats SI magnitudes with an optional unit', () => {
    expect(strctFormatSi(999)).toBe('999');
    expect(strctFormatSi(12_400, { unit: 'IOPS' })).toBe('12.4k IOPS');
    expect(strctFormatSi(3_000_000)).toBe('3M');
  });

  it('handles non-finite input with an em dash', () => {
    expect(strctFormatBytes(NaN)).toBe('—');
    expect(strctFormatDuration(Infinity)).toBe('—');
  });

  it('pipes delegate to the functions', () => {
    expect(new StrctBytesPipe().transform(1024)).toBe('1 KiB');
    expect(new StrctDurationPipe().transform(45_000)).toBe('45s');
  });
});
