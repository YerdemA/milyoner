"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import { getErrorMessage } from "@/lib/errors";
import { buildQuiz, buildRetryQuiz, saveQuiz } from "@/lib/quiz";
import { finalScore, formatPoints, pointsPerQuestion } from "@/lib/quizConfig";
import { earnedUnits, type Outcome, type QuestionResult } from "@/lib/quizEngine";
import { sounds } from "@/lib/sound";
import type { Quiz } from "@/types";
import { Confetti, CountUp } from "./effects";
import { optionLetter } from "./optionLetter";

const OUTCOME: Record<Outcome, { icon: string; label: string; className: string }> = {
  correct: { icon: "✓", label: "Doğru", className: "text-success" },
  half: { icon: "½", label: "İkinci tahminde doğru", className: "text-success" },
  wrong: { icon: "✗", label: "Yanlış", className: "text-danger" },
  timeout: { icon: "⏱", label: "Süre doldu", className: "text-danger" },
};

export default function QuizSummary({ quiz, results }: { quiz: Quiz; results: QuestionResult[] }) {
  const [restarting, setRestarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const n = quiz.questions.length;
  const { totalPoints } = quiz.config;
  const score = finalScore(earnedUnits(results), n, totalPoints);
  const perQuestion = pointsPerQuestion(n, totalPoints);
  const count = (o: Outcome) => results.filter((r) => r.outcome === o).length;
  const stats = [
    { label: "Doğru", value: count("correct"), className: "text-success" },
    ...(count("half") > 0 ? [{ label: "İkinci tahminde", value: count("half"), className: "text-success" }] : []),
    { label: "Yanlış", value: count("wrong"), className: "text-danger" },
    ...(quiz.config.timeLimitSec ? [{ label: "Süre doldu", value: count("timeout"), className: "text-danger" }] : []),
  ];
  const ratio = totalPoints > 0 ? score / totalPoints : 0;
  // Everything not answered right on the first try: wrong, timed out or right only on the second guess.
  const missedIds = results.filter((r) => r.outcome !== "correct").map((r) => r.questionId);

  useEffect(() => {
    sounds.finish(ratio);
  }, [ratio]);

  async function restart() {
    setRestarting(true);
    setError(null);
    try {
      saveQuiz(await buildQuiz(quiz.config)); // the quiz screen remounts with the new quiz
    } catch (err) {
      setError(getErrorMessage(err));
      setRestarting(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-[4vh] px-6 py-[6vh]">
      {ratio >= 0.5 && <Confetti seed={quiz.createdAt % 100000} count={140} />}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="text-center"
      >
        <p className="text-[clamp(1rem,1.6vw,1.75rem)] font-semibold uppercase tracking-[0.3em] text-accent">
          {quiz.isRetry ? "Tekrar turu bitti" : "Yarışma bitti"}
        </p>
        <p className="mt-4 font-black leading-none tabular-nums" style={{ fontSize: "clamp(5rem, 14vw, 13rem)" }}>
          <CountUp to={score} />
        </p>
        <p className="mt-2 text-[clamp(1.25rem,2vw,2.25rem)] text-muted">/ {totalPoints} puan</p>
      </motion.div>

      <dl className="flex flex-wrap justify-center gap-4">
        {stats.map((s) => (
          <div key={s.label} className="min-w-40 rounded-2xl border border-line bg-surface px-6 py-4 text-center">
            <dd className={`text-[clamp(2rem,4vw,3.5rem)] font-black tabular-nums ${s.className}`}>{s.value}</dd>
            <dt className="text-[clamp(1rem,1.4vw,1.5rem)] text-muted">{s.label}</dt>
          </div>
        ))}
      </dl>

      <div className="flex flex-wrap justify-center gap-4">
        {missedIds.length > 0 && (
          <Button
            size="lg"
            variant="secondary"
            onClick={() => saveQuiz(buildRetryQuiz(quiz, missedIds))}
            disabled={restarting}
            className="h-16 px-8 text-xl"
          >
            ↻ Bilinemeyen {missedIds.length} soruyu tekrar sor
          </Button>
        )}
        <Button size="lg" onClick={restart} loading={restarting} className="h-16 px-8 text-xl">
          Aynı ayarlarla yeni yarışma
        </Button>
        <Link
          href="/"
          className="inline-flex h-16 items-center rounded-lg border border-line bg-raised px-8 text-xl font-semibold hover:border-muted"
        >
          Kurulum ekranına dön
        </Link>
      </div>
      {error && <Alert tone="error">{error}</Alert>}

      <section className="w-full">
        <h2 className="mb-3 text-xl font-bold">Sorular</h2>
        <ol className="flex flex-col gap-2">
          {quiz.questions.map((q, i) => {
            const r = results.find((res) => res.questionId === q.id);
            const o = r ? OUTCOME[r.outcome] : null;
            const earned = r ? r.earned * perQuestion : 0;
            return (
              <li key={q.id} className="flex items-start gap-4 rounded-xl border border-line bg-surface px-4 py-3">
                <span className="w-8 shrink-0 text-lg font-bold text-muted">{i + 1}.</span>
                <div className="min-w-0 flex-1">
                  <p className="text-lg">{q.text}</p>
                  <p className="text-base text-muted">
                    Doğru cevap: <strong className="text-fg">{optionLetter(q.correctIndex)}) {q.options[q.correctIndex]}</strong>
                  </p>
                </div>
                {o && (
                  <span className={`shrink-0 text-right font-bold ${o.className}`}>
                    {o.icon} {o.label}
                    <span className="block text-sm font-normal text-muted">+{formatPoints(earned)} puan</span>
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}
