import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Screen, Body, FooterCta } from '../ui/shell';
import { Head, AppIcon } from '../ui/bits';
import { Ic } from '../ui/icons';
import { t } from '../i18n';
import { PALETTES, PLATFORM, suggestNames, PHOTOS, asset } from '../core/config';
import { currentBank, loadExistingCustomer, setState, useApp } from '../state/store';
import type { BankProfile } from '../core/types';

/* ---------- Accueil de la plateforme ---------- */
export function PlatformHome() {
  const nav = useNavigate();
  const s = useApp();
  return (
    <Screen className="!bg-transparent">
      <div className="relative flex-1 flex flex-col justify-between px-[26px] pt-[34px] text-white overflow-hidden"
        style={{ background: 'linear-gradient(163deg,#0B1F1B 0%,#123830 48%,#0B1F1B 100%)', paddingBottom: 'calc(26px + env(safe-area-inset-bottom))' }}>
        {PHOTOS.platform && <div className="photo opacity-30" style={{ backgroundImage: `url('${asset(PHOTOS.platform)}')` }} />}
        <span className="absolute -top-[70px] -right-20 w-[230px] h-[230px] rounded-full blur-[46px] opacity-50 bg-[#1E8A6B] animate-[float1_13s_ease-in-out_infinite]" />
        <span className="absolute bottom-10 -left-[70px] w-[180px] h-[180px] rounded-full blur-[46px] opacity-50 bg-[#C86B3C] animate-[float2_16s_ease-in-out_infinite]" />

        <div className="relative z-10 flex items-center gap-2.5 anim-rise">
          <span className="w-[30px] h-[30px] rounded-[9px] grid place-items-center display font-bold text-[15px]"
            style={{ background: 'linear-gradient(135deg,#1E8A6B,#0E5C46)' }}>{PLATFORM.name[0]}</span>
          <span className="display text-[15px] font-semibold">{PLATFORM.name}</span>
        </div>

        <div className="relative z-10">
          <h1 className="display text-[34px] leading-[1.1] font-semibold anim-rise" style={{ animationDelay: '.1s' }}>
            {PLATFORM.claim[s.lang]}
          </h1>
          <p className="text-sm leading-relaxed opacity-70 mt-3.5 max-w-[300px] anim-rise" style={{ animationDelay: '.2s' }}>
            {PLATFORM.sub[s.lang]}
          </p>
          <div className="flex flex-wrap gap-2 mt-5 anim-rise" style={{ animationDelay: '.3s' }}>
            {PLATFORM.pills.map((p) => (
              <span key={p} className="mono text-[9.5px] tracking-[.1em] uppercase px-[11px] py-1.5 rounded-full border border-white/20 bg-white/5">{p}</span>
            ))}
          </div>
        </div>

        <div className="relative z-10 flex flex-col gap-2.5 anim-rise" style={{ animationDelay: '.4s' }}>
          <button className="btn !bg-white !text-[#0B1F1B] font-semibold" onClick={() => nav('/configurator')}>{t('pfStart')}</button>
          <button className="btn !bg-white/[.07] !text-white border border-white/20"
            onClick={() => { setState({ bankKey: 'kota' }); loadExistingCustomer(); setState({ authed: false }); nav('/welcome'); }}>
            {t('pfDemo')}
          </button>
        </div>
      </div>
    </Screen>
  );
}

