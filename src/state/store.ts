import { useSyncExternalStore } from 'react';
import type {
  Account, Beneficiary, Lang, NetState, Notification, OutboxItem, Profile,
  Tier, Transaction, TransferRequest, BankProfile,
} from '../core/types';
import { BANKS, TIER_LIMITS } from '../core/config';
import { storage } from '../core/storage';
import { seedFull, seedWallet } from '../core/seed';
import {
  applySettlement, available, createTransaction, feeFor, recompute, validate,
} from '../core/ledger';
import { money, uid } from '../core/money';

const KEY = 'invoice-bank-v1';

export interface AppState {
  lang: Lang;
  bankKey: string;
  custom: BankProfile;
  net: NetState;
  authed: boolean;
  dataSaver: boolean;
  mode: 'full' | 'wallet';
  tier: Tier;
  profile: Profile;
  accounts: Account[];
  txns: Transaction[];
  outbox: OutboxItem[];
  benefs: Beneficiary[];
  notifs: Notification[];
  offSince: number | null;
  toast: { msg: string; kind?: string; id: string } | null;
}

function initial(): AppState {
  const s = seedFull();
  return {
    lang: 'fr',
    bankKey: 'kota',
    custom: structuredClone(BANKS.custom),
    net: 'on',
    authed: false,
    dataSaver: false,
    mode: 'full',
    tier: 3,
    profile: { first: 'Éric', last: 'Mbarga', phone: '+237 6 91 22 44 07' },
    ...s,
    accounts: recompute(s.accounts, s.txns),
    offSince: null,
    toast: null,
  };
}

function load(): AppState {
  const raw = storage.get(KEY);
  const base = initial();
  if (!raw) return base;
  try {
    const d = JSON.parse(raw) as Partial<AppState>;
    const merged = { ...base, ...d, net: 'on' as NetState, toast: null };
    merged.accounts = recompute(merged.accounts, merged.txns);
    return merged;
  } catch {
    return base;
  }
}

let state: AppState = load();
const listeners = new Set<() => void>();

const persist = () => {
  const { toast: _t, net: _n, ...rest } = state;
  storage.set(KEY, JSON.stringify(rest));
};

export const getState = (): AppState => state;

export function setState(patch: Partial<AppState> | ((s: AppState) => Partial<AppState>)): void {
  const p = typeof patch === 'function' ? patch(state) : patch;
  state = { ...state, ...p };
  persist();
  listeners.forEach((l) => l());
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => { listeners.delete(l); };
};

/** L'objet d'état est remplacé à chaque écriture : l'égalité de référence suffit. */
export const useApp = (): AppState => useSyncExternalStore(subscribe, getState, getState);

/* ---------- Sélecteurs ---------- */

export const currentBank = (s: AppState = state): BankProfile =>
  s.bankKey === 'custom' ? s.custom : BANKS[s.bankKey];

export const tierLimit = (s: AppState = state) => TIER_LIMITS[s.tier];

export const effectiveLimits = (s: AppState = state) => {
  const b = currentBank(s);
  const t = tierLimit(s);
  return { single: Math.min(b.limits.single, t.single), daily: Math.min(b.limits.daily, t.daily) };
};

export const accountById = (id: string, s: AppState = state) =>
  s.accounts.find((a) => a.id === id);

export const sortedTxns = (accountId: string | null, s: AppState = state) =>
  s.txns
    .filter((x) => (accountId ? x.accountId === accountId : true))
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));

export { available, feeFor };

/* ---------- Actions ---------- */

export function toast(msg: string, kind?: string): void {
  const id = uid();
  setState({ toast: { msg, kind, id } });
  setTimeout(() => {
    if (getState().toast?.id === id) setState({ toast: null });
  }, 2600);
}

export function notify(kind: Notification['kind'], title: string, body: string): void {
  setState((s) => ({
    notifs: [{ id: uid(), kind, title, body, at: new Date().toISOString(), read: false }, ...s.notifs],
  }));
}

export function setNet(net: NetState): void {
  const was = getState().net;
  setState({ net, offSince: net === 'off' ? Date.now() : null });
  if (was === 'off' && net !== 'off') drainOutbox();
}

export function validateTransfer(req: TransferRequest) {
  const s = getState();
  return validate(req, currentBank(s), s.accounts, s.txns, tierLimit(s));
}

/** DRAFT → PENDING → (QUEUED) → SENT → SETTLED | FAILED */
export function submitTransfer(req: TransferRequest): Transaction {
  const s = getState();
  const tx = createTransaction(req, currentBank(s));
  const offline = s.net === 'off';

  tx.status = offline ? 'QUEUED' : 'SENT';
  if (offline) tx.queuedAt = new Date().toISOString();
  else tx.sentAt = new Date().toISOString();

  const txns = [...s.txns, tx];
  setState({
    txns,
    accounts: recompute(s.accounts, txns),
    outbox: offline
      ? [...s.outbox, { id: uid(), txnId: tx.id, idempotencyKey: tx.idempotencyKey, attempts: 0, nextAttemptAt: 0 }]
      : s.outbox,
  });

  if (offline) {
    notify('queued', tx.counterparty.name, money(tx.amount + tx.fee));
  } else {
    const delay = s.net === 'weak' ? 2600 : 900;
    setTimeout(() => settle(tx.id), delay);
  }
  return tx;
}

