import { type ColorInstance } from "color";

import { toOklab, toOklch } from "./oklab";

/** Hue is "none" for achromatic colors (C ≈ 0) to match CSS spec. */
export function fmtHue(C: number, H: number): string {
  return C < 0.0002 || !isFinite(H) ? "none" : num(H, 1);
}

export function formatHex(c: ColorInstance): string {
  const a = c.alpha();
  return a < 1 ? c.hexa().toUpperCase() : c.hex().toUpperCase();
}

export function formatHsl(c: ColorInstance): string {
  const arr = c.hsl().array() as [number, number, number];
  const a = c.alpha();
  const h = num(arr[0], 1);
  const s = num(arr[1], 1);
  const l = num(arr[2], 1);
  return a < 1
    ? `hsla(${h}, ${s}%, ${l}%, ${num(a)})`
    : `hsl(${h} ${s}% ${l}%)`;
}

export function formatHwb(c: ColorInstance): string {
  const arr = c.hwb().array() as [number, number, number];
  const a = c.alpha();
  const base = `hwb(${num(arr[0], 1)} ${num(arr[1], 1)}% ${num(arr[2], 1)}%)`;
  return a < 1 ? `${base} / ${num(a)}` : base;
}

export function formatLab(c: ColorInstance): string {
  const arr = c.lab().array() as [number, number, number];
  const a = c.alpha();
  const lStr = num(arr[0], 2);
  const aStr = num(arr[1], 2);
  const bStr = num(arr[2], 2);
  return a < 1
    ? `lab(${lStr} ${aStr} ${bStr} / ${num(a)})`
    : `lab(${lStr} ${aStr} ${bStr})`;
}

export function formatLch(c: ColorInstance): string {
  const arr = c.lch().array() as [number, number, number];
  const a = c.alpha();
  const lStr = num(arr[0], 2);
  const cStr = num(arr[1], 2);
  const hStr = fmtHue(arr[1], arr[2]);
  return a < 1
    ? `lch(${lStr} ${cStr} ${hStr} / ${num(a)})`
    : `lch(${lStr} ${cStr} ${hStr})`;
}

export function formatOklab(c: ColorInstance): string {
  const [L, a, b] = toOklab(c);
  const alpha = c.alpha();
  const lStr = num(L, 4);
  const aStr = num(a, 4);
  const bStr = num(b, 4);
  return alpha < 1
    ? `oklab(${lStr} ${aStr} ${bStr} / ${num(alpha)})`
    : `oklab(${lStr} ${aStr} ${bStr})`;
}

export function formatOklch(c: ColorInstance): string {
  const [L, C, H] = toOklch(c);
  const a = c.alpha();
  const lStr = num(L, 4);
  const cStr = num(C, 4);
  const hStr = fmtHue(C, H);
  return a < 1
    ? `oklch(${lStr} ${cStr} ${hStr} / ${num(a)})`
    : `oklch(${lStr} ${cStr} ${hStr})`;
}

export function formatRgb(c: ColorInstance): string {
  const r = Math.round(c.red()).toString();
  const g = Math.round(c.green()).toString();
  const b = Math.round(c.blue()).toString();
  const a = c.alpha();
  return a < 1 ? `rgba(${r}, ${g}, ${b}, ${num(a)})` : `rgb(${r} ${g} ${b})`;
}

/**
 * Re-serialize `raw` in the same format the user typed, but canonicalized.
 * Falls back to hex for named colors and unrecognized inputs.
 */
export function normalizeColorInput(
  raw: unknown,
  color: ColorInstance,
): string {
  if (typeof raw !== "string") return formatHex(color);
  const sl = raw.trim().toLowerCase();
  if (sl.startsWith("oklch(")) return formatOklch(color);
  if (sl.startsWith("oklab(")) return formatOklab(color);
  if (sl.startsWith("lch(")) return formatLch(color);
  if (sl.startsWith("lab(")) return formatLab(color);
  if (sl.startsWith("hsl")) return formatHsl(color); // hsl( and hsla(
  if (sl.startsWith("hwb(")) return formatHwb(color);
  if (sl.startsWith("rgb")) return formatRgb(color); // rgb( and rgba(
  return formatHex(color); // hex (with or without #) and named keywords
}

/** Format a finite number to d decimal places; NaN/Infinity → "0". */
export function num(v: number, d = 2): string {
  return isFinite(v) ? v.toFixed(d) : "0";
}
