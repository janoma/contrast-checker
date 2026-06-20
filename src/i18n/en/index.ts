import type { BaseTranslation } from "../i18n-types";

const en = {
  alpha: "Alpha",
  // App shell
  appTitle: "Contrast Checker",
  ariaLabelStar: "Star",
  ariaLabelTextInput: "Text Input",
  background: "Background",
  colorApproximation: "Color approximation",
  colorFormatNameLabel: "Name",
  colorFormatOr: "or",

  // ColorFormats
  colorFormats: "Color formats",
  colorPicker: "Color Picker",
  colorValue: "Color Value",
  contrastRatio: "Contrast Ratio",
  copied: "copied!",
  // CopyButton
  copyButtonTitle: "Copy {text: string}",
  fail: "Fail",
  // ColorPanel
  foreground: "Foreground",
  graphicsAndUi: "Graphical Objects and User Interface Components",

  introText:
    "WCAG 2.0 and 2.1 contrast ratio calculator. Based on the <>Contrast Checker</> tool by WebAIM, with support for more color formats. Accepts HEX, RGB, HSL, HWB, OKLCH, OKLAB, LCH, and LAB.",
  largeText: "Large Text",
  lightness: "Lightness",

  // Footer
  nerdyReferences: "Nerdy references",
  nerdyReferencesText:
    "Mozilla Developer Network has good documentation on various color topics: <>RGB color model</>, <>Hex</> (for the hexadecimal color representation), <>Color Space</>, <>Gamut</>, and the various CSS color functions: <>RGB</>, <>HSL</>, <>HWB</>, <>OKLCH</>, <>OKLAB</>, <>LCH</>, and <>LAB</>.",

  // Preview sections
  normalText: "Normal Text",
  outOfGamutWarning:
    "This color is outside sRGB. A close sRGB approximation is shown. WCAG contrast is calculated on the sRGB version.",
  // WCAG badges
  pass: "Pass",

  permalink: "permalink",

  replace: "Replace",
  skipToMain: "Skip to main content",
} satisfies BaseTranslation;

export default en;
