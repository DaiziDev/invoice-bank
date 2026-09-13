export type Lang = 'fr' | 'en';
export type NetState = 'on' | 'weak' | 'off';
export type AccountType = 'current' | 'savings' | 'wallet';
export type TxStatus = 'DRAFT' | 'PENDING' | 'QUEUED' | 'SENT' | 'SETTLED' | 'FAILED';
export type TransferKind = 'own' | 'internal' | 'phone' | 'wallet';
export type Tier = 1 | 2 | 3;

export interface Account {
  id: string;
  label: AccountType;
  number: string;
  type: AccountType;
  balanceConfirmed: number;
  /** Jamais stocké : toujours recalculé depuis les opérations en vol. */
  balancePending: number;
}

export interface Counterparty {
  name: string;
  type: string;
  identifier: string;
}

export interface Transaction {
  id: string;
  reference: string;
  /** Garantit qu'une opération rejouée après coupure ne se duplique pas. */
  idempotencyKey: string;
  accountId: string;
  direction: 'DEBIT' | 'CREDIT';
  amount: number;
  fee: number;
  counterparty: Counterparty;
  channel: 'APP' | 'USSD';
  status: TxStatus;
  label: string;
  createdAt: string;
  queuedAt?: string | null;
  sentAt?: string | null;
  settledAt?: string | null;
  failureReason?: string | null;
  kind?: TransferKind;
  toAccountId?: string | null;
}

export interface OutboxItem {
  id: string;
  txnId: string;
  idempotencyKey: string;
  attempts: number;
  nextAttemptAt: number;
  lastError?: string | null;
}

export interface Beneficiary {
  id: string;
  name: string;
  kind: 'internal' | 'phone' | 'wallet';
  number: string;
  fav: boolean;
}

export interface Notification {
  id: string;
  kind: 'credit' | 'debit' | 'queued' | 'failed';
  title: string;
  body: string;
  at: string;
  read: boolean;
}

export interface BankProfile {
  bankId: string;
  bankName: string;
  appName: string;
  initials: string;
  tagline: Record<Lang, string>;
  colors: { brand: string; brand2: string; soft: string };
  fees: Record<TransferKind, number>;
  limits: { single: number; daily: number };
  features: { phone: boolean; wallet: boolean; interbank: boolean };
}

export interface Profile {
  first: string;
  last: string;
  phone: string;
}

export interface TransferRequest {
  kind: TransferKind;
  accountId: string;
  amount: number;
  toName: string;
  toNumber: string;
  toAccountId?: string | null;
  label?: string | null;
}

export type ValidationResult =
  | { ok: true; fee: number; total: number }
  | { ok: false; reason: 'overSingle' | 'overDaily' | 'insufficient'; limit?: number };
