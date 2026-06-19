import { Slider } from "@/components/ui/slider";
import { parseColorInput } from "@/lib/color-parser";
import { lightnessGradientFromColor } from "@/lib/color-utils";
import { cn } from "@/lib/utils";
import Color, { type ColorInstance } from "color";
import { useCallback, useState } from "react";
import { ColorFormats } from "./ColorFormats";

export interface ColorPanelProps {
  title: string;
  color: ColorInstance;
  showAlpha?: boolean;
  onChange: (color: ColorInstance) => void;
}

export function ColorPanel({
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
        onChange(color.lightness(value).alpha(color.alpha()));
      } catch {
        // ignore invalid color states
      }
    },
    [color, onChange],
  );

  const gradient = lightnessGradientFromColor(color);
  const pickerHex = color.hex();

  return (
    <div className="border rounded-lg p-4 space-y-3 bg-white">
      <h2 className="text-center font-semibold text-sm uppercase tracking-wide text-gray-600">
        {title}
      </h2>

      <div>
        <p className="text-sm text-muted-foreground text-center mb-1">
          Color Value
        </p>
        <input
          className="w-full border rounded px-2 py-1.5 text-sm font-mono"
          value={displayInput}
          spellCheck={false}
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

      {outOfGamut && (
        <div className="flex items-start gap-1.5 bg-amber-50 border border-amber-200 rounded p-2 text-sm text-amber-800 leading-snug">
          <span className="shrink-0 mt-px">⚠</span>
          <span>
            This color is outside sRGB. The closest sRGB approximation is shown.
            WCAG contrast is calculated on the sRGB version.
          </span>
        </div>
      )}

      <div className="flex gap-3 items-end">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground text-center mb-1">
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
            <p className="text-sm text-muted-foreground text-center mb-1">
              Alpha
            </p>
            <input
              className="w-full h-10 border rounded px-2 py-1.5 text-sm text-center"
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

      <div>
        <p className="text-sm text-muted-foreground text-center mb-2">
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
            className={cn(
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
            )}
          />
        </div>
      </div>

      <ColorFormats color={color} />
    </div>
  );
}
