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

/** Alpha-composite fg over bg (both opaque RGB result). */
export function compositeAlpha(
  fg: ColorInstance,
  bg: ColorInstance,
): ColorInstance {
  const a = fg.alpha();
  if (a >= 1) return fg;
  return Color.rgb(
    fg.red() * a + bg.red() * (1 - a),
    fg.green() * a + bg.green() * (1 - a),
    fg.blue() * a + bg.blue() * (1 - a),
  );
}
