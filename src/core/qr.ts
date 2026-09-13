/**
 * Générateur de QR code — mode octet, correction L, versions 1 à 10.
 *
 * Écrit à la main, sans dépendance : la démonstration doit fonctionner
 * hors ligne. La matrice a été vérifiée module par module contre une
 * implémentation de référence, puis les codes produits ont été testés
 * au décodage par un lecteur réel.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
// Générateur QR — byte mode, correction L, versions 1..10
// Retourne une matrice 2D de booléens (true = module noir)

const QR_CAP_L: number[] = [0, 17, 32, 53, 78, 106, 134, 154, 192, 230, 271];
// [ecCodewordsPerBlock, blocksG1, dataCwG1, blocksG2, dataCwG2]
const QR_BLOCKS_L: (number[] | null)[] = [
  null,
  [7, 1, 19, 0, 0],
  [10, 1, 34, 0, 0],
  [15, 1, 55, 0, 0],
  [20, 1, 80, 0, 0],
  [26, 1, 108, 0, 0],
  [18, 2, 68, 0, 0],
  [20, 2, 78, 0, 0],
  [24, 2, 97, 0, 0],
  [30, 2, 116, 0, 0],
  [18, 2, 68, 2, 69],
];
const QR_ALIGN: (number[] | null)[] = [
  null, [], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34],
  [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50],
];

// --- Galois field GF(256) ---
const GF_EXP = new Uint8Array(512);
const GF_LOG = new Uint8Array(256);
(function initGF() {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    GF_EXP[i] = x;
    GF_LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) GF_EXP[i] = GF_EXP[i - 255];
})();

function gfMul(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return GF_EXP[GF_LOG[a] + GF_LOG[b]];
}

function rsGenerator(degree: number): number[] {
  let poly: number[] = [1];
  for (let i = 0; i < degree; i++) {
    const next: number[] = new Array(poly.length + 1).fill(0);
    for (let j = 0; j < poly.length; j++) {
      next[j] ^= gfMul(poly[j], 1);
      next[j + 1] ^= gfMul(poly[j], GF_EXP[i]);
    }
    poly = next;
  }
  return poly;
}

function rsEncode(data: number[], ecLen: number): number[] {
  const gen = rsGenerator(ecLen);
  const res: number[] = new Array(ecLen).fill(0);
  for (let i = 0; i < data.length; i++) {
    const factor = data[i] ^ res[0];
    res.shift();
    res.push(0);
    if (factor !== 0) {
      for (let j = 0; j < ecLen; j++) {
        res[j] ^= gfMul(gen[j + 1], factor);
      }
    }
  }
  return res;
}

// --- Encodage des données ---
function toUtf8Bytes(str: string): number[] {
  const out: number[] = [];
  for (let i = 0; i < str.length; i++) {
    const c = str.codePointAt(i) as number;
    if (c > 0xffff) i++;
    if (c < 0x80) out.push(c);
    else if (c < 0x800) {
      out.push(0xc0 | (c >> 6), 0x80 | (c & 0x3f));
    } else if (c < 0x10000) {
      out.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 0x3f), 0x80 | (c & 0x3f));
    } else {
      out.push(
        0xf0 | (c >> 18), 0x80 | ((c >> 12) & 0x3f),
        0x80 | ((c >> 6) & 0x3f), 0x80 | (c & 0x3f)
      );
    }
  }
  return out;
}

function pickVersion(byteLen: number): number {
  for (let v = 1; v <= 10; v++) {
    if (byteLen <= QR_CAP_L[v]) return v;
  }
  throw new Error('Contenu trop long pour un QR version 10');
}

function buildCodewords(bytes: number[], version: number): number[] {
  const [ecLen, b1, d1, b2, d2] = QR_BLOCKS_L[version] as number[];
  const totalData = b1 * d1 + b2 * d2;

  // Flux de bits
  const bits: number[] = [];
  const push = (val: number, len: number) => {
    for (let i = len - 1; i >= 0; i--) bits.push((val >> i) & 1);
  };
  push(0b0100, 4);                                  // mode octet
  push(bytes.length, version < 10 ? 8 : 16);        // compteur
  for (const b of bytes) push(b, 8);

  // Terminateur
  const remaining = totalData * 8 - bits.length;
  push(0, Math.min(4, remaining));
  while (bits.length % 8 !== 0) bits.push(0);

  // Codewords
  const cw: number[] = [];
  for (let i = 0; i < bits.length; i += 8) {
    let v = 0;
    for (let j = 0; j < 8; j++) v = (v << 1) | bits[i + j];
    cw.push(v);
  }
  // Remplissage
  const pad = [0xec, 0x11];
  let p = 0;
  while (cw.length < totalData) cw.push(pad[p++ % 2]);

  // Découpage en blocs
  const blocks: number[][] = [];
  let pos = 0;
  for (let i = 0; i < b1; i++) { blocks.push(cw.slice(pos, pos + d1)); pos += d1; }
  for (let i = 0; i < b2; i++) { blocks.push(cw.slice(pos, pos + d2)); pos += d2; }

  const ecBlocks = blocks.map((b: number[]) => rsEncode(b, ecLen));

  // Entrelacement
  const out: number[] = [];
  const maxData = Math.max(d1, d2 || 0);
  for (let i = 0; i < maxData; i++) {
    for (const b of blocks) if (i < b.length) out.push(b[i]);
  }
  for (let i = 0; i < ecLen; i++) {
    for (const b of ecBlocks) out.push(b[i]);
  }
  return out;
}

// --- Placement dans la matrice ---
function makeMatrix(version: number): { m: boolean[][]; reserved: boolean[][]; size: number } {
  const size = version * 4 + 17;
  const m: boolean[][] = Array.from({ length: size }, () => new Array(size).fill(false));
  const reserved: boolean[][] = Array.from({ length: size }, () => new Array(size).fill(false));

  const setF = (r: number, c: number, v: boolean) => { m[r][c] = v; reserved[r][c] = true; };

  // Motifs de détection
  const finder = (top: number, left: number) => {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const rr = top + r, cc = left + c;
        if (rr < 0 || rr >= size || cc < 0 || cc >= size) continue;
        const inner = r >= 0 && r <= 6 && c >= 0 && c <= 6 &&
          (r === 0 || r === 6 || c === 0 || c === 6 ||
            (r >= 2 && r <= 4 && c >= 2 && c <= 4));
        setF(rr, cc, inner);
      }
    }
  };
  finder(0, 0); finder(0, size - 7); finder(size - 7, 0);

  // Motifs d'alignement
  const align = QR_ALIGN[version] as number[];
  for (const r of align) {
    for (const c of align) {
      if ((r === 6 && c === 6) || (r === 6 && c === size - 7) || (r === size - 7 && c === 6)) continue;
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          const on = Math.max(Math.abs(dr), Math.abs(dc)) !== 1;
          setF(r + dr, c + dc, on);
        }
      }
    }
  }

  // Motifs de synchronisation
  for (let i = 8; i < size - 8; i++) {
    setF(6, i, i % 2 === 0);
    setF(i, 6, i % 2 === 0);
  }

  // Module sombre
  setF(size - 8, 8, true);

  // Zones réservées pour l'information de format
  for (let i = 0; i <= 8; i++) {
    if (!reserved[8][i]) { m[8][i] = false; reserved[8][i] = true; }
    if (!reserved[i][8]) { m[i][8] = false; reserved[i][8] = true; }
  }
  for (let i = 0; i < 8; i++) {
    if (!reserved[8][size - 1 - i]) { m[8][size - 1 - i] = false; reserved[8][size - 1 - i] = true; }
    if (!reserved[size - 1 - i][8]) { m[size - 1 - i][8] = false; reserved[size - 1 - i][8] = true; }
  }

  // Information de version (v >= 7)
  if (version >= 7) {
    let d = version;
    for (let i = 0; i < 12; i++) {
      d = (d << 1) ^ ((d >> 11) * 0x1f25);
    }
    const bits = (version << 12) | d;
    for (let i = 0; i < 18; i++) {
      const bit = ((bits >> i) & 1) === 1;
      const a = Math.floor(i / 3);
      const b = (i % 3) + size - 11;
      setF(b, a, bit);
      setF(a, b, bit);
    }
  }

  return { m, reserved, size };
}

function placeData(m: boolean[][], reserved: boolean[][], size: number, codewords: number[]): void {
  let bitIdx = 0;
  const totalBits = codewords.length * 8;
  const getBit = () => {
    if (bitIdx >= totalBits) return false;
    const b = (codewords[bitIdx >> 3] >> (7 - (bitIdx & 7))) & 1;
    bitIdx++;
    return b === 1;
  };

  let up = true;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let vert = 0; vert < size; vert++) {
      for (let j = 0; j < 2; j++) {
        const c = right - j;
        const r = up ? size - 1 - vert : vert;
        if (!reserved[r][c]) m[r][c] = getBit();
      }
    }
    up = !up;
  }
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

function applyMask(m: boolean[][], reserved: boolean[][], size: number, maskId: number): boolean[][] {
  const out = m.map((row: boolean[]) => row.slice());
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!reserved[r][c] && MASKS[maskId](r, c)) out[r][c] = !out[r][c];
    }
  }
  return out;
}

function placeFormat(m: boolean[][], size: number, maskId: number): void {
  // ECC L = 01
  const data = (0b01 << 3) | maskId;
  let d = data;
  for (let i = 0; i < 10; i++) d = (d << 1) ^ ((d >> 9) * 0x537);
  const bits = ((data << 10) | d) ^ 0x5412;
  // i = 0 correspond au bit de poids fort de la chaîne de 15 bits
  const bit = (i: number) => ((bits >> (14 - i)) & 1) === 1;

  for (let i = 0; i <= 5; i++) m[8][i] = bit(i);
  m[8][7] = bit(6);
  m[8][8] = bit(7);
  m[7][8] = bit(8);
  for (let i = 9; i < 15; i++) m[14 - i][8] = bit(i);

  for (let i = 0; i < 7; i++) m[size - 1 - i][8] = bit(i);
  for (let i = 7; i < 15; i++) m[8][size - 15 + i] = bit(i);
  m[size - 8][8] = true;
}

function penalty(m: boolean[][], size: number): number {
  let score = 0;

  // Règle 1 — suites de même couleur
  for (let i = 0; i < size; i++) {
    for (const horiz of [true, false]) {
      let run = 1;
      for (let j = 1; j < size; j++) {
        const cur = horiz ? m[i][j] : m[j][i];
        const prev = horiz ? m[i][j - 1] : m[j - 1][i];
        if (cur === prev) {
          run++;
        } else {
          if (run >= 5) score += run - 2;
          run = 1;
        }
      }
      if (run >= 5) score += run - 2;
    }
  }

  // Règle 2 — blocs 2x2
  for (let r = 0; r < size - 1; r++) {
    for (let c = 0; c < size - 1; c++) {
      const v = m[r][c];
      if (v === m[r][c + 1] && v === m[r + 1][c] && v === m[r + 1][c + 1]) score += 3;
    }
  }

  // Règle 3 — motifs 1:1:3:1:1
  const p1 = [true, false, true, true, true, false, true, false, false, false, false];
  const p2 = [false, false, false, false, true, false, true, true, true, false, true];
  const match = (arr: boolean[], pat: boolean[]) => pat.every((v: boolean, i: number) => arr[i] === v);
  for (let i = 0; i < size; i++) {
    for (let j = 0; j <= size - 11; j++) {
      const row: boolean[] = [], col: boolean[] = [];
      for (let k = 0; k < 11; k++) { row.push(m[i][j + k]); col.push(m[j + k][i]); }
      if (match(row, p1) || match(row, p2)) score += 40;
      if (match(col, p1) || match(col, p2)) score += 40;
    }
  }

  // Règle 4 — proportion de noir
  let dark = 0;
  for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) if (m[r][c]) dark++;
  const pct = (dark * 100) / (size * size);
  score += Math.floor(Math.abs(pct - 50) / 5) * 10;

  return score;
}

export function qrMatrix(text: string): boolean[][] {
  const bytes = toUtf8Bytes(text);
  const version = pickVersion(bytes.length);
  const codewords = buildCodewords(bytes, version);
  const { m, reserved, size } = makeMatrix(version);
  placeData(m, reserved, size, codewords);

  let best: boolean[][] | null = null; let bestScore = Infinity;
  for (let mask = 0; mask < 8; mask++) {
    const cand = applyMask(m, reserved, size, mask);
    placeFormat(cand, size, mask);
    const s = penalty(cand, size);
    if (s < bestScore) { bestScore = s; best = cand; }
  }
  return best as boolean[][];
}


