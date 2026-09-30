import { strctQrMatrix } from './encoder';
import { __qrInternals } from './encoder';

/**
 * A QR code that does not scan is worse than none, so the encoder is checked
 * against published vectors rather than against itself: the data codewords and
 * the Reed–Solomon parity for the standard "HELLO WORLD" 1-Q example, and the
 * structure every reader looks for first.
 */
describe('strctQrMatrix', () => {
  it('encodes HELLO WORLD in byte mode at 1-Q, padded to capacity', () => {
    // 0100 (byte mode) · 00001011 (11 bytes) · the bytes · terminator · 0xEC/0x11
    // padding, derived by hand from the bit stream.
    expect(__qrInternals.dataCodewords(new TextEncoder().encode('HELLO WORLD'), 1, 'Q')).toEqual([
      64, 180, 132, 84, 196, 196, 242, 5, 116, 245, 36, 196, 64,
    ]);
  });

  it('produces the published Reed–Solomon parity for the standard 1-M example', () => {
    const data = [32, 91, 11, 120, 209, 114, 220, 77, 67, 64, 236, 17, 236, 17, 236, 17];
    expect(__qrInternals.remainder(data, 10)).toEqual([
      196, 35, 39, 119, 235, 215, 231, 226, 93, 23,
    ]);
  });

  it('sizes the matrix by version, and grows with the value', () => {
    expect(strctQrMatrix('HELLO WORLD', 'Q').length).toBe(21); // version 1
    const long = strctQrMatrix(
      'otpauth://totp/UIStruct:ada@example.com?secret=JBSWY3DPEHPK3PXP&issuer=UIStruct',
    );
    expect(long.length).toBeGreaterThan(21);
    expect((long.length - 17) % 4).toBe(0); // a valid version size
  });

  it('draws the three finder patterns a reader looks for', () => {
    const m = strctQrMatrix('HELLO WORLD', 'Q');
    const size = m.length;
    const finderAt = (r0: number, c0: number) => {
      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 7; c++) {
          const ring = Math.max(Math.abs(r - 3), Math.abs(c - 3));
          const expected = ring === 2 ? false : true;
          if (m[r0 + r][c0 + c] !== expected) return false;
        }
      }
      return true;
    };
    expect(finderAt(0, 0)).toBe(true);
    expect(finderAt(0, size - 7)).toBe(true);
    expect(finderAt(size - 7, 0)).toBe(true);
    // the separator around the top-left finder is light
    expect(m[7].slice(0, 8).every((v) => !v)).toBe(true);
  });

  it('draws the timing patterns and the dark module', () => {
    const m = strctQrMatrix('HELLO WORLD', 'Q');
    const size = m.length;
    for (let i = 8; i < size - 8; i++) {
      expect(m[6][i]).toBe(i % 2 === 0);
      expect(m[i][6]).toBe(i % 2 === 0);
    }
    expect(m[size - 8][8]).toBe(true);
  });

  it('writes the same format bits in both of their places', () => {
    const m = strctQrMatrix('HELLO WORLD', 'Q');
    const size = m.length;
    const first = [
      ...[0, 1, 2, 3, 4, 5].map((i) => m[8][i]),
      m[8][7],
      m[8][8],
      m[7][8],
      ...[9, 10, 11, 12, 13, 14].map((i) => m[14 - i][8]),
    ];
    // The second copy runs bits 0–6 up the left column and 7–14 along the top
    // right; (size-8, 8) is the dark module, not a format bit.
    const second = [
      ...[0, 1, 2, 3, 4, 5, 6].map((i) => m[size - 1 - i][8]),
      ...[7, 8, 9, 10, 11, 12, 13, 14].map((i) => m[8][size - 15 + i]),
    ];
    expect(first).toEqual(second);
  });

  it('refuses a value it cannot hold rather than emitting a broken code', () => {
    expect(() => strctQrMatrix('x'.repeat(400), 'H')).toThrow(/too long/);
  });
});
