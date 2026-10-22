import {
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type TextareaHTMLAttributes,
} from "react";

const CONTROL =
  "w-full rounded-lg border border-line bg-bg px-4 py-3 text-base text-fg placeholder:text-muted/60 focus:border-accent focus:outline-none aria-[invalid=true]:border-danger";

type FieldShellProps = {
  label: string;
  hint?: string;
  error?: string | null;
};

function FieldShell({
  id,
  label,
  hint,
  error,
  children,
}: FieldShellProps & { id: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-base font-medium">
        {label}
      </label>
      {children}
      {hint && !error && <p className="text-sm text-muted">{hint}</p>}
      {error && <p className="text-sm text-danger">⚠ {error}</p>}
    </div>
  );
}

export function TextField({
  label,
  hint,
  error,
  ...rest
}: FieldShellProps & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} hint={hint} error={error}>
      <input id={id} aria-invalid={!!error} className={CONTROL} {...rest} />
    </FieldShell>
  );
}

export function TextArea({
  label,
  hint,
  error,
  ...rest
}: FieldShellProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} hint={hint} error={error}>
      <textarea id={id} aria-invalid={!!error} className={`${CONTROL} resize-y`} {...rest} />
    </FieldShell>
  );
}
