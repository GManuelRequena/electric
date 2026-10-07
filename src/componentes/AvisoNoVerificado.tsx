export function AvisoNoVerificado({ children }: { children: React.ReactNode }) {
  return (
    <p role="note" className="flex gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
      <span aria-hidden>⚠</span>
      <span>{children}</span>
    </p>
  );
}
