import type { Account, Beneficiary, Notification, Transaction, OutboxItem } from './types';
import { makeReference, money, uid } from './money';

const BENEFS: Omit<Beneficiary, 'id'>[] = [
  { name: 'Sylvie Ateba', kind: 'internal', number: '00021 45789 32', fav: true },
  { name: 'Établissements Nkolo', kind: 'internal', number: '00021 88104 66', fav: true },
  { name: 'Ibrahim Moussa', kind: 'phone', number: '+237 6 99 41 22 08', fav: false },
  { name: 'Marché Mokolo — Grossiste', kind: 'wallet', number: 'MoMo +237 6 77 30 15 44', fav: false },
  { name: 'Aline Tchoumi', kind: 'wallet', number: 'OM +237 6 94 08 71 23', fav: false },
  { name: 'Transport Douala Express', kind: 'internal', number: '00021 30992 17', fav: false },
];

const OPS: [string, 'DEBIT' | 'CREDIT', number, number][] = [
  ['Virement reçu — Ets Nkolo', 'CREDIT', 450000, 22], ['Facture ENEO', 'DEBIT', 38500, 21],
  ['Retrait GAB Akwa', 'DEBIT', 100000, 20], ['Sylvie Ateba', 'DEBIT', 75000, 19],
  ['Rechargement MoMo', 'CREDIT', 60000, 18], ['Fournisseur Mokolo', 'DEBIT', 220000, 17],
  ['Facture Camwater', 'DEBIT', 14200, 16], ['Virement reçu — Client Bafoussam', 'CREDIT', 310000, 15],
  ['Ibrahim Moussa', 'DEBIT', 45000, 14], ['Achat crédit MTN', 'DEBIT', 5000, 13],
  ['Transport Douala Express', 'DEBIT', 130000, 12], ['Virement reçu — Ets Nkolo', 'CREDIT', 520000, 11],
  ['Retrait GAB Bonanjo', 'DEBIT', 150000, 10], ['Aline Tchoumi', 'DEBIT', 32000, 9],
  ['Facture ENEO', 'DEBIT', 41300, 8], ['Loyer boutique', 'DEBIT', 180000, 7],
  ['Virement reçu — Client Yaoundé', 'CREDIT', 275000, 6], ['Fournisseur Mokolo', 'DEBIT', 195000, 5],
  ['Achat crédit Orange', 'DEBIT', 3000, 4], ['Sylvie Ateba', 'DEBIT', 60000, 3],
  ['Virement reçu — Ets Nkolo', 'CREDIT', 380000, 2],
];

export interface SeedResult {
  accounts: Account[];
  txns: Transaction[];
  outbox: OutboxItem[];
  benefs: Beneficiary[];
  notifs: Notification[];
}

/** Jeu de démonstration — commerçant de Douala. Données entièrement fictives. */
export function seedFull(): SeedResult {
  const now = Date.now();
  const ago = (d: number, h = 10, m = 0) =>
    new Date(now - d * 864e5 - (24 - h) * 36e5 + m * 6e4).toISOString();

  const accounts: Account[] = [
    { id: 'a1', label: 'current', number: '00021 77410 05', type: 'current', balanceConfirmed: 487500, balancePending: 0 },
    { id: 'a2', label: 'savings', number: '00021 77410 91', type: 'savings', balanceConfirmed: 1250000, balancePending: 0 },
    { id: 'a3', label: 'wallet', number: '+237 6 91 22 44 07', type: 'wallet', balanceConfirmed: 32000, balancePending: 0 },
  ];

  const txns: Transaction[] = OPS.map(([label, dir, amount, d], i) => ({
    id: uid(), reference: makeReference(), idempotencyKey: uid(), accountId: 'a1',
    direction: dir, amount, fee: 0,
    counterparty: { name: label, type: dir === 'CREDIT' ? 'BANK' : 'ACCOUNT', identifier: '' },
    channel: 'APP' as const, status: 'SETTLED' as const, label,
    createdAt: ago(d * 4 + (i % 3), 8 + (i % 9), (i * 13) % 60),
    settledAt: ago(d * 4 + (i % 3), 8 + (i % 9), ((i * 13) % 60) + 1),
    failureReason: null,
  }));

  // Une opération refusée : montre qu'on traite l'échec proprement.
  txns.push({
    id: uid(), reference: makeReference(), idempotencyKey: uid(), accountId: 'a1',
    direction: 'DEBIT', amount: 640000, fee: 500,
    counterparty: { name: 'Fournisseur Yaoundé', type: 'ACCOUNT', identifier: '00021 55120 43' },
    channel: 'APP', status: 'FAILED', label: 'Fournisseur Yaoundé',
    createdAt: ago(3, 15, 22), settledAt: null, failureReason: 'overSingle',
  });

  // Une opération déjà en file : le hors-ligne est visible dès l'ouverture.
  const h = new Date().getHours();
  const queued: Transaction = {
    id: uid(), reference: makeReference(), idempotencyKey: uid(), accountId: 'a1',
    direction: 'DEBIT', amount: 25000, fee: 250,
    counterparty: { name: 'Ibrahim Moussa', type: 'PHONE', identifier: '+237 6 99 41 22 08' },
    channel: 'APP', status: 'QUEUED', label: 'Ibrahim Moussa',
    createdAt: ago(0, h > 1 ? h - 1 : 8, 12), settledAt: null, failureReason: null,
  };
  txns.push(queued);

  return {
    accounts,
    txns,
    outbox: [{ id: uid(), txnId: queued.id, idempotencyKey: queued.idempotencyKey, attempts: 0, nextAttemptAt: 0 }],
    benefs: BENEFS.map((b) => ({ ...b, id: uid() })),
    notifs: [
      { id: uid(), kind: 'queued', title: 'Ibrahim Moussa', body: money(25250), at: queued.createdAt, read: false },
      { id: uid(), kind: 'credit', title: 'Virement reçu — Ets Nkolo', body: money(380000), at: ago(8, 11, 5), read: true },
    ],
  };
}

/** Nouvel inscrit : un wallet vide, palier 1. */
export function seedWallet(phone: string): SeedResult {
  return {
    accounts: [{ id: 'w1', label: 'wallet', number: phone, type: 'wallet', balanceConfirmed: 0, balancePending: 0 }],
    txns: [], outbox: [],
    benefs: [
      { id: uid(), name: 'Sylvie Ateba', kind: 'wallet', number: 'MoMo +237 6 77 30 15 44', fav: true },
      { id: uid(), name: 'Ibrahim Moussa', kind: 'phone', number: '+237 6 99 41 22 08', fav: false },
    ],
    notifs: [],
  };
}
