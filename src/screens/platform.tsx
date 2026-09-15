import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type ChangeEvent,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import { Ic } from "../ui/icons";
import { AppIcon } from "../ui/bits";
import { t } from "../i18n";
import { fmt } from "../core/money";
import { canInstall, isStandalone, promptInstall } from "../core/pwa";
import {
  PALETTES,
  PLATFORM,
  suggestNames,
  PHOTOS,
  asset,
} from "../core/config";
import {
  currentBank,
  loadExistingCustomer,
  setState,
  useApp,
} from "../state/store";
import type { BankProfile } from "../core/types";

/* ---------- Éléments partagés des pages « plateforme » (web, hors cadre) ---------- */
function Brand({ dark }: { dark?: boolean }) {
  return (
    <span className="flex items-center gap-2.5 min-w-0">
      <span
        className="w-8 h-8 rounded-[10px] grid place-items-center display font-bold text-[15px] text-white shrink-0"
        style={{ background: "linear-gradient(135deg,#1E8A6B,#0E5C46)" }}
      >
        {PLATFORM.name[0]}
      </span>
      <span
        className={`display text-[15px] font-semibold truncate ${dark ? "text-ink" : "text-white"}`}
      >
        {PLATFORM.name}
      </span>
    </span>
  );
}

/** CTA principal des pages plateforme : pilule blanche, icône qui glisse, glow d'arrivée. */
function CtaPrimary({
  onClick,
  small,
  glow,
  children,
}: {
  onClick: () => void;
  small?: boolean;
  glow?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`group inline-flex items-center justify-center gap-2 rounded-full bg-white text-[#0B1F1B] font-semibold whitespace-nowrap
        shadow-[0_10px_28px_-8px_rgba(0,0,0,.4)] transition-all duration-300 ease-out
        hover:-translate-y-0.5 hover:shadow-[0_16px_34px_-8px_rgba(0,0,0,.5)] active:translate-y-0 active:scale-[.97]
        ${glow ? "cta-glow-light" : ""} ${small ? "text-[12.5px] pl-4 pr-2.5 py-2.5" : "text-[14.5px] pl-6 pr-3 py-3.5"}`}
    >
      {children}
      <span
        className={`grid place-items-center rounded-full bg-[#0B1F1B] text-white shrink-0 transition-transform duration-300 group-hover:translate-x-0.5
        ${small ? "w-[18px] h-[18px]" : "w-7 h-7"}`}
      >
        <Ic.Chev s={small ? 10 : 14} />
      </span>
    </button>
  );
}

