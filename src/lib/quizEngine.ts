// Pure quiz state machine (no React, no timers) so the rules can be tested on their own.
//
//   asking --SELECT--> locked --REVEAL--> revealed --NEXT--> asking (next question) / finished
//     |                  |  \--CANCEL--> asking
//     |                  \--REVEAL (wrong, double answer active, first try)--> asking (second try)
//     \--TIMEOUT--> revealed

import type { Quiz, QuizQuestion } from "@/types";

export type Phase = "asking" | "locked" | "revealed" | "finished";

/** correct = full points, half = correct on the second try (double answer joker). */
export type Outcome = "correct" | "half" | "wrong" | "timeout";

export type QuestionResult = {
  questionId: string;
  selected: number | null;
  outcome: Outcome;
  /** Share of the question's points earned: 1, 0.5 or 0. */
  earned: number;
};

export type JokerName = "fiftyFifty" | "doubleAnswer" | "extraTime";

export type QuizState = {
  index: number;
  phase: Phase;
  /** Option currently locked in (locked phase) or the final answer (revealed phase). */
  selected: number | null;
  /** First wrong pick while the double answer joker is active. */
  wrongPicks: number[];
  /** Options removed by the 50:50 joker. */
  eliminated: number[];
  doubleAnswerActive: boolean;
  extraTimeSec: number;
  jokersUsed: Record<JokerName, boolean>;
  results: QuestionResult[];
};

export type QuizAction =
  | { type: "SELECT"; option: number }
  | { type: "CANCEL" }
  | { type: "REVEAL" }
  | { type: "TIMEOUT" }
  | { type: "NEXT" }
  | { type: "JOKER_FIFTY_FIFTY"; eliminated: number[] }
  | { type: "JOKER_DOUBLE_ANSWER" }
  | { type: "JOKER_EXTRA_TIME"; seconds: number };

export function initialQuizState(): QuizState {
  return {
    index: 0,
    phase: "asking",
    selected: null,
    wrongPicks: [],
    eliminated: [],
    doubleAnswerActive: false,
    extraTimeSec: 0,
    jokersUsed: { fiftyFifty: false, doubleAnswer: false, extraTime: false },
    results: [],
  };
}

const perQuestionReset = {
  phase: "asking" as const,
  selected: null,
  wrongPicks: [],
  eliminated: [],
  doubleAnswerActive: false,
  extraTimeSec: 0,
};

function isSelectable(state: QuizState, question: QuizQuestion, option: number) {
  return (
    option >= 0 &&
    option < question.options.length &&
    !state.eliminated.includes(option) &&
    !state.wrongPicks.includes(option)
  );
}

function finishQuestion(state: QuizState, question: QuizQuestion, result: Omit<QuestionResult, "questionId">): QuizState {
  return {
    ...state,
    phase: "revealed",
    selected: result.selected,
    results: [...state.results, { questionId: question.id, ...result }],
  };
}

export function quizReducer(quiz: Quiz, state: QuizState, action: QuizAction): QuizState {
  const question = quiz.questions[state.index];
  if (!question) return state;
  const jokersEnabled = quiz.config.jokers;
  const noPickYet = state.wrongPicks.length === 0;

  switch (action.type) {
    case "SELECT":
      if (state.phase !== "asking" || !isSelectable(state, question, action.option)) return state;
      return { ...state, phase: "locked", selected: action.option };

    case "CANCEL":
      if (state.phase !== "locked") return state;
      return { ...state, phase: "asking", selected: null };

    case "REVEAL": {
      if (state.phase !== "locked" || state.selected === null) return state;
      const correct = state.selected === question.correctIndex;
      if (correct) {
        const second = state.wrongPicks.length > 0;
        return finishQuestion(state, question, {
          selected: state.selected,
          outcome: second ? "half" : "correct",
          earned: second ? 0.5 : 1,
        });
      }
      if (state.doubleAnswerActive && noPickYet) {
        // First wrong guess with the joker: mark it and let them try again.
        return { ...state, phase: "asking", selected: null, wrongPicks: [state.selected] };
      }
      return finishQuestion(state, question, { selected: state.selected, outcome: "wrong", earned: 0 });
    }

    case "TIMEOUT":
      if (state.phase !== "asking") return state;
      return finishQuestion(state, question, { selected: null, outcome: "timeout", earned: 0 });

    case "NEXT":
      if (state.phase !== "revealed") return state;
      if (state.index + 1 >= quiz.questions.length) return { ...state, phase: "finished" };
      return { ...state, ...perQuestionReset, index: state.index + 1 };

    case "JOKER_FIFTY_FIFTY":
      if (
        state.phase !== "asking" ||
        !jokersEnabled.fiftyFifty ||
        state.jokersUsed.fiftyFifty ||
        !noPickYet ||
        !canUseFiftyFifty(question)
      ) {
        return state;
      }
      return {
        ...state,
        eliminated: action.eliminated.filter((o) => o !== question.correctIndex),
        jokersUsed: { ...state.jokersUsed, fiftyFifty: true },
      };

    case "JOKER_DOUBLE_ANSWER":
      if (state.phase !== "asking" || !jokersEnabled.doubleAnswer || state.jokersUsed.doubleAnswer || !noPickYet) {
        return state;
      }
      return { ...state, doubleAnswerActive: true, jokersUsed: { ...state.jokersUsed, doubleAnswer: true } };

    case "JOKER_EXTRA_TIME":
      if (
        state.phase !== "asking" ||
        !jokersEnabled.extraTime ||
        state.jokersUsed.extraTime ||
        quiz.config.timeLimitSec === null
      ) {
        return state;
      }
      return {
        ...state,
        extraTimeSec: state.extraTimeSec + action.seconds,
        jokersUsed: { ...state.jokersUsed, extraTime: true },
      };
  }
}

/** 50:50 needs at least 3 options; with 2 there is nothing to remove. */
export function canUseFiftyFifty(question: QuizQuestion) {
  return question.options.length >= 3;
}

/** Picks which wrong options 50:50 removes: all but one random wrong option remain hidden. */
export function pickFiftyFiftyEliminations(question: QuizQuestion, random = Math.random): number[] {
  const wrong = question.options.map((_, i) => i).filter((i) => i !== question.correctIndex);
  const keep = wrong[Math.floor(random() * wrong.length)];
  return wrong.filter((i) => i !== keep);
}

/** Sum of earned shares (1 per correct, 0.5 per half). */
export function earnedUnits(results: QuestionResult[]) {
  return results.reduce((sum, r) => sum + r.earned, 0);
}
