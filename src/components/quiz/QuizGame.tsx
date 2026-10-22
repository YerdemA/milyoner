"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useReducer, useState } from "react";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { useFullscreen } from "@/hooks/useFullscreen";
import { loadProgress, saveProgress } from "@/lib/quiz";
import { EXTRA_TIME_SEC, SUSPENSE_MS, finalScore, formatPoints, pointsPerQuestion } from "@/lib/quizConfig";
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
import type { Quiz } from "@/types";
import Countdown from "./Countdown";
import JokerBar from "./JokerBar";
import OptionButton, { type OptionStatus } from "./OptionButton";
import { optionIndexFromKey, optionLetter } from "./optionLetter";
import QuizSummary from "./QuizSummary";

export default function QuizGame({ quiz }: { quiz: Quiz }) {
  const router = useRouter();
  const { isFullscreen, toggle: toggleFullscreen } = useFullscreen();
  const [confirmExit, setConfirmExit] = useState(false);
  const [state, dispatch] = useReducer(
    (s: QuizState, a: QuizAction) => quizReducer(quiz, s, a),
    quiz,
    (q) => loadProgress(q) ?? initialQuizState(),
  );

  const question = quiz.questions[state.index];
  const total = quiz.questions.length;
  const perQuestion = pointsPerQuestion(total, quiz.config.totalPoints);
  const score = finalScore(earnedUnits(state.results), total, quiz.config.totalPoints);
  const lastResult = state.phase === "revealed" ? state.results[state.results.length - 1] : null;
  const isLast = state.index + 1 >= total;

  // Remember progress so a refresh continues the same quiz.
  useEffect(() => saveProgress(quiz, state), [quiz, state]);

  // Suspense moment: locked answer is revealed after a short pause.
  useEffect(() => {
    if (state.phase !== "locked") return;
    const id = window.setTimeout(() => dispatch({ type: "REVEAL" }), SUSPENSE_MS);
    return () => window.clearTimeout(id);
  }, [state.phase, state.selected]);

  const handleJoker = useCallback(
    (name: JokerName) => {
      if (name === "fiftyFifty") dispatch({ type: "JOKER_FIFTY_FIFTY", eliminated: pickFiftyFiftyEliminations(question) });
      if (name === "doubleAnswer") dispatch({ type: "JOKER_DOUBLE_ANSWER" });
      if (name === "extraTime") dispatch({ type: "JOKER_EXTRA_TIME", seconds: EXTRA_TIME_SEC });
    },
    [question],
  );

  // Keyboard: A–F / 1–6 choose, Enter/Space continue, Esc cancels during the suspense moment.
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
      const option = optionIndexFromKey(e.key);
      if (option !== null) dispatch({ type: "SELECT", option });
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [state.phase]);

  const onExpire = useCallback(() => dispatch({ type: "TIMEOUT" }), []);

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
  const jokerAvailable: Record<JokerName, boolean> = {
    fiftyFifty: asking && noPickYet && canUseFiftyFifty(question),
    doubleAnswer: asking && noPickYet,
    extraTime: asking && quiz.config.timeLimitSec !== null,
  };
  const correctText = `${optionLetter(question.correctIndex)}) ${question.options[question.correctIndex]}`;

  return (
    <div className="flex min-h-dvh flex-col">
      {/* Top bar */}
      <header className="flex flex-wrap items-center gap-x-6 gap-y-3 border-b border-line/60 bg-surface/70 px-[2vw] py-[1.5vh] backdrop-blur">
        <div className="flex items-baseline gap-3">
          <span className="text-[clamp(1rem,1.5vw,1.6rem)] font-bold">
            Soru <span className="text-accent">{state.index + 1}</span> / {total}
          </span>
          <span className="text-[clamp(0.85rem,1.1vw,1.15rem)] text-muted">{formatPoints(perQuestion)} puan</span>
        </div>
        <div className="hidden h-2 min-w-24 flex-1 overflow-hidden rounded-full bg-raised md:block" aria-hidden>
          <div
            className="h-full rounded-full bg-accent transition-[width] duration-500"
            style={{ width: `${(state.results.length / total) * 100}%` }}
          />
        </div>
        <span className="text-[clamp(1rem,1.5vw,1.6rem)] font-bold tabular-nums">
          Puan: <span className="text-accent">{score}</span>
        </span>
        <JokerBar
          enabled={quiz.config.jokers}
          used={state.jokersUsed}
          available={jokerAvailable}
          active={{ doubleAnswer: state.doubleAnswerActive && state.phase !== "revealed" }}
          onUse={handleJoker}
        />
        <div className="ml-auto flex gap-2">
          <button
            type="button"
            onClick={toggleFullscreen}
            className="rounded-lg border border-line px-3 py-2 text-sm font-semibold text-muted hover:text-fg"
          >
            {isFullscreen ? "⤡ Tam ekrandan çık" : "⤢ Tam ekran"}
          </button>
          <button
            type="button"
            onClick={() => setConfirmExit(true)}
            className="rounded-lg border border-line px-3 py-2 text-sm font-semibold text-muted hover:text-fg"
          >
            Çıkış
          </button>
        </div>
      </header>

      {/* Question */}
      <main className="flex flex-1 flex-col justify-center gap-[3vh] px-[4vw] py-[3vh]">
        <AnimatePresence mode="wait">
          <motion.div
            key={state.index}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -24 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col gap-[3vh]"
          >
            <div className="flex items-center gap-[2vw]">
              <h1
                className="flex-1 font-bold leading-tight"
                style={{ fontSize: "clamp(1.6rem, 3.2vw, 3.75rem)" }}
              >
                {question.text}
              </h1>
              {quiz.config.timeLimitSec !== null && (
                <Countdown
                  key={state.index}
                  totalSec={quiz.config.timeLimitSec + state.extraTimeSec}
                  running={asking}
                  onExpire={onExpire}
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
                  disabled={!asking || statusOf(i) !== "idle"}
                  onSelect={() => dispatch({ type: "SELECT", option: i })}
                />
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Status / feedback */}
      <footer className="min-h-[18vh] border-t border-line/60 bg-surface/70 px-[4vw] py-[2vh]">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${state.index}-${state.phase}-${state.wrongPicks.length}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="flex flex-wrap items-center justify-between gap-4"
          >
            {state.phase === "asking" && (
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
                <span className="animate-pulse">Cevap kilitlendi…</span>
                <span className="text-[clamp(0.85rem,1.1vw,1.15rem)] font-normal text-muted">
                  Vazgeçmek için <Kbd>Esc</Kbd>
                </span>
              </p>
            )}

            {state.phase === "revealed" && lastResult && (
              <>
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <p
                    className={`font-black ${lastResult.earned > 0 ? "text-success" : "text-danger"}`}
                    style={{ fontSize: "clamp(1.5rem, 2.6vw, 3rem)" }}
                  >
                    {lastResult.outcome === "correct" && `✓ Doğru! +${formatPoints(perQuestion)} puan`}
                    {lastResult.outcome === "half" && `✓ Doğru (ikinci tahmin) +${formatPoints(perQuestion / 2)} puan`}
                    {lastResult.outcome === "wrong" && `✗ Yanlış. Doğru cevap: ${correctText}`}
                    {lastResult.outcome === "timeout" && `⏱ Süre doldu. Doğru cevap: ${correctText}`}
                  </p>
                  {question.explanation && (
                    <p className="text-[clamp(1rem,1.5vw,1.6rem)] text-fg/90">
                      <span className="font-bold text-accent">Bilgi notu:</span> {question.explanation}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  autoFocus
                  onClick={() => dispatch({ type: "NEXT" })}
                  className="flex shrink-0 flex-col items-center rounded-2xl bg-accent px-8 py-3 font-bold text-on-accent hover:bg-accent-strong"
                >
                  <span className="text-[clamp(1.1rem,1.6vw,1.75rem)]">{isLast ? "Sonuçları göster" : "Sonraki soru"} →</span>
                  <span className="text-xs font-semibold opacity-70">Enter / boşluk</span>
                </button>
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

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="mx-0.5 rounded-md border border-line bg-raised px-2 py-0.5 font-mono text-[0.9em] text-fg">{children}</kbd>
  );
}
