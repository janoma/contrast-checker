import { Slider } from "@/components/ui/slider";
import Color, { type ColorInstance } from "color";
import { useCallback, useEffect, useMemo, useState } from "react";

const SAMPLE_TEXT =
  "I will not say do not weep, for not all tears are an evil.";

// ── Utilities ──────────────────────────────────────────────────────────────

function parseHexInput(raw: string): { hex6: string; alpha: number } | null {
  const s = raw.replace(/[^0-9a-fA-F]/g, "").toUpperCase();
  if (s.length === 6) return { hex6: s, alpha: 1 };
  if (s.length === 8)
    return { hex6: s.slice(0, 6), alpha: parseInt(s.slice(6), 16) / 255 };
  return null;
}

function alphaToHex(a: number): string {
  return Math.round(Math.max(0, Math.min(1, a)) * 255)
    .toString(16)
    .padStart(2, "0")
    .toUpperCase();
}

function safeColor(hex6: string): ColorInstance {
  try {
    return Color(`#${hex6}`);
  } catch {
    return Color("#000000");
  }
}

/** Composite a semi-transparent foreground onto an opaque background. */
function compositeAlpha(
  fg: ColorInstance,
  bg: ColorInstance,
  alpha: number,
): ColorInstance {
  if (alpha >= 1) return fg;
  return Color.rgb(
    fg.red() * alpha + bg.red() * (1 - alpha),
    fg.green() * alpha + bg.green() * (1 - alpha),
    fg.blue() * alpha + bg.blue() * (1 - alpha),
  );
}

/** CSS gradient from darkest → lightest at the color's hue/saturation. */
function lightnessGradient(hex6: string): string {
  try {
    const c = safeColor(hex6);
    const h = c.hue().toFixed(1);
    const s = c.saturationl().toFixed(1);
    return `linear-gradient(to right, hsl(${h},${s}%,0%), hsl(${h},${s}%,50%), hsl(${h},${s}%,100%))`;
  } catch {
    return "linear-gradient(to right,#000,#fff)";
  }
}

function buildFgCss(hex6: string, alpha: number): string {
  if (alpha < 1) {
    const c = safeColor(hex6);
    const r = Math.round(c.red()).toString();
    const g = Math.round(c.green()).toString();
    const b = Math.round(c.blue()).toString();
    return `rgba(${r},${g},${b},${alpha.toFixed(2)})`;
  }
  return `#${hex6}`;
}

// ── Badge ──────────────────────────────────────────────────────────────────

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

// ── Color Panel ─────────────────────────────────────────────────────────────

interface ColorPanelProps {
  title: string;
  hex6: string;
  alpha: number;
  showAlpha?: boolean;
  onHex6Change: (hex6: string) => void;
  onAlphaChange: (alpha: number) => void;
}

