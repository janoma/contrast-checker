function Badge({ pass }: { pass: boolean }) {
  return (
    <span
      className={`inline-flex items-center px-3 py-0.5 rounded-full text-xs font-bold tracking-wide text-white ${
        pass ? "bg-green-600" : "bg-red-600"
      }`}
    >
      {pass ? "Pass" : "Fail"}
    </span>
  );
}

export function WcagRow({ label, pass }: { label: string; pass: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-medium w-24 shrink-0">{label}:</span>
      <Badge pass={pass} />
    </div>
  );
}
