import Color, { type ColorInstance } from "color";
import { AlertTriangle, ChevronsUp } from "lucide-react";
import { useCallback, useEffect, useState } from "preact/hooks";

import { Slider } from "@/components/ui/slider";
import { normalizeColorInput } from "@/lib/color-format";
import { parseColorInput } from "@/lib/color-parser";
import { lightnessGradientFromColor } from "@/lib/color-utils";
import { cn } from "@/lib/utils";

import { ColorFormats } from "./ColorFormats";

export interface ColorPanelProps {
  color: ColorInstance;
  /** Externally committed display string (the last format the user confirmed). */
  displayValue?: string;
  hotkey: string;
  id: string;
  onChange: (color: ColorInstance) => void;
  /**
   * Called when the committed display string changes.
   * Pass `null` to signal that the format has been reset to the derived hex.
   */
  onCommit?: (normalized: null | string) => void;
  /** Called on text input / color-picker commits — triggers an immediate history push. */
  onHistoryPush?: () => void;
  /** Called on each slider tick — triggers a debounced history push. */
  onSliderChange?: () => void;
  showAlpha?: boolean;
  title: string;
}

export function ColorPanel({
  color,
  displayValue,
  hotkey,
  id,
  onChange,
  onCommit,
  onHistoryPush,
  onSliderChange,
  showAlpha = false,
  title,
}: ColorPanelProps) {
  // null = not editing (display derived/committed value), string = user is typing
  const [rawInput, setRawInput] = useState<null | string>(null);
  const [rawAlpha, setRawAlpha] = useState<null | string>(null);
  const [outOfGamut, setOutOfGamut] = useState(false);

  const alpha = color.alpha();

  const derivedDisplay =
    displayValue ??
    (alpha < 1 && showAlpha
      ? color.hexa().toUpperCase()
      : color.hex().toUpperCase());
  const displayInput = rawInput ?? derivedDisplay;
  const displayAlpha = rawAlpha ?? alpha.toFixed(2);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === hotkey) {
        e.preventDefault();
        document.getElementById(id)?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
  }, [hotkey, displayInput, id]);

  const applyInput = useCallback(
    (val: string) => {
      const result = parseColorInput(val);
      if (!result) {
        setRawInput(null);
        return;
      }
      const finalColor = showAlpha ? result.color : result.color.alpha(1);
      onChange(finalColor);
      setOutOfGamut(result.outOfGamut);
      const normalized = normalizeColorInput(val, finalColor);
      onCommit?.(normalized);
      onHistoryPush?.();
      setRawInput(null);
    },
    [showAlpha, onChange, onCommit, onHistoryPush],
  );

  const applyAlpha = useCallback(
    (val: string) => {
      const v = parseFloat(val);
      if (!isNaN(v)) {
        onChange(color.alpha(Math.max(0, Math.min(1, v))));
        // Reset the display format so the hex (which encodes alpha) is shown
        onCommit?.(null);
        onHistoryPush?.();
      }
      setRawAlpha(null);
    },
    [color, onChange, onCommit, onHistoryPush],
  );

  const lightness = color.lightness();

  const handleLightnessChange = useCallback(
    (value: number) => {
      try {
        onChange(color.lightness(value).alpha(color.alpha()));
        onCommit?.(null);
        onSliderChange?.();
      } catch {
        // ignore invalid color states
      }
    },
    [color, onChange, onCommit, onSliderChange],
  );

  const gradient = lightnessGradientFromColor(color);
  const pickerHex = color.hex();

  return (
    <div className="border rounded-lg p-4 space-y-3 bg-background">
      <h2 className="text-center">{title}</h2>

      <div>
        <label htmlFor={id}>Color Value</label>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "text-xs font-mono uppercase font-semibold text-muted-foreground border border-b-2 shadow",
              "p-0.5 aspect-square size-6 inline-flex items-center justify-center",
              "hover:shadow-xs hover:bg-muted/50",
            )}
          >
            {hotkey}
          </span>
          <input
            className="w-full border rounded px-2 py-1.5 text-sm font-mono"
            id={id}
            maxLength={60}
            onBlur={() => {
              applyInput(displayInput);
            }}
            onChange={(e) => {
              setRawInput(e.target.value);
            }}
            onFocus={(e) => {
              e.target.select();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                applyInput(displayInput);
              }
              e.stopPropagation();
            }}
            spellCheck={false}
            value={displayInput}
          />
        </div>
      </div>

      {outOfGamut && (
        <div className="space-y-3">
          <label htmlFor={`${id}-out-of-gamut`}>Color approximation</label>
          <div className="grid grid-cols-2 gap-2">
            <input
              className="w-full border rounded px-2 py-1.5 text-sm font-mono"
              id={`${id}-out-of-gamut`}
              value={color.hex()}
            />
            <button
              className="replace"
              onClick={() => {
                setRawInput(color.hex());
                applyInput(color.hex());
              }}
            >
              Replace <ChevronsUp size={14} />
            </button>
          </div>
          <div className="flex items-start gap-1.5 bg-warning border rounded p-2 text-sm text-warning-foreground leading-snug">
            <AlertTriangle className="place-self-center mx-2" size={32} />
            <span>
              This color is outside sRGB. A close sRGB approximation is shown.
              WCAG contrast is calculated on the sRGB version.
            </span>
          </div>
        </div>
      )}

      <div className="flex gap-3 items-end">
        <div className="flex-1">
          <label htmlFor={`${id}-color-picker`}>Color Picker</label>
          <input
            className="w-full h-10 cursor-pointer rounded border p-0.5"
            id={`${id}-color-picker`}
            onChange={(e) => {
              const picked = Color(e.target.value);
              onChange(showAlpha ? picked.alpha(alpha) : picked);
              onCommit?.(null);
              onHistoryPush?.();
            }}
            type="color"
            value={pickerHex}
          />
        </div>
        {showAlpha && (
          <div className="w-16">
            <label htmlFor={`${id}-alpha`}>Alpha</label>
            <input
              className="w-full h-10 border rounded px-2 py-1.5 text-sm text-center"
              id={`${id}-alpha`}
              onBlur={() => {
                applyAlpha(displayAlpha);
              }}
              onChange={(e) => {
                setRawAlpha(e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  applyAlpha(displayAlpha);
                }
              }}
              value={displayAlpha}
            />
          </div>
        )}
      </div>

      <div>
        <label htmlFor={`${id}-lightness`}>Lightness</label>
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
            id={`${id}-lightness`}
            max={100}
            min={0}
            onValueChange={(value) => {
              handleLightnessChange(
                typeof value === "number" ? value : value[0],
              );
            }}
            step={0.1}
            value={[lightness]}
          />
        </div>
      </div>

      <ColorFormats color={color} id={id} />
    </div>
  );
}
