import { useEffect, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Ic } from "./icons";
import { t, type TKey } from "../i18n";
import { fmt, money, pad2 } from "../core/money";
import type { Transaction, TxStatus } from "../core/types";
import { getState } from "../state/store";
import { PHOTOS, asset } from "../core/config";

/* ---------- Dates ---------- */
export function dayLabel(iso: string): string {
  const d = new Date(iso),
    n = new Date();
  const same = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  if (same(d, n)) return t("today");
  const y = new Date(n);
  y.setDate(y.getDate() - 1);
  if (same(d, y)) return t("yesterday");
  return d.toLocaleDateString(getState().lang === "fr" ? "fr-FR" : "en-GB", {
    day: "numeric",
    month: "long",
  });
}
export const hm = (iso: string) => {
  const d = new Date(iso);
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
};
export const dateFull = (iso: string) => {
  const d = new Date(iso);
  return (
    d.toLocaleDateString(getState().lang === "fr" ? "fr-FR" : "en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }) +
    " · " +
    hm(iso)
  );
};

/* ---------- En-tête ---------- */
export function Head({
  title,
  sub,
  right,
  noBack,
}: {
  title: string;
  sub?: string;
  right?: ReactNode;
  noBack?: boolean;
}) {
  const nav = useNavigate();
  return (
    <div className="shrink-0 flex items-center gap-3 px-[18px] py-3.5 bg-surface border-b border-[var(--line)] sticky top-0 z-20">
      {!noBack && (
        <button
          onClick={() => nav(-1)}
          aria-label="Retour"
          className="w-9 h-9 rounded-[11px] grid place-items-center bg-surface-2 shrink-0 active:bg-[var(--line)]"
        >
          <Ic.Back />
        </button>
      )}
      <div className="min-w-0">
        <h2 className="display text-[17px] font-semibold truncate">{title}</h2>
        {sub && <div className="text-[11.5px] text-muted truncate">{sub}</div>}
      </div>
      <div className="flex-1" />
      {right}
    </div>
  );
}

/* ---------- Badge de statut ---------- */
const BADGE: Record<TxStatus, [string, TKey]> = {
  SETTLED: ["bg-[rgba(30,138,107,.12)] text-[#14684F]", "settled"],
  QUEUED: ["bg-[rgba(200,107,60,.13)] text-[#9E4E24]", "queuedS"],
  FAILED: ["bg-[rgba(169,50,38,.10)] text-danger", "failedS"],
  SENT: ["bg-brand-soft text-brand", "sent"],
  PENDING: ["bg-brand-soft text-brand", "sent"],
  DRAFT: ["", "sent"],
};
export const StatusBadge = ({ st }: { st: TxStatus }) => {
  const [cls, key] = BADGE[st];
  return (
    <span className={`badge ${cls}`}>
      <i
        className={
          st === "QUEUED" ? "animate-[blip_1.4s_ease-in-out_infinite]" : ""
        }
      />
      {t(key)}
    </span>
  );
};

/* ---------- Ligne d'opération ---------- */
export function OpRow({
  x,
  onClick,
}: {
  x: Transaction;
  onClick?: () => void;
}) {
  const credit = x.direction === "CREDIT";
  const icBg =
    x.status === "QUEUED"
      ? "bg-[rgba(200,107,60,.12)] text-queued"
      : x.status === "FAILED"
        ? "bg-[rgba(169,50,38,.10)] text-danger"
        : credit
          ? "bg-[rgba(30,138,107,.11)] text-ok"
          : "bg-brand-soft text-brand";
  return (
    <button
      onClick={onClick}
      className="relative flex items-center gap-3 px-4 py-3 bg-surface w-full text-left border-b border-[var(--line)] last:border-0 active:bg-surface-2"
    >
      {x.status === "QUEUED" && (
        <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-queued" />
      )}
      <span
        className={`w-[38px] h-[38px] rounded-xl grid place-items-center shrink-0 ${icBg}`}
      >
        {x.status === "QUEUED" ? (
          <Ic.Clock s={18} />
        ) : x.status === "FAILED" ? (
          <Ic.X s={18} />
        ) : credit ? (
          <Ic.Down s={18} />
        ) : (
          <Ic.Up s={18} />
        )}
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-[13.5px] font-medium truncate">
          {x.label}
        </span>
        <span className="flex items-center gap-1.5 text-[11px] text-muted mt-0.5">
          {hm(x.createdAt)}
          {x.status !== "SETTLED" && (
            <>
              <span>·</span>
              <StatusBadge st={x.status} />
            </>
          )}
        </span>
      </span>
      <span
        className={`amt text-[13.5px] whitespace-nowrap ${credit ? "text-ok" : ""} ${x.status === "FAILED" ? "opacity-50" : ""}`}
      >
        {credit ? "+" : "\u2212"}
        {money(x.amount + x.fee, false)}
      </span>
    </button>
  );
}

export function GroupedOps({
  list,
  onPick,
}: {
  list: Transaction[];
  onPick: (id: string) => void;
}) {
  if (!list.length) {
    return (
      <div className="text-center py-12 px-6 text-muted">
        <div className="opacity-30 flex justify-center mb-3">
          <Ic.List />
        </div>
        <div className="text-sm font-medium text-ink">{t("noOps")}</div>
        <div className="text-[12.5px] mt-1">{t("noOpsD")}</div>
      </div>
    );
  }
  const groups: { day: string; items: Transaction[] }[] = [];
  for (const x of list) {
    const d = dayLabel(x.createdAt);
    const last = groups[groups.length - 1];
    if (last && last.day === d) last.items.push(x);
    else groups.push({ day: d, items: [x] });
  }
  return (
    <>
      {groups.map((g) => (
        <div key={g.day}>
          <div className="mono text-[9.5px] tracking-[.13em] uppercase text-muted px-4 pt-3.5 pb-2 bg-bg">
            {g.day}
          </div>
          <div className="card mx-0 rounded-none border-x-0">
            {g.items.map((x) => (
              <OpRow key={x.id} x={x} onClick={() => onPick(x.id)} />
            ))}
          </div>
        </div>
      ))}
    </>
  );
}

/* ---------- Divers ---------- */
export const KV = ({
  k,
  v,
  mono,
}: {
  k: string;
  v: ReactNode;
  mono?: boolean;
}) => (
  <div className="kv">
    <span className="text-muted shrink-0">{k}</span>
    <span
      className={`text-right font-medium break-words ${mono ? "mono text-[11.5px] tracking-[.02em]" : ""}`}
    >
      {v}
    </span>
  </div>
);

export const SimNote = ({ children }: { children: ReactNode }) => (
  <div className="sim-note">
    <span className="shrink-0 mt-px">
      <Ic.Info />
    </span>
    <div>{children}</div>
  </div>
);

export const TierPill = ({ children }: { children: ReactNode }) => (
  <span className="inline-flex items-center gap-1.5 px-2.5 py-[5px] rounded-full bg-brand-soft text-brand mono text-[9.5px] tracking-[.08em] uppercase">
    {children}
  </span>
);

export function QueueTray() {
  const n = getState().outbox.length;
  if (!n) return null;
  return (
    <div className="anim-rise flex items-center gap-3 rounded-[18px] px-[15px] py-[13px] bg-[#2A1B12] text-[#F6E4D8]">
      <span className="w-[26px] h-[26px] rounded-full bg-queued text-white grid place-items-center text-xs font-semibold shrink-0">
        {n}
      </span>
      <span className="flex-1 text-xs leading-snug">
        <b>
          {n} {t("queueTray")}
        </b>
        <br />
        {t("queueTrayD")}
      </span>
    </div>
  );
}

/* ---------- Fond photo + repli dessiné ---------- */
export function BankScene() {
  return (
    <svg
      className="absolute inset-x-0 bottom-0 w-full h-[66%] opacity-90"
      viewBox="0 0 390 300"
      preserveAspectRatio="xMidYMax slice"
      aria-hidden
    >
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#000" stopOpacity="0" />
          <stop offset="100%" stopColor="#000" stopOpacity=".34" />
        </linearGradient>
      </defs>
      <g opacity=".30" fill="#fff">
        <rect x="18" y="150" width="46" height="150" rx="2" />
        <rect x="72" y="184" width="34" height="116" rx="2" />
        <rect x="286" y="166" width="40" height="134" rx="2" />
        <rect x="334" y="196" width="38" height="104" rx="2" />
      </g>
      <g opacity=".17" fill="#000">
        {Array.from({ length: 30 }, (_, i) => (
          <rect
            key={i}
            x={22 + (i % 6) * 8}
            y={158 + Math.floor(i / 6) * 15}
            width="5"
            height="9"
            rx="1"
          />
        ))}
      </g>
      <g fill="#fff" opacity=".62">
        <path d="M195 96 L268 138 L122 138 Z" />
        <rect x="120" y="138" width="150" height="9" rx="2" />
        {[132, 158, 184, 210, 236].map((x) => (
          <rect key={x} x={x} y="152" width="15" height="98" rx="2" />
        ))}
        <rect x="118" y="250" width="154" height="11" rx="2" />
        <rect x="108" y="261" width="174" height="12" rx="2" />
        <rect x="98" y="273" width="194" height="27" rx="2" />
      </g>
      <rect width="390" height="300" fill="url(#sky)" />
    </svg>
  );
}

export function PhotoBg({
  slot,
  scene,
}: {
  slot: keyof typeof PHOTOS;
  scene?: boolean;
}) {
  const src = PHOTOS[slot];
  if (src)
    return (
      <div
        className="photo"
        style={{ backgroundImage: `url('${asset(src)}')` }}
      />
    );
  return (
    <div className="photo photo-fallback">
      <div className="mesh" />
      {scene && <BankScene />}
    </div>
  );
}

/* ---------- Saisies ---------- */
export function AmountField({
  value,
  onChange,
  hint,
  error,
}: {
  value: number;
  onChange: (n: number) => void;
  hint?: ReactNode;
  error?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11.5px] text-muted font-medium">
        {t("amount")}
      </label>
      <div className="flex items-baseline gap-2 bg-surface border border-[var(--line-strong)] rounded-[18px] p-4">
        <input
          inputMode="numeric"
          placeholder="0"
          value={value ? fmt(value) : ""}
          onChange={(e) =>
            onChange(parseInt(e.target.value.replace(/\D/g, ""), 10) || 0)
          }
          className="flex-1 min-w-0 bg-transparent outline-none text-[30px] font-semibold tracking-[-.02em] amt"
        />
        <span className="mono text-[13px] text-muted">FCFA</span>
      </div>
      {hint && (
        <div className={`text-[11px] ${error ? "text-danger" : "text-muted"}`}>
          {hint}
        </div>
      )}
    </div>
  );
}