export function settle(id: string): void {
  const s = getState();
  const tx = s.txns.find((x) => x.id === id);
  if (!tx || tx.status === 'SETTLED') return;
  const updated: Transaction = { ...tx, status: 'SETTLED', settledAt: new Date().toISOString() };
  const txns = s.txns.map((x) => (x.id === id ? updated : x));
  const accounts = recompute(applySettlement(s.accounts, updated), txns);
  setState({ txns, accounts });
  notify('debit', updated.counterparty.name, money(updated.amount + updated.fee));
}

export function failTransfer(id: string, reason: string): void {
  const s = getState();
  const txns = s.txns.map((x) => (x.id === id ? { ...x, status: 'FAILED' as const, failureReason: reason } : x));
  setState({ txns, accounts: recompute(s.accounts, txns) });
}

/* ---------- File d'attente : reprise séquentielle ---------- */

let draining = false;

export function drainOutbox(): void {
  if (draining) return;
  const s0 = getState();
  if (s0.net === 'off' || !s0.outbox.length) return;
  draining = true;

  const step = () => {
    const s = getState();
    if (s.net === 'off' || !s.outbox.length) { draining = false; return; }
    const item = s.outbox[0];
    const tx = s.txns.find((x) => x.id === item.txnId);
    if (!tx) { setState({ outbox: s.outbox.slice(1) }); step(); return; }

    setState({ txns: s.txns.map((x) => (x.id === tx.id ? { ...x, status: 'SENT' as const } : x)) });

    setTimeout(() => {
      const s2 = getState();
      if (s2.net === 'off') {
        setState({ txns: s2.txns.map((x) => (x.id === tx.id ? { ...x, status: 'QUEUED' as const } : x)) });
        draining = false;
        return;
      }
      setState({ outbox: s2.outbox.slice(1) });
      settle(tx.id);
      if (getState().outbox.length) setTimeout(step, 620);
      else { draining = false; }
    }, 1100);
  };
  setTimeout(step, 700);
}

/* ---------- Cycle de vie ---------- */

export function resetDemo(): void {
  storage.del(KEY);
  const base = initial();
  state = { ...base, lang: getState().lang, bankKey: getState().bankKey, custom: getState().custom };
  persist();
  listeners.forEach((l) => l());
}

export function startWalletAccount(profile: Profile): void {
  const s = seedWallet(profile.phone);
  setState({
    profile, mode: 'wallet', tier: 1, authed: true,
    accounts: s.accounts, txns: s.txns, outbox: s.outbox, benefs: s.benefs, notifs: s.notifs,
  });
}

export function loadExistingCustomer(): void {
  const s = seedFull();
  setState({
    mode: 'full', tier: 3, authed: true,
    profile: { first: 'Éric', last: 'Mbarga', phone: '+237 6 91 22 44 07' },
    accounts: recompute(s.accounts, s.txns),
    txns: s.txns, outbox: s.outbox, benefs: s.benefs, notifs: s.notifs,
  });
}

export function linkBankAccount(): void {
  const s = getState();
  if (s.accounts.some((a) => a.type === 'current')) { setState({ tier: 3 }); return; }
  const accounts: Account[] = [
    { id: 'a1', label: 'current', number: '00021 77410 05', type: 'current', balanceConfirmed: 0, balancePending: 0 },
    ...s.accounts,
  ];
  setState({ tier: 3, accounts: recompute(accounts, s.txns) });
}

export function topUp(amount: number, sourceLabel: string, fromAccountId?: string): void {
  const s = getState();
  const wallet = s.accounts.find((a) => a.type === 'wallet');
  if (!wallet) return;
  let accounts = s.accounts.map((a) =>
    a.id === wallet.id ? { ...a, balanceConfirmed: a.balanceConfirmed + amount } : a);
  if (fromAccountId) {
    accounts = accounts.map((a) =>
      a.id === fromAccountId ? { ...a, balanceConfirmed: a.balanceConfirmed - amount } : a);
  }
  const tx: Transaction = {
    id: uid(), reference: `TRX-TOPUP-${uid().slice(1, 7).toUpperCase()}`, idempotencyKey: uid(),
    accountId: wallet.id, direction: 'CREDIT', amount, fee: 0,
    counterparty: { name: sourceLabel, type: 'WALLET', identifier: s.profile.phone },
    channel: 'APP', status: 'SETTLED', label: sourceLabel,
    createdAt: new Date().toISOString(), settledAt: new Date().toISOString(), failureReason: null,
  };
  const txns = [...s.txns, tx];
  setState({ accounts: recompute(accounts, txns), txns });
  notify('credit', sourceLabel, money(amount));
}

export function addBeneficiary(b: Omit<Beneficiary, 'id' | 'fav'>): void {
  setState((s) => ({ benefs: [...s.benefs, { ...b, id: uid(), fav: false }] }));
}

export function markNotifsRead(): void {
  setState((s) => ({ notifs: s.notifs.map((n) => ({ ...n, read: true })) }));
}
