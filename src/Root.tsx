import { useEffect, useState } from "preact/hooks";

import type { Locales } from "./i18n/i18n-types";

import App from "./App.tsx";
import TypesafeI18n from "./i18n/i18n-react";
import { useI18nContext } from "./i18n/i18n-react";
import { i18nObject } from "./i18n/i18n-util";
import { loadLocaleAsync } from "./i18n/i18n-util.async";
import { applyLocaleToDocument, detectAppLocale } from "./lib/locale";

export default function Root() {
  const [locale, setLocale] = useState<Locales | null>(null);

  useEffect(() => {
    function switchLocale() {
      const detected = detectAppLocale();
      // Re-apply lang/dir synchronously (it was already applied once at module
      // load) so a runtime languagechange is reflected before the async load.
      applyLocaleToDocument(detected);
      void loadLocaleAsync(detected).then(() => {
        document.title = i18nObject(detected).appTitle();
        setLocale(detected);
      });
    }

    switchLocale();
    window.addEventListener("languagechange", switchLocale);
    return () => {
      window.removeEventListener("languagechange", switchLocale);
    };
  }, []);

  if (locale === null) {
    return null;
  }

  return (
    <TypesafeI18n locale={locale}>
      <LocaleSync locale={locale} />
      <App />
    </TypesafeI18n>
  );
}

/**
 * Bridges Root's locale state into the TypesafeI18n context.
 * TypesafeI18n initialises its internal locale via useState(props.locale), which
 * ignores subsequent prop changes. This component calls the context's own
 * setLocale whenever the detected locale changes, keeping LL and locale in sync.
 * lang/dir are applied outside React (main.tsx + switchLocale).
 */
function LocaleSync({ locale }: { locale: Locales }) {
  const { setLocale: setI18nLocale } = useI18nContext();

  useEffect(() => {
    setI18nLocale(locale);
  }, [locale, setI18nLocale]);

  return null;
}
