import { type ColorInstance } from "color";
import { Check, Copy, RotateCw } from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "preact/hooks";

import { useSampleQuote } from "@/hooks/useSampleQuote";
import { useI18nContext } from "@/i18n/i18n-react";
import { normalizeColorInput } from "@/lib/color-format";
import {
  colorToCss,
  compositeAlpha,
  generateAAAColorPair,
} from "@/lib/color-utils";
import { readUrlParams } from "@/lib/url-params";

import { ColorPanel } from "./components/ColorPanel";
import { PreviewSection } from "./components/PreviewSection";
import { WrapTranslation } from "./components/WrapTranslation";
import { cn } from "./lib/utils";

// MDN links in the same order as the <> markers in nerdyReferencesText.
const MDN_LINKS = [
  "https://developer.mozilla.org/en-US/docs/Glossary/RGB",
  "https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/hex-color",
  "https://developer.mozilla.org/en-US/docs/Glossary/Color_space",
  "https://developer.mozilla.org/en-US/docs/Glossary/Gamut",
  "https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/color_value/rgb",
  "https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/color_value/hsl",
  "https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/color_value/hwb",
  "https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/color_value/oklch",
  "https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/color_value/oklab",
  "https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/color_value/lch",
  "https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/color_value/lab",
];

export default function App() {
  const { LL, locale } = useI18nContext();
  const { next: nextQuote, quote } = useSampleQuote(locale);

  const init = useMemo(() => readUrlParams(), []);

  // When no URL params are present, generate a random AAA-passing pair once
  // and push it to the history stack so the clean URL remains navigable.
  const [initialState] = useState<{
    bgColor: ColorInstance;
    bgDisplay: null | string;
    fgColor: ColorInstance;
    fgDisplay: null | string;
    pushOnMount: boolean;
  }>(() => {
    const hasParams = new URLSearchParams(window.location.search).has("fcolor");
    if (hasParams) {
      return {
        bgColor: init.bgColor,
        bgDisplay: normalizeColorInput(init.bgRaw, init.bgColor),
        fgColor: init.fgColor,
        fgDisplay: normalizeColorInput(init.fgRaw, init.fgColor),
        pushOnMount: false,
      };
    }
    const pair = generateAAAColorPair();
    return {
      bgColor: pair.bg,
      bgDisplay: null,
      fgColor: pair.fg,
      fgDisplay: null,
      pushOnMount: true,
    };
  });

  const [fgColor, setFgColor] = useState<ColorInstance>(initialState.fgColor);
  const [bgColor, setBgColor] = useState<ColorInstance>(initialState.bgColor);
  // The format string the user last confirmed for each panel (null = derived hex)
  const [fgDisplay, setFgDisplay] = useState<null | string>(
    initialState.fgDisplay,
  );
  const [bgDisplay, setBgDisplay] = useState<null | string>(
    initialState.bgDisplay,
  );

  const pushNeededRef = useRef(initialState.pushOnMount);
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

  const sampleTextNode = quote ? (
    <div className="flex justify-between items-start gap-2">
      {quote}
      <button
        aria-label="New quote"
        className="bg-black text-white p-1 rounded hover:invert"
        onClick={() => {
          nextQuote(quote);
        }}
        title="New quote"
        type="button"
      >
        <RotateCw size={13} />
      </button>
    </div>
  ) : null;

  return (
    <div className="lg:max-w-[calc(var(--container-5xl)-4rem)] lg:mx-auto lg:border lg:rounded-lg p-3 sm:p-6 lg:my-8 bg-taupe-50">
      <div className="sr-only focus-within:not-sr-only flex justify-center">
        <a className="py-2 px-4 border-0" href="#main-content">
          {LL.skipToMain()}
        </a>
      </div>
      <header className="mb-4">
        <h1>{LL.appTitle()}</h1>
        <p className="text-sm mt-1">
          <WrapTranslation
            message={LL.introText()}
            renderLink={(text) => (
              <a
                className={cn(
                  "border-b-2 border-double border-primary-foreground text-primary-foreground",
                  "hover:text-accent-foreground hover:border-accent-foreground hover:bg-accent",
                  "focus:text-accent-foreground focus:border-accent-foreground focus:bg-accent",
                  "outline-0 outline-offset-0",
                )}
                href="https://webaim.org/resources/contrastchecker/"
              >
                {text}
              </a>
            )}
          />
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
            title={LL.foreground()}
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
            title={LL.background()}
          />
        </div>

        <div className="flex flex-col items-stretch sm:items-center gap-2 max-w-sm mx-auto sm:max-w-none">
          <div className="border rounded-xl px-12 py-5 text-center bg-background">
            <h2>{LL.contrastRatio()}</h2>
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
                {LL.copied()}
                <Check className="text-success" size={12} />
              </>
            ) : (
              <>
                {LL.permalink()}
                <Copy size={12} />
              </>
            )}
          </button>
        </div>

        <PreviewSection
          bgCss={bgCss}
          fgCss={fgCss}
          heading={LL.normalText()}
          previewContent={
            <p className="text-base leading-relaxed">{sampleTextNode}</p>
          }
          wcagRows={[
            { label: "WCAG AA", pass: normalAA },
            { label: "WCAG AAA", pass: normalAAA },
          ]}
        />

        <PreviewSection
          bgCss={bgCss}
          fgCss={fgCss}
          heading={LL.largeText()}
          previewContent={
            <p className="text-2xl font-bold leading-snug">{sampleTextNode}</p>
          }
          wcagRows={[
            { label: "WCAG AA", pass: largeAA },
            { label: "WCAG AAA", pass: largeAAA },
          ]}
        />

        <PreviewSection
          bgCss={bgCss}
          fgCss={fgCss}
          heading={LL.graphicsAndUi()}
          previewContent={
            <div className="flex flex-col items-center gap-4">
              <svg
                aria-label={LL.ariaLabelStar()}
                fill="currentColor"
                height="36"
                viewBox="0 0 24 24"
                width="36"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              <input
                aria-label={LL.ariaLabelTextInput()}
                className="rounded px-3 py-1.5 text-sm bg-background text-foreground"
                defaultValue={LL.ariaLabelTextInput()}
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
        <h2>{LL.nerdyReferences()}</h2>
        <p>
          <WrapTranslation
            message={LL.nerdyReferencesText()}
            renderLink={(text: string, index: number) => (
              <a href={MDN_LINKS[index]}>{text}</a>
            )}
          />
        </p>
      </footer>
    </div>
  );
}
