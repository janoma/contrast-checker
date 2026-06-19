import Color, { type ColorInstance } from "color";
import {
  isOutOfGamut,
  oklabToColor,
  oklabToRgbRaw,
  oklchToOklab,
} from "./oklab";

/** Parse a CSS channel value: handles %, "none", and bare numbers. */
function parseCssChannel(s: string, percentScale = 1): number {
  const t = s.trim();
  if (t === "none") return 0;
  if (t.endsWith("%")) return (parseFloat(t) / 100) * percentScale;
  return parseFloat(t);
}

/**
 * Extract 3 or 4 channel tokens from a CSS function like `oklch(L C H / A)`.
 * Supports both space-separated modern syntax and comma-separated legacy syntax.
 */
function extractCssFnArgs(
  input: string,
  fnName: string,
): [string, string, string, string | undefined] | null {
  const modernRe = new RegExp(
    `^${fnName}\\(\\s*([\\d.eE+\\-%]+|none)\\s+([\\d.eE+\\-%]+|none)\\s+([\\d.eE+\\-%]+|none)(?:\\s*/\\s*([\\d.eE+\\-%]+|none))?\\s*\\)$`,
    "i",
  );
  const legacyRe = new RegExp(
    `^${fnName}a?\\(\\s*([\\d.eE+\\-%]+|none)\\s*,\\s*([\\d.eE+\\-%]+|none)\\s*,\\s*([\\d.eE+\\-%]+|none)(?:\\s*,\\s*([\\d.eE+\\-%]+|none))?\\s*\\)$`,
    "i",
  );
  const m = input.trim().match(modernRe) ?? input.trim().match(legacyRe);
  if (!m) return null;
  return [m[1], m[2], m[3], m[4]];
}

export type ParseResult = { color: ColorInstance; outOfGamut: boolean };

/**
 * Universal color string parser. Accepts:
 * - Bare hex or #-prefixed hex (3, 6, or 8 digits)
 * - oklch(L C H [/ A]) — modern CSS, percentage or decimal
 * - oklab(L a b [/ A])
 * - lch(L C H [/ A])  — CIE LCH
 * - lab(L a b [/ A])  — CIE Lab
 * - rgb(), rgba(), hsl(), hsla(), hwb() — delegated to the `color` package
 * - CSS named keywords — delegated to the `color` package
 */
export function parseColorInput(input: string): ParseResult | null {
  const s = input.trim();
  if (!s) return null;

  // 1. Hex (with or without #, 3/6/8 digits)
  const hexRaw = s.startsWith("#") ? s.slice(1) : s;
  if (/^[0-9a-fA-F]{3}$/.test(hexRaw)) {
    const full = hexRaw
      .split("")
      .map((c) => c + c)
      .join("");
    try {
      return { color: Color(`#${full}`), outOfGamut: false };
    } catch {
      /* fall through */
    }
  }
  if (/^[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/.test(hexRaw)) {
    try {
      return { color: Color(`#${hexRaw}`), outOfGamut: false };
    } catch {
      /* fall through */
    }
  }

  // 2. oklch(L C H [/ A])
  const oklchArgs = extractCssFnArgs(s, "oklch");
  if (oklchArgs) {
    // L: 0–1 or 0%–100%; C: 0–0.4 or 0%–100% (100% = 0.4); H: degrees
    const L = parseCssChannel(oklchArgs[0], 1);
    const C = parseCssChannel(oklchArgs[1], 0.4);
    const H = parseCssChannel(oklchArgs[2], 360);
    const A = oklchArgs[3] !== undefined ? parseCssChannel(oklchArgs[3], 1) : 1;
    const [labL, labA, labB] = oklchToOklab(L, C, H);
    const [rRaw, gRaw, bRaw] = oklabToRgbRaw(labL, labA, labB);
    return {
      color: oklabToColor(labL, labA, labB).alpha(Math.max(0, Math.min(1, A))),
      outOfGamut: isOutOfGamut(rRaw, gRaw, bRaw),
    };
  }

  // 3. oklab(L a b [/ A])
  const oklabArgs = extractCssFnArgs(s, "oklab");
  if (oklabArgs) {
    // L: 0–1 or 0%–100%; a,b: -0.5–0.5 or -100%–100% (100% = 0.5)
    const L = parseCssChannel(oklabArgs[0], 1);
    const a = parseCssChannel(oklabArgs[1], 0.5);
    const b = parseCssChannel(oklabArgs[2], 0.5);
    const A = oklabArgs[3] !== undefined ? parseCssChannel(oklabArgs[3], 1) : 1;
    const [rRaw, gRaw, bRaw] = oklabToRgbRaw(L, a, b);
    return {
      color: oklabToColor(L, a, b).alpha(Math.max(0, Math.min(1, A))),
      outOfGamut: isOutOfGamut(rRaw, gRaw, bRaw),
    };
  }

  // 4. lch(L C H [/ A]) — CIE LCH
  const lchArgs = extractCssFnArgs(s, "lch");
  if (lchArgs) {
    try {
      // L: 0–100 or 0%–100%; C: 0–150; H: degrees
      const L = parseCssChannel(lchArgs[0], 100);
      const C = parseCssChannel(lchArgs[1], 150);
      const H = parseCssChannel(lchArgs[2], 360);
      const A = lchArgs[3] !== undefined ? parseCssChannel(lchArgs[3], 1) : 1;
      return {
        color: Color.lch(L, C, H).alpha(Math.max(0, Math.min(1, A))),
        outOfGamut: false,
      };
    } catch {
      /* fall through */
    }
  }

  // 5. lab(L a b [/ A]) — CIE Lab
  const labArgs = extractCssFnArgs(s, "lab");
  if (labArgs) {
    try {
      // L: 0–100 or 0%–100%; a,b: -128–128 or -100%–100%
      const L = parseCssChannel(labArgs[0], 100);
      const a = parseCssChannel(labArgs[1], 128);
      const b = parseCssChannel(labArgs[2], 128);
      const A = labArgs[3] !== undefined ? parseCssChannel(labArgs[3], 1) : 1;
      return {
        color: Color.lab(L, a, b).alpha(Math.max(0, Math.min(1, A))),
        outOfGamut: false,
      };
    } catch {
      /* fall through */
    }
  }

  // 6. Delegate remaining formats (rgb, hsl, hwb, named keywords)
  try {
    return { color: Color(s), outOfGamut: false };
  } catch {
    /* fall through */
  }

  return null;
}
