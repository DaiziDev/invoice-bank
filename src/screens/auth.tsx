import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Screen, Body, FooterCta } from '../ui/shell';
import { Head, PhotoBg, Keypad, PinDots, OtpInput, SimNote, TierPill } from '../ui/bits';
import { Ic } from '../ui/icons';
import { t } from '../i18n';
import { TIER_LIMITS } from '../core/config';
import { money } from '../core/money';
import { currentBank, loadExistingCustomer, setState, startWalletAccount, toast, useApp } from '../state/store';

/* ---------- Accueil de l'application bancaire ---------- */
export function Welcome() {
  const nav = useNavigate();
  const s = useApp();
  const c = currentBank(s);
  return (
    <Screen className="!bg-transparent">
      <div className="relative flex-1 flex flex-col justify-end overflow-hidden" style={{ background: 'var(--brand)' }}>
        <div className="absolute inset-x-0 top-0 bottom-[38%] overflow-hidden">
          <PhotoBg slot="welcome" scene />
          <div className="scrim" />
        </div>

        <div className="absolute top-[26px] left-[22px] right-[22px] z-30 flex items-center gap-2.5 text-white anim-rise">
          <span className="w-[38px] h-[38px] rounded-xl shrink-0 grid place-items-center display text-[17px] font-bold
            bg-white/15 border border-white/30 backdrop-blur">{c.initials}</span>
          <span>
            <span className="block display text-[15px] font-semibold">{c.bankName}</span>
            <span className="block mono text-[9px] tracking-[.13em] uppercase opacity-60 mt-px">{c.tagline[s.lang]}</span>
          </span>
        </div>

        <div className="absolute left-[22px] right-[22px] bottom-[calc(38%+26px)] z-30 text-white anim-rise" style={{ animationDelay: '.12s' }}>
          <h1 className="display text-[29px] leading-[1.12] font-semibold drop-shadow-lg"
            dangerouslySetInnerHTML={{ __html: t('wcClaim') }} />
          <p className="text-[13.5px] leading-relaxed opacity-80 mt-2.5 max-w-[290px]">{t('wcSub')}</p>
        </div>

        <div className="relative z-40 bg-surface rounded-t-[26px] px-[22px] pt-[22px] anim-sheet
          shadow-[0_-14px_40px_-16px_rgba(6,18,15,.5)]"
          style={{ paddingBottom: 'calc(20px + env(safe-area-inset-bottom))' }}>
          <span className="block w-[34px] h-1 rounded bg-[var(--line-strong)] mx-auto -mt-1.5 mb-4" />
          <div className="grid grid-cols-3 gap-1.5 mb-4">
            {[[<Ic.Lock key="l" s={17} />, t('trust1')], [<Ic.WifiOff key="w" s={17} />, t('trust2')], [<Ic.Swap key="s" s={17} />, t('trust3')]]
              .map(([icon, label], i) => (
                <div key={i} className="flex flex-col items-center gap-1.5 mono text-[8.5px] tracking-[.07em] uppercase text-muted text-center leading-tight">
                  <span className="text-brand">{icon}</span>
                  <span dangerouslySetInnerHTML={{ __html: label as string }} />
                </div>
              ))}
          </div>
          <button className="btn" onClick={() => { setState({ mode: 'wallet', tier: 1 }); nav('/register/phone'); }}>
            {t('wcRegister')}
          </button>
          <button className="block w-full text-center py-3.5 text-[13.5px] font-medium text-brand"
            onClick={() => { loadExistingCustomer(); setState({ authed: false }); nav('/login'); }}>
            {t('already')} <b className="underline underline-offset-[3px]">{t('signin')}</b>
          </button>
        </div>
      </div>
    </Screen>
  );
}

