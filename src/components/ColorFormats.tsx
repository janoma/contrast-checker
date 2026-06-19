import {
  formatHex,
  formatHsl,
  formatHwb,
  formatLab,
  formatLch,
  formatOklab,
  formatOklch,
  formatRgb,
} from "@/lib/color-format";
import { type ColorInstance } from "color";
import { Check, Copy } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

function FormatRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(() => {
    void navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 1800);
  }, [value]);

  return (
    <div className="flex items-center gap-2 py-1.5 border-b last:border-b-0">
      <span className="text-sm font-light text-muted-foreground w-14 shrink-0 uppercase tracking-wide">
        {label}
      </span>
      <span className="flex-1 font-mono text-sm text-foreground break-all leading-relaxed">
        {value}
      </span>
      <button
        onClick={copy}
        title={`Copy ${label}`}
        className="shrink-0 p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
      >
        {copied ? (
          <Check size={12} className="text-green-500" />
        ) : (
          <Copy size={12} />
        )}
      </button>
    </div>
  );
}

export function ColorFormats({ color }: { color: ColorInstance }) {
  const [open, setOpen] = useState(false);

  const formats = useMemo(
    () => [
      { label: "HEX", value: formatHex(color) },
      { label: "RGB", value: formatRgb(color) },
      { label: "HSL", value: formatHsl(color) },
      { label: "HWB", value: formatHwb(color) },
      { label: "OKLCH", value: formatOklch(color) },
      { label: "OKLAB", value: formatOklab(color) },
      { label: "LCH", value: formatLch(color) },
      { label: "LAB", value: formatLab(color) },
    ],
    [color],
  );

  return (
    <div>
      <button
        onClick={() => {
          setOpen((o) => !o);
        }}
        className="w-full rounded flex items-center justify-center gap-1 text-sm text-muted-foreground py-1 cursor-pointer"
      >
        <span>Color formats</span>
        <span className="select-none">{open ? "▴" : "▾"}</span>
      </button>
      {open && (
        <div className="mt-2 border rounded-md bg-gray-50 px-2 pb-1 pt-0.5">
          {formats.map((f) => (
            <FormatRow key={f.label} label={f.label} value={f.value} />
          ))}
        </div>
      )}
    </div>
  );
}
