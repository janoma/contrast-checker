import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Slider } from "@/components/ui/slider";
import Color, { type ColorInstance } from "color";
import { Check, Copy } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

const SAMPLE_TEXT =
  "I will not say ‘do not weep,’ for not all tears are an evil.";

// ── Oklab / OKLCH math ─────────────────────────────────────────────────────
// Reference: https://bottosson.github.io/posts/oklab/

function srgbToLinear(c: number): number {
  const x = c / 255;
  return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
}

function linearToSrgbClamped(c: number): number {
  const v = c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055;
  return Math.max(0, Math.min(1, v)) * 255;
}

/** sRGB [0,255] → Oklab. */
function rgbToOklab(r: number, g: number, b: number): [number, number, number] {
  const lr = srgbToLinear(r);
  const lg = srgbToLinear(g);
  const lb = srgbToLinear(b);
  const l = Math.cbrt(
    0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb,
  );
  const m = Math.cbrt(
    0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb,
  );
  const s = Math.cbrt(
    0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb,
  );
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

/** Oklab → raw sRGB [0,255] (not clamped — caller checks out-of-gamut). */
function oklabToRgbRaw(
  L: number,
  a: number,
  b: number,
): [number, number, number] {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;
  const l = l_ ** 3;
  const m = m_ ** 3;
  const s = s_ ** 3;
  return [
    (4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s) * 255,
    (-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s) * 255,
    (-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s) * 255,
  ];
}

/** Oklab → ColorInstance (clamped to sRGB). */
function oklabToColor(L: number, a: number, b: number): ColorInstance {
  const [r, g, bl] = oklabToRgbRaw(L, a, b);
  return Color.rgb(
    linearToSrgbClamped(r / 255),
    linearToSrgbClamped(g / 255),
    linearToSrgbClamped(bl / 255),
  );
}

function oklabToOklch(
  L: number,
  a: number,
  b: number,
): [number, number, number] {
  const C = Math.sqrt(a * a + b * b);
  const H = (Math.atan2(b, a) * 180) / Math.PI;
  return [L, C, H < 0 ? H + 360 : H];
}

function oklchToOklab(
  L: number,
  C: number,
  H: number,
): [number, number, number] {
  const hr = (H * Math.PI) / 180;
  return [L, C * Math.cos(hr), C * Math.sin(hr)];
}

/** Return true when any raw (pre-clamp) RGB channel is outside [0, 255]. */
function isOutOfGamut(r: number, g: number, b: number): boolean {
  return (
    r < -0.5 || r > 255.5 || g < -0.5 || g > 255.5 || b < -0.5 || b > 255.5
  );
}

/** ColorInstance → OKLCH [L, C, H]. */
function toOklch(c: ColorInstance): [number, number, number] {
  const [L, a, b] = rgbToOklab(c.red(), c.green(), c.blue());
  return oklabToOklch(L, a, b);
}

/** ColorInstance → Oklab [L, a, b]. */
function toOklab(c: ColorInstance): [number, number, number] {
  return rgbToOklab(c.red(), c.green(), c.blue());
}

// ── CSS color string parser ────────────────────────────────────────────────

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
  // Matches: fn(ch1 ch2 ch3) or fn(ch1 ch2 ch3 / ch4) (modern space syntax)
  //          fn(ch1, ch2, ch3) or fn(ch1, ch2, ch3, ch4) (legacy comma syntax)
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

type ParseResult = { color: ColorInstance; outOfGamut: boolean };

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
function parseColorInput(input: string): ParseResult | null {
  const s = input.trim();
  if (!s) return null;

  // ── 1. Hex (with or without #, 3/6/8 digits) ───────────────────────────
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

  // ── 2. oklch(L C H [/ A]) ──────────────────────────────────────────────
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

  // ── 3. oklab(L a b [/ A]) ──────────────────────────────────────────────
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

  // ── 4. lch(L C H [/ A]) — CIE LCH ─────────────────────────────────────
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

  // ── 5. lab(L a b [/ A]) — CIE Lab ──────────────────────────────────────
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

  // ── 6. Delegate remaining formats (rgb, hsl, hwb, named keywords) ───────
  try {
    return { color: Color(s), outOfGamut: false };
  } catch {
    /* fall through */
  }

  return null;
}

// ── Format display helpers ─────────────────────────────────────────────────

/** Format a finite number to d decimal places; NaN/Infinity → "0". */
function num(v: number, d = 2): string {
  return isFinite(v) ? v.toFixed(d) : "0";
}

/** Hue is "none" for achromatic colors (C ≈ 0) to match CSS spec. */
function fmtHue(C: number, H: number): string {
  return C < 0.0002 || !isFinite(H) ? "none" : num(H, 1);
}

function formatHex(c: ColorInstance): string {
  const a = c.alpha();
  return a < 1 ? c.hexa().toUpperCase() : c.hex().toUpperCase();
}

function formatRgb(c: ColorInstance): string {
  const r = Math.round(c.red()).toString();
  const g = Math.round(c.green()).toString();
  const b = Math.round(c.blue()).toString();
  const a = c.alpha();
  return a < 1 ? `rgba(${r}, ${g}, ${b}, ${num(a)})` : `rgb(${r} ${g} ${b})`;
}

function formatHsl(c: ColorInstance): string {
  const arr = c.hsl().array() as [number, number, number];
  const a = c.alpha();
  const h = num(arr[0], 1);
  const s = num(arr[1], 1);
  const l = num(arr[2], 1);
  return a < 1
    ? `hsla(${h}, ${s}%, ${l}%, ${num(a)})`
    : `hsl(${h} ${s}% ${l}%)`;
}

function formatHwb(c: ColorInstance): string {
  const arr = c.hwb().array() as [number, number, number];
  const a = c.alpha();
  const base = `hwb(${num(arr[0], 1)} ${num(arr[1], 1)}% ${num(arr[2], 1)}%)`;
  return a < 1 ? `${base} / ${num(a)}` : base;
}

function formatOklch(c: ColorInstance): string {
  const [L, C, H] = toOklch(c);
  const a = c.alpha();
  const lStr = num(L, 4);
  const cStr = num(C, 4);
  const hStr = fmtHue(C, H);
  return a < 1
    ? `oklch(${lStr} ${cStr} ${hStr} / ${num(a)})`
    : `oklch(${lStr} ${cStr} ${hStr})`;
}

function formatOklab(c: ColorInstance): string {
  const [L, a, b] = toOklab(c);
  const alpha = c.alpha();
  const lStr = num(L, 4);
  const aStr = num(a, 4);
  const bStr = num(b, 4);
  return alpha < 1
    ? `oklab(${lStr} ${aStr} ${bStr} / ${num(alpha)})`
    : `oklab(${lStr} ${aStr} ${bStr})`;
}

function formatLch(c: ColorInstance): string {
  const arr = c.lch().array() as [number, number, number];
  const a = c.alpha();
  const lStr = num(arr[0], 2);
  const cStr = num(arr[1], 2);
  const hStr = fmtHue(arr[1], arr[2]);
  return a < 1
    ? `lch(${lStr} ${cStr} ${hStr} / ${num(a)})`
    : `lch(${lStr} ${cStr} ${hStr})`;
}

function formatLab(c: ColorInstance): string {
  const arr = c.lab().array() as [number, number, number];
  const a = c.alpha();
  const lStr = num(arr[0], 2);
  const aStr = num(arr[1], 2);
  const bStr = num(arr[2], 2);
  return a < 1
    ? `lab(${lStr} ${aStr} ${bStr} / ${num(a)})`
    : `lab(${lStr} ${aStr} ${bStr})`;
}

// ── General utilities ──────────────────────────────────────────────────────

/** CSS color string suitable for use in `style` props. */
function colorToCss(c: ColorInstance): string {
  const a = c.alpha();
  if (a < 1) {
    const r = Math.round(c.red()).toString();
    const g = Math.round(c.green()).toString();
    const b = Math.round(c.blue()).toString();
    return `rgba(${r},${g},${b},${a.toFixed(2)})`;
  }
  return c.hex();
}

/** HSL-based gradient for the lightness slider track. */
function lightnessGradientFromColor(c: ColorInstance): string {
  try {
    const h = c.hue().toFixed(1);
    const s = c.saturationl().toFixed(1);
    return `linear-gradient(to right, hsl(${h},${s}%,0%), hsl(${h},${s}%,50%), hsl(${h},${s}%,100%))`;
  } catch {
    return "linear-gradient(to right,#000,#fff)";
  }
}

/** Alpha-composite fg over bg (both opaque RGB result). */
function compositeAlpha(fg: ColorInstance, bg: ColorInstance): ColorInstance {
  const a = fg.alpha();
  if (a >= 1) return fg;
  return Color.rgb(
    fg.red() * a + bg.red() * (1 - a),
    fg.green() * a + bg.green() * (1 - a),
    fg.blue() * a + bg.blue() * (1 - a),
  );
}

// ── Badge / WCAG row ───────────────────────────────────────────────────────

function Badge({ pass }: { pass: boolean }) {
  return (
    <span
      className={`inline-flex items-center px-3 py-0.5 rounded-full text-xs font-bold tracking-wide text-white ${
        pass ? "bg-green-600" : "bg-red-600"
      }`}
    >
      {pass ? "Pass" : "Fail"}
    </span>
  );
}

function WcagRow({ label, pass }: { label: string; pass: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-medium w-24 shrink-0">{label}:</span>
      <Badge pass={pass} />
    </div>
  );
}

// ── ColorFormats collapsible ───────────────────────────────────────────────

function FormatRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(() => {
    void navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 1800);
  }, [value]);

  return (
    <div className="flex items-center gap-2 py-1.5 border-b border-gray-100 last:border-b-0">
      <span className="text-xs font-semibold text-gray-400 w-14 shrink-0 uppercase tracking-wide">
        {label}
      </span>
      <span className="flex-1 font-mono text-xs text-gray-800 break-all leading-relaxed">
        {value}
      </span>
      <button
        onClick={copy}
        title={`Copy ${label}`}
        className="shrink-0 p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
      >
        {copied ? (
          <Check size={12} className="text-green-500" />
        ) : (
          <Copy size={12} />
        )}
      </button>
    </div>
  );
}