function ColorPanel({
  title,
  hex6,
  alpha,
  showAlpha = false,
  onHex6Change,
  onAlphaChange,
}: ColorPanelProps) {
  // null = not editing (show derived value); string = user is typing
  const [rawHex, setRawHex] = useState<string | null>(null);
  const [rawAlpha, setRawAlpha] = useState<string | null>(null);

  const derivedHexDisplay =
    showAlpha && alpha < 1 ? `${hex6}${alphaToHex(alpha)}` : hex6;
  const hexDisplay = rawHex ?? derivedHexDisplay;
  const alphaDisplay = rawAlpha ?? alpha.toFixed(1);

  const applyHexInput = useCallback(
    (val: string) => {
      const parsed = parseHexInput(val);
      if (!parsed) {
        setRawHex(null);
        return;
      }
      onHex6Change(parsed.hex6);
      if (showAlpha) {
        onAlphaChange(parsed.alpha);
      }
      setRawHex(null);
    },
    [showAlpha, onHex6Change, onAlphaChange],
  );

  const applyAlphaInput = useCallback(
    (val: string) => {
      const v = parseFloat(val);
      if (!isNaN(v)) {
        onAlphaChange(Math.max(0, Math.min(1, v)));
      }
      setRawAlpha(null);
    },
    [onAlphaChange],
  );

  const lightness = useMemo(() => safeColor(hex6).lightness(), [hex6]);

  const handleLightnessChange = useCallback(
    (vals: number[]) => {
      try {
        const newHex = safeColor(hex6)
          .lightness(vals[0])
          .hex()
          .slice(1)
          .toUpperCase();
        onHex6Change(newHex);
      } catch {
        // ignore invalid colors
      }
    },
    [hex6, onHex6Change],
  );

  const gradient = lightnessGradient(hex6);

  return (
    <div className="border rounded-lg p-4 space-y-3 bg-white">
      <h2 className="text-center font-semibold text-sm uppercase tracking-wide text-gray-600">
        {title}
      </h2>

      {/* Hex input */}
      <div>
        <p className="text-xs text-gray-500 text-center mb-1">Hex Value</p>
        <div className="flex items-center border rounded overflow-hidden">
          <span className="px-2 py-1.5 bg-gray-50 border-r text-gray-500 text-sm font-mono select-none">
            #
          </span>
          <input
            className="flex-1 px-2 py-1.5 text-sm font-mono outline-none uppercase"
            value={hexDisplay}
            maxLength={8}
            spellCheck={false}
            onChange={(e) => {
              setRawHex(
                e.target.value.replace(/[^0-9a-fA-F]/g, "").toUpperCase(),
              );
            }}
            onBlur={() => {
              applyHexInput(hexDisplay);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") applyHexInput(hexDisplay);
            }}
          />
        </div>
      </div>

      {/* Color picker + alpha */}
      <div className="flex gap-3 items-end">
        <div className="flex-1">
          <p className="text-xs text-gray-500 text-center mb-1">Color Picker</p>
          <input
            type="color"
            value={`#${hex6.slice(0, 6)}`}
            className="w-full h-10 cursor-pointer rounded border p-0.5"
            onChange={(e) => {
              onHex6Change(e.target.value.slice(1).toUpperCase());
            }}
          />
        </div>
        {showAlpha && (
          <div className="w-16">
            <p className="text-xs text-gray-500 text-center mb-1">Alpha</p>
            <input
              className="w-full border rounded px-2 py-1.5 text-sm text-center"
              value={alphaDisplay}
              onChange={(e) => {
                setRawAlpha(e.target.value);
              }}
              onBlur={() => {
                applyAlphaInput(alphaDisplay);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") applyAlphaInput(alphaDisplay);
              }}
            />
          </div>
        )}
      </div>

      {/* Lightness slider with gradient track */}
      <div>
        <p className="text-xs text-gray-500 text-center mb-2">Lightness</p>
        <div className="relative">
          {/* Gradient background behind the transparent track */}
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
            onValueChange={handleLightnessChange}
            className={[
              "relative z-10",
              "**:data-[slot=slider-track]:bg-transparent",
              "**:data-[slot=slider-track]:h-8",
              "**:data-[slot=slider-range]:bg-transparent",
              "**:data-[slot=slider-thumb]:size-5",
              "**:data-[slot=slider-thumb]:bg-white",
              "**:data-[slot=slider-thumb]:border-2",
              "**:data-[slot=slider-thumb]:border-gray-400",
              "**:data-[slot=slider-thumb]:shadow-md",
              "**:data-[slot=slider-thumb]:rounded-sm",
            ].join(" ")}
          />
        </div>
      </div>
    </div>
  );
}

// ── Preview Section ──────────────────────────────────────────────────────────

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

// ── App ──────────────────────────────────────────────────────────────────────

