import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Screen, Body, FooterCta } from '../ui/shell';
import { Head, AmountField, KV, OtpInput, SimNote, dateFull } from '../ui/bits';
import { Ic } from '../ui/icons';
import { t } from '../i18n';
import { fmt, money } from '../core/money';
import { ussdCode } from '../core/ledger';
import {
  available, currentBank, feeFor, submitTransfer, toast, useApp, validateTransfer,
} from '../state/store';
import type { Beneficiary, TransferKind, TransferRequest } from '../core/types';

let draft: TransferRequest | null = null;

/* ---------- Choix du type ---------- */
export function TransferType() {
  const nav = useNavigate();
  const s = useApp();
  const f = currentBank(s).features;
  const rows: [TransferKind, React.ReactNode, string, string, boolean][] = [
    ['own', <Ic.Swap key="1" />, t('ownAccounts'), t('ownAccountsD'), s.accounts.length > 1],
    ['internal', <Ic.Bank key="2" />, t('internal'), t('internalD'), f.interbank],
    ['phone', <Ic.Phone key="3" />, t('phone'), t('phoneD'), f.phone],
    ['wallet', <Ic.Wallet key="4" />, t('walletT'), t('walletTD'), f.wallet],
  ];
  return (
    <Screen>
      <Head title={t('transfer')} sub={t('chooseType')} />
      <Body className="!p-0">
        <div className="card m-[18px]">
          {rows.map(([kind, icon, title, desc, on]) => (
            <button key={kind} className="opt" disabled={!on} onClick={() => nav(`/transfer/form/${kind}`)}>
              <span className="w-10 h-10 rounded-xl bg-brand-soft text-brand grid place-items-center shrink-0">{icon}</span>
              <span className="flex-1">
                <span className="block text-sm font-medium">{title}</span>
                <span className="block text-[11.5px] text-muted mt-0.5">{on ? desc : t('unavailable')}</span>
              </span>
              <Ic.Chev />
            </button>
          ))}
        </div>
        <div className="px-[18px]"><SimNote>{t('modulesNote')}</SimNote></div>
      </Body>
    </Screen>
  );
}

