import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Screen, Body, FooterCta } from '../ui/shell';
import { Head, AmountField, SimNote, TierPill } from '../ui/bits';
import { Ic } from '../ui/icons';
import { t } from '../i18n';
import { fmt, money } from '../core/money';
import { TIER_LIMITS } from '../core/config';
import { available, currentBank, linkBankAccount, toast, topUp, useApp } from '../state/store';

/* ---------- Alimentation du wallet ---------- */
export function TopUp() {
  const nav = useNavigate();
  const s = useApp();
  const [src, setSrc] = useState<'mtn' | 'om' | 'bank'>('mtn');
  const [amount, setAmount] = useState(0);
  const bankAcc = s.accounts.find((a) => a.type !== 'wallet');

  const sources = [
    { id: 'mtn' as const, tag: 'MTN', bg: '#FFC107', color: '#3E2723', label: t('topupMtn'), sub: s.profile.phone },
    { id: 'om' as const, tag: 'OM', bg: '#F57C00', color: '#fff', label: t('topupOm'), sub: s.profile.phone },
    ...(bankAcc ? [{ id: 'bank' as const, tag: '', bg: 'var(--brand)', color: '#fff', label: t('topupBank'), sub: money(available(bankAcc)) }] : []),
  ];

  return (
    <Screen>
      <Head title={t('topupT')} sub={t('topupD')} />
      <Body>
        <div className="flex flex-col gap-2">
          <label className="text-[11.5px] text-muted font-medium">{t('topupSrc')}</label>
          {sources.map((o) => (
            <button key={o.id} onClick={() => setSrc(o.id)}
              className={`flex items-center gap-3 px-[15px] py-3.5 w-full text-left bg-surface rounded-[18px] border transition-colors
                ${src === o.id ? 'border-brand bg-brand-soft' : 'border-[var(--line-strong)]'}`}>
              <span className="w-9 h-9 rounded-full grid place-items-center shrink-0 mono text-[10px] font-medium"
                style={{ background: o.bg, color: o.color }}>{o.tag || <Ic.Bank s={18} />}</span>
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-medium">{o.label}</span>
                <span className="block text-[11.5px] text-muted mt-0.5 truncate">{o.sub}</span>
              </span>
            </button>
          ))}
        </div>

        <AmountField value={amount} onChange={setAmount} />
        <div className="flex gap-2 flex-wrap">
          {[5000, 10000, 25000, 50000].map((v) => (
            <button key={v} className="chip" onClick={() => setAmount(v)}>{fmt(v)}</button>
          ))}
        </div>
        <SimNote>{t('topupNote')}</SimNote>
      </Body>
      <FooterCta>
        <button className="btn" disabled={amount <= 0} onClick={() => {
          if (src === 'bank') {
            if (!bankAcc || available(bankAcc) < amount) { toast(t('insufficient')); return; }
            topUp(amount, t('myBank'), bankAcc.id);
          } else {
            topUp(amount, src === 'mtn' ? t('topupMtn') : t('topupOm'));
          }
          toast(t('topupOk'), 'ok');
          nav('/app/home', { replace: true });
        }}>{t('topupGo')}</button>
      </FooterCta>
    </Screen>
  );
}

/* ---------- Rattachement ---------- */
export function LinkBank() {
  const nav = useNavigate();
  return (
    <Screen>
      <Head title={t('linkTitle')} />
      <Body>
        <div className="text-[13px] text-muted leading-relaxed">{t('linkD')}</div>
        <div className="card">
          {[
            { icon: <Ic.Bank />, title: t('linkHave'), desc: t('linkHaveD') },
            { icon: <Ic.Plus />, title: t('linkNew'), desc: t('linkNewD') },
          ].map((o) => (
            <button key={o.title} className="opt" onClick={() => nav('/kyc')}>
              <span className="w-10 h-10 rounded-xl bg-brand-soft text-brand grid place-items-center shrink-0">{o.icon}</span>
              <span className="flex-1">
                <span className="block text-sm font-medium">{o.title}</span>
                <span className="block text-[11.5px] text-muted mt-0.5">{o.desc}</span>
              </span>
              <Ic.Chev />
            </button>
          ))}
        </div>
        <SimNote>{t('linkNote')}</SimNote>
      </Body>
    </Screen>
  );
}

/* ---------- Vérification d'identité ---------- */
export function Kyc() {
  const nav = useNavigate();
  const [done, setDone] = useState<Set<number>>(new Set());
  const [checking, setChecking] = useState(false);
  const shots = [t('kycFront'), t('kycBack'), t('kycSelfie')];

  return (
    <Screen>
      <Head title={t('kycTitle')} />
      <Body>
        <div className="text-[13px] text-muted leading-relaxed">{t('kycD')}</div>
        {shots.map((lb, i) => (
          <div key={lb}>
            <div className="eyebrow mb-1.5">{lb}</div>
            <button onClick={() => setDone((d) => new Set(d).add(i))}
              className={`relative w-full grid place-items-center bg-[#10201D] overflow-hidden
                ${i === 2 ? 'aspect-square rounded-full w-[62%] mx-auto' : 'aspect-[1.58] rounded-[18px]'}`}>
              {done.has(i)
                ? <span className="text-ok anim-pop"><Ic.Check s={30} /></span>
                : <>
                  <span className={`absolute border-2 border-dashed border-white/40 ${i === 2 ? 'inset-[9%] rounded-full' : 'inset-[12%] rounded-[10px]'}`} />
                  <span className="text-white/40"><Ic.Scan /></span>
                </>}
            </button>
          </div>
        ))}
        <SimNote>{t('kycSim')}</SimNote>
      </Body>
      <FooterCta>
        <button className="btn" disabled={done.size < 3 || checking} onClick={() => {
          setChecking(true);
          setTimeout(() => { linkBankAccount(); nav('/link-done', { replace: true }); }, 1500);
        }}>{checking ? t('kycChecking') : t('linkGo')}</button>
      </FooterCta>
    </Screen>
  );
}

export function LinkDone() {
  const nav = useNavigate();
  const s = useApp();
  return (
    <Screen>
      <div className="flex-1 flex flex-col items-center justify-center text-center px-[26px] py-[34px]">
        <div className="w-[92px] h-[92px] rounded-full grid place-items-center mb-5 bg-[rgba(30,138,107,.12)] text-ok anim-pop"><Ic.Check /></div>
        <h2 className="display text-[21px] font-semibold">{t('linkOk')}</h2>
        <p className="text-[13.5px] text-muted leading-relaxed mt-2 max-w-[280px]">{t('linkOkD')}</p>
        <div className="mt-5"><TierPill>{TIER_LIMITS[3].label[s.lang]}</TierPill></div>
        <div className="mono text-[11px] text-muted mt-2.5">{t('tierLimitL')} : {money(currentBank(s).limits.single)}</div>
      </div>
      <FooterCta>
        <button className="btn" onClick={() => nav('/app/home', { replace: true })}>{t('skipTo')}</button>
      </FooterCta>
    </Screen>
  );
}
