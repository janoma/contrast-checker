import { useCallback, useEffect, useState } from "preact/hooks";

import type { Locales } from "@/i18n/i18n-types";

export function useSampleQuote(locale: Locales): {
  next: (current: string) => void;
  quote: string;
} {
  const [quotes, setQuotes] = useState<string[]>([]);
  const [quote, setQuote] = useState("");

  useEffect(() => {
    void loadQuotes(locale).then((loaded) => {
      setQuotes(loaded);
      setQuote(pickRandom(loaded));
    });
  }, [locale]);

  const next = useCallback(
    (current: string) => {
      if (quotes.length > 1) {
        setQuote(pickDifferent(quotes, current));
      }
    },
    [quotes],
  );

  return { next, quote };
}

async function loadQuotes(locale: Locales): Promise<string[]> {
  switch (locale) {
    case "ar":
      return (await import("@/quotes/ar")).default;
    case "en-GB":
      return (await import("@/quotes/en-GB")).default;
    case "es":
      return (await import("@/quotes/es")).default;
    case "it":
      return (await import("@/quotes/it")).default;
    default:
      return (await import("@/quotes/en")).default;
  }
}

function pickDifferent(arr: string[], current: string): string {
  const pool = arr.filter((q) => q !== current);
  return pickRandom(pool.length > 0 ? pool : arr);
}

function pickRandom(arr: string[]): string {
  return arr[Math.floor(Math.random() * arr.length)];
}