/* ---------- Saisie ---------- */
export function TransferForm() {
  const nav = useNavigate();
  const loc = useLocation() as { state?: { benef?: Beneficiary } };
  const { kind = 'internal' } = useParams<{ kind: TransferKind }>();
  const s = useApp();

  const [src, setSrc] = useState(s.accounts[0]?.id ?? '');
  const [dst, setDst] = useState(s.accounts[1]?.id ?? '');
  const [toName, setToName] = useState(loc.state?.benef?.name ?? '');
  const [toNumber, setToNumber] = useState(loc.state?.benef?.number ?? '');
  const [amount, setAmount] = useState(0);
  const [label, setLabel] = useState('');

  const k = kind as TransferKind;
  const fee = feeFor(currentBank(s), k);
  const acc = s.accounts.find((a) => a.id === src);
  const benefs = s.benefs.filter((b) => (k === 'wallet' ? b.kind === 'wallet' : k === 'phone' ? b.kind === 'phone' : b.kind === 'internal'));

  const check = useMemo(() => {
    if (!amount || !acc) return null;
    return validateTransfer({ kind: k, accountId: src, amount, toName, toNumber });
  }, [amount, acc, k, src, toName, toNumber]);

  const bad = check && !check.ok;
  const hint = !amount || !acc
    ? <>{t('available')} : <b>{money(acc ? available(acc) : 0)}</b></>
    : bad
      ? <>{t(check.reason)}{check.limit ? ` — ${t('limitIs')} ${money(check.limit)}` : ''}</>
      : fee ? <>{t('fees')} : {money(fee)} · {t('totalDebit')} {money(amount + fee)}</>
        : <>{t('available')} : <b>{money(available(acc))}</b></>;

  const ready = amount > 0 && !bad && (k === 'own' ? !!dst : !!toName.trim());

  return (
    <Screen>
      <Head title={t('transfer')} sub={{ own: t('ownAccounts'), internal: t('internal'), phone: t('phone'), wallet: t('walletT') }[k]} />
      <Body>
        <label className="flex flex-col gap-1.5">
          <span className="text-[11.5px] text-muted font-medium">{t('from')}</span>
          <select className="input" value={src} onChange={(e) => setSrc(e.target.value)}>
            {s.accounts.map((a) => <option key={a.id} value={a.id}>{t(a.label)} — {money(available(a))}</option>)}
          </select>
        </label>

        {k === 'own' ? (
          <label className="flex flex-col gap-1.5">
            <span className="text-[11.5px] text-muted font-medium">{t('to')}</span>
            <select className="input" value={dst} onChange={(e) => setDst(e.target.value)}>
              {s.accounts.filter((a) => a.id !== src).map((a) => <option key={a.id} value={a.id}>{t(a.label)}</option>)}
            </select>
          </label>
        ) : (
          <>
            <label className="flex flex-col gap-1.5">
              <span className="text-[11.5px] text-muted font-medium">{t('to')}</span>
              <input className="input" placeholder={t('pick')} value={toName} onChange={(e) => setToName(e.target.value)} />
            </label>
            {benefs.length > 0 && (
              <div className="flex gap-2 overflow-x-auto no-sb -mx-[18px] px-[18px] py-0.5">
                {benefs.map((b) => (
                  <button key={b.id} onClick={() => { setToName(b.name); setToNumber(b.number); }}
                    className={`chip shrink-0 flex items-center gap-2 ${toName === b.name ? 'chip-on' : ''}`}>
                    <span className="w-[22px] h-[22px] rounded-full grid place-items-center text-[10px] text-white bg-brand">{b.name[0]}</span>
                    {b.name.split(' ')[0]}
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        <AmountField value={amount} onChange={setAmount} hint={hint} error={!!bad} />
        <div className="flex gap-2 flex-wrap">
          {[10000, 25000, 50000, 100000].map((v) => (
            <button key={v} className="chip" onClick={() => setAmount(v)}>{fmt(v)}</button>
          ))}
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-[11.5px] text-muted font-medium">{t('label')}</span>
          <input className="input" placeholder={t('labelPh')} value={label} onChange={(e) => setLabel(e.target.value)} />
        </label>
      </Body>
      <FooterCta>
        <button className="btn" disabled={!ready} onClick={() => {
          const dstAcc = s.accounts.find((a) => a.id === dst);
          draft = {
            kind: k, accountId: src, amount,
            toName: k === 'own' && dstAcc ? t(dstAcc.label) : toName,
            toNumber: k === 'own' && dstAcc ? dstAcc.number : toNumber,
            toAccountId: k === 'own' ? dst : null,
            label: label || null,
          };
          nav('/transfer/recap');
        }}>{t('continue')}</button>
      </FooterCta>
    </Screen>
  );
}

/* ---------- Récapitulatif ---------- */
export function TransferRecap() {
  const nav = useNavigate();
  const s = useApp();
  useEffect(() => { if (!draft) nav('/app/home', { replace: true }); }, [nav]);
  if (!draft) return null;
  const d = draft;
  const fee = feeFor(currentBank(s), d.kind);
  const acc = s.accounts.find((a) => a.id === d.accountId);

  return (
    <Screen>
      <Head title={t('recap')} />
      <Body>
        <div className="card px-4 py-4 text-center">
          <div className="eyebrow">{t('amount')}</div>
          <div className="amt text-[33px] mt-2">{fmt(d.amount)}<span className="cur">FCFA</span></div>
        </div>
        <div className="card px-4 py-2">
          <KV k={t('from')} v={<>{acc && t(acc.label)}<br /><span className="mono text-[11px] text-muted">{acc?.number}</span></>} />
          <KV k={t('to')} v={<>{d.toName}{d.toNumber && <><br /><span className="mono text-[11px] text-muted">{d.toNumber}</span></>}</>} />
          {d.label && <KV k={t('label')} v={d.label} />}
          <KV k={t('date')} v={dateFull(new Date().toISOString())} />
          <KV k={t('fees')} v={fee ? money(fee) : '—'} />
          <div className="kv border-t-[1.5px] border-b-0 border-[var(--line-strong)] mt-1 pt-3.5 text-[15px]">
            <span className="font-medium">{t('totalDebit')}</span>
            <span className="amt">{money(d.amount + fee)}</span>
          </div>
        </div>
        {s.net === 'off' && <div className="sim-note">{t('offBody')}</div>}
      </Body>
      <FooterCta>
        <button className="btn" onClick={() => nav('/transfer/otp')}>{t('confirm')}</button>
      </FooterCta>
    </Screen>
  );
}

/* ---------- OTP ---------- */
export function TransferOtp() {
  const nav = useNavigate();
  const [code] = useState(() => String(Math.floor(100000 + Math.random() * 900000)));
  const [left, setLeft] = useState(60);
  const [shake, setShake] = useState(0);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (left <= 0) { setMsg(t('otpExpired')); return; }
    const id = setTimeout(() => setLeft((n) => n - 1), 1000);
    return () => clearTimeout(id);
  }, [left]);

  return (
    <Screen>
      <Head title={t('otpTitle')} sub={t('otpSub')} />
      <Body className="gap-5">
        <OtpInput shake={!!shake} onComplete={(v) => {
          if (left <= 0) { setShake((n) => n + 1); return; }
          if (v !== code) { setShake((n) => n + 1); setMsg(t('otpWrong')); return; }
          if (!draft) { nav('/app/home', { replace: true }); return; }
          const tx = submitTransfer(draft);
          draft = null;
          nav(`/transfer/result/${tx.id}`, { replace: true });
        }} />
        <div className="text-center text-xs text-muted">{msg || `${t('expiresIn')} ${left}s`}</div>
        <SimNote>{t('otpSim')}<b className="block mono text-[15px] tracking-[.18em] mt-1 text-queued">{code.split('').join(' ')}</b></SimNote>
      </Body>
    </Screen>
  );
}

/* ---------- Résultat ---------- */
export function TransferResult() {
  const { id } = useParams();
  const nav = useNavigate();
  const s = useApp();
  const x = s.txns.find((v) => v.id === id);
  if (!x) return <Screen><Head title={t('done')} /></Screen>;

  const queued = x.status === 'QUEUED';
  const failed = x.status === 'FAILED';
  const tone = failed ? 'bg-[rgba(169,50,38,.10)] text-danger' : queued ? 'bg-[rgba(200,107,60,.13)] text-queued' : 'bg-[rgba(30,138,107,.12)] text-ok';

  return (
    <Screen>
      <div className="flex-1 flex flex-col items-center justify-center text-center px-[26px] py-[34px]">
        <div className={`w-[92px] h-[92px] rounded-full grid place-items-center mb-5 anim-pop ${tone}`}>
          {failed ? <Ic.X /> : queued ? <Ic.Clock /> : <Ic.Check />}
        </div>
        <h2 className="display text-[21px] font-semibold">{failed ? t('failed') : queued ? t('queued') : t('done')}</h2>
        <div className="amt text-[31px] mt-3.5">{money(x.amount + x.fee)}</div>
        <div className="mono text-[11px] text-muted mt-1">{x.reference}</div>
        <p className="text-[13.5px] text-muted leading-relaxed mt-2 max-w-[280px]">
          {failed ? t('overSingle') : queued ? t('queuedD') : t('doneD')}
        </p>
        {queued && (
          <>
            <button className="btn btn-copper btn-sm mt-[18px]" onClick={() => {
              const code = ussdCode(x);
              toast(`USSD ${code}`, 'copper');
              try { window.location.href = 'tel:' + encodeURIComponent(code); } catch { /* composeur indisponible */ }
            }}><Ic.Phone s={18} /> {t('sendUssd')}</button>
            <div className="mono text-[11px] text-muted mt-2">{t('ussdNote')}</div>
          </>
        )}
      </div>
      <FooterCta>
        {x.status === 'SETTLED' && (
          <button className="btn" onClick={() => nav(`/receipt/${x.id}`)}><Ic.Receipt s={18} /> {t('viewReceipt')}</button>
        )}
        <button className="btn btn-ghost" onClick={() => nav('/app/home', { replace: true })}>{t('backHome')}</button>
      </FooterCta>
    </Screen>
  );
}
