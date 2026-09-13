/* Tests du noyau métier — sans DOM, sans React. */
import { recompute, available, validate, createTransaction, applySettlement, ussdCode } from '../src/core/ledger';
import { seedFull, seedWallet } from '../src/core/seed';
import { receiptPayload, verifyReceipt } from '../src/core/sign';
import { qrMatrix } from '../src/core/qr';
import { fmt, money, makeReference } from '../src/core/money';
import { BANKS, TIER_LIMITS, suggestNames } from '../src/core/config';
import type { Account, Transaction, TransferRequest } from '../src/core/types';

let pass = 0, fail = 0;
const ck = (label: string, cond: boolean, extra = '') => {
  if (cond) { pass++; console.log('✓ ' + label); }
  else { fail++; console.log('✗ ' + label + (extra ? '  ← ' + extra : '')); }
};

const bank = BANKS.kota;

console.log('--- FORMATAGE ---');
ck('séparateur de milliers', fmt(1250000).replace(/\u202F/g, ' ') === '1 250 000', fmt(1250000));
ck('devise sans décimale', money(487500).includes('FCFA'));
ck('référence au bon format', /^TRX-\d{8}-[A-Z0-9]{6}$/.test(makeReference()));

console.log('\n--- SOLDES ---');
const s = seedFull();
const accs = recompute(s.accounts, s.txns);
const a1 = accs.find((a) => a.id === 'a1')!;
ck('pending calculé depuis la file', a1.balancePending === 25250, String(a1.balancePending));
ck('disponible = confirmé − pending', available(a1) === a1.balanceConfirmed - 25250);
ck('confirmé intact malgré la file', a1.balanceConfirmed === 487500, String(a1.balanceConfirmed));

console.log('\n--- PLAFONDS ---');
const base: TransferRequest = { kind: 'phone', accountId: 'a1', amount: 50000, toName: 'Test', toNumber: '+237600000000' };
const t3 = TIER_LIMITS[3];
ck('virement normal accepté', validate(base, bank, accs, s.txns, t3).ok);
const over = validate({ ...base, amount: 900000 }, bank, accs, s.txns, t3);
ck('au-delà du plafond unitaire refusé', !over.ok && over.reason === 'overSingle');
const poor = validate({ ...base, amount: 480000 }, bank, accs, s.txns, t3);
ck('solde disponible insuffisant détecté', !poor.ok && poor.reason === 'insufficient',
  JSON.stringify(poor));

console.log('\n--- PALIER 1 (nouvel inscrit) ---');
const w = seedWallet('+237 6 91 22 44 07');
const wAccs = recompute(w.accounts, w.txns);
const t1 = TIER_LIMITS[1];
const overTier = validate({ ...base, accountId: 'w1', amount: 150000 }, bank, wAccs, w.txns, t1);
ck('plafond de palier 1 appliqué', !overTier.ok && overTier.reason === 'overSingle',
  JSON.stringify(overTier));
ck('palier 1 plus strict que la banque', Math.min(bank.limits.single, t1.single) === 100000);

console.log('\n--- MACHINE À ÉTATS ---');
const tx = createTransaction(base, bank);
ck('état initial PENDING', tx.status === 'PENDING');
ck('clé d\'idempotence générée', !!tx.idempotencyKey && tx.idempotencyKey.length > 5);
ck('frais appliqués selon le type', tx.fee === bank.fees.phone, String(tx.fee));

const withTx: Transaction[] = [...s.txns, { ...tx, status: 'QUEUED' }];
const afterQueue = recompute(accs, withTx);
const a1q = afterQueue.find((a) => a.id === 'a1')!;
ck('mise en file réserve immédiatement le montant',
  a1q.balancePending === 25250 + tx.amount + tx.fee, String(a1q.balancePending));
ck('solde comptable inchangé tant que non réglé', a1q.balanceConfirmed === 487500);

const settledTx: Transaction = { ...tx, status: 'SETTLED' };
const settledAccs = recompute(applySettlement(afterQueue, settledTx),
  withTx.map((x) => (x.id === tx.id ? settledTx : x)));
const a1s = settledAccs.find((a) => a.id === 'a1')!;
ck('règlement débite le solde comptable',
  a1s.balanceConfirmed === 487500 - tx.amount - tx.fee, String(a1s.balanceConfirmed));
ck('règlement libère le pending', a1s.balancePending === 25250, String(a1s.balancePending));

console.log('\n--- VIREMENT INTERNE ---');
const own: TransferRequest = { kind: 'own', accountId: 'a1', amount: 100000, toName: 'Épargne', toNumber: '', toAccountId: 'a2' };
const ownTx = createTransaction(own, bank);
ck('virement entre comptes sans frais', ownTx.fee === 0);
const afterOwn = applySettlement(accs, { ...ownTx, status: 'SETTLED' });
const a2 = afterOwn.find((a) => a.id === 'a2')!;
ck('compte destinataire crédité', a2.balanceConfirmed === 1250000 + 100000, String(a2.balanceConfirmed));

console.log('\n--- USSD ---');
ck('code USSD bien formé', /^\*126\*1\*\d+\*\d+#$/.test(ussdCode(tx)), ussdCode(tx));

console.log('\n--- REÇU & SIGNATURE ---');
const payload = receiptPayload('KTB', 'TRX-20260913-ABC123', 125000, '2026-09-13T10:00:00.000Z');
ck('charge utile à 5 segments', payload.split('|').length === 5);
ck('reçu valide vérifié', verifyReceipt(payload, 'KTB').ok);
ck('montant restitué', verifyReceipt(payload, 'KTB').amount === 125000);
ck('signature altérée rejetée', !verifyReceipt(payload.slice(0, -1) + 'X', 'KTB').ok);
ck('montant altéré rejette la signature',
  !verifyReceipt(payload.replace('125000', '999000'), 'KTB').ok);
ck('autre banque rejetée', !verifyReceipt(payload, 'USB').ok);

console.log('\n--- QR ---');
const m = qrMatrix(payload);
ck('matrice carrée', m.length === m[0].length);
ck('taille conforme à une version QR', (m.length - 17) % 4 === 0, String(m.length));
ck('motif de détection présent',
  m[0][0] && m[0][6] && !m[0][7] && m[6][0], 'coin supérieur gauche');
ck('accents encodés sans erreur', qrMatrix('Reçu — 250 000 FCFA').length > 0);

console.log('\n--- WHITE-LABEL ---');
ck('profil microfinance sans interbancaire', BANKS.ccm.features.interbank === false);
ck('plafonds distincts par profil', BANKS.sahel.limits.single !== BANKS.ccm.limits.single);
const sug = suggestNames('Union Sahel');
ck('suggestions de noms générées', sug.length >= 3, sug.join(' / '));
ck('suggestion reprend le nom', sug.some((n) => n.includes('Union')), sug.join(' / '));

console.log('\n--- WALLET ---');
ck('nouvel inscrit : un seul compte', w.accounts.length === 1);
ck('wallet démarre à zéro', w.accounts[0].balanceConfirmed === 0);
ck('aucune opération à l\'ouverture', w.txns.length === 0);

console.log(`\n=== ${pass} vérifications passent, ${fail} échec(s) ===`);
process.exit(fail ? 1 : 0);
