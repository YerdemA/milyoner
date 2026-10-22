import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type DocumentSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { normalizeQuestionInput, validateQuestionInput } from "@/lib/validation";
import type { Question, QuestionInput } from "@/types";
import { byCreatedAt, toDate } from "./convert";

const questionsCol = collection(db, "questions");

function toQuestion(snap: DocumentSnapshot): Question {
  const data = snap.data() ?? {};
  return {
    id: snap.id,
    poolId: data.poolId ?? "",
    text: data.text ?? "",
    imageUrl: data.imageUrl ?? null,
    options: Array.isArray(data.options) ? data.options : [],
    correctIndex: typeof data.correctIndex === "number" ? data.correctIndex : 0,
    explanation: data.explanation ?? null,
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  };
}

function prepare(input: QuestionInput): QuestionInput {
  const normalized = normalizeQuestionInput(input);
  const errors = validateQuestionInput(normalized);
  if (errors.length > 0) throw new Error(errors.join("\n"));
  return normalized;
}

// Sorting happens client-side so no composite Firestore index is needed.
export async function listQuestionsByPool(poolId: string): Promise<Question[]> {
  const snap = await getDocs(query(questionsCol, where("poolId", "==", poolId)));
  return snap.docs.map(toQuestion).sort(byCreatedAt);
}

/** All questions from the given pools, e.g. to build a quiz. */
export async function listQuestionsByPools(poolIds: string[]): Promise<Question[]> {
  const perPool = await Promise.all(poolIds.map(listQuestionsByPool));
  return perPool.flat();
}

export async function createQuestion(input: QuestionInput): Promise<string> {
  const ref = await addDoc(questionsCol, {
    ...prepare(input),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateQuestion(questionId: string, input: QuestionInput): Promise<void> {
  await updateDoc(doc(questionsCol, questionId), {
    ...prepare(input),
    updatedAt: serverTimestamp(),
  });
}

export async function deleteQuestion(questionId: string): Promise<void> {
  await deleteDoc(doc(questionsCol, questionId));
}
