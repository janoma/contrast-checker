import Color, { type ColorInstance } from "color";

/** CSS color string suitable for use in `style` props. */
export function colorToCss(c: ColorInstance): string {
  const a = c.alpha();
  if (a < 1) {
    const r = Math.round(c.red()).toString();
    const g = Math.round(c.green()).toString();
    const b = Math.round(c.blue()).toString();
    return `rgba(${r},${g},${b},${a.toFixed(2)})`;
  }
  return c.hex();
}

/** Alpha-composite fg over bg (both opaque RGB result). */
export function compositeAlpha(
  fg: ColorInstance,
  bg: ColorInstance,
): ColorInstance {
  const a = fg.alpha();
  if (a >= 1) {
    return fg;
  }
  return Color.rgb(
    fg.red() * a + bg.red() * (1 - a),
    fg.green() * a + bg.green() * (1 - a),
    fg.blue() * a + bg.blue() * (1 - a),
  );
}

/**
 * Generate a random fg/bg color pair that passes WCAG AAA (contrast >= 7).
 * Uses the HSL lightness split strategy: either a dark bg with a light fg,
 * or a light bg with a dark fg, with randomized hues and saturations.
 */
export function generateAAAColorPair(): {
  bg: ColorInstance;
  fg: ColorInstance;
} {
  for (let i = 0; i < 200; i++) {
    const darkBg = Math.random() < 0.5;
    const bgHue = Math.random() * 360;
    const fgHue = Math.random() * 360;
    const bgSat = 15 + Math.random() * 60;
    const fgSat = 15 + Math.random() * 60;
    const bgLight = darkBg ? 5 + Math.random() * 25 : 70 + Math.random() * 25;
    const fgLight = darkBg ? 80 + Math.random() * 18 : 2 + Math.random() * 18;

    const bg = Color.hsl(bgHue, bgSat, bgLight);
    const fg = Color.hsl(fgHue, fgSat, fgLight);

    try {
      if (fg.contrast(bg) >= 7) {
        return { bg, fg };
      }
    } catch {
      // try again
    }
  }

  return { bg: Color("#FFFFFF"), fg: Color("#000000") };
}

/** HSL-based gradient for the lightness slider track. */
export function lightnessGradientFromColor(c: ColorInstance): string {
  try {
    const h = c.hue().toFixed(1);
    const s = c.saturationl().toFixed(1);
    return `linear-gradient(to right, hsl(${h},${s}%,0%), hsl(${h},${s}%,50%), hsl(${h},${s}%,100%))`;
  } catch {
    return "linear-gradient(to right,#000,#fff)";
  }
}
