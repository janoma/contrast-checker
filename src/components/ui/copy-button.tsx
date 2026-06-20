import { Check, Copy } from "lucide-react";
import { useCallback, useState } from "preact/hooks";

import { useI18nContext } from "@/i18n/i18n-react";

export default function CopyButton({
  className,
  show,
  text,
}: {
  className?: string;
  show?: boolean;
  text: string;
}) {
  const { LL } = useI18nContext();
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
      className="shrink-0 rounded hover:bg-muted text-muted-foreground transition-colors inline-flex items-center gap-1 px-1.5 py-0 aspect-square"
      onClick={copy}
      title={LL.copyButtonTitle({ text })}
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
