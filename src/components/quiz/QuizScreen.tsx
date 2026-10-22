"use client";

import Link from "next/link";
import Alert from "@/components/ui/Alert";
import { LoadingState } from "@/components/ui/Spinner";
import { useStoredQuiz } from "@/hooks/useStoredQuiz";
import { formatPoints, pointsPerQuestion } from "@/lib/quizConfig";

// Temporary: shows that the quiz from the setup screen arrived. The real screen comes in step 5.
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

  const { config, questions } = quiz;
  const jokers = [
    config.jokers.fiftyFifty && "Yarı yarıya",
    config.jokers.doubleAnswer && "Çift cevap",
    config.jokers.extraTime && "Süre ekleme",
  ].filter(Boolean);

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center gap-6 p-6">
      <h1 className="text-4xl font-bold">Yarışma hazır</h1>
      <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-lg">
        <dt className="text-muted">Soru sayısı</dt>
        <dd>{questions.length}</dd>
        <dt className="text-muted">Süre</dt>
        <dd>{config.timeLimitSec ? `${config.timeLimitSec} saniye` : "Süre sınırı yok"}</dd>
        <dt className="text-muted">Puan</dt>
        <dd>
          Toplam {config.totalPoints} · soru başı {formatPoints(pointsPerQuestion(questions.length, config.totalPoints))}
        </dd>
        <dt className="text-muted">Jokerler</dt>
        <dd>{jokers.length ? jokers.join(", ") : "Yok"}</dd>
      </dl>
      <Alert>Yarışma ekranı bir sonraki adımda yapılacak.</Alert>
      <Link href="/" className="text-lg font-semibold text-accent">
        ← Kurulum ekranına dön
      </Link>
    </main>
  );
}
