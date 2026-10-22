"use client";

import { useRef, useState, type ChangeEvent, type ReactNode } from "react";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Spinner from "@/components/ui/Spinner";
import { getErrorMessage } from "@/lib/errors";
import { createQuestions } from "@/lib/firestore/questions";
import { TEMPLATE_URL, readQuestionFile, type ImportPreview } from "@/lib/importQuestions";
import { optionLetter } from "./QuestionForm";

type Step =
  | { name: "pick"; error?: string }
  | { name: "reading" }
  | { name: "preview"; fileName: string; preview: ImportPreview; error?: string }
  | { name: "saving"; total: number; done: number }
  | { name: "done"; added: number };

type ImportQuestionsDialogProps = {
  open: boolean;
  poolId: string;
  poolName: string;
  existingTexts: string[];
  onClose: () => void;
  onImported: () => void;
};

export default function ImportQuestionsDialog({ open, onClose, ...rest }: ImportQuestionsDialogProps) {
  const [busy, setBusy] = useState(false);
  return (
    <Modal open={open} onClose={onClose} title="Excel'den soru içe aktar" size="lg" dismissible={!busy}>
      {/* Mounted only while open, so every opening starts from the first step. */}
      <ImportFlow {...rest} onClose={onClose} onBusyChange={setBusy} />
    </Modal>
  );
}

