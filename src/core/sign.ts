/**
 * Signature de DÉMONSTRATION (FNV-1a).
 *
 * En production, la signature d'un reçu doit être cryptographique
 * (Ed25519 ou ECDSA) et la clé privée détenue par la banque, jamais
 * embarquée dans l'application. Ce point est un point d'intégration
 * de phase 1 — il est annoncé explicitement dans l'interface.
 */
export function signDemo(payload: string, bankId: string): string {
  let h = 0x811c9dc5;
  const s = `${payload}::${bankId}`;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).toUpperCase().padStart(8, '0');
}

export function receiptPayload(
  bankId: string,
  reference: string,
  amount: number,
  createdAt: string,
): string {
  const base = `${bankId}|${reference}|${amount}|${createdAt}`;
  return `${base}|${signDemo(base, bankId)}`;
}

export function verifyReceipt(
  payload: string,
  bankId: string,
): { ok: boolean; reference?: string; amount?: number } {
  const parts = payload.trim().split('|');
  if (parts.length !== 5) return { ok: false };
  const base = parts.slice(0, 4).join('|');
  const ok = parts[0] === bankId && signDemo(base, bankId) === parts[4];
  return { ok, reference: parts[1], amount: Number(parts[2]) };
}
