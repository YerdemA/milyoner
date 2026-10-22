"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { TextField } from "@/components/ui/Field";
import Modal from "@/components/ui/Modal";
import { LoadingState } from "@/components/ui/Spinner";
import { useAsyncData } from "@/hooks/useAsyncData";
import { getErrorMessage } from "@/lib/errors";
import {
  countQuestionsInPool,
  createPool,
  deletePool,
  listPools,
  renamePool,
} from "@/lib/firestore/pools";
import { POOL_NAME_MAX_LENGTH, validatePoolName } from "@/lib/validation";
import type { Pool } from "@/types";

type PoolWithCount = Pool & { questionCount: number };

async function loadPools(): Promise<PoolWithCount[]> {
  const pools = await listPools();
  const counts = await Promise.all(pools.map((p) => countQuestionsInPool(p.id)));
  return pools.map((p, i) => ({ ...p, questionCount: counts[i] }));
}

export default function PoolList() {
  const { data: pools, error, loading, reload } = useAsyncData(loadPools);
  const [renaming, setRenaming] = useState<PoolWithCount | null>(null);
  const [deleting, setDeleting] = useState<PoolWithCount | null>(null);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold">Soru havuzları</h1>
        <p className="mt-2 text-base text-muted">
          Soruları konulara göre havuzlarda toplayın. Yarışmayı başlatırken bir veya birden fazla
          havuz seçilebilir.
        </p>
      </div>

      <CreatePoolForm onCreated={reload} />

      {loading && <LoadingState />}
      {!!error && <Alert tone="error">Havuzlar yüklenemedi: {getErrorMessage(error)}</Alert>}

      {pools && pools.length === 0 && (
        <Alert>Henüz hiç havuz yok. Yukarıdan ilk havuzunuzu oluşturun.</Alert>
      )}

      {pools && pools.length > 0 && (
        <ul className="flex flex-col gap-3">
          {pools.map((pool) => (
            <li
              key={pool.id}
              className="flex flex-wrap items-center gap-4 rounded-xl border border-line bg-surface px-5 py-4"
            >
              <Link href={`/admin/havuzlar/${pool.id}`} className="group min-w-0 flex-1">
                <span className="block truncate text-xl font-semibold group-hover:text-accent">
                  {pool.name}
                </span>
                <span className="text-base text-muted">{pool.questionCount} soru</span>
              </Link>
              <div className="flex gap-2">
                <Link
                  href={`/admin/havuzlar/${pool.id}`}
                  className="inline-flex h-11 items-center rounded-lg bg-accent px-4 font-semibold text-on-accent hover:bg-accent-strong"
                >
                  Soruları düzenle
                </Link>
                <Button variant="secondary" onClick={() => setRenaming(pool)}>
                  Adını değiştir
                </Button>
                <Button variant="danger" onClick={() => setDeleting(pool)}>
                  Sil
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <RenamePoolDialog pool={renaming} onClose={() => setRenaming(null)} onRenamed={reload} />

      <ConfirmDialog
        open={!!deleting}
        title="Havuz silinsin mi?"
        confirmLabel={
          deleting?.questionCount ? `Havuzu ve ${deleting.questionCount} soruyu sil` : "Havuzu sil"
        }
        danger
        onClose={() => setDeleting(null)}
        onConfirm={async () => {
          if (!deleting) return;
          await deletePool(deleting.id);
          reload();
        }}
      >
        {deleting && (
          <>
            <p>
              <strong>“{deleting.name}”</strong> havuzu kalıcı olarak silinecek.
            </p>
            {deleting.questionCount > 0 ? (
              <p className="mt-3 font-semibold text-danger">
                ⚠ İçindeki {deleting.questionCount} soru da silinecek. Bu işlem geri alınamaz.
              </p>
            ) : (
              <p className="mt-3 text-muted">Bu havuzda hiç soru yok.</p>
            )}
          </>
        )}
      </ConfirmDialog>
    </div>
  );
}

function CreatePoolForm({ onCreated }: { onCreated: () => void }) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const validation = validatePoolName(name);
    if (validation) {
      setError(validation);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await createPool(name);
      setName("");
      onCreated();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-5 sm:flex-row sm:items-start"
      noValidate
    >
      <div className="flex-1">
        <TextField
          label="Yeni havuz adı"
          placeholder="ör. Kardiyovasküler sistem"
          value={name}
          maxLength={POOL_NAME_MAX_LENGTH}
          onChange={(e) => setName(e.target.value)}
          error={error}
        />
      </div>
      <Button type="submit" loading={busy} className="sm:mt-9">
        + Havuz oluştur
      </Button>
    </form>
  );
}

function RenamePoolDialog({
  pool,
  onClose,
  onRenamed,
}: {
  pool: Pool | null;
  onClose: () => void;
  onRenamed: () => void;
}) {
  return (
    <Modal open={!!pool} onClose={onClose} title="Havuzun adını değiştir">
      {pool && <RenameForm pool={pool} onClose={onClose} onRenamed={onRenamed} />}
    </Modal>
  );
}

function RenameForm({
  pool,
  onClose,
  onRenamed,
}: {
  pool: Pool;
  onClose: () => void;
  onRenamed: () => void;
}) {
  const [name, setName] = useState(pool.name);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const validation = validatePoolName(name);
    if (validation) {
      setError(validation);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await renamePool(pool.id, name);
      onRenamed();
      onClose();
    } catch (err) {
      setError(getErrorMessage(err));
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
      <TextField
        label="Havuz adı"
        value={name}
        maxLength={POOL_NAME_MAX_LENGTH}
        onChange={(e) => setName(e.target.value)}
        error={error}
        autoFocus
      />
      <div className="flex justify-end gap-3">
        <Button variant="secondary" onClick={onClose} disabled={busy}>
          Vazgeç
        </Button>
        <Button type="submit" loading={busy}>
          Kaydet
        </Button>
      </div>
    </form>
  );
}
