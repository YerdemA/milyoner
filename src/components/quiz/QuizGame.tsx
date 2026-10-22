"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useReducer, useRef, useState, type ReactNode } from "react";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { useFullscreen } from "@/hooks/useFullscreen";
import { useSoundMuted } from "@/hooks/useSoundMuted";
import { useOnline } from "@/hooks/useOnline";
import { useQuizScale } from "@/hooks/useQuizScale";
import { useTheme } from "@/hooks/useTheme";
import { loadProgress, loadTimer, saveProgress, saveTimer } from "@/lib/quiz";
import {
  COUNTDOWN_WARNING_SEC,
  EXTRA_TIME_SEC,
  SUSPENSE_MS,
  finalScore,
  formatPoints,
  pointsPerQuestion,
} from "@/lib/quizConfig";
import {
  canUseFiftyFifty,
  earnedUnits,
  initialQuizState,
  pickFiftyFiftyEliminations,
  quizReducer,
  type JokerName,
  type QuizAction,
  type QuizState,
} from "@/lib/quizEngine";
import { sounds, unlockAudio } from "@/lib/sound";
import { nextTheme, THEMES } from "@/lib/theme";
import type { Quiz } from "@/types";
import Countdown from "./Countdown";
import { AnimatedNumber, Confetti, ScreenFlash } from "./effects";
import JokerBar from "./JokerBar";
import OptionButton, { type OptionStatus } from "./OptionButton";
import { optionIndexFromKey, optionLetter } from "./optionLetter";
import QuizSummary from "./QuizSummary";

