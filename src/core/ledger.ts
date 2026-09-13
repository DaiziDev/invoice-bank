import type {
  Account, Transaction, TransferKind, TransferRequest, ValidationResult, BankProfile,
} from './types';
import { makeReference, uid } from './money';

/** Solde disponible : jamais stocké, toujours recalculé. */
export const available = (a: Account): number => a.balanceConfirmed - a.balancePending;

const IN_FLIGHT = ['PENDING', 'QUEUED', 'SENT'];

/**
 * Recalcule le pending de chaque compte à partir des opérations en vol.
 * C'est ce mécanisme qui empêche un utilisateur hors ligne d'empiler
 * des virements au-delà de son solde.
 */
export function recompute(accounts: Account[], txns: Transaction[]): Account[] {
  return accounts.map((a) => ({
    ...a,
    balancePending: txns
      .filter((x) => x.accountId === a.id && x.direction === 'DEBIT' && IN_FLIGHT.includes(x.status))
      .reduce((s, x) => s + x.amount + x.fee, 0),
  }));
}

export const feeFor = (bank: BankProfile, kind: TransferKind): number => bank.fees[kind] ?? 0;

export function validate(
  req: TransferRequest,
  bank: BankProfile,
  accounts: Account[],
  txns: Transaction[],
  tierLimit: { single: number; daily: number },
): ValidationResult {
  const acc = accounts.find((a) => a.id === req.accountId);
  if (!acc) return { ok: false, reason: 'insufficient' };

  const fee = feeFor(bank, req.kind);
  const total = req.amount + fee;
  const single = Math.min(bank.limits.single, tierLimit.single);
  const daily = Math.min(bank.limits.daily, tierLimit.daily);

  if (req.amount > single) return { ok: false, reason: 'overSingle', limit: single };

  const dayStart = new Date();
  dayStart.setHours(0, 0, 0, 0);
  const used = txns
    .filter(
      (x) => x.direction === 'DEBIT'
        && new Date(x.createdAt) >= dayStart
        && [...IN_FLIGHT, 'SETTLED'].includes(x.status),
    )
    .reduce((s, x) => s + x.amount, 0);
  if (used + req.amount > daily) return { ok: false, reason: 'overDaily', limit: daily };

  if (total > available(acc)) return { ok: false, reason: 'insufficient' };
  return { ok: true, fee, total };
}

/**
 * Crée une transaction à l'état PENDING.
 * La référence et la clé d'idempotence sont générées ICI, à la validation,
 * et accompagnent l'opération jusqu'au bout : rejouer la même opération
 * après une coupure ne la duplique pas.
 */
export function createTransaction(
  req: TransferRequest,
  bank: BankProfile,
): Transaction {
  const fee = feeFor(bank, req.kind);
  return {
    id: uid(),
    reference: makeReference(),
    idempotencyKey: uid(),
    accountId: req.accountId,
    direction: 'DEBIT',
    amount: req.amount,
    fee,
    counterparty: {
      name: req.toName,
      type: req.kind.toUpperCase(),
      identifier: req.toNumber || '',
    },
    channel: 'APP',
    status: 'PENDING',
    label: req.label || req.toName,
    createdAt: new Date().toISOString(),
    settledAt: null,
    failureReason: null,
    kind: req.kind,
    toAccountId: req.toAccountId ?? null,
  };
}

/** SETTLED : le montant passe de pending à confirmed. */
export function applySettlement(accounts: Account[], tx: Transaction): Account[] {
  return accounts.map((a) => {
    if (a.id === tx.accountId) {
      return { ...a, balanceConfirmed: a.balanceConfirmed - tx.amount - tx.fee };
    }
    if (tx.toAccountId && a.id === tx.toAccountId) {
      return { ...a, balanceConfirmed: a.balanceConfirmed + tx.amount };
    }
    return a;
  });
}

/** Construit le code USSD de repli. Non raccordé : ouvre le composeur. */
export function ussdCode(tx: Transaction): string {
  const num = (tx.counterparty.identifier || '').replace(/\D/g, '');
  return `*126*1*${num}*${tx.amount}#`;
}
