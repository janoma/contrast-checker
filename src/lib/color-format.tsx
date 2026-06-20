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

/** Maps uppercase 6-digit hex values to their canonical CSS named-color keyword. */
const CSS_NAMED_COLORS: Record<string, [string, string] | string> = {
  "#000000": "black",
  "#000080": "navy",
  "#00008B": "darkblue",
  "#0000CD": "mediumblue",
  "#0000FF": "blue",
  "#006400": "darkgreen",
  "#008000": "green",
  "#008080": "teal",
  "#008B8B": "darkcyan",
  "#00BFFF": "deepskyblue",
  "#00CED1": "darkturquoise",
  "#00FA9A": "mediumspringgreen",
  "#00FF00": "lime",
  "#00FF7F": "springgreen",
  "#00FFFF": ["aqua", "cyan"],
  "#191970": "midnightblue",
  "#1E90FF": "dodgerblue",
  "#20B2AA": "lightseagreen",
  "#228B22": "forestgreen",
  "#2E8B57": "seagreen",
  "#2F4F4F": "darkslategray",
  "#32CD32": "limegreen",
  "#3CB371": "mediumseagreen",
  "#40E0D0": "turquoise",
  "#4169E1": "royalblue",
  "#4682B4": "steelblue",
  "#483D8B": "darkslateblue",
  "#48D1CC": "mediumturquoise",
  "#4B0082": "indigo",
  "#556B2F": "darkolivegreen",
  "#5F9EA0": "cadetblue",
  "#6495ED": "cornflowerblue",
  "#663399": "rebeccapurple",
  "#66CDAA": "mediumaquamarine",
  "#696969": "dimgray",
  "#6A5ACD": "slateblue",
  "#6B8E23": "olivedrab",
  "#708090": "slategray",
  "#7B68EE": "mediumslateblue",
  "#7CFC00": "lawngreen",
  "#7FFF00": "chartreuse",
  "#7FFFD4": "aquamarine",
  "#800000": "maroon",
  "#800080": "purple",
  "#808000": "olive",
  "#808080": ["gray", "grey"],
  "#87CEEB": "skyblue",
  "#87CEFA": "lightskyblue",
  "#8A2BE2": "blueviolet",
  "#8B0000": "darkred",
  "#8B008B": "darkmagenta",
  "#8B4513": "saddlebrown",
  "#8FBC8F": "darkseagreen",
  "#90EE90": "lightgreen",
  "#9370DB": "mediumpurple",
  "#9400D3": "darkviolet",
  "#98FB98": "palegreen",
  "#9932CC": "darkorchid",
  "#9ACD32": "yellowgreen",
  "#A0522D": "sienna",
  "#A52A2A": "brown",
  "#A9A9A9": "darkgray",
  "#ADD8E6": "lightblue",
  "#ADFF2F": "greenyellow",
  "#AFEEEE": "paleturquoise",
  "#B0C4DE": "lightsteelblue",
  "#B0E0E6": "powderblue",
  "#B22222": "firebrick",
  "#B8860B": "darkgoldenrod",
  "#BA55D3": "mediumorchid",
  "#BC8F8F": "rosybrown",
  "#BDB76B": "darkkhaki",
  "#C0C0C0": "silver",
  "#C71585": "mediumvioletred",
  "#CD5C5C": "indianred",
  "#CD853F": "peru",
  "#D2691E": "chocolate",
  "#D2B48C": "tan",
  "#D3D3D3": "lightgray",
  "#D8BFD8": "thistle",
  "#DA70D6": "orchid",
  "#DAA520": "goldenrod",
  "#DB7093": "palevioletred",
  "#DC143C": "crimson",
  "#DCDCDC": "gainsboro",
  "#DDA0DD": "plum",
  "#DEB887": "burlywood",
  "#E0FFFF": "lightcyan",
  "#E6E6FA": "lavender",
  "#E9967A": "darksalmon",
  "#EE82EE": "violet",
  "#EEE8AA": "palegoldenrod",
  "#F08080": "lightcoral",
  "#F0E68C": "khaki",
  "#F0F8FF": "aliceblue",
  "#F0FFF0": "honeydew",
  "#F0FFFF": "azure",
  "#F4A460": "sandybrown",
  "#F5DEB3": "wheat",
  "#F5F5DC": "beige",
  "#F5F5F5": "whitesmoke",
  "#F5FFFA": "mintcream",
  "#F8F8FF": "ghostwhite",
  "#FA8072": "salmon",
  "#FAEBD7": "antiquewhite",
  "#FAF0E6": "linen",
  "#FAFAD2": "lightgoldenrodyellow",
  "#FDF5E6": "oldlace",
  "#FF0000": "red",
  "#FF00FF": ["fuchsia", "magenta"],
  "#FF1493": "deeppink",
  "#FF4500": "orangered",
  "#FF6347": "tomato",
  "#FF69B4": "hotpink",
  "#FF7F50": "coral",
  "#FF8C00": "darkorange",
  "#FFA07A": "lightsalmon",
  "#FFA500": "orange",
  "#FFB6C1": "lightpink",
  "#FFC0CB": "pink",
  "#FFD700": "gold",
  "#FFDAB9": "peachpuff",
  "#FFDEAD": "navajowhite",
  "#FFE4B5": "moccasin",
  "#FFE4C4": "bisque",
  "#FFE4E1": "mistyrose",
  "#FFEBCD": "blanchedalmond",
  "#FFEFD5": "papayawhip",
  "#FFF0F5": "lavenderblush",
  "#FFF5EE": "seashell",
  "#FFF8DC": "cornsilk",
  "#FFFACD": "lemonchiffon",
  "#FFFAF0": "floralwhite",
  "#FFFAFA": "snow",
  "#FFFF00": "yellow",
  "#FFFFE0": "lightyellow",
  "#FFFFF0": "ivory",
  "#FFFFFF": "white",
};

export function formatName(c: ColorInstance): [string, string] | string {
  if (c.alpha() === 0 && c.red() === 0 && c.green() === 0 && c.blue() === 0) {
    return "transparent";
  }
  if (c.alpha() < 1) return "";
  return CSS_NAMED_COLORS[c.hex().toUpperCase()] ?? "";
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
