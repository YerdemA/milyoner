"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import OfflineNotice from "@/components/ui/OfflineNotice";
import NumberStepper from "@/components/ui/NumberStepper";
import { LoadingState } from "@/components/ui/Spinner";
import Switch from "@/components/ui/Switch";
import ThemeSwitcher from "@/components/ui/ThemeSwitcher";
import { useAsyncData } from "@/hooks/useAsyncData";
import { getErrorMessage } from "@/lib/errors";
import { countQuestionsInPool, listPools } from "@/lib/firestore/pools";
import { warmOfflineCache } from "@/lib/firestore/offline";
import { getSettings } from "@/lib/firestore/settings";
import { buildQuiz, loadLastConfig, saveLastConfig, saveQuiz } from "@/lib/quiz";
import {
  EXTRA_TIME_SEC,
  QUESTION_COUNT,
  TOTAL_POINTS,
  formatPoints,
  pointsPerQuestion,
} from "@/lib/quizConfig";
import { TIME_LIMIT } from "@/lib/validation";
import type { AppSettings, JokerSettings, Pool } from "@/types";

type PoolWithCount = Pool & { questionCount: number };
type SetupData = { pools: PoolWithCount[]; settings: AppSettings };

async function loadSetupData(): Promise<SetupData> {
  const [pools, settings] = await Promise.all([listPools(), getSettings()]);
  const counts = await Promise.all(pools.map((p) => countQuestionsInPool(p.id)));
  return { pools: pools.map((p, i) => ({ ...p, questionCount: counts[i] })), settings };
}

