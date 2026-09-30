/**
 * A small, dependency-free QR encoder: byte mode, versions 1–10, the four error
 * correction levels. Enough for an `otpauth://` URI, which is what the library
 * needs it for — and nothing more, so it stays readable.
 *
 * The maths is the standard one (ISO/IEC 18004): the data is split into
 * codewords, Reed–Solomon parity is appended per block, the result is laid into
 * the matrix around the function patterns, and each of the eight masks is
 * scored so the best one is chosen.
 */

/** Error correction level: L ≈ 7%, M ≈ 15%, Q ≈ 25%, H ≈ 30% of codewords recoverable. */
export type StrctQrEcc = 'L' | 'M' | 'Q' | 'H';

/** Total codewords per version (1–10), index 0 = version 1. */
const TOTAL_CODEWORDS = [26, 44, 70, 100, 134, 172, 196, 242, 292, 346];

/**
 * Per version and level: [ec codewords per block, block count group 1,
 * block count group 2]. Group 2's blocks hold one more data codeword each.
 */
const ECC_TABLE: Record<StrctQrEcc, [number, number, number][]> = {
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

/** Alignment-pattern centres per version (1–10). */
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

/** Format-information bits per (level, mask), already masked per the spec. */
const FORMAT_BITS: Record<StrctQrEcc, number[]> = {
  L: [0x77c4, 0x72f3, 0x7daa, 0x789d, 0x662f, 0x6318, 0x6c41, 0x6976],
  M: [0x5412, 0x5125, 0x5e7c, 0x5b4b, 0x45f9, 0x40ce, 0x4f97, 0x4aa0],
  Q: [0x355f, 0x3068, 0x3f31, 0x3a06, 0x24b4, 0x2183, 0x2eda, 0x2bed],
  H: [0x1689, 0x13be, 0x1ce7, 0x19d0, 0x0762, 0x0255, 0x0d0c, 0x083b],
};

// ── Galois field (2^8) with the QR primitive polynomial 0x11d ───────────────
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
const mul = (a: number, b: number): number => (a && b ? EXP[LOG[a] + LOG[b]] : 0);

/** The generator polynomial for `degree` error-correction codewords. */
function generator(degree: number): number[] {
  let poly = [1];
  for (let i = 0; i < degree; i++) {
    const next = new Array<number>(poly.length + 1).fill(0);
    for (let j = 0; j < poly.length; j++) {
      // Descending coefficients: x * poly keeps the index, α^i * poly shifts.
      next[j] ^= poly[j];
      next[j + 1] ^= mul(poly[j], EXP[i]);
    }
    poly = next;
  }
  return poly;
}

/** Reed–Solomon parity for one block. */
function remainder(data: number[], degree: number): number[] {
  const gen = generator(degree);
  const out = new Array<number>(degree).fill(0);
  for (const byte of data) {
    const factor = byte ^ out[0];
    out.shift();
    out.push(0);
    for (let i = 0; i < degree; i++) out[i] ^= mul(gen[i + 1], factor);
  }
  return out;
}

/** The smallest version (1–10) that holds `byteLength` bytes at `ecc`. */
function chooseVersion(byteLength: number, ecc: StrctQrEcc): number {
  for (let version = 1; version <= 10; version++) {
    const [ecPerBlock, g1, g2] = ECC_TABLE[ecc][version - 1];
    const dataCodewords = TOTAL_CODEWORDS[version - 1] - ecPerBlock * (g1 + g2);
    // 4 bits of mode + 8 or 16 bits of length, rounded up to whole codewords.
    const headerBits = 4 + (version < 10 ? 8 : 16);
    if (dataCodewords * 8 >= headerBits + byteLength * 8) return version;
  }
  throw new Error('strct-qr: the value is too long (versions 1–10, byte mode)');
}

/** The data codewords: mode, length, the bytes, a terminator, then padding. */
function dataCodewords(bytes: Uint8Array, version: number, ecc: StrctQrEcc): number[] {
  const [ecPerBlock, g1, g2] = ECC_TABLE[ecc][version - 1];
  const capacity = TOTAL_CODEWORDS[version - 1] - ecPerBlock * (g1 + g2);
  const bits: number[] = [];
  const push = (value: number, length: number) => {
    for (let i = length - 1; i >= 0; i--) bits.push((value >> i) & 1);
  };
  push(0b0100, 4); // byte mode
  push(bytes.length, version < 10 ? 8 : 16);
  for (const b of bytes) push(b, 8);
  push(0, Math.min(4, capacity * 8 - bits.length)); // terminator
  while (bits.length % 8) bits.push(0);
  const words = [];
  for (let i = 0; i < bits.length; i += 8) {
    words.push(bits.slice(i, i + 8).reduce((acc, bit) => (acc << 1) | bit, 0));
  }
  // Alternating pad bytes, as the spec prescribes.
  for (let i = 0; words.length < capacity; i++) words.push(i % 2 === 0 ? 0xec : 0x11);
  return words;
}

/** Interleave the blocks' data and parity, as the spec lays them out. */
function interleave(words: number[], version: number, ecc: StrctQrEcc): number[] {
  const [ecPerBlock, g1, g2] = ECC_TABLE[ecc][version - 1];
  const blocks = g1 + g2;
  const shortLen = Math.floor(words.length / blocks);
  const data: number[][] = [];
  const parity: number[][] = [];
  let at = 0;
  for (let i = 0; i < blocks; i++) {
    const len = i < g1 ? shortLen : shortLen + 1;
    const block = words.slice(at, at + len);
    at += len;
    data.push(block);
    parity.push(remainder(block, ecPerBlock));
  }
  const out: number[] = [];
  for (let i = 0; i < shortLen + 1; i++) {
    for (const block of data) if (i < block.length) out.push(block[i]);
  }
  for (let i = 0; i < ecPerBlock; i++) for (const block of parity) out.push(block[i]);
  return out;
}

const enum Cell {
  Empty = -1,
  Light = 0,
  Dark = 1,
}

/** Draw the finder, timing and alignment patterns, and reserve the format area. */
function functionPatterns(size: number, version: number): number[][] {
  const m: number[][] = Array.from({ length: size }, () => new Array(size).fill(Cell.Empty));
  const finder = (r0: number, c0: number) => {
    for (let dr = -1; dr <= 7; dr++) {
      for (let dc = -1; dc <= 7; dc++) {
        const r = r0 + dr;
        const c = c0 + dc;
        if (r < 0 || r >= size || c < 0 || c >= size) continue;
        const inner = Math.max(Math.abs(dr - 3), Math.abs(dc - 3));
        m[r][c] = inner === 2 || inner > 3 ? Cell.Light : Cell.Dark;
      }
    }
  };
  finder(0, 0);
  finder(0, size - 7);
  finder(size - 7, 0);
  for (let i = 8; i < size - 8; i++) {
    m[6][i] = m[i][6] = i % 2 === 0 ? Cell.Dark : Cell.Light;
  }
  const centres = ALIGNMENT[version - 1];
  for (const r of centres) {
    for (const c of centres) {
      // Not over a finder pattern.
      if ((r === 6 && c === 6) || (r === 6 && c === size - 7) || (r === size - 7 && c === 6))
        continue;
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          m[r + dr][c + dc] = Math.max(Math.abs(dr), Math.abs(dc)) === 1 ? Cell.Light : Cell.Dark;
        }
      }
    }
  }
  // The dark module, always set.
  m[size - 8][8] = Cell.Dark;
  // Reserve the format areas so the data does not land there.
  for (let i = 0; i < 9; i++) {
    if (m[8][i] === Cell.Empty) m[8][i] = Cell.Light;
    if (m[i][8] === Cell.Empty) m[i][8] = Cell.Light;
  }
  for (let i = 0; i < 8; i++) {
    if (m[8][size - 1 - i] === Cell.Empty) m[8][size - 1 - i] = Cell.Light;
    if (m[size - 1 - i][8] === Cell.Empty) m[size - 1 - i][8] = Cell.Light;
  }
  return m;
}

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

