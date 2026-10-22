"use client";

import { useOnline } from "@/hooks/useOnline";

/** Shown only while the browser is offline. */
export default function OfflineNotice({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const online = useOnline();
  if (online) return null;
  return (
    <p role="status" className={`rounded-xl border border-accent/60 bg-accent/10 px-4 py-3 text-base ${className}`}>
      <strong className="text-accent">⚠ İnternet bağlantısı yok.</strong> {children}
    </p>
  );
}