export default function QuizSetup() {
  const { data, error, loading } = useAsyncData(loadSetupData);

  // Once the screen is ready, save every pool's questions for offline use.
  useEffect(() => {
    if (data) void warmOfflineCache();
  }, [data]);

  return (
    <main className="relative flex flex-1 flex-col">
      {/* Stage light. Clipped by its own wrapper: putting overflow-hidden on <main> (a flex item)
          lets it shrink to the viewport height, which cut off the page and broke scrolling. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-x-0 -top-40 mx-auto h-[28rem] max-w-4xl rounded-full bg-accent/15 blur-3xl" />
        <div className="absolute -right-40 bottom-0 h-[24rem] w-[36rem] rounded-full bg-glow-2/10 blur-3xl" />
      </div>
      <div className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-10">
        <ThemeSwitcher className="self-end" />
        <header className="-mt-4 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-accent">Sınıf içi</p>
          <h1 className="mt-2 text-5xl font-black tracking-tight md:text-6xl">Bilgi Yarışması</h1>
          <p className="mt-3 text-lg text-muted">Soru havuzlarını seçin, ayarları yapın ve yarışmayı başlatın.</p>
        </header>

        <OfflineNotice>Bu bilgisayarda daha önce açılmış sorularla yarışma başlatılabilir.</OfflineNotice>
        {loading && <LoadingState text="Soru havuzları yükleniyor…" />}
        {!!error && <Alert tone="error">Veriler yüklenemedi: {getErrorMessage(error)}</Alert>}
        {data && <SetupForm data={data} />}

        <footer className="mt-auto pt-6 text-center">
          <Link href="/admin" className="text-sm text-muted hover:text-fg">
            Yönetim paneli
          </Link>
        </footer>
      </div>
    </main>
  );
}

function SetupForm({ data }: { data: SetupData }) {
  const router = useRouter();
  const { pools, settings } = data;
  const usablePools = pools.filter((p) => p.questionCount > 0);

  // Start from the previous setup on this computer, keeping only pools that still have questions.
  const [initial] = useState(() => {
    const last = loadLastConfig();
    const lastPools = (last?.poolIds ?? []).filter((id) => usablePools.some((p) => p.id === id));
    return {
      poolIds: lastPools.length > 0 ? lastPools : usablePools.map((p) => p.id),
      questionCount: last?.questionCount ?? QUESTION_COUNT.default,
      timeEnabled: last ? last.timeLimitSec != null : false,
      timeLimitSec: last?.timeLimitSec ?? settings.defaultTimeLimitSec,
      totalPoints: last?.totalPoints ?? TOTAL_POINTS.default,
      jokers: { fiftyFifty: true, extraTime: true, doubleAnswer: true, ...last?.jokers },
    };
  });

  const [poolIds, setPoolIds] = useState<string[]>(initial.poolIds);
  const [questionCount, setQuestionCount] = useState(initial.questionCount);
  const [timeEnabled, setTimeEnabled] = useState(initial.timeEnabled);
  const [timeLimitSec, setTimeLimitSec] = useState(initial.timeLimitSec);
  const [totalPoints, setTotalPoints] = useState(initial.totalPoints);
  const [jokers, setJokers] = useState<JokerSettings>(initial.jokers);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  if (usablePools.length === 0) {
    return (
      <Alert>
        Henüz soru içeren bir havuz yok. Yarışma başlatmak için{" "}
        <Link href="/admin" className="font-semibold text-accent underline">
          yönetim panelinden
        </Link>{" "}
        havuz oluşturup soru ekleyin.
      </Alert>
    );
  }

  const available = usablePools
    .filter((p) => poolIds.includes(p.id))
    .reduce((sum, p) => sum + p.questionCount, 0);
  const maxCount = Math.max(QUESTION_COUNT.min, Math.min(QUESTION_COUNT.max, available));
  const effectiveCount = Math.min(questionCount, maxCount);
  const perQuestion = pointsPerQuestion(effectiveCount, totalPoints);

  function togglePool(id: string) {
    setPoolIds((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
  }

  async function handleStart(e: FormEvent) {
    e.preventDefault();
    if (poolIds.length === 0) {
      setStartError("En az bir soru havuzu seçin.");
      return;
    }
    const config = {
      poolIds,
      questionCount: effectiveCount,
      timeLimitSec: timeEnabled ? timeLimitSec : null,
      totalPoints,
      jokers: { ...jokers, extraTime: jokers.extraTime && timeEnabled },
    };
    setStarting(true);
    setStartError(null);
    try {
      const quiz = await buildQuiz(config);
      saveQuiz(quiz);
      saveLastConfig({ ...config, jokers }); // remember the joker choice even if time was off
      router.push("/yarisma");
    } catch (err) {
      setStartError(getErrorMessage(err));
      setStarting(false);
    }
  }

  const allSelected = usablePools.every((p) => poolIds.includes(p.id));

  return (
    // noValidate: the browser's step check would silently block submit for e.g. 31 s with step 5;
    // NumberStepper already clamps values to the allowed range.
    <form onSubmit={handleStart} className="grid gap-8 lg:grid-cols-[1.2fr_1fr]" noValidate>
      {/* Pools */}
      <section className="flex flex-col gap-4">
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-2xl font-bold">1. Soru havuzları</h2>
          <button
            type="button"
            onClick={() => setPoolIds(allSelected ? [] : usablePools.map((p) => p.id))}
            className="text-base font-semibold text-accent hover:text-accent-strong"
          >
            {allSelected ? "Seçimi temizle" : "Tümünü seç"}
          </button>
        </div>
        <ul className="grid gap-3 sm:grid-cols-2">
          {pools.map((pool) => {
            const selected = poolIds.includes(pool.id);
            const empty = pool.questionCount === 0;
            return (
              <li key={pool.id}>
                <button
                  type="button"
                  aria-pressed={selected}
                  disabled={empty}
                  onClick={() => togglePool(pool.id)}
                  className={`flex h-full w-full items-center gap-4 rounded-xl border-2 px-4 py-4 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-40 ${
                    selected
                      ? "border-accent bg-accent/10"
                      : "border-line bg-surface hover:border-muted"
                  }`}
                >
                  <span
                    aria-hidden
                    className={`flex size-8 shrink-0 items-center justify-center rounded-md border-2 text-lg font-black ${
                      selected ? "border-accent bg-accent text-on-accent" : "border-line"
                    }`}
                  >
                    {selected ? "✓" : ""}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-lg font-semibold">{pool.name}</span>
                    <span className="text-sm text-muted">
                      {empty ? "Soru yok" : `${pool.questionCount} soru`}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        <p className="text-base text-muted">
          Seçilen havuzlarda toplam <strong className="text-fg">{available}</strong> soru var.
        </p>
      </section>

      {/* Settings */}
      <section className="flex flex-col gap-6">
        <h2 className="text-2xl font-bold">2. Ayarlar</h2>

        <NumberStepper
          label="Soru sayısı"
          value={effectiveCount}
          min={QUESTION_COUNT.min}
          max={maxCount}
          onChange={setQuestionCount}
          hint={
            available < QUESTION_COUNT.max
              ? `Seçilen havuzlarla en fazla ${maxCount} soru sorulabilir.`
              : `En fazla ${QUESTION_COUNT.max} soru.`
          }
        />

        <NumberStepper
          label="Toplam puan"
          value={totalPoints}
          min={TOTAL_POINTS.min}
          max={TOTAL_POINTS.max}
          step={TOTAL_POINTS.step}
          onChange={setTotalPoints}
          hint={`Her doğru cevap ${formatPoints(perQuestion)} puan. Yanlış cevap 0 puan.`}
        />

        <div className="flex flex-col gap-3">
          <Switch
            label="Süre sınırı"
            description="Her soru için geri sayım. Süre dolarsa cevap yanlış sayılır."
            checked={timeEnabled}
            onChange={setTimeEnabled}
          />
          {timeEnabled && (
            <NumberStepper
              label="Soru başına süre"
              value={timeLimitSec}
              min={TIME_LIMIT.minSec}
              max={TIME_LIMIT.maxSec}
              step={5}
              suffix="saniye"
              onChange={setTimeLimitSec}
            />
          )}
        </div>

        <fieldset className="flex flex-col gap-3">
          <legend className="mb-3 text-lg font-semibold">
            Jokerler <span className="text-base font-normal text-muted">(her biri bir kez)</span>
          </legend>
          <Switch
            label="Yarı yarıya"
            description="Doğru cevapla birlikte yalnızca bir yanlış şık kalır."
            checked={jokers.fiftyFifty}
            onChange={(v) => setJokers((j) => ({ ...j, fiftyFifty: v }))}
          />
          <Switch
            label="Çift cevap"
            description="İlk tahmin yanlışsa ikinci bir tahmin hakkı."
            checked={jokers.doubleAnswer}
            onChange={(v) => setJokers((j) => ({ ...j, doubleAnswer: v }))}
          />
          <Switch
            label="Süre ekleme"
            description={
              timeEnabled ? `Süreye +${EXTRA_TIME_SEC} saniye eklenir.` : "Yalnızca süre sınırı açıkken kullanılabilir."
            }
            checked={jokers.extraTime && timeEnabled}
            disabled={!timeEnabled}
            onChange={(v) => setJokers((j) => ({ ...j, extraTime: v }))}
          />
        </fieldset>

        {/* Sticks to the bottom of the screen so the start button is always reachable. */}
        <div className="sticky bottom-0 -mx-2 flex flex-col gap-3 bg-gradient-to-t from-bg from-70% to-transparent px-2 pb-4 pt-8">
          {startError && <Alert tone="error">{startError}</Alert>}
          <Button
            type="submit"
            size="lg"
            loading={starting}
            disabled={poolIds.length === 0}
            className="h-16 text-xl shadow-[0_0_40px_-8px] shadow-accent/60"
          >
            Yarışmayı başlat ▶
          </Button>
          {poolIds.length === 0 && (
            <p className="text-center text-sm text-muted">Başlatmak için en az bir havuz seçin.</p>
          )}
        </div>
      </section>
    </form>
  );
}
