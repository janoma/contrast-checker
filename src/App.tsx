import { colorToCss, compositeAlpha } from "@/lib/color-utils";
import { readUrlParams } from "@/lib/url-params";
import { type ColorInstance } from "color";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ColorPanel } from "./components/ColorPanel";
import { PreviewSection } from "./components/PreviewSection";

const SAMPLE_TEXT =
  "I will not say 'do not weep,' for not all tears are an evil.";

export default function App() {
  const init = useMemo(() => readUrlParams(), []);
  const [fgColor, setFgColor] = useState<ColorInstance>(init.fgColor);
  const [bgColor, setBgColor] = useState<ColorInstance>(init.bgColor);

  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("fcolor", fgColor.hex().slice(1));
    url.searchParams.set("bcolor", bgColor.hex().slice(1));
    url.searchParams.set("alpha", fgColor.alpha().toFixed(2));
    window.history.replaceState(null, "", url.toString());
  }, [fgColor, bgColor]);

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

  const fgCss = colorToCss(fgColor);
  const bgCss = bgColor.hex();

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

      <div className="grid grid-cols-2 gap-6">
        <ColorPanel
          title="Foreground"
          color={fgColor}
          showAlpha
          onChange={setFgColor}
        />
        <ColorPanel title="Background" color={bgColor} onChange={setBgColor} />
      </div>

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
