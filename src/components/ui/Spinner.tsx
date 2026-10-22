export default function Spinner({ className = "size-6" }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`inline-block animate-spin rounded-full border-2 border-current border-r-transparent ${className}`}
    />
  );
}

/** Centered spinner with a text, for whole sections that are loading. */
export function LoadingState({ text = "Yükleniyor…" }: { text?: string }) {
  return (
    <div role="status" className="flex items-center justify-center gap-3 py-16 text-muted">
      <Spinner />
      <span className="text-lg">{text}</span>
    </div>
  );
}
