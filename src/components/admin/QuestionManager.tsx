"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Modal from "@/components/ui/Modal";
import { LoadingState } from "@/components/ui/Spinner";
import { useAsyncData } from "@/hooks/useAsyncData";
import { getErrorMessage } from "@/lib/errors";
import { getPool } from "@/lib/firestore/pools";
import { deleteQuestion, listQuestionsByPool } from "@/lib/firestore/questions";
import type { Question } from "@/types";
import QuestionForm, { optionLetter } from "./QuestionForm";

// Turkish-aware lowercase so "İ"/"I" and "i"/"ı" match the way users expect.
const normalize = (s: string) => s.toLocaleLowerCase("tr");

type Editing = { mode: "new"; formKey: number; notice?: string } | { mode: "edit"; question: Question };

export default function QuestionManager({ poolId }: { poolId: string }) {
  const { data, error, loading, reload } = useAsyncData(
    async () => {
      const [pool, questions] = await Promise.all([getPool(poolId), listQuestionsByPool(poolId)]);
      return { pool, questions };
    },
    poolId,
  );
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Editing | null>(null);
  const [deleting, setDeleting] = useState<Question | null>(null);

  const questions = data?.questions;
  const filtered = useMemo(() => {
    if (!questions) return [];
    const term = normalize(search.trim());
    if (!term) return questions;
    return questions.filter((q) =>
      [q.text, ...q.options, q.explanation ?? ""].some((s) => normalize(s).includes(term)),
    );
  }, [questions, search]);

  if (loading) return <LoadingState />;
  if (error) return <Alert tone="error">Sorular yüklenemedi: {getErrorMessage(error)}</Alert>;
  if (!data?.pool) {
    return (
      <div className="flex flex-col items-start gap-4">
        <Alert tone="error">Bu havuz bulunamadı. Silinmiş olabilir.</Alert>
        <BackLink />
      </div>
    );
  }

  const { pool } = data;
  const all = data.questions;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <BackLink />
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">{pool.name}</h1>
            <p className="mt-1 text-base text-muted">{all.length} soru</p>
          </div>
          <Button size="lg" onClick={() => setEditing({ mode: "new", formKey: 0 })}>
            + Yeni soru
          </Button>
        </div>
      </div>

      {all.length > 0 && (
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Sorularda ara (soru metni, şıklar, açıklama)…"
          aria-label="Sorularda ara"
          className="w-full rounded-lg border border-line bg-surface px-4 py-3 text-base focus:border-accent focus:outline-none"
        />
      )}

      {all.length === 0 && (
        <Alert>Bu havuzda henüz soru yok. “+ Yeni soru” butonuyla ilk soruyu ekleyin.</Alert>
      )}
      {all.length > 0 && filtered.length === 0 && (
        <Alert>“{search}” için eşleşen soru bulunamadı.</Alert>
      )}
      {search && filtered.length > 0 && (
        <p className="text-sm text-muted">
          {all.length} sorudan {filtered.length} tanesi gösteriliyor.
        </p>
      )}

      <ol className="flex flex-col gap-4">
        {filtered.map((q) => (
          <QuestionCard
            key={q.id}
            question={q}
            number={all.indexOf(q) + 1}
            onEdit={() => setEditing({ mode: "edit", question: q })}
            onDelete={() => setDeleting(q)}
          />
        ))}
      </ol>

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing?.mode === "edit" ? "Soruyu düzenle" : "Yeni soru"}
        size="lg"
      >
        {editing && (
          <QuestionForm
            // A new key remounts the form with empty fields after "save and add another".
            key={editing.mode === "edit" ? editing.question.id : `new-${editing.formKey}`}
            poolId={pool.id}
            question={editing.mode === "edit" ? editing.question : undefined}
            notice={editing.mode === "new" ? editing.notice : undefined}
            onCancel={() => setEditing(null)}
            onSaved={(addAnother) => {
              reload();
              if (addAnother && editing.mode === "new") {
                setEditing({
                  mode: "new",
                  formKey: editing.formKey + 1,
                  notice: "Soru kaydedildi. Sıradaki soruyu yazabilirsiniz.",
                });
              } else {
                setEditing(null);
              }
            }}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        title="Soru silinsin mi?"
        confirmLabel="Soruyu sil"
        danger
        onClose={() => setDeleting(null)}
        onConfirm={async () => {
          if (!deleting) return;
          await deleteQuestion(deleting.id);
          reload();
        }}
      >
        {deleting && (
          <>
            <p className="rounded-lg bg-raised p-3 italic">“{deleting.text}”</p>
            <p className="mt-3">Bu soru kalıcı olarak silinecek. Bu işlem geri alınamaz.</p>
          </>
        )}
      </ConfirmDialog>
    </div>
  );
}

function BackLink() {
  return (
    <Link href="/admin" className="text-base text-muted hover:text-fg">
      ← Tüm havuzlar
    </Link>
  );
}

function QuestionCard({
  question,
  number,
  onEdit,
  onDelete,
}: {
  question: Question;
  number: number;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <li className="flex flex-col gap-4 rounded-xl border border-line bg-surface p-5">
      <div className="flex items-start gap-4">
        <span className="shrink-0 text-lg font-bold text-muted">{number}.</span>
        <p className="flex-1 text-lg font-medium">{question.text}</p>
        <div className="flex shrink-0 gap-2">
          <Button variant="secondary" onClick={onEdit}>
            Düzenle
          </Button>
          <Button variant="danger" onClick={onDelete}>
            Sil
          </Button>
        </div>
      </div>
      <ul className="grid gap-2 sm:grid-cols-2">
        {question.options.map((option, i) => {
          const correct = i === question.correctIndex;
          return (
            <li
              key={i}
              className={`flex items-center gap-3 rounded-lg border px-3 py-2 ${correct ? "border-success bg-success/10" : "border-line"}`}
            >
              <span className="font-bold">{optionLetter(i)}</span>
              <span className="flex-1">{option}</span>
              {correct && <span className="text-sm font-semibold text-success">✓ Doğru</span>}
            </li>
          );
        })}
      </ul>
      {question.explanation && (
        <p className="text-base text-muted">
          <span className="font-semibold text-fg">Açıklama:</span> {question.explanation}
        </p>
      )}
    </li>
  );
}
