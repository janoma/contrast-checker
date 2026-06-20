import type { Translation } from "../i18n-types";

const zh: Translation = {
  alpha: "透明度",
  appTitle: "对比度检查器",
  ariaLabelStar: "星形",
  ariaLabelTextInput: "文本输入",
  background: "背景",
  colorApproximation: "颜色近似值",
  colorFormatNameLabel: "名称",
  colorFormatOr: "或",

  colorFormats: "颜色格式",
  colorPicker: "颜色选择器",
  colorValue: "颜色值",
  contrastRatio: "对比度",
  copied: "已复制！",
  copyButtonTitle: "复制{text}",
  fail: "不通过",
  foreground: "前景",
  graphicsAndUi: "图形对象和用户界面组件",

  introText:
    "WCAG 2.0和2.1对比度计算器。基于WebAIM的<>Contrast Checker</>工具，支持更多颜色格式。支持HEX、RGB、HSL、HWB、OKLCH、OKLAB、LCH和LAB。",
  largeText: "大号文本",
  lightness: "亮度",

  nerdyReferences: "技术参考",
  nerdyReferencesText:
    "Mozilla Developer Network提供了关于各种颜色主题的优质文档：<>RGB颜色模型</>、<>Hex</>（十六进制颜色表示）、<>色彩空间</>、<>色域</>，以及各种CSS颜色函数：<>RGB</>、<>HSL</>、<>HWB</>、<>OKLCH</>、<>OKLAB</>、<>LCH</>和<>LAB</>。",

  normalText: "普通文本",
  outOfGamutWarning:
    "该颜色超出sRGB范围。显示的是接近的sRGB近似值。WCAG对比度基于sRGB版本计算。",
  pass: "通过",

  permalink: "永久链接",

  replace: "替换",
  skipToMain: "跳至主要内容",
};

export default zh;
