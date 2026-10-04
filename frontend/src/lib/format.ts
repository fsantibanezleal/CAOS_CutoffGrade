// Numbers in the reader's chosen language, not the browser's locale.
//
// Every figure used to go through `toLocaleString()` with no locale, and uPlot formats its ticks and legend with the
// browser's locale too. On a Spanish-locale browser reading the English page the App printed "price: $9.000/t" and
// "$7.856M", and the axes read "0,2": an English reader takes $9.000/t as nine dollars. The language is the shell's,
// read at call time, so a module-level helper follows a language switch on the next render.

import { useLangStore } from '@fasl-work/caos-app-shell';

export type Lang = 'en' | 'es';

const LOCALE: Record<Lang, string> = { en: 'en-US', es: 'es-CL' };

const current = (): Lang => (useLangStore.getState().lang === 'es' ? 'es' : 'en');

/** A number with a fixed count of decimals, grouped and pointed by the language. */
export function num(v: number, digits = 0, lang: Lang = current()): string {
  return new Intl.NumberFormat(LOCALE[lang], { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(v);
}

/** A chart tick or readout: as many decimals as the value needs, up to six. */
export function tick(v: number, lang: Lang = current()): string {
  return new Intl.NumberFormat(LOCALE[lang], { maximumFractionDigits: 6 }).format(v);
}

/** A grade fraction as a percentage (0.0075 -> 0.750%). */
export const pct = (g: number, digits = 3, lang: Lang = current()): string => `${num(g * 100, digits, lang)}%`;

/** $M, rounded to the million. */
export const money = (v: number, lang: Lang = current()): string => `$${num(Math.round(v), 0, lang)}M`;

/** A metal price, $/t, rounded. */
export const price = (v: number, lang: Lang = current()): string => `$${num(Math.round(v), 0, lang)}/t`;

const STAGE: Record<string, Record<Lang, string>> = {
  mine: { en: 'mine', es: 'mina' },
  mill: { en: 'mill', es: 'molino' },
  market: { en: 'market', es: 'mercado' },
  reserve: { en: 'reserve', es: 'reserva' },
};

export const stageName = (stage: string, lang: Lang = current()): string => STAGE[stage]?.[lang] ?? stage;

/** "mine (28 of 29 years)": the stage that limits production and how many operating years it does. */
export function bindingText(stage: string, years: Record<string, number> | undefined, lang: Lang = current()): string {
  if (!years) return stageName(stage, lang);
  const total = Object.values(years).reduce((a, b) => a + b, 0);
  const n = years[stage] ?? 0;
  return lang === 'es'
    ? `${stageName(stage, lang)} (${n} de ${total} años)`
    : `${stageName(stage, lang)} (${n} of ${total} years)`;
}
