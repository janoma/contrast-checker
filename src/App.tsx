import { type ColorInstance } from "color";
import { Check, Copy } from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "preact/hooks";

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

  const pushNeededRef = useRef(false);
  const sliderTimerRef = useRef<null | ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("fcolor", fgDisplay ?? fgColor.hex().slice(1));
    url.searchParams.set("bcolor", bgDisplay ?? bgColor.hex().slice(1));
    url.searchParams.set("alpha", fgColor.alpha().toFixed(2));
    if (pushNeededRef.current) {
      window.history.pushState(null, "", url.toString());
      pushNeededRef.current = false;
    } else {
      window.history.replaceState(null, "", url.toString());
    }
  }, [fgColor, bgColor, fgDisplay, bgDisplay]);

  useEffect(() => {
    const handlePopState = () => {
      const params = readUrlParams();
      setFgColor(params.fgColor);
      setBgColor(params.bgColor);
      setFgDisplay(normalizeColorInput(params.fgRaw, params.fgColor));
      setBgDisplay(normalizeColorInput(params.bgRaw, params.bgColor));
    };
    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  const handleHistoryPush = useCallback(() => {
    pushNeededRef.current = true;
  }, []);

  const handleSliderChange = useCallback(() => {
    if (sliderTimerRef.current !== null) {
      clearTimeout(sliderTimerRef.current);
    }
    sliderTimerRef.current = setTimeout(() => {
      window.history.pushState(null, "", window.location.href);
      sliderTimerRef.current = null;
    }, 500);
  }, []);

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
      <div className="sr-only focus-within:not-sr-only flex justify-center">
        <a className="py-2 px-4 border-0" href="#main-content">
          Skip to main content
        </a>
      </div>
      <header className="mb-4">
        <h1>Contrast Checker</h1>
        <p className="text-sm mt-1">
          WCAG 2.0 and 2.1 contrast ratio calculator. Based on the{" "}
          <a
            className={cn(
              "border-b-2 border-double border-primary-foreground text-primary-foreground",
              "hover:text-accent-foreground hover:border-accent-foreground hover:bg-accent",
              "focus:text-accent-foreground focus:border-accent-foreground focus:bg-accent",
              "outline-0 outline-offset-0",
            )}
            href="https://webaim.org/resources/contrastchecker/"
          >
            Contrast Checker
          </a>{" "}
          tool by WebAIM, with support for more color formats. Accepts HEX, RGB,
          HSL, HWB, OKLCH, OKLAB, LCH, and LAB.
        </p>
      </header>

      <main className="space-y-8 pt-4" id="main-content">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-sm mx-auto sm:max-w-none">
          <ColorPanel
            color={fgColor}
            displayValue={fgDisplay ?? undefined}
            hotkey="f"
            id="fg-color"
            onChange={setFgColor}
            onCommit={setFgDisplay}
            onHistoryPush={handleHistoryPush}
            onSliderChange={handleSliderChange}
            showAlpha
            title="Foreground"
          />
          <ColorPanel
            color={bgColor}
            displayValue={bgDisplay ?? undefined}
            hotkey="b"
            id="bg-color"
            onChange={setBgColor}
            onCommit={setBgDisplay}
            onHistoryPush={handleHistoryPush}
            onSliderChange={handleSliderChange}
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
                onKeyDown={(e) => {
                  e.stopPropagation();
                }}
                style={{ border: `2px solid ${fgCss}` }}
                type="text"
              />
            </div>
          }
          wcagRows={[{ label: "WCAG AA", pass: graphicsAA }]}
        />
      </main>

      <footer className="text-sm bg-muted border rounded-lg p-4 mt-16">
        <h2>Nerdy references</h2>
        <p>
          Mozilla Developer Network has good documentation on various color
          topics:{" "}
          <a href="https://developer.mozilla.org/en-US/docs/Glossary/RGB">
            RGB color model
          </a>
          ,{" "}
          <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/hex-color">
            Hex
          </a>{" "}
          (for the <em>hexadecimal</em> color representation),{" "}
          <a href="https://developer.mozilla.org/en-US/docs/Glossary/Color_space">
            Color Space
          </a>
          ,{" "}
          <a href="https://developer.mozilla.org/en-US/docs/Glossary/Gamut">
            Gamut
          </a>
          , and the various CSS color functions:{" "}
          <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/color_value/rgb">
            RGB
          </a>
          ,{" "}
          <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/color_value/hsl">
            HSL
          </a>
          ,{" "}
          <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/color_value/hwb">
            HWB
          </a>
          ,{" "}
          <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/color_value/oklch">
            OKLCH
          </a>
          ,{" "}
          <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/color_value/oklab">
            OKLAB
          </a>
          ,{" "}
          <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/color_value/lch">
            LCH
          </a>
          , and{" "}
          <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/color_value/lab">
            LAB
          </a>
          .
        </p>
      </footer>
    </div>
  );
}
