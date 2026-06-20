import { navigatorDetector } from "typesafe-i18n/detectors";

import type { Locales } from "../i18n/i18n-types";

import { detectLocale } from "../i18n/i18n-util";

type Direction = "ltr" | "rtl";

interface LocaleTextInfo {
  direction: Direction;
}

// `textInfo` / `getTextInfo` are not yet in the ES2023 lib typings, so describe
// the shape we rely on. Both forms exist depending on the engine version.
interface LocaleWithTextInfo {
  getTextInfo?: () => LocaleTextInfo;
  textInfo?: LocaleTextInfo;
}

// Fallback for engines without Intl.Locale.textInfo (CLDR right-to-left scripts).
const RTL_LANGUAGES = new Set([
  "ar",
  "arc",
  "ckb",
  "dv",
  "fa",
  "ha",
  "he",
  "khw",
  "ks",
  "ps",
  "sd",
  "ur",
  "uz-AF",
  "yi",
]);

export function applyLocaleToDocument(locale: Locales): void {
  document.documentElement.lang = locale;
  document.documentElement.dir = getLocaleDirection(locale);
}

export function detectAppLocale(): Locales {
  return detectLocale(navigatorDetector);
}

/**
 * Resolves the writing direction for a locale using the native Intl data
 * (CLDR-backed), with a primary-subtag lookup as a fallback for older engines.
 */
export function getLocaleDirection(locale: string): Direction {
  try {
    const intlLocale = new Intl.Locale(locale) as Intl.Locale &
      LocaleWithTextInfo;
    const info = intlLocale.getTextInfo?.() ?? intlLocale.textInfo;
    if (info?.direction) {
      return info.direction;
    }
  } catch {
    // Invalid locale string; fall through to the lookup table.
  }

  const primary = locale.split("-")[0].toLowerCase();
  if (RTL_LANGUAGES.has(locale) || RTL_LANGUAGES.has(primary)) {
    return "rtl";
  }
  return "ltr";
}
