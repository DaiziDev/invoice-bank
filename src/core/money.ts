/** Le franc CFA n'a pas de décimales : tout est en unités entières. */
export const NBSP = '\u202F';

export const fmt = (n: number): string =>
  Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, NBSP);

export const money = (n: number, withCurrency = true): string =>
  fmt(n) + (withCurrency ? NBSP + 'FCFA' : '');

export const pad2 = (n: number): string => String(n).padStart(2, '0');

export const uid = (): string =>
  'x' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

const REF_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function makeReference(d = new Date()): string {
  let s = '';
  for (let i = 0; i < 6; i++) s += REF_CHARS[Math.floor(Math.random() * REF_CHARS.length)];
  return `TRX-${d.getFullYear()}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}-${s}`;
}

export const parseAmount = (v: string): number =>
  parseInt(v.replace(/\D/g, ''), 10) || 0;
