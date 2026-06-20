import Color, { type ColorInstance } from "color";

import { parseColorInput } from "./color-parser";

export function readUrlParams(): {
  bgColor: ColorInstance;
  bgRaw: string;
  fgColor: ColorInstance;
  fgRaw: string;
} {
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
    bgColor: bgResult.color.alpha(1),
    bgRaw: rawBg,
    fgColor: fgResult.color.alpha(alpha),
    fgRaw: rawFg,
  };
}
