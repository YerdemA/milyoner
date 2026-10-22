"use client";

import { useState, type ReactNode } from "react";
import { getErrorMessage } from "@/lib/errors";
import Alert from "./Alert";
import Button from "./Button";
import Modal from "./Modal";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  children: ReactNode;
  confirmLabel: string;
  danger?: boolean;
  /** May be async; the dialog shows a spinner and any error until it settles. */
  onConfirm: () => Promise<void> | void;
  onClose: () => void;
};

export default function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel,
  danger = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function close() {
    if (busy) return;
    setError(null);
    onClose();
  }

  async function confirm() {
    setBusy(true);
    setError(null);
    try {
      await onConfirm();
      setBusy(false);
      onClose();
    } catch (e) {
      setBusy(false);
      setError(getErrorMessage(e));
    }
  }

  return (
    <Modal open={open} onClose={close} title={title}>
      <div className="flex flex-col gap-5">
        <div className="text-base leading-relaxed">{children}</div>
        {error && <Alert tone="error">{error}</Alert>}
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={close} disabled={busy}>
            Vazgeç
          </Button>
          <Button variant={danger ? "danger" : "primary"} onClick={confirm} loading={busy}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