export default function QuizGame({ quiz }: { quiz: Quiz }) {
  const router = useRouter();
  const { isFullscreen, toggle: toggleFullscreen } = useFullscreen();
  const { muted, setMuted } = useSoundMuted();
  const { theme, setTheme } = useTheme();
  const textScale = useQuizScale();
  const online = useOnline();
  const [confirmExit, setConfirmExit] = useState(false);
  // Index of the question the presenter paused on (the timer stops, answering is blocked).
  const [pausedAt, setPausedAt] = useState<number | null>(null);
  const [state, dispatch] = useReducer(
    (s: QuizState, a: QuizAction) => quizReducer(quiz, s, a),
    quiz,
    (q) => loadProgress(q) ?? initialQuizState(),
  );
  // What was already on screen when this page loaded (e.g. after a refresh):
  // effects and sounds only play for things that happen from now on.
  const [restored] = useState(() => ({
    index: state.index,
    results: state.results.length,
    wrongPicks: state.wrongPicks.length,
  }));

  const question = quiz.questions[state.index];
  const total = quiz.questions.length;
  const perQuestion = pointsPerQuestion(total, quiz.config.totalPoints);
  const score = finalScore(earnedUnits(state.results), total, quiz.config.totalPoints);
  const hasTimer = quiz.config.timeLimitSec !== null;
  const paused = pausedAt === state.index && state.phase === "asking";
  const lastResult = state.phase === "revealed" ? state.results[state.results.length - 1] : null;
  const isLast = state.index + 1 >= total;
  const freshReveal = lastResult !== null && state.results.length > restored.results;
  const freshSecondChance =
    state.phase === "asking" &&
    state.wrongPicks.length > 0 &&
    !(state.index === restored.index && restored.wrongPicks > 0);

  // Remember progress so a refresh continues the same quiz.
  useEffect(() => saveProgress(quiz, state), [quiz, state]);

  // Browsers only allow audio after a user gesture.
  useEffect(() => {
    window.addEventListener("pointerdown", unlockAudio);
    window.addEventListener("keydown", unlockAudio);
    return () => {
      window.removeEventListener("pointerdown", unlockAudio);
      window.removeEventListener("keydown", unlockAudio);
    };
  }, []);

  // Sounds for state changes (compared with the previous state, so restored state stays silent).
  const prevState = useRef(state);
  useEffect(() => {
    const prev = prevState.current;
    prevState.current = state;
    if (prev === state) return;
    if (state.index !== prev.index && state.phase === "asking") sounds.question();
    if (state.phase === "locked" && prev.phase !== "locked") sounds.lock();
    if (state.wrongPicks.length > prev.wrongPicks.length) sounds.secondChance();
    if (state.results.length > prev.results.length) {
      const outcome = state.results[state.results.length - 1].outcome;
      if (outcome === "correct" || outcome === "half") sounds.correct();
      else if (outcome === "wrong") sounds.wrong();
      else sounds.timeout();
    }
  }, [state]);

  // First question intro (no-op if audio isn't unlocked yet, e.g. right after a refresh).
  useEffect(() => {
    if (prevState.current.phase === "asking") sounds.question();
  }, []);

  // Suspense moment: drone sound, then the locked answer is revealed.
  useEffect(() => {
    if (state.phase !== "locked") return;
    const stopDrone = sounds.suspense(SUSPENSE_MS / 1000 + 0.3);
    const id = window.setTimeout(() => dispatch({ type: "REVEAL" }), SUSPENSE_MS);
    return () => {
      window.clearTimeout(id);
      stopDrone();
    };
  }, [state.phase, state.selected]);

  const handleJoker = useCallback(
    (name: JokerName) => {
      sounds.joker();
      if (name === "fiftyFifty") dispatch({ type: "JOKER_FIFTY_FIFTY", eliminated: pickFiftyFiftyEliminations(question) });
      if (name === "doubleAnswer") dispatch({ type: "JOKER_DOUBLE_ANSWER" });
      if (name === "extraTime") dispatch({ type: "JOKER_EXTRA_TIME", seconds: EXTRA_TIME_SEC });
    },
    [question],
  );

  // Keyboard: A–F / 1–6 choose, Enter/Space continue, Esc cancels during suspense, P pauses,
  // M mutes, T changes the theme, +/- change the text size.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.ctrlKey || e.metaKey || e.altKey || document.querySelector("dialog[open]")) return;
      if (e.key === "Enter" || e.key === " ") {
        if (state.phase === "revealed") {
          e.preventDefault();
          dispatch({ type: "NEXT" });
        }
        return;
      }
      if (e.key === "Escape" && state.phase === "locked") {
        dispatch({ type: "CANCEL" });
        return;
      }
      if (e.key.toLowerCase() === "m") {
        setMuted(!muted);
        return;
      }
      if (e.key.toLowerCase() === "t") {
        setTheme(nextTheme(theme));
        return;
      }
      if (e.key.toLowerCase() === "p") {
        if (hasTimer && state.phase === "asking") setPausedAt(paused ? null : state.index);
        return;
      }
      if (e.key === "+" || e.key === "=") return textScale.grow();
      if (e.key === "-") return textScale.shrink();
      if (paused) return;
      const option = optionIndexFromKey(e.key);
      if (option !== null) dispatch({ type: "SELECT", option });
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [state.phase, state.index, muted, setMuted, theme, setTheme, hasTimer, paused, textScale]);

  const onExpire = useCallback(() => dispatch({ type: "TIMEOUT" }), []);
  const onTimerTick = useCallback((elapsedMs: number) => saveTimer(quiz, state.index, elapsedMs), [quiz, state.index]);
  const onTimerSecond = useCallback((remaining: number) => {
    if (remaining <= COUNTDOWN_WARNING_SEC) sounds.tick(remaining);
  }, []);

  if (state.phase === "finished" || !question) {
    return <QuizSummary quiz={quiz} results={state.results} />;
  }

  function statusOf(i: number): OptionStatus {
    if (state.eliminated.includes(i)) return "eliminated";
    if (state.phase === "revealed") {
      if (i === question.correctIndex) return "correct";
      if (i === state.selected) return "chosenWrong";
      if (state.wrongPicks.includes(i)) return "wrongPick";
      return "dimmed";
    }
    if (state.wrongPicks.includes(i)) return "wrongPick";
    if (state.phase === "locked") return i === state.selected ? "locked" : "dimmed";
    return "idle";
  }

  const noPickYet = state.wrongPicks.length === 0;
  const asking = state.phase === "asking";
  const canAct = asking && !paused;
  const jokerAvailable: Record<JokerName, boolean> = {
    fiftyFifty: canAct && noPickYet && canUseFiftyFifty(question),
    doubleAnswer: canAct && noPickYet,
    extraTime: canAct && hasTimer,
  };
  const correctText = `${optionLetter(question.correctIndex)}) ${question.options[question.correctIndex]}`;
  const success = lastResult !== null && lastResult.earned > 0;

  return (
    <div className="flex min-h-dvh flex-col">
      {/* Reveal effects */}
      {freshReveal && <ScreenFlash seed={state.results.length} tone={success ? "success" : "danger"} />}
      {freshReveal && success && <Confetti seed={state.results.length} count={lastResult.outcome === "half" ? 35 : 80} />}
      {freshSecondChance && <ScreenFlash seed={state.index * 100 + 1} tone="danger" />}

      {/* Top bar */}
      <header className="flex flex-wrap items-center gap-x-6 gap-y-3 border-b border-line/60 bg-surface/70 px-[2vw] py-[1.5vh] backdrop-blur">
        <div className="flex items-baseline gap-3">
          <span className="text-[clamp(1rem,1.5vw,1.6rem)] font-bold">
            Soru <span className="text-accent">{state.index + 1}</span> / {total}
          </span>
          <span className="text-[clamp(0.85rem,1.1vw,1.15rem)] text-muted">{formatPoints(perQuestion)} puan</span>
          {quiz.isRetry && (
            <span className="rounded-md border border-accent px-2 py-0.5 text-[clamp(0.75rem,1vw,1rem)] font-bold text-accent">
              ↻ Tekrar turu
            </span>
          )}
        </div>
        <div className="hidden h-2 min-w-24 flex-1 overflow-hidden rounded-full bg-raised md:block" aria-hidden>
          <div
            className="h-full rounded-full bg-accent transition-[width] duration-500"
            style={{ width: `${(state.results.length / total) * 100}%` }}
          />
        </div>
        <span className="text-[clamp(1rem,1.5vw,1.6rem)] font-bold tabular-nums">
          Puan: <span className="text-accent"><AnimatedNumber value={score} /></span>
        </span>
        <JokerBar
          enabled={quiz.config.jokers}
          used={state.jokersUsed}
          available={jokerAvailable}
          active={{ doubleAnswer: state.doubleAnswerActive && state.phase !== "revealed" }}
          onUse={handleJoker}
        />
        <div className="ml-auto flex flex-wrap items-center gap-2">
          {!online && (
            <span className="text-sm font-semibold text-muted" title="Yarışma internetsiz de devam eder.">
              ⚠ Çevrimdışı
            </span>
          )}
          {hasTimer && (
            <TopButton onClick={() => setPausedAt(paused ? null : state.index)} disabled={!asking} title="Kısayol: P" active={paused}>
              {paused ? "▶ Devam et" : "⏸ Duraklat"}
            </TopButton>
          )}
          <span className="flex" role="group" aria-label={`Yazı boyutu: yüzde ${Math.round(textScale.scale * 100)}`}>
            <TopButton onClick={textScale.shrink} disabled={!textScale.canShrink} title="Yazıyı küçült (kısayol: −)" className="rounded-r-none">
              A−
            </TopButton>
            <TopButton onClick={textScale.grow} disabled={!textScale.canGrow} title="Yazıyı büyüt (kısayol: +)" className="-ml-px rounded-l-none">
              A+
            </TopButton>
          </span>
          <TopButton onClick={() => setMuted(!muted)} title="Kısayol: M">
            {muted ? "🔇 Ses kapalı" : "🔊 Ses açık"}
          </TopButton>
          <TopButton onClick={() => setTheme(nextTheme(theme))} title="Kısayol: T">
            🎨 Tema: {THEMES.find((t) => t.id === theme)?.label}
          </TopButton>
          <TopButton onClick={toggleFullscreen}>{isFullscreen ? "⤡ Tam ekrandan çık" : "⤢ Tam ekran"}</TopButton>
          <TopButton onClick={() => setConfirmExit(true)}>Çıkış</TopButton>
        </div>
      </header>

      {/* Question */}
      <main className="flex flex-1 flex-col justify-center gap-[3vh] px-[4vw] py-[3vh]">
        <AnimatePresence mode="wait">
          <motion.div
            key={state.index}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -30, transition: { duration: 0.3 } }}
            className="flex flex-col gap-[3vh]"
            style={{ zoom: textScale.scale }}
          >
            <div className="flex items-center gap-[2vw]">
              <motion.h1
                initial={{ opacity: 0, y: 30, filter: "blur(8px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="flex-1 font-bold leading-tight"
                style={{ fontSize: "clamp(1.6rem, 3.2vw, 3.75rem)" }}
              >
                {question.text}
              </motion.h1>
              {quiz.config.timeLimitSec !== null && (
                <Countdown
                  key={state.index}
                  totalSec={quiz.config.timeLimitSec + state.extraTimeSec}
                  running={asking && !paused}
                  initialElapsedMs={loadTimer(quiz, state.index)}
                  onExpire={onExpire}
                  onTick={onTimerTick}
                  onSecond={onTimerSecond}
                />
              )}
            </div>

            <div className={`grid gap-[1.5vh_1.5vw] ${question.options.length > 2 ? "md:grid-cols-2" : ""}`}>
              {question.options.map((option, i) => (
                <OptionButton
                  key={i}
                  index={i}
                  letter={optionLetter(i)}
                  text={option}
                  status={statusOf(i)}
                  disabled={!canAct || statusOf(i) !== "idle"}
                  onSelect={() => dispatch({ type: "SELECT", option: i })}
                />
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Status / feedback */}
      <footer className="relative min-h-[18vh] border-t border-line/60 bg-surface/70 px-[4vw] py-[2vh]">
        {state.phase === "locked" && (
          // Suspense bar fills up until the reveal.
          <motion.div
            key={`bar-${state.index}-${state.selected}`}
            aria-hidden
            className="absolute inset-x-0 top-0 h-1 origin-left bg-accent"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: SUSPENSE_MS / 1000, ease: "linear" }}
          />
        )}
        <AnimatePresence mode="wait">
          <motion.div
            key={`${state.index}-${state.phase}-${state.wrongPicks.length}-${paused}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="flex flex-wrap items-center justify-between gap-4"
            style={{ zoom: textScale.scale }}
          >
            {paused && (
              <p className="flex items-center gap-4 text-[clamp(1.25rem,2vw,2.25rem)] font-bold text-accent">
                ⏸ Duraklatıldı
                <span className="text-[clamp(0.85rem,1.1vw,1.15rem)] font-normal text-muted">
                  Süre durdu. Devam etmek için <Kbd>P</Kbd>
                </span>
              </p>
            )}
            {state.phase === "asking" && !paused && (
              <p className="text-[clamp(1rem,1.5vw,1.6rem)] text-muted">
                {state.wrongPicks.length > 0 ? (
                  <span className="font-bold text-danger">
                    ✗ {optionLetter(state.wrongPicks[0])} yanlış. İkinci tahmin hakkınız var.
                  </span>
                ) : state.doubleAnswerActive ? (
                  <span className="font-bold text-accent">Çift cevap jokeri açık: ilk tahmin yanlışsa bir hak daha var.</span>
                ) : (
                  <>Cevabı seçmek için şıkka tıklayın ya da <Kbd>A</Kbd>–<Kbd>{optionLetter(question.options.length - 1)}</Kbd> tuşlarına basın.</>
                )}
              </p>
            )}

            {state.phase === "locked" && (
              <p className="flex items-center gap-4 text-[clamp(1.25rem,2vw,2.25rem)] font-bold text-accent">
                <motion.span animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 0.8, repeat: Infinity }}>
                  Cevap kilitlendi…
                </motion.span>
                <span className="text-[clamp(0.85rem,1.1vw,1.15rem)] font-normal text-muted">
                  Vazgeçmek için <Kbd>Esc</Kbd>
                </span>
              </p>
            )}

            {state.phase === "revealed" && lastResult && (
              <>
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <motion.p
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 320, damping: 14 }}
                    className={`origin-left font-black ${success ? "text-success" : "text-danger"}`}
                    style={{ fontSize: "clamp(1.5rem, 2.6vw, 3rem)" }}
                  >
                    {lastResult.outcome === "correct" && `✓ Doğru! +${formatPoints(perQuestion)} puan`}
                    {lastResult.outcome === "half" && `✓ Doğru (ikinci tahmin) +${formatPoints(perQuestion / 2)} puan`}
                    {lastResult.outcome === "wrong" && `✗ Yanlış. Doğru cevap: ${correctText}`}
                    {lastResult.outcome === "timeout" && `⏱ Süre doldu. Doğru cevap: ${correctText}`}
                  </motion.p>
                  {question.explanation && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                      className="text-[clamp(1rem,1.5vw,1.6rem)] text-fg/90"
                    >
                      <span className="font-bold text-accent">Bilgi notu:</span> {question.explanation}
                    </motion.p>
                  )}
                </div>
                <motion.button
                  type="button"
                  autoFocus
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  onClick={() => dispatch({ type: "NEXT" })}
                  className="flex shrink-0 flex-col items-center rounded-2xl bg-accent px-8 py-3 font-bold text-on-accent hover:bg-accent-strong"
                >
                  <span className="text-[clamp(1.1rem,1.6vw,1.75rem)]">{isLast ? "Sonuçları göster" : "Sonraki soru"} →</span>
                  <span className="text-xs font-semibold opacity-70">Enter / boşluk</span>
                </motion.button>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </footer>

      <ConfirmDialog
        open={confirmExit}
        title="Yarışmadan çıkılsın mı?"
        confirmLabel="Kurulum ekranına dön"
        onClose={() => setConfirmExit(false)}
        onConfirm={() => router.push("/")}
      >
        Yarışma yarıda kalacak. Kurulum ekranından yeni bir yarışma başlatabilirsiniz.
      </ConfirmDialog>
    </div>
  );
}

type TopButtonProps = {
  children: ReactNode;
  onClick: () => void;
  title?: string;
  disabled?: boolean;
  active?: boolean;
  className?: string;
};

function TopButton({ children, onClick, title, disabled, active, className = "" }: TopButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      disabled={disabled}
      aria-pressed={active}
      className={`rounded-lg border px-3 py-2 text-sm font-semibold disabled:opacity-40 ${
        active ? "border-accent bg-accent text-on-accent" : "border-line text-muted enabled:hover:text-fg"
      } ${className}`}
    >
      {children}
    </button>
  );
}

function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="mx-0.5 rounded-md border border-line bg-raised px-2 py-0.5 font-mono text-[0.9em] text-fg">{children}</kbd>
  );
}