function ImportFlow({
  poolId,
  poolName,
  existingTexts,
  onClose,
  onImported,
  onBusyChange,
}: Omit<ImportQuestionsDialogProps, "open"> & { onBusyChange: (busy: boolean) => void }) {
  const [step, setStep] = useState<Step>({ name: "pick" });
  const fileInput = useRef<HTMLInputElement>(null);

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow picking the same file again after fixing it
    if (!file) return;
    setStep({ name: "reading" });
    try {
      const preview = await readQuestionFile(file, existingTexts);
      setStep({ name: "preview", fileName: file.name, preview });
    } catch (err) {
      setStep({ name: "pick", error: getErrorMessage(err) });
    }
  }

  async function save(preview: ImportPreview, fileName: string) {
    const inputs = preview.valid.map((q) => ({
      poolId,
      text: q.text,
      options: q.options,
      correctIndex: q.correctIndex,
      explanation: q.explanation,
      imageUrl: q.imageUrl,
    }));
    setStep({ name: "saving", total: inputs.length, done: 0 });
    onBusyChange(true);
    try {
      await createQuestions(inputs, (done) => setStep({ name: "saving", total: inputs.length, done }));
      setStep({ name: "done", added: inputs.length });
    } catch (err) {
      // Some questions may already be saved; re-reading the file will skip them as duplicates.
      setStep({ name: "preview", fileName, preview, error: getErrorMessage(err) });
    } finally {
      onBusyChange(false);
      onImported();
    }
  }

  const pickButton = (label: string, variant: "primary" | "secondary" = "primary") => (
    <Button variant={variant} size="lg" onClick={() => fileInput.current?.click()}>
      {label}
    </Button>
  );

  return (
    <div className="flex flex-col gap-5">
      <input
        ref={fileInput}
        type="file"
        accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        className="hidden"
        onChange={handleFile}
      />

      {step.name === "pick" && (
        <>
          <p className="text-base leading-relaxed">
            Sorular <strong>“{poolName}”</strong> havuzuna eklenecek. Excel dosyası örnek şablondaki
            sütunlara uygun olmalı: <strong>Soru, A, B, C, D, E, F, Doğru Cevap, Açıklama</strong>.
          </p>
          <ol className="list-decimal space-y-1 pl-6 text-base text-muted">
            <li>Örnek şablonu indirin ve “Nasıl doldurulur” sayfasını okuyun.</li>
            <li>Sarı örnek satırları silip kendi sorularınızı yazın, dosyayı kaydedin.</li>
            <li>Aşağıdan dosyayı seçin. Eklemeden önce kontrol sonucunu göreceksiniz.</li>
          </ol>
          {step.error && <Alert tone="error">{step.error}</Alert>}
          <div className="flex flex-wrap gap-3">
            <a
              href={TEMPLATE_URL}
              download="soru-sablonu.xlsx"
              className="inline-flex h-14 items-center rounded-lg border border-line bg-raised px-6 text-lg font-semibold hover:border-muted"
            >
              ⬇ Örnek şablonu indir
            </a>
            {pickButton("Excel dosyası seç…")}
          </div>
        </>
      )}

      {step.name === "reading" && (
        <div role="status" className="flex items-center gap-3 py-8 text-lg text-muted">
          <Spinner /> Dosya okunuyor…
        </div>
      )}

      {step.name === "preview" && (
        <PreviewStep
          step={step}
          onPickAgain={pickButton("Başka dosya seç", "secondary")}
          onSave={() => save(step.preview, step.fileName)}
          onClose={onClose}
        />
      )}

      {step.name === "saving" && (
        <div role="status" className="flex flex-col gap-3 py-6">
          <p className="flex items-center gap-3 text-lg">
            <Spinner /> Sorular ekleniyor… {step.done} / {step.total}
          </p>
          <div className="h-3 overflow-hidden rounded-full bg-raised">
            <div
              className="h-full bg-accent transition-[width]"
              style={{ width: `${step.total ? (step.done / step.total) * 100 : 0}%` }}
            />
          </div>
          <p className="text-sm text-muted">Lütfen bu pencereyi kapatmayın.</p>
        </div>
      )}

      {step.name === "done" && (
        <>
          <Alert tone="success">
            {step.added} soru <strong>“{poolName}”</strong> havuzuna eklendi.
          </Alert>
          <div className="flex justify-end">
            <Button size="lg" onClick={onClose}>
              Tamam
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

function PreviewStep({
  step,
  onPickAgain,
  onSave,
  onClose,
}: {
  step: Extract<Step, { name: "preview" }>;
  onPickAgain: ReactNode;
  onSave: () => void;
  onClose: () => void;
}) {
  const { preview, fileName, error } = step;
  const { valid, errors, duplicates } = preview;
  const nothingFound = valid.length === 0 && errors.length === 0 && duplicates.length === 0;

  return (
    <>
      <p className="text-base text-muted">
        Dosya: <span className="text-fg">{fileName}</span>
      </p>

      {nothingFound && <Alert tone="error">Dosyada hiç soru bulunamadı.</Alert>}

      {valid.length > 0 && (
        <Alert tone="success">
          <strong>{valid.length} soru</strong> eklenmeye hazır.
        </Alert>
      )}

      {errors.length > 0 && (
        <div className="flex flex-col gap-2">
          <Alert tone="error">
            <strong>{errors.length} satırda hata var.</strong> Bu satırlar eklenmeyecek. Excel&apos;de
            düzeltip dosyayı tekrar seçebilirsiniz.
          </Alert>
          <ul className="max-h-48 overflow-y-auto rounded-lg border border-line bg-bg p-3 text-sm">
            {errors.map((e) => (
              <li key={e.row} className="py-1">
                <span className="font-semibold text-danger">Satır {e.row}:</span>{" "}
                {e.messages.join(" ")}
              </li>
            ))}
          </ul>
        </div>
      )}

      {duplicates.length > 0 && (
        <details className="rounded-lg border border-line bg-raised px-4 py-3 text-base">
          <summary className="cursor-pointer text-muted">
            ↷ {duplicates.length} soru zaten havuzda (veya dosyada iki kez) var, atlanacak.
          </summary>
          <ul className="mt-2 max-h-40 overflow-y-auto text-sm">
            {duplicates.map((d) => (
              <li key={d.row} className="py-1">
                Satır {d.row}: {d.text}
              </li>
            ))}
          </ul>
        </details>
      )}

      {valid.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold text-muted">Önizleme (ilk 5 soru)</p>
          <ul className="flex flex-col gap-2">
            {valid.slice(0, 5).map((q) => (
              <li key={q.row} className="rounded-lg border border-line px-3 py-2 text-sm">
                <span className="text-muted">Satır {q.row}:</span> {q.text}{" "}
                <span className="whitespace-nowrap font-semibold text-success">
                  ✓ {optionLetter(q.correctIndex)}) {q.options[q.correctIndex]}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {error && <Alert tone="error">{error}</Alert>}

      <div className="flex flex-wrap justify-end gap-3">
        <Button variant="ghost" size="lg" onClick={onClose}>
          Vazgeç
        </Button>
        {onPickAgain}
        {valid.length > 0 && (
          <Button size="lg" onClick={onSave}>
            {valid.length} soruyu ekle
          </Button>
        )}
      </div>
    </>
  );
}
