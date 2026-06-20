import { Check, Copy } from "lucide-react";
import { useCallback, useState } from "preact/hooks";

export default function CopyButton({
  className,
  show,
  text,
}: {
  className?: string;
  show?: boolean;
  text: string;
}) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(() => {
    void navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 1800);
  }, [text]);

  return (
    <button
      className="shrink-0 rounded hover:bg-taupe-100 text-taupe-400 hover:text-taupe-600 transition-colors inline-flex items-center gap-1 px-1.5 py-0"
      onClick={copy}
      title={`Copy ${text}`}
    >
      {show && <span className={className}>{text}</span>}
      {copied ? (
        <Check className="text-success" size={12} />
      ) : (
        <Copy size={12} />
      )}
    </button>
  );
}