/** The spec's penalty score — lower is better. */
function penalty(m: number[][]): number {
  const size = m.length;
  let score = 0;
  const run = (line: number[]) => {
    let last = line[0];
    let length = 1;
    for (let i = 1; i < line.length; i++) {
      if (line[i] === last) length++;
      else {
        if (length >= 5) score += 3 + (length - 5);
        last = line[i];
        length = 1;
      }
    }
    if (length >= 5) score += 3 + (length - 5);
  };
  for (let i = 0; i < size; i++) {
    run(m[i]);
    run(m.map((row) => row[i]));
  }
  for (let r = 0; r < size - 1; r++) {
    for (let c = 0; c < size - 1; c++) {
      const v = m[r][c];
      if (v === m[r][c + 1] && v === m[r + 1][c] && v === m[r + 1][c + 1]) score += 3;
    }
  }
  const pattern = [1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 0];
  const hasPattern = (line: number[], at: number) =>
    pattern.every((bit, i) => line[at + i] === bit);
  for (let i = 0; i < size; i++) {
    const row = m[i];
    const col = m.map((r) => r[i]);
    for (let j = 0; j + 11 <= size; j++) {
      if (hasPattern(row, j)) score += 40;
      if (hasPattern(col, j)) score += 40;
      const rRev = [...row].reverse();
      const cRev = [...col].reverse();
      if (hasPattern(rRev, j)) score += 40;
      if (hasPattern(cRev, j)) score += 40;
    }
  }
  const dark = m.flat().filter((v) => v === Cell.Dark).length;
  const ratio = (dark * 100) / (size * size);
  score += Math.floor(Math.abs(ratio - 50) / 5) * 10;
  return score;
}

