import { useEffect, useState } from "preact/hooks";

import type { Locales } from "@/i18n/i18n-types";

export function useSampleQuote(locale: Locales): string {
  const [quote, setQuote] = useState("");

  useEffect(() => {
    void loadQuotes(locale).then((loaded) => {
      setQuote(pickRandom(loaded));
    });
  }, [locale]);

  return quote;
}

async function loadQuotes(locale: Locales): Promise<string[]> {
  switch (locale) {
    case "ar":
      return (await import("@/quotes/ar")).default;
    case "de":
      return (await import("@/quotes/de")).default;
    case "en-GB":
      return (await import("@/quotes/en-GB")).default;
    case "es":
      return (await import("@/quotes/es")).default;
    case "fr":
      return (await import("@/quotes/fr")).default;
    case "it":
      return (await import("@/quotes/it")).default;
    case "ja":
      return (await import("@/quotes/ja")).default;
    case "nl":
      return (await import("@/quotes/nl")).default;
    case "pt":
      return (await import("@/quotes/pt")).default;
    case "pt-BR":
      return (await import("@/quotes/pt-BR")).default;
    case "zh":
      return (await import("@/quotes/zh")).default;
    default:
      return (await import("@/quotes/en")).default;
  }
}

function pickRandom(arr: string[]): string {
  return arr[Math.floor(Math.random() * arr.length)];
}
