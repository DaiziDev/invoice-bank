import { useEffect, useState, type ReactNode } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Ic } from "./icons";
import { t } from "../i18n";
import { useApp } from "../state/store";
import { canInstall, isStandalone, promptInstall } from "../core/pwa";

/** Conteneur applicatif responsive : plein écran sur mobile et web sur desktop. */
export function Device({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh w-full bg-bg">
      <div className="relative flex min-h-dvh w-full flex-col bg-surface overflow-hidden">
        {children}
      </div>
    </div>
  );
}

export function PwaInstallButton({ light = false }: { light?: boolean }) {
  const [hint, setHint] = useState(false);
  const [installable, setInstallable] = useState(canInstall());
  const [standalone, setStandalone] = useState(isStandalone());

  useEffect(() => {
    const onInstallable = () => setInstallable(true);
    const onInstalled = () => setStandalone(true);
    window.addEventListener("pwa-installable", onInstallable);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("pwa-installable", onInstallable);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (standalone) return null;

  const install = () => {
    if (installable && canInstall()) {
      promptInstall();
      return;
    }
    setHint(true);
    window.setTimeout(() => setHint(false), 4500);
  };

  return (
    <span className="relative shrink-0">
      <button
        type="button"
        onClick={install}
        aria-label={t("install")}
        title={t("install")}
        className={`grid place-items-center w-8 h-8 rounded-[10px] transition-colors ${light ? "text-muted hover:bg-surface-2 hover:text-brand" : "text-white/85 hover:bg-white/10 hover:text-white"}`}
      >
        <Ic.Download s={16} />
      </button>
      {hint && (
        <span className="absolute right-0 top-[calc(100%+10px)] z-50 w-[240px] rounded-[12px] bg-surface text-ink text-[11.5px] leading-snug px-3.5 py-3 shadow-[0_14px_34px_-12px_rgba(0,0,0,.45)] border border-[var(--line)]">
          {/iPhone|iPad|iPod/i.test(navigator.userAgent)
            ? t("installIos")
            : t("installHint")}
        </span>
      )}
    </span>
  );
}

export function Ligne() {
  const { net } = useApp();
  return <div className="ligne" data-net={net} />;
}

export function NetBar() {
  const { net } = useApp();
  const show = net !== "on";
  return (
    <div
      className="shrink-0 overflow-hidden transition-[max-height] duration-[380ms] z-30"
      style={{ maxHeight: show ? 88 : 0 }}
    >
      <div
        className="flex items-start gap-2.5 px-[18px] py-2.5 text-[12.5px] leading-snug"
        style={{
          background: net === "off" ? "#2A1B12" : "#33291B",
          color: "#F6E4D8",
        }}
      >
        <span className="w-2 h-2 rounded-full bg-queued shrink-0 mt-1 animate-[blip_1.4s_ease-in-out_infinite]" />
        <div>
          <b className="font-semibold">
            {net === "off" ? t("offTitle") : t("weakTitle")}
          </b>{" "}
          {net === "off" ? t("offBody") : t("weakBody")}
        </div>
      </div>
    </div>
  );
}

const TABS = [
  { to: "/app/home", icon: Ic.Home, key: "home" as const },
  { to: "/app/history", icon: Ic.List, key: "ops" as const },
  { to: "/app/benefs", icon: Ic.Users, key: "benef" as const },
  { to: "/app/settings", icon: Ic.Cog, key: "settings" as const },
];

export function TabBar() {
  const s = useApp();
  const queued = s.outbox.length;
  return (
    <nav
      className="shrink-0 grid grid-cols-4 bg-surface border-t border-[var(--line)] z-30"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {TABS.map(({ to, icon: Icon, key }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `relative flex flex-col items-center gap-1 pt-2.5 pb-3 ${isActive ? "text-brand" : "text-muted"}`
          }
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-[22px] h-[2.5px] rounded-b-[3px] bg-brand" />
              )}
              <Icon />
              <span className="text-[9.5px] font-medium">{t(key)}</span>
              {key === "ops" && queued > 0 && (
                <span className="absolute top-[7px] right-[calc(50%-17px)] w-[7px] h-[7px] rounded-full bg-queued border-[1.5px] border-surface" />
              )}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

export function Toast() {
  const { toast } = useApp();
  if (!toast) return null;
  return (
    <div
      className={`anim-rise absolute left-4 right-4 bottom-[84px] z-[70] flex items-center gap-2.5
      px-4 py-3 rounded-[13px] text-[12.5px] leading-snug text-white shadow-[0_10px_26px_-10px_rgba(0,0,0,.5)]
      ${toast.kind === "copper" ? "bg-[#4A2A17]" : "bg-[#16211E]"}`}
    >
      <span className="shrink-0">
        {toast.kind === "ok" ? <Ic.Check s={18} /> : <Ic.Info />}
      </span>
      <span>{toast.msg}</span>
    </div>
  );
}

/** Conteneur d'écran défilant, avec animation d'entrée. */
export function Screen({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const loc = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [loc.pathname]);
  return (
    <div
      key={loc.pathname}
      className={`anim-screen-in flex-1 overflow-y-auto overflow-x-hidden no-sb flex flex-col bg-bg ${className}`}
    >
      {children}
    </div>
  );
}

export const Body = ({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) => (
  <div
    className={`p-[18px] flex flex-col gap-3.5 flex-1 w-full max-w-[1120px] mx-auto ${className}`}
  >
    {children}
  </div>
);

export const FooterCta = ({ children }: { children: ReactNode }) => (
  <div
    className="shrink-0 sticky bottom-0 bg-surface border-t border-[var(--line)] px-[18px] pt-3.5 flex flex-col gap-2.5"
    style={{ paddingBottom: "calc(14px + env(safe-area-inset-bottom))" }}
  >
    {children}
  </div>
);
