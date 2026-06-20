import type { ReactNode } from "react";
import type { LocalizedString } from "typesafe-i18n";

import { Fragment } from "react";

/**
 * Regex that captures each <>…</> link block as a single token while
 * preserving the surrounding text segments.
 *
 * For "intro <>label</> rest", split produces:
 *   ["intro ", "<>label</>", " rest"]
 * Odd-indexed elements are link tokens; even-indexed are plain text.
 */
const LINK_TOKEN_RE = /(<>.*?<\/>)/;

interface WrapTranslationProps {
  message: LocalizedString;
  /**
   * Called once per <>…</> placeholder in the message.
   * `index` is 0-based among all links in the string, in source order.
   */
  renderLink: (linkText: string, index: number) => ReactNode;
}

/**
 * Splits a translated string on <>…</> markers and injects React nodes at
 * those positions. Multiple links are supported; renderLink is called with
 * the extracted label and the 0-based link index.
 *
 * Translation convention:
 *   "…prefix <>link label</> suffix…"
 */
export function WrapTranslation({ message, renderLink }: WrapTranslationProps) {
  const parts = (message as string).split(LINK_TOKEN_RE);

  return (
    <>
      {parts.map((part, i) => {
        if (i % 2 === 0) {
          return <Fragment key={i}>{part}</Fragment>;
        }
        // Strip the opening "<>" (2 chars) and closing "</>" (3 chars).
        const label = part.slice(2, -3);
        return <Fragment key={i}>{renderLink(label, (i - 1) / 2)}</Fragment>;
      })}
    </>
  );
}
