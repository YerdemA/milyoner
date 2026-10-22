"use client";

import { MotionConfig } from "framer-motion";
import Link from "next/link";
import Alert from "@/components/ui/Alert";
import { LoadingState } from "@/components/ui/Spinner";
import { useStoredQuiz } from "@/hooks/useStoredQuiz";
import QuizGame from "./QuizGame";

export default function QuizScreen() {
  const quiz = useStoredQuiz();

  if (quiz === undefined) return <LoadingState />;
  if (quiz === null) {
    return (
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center gap-5 p-6">
        <Alert>Hazırlanmış bir yarışma yok. Önce kurulum ekranından yarışmayı başlatın.</Alert>
        <Link href="/" className="text-lg font-semibold text-accent">
          ← Kurulum ekranına git
        </Link>
      </main>
    );
  }

  return (
    // Respect the OS "reduce motion" setting.
    <MotionConfig reducedMotion="user">
      <div className="relative flex flex-1 flex-col stage-backdrop">
        {/* A new quiz (e.g. "same settings again") remounts the game with fresh state. */}
        <QuizGame key={quiz.createdAt} quiz={quiz} />
      </div>
    </MotionConfig>
  );
}