/**
 * Encode `value` as a QR matrix of booleans (true = dark module), without the
 * quiet zone — the renderer adds that.
 */
export function strctQrMatrix(value: string, ecc: StrctQrEcc = 'M'): boolean[][] {
  const bytes = new TextEncoder().encode(value);
  const version = chooseVersion(bytes.length, ecc);
  const size = version * 4 + 17;
  const codewords = interleave(dataCodewords(bytes, version, ecc), version, ecc);

  const base = functionPatterns(size, version);
  const reserved = base.map((row) => row.map((v) => v !== Cell.Empty));

  // Lay the data in the zig-zag, skipping the vertical timing column.
  const bits: number[] = [];
  for (const word of codewords) for (let i = 7; i >= 0; i--) bits.push((word >> i) & 1);
  let bit = 0;
  const matrix = base.map((row) => [...row]);
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let vert = 0; vert < size; vert++) {
      for (let j = 0; j < 2; j++) {
        const c = right - j;
        const upward = ((right + 1) & 2) === 0;
        const r = upward ? size - 1 - vert : vert;
        if (reserved[r][c]) continue;
        matrix[r][c] = bit < bits.length ? bits[bit++] : Cell.Light;
      }
    }
  }

  // Pick the mask with the lowest penalty, then write the format bits.
  let best: number[][] | null = null;
  let bestMask = 0;
  let bestScore = Infinity;
  for (let mask = 0; mask < 8; mask++) {
    const candidate = matrix.map((row, r) =>
      row.map((v, c) => (reserved[r][c] ? v : v ^ (MASKS[mask](r, c) ? 1 : 0))),
    );
    writeFormat(candidate, ecc, mask);
    const score = penalty(candidate);
    if (score < bestScore) {
      bestScore = score;
      best = candidate;
      bestMask = mask;
    }
  }
  void bestMask;
  return best!.map((row) => row.map((v) => v === Cell.Dark));
}

/** The 15 format bits, written in both of their places. */
function writeFormat(m: number[][], ecc: StrctQrEcc, mask: number): void {
  const size = m.length;
  const bits = FORMAT_BITS[ecc][mask];
  const at = (i: number) => (bits >> i) & 1;
  for (let i = 0; i <= 5; i++) m[8][i] = at(i);
  m[8][7] = at(6);
  m[8][8] = at(7);
  m[7][8] = at(8);
  for (let i = 9; i <= 14; i++) m[14 - i][8] = at(i);
  for (let i = 0; i <= 6; i++) m[size - 1 - i][8] = at(i);
  for (let i = 7; i <= 14; i++) m[8][size - 15 + i] = at(i);
  m[size - 8][8] = 1; // the dark module, which is not a format bit
}

/** Internals, exported for the vector tests only. */
export const __qrInternals = { dataCodewords, remainder };