/* ---------- Configurateur ---------- */
export function Configurator() {
  const nav = useNavigate();
  const s = useApp();
  const [c, setC] = useState<BankProfile>(() => structuredClone(s.custom));
  const [initTouched, setInitTouched] = useState(false);
  const suggestions = useMemo(() => suggestNames(c.bankName), [c.bankName]);

  const patch = (p: Partial<BankProfile>) => setC((prev) => ({ ...prev, ...p }));

  return (
    <Screen>
      <Head title={t('cfgTitle')} sub={`${t('cfgStep')} 1 / 2`} />
      <Body>
        <div className="flex items-center gap-4 p-4 card">
          <AppIcon initials={c.initials} colors={c.colors} />
          <div className="min-w-0">
            <div className="eyebrow">{t('cfgPreview')}</div>
            <div className="text-[14.5px] font-semibold mt-1.5 truncate">{c.appName}</div>
            <div className="text-[11.5px] text-muted mt-0.5 truncate">{c.bankName}</div>
          </div>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-[11.5px] text-muted font-medium">{t('cfgBankName')}</span>
          <input className="input" value={c.bankName} placeholder={t('cfgBankPh')}
            onChange={(e) => {
              const bankName = e.target.value || 'Ma Banque';
              patch({
                bankName,
                initials: initTouched ? c.initials : (bankName.trim()[0] || 'M').toUpperCase(),
                bankId: bankName.replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase() || 'CUS',
              });
            }} />
        </label>

        <div className="flex flex-col gap-1.5">
          <label className="text-[11.5px] text-muted font-medium">{t('cfgAppName')}</label>
          <input className="input" value={c.appName} onChange={(e) => patch({ appName: e.target.value })} />
          <div className="eyebrow mt-1">{t('cfgSuggest')}</div>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((n) => (
              <button key={n} className={`chip ${c.appName === n ? 'chip-on' : ''}`} onClick={() => patch({ appName: n })}>{n}</button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[11.5px] text-muted font-medium">{t('cfgLogo')}</label>
          <input className="input w-20 text-center display text-[19px] font-bold" maxLength={2} value={c.initials}
            onChange={(e) => { setInitTouched(true); patch({ initials: (e.target.value || 'M').toUpperCase() }); }} />
          <div className="text-[11px] text-muted">{t('cfgLogoD')}</div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[11.5px] text-muted font-medium">{t('cfgPalette')}</label>
          <div className="grid grid-cols-6 gap-2">
            {PALETTES.map((p) => (
              <button key={p.id} title={p.nm} onClick={() => patch({ colors: { brand: p.brand, brand2: p.brand2, soft: p.soft } })}
                className={`aspect-square rounded-xl border-2 transition-transform ${c.colors.brand === p.brand ? 'border-ink scale-105' : 'border-transparent'}`}
                style={{ background: `linear-gradient(140deg,${p.brand},${p.brand2})` }} />
            ))}
          </div>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-[11.5px] text-muted font-medium">{t('cfgTagline')}</span>
          <input className="input" value={c.tagline[s.lang]}
            onChange={(e) => patch({ tagline: { ...c.tagline, [s.lang]: e.target.value } })} />
        </label>

        <div className="flex flex-col gap-1.5">
          <label className="text-[11.5px] text-muted font-medium">{t('cfgModules')}</label>
          <div className="card">
            {([['phone', t('modPhone')], ['wallet', t('modWallet')], ['interbank', t('modInterbank')]] as const).map(([k, lb]) => (
              <button key={k} className="opt" onClick={() => patch({ features: { ...c.features, [k]: !c.features[k] } })}>
                <span className="flex-1 text-sm font-medium">{lb}</span>
                <span className={`switch ${c.features[k] ? 'switch-on' : ''}`} />
              </button>
            ))}
          </div>
        </div>
      </Body>
      <FooterCta>
        <button className="btn" onClick={() => { setState({ custom: c, bankKey: 'custom' }); nav('/building'); }}>
          {t('cfgBuild')}
        </button>
      </FooterCta>
    </Screen>
  );
}

/* ---------- Construction ---------- */
export function Building() {
  const nav = useNavigate();
  const [i, setI] = useState(0);
  const steps = [t('bld1'), t('bld2'), t('bld3'), t('bld4'), t('bld5')];

  useEffect(() => {
    if (i >= steps.length) { const id = setTimeout(() => nav('/springboard'), 620); return () => clearTimeout(id); }
    const id = setTimeout(() => setI((n) => n + 1), i === 0 ? 340 : 520);
    return () => clearTimeout(id);
  }, [i, nav, steps.length]);

  const pct = (i / steps.length) * 251;
  return (
    <Screen>
      <div className="flex-1 flex flex-col items-center justify-center text-center px-[30px] py-[34px]">
        <div className="w-[92px] h-[92px] mb-[26px]">
          <svg width="92" height="92" viewBox="0 0 92 92" className="-rotate-90">
            <circle cx="46" cy="46" r="40" fill="none" stroke="var(--line)" strokeWidth="6" />
            <circle cx="46" cy="46" r="40" fill="none" stroke="var(--brand)" strokeWidth="6" strokeLinecap="round"
              strokeDasharray="251" strokeDashoffset={251 - pct} style={{ transition: 'stroke-dashoffset .5s var(--ease)' }} />
          </svg>
        </div>
        <h2 className="display text-[19px] font-semibold">{i >= steps.length ? t('bldDone') : t('bldTitle')}</h2>
        <div className="w-full max-w-[280px] flex flex-col gap-[11px] mt-4">
          {steps.map((st, k) => (
            <div key={st} className={`flex items-center gap-2.5 text-[12.5px] transition-opacity
              ${k < i ? 'opacity-100 text-ink' : 'opacity-35 text-muted'}`}>
              <span className={`w-[18px] h-[18px] rounded-full border-[1.5px] grid place-items-center shrink-0 transition-colors
                ${k < i ? 'bg-ok border-ok text-white' : 'border-[var(--line-strong)]'}`}>
                <Ic.Check s={12} />
              </span>
              <span>{st}</span>
            </div>
          ))}
        </div>
      </div>
    </Screen>
  );
}

/* ---------- Écran d'accueil du téléphone ---------- */
const SB_APPS = [
  { nm: 'Téléphone', bg: '#2E7D32', d: <path d="M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3 19.5 19.5 0 01-6-6 19.8 19.8 0 01-3.1-8.7A2 2 0 014.1 2h3a2 2 0 012 1.7c.1 1 .4 1.9.7 2.8a2 2 0 01-.5 2.1L8.1 9.9a16 16 0 006 6l1.3-1.2a2 2 0 012.1-.5c.9.3 1.8.6 2.8.7a2 2 0 011.7 2z" /> },
  { nm: 'Messages', bg: '#1565C0', d: <path d="M21 11.5a8.4 8.4 0 01-9 8.5 9 9 0 01-4-1L3 21l2-5a8.4 8.4 0 01-1-4 8.4 8.4 0 018.5-9 8.4 8.4 0 018.5 8.5z" /> },
  { nm: 'Photo', bg: '#455A64', d: <><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" /><circle cx="12" cy="13" r="4" /></> },
  { nm: 'MoMo', bg: '#FFC107', dark: true, d: <><rect x="2" y="6" width="20" height="13" rx="2" /><path d="M2 11h20" /></> },
  { nm: 'Orange Money', bg: '#F57C00', d: <><circle cx="12" cy="12" r="9" /><path d="M12 7v10" /><path d="M9 10h6" /><path d="M9 14h6" /></> },
  { nm: 'Navigateur', bg: '#0277BD', d: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18" /><path d="M12 3a15 15 0 010 18 15 15 0 010-18z" /></> },
  { nm: 'Horloge', bg: '#37474F', d: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></> },
  { nm: 'Réglages', bg: '#546E7A', d: <><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" /></> },
];

const SbIcon = ({ a }: { a: typeof SB_APPS[number] }) => (
  <div className="flex flex-col items-center gap-[7px]">
    <span className="relative w-14 h-14 rounded-[15px] grid place-items-center overflow-hidden shadow-[0_5px_14px_-6px_rgba(0,0,0,.6)]"
      style={{ background: a.bg, color: a.dark ? '#3E2723' : '#fff' }}>
      <span className="absolute inset-0" style={{ background: 'linear-gradient(150deg,rgba(255,255,255,.2),transparent 58%)' }} />
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"
        strokeLinecap="round" strokeLinejoin="round" className="relative">{a.d}</svg>
    </span>
    <span className="text-[10.5px] text-white/90 text-center drop-shadow">{a.nm}</span>
  </div>
);

export function Springboard() {
  const nav = useNavigate();
  const s = useApp();
  const c = currentBank(s);
  return (
    <Screen className="!bg-transparent">
      <div className="flex-1 flex flex-col justify-between px-5 pt-[22px]"
        style={{
          background: 'radial-gradient(120% 80% at 50% 0%, var(--brand-2) 0%, var(--brand) 45%, #08110F 100%)',
          paddingBottom: 'calc(20px + env(safe-area-inset-bottom))',
        }}>
        <div className="grid grid-cols-4 gap-x-3.5 gap-y-5">
          {SB_APPS.slice(0, 4).map((a) => <SbIcon key={a.nm} a={a} />)}
          <button onClick={() => nav('/welcome')}
            className="flex flex-col items-center gap-[7px] animate-[install_.7s_var(--ease-out)_.35s_both]">
            <span className="animate-[glow_1.7s_ease-out_1s_2] rounded-[15px]">
              <AppIcon initials={c.initials} colors={c.colors} size={56} />
            </span>
            <span className="text-[10.5px] text-white/90 text-center drop-shadow">{c.appName || c.bankName}</span>
          </button>
          {SB_APPS.slice(4, 7).map((a) => <SbIcon key={a.nm} a={a} />)}
        </div>

        <div className="flex flex-col items-center gap-2 text-center text-xs text-white/75 anim-rise" style={{ animationDelay: '1s' }}>
          <span>{t('sbHint')}</span>
          <span className="animate-[bob_1.5s_ease-in-out_infinite]"><Ic.Down s={22} /></span>
        </div>

        <div className="grid grid-cols-4 gap-3.5 rounded-[22px] px-2.5 py-[11px] bg-white/10 backdrop-blur">
          {[...SB_APPS.slice(0, 3), SB_APPS[7]].map((a) => <SbIcon key={'d' + a.nm} a={a} />)}
        </div>
      </div>
    </Screen>
  );
}
