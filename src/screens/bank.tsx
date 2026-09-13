import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Screen, Body } from '../ui/shell';
import { Head, GroupedOps, KV, OpRow, QueueTray, StatusBadge, TierPill, dateFull, hm } from '../ui/bits';
import { Ic } from '../ui/icons';
import { t } from '../i18n';
import { fmt, money } from '../core/money';
import { TIER_LIMITS } from '../core/config';
import {
  available, currentBank, effectiveLimits, markNotifsRead, resetDemo, setState, sortedTxns, toast, useApp,
} from '../state/store';
import type { Account } from '../core/types';

/* ---------- Carte de solde ---------- */
function BalanceCard({ a, title }: { a: Account; title: string }) {
  const pend = a.balancePending;
  return (
    <div className="relative shrink-0 w-full snap-center rounded-[26px] px-5 pt-5 pb-[17px] text-white overflow-hidden"
      style={{
        background: 'linear-gradient(152deg, var(--brand) 0%, var(--brand-2) 100%)',
        boxShadow: pend
          ? '0 14px 30px -14px rgba(10,32,27,.55), inset 0 0 0 1.5px var(--color-queued)'
          : '0 14px 30px -14px rgba(10,32,27,.55)',
      }}>
      <span className="absolute -right-14 -top-20 w-[210px] h-[210px] rounded-full bg-white/5" />
      {pend > 0 && (
        <span className="absolute top-4 right-[18px] mono text-[9px] tracking-[.12em] uppercase px-2 py-1 rounded-full
          bg-[rgba(200,107,60,.22)] text-[#F0B58C] border border-[rgba(240,181,140,.35)]">
          {fmt(pend)} {t('inQueue')}
        </span>
      )}
      <div className="relative mb-3.5">
        <div className="text-[12.5px] font-medium opacity-90">{title}</div>
        <div className="mono text-[10.5px] opacity-55 tracking-[.04em]">{a.number}</div>
      </div>
      <span className="relative amt block text-[33px] leading-none">{fmt(a.balanceConfirmed)}<span className="cur">FCFA</span></span>
      <div className="relative mt-[11px] pt-[11px] border-t border-white/15 flex justify-between items-baseline text-xs">
        <span className="eyebrow eyebrow-light">{t('available')}</span>
        <span className={`amt ${pend ? 'text-[#F0B58C]' : ''}`}>{money(available(a))}</span>
      </div>
    </div>
  );
}

/* ---------- Accueil ---------- */
export function Home() {
  const nav = useNavigate();
  const s = useApp();
  const bank = currentBank(s);
  const unread = s.notifs.filter((n) => !n.read).length;
  const [page, setPage] = useState(0);

  const walletMode = s.mode === 'wallet';
  const wallet = s.accounts.find((a) => a.type === 'wallet');
  const bankAcc = s.accounts.find((a) => a.type !== 'wallet');
  const cards = walletMode
    ? [wallet && { a: wallet, title: t('myWallet') }, bankAcc && { a: bankAcc, title: t('myBank') }].filter(Boolean) as { a: Account; title: string }[]
    : s.accounts.map((a) => ({ a, title: t(a.label) }));

  const recent = sortedTxns(walletMode ? null : 'a1', s).slice(0, 5);
  const L = TIER_LIMITS[s.tier];

  const quick = walletMode
    ? [
      { to: '/topup', icon: <Ic.Down />, lb: t('topup') },
      { to: '/transfer/type', icon: <Ic.Send />, lb: t('transfer') },
      { to: '/verify', icon: <Ic.Scan />, lb: t('verify') },
      { to: '/app/history', icon: <Ic.List />, lb: t('history') },
    ]
    : [
      { to: '/transfer/type', icon: <Ic.Send />, lb: t('transfer') },
      { to: '/transfer/form/wallet', icon: <Ic.Wallet />, lb: t('toWallet') },
      { to: '/verify', icon: <Ic.Scan />, lb: t('verify') },
      { to: '/app/history', icon: <Ic.List />, lb: t('history') },
    ];

  return (
    <Screen>
      <Head noBack title={bank.bankName} sub={`${t('hello')}, ${s.profile.first}`}
        right={
          <button onClick={() => nav('/notifications')} className="relative w-9 h-9 rounded-[11px] grid place-items-center bg-surface-2">
            <Ic.Bell />
            {unread > 0 && <span className="absolute top-[7px] right-[7px] w-[7px] h-[7px] rounded-full bg-queued" />}
          </button>
        } />
      <Body className="stagger">
        <div>
          <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory no-sb -mx-[18px] px-[18px]"
            onScroll={(e) => setPage(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}>
            {cards.map((c) => <BalanceCard key={c.a.id} a={c.a} title={c.title} />)}
          </div>
          {cards.length > 1 && (
            <div className="flex gap-1.5 justify-center mt-[11px]">
              {cards.map((_, i) => (
                <i key={i} className={`h-[5px] rounded-full transition-all ${i === page ? 'w-[17px] bg-brand' : 'w-[5px] bg-[var(--line-strong)]'}`} />
              ))}
            </div>
          )}
          <div className="mono text-[9.5px] text-muted text-center mt-2">{t('upToDate')} {hm(new Date().toISOString())}</div>
        </div>

        {walletMode && (
          <div className="flex items-center justify-between gap-3 card px-3.5 py-3">
            <div>
              <TierPill>{L.label[s.lang]}</TierPill>
              <div className="text-[11.5px] text-muted mt-1.5">{t('tierLimitL')} : <b>{money(effectiveLimits(s).single)}</b></div>
            </div>
            {s.tier < 3 && <button className="btn btn-ghost btn-sm" onClick={() => nav('/link')}>{t('raiseLimits')}</button>}
          </div>
        )}

        <QueueTray />

        <div className="grid grid-cols-4 gap-2">
          {quick.map((q) => (
            <button key={q.lb} onClick={() => nav(q.to)}
              className="card flex flex-col items-center gap-[7px] pt-3.5 pb-2.5 px-1 min-h-[76px] transition-transform active:scale-95">
              <span className="text-brand">{q.icon}</span>
              <span className="text-[10.5px] text-center leading-tight text-muted font-medium">{q.lb}</span>
            </button>
          ))}
        </div>

        {walletMode && !bankAcc && (
          <button className="opt card border-dashed border-[var(--line-strong)]" onClick={() => nav('/link')}>
            <span className="w-10 h-10 rounded-xl bg-brand-soft text-brand grid place-items-center shrink-0"><Ic.Bank /></span>
            <span className="flex-1">
              <span className="block text-sm font-medium">{t('linkTitle')}</span>
              <span className="block text-[11.5px] text-muted mt-0.5">{t('notLinked')}</span>
            </span>
            <Ic.Chev />
          </button>
        )}

        <div className="flex items-center justify-between mt-1">
          <h3 className="display text-[13.5px] font-semibold">{t('recent')}</h3>
          <button className="text-xs text-brand font-medium" onClick={() => nav('/app/history')}>{t('seeAll')}</button>
        </div>
        {recent.length ? (
          <div className="card">{recent.map((x) => <OpRow key={x.id} x={x} onClick={() => nav(`/app/txn/${x.id}`)} />)}</div>
        ) : (
          <div className="card px-4 py-6 text-center text-[12.5px] text-muted">{t('noActivity')}</div>
        )}
        <div className="mono text-[9.5px] text-muted text-center">{t('demoData')}</div>
      </Body>
    </Screen>
  );
}

/* ---------- Historique ---------- */
export function History() {
  const nav = useNavigate();
  const s = useApp();
  const [q, setQ] = useState('');
  const [dir, setDir] = useState<'all' | 'in' | 'out'>('all');

  const list = useMemo(() => {
    let l = sortedTxns(s.mode === 'wallet' ? null : 'a1', s);
    if (dir !== 'all') l = l.filter((x) => x.direction === (dir === 'in' ? 'CREDIT' : 'DEBIT'));
    if (q) {
      const n = q.toLowerCase();
      l = l.filter((x) => x.label.toLowerCase().includes(n) || x.reference.toLowerCase().includes(n));
    }
    return l;
  }, [s, q, dir]);

  return (
    <Screen>
      <Head noBack title={t('history')} sub={`${list.length}`} />
      <div className="shrink-0 sticky top-[64px] z-20 bg-surface border-b border-[var(--line)] px-[18px] py-3 flex flex-col gap-2.5">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"><Ic.Search /></span>
          <input className="input pl-9" placeholder={t('searchPh')} value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="flex gap-2">
          {(['all', 'in', 'out'] as const).map((k) => (
            <button key={k} className={`chip ${dir === k ? 'chip-on' : ''}`} onClick={() => setDir(k)}>{t(k)}</button>
          ))}
        </div>
      </div>
      <div className="flex-1 pb-[18px]">
        <GroupedOps list={list} onPick={(id) => nav(`/app/txn/${id}`)} />
      </div>
    </Screen>
  );
}

/* ---------- Détail d'une opération ---------- */
export function TxnDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const s = useApp();
  const x = s.txns.find((v) => v.id === id);
  if (!x) return <Screen><Head title={t('opDetail')} /></Screen>;
  const credit = x.direction === 'CREDIT';
  const acc = s.accounts.find((a) => a.id === x.accountId);

  return (
    <Screen>
      <Head title={t('opDetail')} sub={x.reference} />
      <Body>
        <div className="card px-4 py-4 text-center">
          <div className="eyebrow">{credit ? t('credited') : t('debited')}</div>
          <div className={`amt text-[30px] my-2.5 ${credit ? 'text-ok' : ''}`}>
            {credit ? '+' : '\u2212'}{fmt(x.amount + x.fee)}<span className="cur">FCFA</span>
          </div>
          <StatusBadge st={x.status} />
        </div>

        {x.status === 'FAILED' && (
          <div className="flex items-center gap-3 rounded-[18px] px-4 py-4 bg-[rgba(169,50,38,.09)] text-danger">
            <Ic.X s={22} />
            <div>
              <div className="font-semibold text-sm">{t('failed')}</div>
              <div className="text-[11.5px] opacity-80 mt-0.5">
                {t(x.failureReason as 'overSingle')} — {t('limitIs')} {money(effectiveLimits(s).single)}
              </div>
            </div>
          </div>
        )}
        {x.status === 'QUEUED' && <div className="sim-note">{t('queuedD')}</div>}

        <div className="card px-4 py-2">
          <KV k={t('reference')} v={x.reference} mono />
          <KV k={credit ? t('sender') : t('beneficiary')} v={x.counterparty.name} />
          {x.counterparty.identifier && <KV k={t('number')} v={x.counterparty.identifier} mono />}
          {acc && <KV k={t('from')} v={t(acc.label)} />}
          <KV k={t('createdAt')} v={dateFull(x.createdAt)} />
          {x.settledAt && <KV k={t('settledAt')} v={dateFull(x.settledAt)} />}
          {x.fee > 0 && <KV k={t('fees')} v={money(x.fee)} />}
          <KV k={t('channel')} v={x.channel} mono />
        </div>

        {x.status === 'SETTLED' && (
          <button className="btn btn-ghost" onClick={() => nav(`/receipt/${x.id}`)}><Ic.Receipt s={18} /> {t('viewReceipt')}</button>
        )}
      </Body>
    </Screen>
  );
}

/* ---------- Bénéficiaires ---------- */
export function Beneficiaries() {
  const nav = useNavigate();
  const s = useApp();
  const list = [...s.benefs].sort((a, b) => Number(b.fav) - Number(a.fav));
  const hue = (str: string) => { let h = 0; for (const ch of str) h = (h * 31 + ch.charCodeAt(0)) % 360; return h; };

  return (
    <Screen>
      <Head noBack title={t('benef')} sub={`${list.length}`}
        right={<button className="w-9 h-9 rounded-[11px] grid place-items-center bg-surface-2"
          onClick={() => toast(s.lang === 'fr' ? 'Ajout de bénéficiaire — périmètre v1' : 'Add payee — v1 scope')}><Ic.Plus /></button>} />
      <Body className="!p-0">
        {list.length ? (
          <div className="card m-[18px]">
            {list.map((b) => (
              <button key={b.id} className="opt" onClick={() => nav(`/transfer/form/${b.kind}`, { state: { benef: b } })}>
                <span className="w-10 h-10 rounded-full grid place-items-center display text-sm font-semibold text-white shrink-0"
                  style={{ background: `hsl(${hue(b.name)} 42% 38%)` }}>{b.name[0]}</span>
                <span className="flex-1 min-w-0">
                  <span className="flex items-center gap-1.5 text-sm font-medium truncate">
                    {b.name}{b.fav && <span className="text-queued"><Ic.Star /></span>}
                  </span>
                  <span className="block text-[11.5px] text-muted mt-0.5 truncate">{b.number}</span>
                </span>
                <Ic.Chev />
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 px-6 text-muted">
            <div className="opacity-30 flex justify-center mb-3"><Ic.Users /></div>
            <div className="text-sm font-medium text-ink">{t('noBenef')}</div>
            <div className="text-[12.5px] mt-1">{t('noBenefD')}</div>
          </div>
        )}
      </Body>
    </Screen>
  );
}

/* ---------- Notifications ---------- */
export function Notifications() {
  const s = useApp();
  useMemo(() => { markNotifsRead(); }, []);
  return (
    <Screen>
      <Head title={t('notifications')} />
      <Body className="!p-0">
        {s.notifs.length ? (
          <div className="card m-[18px]">
            {s.notifs.map((n) => (
              <div key={n.id} className="relative flex items-center gap-3 px-4 py-3 bg-surface border-b border-[var(--line)] last:border-0">
                {n.kind === 'queued' && <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-queued" />}
                <span className={`w-[38px] h-[38px] rounded-xl grid place-items-center shrink-0
                  ${n.kind === 'credit' ? 'bg-[rgba(30,138,107,.11)] text-ok' : n.kind === 'queued' ? 'bg-[rgba(200,107,60,.12)] text-queued' : 'bg-brand-soft text-brand'}`}>
                  {n.kind === 'credit' ? <Ic.Down s={18} /> : n.kind === 'queued' ? <Ic.Clock s={18} /> : <Ic.Up s={18} />}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-[13.5px] font-medium truncate">{n.title}</span>
                  <span className="block text-[11px] text-muted mt-0.5">{n.body} · {hm(n.at)}</span>
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 px-6 text-muted">
            <div className="opacity-30 flex justify-center mb-3"><Ic.Bell /></div>
            <div className="text-sm font-medium text-ink">{t('noNotif')}</div>
          </div>
        )}
      </Body>
    </Screen>
  );
}

/* ---------- Réglages ---------- */
export function Settings() {
  const nav = useNavigate();
  const s = useApp();
  const bank = currentBank(s);
  return (
    <Screen>
      <Head noBack title={t('settings')} />
      <Body className="!p-0 gap-0">
        <div className="card m-[18px]">
          <div className="opt">
            <span className="w-10 h-10 rounded-xl bg-brand-soft text-brand grid place-items-center shrink-0"><Ic.Globe /></span>
            <span className="flex-1 text-sm font-medium">{t('language')}</span>
            <div className="flex gap-2">
              {(['fr', 'en'] as const).map((l) => (
                <button key={l} className={`chip ${s.lang === l ? 'chip-on' : ''}`} onClick={() => setState({ lang: l })}>{l.toUpperCase()}</button>
              ))}
            </div>
          </div>
          <button className="opt" onClick={() => setState({ dataSaver: !s.dataSaver })}>
            <span className="w-10 h-10 rounded-xl bg-brand-soft text-brand grid place-items-center shrink-0"><Ic.WifiOff /></span>
            <span className="flex-1">
              <span className="block text-sm font-medium">{t('dataSaver')}</span>
              <span className="block text-[11.5px] text-muted mt-0.5">{t('dataSaverD')}</span>
            </span>
            <span className={`switch ${s.dataSaver ? 'switch-on' : ''}`} />
          </button>
          <div className="opt">
            <span className="w-10 h-10 rounded-xl bg-brand-soft text-brand grid place-items-center shrink-0"><Ic.Finger /></span>
            <span className="flex-1 text-sm font-medium">{t('biometricS')}</span>
            <span className="switch switch-on" />
          </div>
        </div>

        <div className="card mx-[18px]">
          <button className="opt" onClick={() => nav('/verify')}>
            <span className="w-10 h-10 rounded-xl bg-brand-soft text-brand grid place-items-center shrink-0"><Ic.Scan /></span>
            <span className="flex-1 text-sm font-medium">{t('verifyReceipt')}</span>
            <Ic.Chev />
          </button>
          <button className="opt" onClick={() => { resetDemo(); nav('/', { replace: true }); }}>
            <span className="w-10 h-10 rounded-xl bg-brand-soft text-brand grid place-items-center shrink-0"><Ic.Reset /></span>
            <span className="flex-1 text-sm font-medium">{t('reset')}</span>
            <Ic.Chev />
          </button>
        </div>

        <div className="card mx-[18px] mt-3.5 px-4 py-2">
          <KV k={t('appInfo')} v={bank.appName || bank.bankName} />
          <KV k={t('version')} v="0.1 — démonstration" mono />
        </div>

        <div className="px-[18px] py-5">
          <button className="btn btn-ghost" onClick={() => { setState({ authed: false }); nav('/welcome', { replace: true }); }}>{t('logout')}</button>
        </div>
      </Body>
    </Screen>
  );
}
