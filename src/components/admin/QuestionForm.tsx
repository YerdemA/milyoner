"use client";

import { useState, type FormEvent } from "react";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import { TextArea } from "@/components/ui/Field";
import { getErrorMessage } from "@/lib/errors";
import { createQuestion, updateQuestion } from "@/lib/firestore/questions";
import { QUESTION_LIMITS, normalizeQuestionInput, validateQuestionInput } from "@/lib/validation";
import type { Question, QuestionInput } from "@/types";

export const optionLetter = (index: number) => String.fromCharCode(65 + index); // A, B, C...

type QuestionFormProps = {
  poolId: string;
  /** Existing question to edit; omit to create a new one. */
  question?: Question;
  /** Shown above the form, e.g. after "save and add another". */
  notice?: string;
  onSaved: (addAnother: boolean) => void;
  onCancel: () => void;
};

export default function QuestionForm({
  poolId,
  question,
  notice,
  onSaved,
  onCancel,
}: QuestionFormProps) {
  const [text, setText] = useState(question?.text ?? "");
  const [options, setOptions] = useState<string[]>(
    question?.options ?? Array(QUESTION_LIMITS.defaultOptionCount).fill(""),
  );
  const [correctIndex, setCorrectIndex] = useState(question?.correctIndex ?? -1);
  const [explanation, setExplanation] = useState(question?.explanation ?? "");
  const [errors, setErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState<"save" | "saveAndNew" | null>(null);

  function updateOption(index: number, value: string) {
    setOptions((prev) => prev.map((o, i) => (i === index ? value : o)));
  }

  function removeOption(index: number) {
    setOptions((prev) => prev.filter((_, i) => i !== index));
    setCorrectIndex((prev) => (prev === index ? -1 : prev > index ? prev - 1 : prev));
  }

  async function save(addAnother: boolean) {
    const input: QuestionInput = normalizeQuestionInput({
      poolId,
      text,
      options,
      correctIndex,
      explanation,
      imageUrl: question?.imageUrl ?? null,
    });
    const validationErrors = validateQuestionInput(input);
    setErrors(validationErrors);
    if (validationErrors.length > 0) return;

    setBusy(addAnother ? "saveAndNew" : "save");
    try {
      if (question) await updateQuestion(question.id, input);
      else await createQuestion(input);
      onSaved(addAnother);
    } catch (err) {
      setErrors([getErrorMessage(err)]);
      setBusy(null);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    save(false);
  }

  const canAddOption = options.length < QUESTION_LIMITS.maxOptions;
  const canRemoveOption = options.length > QUESTION_LIMITS.minOptions;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
      {notice && <Alert tone="success">{notice}</Alert>}

      <TextArea
        label="Soru metni"
        rows={3}
        value={text}
        maxLength={QUESTION_LIMITS.textMaxLength}
        onChange={(e) => setText(e.target.value)}
        placeholder="ör. Normal bir yetişkinde dakikadaki solunum sayısı kaçtır?"
        autoFocus
      />

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-1 text-base font-medium">
          Şıklar <span className="text-muted">(doğru cevabı işaretleyin)</span>
        </legend>
        {options.map((option, i) => {
          const isCorrect = correctIndex === i;
          return (
            <div
              key={i}
              className={`flex items-center gap-3 rounded-lg border p-2 ${isCorrect ? "border-success bg-success/10" : "border-line"}`}
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-raised text-lg font-bold">
                {optionLetter(i)}
              </span>
              <input
                aria-label={`${optionLetter(i)} şıkkı`}
                value={option}
                maxLength={QUESTION_LIMITS.optionMaxLength}
                onChange={(e) => updateOption(i, e.target.value)}
                className="min-w-0 flex-1 rounded-md border border-line bg-bg px-3 py-2 text-base focus:border-accent focus:outline-none"
              />
              <label
                className={`flex shrink-0 cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold ${isCorrect ? "text-success" : "text-muted hover:text-fg"}`}
              >
                <input
                  type="radio"
                  name="correct"
                  checked={isCorrect}
                  onChange={() => setCorrectIndex(i)}
                  className="size-5 accent-success"
                />
                {isCorrect ? "✓ Doğru cevap" : "Doğru cevap"}
              </label>
              {canRemoveOption && (
                <button
                  type="button"
                  onClick={() => removeOption(i)}
                  aria-label={`${optionLetter(i)} şıkkını kaldır`}
                  title="Şıkkı kaldır"
                  className="shrink-0 rounded-md px-2 py-1 text-xl text-muted hover:bg-danger/15 hover:text-danger"
                >
                  ×
                </button>
              )}
            </div>
          );
        })}
        {canAddOption && (
          <Button
            variant="ghost"
            className="self-start"
            onClick={() => setOptions((prev) => [...prev, ""])}
          >
            + Şık ekle
          </Button>
        )}
      </fieldset>

      <TextArea
        label="Açıklama (isteğe bağlı)"
        hint="Cevap açıklandıktan sonra gösterilecek kısa bilgi notu."
        rows={2}
        value={explanation}
        maxLength={QUESTION_LIMITS.explanationMaxLength}
        onChange={(e) => setExplanation(e.target.value)}
      />

      {errors.length > 0 && <Alert tone="error">{errors.join("\n")}</Alert>}

      <div className="flex flex-wrap justify-end gap-3">
        <Button variant="secondary" onClick={onCancel} disabled={!!busy}>
          Vazgeç
        </Button>
        {!question && (
          <Button
            variant="secondary"
            onClick={() => save(true)}
            loading={busy === "saveAndNew"}
            disabled={!!busy}
          >
            Kaydet ve yeni soru ekle
          </Button>
        )}
        <Button type="submit" loading={busy === "save"} disabled={!!busy}>
          Kaydet
        </Button>
      </div>
    </form>
  );
}
