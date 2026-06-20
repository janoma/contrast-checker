import { type ColorInstance } from "color";
import { ChevronDown } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import {
  formatHex,
  formatHsl,
  formatHwb,
  formatLab,
  formatLch,
  formatName,
  formatOklab,
  formatOklch,
  formatRgb,
} from "@/lib/color-format";
import { cn } from "@/lib/utils";

import CopyButton from "./ui/copy-button";

export function ColorFormats({
  color,
  id,
}: {
  color: ColorInstance;
  id: string;
}) {
  const [open, setOpen] = useState(
    () => localStorage.getItem(`color-formats-open-${id}`) === "true",
  );

  useEffect(() => {
    localStorage.setItem(`color-formats-open-${id}`, String(open));
  }, [open, id]);

  const formats = useMemo(
    () => [
      { label: "Name", value: formatName(color) },
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
        className="w-full rounded flex items-center justify-center gap-1 text-sm text-muted-foreground py-1 cursor-pointer"
        onClick={() => {
          setOpen((o) => !o);
        }}
      >
        <span>Color formats</span>
        <ChevronDown
          className={cn("transition-transform", open ? "rotate-180" : "")}
          size={14}
        />
      </button>
      {open && (
        <div className="mt-2 border rounded-md bg-muted/50 px-2 pb-1 pt-0.5">
          {formats.map((f) => (
            <FormatRow key={f.label} label={f.label} value={f.value} />
          ))}
        </div>
      )}
    </div>
  );
}

function FormatRow({
  label,
  value,
}: {
  label: string;
  value: [string, string] | string;
}) {
  return (
    <div className="flex items-center gap-2 py-1.5 border-b last:border-b-0">
      <span className="text-sm font-light text-muted-foreground w-14 shrink-0 uppercase tracking-wide">
        {label}
      </span>
      <span className="flex-1 font-mono text-xs xs:text-sm text-foreground break-all leading-relaxed min-h-6">
        {typeof value === "string" ? (
          value
        ) : (
          <>
            <CopyButton className="text-foreground" show text={value[0]} /> or{" "}
            <CopyButton className="text-foreground" show text={value[1]} />
          </>
        )}
      </span>
      {typeof value === "string" && !!value && <CopyButton text={value} />}
    </div>
  );
}
