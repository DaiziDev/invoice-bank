import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Screen, Body } from '../ui/shell';
import { Head, KV, SimNote, dateFull } from '../ui/bits';
import { Ic } from '../ui/icons';
import { t } from '../i18n';
import { money } from '../core/money';
import { qrMatrix } from '../core/qr';
import { receiptPayload, verifyReceipt } from '../core/sign';
import { currentBank, toast, useApp } from '../state/store';

function QrCanvas({ text, size = 128 }: { text: string; size?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const m = qrMatrix(text);
    const n = m.length, quiet = 3, scale = 4;
    const px = (n + quiet * 2) * scale;
    cv.width = px; cv.height = px;
    const g = cv.getContext('2d');
    if (!g) return;
    g.fillStyle = '#FCFBF8'; g.fillRect(0, 0, px, px);
    g.fillStyle = '#10201D';
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) if (m[r][c]) g.fillRect((c + quiet) * scale, (r + quiet) * scale, scale, scale);
    }
  }, [text]);
  return <canvas ref={ref} style={{ width: size, height: size, imageRendering: 'pixelated' }} />;
}

export function Receipt() {
  const { id } = useParams();
  const nav = useNavigate();
  const s = useApp();
  const bank = currentBank(s);
  const x = s.txns.find((v) => v.id === id);
  if (!x) return <Screen><Head title={t('receipt')} /></Screen>;
  const acc = s.accounts.find((a) => a.id === x.accountId);
  const payload = receiptPayload(bank.bankId, x.reference, x.amount, x.createdAt);

  const share = async () => {
    const txt = `${bank.bankName} — ${t('proof')}\n${money(x.amount + x.fee)}\n${x.reference}\n${dateFull(x.settledAt ?? x.createdAt)}`;
    if (navigator.share) { try { await navigator.share({ text: txt }); return; } catch { /* annulé */ } }
    toast(s.lang === 'fr' ? 'Reçu prêt à partager' : 'Receipt ready to share');
  };

  return (
    <Screen>
      <Head title={t('receipt')} sub={x.reference}
        right={<button className="w-9 h-9 rounded-[11px] grid place-items-center bg-surface-2" onClick={share}><Ic.Share /></button>} />
      <Body className="!px-[22px] !py-[26px]">
        <div className="receipt anim-rise">
          <div className="cachet">{t('authentic')}</div>
          <div className="text-center pb-4 border-b border-dashed border-[var(--line-strong)]">
            <div className="display text-[15px] font-semibold">{bank.bankName}</div>
            <div className="mono text-[9px] tracking-[.18em] uppercase text-muted mt-1.5">{t('proof')}</div>
          </div>
          <div className="amt text-[27px] text-center my-4">{money(x.amount + x.fee)}</div>
          <div className="my-4">
            <KV k={t('reference')} v={x.reference} mono />
            <KV k={t('date')} v={dateFull(x.settledAt ?? x.createdAt)} />
            <KV k={t('sender')} v={`${s.profile.first} ${s.profile.last[0]}. · ${acc?.number ?? ''}`} />
            <KV k={t('beneficiary')} v={x.counterparty.name} />
            {x.counterparty.identifier && <KV k={t('number')} v={x.counterparty.identifier} mono />}
            {x.fee > 0 && <KV k={t('fees')} v={money(x.fee)} />}
            <KV k={t('status')} v={t('settled')} />
          </div>
          <div className="text-center pt-4 border-t border-dashed border-[var(--line-strong)]">
            <QrCanvas text={payload} />
            <div className="mono text-[8.5px] tracking-[.1em] uppercase text-muted mt-2">{t('qrCap')}</div>
          </div>
        </div>
        <button className="btn btn-ghost mt-5" onClick={() => nav('/verify', { state: { prefill: payload } })}>
          <Ic.Scan s={18} /> {t('verifyReceipt')}
        </button>
      </Body>
    </Screen>
  );
}

export function Verify() {
  const loc = useLocation() as { state?: { prefill?: string } };
  const s = useApp();
  const bank = currentBank(s);
  const [payload, setPayload] = useState(loc.state?.prefill ?? '');
  const [result, setResult] = useState<{ ok: boolean; reference?: string; amount?: number } | null>(null);

  const run = (v = payload) => setResult(verifyReceipt(v, bank.bankId));

  return (
    <Screen>
      <Head title={t('verifyReceipt')} />
      <Body>
        <div className="relative aspect-square rounded-[26px] bg-[#10201D] grid place-items-center overflow-hidden">
          <div className="relative w-[62%] aspect-square rounded-2xl border-2 border-white/50"
            style={{ boxShadow: '0 0 0 2000px rgba(6,18,15,.55)' }}>
            <div className="absolute left-[6%] right-[6%] h-0.5 animate-[laser_2.1s_var(--ease)_infinite]"
              style={{ background: 'linear-gradient(90deg,transparent,var(--color-queued),transparent)' }} />
          </div>
          <div className="absolute bottom-4 inset-x-0 text-center text-[11px] text-white/60">{t('scanning')}</div>
        </div>

        <button className="btn" onClick={() => {
          const settled = s.txns.filter((x) => x.status === 'SETTLED');
          if (!settled.length) return;
          const x = settled[Math.floor(Math.random() * settled.length)];
          const p = receiptPayload(bank.bankId, x.reference, x.amount, x.createdAt);
          setPayload(p);
          setTimeout(() => run(p), 420);
        }}><Ic.Scan s={18} /> {t('simulateScan')}</button>

        <label className="flex flex-col gap-1.5">
          <span className="text-[11.5px] text-muted font-medium">{t('orPaste')}</span>
          <input className="input mono text-[11.5px]" value={payload} placeholder="KTB|TRX-…|25000|…|A1B2C3D4"
            onChange={(e) => setPayload(e.target.value)} />
        </label>
        <button className="btn btn-ghost" onClick={() => run()}>{t('check')}</button>

        {result && (
          <div className={`flex gap-3 items-center rounded-[18px] px-4 py-4 ${result.ok ? 'bg-[rgba(30,138,107,.1)] text-[#14684F]' : 'bg-[rgba(169,50,38,.09)] text-danger'}`}>
            {result.ok ? <Ic.Check s={24} /> : <Ic.X s={24} />}
            <div>
              <div className="font-semibold text-sm">{result.ok ? t('valid') : t('invalid')}</div>
              <div className="text-[11.5px] opacity-80 mt-0.5">
                {result.ok ? `${t('validD')} ${bank.bankName} · ${result.reference} · ${money(result.amount ?? 0)}` : t('invalidD')}
              </div>
            </div>
          </div>
        )}

        <SimNote>{s.lang === 'fr'
          ? "La caméra est simulée dans cette démonstration. La signature est de démonstration : en production, elle est cryptographique et la clé est détenue par la banque."
          : 'The camera is simulated here. The signature is demo-grade: in production it is cryptographic and the key is held by the bank.'}</SimNote>
      </Body>
    </Screen>
  );
}