function ColorFormats({ color }: { color: ColorInstance }) {
  const [open, setOpen] = useState(false);

  const formats = useMemo(
    () => [
      { label: "HEX", value: formatHex(color) },
      { label: "RGB", value: formatRgb(color) },
      { label: "HSL", value: formatHsl(color) },
      { label: "HWB", value: formatHwb(color) },
      { label: "OKLCH", value: formatOklch(color) },
      { label: "OKLAB", value: formatOklab(color) },
      { label: "LCH", value: formatLch(color) },
      { label: "LAB", value: formatLab(color) },
    ],
    [color],
  );

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="w-full flex items-center justify-center gap-1 text-xs text-gray-400 hover:text-gray-600 py-1 transition-colors cursor-pointer">
        <span>Color formats</span>
        <span className="select-none">{open ? "▴" : "▾"}</span>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-2 border rounded-md bg-gray-50 px-2 pb-1 pt-0.5">
          {formats.map((f) => (
            <FormatRow key={f.label} label={f.label} value={f.value} />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

// ── Color Panel ─────────────────────────────────────────────────────────────

interface ColorPanelProps {
  title: string;
  color: ColorInstance;
  showAlpha?: boolean;
  onChange: (color: ColorInstance) => void;
}

function ColorPanel({
  title,
  color,
  showAlpha = false,
  onChange,
}: ColorPanelProps) {
  // null = not editing (display derived value), string = user is typing
  const [rawInput, setRawInput] = useState<string | null>(null);
  const [rawAlpha, setRawAlpha] = useState<string | null>(null);
  const [outOfGamut, setOutOfGamut] = useState(false);

  const alpha = color.alpha();

  // When not editing, show the hex representation of the current color
  const derivedDisplay =
    alpha < 1 && showAlpha
      ? color.hexa().toUpperCase()
      : color.hex().toUpperCase();
  const displayInput = rawInput ?? derivedDisplay;
  const displayAlpha = rawAlpha ?? alpha.toFixed(2);

  const applyInput = useCallback(
    (val: string) => {
      const result = parseColorInput(val);
      if (!result) {
        setRawInput(null);
        return;
      }
      // Background is always opaque; foreground preserves parsed alpha.
      const finalColor = showAlpha ? result.color : result.color.alpha(1);
      onChange(finalColor);
      setOutOfGamut(result.outOfGamut);
      setRawInput(null);
    },
    [showAlpha, onChange],
  );

  const applyAlpha = useCallback(
    (val: string) => {
      const v = parseFloat(val);
      if (!isNaN(v)) {
        onChange(color.alpha(Math.max(0, Math.min(1, v))));
      }
      setRawAlpha(null);
    },
    [color, onChange],
  );

  const lightness = color.lightness();

  const handleLightnessChange = useCallback(
    (value: number) => {
      try {
        // Preserve alpha when adjusting lightness
        onChange(color.lightness(value).alpha(color.alpha()));
      } catch {
        // ignore invalid color states
      }
    },
    [color, onChange],
  );

  const gradient = lightnessGradientFromColor(color);
  const pickerHex = color.hex(); // #RRGGBB, no alpha

  return (
    <div className="border rounded-lg p-4 space-y-3 bg-white">
      <h2 className="text-center font-semibold text-sm uppercase tracking-wide text-gray-600">
        {title}
      </h2>

      {/* Free-form color input */}
      <div>
        <p className="text-xs text-muted-foreground text-center mb-1">
          Color Value
        </p>
        <input
          className="w-full border rounded px-2 py-1.5 text-sm font-mono outline-none focus:ring-1 focus:ring-blue-300"
          value={displayInput}
          spellCheck={false}
          placeholder="#RRGGBB · rgb() · oklch() · …"
          onFocus={(e) => {
            e.target.select();
          }}
          onChange={(e) => {
            setRawInput(e.target.value);
          }}
          onBlur={() => {
            applyInput(displayInput);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") applyInput(displayInput);
          }}
        />
      </div>

      {/* Out-of-gamut warning */}
      {outOfGamut && (
        <div className="flex items-start gap-1.5 bg-amber-50 border border-amber-200 rounded p-2 text-xs text-amber-800 leading-snug">
          <span className="shrink-0 mt-px">⚠</span>
          <span>
            This color is outside sRGB. The closest sRGB approximation is shown.
            WCAG contrast is calculated on the sRGB version.
          </span>
        </div>
      )}

      {/* sRGB picker + alpha */}
      <div className="flex gap-3 items-end">
        <div className="flex-1">
          <p className="text-xs text-muted-foreground text-center mb-1">
            Color Picker
          </p>
          <input
            type="color"
            value={pickerHex}
            className="w-full h-10 cursor-pointer rounded border p-0.5"
            onChange={(e) => {
              const picked = Color(e.target.value);
              onChange(showAlpha ? picked.alpha(alpha) : picked);
            }}
          />
        </div>
        {showAlpha && (
          <div className="w-16">
            <p className="text-xs text-muted-foreground text-center mb-1">
              Alpha
            </p>
            <input
              className="w-full border rounded px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-1 focus:ring-blue-300"
              value={displayAlpha}
              onChange={(e) => {
                setRawAlpha(e.target.value);
              }}
              onBlur={() => {
                applyAlpha(displayAlpha);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") applyAlpha(displayAlpha);
              }}
            />
          </div>
        )}
      </div>

      {/* Lightness slider with gradient track */}
      <div>
        <p className="text-xs text-muted-foreground text-center mb-2">
          Lightness
        </p>
        <div className="relative">
          <div
            aria-hidden
            className="absolute inset-0 flex items-center pointer-events-none"
          >
            <div
              className="w-full h-8 rounded"
              style={{ background: gradient }}
            />
          </div>
          <Slider
            value={[lightness]}
            min={0}
            max={100}
            step={0.1}
            onValueChange={(value) => {
              handleLightnessChange(
                typeof value === "number" ? value : value[0],
              );
            }}
            className={[
              "relative z-10",
              "**:data-[slot=slider-track]:bg-transparent",
              "**:data-[slot=slider-track]:h-8",
              "**:data-[slot=slider-range]:bg-transparent",
              "**:data-[slot=slider-thumb]:size-5",
              "**:data-[slot=slider-thumb]:bg-white",
              "**:data-[slot=slider-thumb]:border-2",
              "**:data-[slot=slider-thumb]:border-muted-foreground",
              "**:data-[slot=slider-thumb]:shadow-md",
              "**:data-[slot=slider-thumb]:rounded-sm",
            ].join(" ")}
          />
        </div>
      </div>

      {/* Color formats collapsible */}
      <ColorFormats color={color} />
    </div>
  );
}

// ── Preview Section ────────────────────────────────────────────────────────

interface PreviewSectionProps {
  heading: string;
  wcagRows: { label: string; pass: boolean }[];
  fgCss: string;
  bgCss: string;
  previewContent: React.ReactNode;
}

function PreviewSection({
  heading,
  wcagRows,
  fgCss,
  bgCss,
  previewContent,
}: PreviewSectionProps) {
  return (
    <section className="space-y-3">
      <h2 className="font-heading text-xl font-bold text-red-700 border-b border-red-200 pb-1">
        {heading}
      </h2>
      <div className="flex items-stretch gap-6">
        <div className="space-y-2 w-36 shrink-0 flex flex-col justify-center">
          {wcagRows.map((r) => (
            <WcagRow key={r.label} label={r.label} pass={r.pass} />
          ))}
        </div>
        <div
          className="flex-1 rounded-md overflow-hidden border"
          style={{ backgroundColor: bgCss }}
        >
          <div className="p-5" style={{ color: fgCss }}>
            {previewContent}
          </div>
        </div>
      </div>
    </section>
  );
}

// ── URL helpers ────────────────────────────────────────────────────────────

function readUrlParams(): { fgColor: ColorInstance; bgColor: ColorInstance } {
  const p = new URLSearchParams(window.location.search);
  const rawFg = p.get("fcolor") ?? "000000";
  const rawBg = p.get("bcolor") ?? "FFFFFF";
  const rawAlpha = parseFloat(p.get("alpha") ?? "1");
  const alpha = isNaN(rawAlpha) ? 1 : Math.max(0, Math.min(1, rawAlpha));

  const fgResult = parseColorInput(rawFg) ?? {
    color: Color("#000000"),
    outOfGamut: false,
  };
  const bgResult = parseColorInput(rawBg) ?? {
    color: Color("#FFFFFF"),
    outOfGamut: false,
  };

  return {
    fgColor: fgResult.color.alpha(alpha),
    bgColor: bgResult.color.alpha(1),
  };
}

// ── App ────────────────────────────────────────────────────────────────────

export default function App() {
  const init = useMemo(() => readUrlParams(), []);
  const [fgColor, setFgColor] = useState<ColorInstance>(init.fgColor);
  const [bgColor, setBgColor] = useState<ColorInstance>(init.bgColor);

  // Sync colors to URL (store as hex so permalinks are stable)
  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("fcolor", fgColor.hex().slice(1));
    url.searchParams.set("bcolor", bgColor.hex().slice(1));
    url.searchParams.set("alpha", fgColor.alpha().toFixed(2));
    window.history.replaceState(null, "", url.toString());
  }, [fgColor, bgColor]);

  // Composite fg over bg before computing contrast (WCAG requires opaque colors)
  const effectiveFg = useMemo(
    () => compositeAlpha(fgColor, bgColor),
    [fgColor, bgColor],
  );

  const contrastRatio = useMemo(() => {
    try {
      return effectiveFg.contrast(bgColor);
    } catch {
      return 1;
    }
  }, [effectiveFg, bgColor]);

  // CSS strings for preview sections
  const fgCss = colorToCss(fgColor);
  const bgCss = bgColor.hex();

  // WCAG thresholds
  const normalAA = contrastRatio >= 4.5;
  const normalAAA = contrastRatio >= 7;
  const largeAA = contrastRatio >= 3;
  const largeAAA = contrastRatio >= 4.5;
  const graphicsAA = contrastRatio >= 3;

  const permalink = `${window.location.origin}${window.location.pathname}?fcolor=${fgColor.hex().slice(1)}&bcolor=${bgColor.hex().slice(1)}&alpha=${fgColor.alpha().toFixed(2)}`;

  const copyPermalink = useCallback(() => {
    void navigator.clipboard.writeText(permalink);
  }, [permalink]);

  return (
    <div className="max-w-4xl mx-auto border rounded-lg p-6 my-8 bg-gray-50 space-y-8">
      <header>
        <h1 className="font-heading text-3xl font-bold">Contrast Checker</h1>
        <p className="text-sm text-muted-foreground mt-1">
          WCAG 2.x contrast ratio calculator. Accepts HEX, RGB, HSL, HWB, OKLCH,
          OKLAB, LCH, and LAB color formats.
        </p>
      </header>

      {/* Color inputs */}
      <div className="grid grid-cols-2 gap-6">
        <ColorPanel
          title="Foreground"
          color={fgColor}
          showAlpha
          onChange={setFgColor}
        />
        <ColorPanel title="Background" color={bgColor} onChange={setBgColor} />
      </div>

      {/* Contrast ratio */}
      <div className="flex flex-col items-center gap-2">
        <div className="border rounded-xl px-12 py-5 text-center bg-white shadow-sm">
          <p className="text-sm text-muted-foreground mb-1 font-medium">
            Contrast Ratio
          </p>
          <p className="text-6xl font-bold tracking-tight leading-none">
            {contrastRatio.toFixed(2)}
            <span className="font-normal text-muted-foreground">:1</span>
          </p>
        </div>
        <button
          onClick={copyPermalink}
          className="text-sm text-blue-600 hover:underline cursor-pointer bg-transparent border-none p-0"
        >
          permalink
        </button>
      </div>

      {/* Normal Text */}
      <PreviewSection
        heading="Normal Text"
        wcagRows={[
          { label: "WCAG AA", pass: normalAA },
          { label: "WCAG AAA", pass: normalAAA },
        ]}
        fgCss={fgCss}
        bgCss={bgCss}
        previewContent={
          <p className="text-base leading-relaxed">{SAMPLE_TEXT}</p>
        }
      />

      {/* Large Text */}
      <PreviewSection
        heading="Large Text"
        wcagRows={[
          { label: "WCAG AA", pass: largeAA },
          { label: "WCAG AAA", pass: largeAAA },
        ]}
        fgCss={fgCss}
        bgCss={bgCss}
        previewContent={
          <p className="text-2xl font-bold leading-snug">{SAMPLE_TEXT}</p>
        }
      />

      {/* Graphical objects */}
      <PreviewSection
        heading="Graphical Objects and User Interface Components"
        wcagRows={[{ label: "WCAG AA", pass: graphicsAA }]}
        fgCss={fgCss}
        bgCss={bgCss}
        previewContent={
          <div className="flex flex-col items-center gap-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="36"
              height="36"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-label="Star"
            >
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            <input
              type="text"
              defaultValue="Text Input"
              className="rounded px-3 py-1.5 text-sm bg-white text-gray-900"
              style={{ border: `2px solid ${fgCss}` }}
            />
          </div>
        }
      />

      {/* Explanation */}
      <section className="text-sm text-gray-600 bg-white border rounded-lg p-4 space-y-2">
        <h2 className="font-semibold text-gray-800 text-base">Explanation</h2>
        <p>
          Enter a color in any supported format. The input is parsed
          automatically. Use the sRGB Picker as a convenient starting point,
          then refine with the text input. The Lightness slider adjusts HSL
          lightness. "Color formats" shows the current color in all formats,
          each with a copy button.
        </p>
        <ul className="list-disc list-inside space-y-1 mt-1">
          <li>
            <strong>WCAG AA</strong> — ≥ 4.5:1 for normal text, ≥ 3:1 for large
            text and graphics.
          </li>
          <li>
            <strong>WCAG AAA</strong> — ≥ 7:1 for normal text, ≥ 4.5:1 for large
            text.
          </li>
          <li>
            Large text: 18 pt (24 px) or larger, or 14 pt bold (≈ 18.67 px) or
            larger.
          </li>
          <li>
            OKLCH / OKLAB colors outside the sRGB gamut are clamped. WCAG
            contrast is always computed on the sRGB-clamped version.
          </li>
        </ul>
      </section>
    </div>
  );
}