/* ---------- Connexion ---------- */
export function Login() {
  const nav = useNavigate();
  const s = useApp();
  const c = currentBank(s);
  const [pin, setPin] = useState('');
  const [err, setErr] = useState('');
  const [shake, setShake] = useState(false);
  const [tries, setTries] = useState(0);
  const [lockLeft, setLockLeft] = useState(0);

  useEffect(() => {
    if (lockLeft <= 0) return;
    const id = setTimeout(() => setLockLeft((n) => n - 1), 1000);
    return () => clearTimeout(id);
  }, [lockLeft]);
  useEffect(() => {
    if (lockLeft === 0 && tries >= 3) { setTries(0); setErr(''); }
  }, [lockLeft, tries]);

  const open = () => { setState({ authed: true }); nav('/app/home', { replace: true }); };

  const submit = (v: string) => {
    // 111111 déclenche volontairement l'erreur : montre le verrouillage si on nous pose la question.
    if (v === '111111') {
      const nt = tries + 1;
      setTries(nt); setShake(true);
      setErr(nt >= 3 ? '' : t('pinWrong'));
      if (nt >= 3) setLockLeft(60);
      setTimeout(() => { setShake(false); setPin(''); }, 430);
      return;
    }
    open();
  };

  const onKey = (k: string) => {
    if (lockLeft > 0) return;
    if (k === 'bio') return open();
    if (k === 'del') return setPin((p) => p.slice(0, -1));
    if (pin.length >= 6) return;
    const next = pin + k;
    setPin(next);
    if (next.length === 6) setTimeout(() => submit(next), 190);
  };

  const greet = (() => {
    const h = new Date().getHours();
    if (s.lang === 'fr') return h < 12 ? 'Bonjour' : h < 18 ? 'Bon après-midi' : 'Bonsoir';
    return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
  })();
  const masked = s.profile.phone.replace(/(\+237\s?\d)\s?\d{2}\s?\d{2}/, '$1 •• ••');

  return (
    <Screen className="!bg-transparent">
      <div className="relative flex-1 flex flex-col justify-end overflow-hidden" style={{ background: 'var(--brand)' }}>
        <div className="absolute inset-x-0 top-0 bottom-[52%] overflow-hidden">
          <PhotoBg slot="login" />
          <div className="scrim" />
        </div>

        <div className="absolute top-[30px] left-[22px] right-[22px] z-30 text-white anim-rise">
          <div className="eyebrow eyebrow-light">{c.bankName}</div>
          <h1 className="display text-2xl font-semibold mt-1.5">{greet}, {s.profile.first}</h1>
          <div className="mono text-[12.5px] opacity-70 mt-1">{masked}</div>
        </div>

        <div className="relative z-40 bg-surface rounded-t-[26px] px-[22px] pt-5 flex flex-col items-center gap-3.5 anim-sheet
          shadow-[0_-14px_40px_-16px_rgba(6,18,15,.5)]"
          style={{ paddingBottom: 'calc(16px + env(safe-area-inset-bottom))' }}>
          <span className="block w-[34px] h-1 rounded bg-[var(--line-strong)] -mt-1" />
          <div className="text-[12.5px] text-muted">{t('enterPin')}</div>
          <PinDots n={pin.length} dark shake={shake} />
          <div className="text-[12.5px] text-danger h-4 text-center">
            {lockLeft > 0 ? `${t('locked')} ${lockLeft}s` : err}
          </div>
          <Keypad onKey={onKey} light bio />
          <div className="flex gap-[18px] justify-center text-[12.5px] pt-1">
            <button className="text-muted" onClick={() => toast(s.lang === 'fr'
              ? 'Récupération : numéro → code → nouveau code. Sans boucle.'
              : 'Recovery: number → code → new PIN. No dead end.')}>{t('forgot')}</button>
            <button className="text-brand font-medium" onClick={() => nav('/welcome')}>{t('switchAcct')}</button>
          </div>
        </div>
      </div>
    </Screen>
  );
}

/* ---------- Inscription ---------- */
const Steps = ({ n }: { n: number }) => (
  <div className="flex gap-1.5">
    {[1, 2, 3, 4].map((i) => (
      <i key={i} className={`h-[3px] flex-1 rounded ${i <= n ? 'bg-brand' : 'bg-[var(--line-strong)]'}`} />
    ))}
  </div>
);

const draft = { phone: '', first: '', last: '' };