/** CTA secondaire : contour, remplissage léger au survol. */
function CtaGhost({
  onClick,
  small,
  children,
}: {
  onClick: () => void;
  small?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center justify-center rounded-full border border-white/25 text-white font-medium whitespace-nowrap
        transition-colors duration-300 hover:bg-white/10 hover:border-white/40
        ${small ? "text-[12.5px] px-4 py-2.5" : "text-[14.5px] px-6 py-3.5"}`}
    >
      {children}
    </button>
  );
}

/** Bouton « Installer » (PWA) du header : déclenche l'invite d'installation du
 *  navigateur quand elle est disponible ; sinon affiche la marche à suivre
 *  (menu du navigateur, ou Partager → Sur l'écran d'accueil sur iOS).
 *  Masqué quand l'app tourne déjà installée (mode standalone). */
function PwaButton() {
  const [hint, setHint] = useState(false);
  if (isStandalone()) return null;
  const install = () => {
    if (canInstall()) {
      promptInstall();
      return;
    }
    setHint(true);
    setTimeout(() => setHint(false), 4500);
  };
  return (
    <span className="relative">
      <button
        onClick={install}
        className="inline-flex items-center gap-1.5 rounded-full border border-white/25 text-white font-medium whitespace-nowrap
          transition-colors duration-300 hover:bg-white/10 hover:border-white/40 text-[12.5px] px-3.5 py-2.5"
      >
        <Ic.Download s={15} />
        <span className="hidden sm:inline">{t("install")}</span>
      </button>
      {hint && (
        <span
          className="absolute right-0 top-[calc(100%+10px)] z-30 w-[240px] rounded-[12px] bg-surface text-ink text-[11.5px]
            leading-snug px-3.5 py-3 shadow-[0_14px_34px_-12px_rgba(0,0,0,.45)] border border-[var(--line)]"
        >
          {/iPhone|iPad|iPod/i.test(navigator.userAgent)
            ? t("installIos")
            : t("installHint")}
        </span>
      )}
    </span>
  );
}

/** Téléphone 3D : vraie épaisseur (écran, dos, tranches métalliques avec boutons),
 *  oscillation douce sur l'axe Y — l'écran reste toujours visible.
 *  Écran riche : accueil complet de l'app bancaire, aux couleurs de la banque. */
function HeroMock({ bank }: { bank: BankProfile }) {
  const bars = [42, 58, 35, 72, 50, 92, 64];
  return (
    <div
      className="relative mx-auto anim-pop"
      style={{ display: "grid", placeItems: "center" }}
    >
      <div className="phone-scene">
        <div className="phone-shadow" />
        <div className="phone-scale">
          <div className="phone3d">
            {/* --- Face avant : écran d'accueil bancaire --- */}
            <div className="phone3d-face phone3d-front">
              <div className="phone-island" />
              <div className="phone-screen">
                {/* Barre de statut */}
                <div
                  className="h-10 flex items-center justify-between px-5 mono text-[11px] text-white/90 shrink-0"
                  style={{ background: bank.colors.brand }}
                >
                  <span>9:41</span>
                  <span className="truncate max-w-[55%]">
                    {bank.appName || bank.bankName}
                  </span>
                </div>
                <div
                  className="flex-1 min-h-0 overflow-hidden flex flex-col p-4 gap-3"
                  style={{ background: "var(--color-bg)" }}
                >
                  {/* Salutation */}
                  <div className="flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2.5">
                      <AppIcon
                        initials={bank.initials}
                        logo={bank.logo}
                        colors={bank.colors}
                        size={32}
                      />
                      <div>
                        <div className="text-[10.5px] text-muted leading-none">
                          {t("hello")}, Awa
                        </div>
                        <div className="text-[12.5px] font-semibold leading-tight mt-1">
                          {t("home")}
                        </div>
                      </div>
                    </div>
                    <span
                      className="relative w-8 h-8 rounded-[10px] grid place-items-center bg-surface border border-[var(--line)]"
                      style={{ color: bank.colors.brand }}
                    >
                      <Ic.Bell s={15} />
                      <span className="absolute top-1.5 right-2 w-[6px] h-[6px] rounded-full bg-queued" />
                    </span>
                  </div>
                  {/* Carte de solde */}
                  <div
                    className="relative rounded-[18px] p-3.5 text-white overflow-hidden shrink-0"
                    style={{
                      background: `linear-gradient(152deg, ${bank.colors.brand}, ${bank.colors.brand2})`,
                    }}
                  >
                    <span className="absolute -right-8 -top-10 w-[110px] h-[110px] rounded-full bg-white/5" />
                    <div className="relative text-[10px] font-medium opacity-85">
                      {t("current")}
                    </div>
                    <div className="relative amt text-[19px] mt-1 leading-none">
                      {fmt(1250000)}
                      <span className="cur">FCFA</span>
                    </div>
                    <div className="relative flex justify-between items-baseline mt-2 pt-1.5 border-t border-white/15 text-[9px]">
                      <span className="opacity-70">{t("available")}</span>
                      <span className="amt">{fmt(1250000)}</span>
                    </div>
                  </div>
                  {/* Actions rapides */}
                  <div className="grid grid-cols-4 gap-2 shrink-0">
                    {[Ic.Send, Ic.Wallet, Ic.Scan, Ic.List].map((I, i) => (
                      <span
                        key={i}
                        className="rounded-[13px] bg-surface border border-[var(--line)] flex items-center justify-center h-[48px]"
                        style={{ color: bank.colors.brand }}
                      >
                        <I s={15} />
                      </span>
                    ))}
                  </div>
                  {/* Activité de la semaine : mini bar chart */}
                  <div className="rounded-[13px] bg-surface border border-[var(--line)] p-2.5 shrink-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="mono text-[9px] tracking-[.08em] uppercase text-muted">
                        {t("history")}
                      </span>
                      <span className="text-[9.5px] font-semibold text-ok">
                        +18%
                      </span>
                    </div>
                    <div className="flex items-end justify-between gap-1.5 h-[30px]">
                      {bars.map((h, i) => (
                        <span
                          key={i}
                          className="flex-1 rounded-[3px]"
                          style={{
                            height: `${h}%`,
                            background:
                              i === 5
                                ? bank.colors.brand
                                : "var(--line-strong)",
                          }}
                        />
                      ))}
                    </div>
                  </div>
                  {/* Opérations récentes */}
                  <div className="shrink-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="display text-[12px] font-semibold">
                        {t("recent")}
                      </span>
                      <span
                        className="text-[10px] font-medium"
                        style={{ color: bank.colors.brand }}
                      >
                        {t("seeAll")}
                      </span>
                    </div>
                    <div className="rounded-[13px] bg-surface border border-[var(--line)] overflow-hidden">
                      {[
                        {
                          Ic: Ic.Up,
                          name: "Virement reçu — Ets Nkolo",
                          ref: "REF-84120",
                          amt: "+450 000",
                          credit: true,
                        },
                        {
                          Ic: Ic.Down,
                          name: "Facture ENEO",
                          ref: "REF-84119",
                          amt: "\u221238 500",
                          credit: false,
                        },
                        {
                          Ic: Ic.Phone,
                          name: "Ibrahim Moussa",
                          ref: "REF-84117",
                          amt: "\u221245 000",
                          credit: false,
                        },
                      ].map(({ Ic: I, name, ref, amt, credit }, i) => (
                        <div
                          key={i}
                          className={`flex items-center gap-2.5 px-3 py-[6px] ${i ? "border-t border-[var(--line)]" : ""}`}
                        >
                          <span
                            className={`w-7 h-7 rounded-full grid place-items-center shrink-0 ${
                              credit
                                ? "bg-[rgba(30,138,107,.11)] text-ok"
                                : "bg-surface-2 text-muted"
                            }`}
                          >
                            <I s={13} />
                          </span>
                          <span className="flex-1 min-w-0">
                            <span className="block text-[10.5px] font-medium truncate leading-tight">
                              {name}
                            </span>
                            <span className="block mono text-[8.5px] text-muted mt-0.5">
                              {ref}
                            </span>
                          </span>
                          <span
                            className={`amt text-[10.5px] whitespace-nowrap ${
                              credit ? "text-ok" : ""
                            }`}
                          >
                            {amt}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                {/* Tab bar — la pastille active suit la couleur de la banque configurée */}
                <div className="shrink-0 flex items-center justify-around py-2 border-t border-[var(--line)] bg-surface">
                  {[Ic.Home, Ic.List, Ic.Scan, Ic.Users, Ic.Cog].map((I, i) => (
                    <span
                      key={i}
                      className="w-8 h-8 rounded-[11px] grid place-items-center"
                      style={
                        i === 0
                          ? {
                              background: `color-mix(in srgb, ${bank.colors.brand} 15%, white)`,
                              color: bank.colors.brand,
                            }
                          : {
                              background: "var(--color-surface-2)",
                              color: "var(--color-muted)",
                              opacity: 0.75,
                            }
                      }
                    >
                      <I s={15} />
                    </span>
                  ))}
                </div>
              </div>
            </div>
            {/* --- Face arrière : verre, module photo, logo --- */}
            <div className="phone3d-face phone3d-back">
              <div className="phone-cam">
                <span className="phone-lens" />
                <span className="phone-lens phone-lens-s" />
                <span className="phone-flash" />
                <span className="phone-lens phone-lens-s" />
              </div>
              <div
                className="phone-logo"
                style={
                  {
                    "--pb": bank.colors.brand,
                    "--pb2": bank.colors.brand2,
                  } as CSSProperties
                }
              >
                {bank.initials}
              </div>
            </div>
            {/* --- Tranches métalliques + boutons --- */}
            <div className="phone3d-edge lr r" />
            <div className="phone3d-edge lr l" />
            <div className="phone3d-edge tb t" />
            <div className="phone3d-edge tb b" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Accueil de la plateforme (page web, plein écran) ---------- */
export function PlatformHome() {
  const nav = useNavigate();
  const s = useApp();
  const bank = currentBank(s);
  const goDemo = () => {
    setState({ bankKey: "kota" });
    loadExistingCustomer();
    setState({ authed: false });
    nav("/welcome");
  };
  const toggleLang = () => setState({ lang: s.lang === "fr" ? "en" : "fr" });

  const features = [
    {
      icon: <Ic.WifiOff />,
      title: t("pfFeatOfflineT"),
      body: t("pfFeatOfflineD"),
    },
    { icon: <Ic.Phone />, title: t("pfFeatUssdT"), body: t("pfFeatUssdD") },
    { icon: <Ic.Swap />, title: t("pfFeatGimacT"), body: t("pfFeatGimacD") },
    {
      icon: <Ic.Wallet />,
      title: t("pfFeatWalletT"),
      body: t("pfFeatWalletD"),
    },
    { icon: <Ic.Scan />, title: t("pfFeatQrT"), body: t("pfFeatQrD") },
  ];
  const steps = [
    { n: "01", title: t("pfHow1T"), body: t("pfHow1D") },
    { n: "02", title: t("pfHow2T"), body: t("pfHow2D") },
    { n: "03", title: t("pfHow3T"), body: t("pfHow3D") },
  ];

  return (
    <div className="flex flex-col">
      {/* ---------- Hero ---------- */}
      <div
        className="relative overflow-hidden text-white min-h-dvh flex flex-col"
        style={{
          background:
            "linear-gradient(163deg,#0B1F1B 0%,#123830 48%,#0B1F1B 100%)",
        }}
      >
        {PHOTOS.platform && (
          <div
            className="photo opacity-30"
            style={{ backgroundImage: `url('${asset(PHOTOS.platform)}')` }}
          />
        )}
        <span className="absolute -top-28 -right-32 w-[380px] h-[380px] rounded-full blur-[80px] opacity-40 bg-[#1E8A6B] animate-[float1_13s_ease-in-out_infinite]" />
        <span className="absolute bottom-0 -left-36 w-[300px] h-[300px] rounded-full blur-[80px] opacity-40 bg-[#C86B3C] animate-[float2_16s_ease-in-out_infinite]" />

        <div className="relative z-10 max-w-[1180px] mx-auto w-full px-5 sm:px-8 lg:px-10 flex flex-col flex-1">
          <nav className="flex items-center justify-between gap-3 py-6 flex-wrap">
            <Brand />
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                onClick={toggleLang}
                className="text-[12px] font-medium text-white/65 hover:text-white px-2 py-2"
              >
                {s.lang === "fr" ? "EN" : "FR"}
              </button>
              <button
                onClick={goDemo}
                className="hidden sm:inline-flex text-[13px] font-medium text-white/85 hover:text-white px-3 py-2"
              >
                {t("pfDemo")}
              </button>
              <PwaButton />
              <CtaPrimary small onClick={() => nav("/configurator")}>
                {t("pfStart")}
              </CtaPrimary>
            </div>
          </nav>

          <div className="grid lg:grid-cols-[1fr_460px] gap-12 lg:gap-10 items-center flex-1 py-8 sm:py-14 lg:py-20">
            <div className="anim-rise">
              <span className="eyebrow eyebrow-light">
                {t("pfHeroEyebrow")}
              </span>
              <h1 className="display text-[36px] sm:text-[46px] lg:text-[54px] leading-[1.06] font-semibold mt-3.5 max-w-[560px]">
                {PLATFORM.claim[s.lang]}
              </h1>
              <p className="text-[15px] sm:text-base leading-relaxed opacity-70 mt-5 max-w-[440px]">
                {PLATFORM.sub[s.lang]}
              </p>
              <div className="flex flex-wrap gap-3 mt-8">
                <CtaPrimary glow onClick={() => nav("/configurator")}>
                  {t("pfStart")}
                </CtaPrimary>
                <CtaGhost onClick={goDemo}>{t("pfDemo")}</CtaGhost>
              </div>
              <div className="text-[11.5px] text-white/45 mt-4">
                {t("pfHeroNote")}
              </div>
            </div>

            <div className="anim-rise" style={{ animationDelay: ".15s" }}>
              <HeroMock bank={bank} />
            </div>
          </div>
        </div>
      </div>

      {/* ---------- Fonctionnalités ---------- */}
      <div className="bg-bg">
        <div className="max-w-[1180px] mx-auto w-full px-5 sm:px-8 lg:px-10 py-16 sm:py-20 lg:py-24">
          <div className="max-w-[560px]">
            <span className="eyebrow">{t("pfFeatEyebrow")}</span>
            <h2 className="display text-[24px] sm:text-[30px] font-semibold mt-3 leading-[1.15]">
              {t("pfFeatTitle")}
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-10">
            {features.map((f) => (
              <div key={f.title} className="card p-5 flex flex-col gap-3">
                <span className="w-10 h-10 rounded-xl grid place-items-center bg-brand-soft text-brand shrink-0">
                  {f.icon}
                </span>
                <div className="text-[14.5px] font-semibold">{f.title}</div>
                <div className="text-[13px] text-muted leading-relaxed">
                  {f.body}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ---------- Comment ça marche ---------- */}
      <div className="bg-surface border-y border-[var(--line)]">
        <div className="max-w-[1180px] mx-auto w-full px-5 sm:px-8 lg:px-10 py-16 sm:py-20 lg:py-24">
          <div className="max-w-[560px]">
            <span className="eyebrow">{t("pfHowEyebrow")}</span>
            <h2 className="display text-[24px] sm:text-[30px] font-semibold mt-3 leading-[1.15]">
              {t("pfHowTitle")}
            </h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-8 mt-10">
            {steps.map((st) => (
              <div key={st.n} className="flex flex-col gap-2.5">
                <span className="mono text-[12px] tracking-[.1em] text-brand font-semibold">
                  {st.n}
                </span>
                <div className="text-[16px] font-semibold display">
                  {st.title}
                </div>
                <div className="text-[13px] text-muted leading-relaxed">
                  {st.body}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ---------- Bandeau CTA ---------- */}
      <div className="bg-bg">
        <div className="max-w-[1180px] mx-auto w-full px-5 sm:px-8 lg:px-10 py-16 sm:py-20">
          <div
            className="relative overflow-hidden rounded-[28px] px-6 sm:px-10 py-12 sm:py-16 text-center text-white"
            style={{
              background:
                "linear-gradient(152deg, var(--brand) 0%, var(--brand-2) 100%)",
            }}
          >
            <span className="absolute -top-16 -right-16 w-[220px] h-[220px] rounded-full bg-white/5" />
            <h2 className="relative display text-[22px] sm:text-[28px] font-semibold max-w-[520px] mx-auto">
              {t("pfCtaTitle")}
            </h2>
            <p className="relative text-sm opacity-70 mt-3">{t("pfCtaSub")}</p>
            <div className="relative flex flex-wrap justify-center gap-3 mt-7">
              <CtaPrimary onClick={() => nav("/configurator")}>
                {t("pfStart")}
              </CtaPrimary>
              <CtaGhost onClick={goDemo}>{t("pfDemo")}</CtaGhost>
            </div>
          </div>
        </div>
      </div>

      {/* ---------- Pied de page ---------- */}
      <div className="bg-bg border-t border-[var(--line)]">
        <div className="max-w-[1180px] mx-auto w-full px-5 sm:px-8 lg:px-10 py-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <Brand dark />
          <div className="text-[11.5px] text-muted text-center sm:text-right">
            {t("demoData")}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Configurateur (page web large, aperçu en direct) ---------- */
export function Configurator() {
  const nav = useNavigate();
  const s = useApp();
  const [c, setC] = useState<BankProfile>(() => structuredClone(s.custom));
  const suggestions = useMemo(() => suggestNames(c.bankName), [c.bankName]);

  const patch = (p: Partial<BankProfile>) =>
    setC((prev) => ({ ...prev, ...p }));

  const saveLogo = (logo?: string) => {
    const next = { ...c, logo };
    setC(next);
    setState({ custom: next });
  };

  const handleLogo = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const edge = 512;
        const scale = Math.min(1, edge / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        canvas
          .getContext("2d")
          ?.drawImage(image, 0, 0, canvas.width, canvas.height);
        saveLogo(canvas.toDataURL("image/webp", 0.86));
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  return (
    <div className="min-h-dvh flex flex-col">
      <header className="border-b border-[var(--line)] bg-surface">
        <div className="max-w-[1180px] mx-auto w-full px-5 sm:px-8 lg:px-10 py-5 flex items-center justify-between gap-3">
          <button onClick={() => nav("/")}>
            <Brand dark />
          </button>
          <span className="eyebrow">{t("cfgStep")} 1 / 2</span>
        </div>
      </header>

      <div
        className="flex-1 max-w-[1180px] mx-auto w-full px-5 sm:px-8 lg:px-10 py-10 lg:py-14
        grid lg:grid-cols-[1fr_340px] gap-10 items-start"
      >
        <div className="flex flex-col gap-6 max-w-[560px]">
          <h1 className="display text-[24px] sm:text-[28px] font-semibold">
            {t("cfgTitle")}
          </h1>

          <section className="card p-5 flex flex-col gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-[11.5px] text-muted font-medium">
                {t("cfgBankName")}
              </span>
              <input
                className="input"
                value={c.bankName}
                placeholder={t("cfgBankPh")}
                onChange={(e) => {
                  const bankName = e.target.value || "Ma Banque";
                  patch({
                    bankName,
                    initials: (bankName.trim()[0] || "M").toUpperCase(),
                    bankId:
                      bankName
                        .replace(/[^A-Za-z]/g, "")
                        .slice(0, 3)
                        .toUpperCase() || "CUS",
                  });
                }}
              />
            </label>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11.5px] text-muted font-medium">
                {t("cfgAppName")}
              </label>
              <input
                className="input"
                value={c.appName}
                onChange={(e) => patch({ appName: e.target.value })}
              />
              <div className="eyebrow mt-1">{t("cfgSuggest")}</div>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((n) => (
                  <button
                    key={n}
                    className={`chip ${c.appName === n ? "chip-on" : ""}`}
                    onClick={() => patch({ appName: n })}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className="card p-5 flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11.5px] text-muted font-medium">
                {t("cfgLogo")}
              </label>
              <div className="flex items-center gap-3">
                <AppIcon
                  initials={c.initials}
                  logo={c.logo}
                  colors={c.colors}
                  size={64}
                />
                <label className="btn btn-ghost btn-sm cursor-pointer">
                  {c.logo ? t("cfgLogoChange") : t("cfgLogoUpload")}
                  <input
                    className="sr-only"
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    onChange={handleLogo}
                  />
                </label>
                {c.logo && (
                  <button
                    className="text-[12px] text-danger"
                    onClick={() => saveLogo(undefined)}
                  >
                    {t("cfgLogoRemove")}
                  </button>
                )}
              </div>
              <div className="text-[11px] text-muted">{t("cfgLogoD")}</div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11.5px] text-muted font-medium">
                {t("cfgPalette")}
              </label>
              <div className="grid grid-cols-6 gap-2 max-w-[280px]">
                {PALETTES.map((p) => (
                  <button
                    key={p.id}
                    title={p.nm}
                    onClick={() =>
                      patch({
                        colors: {
                          brand: p.brand,
                          brand2: p.brand2,
                          soft: p.soft,
                        },
                      })
                    }
                    className={`aspect-square rounded-xl border-2 transition-transform ${c.colors.brand === p.brand ? "border-ink scale-105" : "border-transparent"}`}
                    style={{
                      background: `linear-gradient(140deg,${p.brand},${p.brand2})`,
                    }}
                  />
                ))}
              </div>
            </div>

            <label className="flex flex-col gap-1.5">
              <span className="text-[11.5px] text-muted font-medium">
                {t("cfgTagline")}
              </span>
              <input
                className="input"
                value={c.tagline[s.lang]}
                onChange={(e) =>
                  patch({ tagline: { ...c.tagline, [s.lang]: e.target.value } })
                }
              />
            </label>
          </section>

          <section className="flex flex-col gap-1.5">
            <label className="text-[11.5px] text-muted font-medium">
              {t("cfgModules")}
            </label>
            <div className="card">
              {(
                [
                  ["phone", t("modPhone")],
                  ["wallet", t("modWallet")],
                  ["interbank", t("modInterbank")],
                ] as const
              ).map(([k, lb]) => (
                <button
                  key={k}
                  className="opt"
                  onClick={() =>
                    patch({ features: { ...c.features, [k]: !c.features[k] } })
                  }
                >
                  <span className="flex-1 text-sm font-medium">{lb}</span>
                  <span
                    className={`switch ${c.features[k] ? "switch-on" : ""}`}
                  />
                </button>
              ))}
            </div>
          </section>

          <button
            className="btn sm:max-w-xs"
            onClick={() => {
              setState({ custom: c, bankKey: "custom" });
              nav("/building");
            }}
          >
            {t("cfgBuild")}
          </button>
        </div>

        <aside className="lg:sticky lg:top-10 flex flex-col gap-5">
          <div className="flex items-center gap-4 p-4 card">
            <AppIcon initials={c.initials} logo={c.logo} colors={c.colors} />
            <div className="min-w-0">
              <div className="eyebrow">{t("cfgPreview")}</div>
              <div className="text-[14.5px] font-semibold mt-1.5 truncate">
                {c.appName}
              </div>
              <div className="text-[11.5px] text-muted mt-0.5 truncate">
                {c.bankName}
              </div>
            </div>
          </div>
          <HeroMock bank={c} />
        </aside>
      </div>
    </div>
  );
}

/* ---------- Construction (page web, centrée) ---------- */
export function Building() {
  const nav = useNavigate();
  const [i, setI] = useState(0);
  const steps = [t("bld1"), t("bld2"), t("bld3"), t("bld4"), t("bld5")];

  useEffect(() => {
    if (i >= steps.length) {
      const id = setTimeout(() => nav("/welcome"), 620);
      return () => clearTimeout(id);
    }
    const id = setTimeout(() => setI((n) => n + 1), i === 0 ? 340 : 520);
    return () => clearTimeout(id);
  }, [i, nav, steps.length]);

  const pct = (i / steps.length) * 251;
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center text-center px-6 py-16">
      <div className="w-[92px] h-[92px] mb-[26px]">
        <svg width="92" height="92" viewBox="0 0 92 92" className="-rotate-90">
          <circle
            cx="46"
            cy="46"
            r="40"
            fill="none"
            stroke="var(--line)"
            strokeWidth="6"
          />
          <circle
            cx="46"
            cy="46"
            r="40"
            fill="none"
            stroke="var(--brand)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray="251"
            strokeDashoffset={251 - pct}
            style={{ transition: "stroke-dashoffset .5s var(--ease)" }}
          />
        </svg>
      </div>
      <h2 className="display text-[19px] font-semibold">
        {i >= steps.length ? t("bldDone") : t("bldTitle")}
      </h2>
      <div className="w-full max-w-[280px] flex flex-col gap-[11px] mt-4">
        {steps.map((st, k) => (
          <div
            key={st}
            className={`flex items-center gap-2.5 text-[12.5px] transition-opacity
            ${k < i ? "opacity-100 text-ink" : "opacity-35 text-muted"}`}
          >
            <span
              className={`w-[18px] h-[18px] rounded-full border-[1.5px] grid place-items-center shrink-0 transition-colors
              ${k < i ? "bg-ok border-ok text-white" : "border-[var(--line-strong)]"}`}
            >
              <Ic.Check s={12} />
            </span>
            <span>{st}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
