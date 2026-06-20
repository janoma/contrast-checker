import { WcagRow } from "./WcagRow";

interface PreviewSectionProps {
  heading: string;
  wcagRows: { label: string; pass: boolean }[];
  fgCss: string;
  bgCss: string;
  previewContent: React.ReactNode;
}

export function PreviewSection({
  heading,
  wcagRows,
  fgCss,
  bgCss,
  previewContent,
}: PreviewSectionProps) {
  return (
    <section className="space-y-3">
      <h2 className="example">{heading}</h2>
      <div className="flex flex-col sm:flex-row items-stretch gap-3 sm:gap-6">
        <div className="space-y-2 shrink-0 flex flex-col justify-center">
          {wcagRows.map((r) => (
            <WcagRow key={r.label} label={r.label} pass={r.pass} />
          ))}
        </div>
        <div
          className="flex-1 rounded-md overflow-hidden border"
          style={{ backgroundColor: bgCss }}
        >
          <div className="p-5" style={{ color: fgCss }}>
            {previewContent}
          </div>
        </div>
      </div>
    </section>
  );
}