export function RegPhone() {
  const nav = useNavigate();
  const [ph, setPh] = useState('');
  const [ok, setOk] = useState(false);
  const digits = ph.replace(/\D/g, '');
  return (
    <Screen>
      <Head title={t('regTitle')} sub={`${t('cfgStep')} 1 / 4`} />
      <Body>
        <Steps n={1} />
        <div className="flex flex-col gap-1.5 mt-2">
          <label className="text-[11.5px] text-muted font-medium">{t('regPhone')}</label>
          <div className="flex gap-2">
            <div className="input w-20 text-center mono grid place-items-center text-muted">+237</div>
            <input className="input flex-1" inputMode="numeric" placeholder={t('regPhonePh')} value={ph}
              onChange={(e) => {
                const d = e.target.value.replace(/\D/g, '').slice(0, 9);
                setPh(d.replace(/(\d)(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5').trim());
              }} />
          </div>
          <div className="text-[11px] text-muted">{t('regPhoneD')}</div>
        </div>
        <button className="opt rounded-xl border border-[var(--line)]" onClick={() => setOk(!ok)}>
          <span className={`switch ${ok ? 'switch-on' : ''}`} />
          <span className="flex-1 text-[13px] font-medium">{t('regTerms')}</span>
        </button>
      </Body>
      <FooterCta>
        <button className="btn" disabled={digits.length < 9 || !ok}
          onClick={() => { draft.phone = '+237 ' + ph; nav('/register/otp'); }}>{t('continue')}</button>
      </FooterCta>
    </Screen>
  );
}

export function RegOtp() {
  const nav = useNavigate();
  const [code] = useState(() => String(Math.floor(100000 + Math.random() * 900000)));
  const [shake, setShake] = useState(0);
  return (
    <Screen>
      <Head title={t('regOtp')} sub={`${t('cfgStep')} 2 / 4`} />
      <Body className="gap-[18px]">
        <Steps n={2} />
        <div className="text-[13px] text-muted text-center">
          {t('regOtpD')}<br /><b className="text-ink">{draft.phone}</b>
        </div>
        <OtpInput shake={!!shake} onComplete={(v) => {
          if (v === code) nav('/register/name');
          else setShake((n) => n + 1);
        }} />
        <SimNote>{t('otpSim')}<b className="block mono text-[15px] tracking-[.18em] mt-1 text-queued">{code.split('').join(' ')}</b></SimNote>
      </Body>
    </Screen>
  );
}

export function RegName() {
  const nav = useNavigate();
  const [f, setF] = useState('');
  const [l, setL] = useState('');
  return (
    <Screen>
      <Head title={t('regName')} sub={`${t('cfgStep')} 3 / 4`} />
      <Body>
        <Steps n={3} />
        <label className="flex flex-col gap-1.5"><span className="text-[11.5px] text-muted font-medium">{t('regFirst')}</span>
          <input className="input" value={f} onChange={(e) => setF(e.target.value)} /></label>
        <label className="flex flex-col gap-1.5"><span className="text-[11.5px] text-muted font-medium">{t('regLast')}</span>
          <input className="input" value={l} onChange={(e) => setL(e.target.value)} /></label>
        <SimNote>{t('regTierNote')}</SimNote>
      </Body>
      <FooterCta>
        <button className="btn" disabled={!f.trim() || !l.trim()}
          onClick={() => { draft.first = f.trim(); draft.last = l.trim(); nav('/register/pin'); }}>{t('continue')}</button>
      </FooterCta>
    </Screen>
  );
}

export function RegPin() {
  const nav = useNavigate();
  const [first, setFirst] = useState('');
  const [v, setV] = useState('');
  const [err, setErr] = useState('');
  const [shake, setShake] = useState(false);

  const onKey = (k: string) => {
    if (k === 'del') return setV((p) => p.slice(0, -1));
    if (k === 'bio' || v.length >= 6) return;
    const next = v + k;
    setV(next);
    if (next.length < 6) return;
    setTimeout(() => {
      if (!first) { setFirst(next); setV(''); setErr(''); return; }
      if (next !== first) {
        setShake(true); setErr(t('regPinNo'));
        setTimeout(() => { setShake(false); setV(''); setFirst(''); }, 460);
        return;
      }
      startWalletAccount({ first: draft.first, last: draft.last, phone: draft.phone });
      nav('/register/done', { replace: true });
    }, 200);
  };

  return (
    <Screen>
      <Head title={t('regPin')} sub={`${t('cfgStep')} 4 / 4`} />
      <Body className="gap-[18px] items-center">
        <Steps n={4} />
        <div className="text-[13px] text-muted text-center">{first ? t('regPinAgain') : t('regPinD')}</div>
        <PinDots n={v.length} dark shake={shake} />
        <div className="text-[12.5px] text-danger h-4 text-center">{err}</div>
        <Keypad onKey={onKey} light />
      </Body>
    </Screen>
  );
}

export function RegDone() {
  const nav = useNavigate();
  const L = TIER_LIMITS[1];
  const s = useApp();
  return (
    <Screen>
      <div className="flex-1 flex flex-col items-center justify-center text-center px-[26px] py-[34px]">
        <div className="w-[92px] h-[92px] rounded-full grid place-items-center mb-5 bg-[rgba(30,138,107,.12)] text-ok anim-pop">
          <Ic.Check />
        </div>
        <h2 className="display text-[21px] font-semibold">{t('regDone')}</h2>
        <p className="text-[13.5px] text-muted leading-relaxed mt-2 max-w-[280px]">{t('regDoneD')}</p>
        <div className="mt-5"><TierPill>{L.label[s.lang]}</TierPill></div>
        <div className="mono text-[11px] text-muted mt-2.5">{t('tierLimitL')} : {money(L.single)}</div>
      </div>
      <FooterCta>
        <button className="btn" onClick={() => nav('/topup')}><Ic.Down s={18} /> {t('topupT')}</button>
        <button className="btn btn-ghost" onClick={() => nav('/app/home', { replace: true })}>{t('skipTo')}</button>
      </FooterCta>
    </Screen>
  );
}
