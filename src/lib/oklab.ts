// Oklab / OKLCH math
// Reference: https://bottosson.github.io/posts/oklab/

import Color, { type ColorInstance } from "color";

export function srgbToLinear(c: number): number {
  const x = c / 255;
  return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
}

export function linearToSrgbClamped(c: number): number {
  const v = c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055;
  return Math.max(0, Math.min(1, v)) * 255;
}

/** sRGB [0,255] → Oklab. */
export function rgbToOklab(
  r: number,
  g: number,
  b: number,
): [number, number, number] {
  const lr = srgbToLinear(r);
  const lg = srgbToLinear(g);
  const lb = srgbToLinear(b);
  const l = Math.cbrt(
    0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb,
  );
  const m = Math.cbrt(
    0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb,
  );
  const s = Math.cbrt(
    0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb,
  );
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

/** Oklab → raw sRGB [0,255] (not clamped — caller checks out-of-gamut). */
export function oklabToRgbRaw(
  L: number,
  a: number,
  b: number,
): [number, number, number] {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;
  const l = l_ ** 3;
  const m = m_ ** 3;
  const s = s_ ** 3;
  return [
    (4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s) * 255,
    (-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s) * 255,
    (-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s) * 255,
  ];
}

/** Oklab → ColorInstance (clamped to sRGB). */
export function oklabToColor(L: number, a: number, b: number): ColorInstance {
  const [r, g, bl] = oklabToRgbRaw(L, a, b);
  return Color.rgb(
    linearToSrgbClamped(r / 255),
    linearToSrgbClamped(g / 255),
    linearToSrgbClamped(bl / 255),
  );
}

export function oklabToOklch(
  L: number,
  a: number,
  b: number,
): [number, number, number] {
  const C = Math.sqrt(a * a + b * b);
  const H = (Math.atan2(b, a) * 180) / Math.PI;
  return [L, C, H < 0 ? H + 360 : H];
}

export function oklchToOklab(
  L: number,
  C: number,
  H: number,
): [number, number, number] {
  const hr = (H * Math.PI) / 180;
  return [L, C * Math.cos(hr), C * Math.sin(hr)];
}

/** Return true when any raw (pre-clamp) RGB channel is outside [0, 255]. */
export function isOutOfGamut(r: number, g: number, b: number): boolean {
  return (
    r < -0.5 || r > 255.5 || g < -0.5 || g > 255.5 || b < -0.5 || b > 255.5
  );
}

/** ColorInstance → OKLCH [L, C, H]. */
export function toOklch(c: ColorInstance): [number, number, number] {
  const [L, a, b] = rgbToOklab(c.red(), c.green(), c.blue());
  return oklabToOklch(L, a, b);
}

/** ColorInstance → Oklab [L, a, b]. */
export function toOklab(c: ColorInstance): [number, number, number] {
  return rgbToOklab(c.red(), c.green(), c.blue());
}