export function Keypad({
  onKey,
  light,
  bio,
}: {
  onKey: (k: string) => void;
  light?: boolean;
  bio?: boolean;
}) {
  const base = light
    ? "text-ink bg-surface-2 active:bg-[var(--line)] h-14"
    : "text-white bg-white/10 active:bg-white/25 h-[62px]";
  return (
    <div className="grid grid-cols-3 gap-[11px] w-full max-w-[268px]">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
        <button
          key={n}
          onClick={() => onKey(String(n))}
          className={`rounded-full text-2xl grid place-items-center transition-transform active:scale-95 ${base}`}
        >
          {n}
        </button>
      ))}
      <button
        onClick={() => bio && onKey("bio")}
        className={`rounded-full grid place-items-center ${light ? "text-brand h-14" : "text-white h-[62px]"} ${bio ? "" : "opacity-0 pointer-events-none"}`}
      >
        <Ic.Finger />
      </button>
      <button
        onClick={() => onKey("0")}
        className={`rounded-full text-2xl grid place-items-center transition-transform active:scale-95 ${base}`}
      >
        0
      </button>
      <button
        onClick={() => onKey("del")}
        className={`rounded-full grid place-items-center ${light ? "text-ink h-14" : "text-white h-[62px]"}`}
      >
        <Ic.Del />
      </button>
    </div>
  );
}

