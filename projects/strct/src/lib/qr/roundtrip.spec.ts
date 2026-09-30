import { strctQrMatrix } from './encoder';

/**
 * The encoder's own tests check it against published vectors; this one reads
 * its output back the way a scanner does — a QR code that does not scan is
 * worse than none. The reader below is written from the spec's own description
 * (format bits, mask, zig-zag, de-interleave, syndromes), not from the
 * encoder's code, so a layout mistake shows up as a failed round trip.
 */

const EXP = new Uint8Array(512);
const LOG = new Uint8Array(256);
{
  let x = 1;
  for (let i = 0; i < 255; i++) {
    EXP[i] = x;
    LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
}
const mul = (a: number, b: number) => (a && b ? EXP[LOG[a] + LOG[b]] : 0);

const MASKS: ((r: number, c: number) => boolean)[] = [
  (r, c) => (r + c) % 2 === 0,
  (r) => r % 2 === 0,
  (_r, c) => c % 3 === 0,
  (r, c) => (r + c) % 3 === 0,
  (r, c) => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0,
  (r, c) => ((r * c) % 2) + ((r * c) % 3) === 0,
  (r, c) => (((r * c) % 2) + ((r * c) % 3)) % 2 === 0,
  (r, c) => (((r + c) % 2) + ((r * c) % 3)) % 2 === 0,
];

const FORMAT_BITS: Record<string, number[]> = {
  L: [0x77c4, 0x72f3, 0x7daa, 0x789d, 0x662f, 0x6318, 0x6c41, 0x6976],
  M: [0x5412, 0x5125, 0x5e7c, 0x5b4b, 0x45f9, 0x40ce, 0x4f97, 0x4aa0],
  Q: [0x355f, 0x3068, 0x3f31, 0x3a06, 0x24b4, 0x2183, 0x2eda, 0x2bed],
  H: [0x1689, 0x13be, 0x1ce7, 0x19d0, 0x0762, 0x0255, 0x0d0c, 0x083b],
};
const ECC_TABLE: Record<string, [number, number, number][]> = {
  L: [
    [7, 1, 0],
    [10, 1, 0],
    [15, 1, 0],
    [20, 1, 0],
    [26, 1, 0],
    [18, 2, 0],
    [20, 2, 0],
    [24, 2, 0],
    [30, 2, 0],
    [18, 2, 2],
  ],
  M: [
    [10, 1, 0],
    [16, 1, 0],
    [26, 1, 0],
    [18, 2, 0],
    [24, 2, 0],
    [16, 4, 0],
    [18, 4, 0],
    [22, 2, 2],
    [22, 3, 2],
    [26, 4, 1],
  ],
  Q: [
    [13, 1, 0],
    [22, 1, 0],
    [18, 2, 0],
    [26, 2, 0],
    [18, 2, 2],
    [24, 4, 0],
    [18, 2, 4],
    [22, 4, 2],
    [20, 4, 4],
    [24, 6, 2],
  ],
  H: [
    [17, 1, 0],
    [28, 1, 0],
    [22, 2, 0],
    [16, 4, 0],
    [22, 2, 2],
    [28, 4, 0],
    [26, 4, 1],
    [26, 4, 2],
    [24, 4, 4],
    [28, 6, 2],
  ],
};
const TOTAL = [26, 44, 70, 100, 134, 172, 196, 242, 292, 346];
const ALIGNMENT = [
  [],
  [6, 18],
  [6, 22],
  [6, 26],
  [6, 30],
  [6, 34],
  [6, 22, 38],
  [6, 24, 42],
  [6, 26, 46],
  [6, 28, 50],
];

/** Which modules are function patterns — the reader must skip exactly these. */
function reservedMap(size: number, version: number): boolean[][] {
  const res = Array.from({ length: size }, () => new Array<boolean>(size).fill(false));
  const block = (r0: number, c0: number, h: number, w: number) => {
    for (let r = r0; r < r0 + h; r++)
      for (let c = c0; c < c0 + w; c++)
        if (r >= 0 && c >= 0 && r < size && c < size) res[r][c] = true;
  };
  block(0, 0, 9, 9);
  block(0, size - 8, 9, 8);
  block(size - 8, 0, 8, 9);
  for (let i = 0; i < size; i++) res[6][i] = res[i][6] = true;
  const centres = ALIGNMENT[version - 1];
  for (const r of centres)
    for (const c of centres) {
      if ((r === 6 && c === 6) || (r === 6 && c === size - 7) || (r === size - 7 && c === 6))
        continue;
      block(r - 2, c - 2, 5, 5);
    }
  return res;
}

/** Read a matrix back: format → mask → zig-zag → de-interleave → text. */
function readQr(matrix: boolean[][]): { text: string; level: string; syndromesZero: boolean } {
  const size = matrix.length;
  const version = (size - 17) / 4;
  const bitAt = (r: number, c: number) => (matrix[r][c] ? 1 : 0);

  // Format information, from the copy beside the top-left finder.
  let format = 0;
  const seq = [
    ...[0, 1, 2, 3, 4, 5].map((i) => bitAt(8, i)),
    bitAt(8, 7),
    bitAt(8, 8),
    bitAt(7, 8),
    ...[9, 10, 11, 12, 13, 14].map((i) => bitAt(14 - i, 8)),
  ];
  for (let i = 0; i < 15; i++) format |= seq[i] << i;
  let level = '';
  let mask = -1;
  for (const [lvl, codes] of Object.entries(FORMAT_BITS)) {
    const at = codes.indexOf(format);
    if (at >= 0) {
      level = lvl;
      mask = at;
    }
  }
  expect(mask).toBeGreaterThanOrEqual(0); // the format must be one of the 32 valid words

  const reserved = reservedMap(size, version);
  const bits: number[] = [];
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let vert = 0; vert < size; vert++) {
      for (let j = 0; j < 2; j++) {
        const c = right - j;
        const upward = ((right + 1) & 2) === 0;
        const r = upward ? size - 1 - vert : vert;
        if (reserved[r][c]) continue;
        bits.push(bitAt(r, c) ^ (MASKS[mask](r, c) ? 1 : 0));
      }
    }
  }
  const stream: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8)
    stream.push(bits.slice(i, i + 8).reduce((acc, b) => (acc << 1) | b, 0));

  // De-interleave into blocks, then check every block's syndromes are zero.
  const [ecPerBlock, g1, g2] = ECC_TABLE[level][version - 1];
  const blocks = g1 + g2;
  const dataTotal = TOTAL[version - 1] - ecPerBlock * blocks;
  const shortLen = Math.floor(dataTotal / blocks);
  const lens = Array.from({ length: blocks }, (_, i) => (i < g1 ? shortLen : shortLen + 1));
  const data: number[][] = lens.map(() => []);
  let at = 0;
  for (let i = 0; i < shortLen + 1; i++)
    for (let b = 0; b < blocks; b++) if (i < lens[b]) data[b].push(stream[at++]);
  const parity: number[][] = Array.from({ length: blocks }, () => []);
  for (let i = 0; i < ecPerBlock; i++)
    for (let b = 0; b < blocks; b++) parity[b].push(stream[at++]);

  let syndromesZero = true;
  for (let b = 0; b < blocks; b++) {
    const code = [...data[b], ...parity[b]];
    for (let s = 0; s < ecPerBlock; s++) {
      let acc = 0;
      for (const byte of code) acc = mul(acc, EXP[s]) ^ byte;
      if (acc !== 0) syndromesZero = false;
    }
  }

  // The payload: mode, length, then the bytes.
  const flat = data.flat();
  const all: number[] = [];
  for (const word of flat) for (let i = 7; i >= 0; i--) all.push((word >> i) & 1);
  const take = (n: number) => all.splice(0, n).reduce((acc, b) => (acc << 1) | b, 0);
  const mode = take(4);
  expect(mode).toBe(0b0100); // byte mode
  const length = take(version < 10 ? 8 : 16);
  const bytes = new Uint8Array(length);
  for (let i = 0; i < length; i++) bytes[i] = take(8);
  return { text: new TextDecoder().decode(bytes), level, syndromesZero };
}

describe('strctQrMatrix — round trip', () => {
  const cases: [string, 'L' | 'M' | 'Q' | 'H'][] = [
    ['HELLO WORLD', 'Q'],
    ['otpauth://totp/UIStruct:ada@example.com?secret=JBSWY3DPEHPK3PXP&issuer=UIStruct', 'M'],
    ['https://akcelik.github.io/uistruct/', 'L'],
    ['ıış çğü — unicode', 'H'],
  ];

  for (const [value, ecc] of cases) {
    it(`reads back ${JSON.stringify(value.slice(0, 28))} at ${ecc}`, () => {
      const read = readQr(strctQrMatrix(value, ecc));
      expect(read.level).toBe(ecc);
      expect(read.syndromesZero).toBe(true);
      expect(read.text).toBe(value);
    });
  }
});