function readUrlParams(): { fgHex: string; fgAlpha: number; bgHex: string } {
  const p = new URLSearchParams(window.location.search);
  const raw = (key: string, fallback: string) =>
    (p.get(key) ?? fallback)
      .replace(/^#/, "")
      .toUpperCase()
      .replace(/[^0-9A-F]/g, "")
      .slice(0, 6) || fallback;
  return {
    fgHex: raw("fcolor", "000000"),
    fgAlpha: Math.max(0, Math.min(1, parseFloat(p.get("alpha") ?? "1") || 1)),
    bgHex: raw("bcolor", "FFFFFF"),
  };
}

export default function App() {
  const init = useMemo(() => readUrlParams(), []);
  const [fgHex, setFgHex] = useState(init.fgHex);
  const [fgAlpha, setFgAlpha] = useState(init.fgAlpha);
  const [bgHex, setBgHex] = useState(init.bgHex);

  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("fcolor", fgHex);
    url.searchParams.set("bcolor", bgHex);
    url.searchParams.set("alpha", fgAlpha.toFixed(2));
    window.history.replaceState(null, "", url.toString());
  }, [fgHex, fgAlpha, bgHex]);

  const fgColor = useMemo(() => safeColor(fgHex), [fgHex]);
  const bgColor = useMemo(() => safeColor(bgHex), [bgHex]);
  const effectiveFg = useMemo(
    () => compositeAlpha(fgColor, bgColor, fgAlpha),
    [fgColor, bgColor, fgAlpha],
  );

  const contrastRatio = useMemo(() => {
    try {
      return effectiveFg.contrast(bgColor);
    } catch {
      return 1;
    }
  }, [effectiveFg, bgColor]);

  const fgCss = buildFgCss(fgHex, fgAlpha);
  const bgCss = `#${bgHex}`;

  const normalAA = contrastRatio >= 4.5;
  const normalAAA = contrastRatio >= 7;
  const largeAA = contrastRatio >= 3;
  const largeAAA = contrastRatio >= 4.5;
  const graphicsAA = contrastRatio >= 3;

  const permalink = `${window.location.origin}${window.location.pathname}?fcolor=${fgHex}&bcolor=${bgHex}&alpha=${fgAlpha.toFixed(2)}`;

  const copyPermalink = useCallback(() => {
    void navigator.clipboard.writeText(permalink);
  }, [permalink]);

  return (
    <div className="prose max-w-4xl mx-auto border rounded-lg p-6 my-8 bg-gray-50 space-y-8">
      <header>
        <h1>Contrast Checker</h1>
        <p>
          WCAG 2.x contrast ratio calculator for foreground and background
          colors.
        </p>
      </header>

      {/* Color inputs */}
      <div className="grid grid-cols-2 gap-6">
        <ColorPanel
          title="Foreground"
          hex6={fgHex}
          alpha={fgAlpha}
          showAlpha
          onHex6Change={setFgHex}
          onAlphaChange={setFgAlpha}
        />
        <ColorPanel
          title="Background"
          hex6={bgHex}
          alpha={1}
          onHex6Change={setBgHex}
          onAlphaChange={() => {
            /* no-op: background has no alpha */
          }}
        />
      </div>

      {/* Contrast ratio */}
      <div className="flex flex-col items-center gap-2">
        <div className="border rounded-xl px-12 py-5 text-center bg-white shadow-sm">
          <p>Contrast Ratio</p>
          <p className="text-6xl font-bold tracking-tight leading-none">
            {contrastRatio.toFixed(2)}
            <span className="font-normal">:1</span>
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
          Enter a foreground and background color in RGB hexadecimal format (6
          or 8 digits) or choose a color using the Color Picker. Enter an Alpha
          value (0–1) to adjust the transparency of the foreground color. Use
          the Lightness slider to adjust the perceived lightness of the color.
        </p>
        <ul className="list-disc list-inside space-y-1 mt-1">
          <li>
            <strong>WCAG AA</strong> requires ≥ 4.5:1 for normal text, ≥ 3:1 for
            large text and graphics.
          </li>
          <li>
            <strong>WCAG AAA</strong> requires ≥ 7:1 for normal text, ≥ 4.5:1
            for large text.
          </li>
          <li>
            Large text is defined as 18 pt (24 px) or larger, or 14 pt (≈ 18.67
            px) bold or larger.
          </li>
        </ul>
      </section>
    </div>
  );
}