export function PinDots({
  n,
  dark,
  shake,
}: {
  n: number;
  dark?: boolean;
  shake?: boolean;
}) {
  return (
    <div className={`flex gap-3 justify-center ${shake ? "shake" : ""}`}>
      {Array.from({ length: 6 }, (_, i) => (
        <i
          key={i}
          className={`w-3 h-3 rounded-full border-[1.5px] transition-all
          ${dark ? "border-[var(--line-strong)]" : "border-white/40"}
          ${i < n ? (dark ? "bg-brand border-brand scale-110" : "bg-white border-white scale-110") : ""}`}
        />
      ))}
    </div>
  );
}

/** Saisie OTP : champ caché + cases visibles. */
export function OtpInput({
  onComplete,
  shake,
}: {
  onComplete: (v: string) => void;
  shake?: boolean;
}) {
  const [v, setV] = useState("");
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const id = setTimeout(() => ref.current?.focus(), 240);
    return () => clearTimeout(id);
  }, []);
  useEffect(() => {
    if (shake) setV("");
  }, [shake]);
  return (
    <div onClick={() => ref.current?.focus()}>
      <div className={`flex gap-2.5 justify-center ${shake ? "shake" : ""}`}>
        {Array.from({ length: 6 }, (_, i) => (
          <i
            key={i}
            className={`w-[42px] h-[54px] rounded-xl bg-surface border grid place-items-center not-italic
            text-[22px] font-semibold amt transition-colors
            ${v[i] ? "border-brand" : "border-[var(--line-strong)]"}`}
          >
            {v[i] ?? ""}
          </i>
        ))}
      </div>
      <input
        ref={ref}
        inputMode="numeric"
        maxLength={6}
        value={v}
        onChange={(e) => {
          const nv = e.target.value.replace(/\D/g, "").slice(0, 6);
          setV(nv);
          if (nv.length === 6) setTimeout(() => onComplete(nv), 160);
        }}
        className="absolute opacity-0 pointer-events-none"
      />
    </div>
  );
}

export const AppIcon = ({
  initials,
  logo,
  colors,
  size = 58,
}: {
  initials: string;
  logo?: string;
  colors: { brand: string; brand2: string };
  size?: number;
}) => (
  <span
    className="relative grid place-items-center text-white display font-bold overflow-hidden shrink-0"
    style={{
      width: size,
      height: size,
      borderRadius: size * 0.28,
      fontSize: size * 0.43,
      background: `linear-gradient(140deg, ${colors.brand}, ${colors.brand2})`,
      boxShadow: "0 5px 14px -5px rgba(0,0,0,.42)",
    }}
  >
    <span
      className="absolute inset-0"
      style={{
        background:
          "linear-gradient(150deg, rgba(255,255,255,.22), transparent 58%)",
      }}
    />
    {logo ? (
      <img
        className="relative w-full h-full object-contain p-[18%]"
        src={logo}
        alt=""
      />
    ) : (
      <span className="relative">{initials}</span>
    )}
  </span>
);
