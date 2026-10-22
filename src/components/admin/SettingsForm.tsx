"use client";

import { useState, type FormEvent } from "react";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import { TextField } from "@/components/ui/Field";
import { LoadingState } from "@/components/ui/Spinner";
import { useAsyncData } from "@/hooks/useAsyncData";
import { getErrorMessage } from "@/lib/errors";
import { getSettings, saveSettings } from "@/lib/firestore/settings";
import { TIME_LIMIT, validateTimeLimit } from "@/lib/validation";
import type { AppSettings } from "@/types";

export default function SettingsForm() {
  const { data, error, loading } = useAsyncData(getSettings);

  return (
    <div className="flex max-w-xl flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold">Ayarlar</h1>
        <p className="mt-2 text-base text-muted">Bu değerler yarışma kurulum ekranında varsayılan olarak gelir.</p>
      </div>
      {loading && <LoadingState />}
      {!!error && <Alert tone="error">Ayarlar yüklenemedi: {getErrorMessage(error)}</Alert>}
      {data && <SettingsFields initial={data} />}
    </div>
  );
}

function SettingsFields({ initial }: { initial: AppSettings }) {
  const [timeLimit, setTimeLimit] = useState(String(initial.defaultTimeLimitSec));
  const [busy, setBusy] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [result, setResult] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setResult(null);
    const seconds = Number(timeLimit);
    const validation = validateTimeLimit(seconds);
    setFieldError(validation);
    if (validation) return;

    setBusy(true);
    try {
      await saveSettings({ defaultTimeLimitSec: seconds });
      setResult({ tone: "success", text: "Ayarlar kaydedildi." });
    } catch (err) {
      setResult({ tone: "error", text: getErrorMessage(err) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-5 rounded-xl border border-line bg-surface p-6"
      noValidate
    >
      <TextField
        label="Varsayılan süre sınırı (saniye)"
        hint={`Süre sınırı açıldığında her soru için verilen süre. ${TIME_LIMIT.minSec}–${TIME_LIMIT.maxSec} saniye arası.`}
        type="number"
        inputMode="numeric"
        min={TIME_LIMIT.minSec}
        max={TIME_LIMIT.maxSec}
        value={timeLimit}
        onChange={(e) => {
          setTimeLimit(e.target.value);
          setResult(null);
        }}
        error={fieldError}
      />
      {result && <Alert tone={result.tone}>{result.text}</Alert>}
      <Button type="submit" loading={busy} className="self-start">
        Kaydet
      </Button>
    </form>
  );
}
