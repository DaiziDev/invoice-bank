import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Screen, Body } from '../ui/shell';
import { Head, AppIcon, SimNote } from '../ui/bits';
import { Ic } from '../ui/icons';
import { t } from '../i18n';
import { BANKS, STUDIO_CODE } from '../core/config';
import { loadExistingCustomer, resetDemo, setNet, setState, useApp } from '../state/store';
import type { NetState } from '../core/types';

const GATE_KEY = 'invoice-bank-studio';

/**
 * Mode présentateur.
 * Volontairement hors du parcours visible : aucun bouton n'y mène depuis
 * l'application. On y accède par l'URL #/studio et un code. Un banquier
 * qui tombe dessus par hasard ne verra pas « couper le réseau ».
 */
export function Studio() {
  const nav = useNavigate();
  const s = useApp();
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem(GATE_KEY) === '1');
  const [code, setCode] = useState('');
  const [bad, setBad] = useState(false);
  const [canInstall, setCanInstall] = useState(false);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    const h = () => setCanInstall(true);
    window.addEventListener('pwa-installable', h);
    return () => window.removeEventListener('pwa-installable', h);
  }, []);

  if (!unlocked) {
    return (
      <Screen>
        <Head title={t('studioTitle')} />
        <Body className="items-center justify-center">
          <div className="w-full max-w-[280px] flex flex-col gap-3">
            <label className="text-[11.5px] text-muted font-medium">{t('studioCode')}</label>
            <input className={`input text-center mono text-xl tracking-[.4em] ${bad ? 'border-danger' : ''}`}
              inputMode="numeric" value={code} autoFocus
              onChange={(e) => { setCode(e.target.value); setBad(false); }} />
            {bad && <div className="text-[12.5px] text-danger text-center">{t('studioBad')}</div>}
            <button className="btn" onClick={() => {
              if (code === STUDIO_CODE) { sessionStorage.setItem(GATE_KEY, '1'); setUnlocked(true); }
              else setBad(true);
            }}>{t('studioEnter')}</button>
          </div>
        </Body>
      </Screen>
    );
  }

  const nets: [NetState, string][] = [['on', t('netOn')], ['weak', t('netWeak')], ['off', t('netOff')]];
  const jumps: [string, string][] = [
    ['/', t('jumpPlatform')], ['/springboard', t('jumpSpring')],
    ['/welcome', t('jumpWelcome')], ['dash', t('jumpDash')],
  ];

  return (
    <Screen>
      {flash && <div className="fixed inset-0 z-[999] bg-black" />}
      <Head title={t('studioTitle')} sub={s.lang === 'fr' ? 'Visible par vous seul' : 'Visible to you only'} />
      <Body>
        <div className="flex flex-col gap-2">
          <div className="eyebrow">{t('studioNet')}</div>
          <div className="grid grid-cols-3 gap-1.5 bg-surface-2 p-1 rounded-xl">
            {nets.map(([v, lb]) => (
              <button key={v} onClick={() => setNet(v)}
                className={`py-2.5 rounded-[9px] text-[11.5px] font-medium transition-all
                  ${s.net === v ? `bg-surface shadow-sm ${v === 'off' ? 'text-queued' : 'text-ink'}` : 'text-muted'}`}>
                {lb}
              </button>
            ))}
          </div>
          <div className="text-[11.5px] text-muted leading-relaxed">
            {s.lang === 'fr'
              ? "Coupez le réseau devant eux, puis faites un virement. C'est le moment qui vend."
              : 'Cut the network in front of them, then make a transfer. That is the moment that sells.'}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="eyebrow">{t('studioPower')}</div>
          <button className="btn btn-copper" onClick={() => {
            setFlash(true);
            setTimeout(() => window.location.reload(), 700);
          }}><Ic.Power s={18} /> {t('studioKill')}</button>
          <div className="text-[11.5px] text-muted leading-relaxed">{t('studioPowerD')}</div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="eyebrow">{t('studioBank')}</div>
          {(['kota', 'sahel', 'ccm', 'custom'] as const).map((k) => {
            const b = k === 'custom' ? s.custom : BANKS[k];
            return (
              <button key={k} onClick={() => setState({ bankKey: k })}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border w-full text-left transition-colors
                  ${s.bankKey === k ? 'border-brand bg-brand-soft' : 'border-[var(--line)]'}`}>
                <AppIcon initials={b.initials} colors={b.colors} size={30} />
                <span className="min-w-0">
                  <span className="block text-[12.5px] font-medium truncate">{b.bankName}</span>
                  <span className="block text-[10.5px] text-muted truncate">
                    {b.features.interbank ? b.appName : `${b.appName} — interbancaire désactivé`}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-col gap-2">
          <div className="eyebrow">{t('studioFlow')}</div>
          <div className="grid grid-cols-2 gap-2">
            {jumps.map(([to, lb]) => (
              <button key={to} className="btn btn-ghost btn-sm !w-full" onClick={() => {
                if (to === 'dash') { loadExistingCustomer(); nav('/app/home'); }
                else nav(to);
              }}>{lb}</button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="eyebrow">{t('studioTools')}</div>
          <div className="flex gap-2">
            <button className="btn btn-ghost btn-sm flex-1" onClick={() => setState({ lang: s.lang === 'fr' ? 'en' : 'fr' })}>
              {s.lang.toUpperCase()}
            </button>
            <button className="btn btn-ghost btn-sm flex-[2]" onClick={() => { resetDemo(); nav('/'); }}>
              <Ic.Reset /> {t('reset')}
            </button>
          </div>
          {canInstall && (
            <button className="btn btn-ghost btn-sm !w-full" onClick={() => window.dispatchEvent(new Event('pwa-install'))}>
              {t('install')}
            </button>
          )}
          <div className="text-[11px] text-muted">{t('installIos')}</div>
        </div>

        <SimNote>
          {s.lang === 'fr'
            ? "Le cœur simulé remplace le core banking : en production, seul l'adaptateur change, pas l'application. Données entièrement fictives."
            : 'The simulated core replaces the banking core: in production only the adapter changes, not the app. Fully fictional data.'}
        </SimNote>

        <button className="btn btn-ghost" onClick={() => { sessionStorage.removeItem(GATE_KEY); nav('/app/home'); }}>
          {t('studioExit')}
        </button>
      </Body>
    </Screen>
  );
}
