import type { Translation } from "../i18n-types";

const enGB: Translation = {
  alpha: "Alpha",
  appTitle: "Contrast Checker",
  ariaLabelStar: "Star",
  ariaLabelTextInput: "Text Input",
  background: "Background",
  colorApproximation: "Colour approximation",
  colorFormatNameLabel: "Name",
  colorFormatOr: "or",

  colorFormats: "Colour formats",
  colorPicker: "Colour Picker",
  colorValue: "Colour Value",
  contrastRatio: "Contrast Ratio",
  copied: "copied!",
  copyButtonTitle: "Copy {text}",
  fail: "Fail",
  foreground: "Foreground",
  graphicsAndUi: "Graphical Objects and User Interface Components",

  introText:
    "WCAG 2.0 and 2.1 contrast ratio calculator. Based on the <>Contrast Checker</> tool by WebAIM, with support for more colour formats. Accepts HEX, RGB, HSL, HWB, OKLCH, OKLAB, LCH, and LAB.",
  largeText: "Large Text",
  lightness: "Lightness",

  nerdyReferences: "Nerdy references",
  nerdyReferencesText:
    "Mozilla Developer Network has good documentation on various colour topics: <>RGB colour model</>, <>Hex</> (for the hexadecimal colour representation), <>Colour Space</>, <>Gamut</>, and the various CSS colour functions: <>RGB</>, <>HSL</>, <>HWB</>, <>OKLCH</>, <>OKLAB</>, <>LCH</>, and <>LAB</>.",

  normalText: "Normal Text",
  outOfGamutWarning:
    "This colour is outside sRGB. A close sRGB approximation is shown. WCAG contrast is calculated on the sRGB version.",
  pass: "Pass",

  permalink: "permalink",

  replace: "Replace",
  skipToMain: "Skip to main content",
};

export default enGB;
