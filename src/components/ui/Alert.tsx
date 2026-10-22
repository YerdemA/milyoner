import type { ReactNode } from "react";

type AlertProps = {
  tone?: "error" | "success" | "info";
  children: ReactNode;
};

const TONES = {
  error: { icon: "⚠", className: "border-danger/50 bg-danger/10 text-danger" },
  success: { icon: "✓", className: "border-success/50 bg-success/10 text-success" },
  info: { icon: "ℹ", className: "border-line bg-raised text-muted" },
};

// Icon + text so the meaning doesn't rely on color alone.
export default function Alert({ tone = "info", children }: AlertProps) {
  const { icon, className } = TONES[tone];
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`flex gap-3 rounded-lg border px-4 py-3 text-base ${className}`}
    >
      <span aria-hidden className="font-bold">
        {icon}
      </span>
      <div className="whitespace-pre-line">{children}</div>
    </div>
  );
}
