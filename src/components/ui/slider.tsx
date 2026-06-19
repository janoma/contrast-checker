import { cn } from "@/lib/utils";

interface SliderProps {
  value?: number[];
  defaultValue?: number[];
  min?: number;
  max?: number;
  step?: number;
  onValueChange?: (value: number[]) => void;
  className?: string;
}

function Slider({
  value,
  defaultValue,
  min = 0,
  max = 100,
  step = 1,
  onValueChange,
  className,
}: SliderProps) {
  const currentValue = value?.[0] ?? defaultValue?.[0] ?? min;

  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={currentValue}
      onChange={(e) => onValueChange?.([parseFloat(e.target.value)])}
      className={cn("range-slider", className)}
    />
  );
}

export { Slider };
