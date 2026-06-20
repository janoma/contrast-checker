import { cn } from "@/lib/utils";

interface SliderProps {
  className?: string;
  defaultValue?: number[];
  id?: string;
  max?: number;
  min?: number;
  onValueChange?: (value: number[]) => void;
  step?: number;
  value?: number[];
}

function Slider({
  className,
  defaultValue,
  id,
  max = 100,
  min = 0,
  onValueChange,
  step = 1,
  value,
}: SliderProps) {
  const currentValue = value?.[0] ?? defaultValue?.[0] ?? min;

  return (
    <input
      className={cn("range-slider", className)}
      id={id}
      max={max}
      min={min}
      onChange={(e) => onValueChange?.([parseFloat(e.target.value)])}
      step={step}
      type="range"
      value={currentValue}
    />
  );
}

export { Slider };
