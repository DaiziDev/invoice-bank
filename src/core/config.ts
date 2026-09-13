import type { BankProfile, Lang, Tier } from './types';

export const PLATFORM = {
  name: 'Invoice Bank',
  claim: {
    fr: 'La banque mobile, conçue ici.',
    en: 'Mobile banking, built here.',
  } as Record<Lang, string>,
  sub: {
    fr: "Une plateforme pour créer l'application de votre banque — pensée pour le réseau, les téléphones et les usages du Cameroun.",
    en: "A platform to build your bank's app — designed for Cameroonian networks, phones and habits.",
  } as Record<Lang, string>,
  pills: ['Hors ligne', 'USSD', 'GIMACPAY', 'Wallet', 'QR CEMAC'],
};

/**
 * PHOTOS — à remplir.
 * Déposez vos images dans `public/img/` puis référencez-les ici.
 * Chemins relatifs à la base du site : import.meta.env.BASE_URL les préfixe.
 * Laissez vide pour utiliser le repli graphique (dégradé + façade dessinée).
 *
 * Format portrait, 1200x1600 minimum, images libres de droits uniquement.
 *  · welcome  — façade d'agence, immeuble, skyline urbaine africaine
 *  · login    — texture sobre, architecture. Pas de visage.
 *  · platform — abstrait, ou vide.
 */
export const PHOTOS: Record<'welcome' | 'login' | 'platform', string> = {
  welcome: '',
  login: '',
  platform: '',
};

export const asset = (p: string): string =>
  p.startsWith('http') || p.startsWith('data:')
    ? p
    : import.meta.env.BASE_URL.replace(/\/$/, '') + '/' + p.replace(/^\.?\//, '');

export interface Palette {
  id: string;
  nm: string;
  brand: string;
  brand2: string;
  soft: string;
}

export const PALETTES: Palette[] = [
  { id: 'ink', nm: 'Encre', brand: '#0E2A26', brand2: '#17453D', soft: '#E4EDE9' },
  { id: 'indigo', nm: 'Indigo', brand: '#1F2A5B', brand2: '#33408A', soft: '#E5E8F5' },
  { id: 'garnet', nm: 'Grenat', brand: '#5A1F26', brand2: '#8A3340', soft: '#F3E5E7' },
  { id: 'teal', nm: 'Sarcelle', brand: '#0B3A45', brand2: '#155E6E', soft: '#E1EDF0' },
  { id: 'olive', nm: 'Olive', brand: '#2C3312', brand2: '#4C5921', soft: '#EBEEDF' },
  { id: 'plum', nm: 'Prune', brand: '#3A1F45', brand2: '#5C3470', soft: '#EEE7F2' },
];

const baseFees = { own: 0, internal: 0, phone: 250, wallet: 250 } as const;

export const BANKS: Record<string, BankProfile> = {
  kota: {
    bankId: 'KTB', bankName: 'Kota Bank', appName: 'Kota Mobile', initials: 'K',
    tagline: { fr: 'Votre banque, sans coupure', en: 'Your bank, uninterrupted' },
    colors: PALETTES[0],
    fees: { ...baseFees },
    limits: { single: 500000, daily: 2000000 },
    features: { phone: true, wallet: true, interbank: true },
  },
  sahel: {
    bankId: 'USB', bankName: 'Union Sahel', appName: 'Union Mobile', initials: 'U',
    tagline: { fr: 'La banque du quotidien', en: 'Everyday banking' },
    colors: PALETTES[1],
    fees: { ...baseFees, phone: 200, wallet: 200 },
    limits: { single: 750000, daily: 3000000 },
    features: { phone: true, wallet: true, interbank: true },
  },
  ccm: {
    bankId: 'CCM', bankName: 'CCM Finance', appName: 'CCM Mobile', initials: 'C',
    tagline: { fr: 'Microfinance de proximité', en: 'Community microfinance' },
    colors: PALETTES[2],
    fees: { ...baseFees, phone: 150, wallet: 150 },
    limits: { single: 250000, daily: 1000000 },
    features: { phone: true, wallet: true, interbank: false },
  },
  custom: {
    bankId: 'CUS', bankName: 'Ma Banque', appName: 'Ma Banque Mobile', initials: 'M',
    tagline: { fr: 'Votre banque, sans coupure', en: 'Your bank, uninterrupted' },
    colors: PALETTES[0],
    fees: { ...baseFees },
    limits: { single: 500000, daily: 2000000 },
    features: { phone: true, wallet: true, interbank: true },
  },
};

export const TIER_LIMITS: Record<Tier, { single: number; daily: number; label: Record<Lang, string> }> = {
  1: { single: 100000, daily: 200000, label: { fr: 'Palier 1 — vérification légère', en: 'Tier 1 — light checks' } },
  2: { single: 500000, daily: 2000000, label: { fr: "Palier 2 — pièce d'identité", en: 'Tier 2 — ID verified' } },
  3: { single: 500000, daily: 2000000, label: { fr: 'Palier 3 — client bancaire', en: 'Tier 3 — bank customer' } },
};

/** Code d'accès au mode présentateur. À changer avant diffusion du lien. */
export const STUDIO_CODE = '2026';

export function suggestNames(bankName: string): string[] {
  const clean = (bankName || '').trim();
  if (!clean) return [];
  const w = clean.split(/\s+/).filter(Boolean);
  const short = w.length > 1 ? w.map((x) => x[0]).join('').toUpperCase() : clean.slice(0, 4).toUpperCase();
  const first = w[0] || clean;
  return [...new Set([`${first} Mobile`, `${short} Connect`, `My ${first}`, `${first} Pay`])].slice(0, 4);
}
