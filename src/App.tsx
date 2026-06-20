import { type ColorInstance } from "color";
import { Check, Copy, ExternalLink } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "preact/hooks";

import { normalizeColorInput } from "@/lib/color-format";
import { colorToCss, compositeAlpha } from "@/lib/color-utils";
import { readUrlParams } from "@/lib/url-params";

import { ColorPanel } from "./components/ColorPanel";
import { PreviewSection } from "./components/PreviewSection";
import { cn } from "./lib/utils";

const SAMPLE_TEXT =
  "I will not say 'do not weep,' for not all tears are an evil.";

export default function App() {
  const init = useMemo(() => readUrlParams(), []);
  const [fgColor, setFgColor] = useState<ColorInstance>(init.fgColor);
  const [bgColor, setBgColor] = useState<ColorInstance>(init.bgColor);
  // The format string the user last confirmed for each panel (null = derived hex)
  const [fgDisplay, setFgDisplay] = useState<null | string>(() =>
    normalizeColorInput(init.fgRaw, init.fgColor),
  );
  const [bgDisplay, setBgDisplay] = useState<null | string>(() =>
    normalizeColorInput(init.bgRaw, init.bgColor),
  );

  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("fcolor", fgDisplay ?? fgColor.hex().slice(1));
    url.searchParams.set("bcolor", bgDisplay ?? bgColor.hex().slice(1));
    url.searchParams.set("alpha", fgColor.alpha().toFixed(2));
    window.history.replaceState(null, "", url.toString());
  }, [fgColor, bgColor, fgDisplay, bgDisplay]);

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

  const [permalinkCopied, setPermalinkCopied] = useState(false);

  const permalinkParams = new URLSearchParams({
    alpha: fgColor.alpha().toFixed(2),
    bcolor: bgDisplay ?? bgColor.hex().slice(1),
    fcolor: fgDisplay ?? fgColor.hex().slice(1),
  });
  const permalink = `${window.location.origin}${window.location.pathname}?${permalinkParams.toString()}`;

  const copyPermalink = useCallback(() => {
    void navigator.clipboard.writeText(permalink);
    setPermalinkCopied(true);
    setTimeout(() => {
      setPermalinkCopied(false);
    }, 1800);
  }, [permalink]);

  return (
    <div className="lg:max-w-[calc(var(--container-5xl)-4rem)] lg:mx-auto lg:border lg:rounded-lg p-3 sm:p-6 lg:my-8 bg-taupe-50">
      <header>
        <h1>Contrast Checker</h1>
        <p className="text-sm text-muted-foreground mt-1">
          WCAG 2.0 and 2.1 contrast ratio calculator. Accepts HEX, RGB, HSL,
          HWB, OKLCH, OKLAB, LCH, and LAB color formats.
        </p>
      </header>

      <main className="space-y-8 my-8" id="main-content">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-sm mx-auto sm:max-w-none">
          <ColorPanel
            color={fgColor}
            displayValue={fgDisplay ?? undefined}
            id="fg-color"
            onChange={setFgColor}
            onCommit={setFgDisplay}
            showAlpha
            title="Foreground"
          />
          <ColorPanel
            color={bgColor}
            displayValue={bgDisplay ?? undefined}
            id="bg-color"
            onChange={setBgColor}
            onCommit={setBgDisplay}
            title="Background"
          />
        </div>

        <div className="flex flex-col items-stretch sm:items-center gap-2 max-w-sm mx-auto sm:max-w-none">
          <div className="border rounded-xl px-12 py-5 text-center bg-background">
            <h2>Contrast Ratio</h2>
            <p className="text-6xl font-bold tracking-tight leading-none">
              {contrastRatio.toFixed(2)}
              <span className="font-normal text-muted-foreground">:1</span>
            </p>
          </div>
          <button
            className={cn(
              "text-sm text-primary-foreground cursor-pointer bg-transparent p-0 inline-flex gap-1.5 items-center",
              "border-b-2 border-double border-primary-foreground",
              "hover:text-accent-foreground hover:border-accent-foreground hover:bg-accent place-self-center",
            )}
            onClick={copyPermalink}
          >
            {permalinkCopied ? (
              <>
                copied!
                <Check className="text-success" size={12} />
              </>
            ) : (
              <>
                permalink
                <Copy size={12} />
              </>
            )}
          </button>
        </div>

        <PreviewSection
          bgCss={bgCss}
          fgCss={fgCss}
          heading="Normal Text"
          previewContent={
            <p className="text-base leading-relaxed">{SAMPLE_TEXT}</p>
          }
          wcagRows={[
            { label: "WCAG AA", pass: normalAA },
            { label: "WCAG AAA", pass: normalAAA },
          ]}
        />

        <PreviewSection
          bgCss={bgCss}
          fgCss={fgCss}
          heading="Large Text"
          previewContent={
            <p className="text-2xl font-bold leading-snug">{SAMPLE_TEXT}</p>
          }
          wcagRows={[
            { label: "WCAG AA", pass: largeAA },
            { label: "WCAG AAA", pass: largeAAA },
          ]}
        />

        <PreviewSection
          bgCss={bgCss}
          fgCss={fgCss}
          heading="Graphical Objects and User Interface Components"
          previewContent={
            <div className="flex flex-col items-center gap-4">
              <svg
                aria-label="Star"
                fill="currentColor"
                height="36"
                viewBox="0 0 24 24"
                width="36"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              <input
                aria-label="Text Input"
                className="rounded px-3 py-1.5 text-sm bg-background text-foreground"
                defaultValue="Text Input"
                style={{ border: `2px solid ${fgCss}` }}
                type="text"
              />
            </div>
          }
          wcagRows={[{ label: "WCAG AA", pass: graphicsAA }]}
        />
      </main>

      <footer className="text-sm text-muted-foreground bg-muted border rounded-lg p-4 mt-16">
        <p>
          Based on the{" "}
          <a
            className={cn(
              "border-b-2 border-double border-primary-foreground text-primary-foreground",
              "hover:text-accent-foreground hover:border-accent-foreground hover:bg-accent",
              "inline-flex gap-1.5 items-center",
            )}
            href="https://webaim.org/resources/contrastchecker/"
            rel="noopener noreferrer"
            target="_blank"
          >
            Contrast Checker
            <ExternalLink size={12} />
          </a>{" "}
          tool by WebAIM, with added support for more color formats.
        </p>
      </footer>
    </div>
  );
}
