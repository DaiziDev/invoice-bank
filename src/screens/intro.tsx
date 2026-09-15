import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Ic } from "../ui/icons";
import { AppIcon } from "../ui/bits";
import { currentBank, useApp } from "../state/store";

const slides = [
  {
    eyebrow: {
      fr: "Une banque qui suit la vraie vie",
      en: "A bank built for real life",
    },
    title: {
      fr: "Votre argent, même quand le réseau hésite.",
      en: "Your money, even when the network hesitates.",
    },
    body: {
      fr: "Une expérience bancaire pensée pour les téléphones, les usages locaux et les moments où la connexion disparaît.",
      en: "A banking experience designed for phones, local habits and the moments when the connection disappears.",
    },
    visual: "network",
  },
  {
    eyebrow: { fr: "Simple pour vos clients", en: "Simple for your customers" },
    title: {
      fr: "Du wallet au virement en quelques gestes.",
      en: "From wallet to transfer in a few gestures.",
    },
    body: {
      fr: "Alimentez un wallet, envoyez vers un compte ou un numéro, puis gardez une preuve claire de chaque opération.",
      en: "Top up a wallet, send to an account or phone number, then keep a clear proof of every operation.",
    },
    visual: "flow",
  },
  {
    eyebrow: { fr: "Conçu pour la CEMAC", en: "Designed for CEMAC" },
    title: {
      fr: "Les bons rails, au même endroit.",
      en: "The right rails, in one place.",
    },
    body: {
      fr: "Mobile Money, GIMACPAY, USSD et QR : votre banque reste utile, sur smartphone comme sur un réseau fragile.",
      en: "Mobile Money, GIMACPAY, USSD and QR: your bank stays useful, on smartphones and fragile networks alike.",
    },
    visual: "rails",
  },
  {
    eyebrow: {
      fr: "Votre banque, votre signature",
      en: "Your bank, your signature",
    },
    title: {
      fr: "Configurez. Construisez. Installez.",
      en: "Configure. Build. Install.",
    },
    body: {
      fr: "Choisissez votre identité, activez vos modules et donnez vie à une application qui vous ressemble.",
      en: "Choose your identity, activate your modules and bring an app that feels like yours to life.",
    },
    visual: "build",
  },
];

type Visual = "network" | "flow" | "rails" | "build";

const slideImages: Record<Visual, string> = {
  network:
    "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=85",
  flow: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&w=900&q=85",
  rails:
    "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=900&q=85",
  build:
    "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=900&q=85",
};

function SlideVisual({ type }: { type: Visual }) {
  return (
    <figure className="slide-photo" aria-hidden="true">
      <img src={slideImages[type]} alt="" loading="eager" />
      <span className="slide-photo-shade" />
      <span className="slide-photo-frame" />
    </figure>
  );
}

export function Intro() {
  const nav = useNavigate();
  const location = useLocation();
  const s = useApp();
  const bank = currentBank(s);
  const destination =
    (location.state as { next?: string } | null)?.next || "/configurator";
  const [active, setActive] = useState(0);
  const slide = slides[active];
  const lang = s.lang;
  const text = (value: { fr: string; en: string }) => value[lang];
  const leaveIntro = () =>
    nav(destination, {
      replace: true,
      state:
        destination === "/configurator" ? { introComplete: true } : undefined,
    });

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight")
        setActive((value) => Math.min(value + 1, slides.length - 1));
      if (event.key === "ArrowLeft")
        setActive((value) => Math.max(value - 1, 0));
      if (event.key === "Enter") leaveIntro();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [destination, leaveIntro]);

  const next = () =>
    active === slides.length - 1
      ? leaveIntro()
      : setActive((value) => value + 1);
  return (
    <main
      className="intro-shell"
      style={{ "--intro-accent": bank.colors.brand } as React.CSSProperties}
    >
      <div className="intro-grain" />
      <header className="intro-header">
        <div className="flex items-center gap-2.5 text-white">
          <AppIcon
            initials={bank.initials}
            logo={bank.logo}
            colors={bank.colors}
            size={34}
          />
          <span className="display text-[15px] font-semibold">
            {bank.bankName}
          </span>
        </div>
        <button className="intro-skip" onClick={leaveIntro}>
          {lang === "fr" ? "Passer" : "Skip"}
        </button>
      </header>

      <section className="intro-content" aria-live="polite">
        <div className="intro-copy anim-rise" key={`copy-${active}`}>
          <span className="eyebrow eyebrow-light">{text(slide.eyebrow)}</span>
          <h1 className="display intro-title">{text(slide.title)}</h1>
          <p className="intro-body">{text(slide.body)}</p>
          <div className="intro-tag">
            <span className="intro-tag-dot" />
            <span>
              {lang === "fr"
                ? "Une plateforme bancaire complète"
                : "A complete banking platform"}
            </span>
          </div>
        </div>
        <div className="intro-visual anim-pop" key={`visual-${active}`}>
          <SlideVisual type={slide.visual as Visual} />
        </div>
      </section>

      <footer className="intro-footer">
        <div
          className="intro-progress"
          aria-label={`${active + 1} / ${slides.length}`}
        >
          {slides.map((_, index) => (
            <button
              key={index}
              aria-label={`${index + 1}`}
              aria-current={index === active}
              onClick={() => setActive(index)}
            >
              <span />
            </button>
          ))}
        </div>
        <div className="intro-actions">
          <span className="mono intro-count">
            0{active + 1} / 0{slides.length}
          </span>
          <button className="intro-next" onClick={next}>
            {active === slides.length - 1
              ? destination === "/configurator"
                ? lang === "fr"
                  ? "Configurer ma banque"
                  : "Configure my bank"
                : lang === "fr"
                  ? "Découvrir l’accueil"
                  : "See the welcome"
              : lang === "fr"
                ? "Suivant"
                : "Next"}
            <span>
              <Ic.Chev s={16} />
            </span>
          </button>
        </div>
      </footer>
    </main>
  );
}
