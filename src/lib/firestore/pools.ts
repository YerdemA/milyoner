import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getCountFromServer,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type DocumentSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { validatePoolName } from "@/lib/validation";
import type { Pool } from "@/types";
import { byCreatedAt, toDate } from "./convert";

const poolsCol = collection(db, "pools");
const questionsCol = collection(db, "questions");

function toPool(snap: DocumentSnapshot): Pool {
  const data = snap.data() ?? {};
  return { id: snap.id, name: data.name ?? "", createdAt: toDate(data.createdAt) };
}

export async function listPools(): Promise<Pool[]> {
  const snap = await getDocs(poolsCol);
  return snap.docs.map(toPool).sort(byCreatedAt);
}

export async function createPool(name: string): Promise<string> {
  const error = validatePoolName(name);
  if (error) throw new Error(error);
  const ref = await addDoc(poolsCol, { name: name.trim(), createdAt: serverTimestamp() });
  return ref.id;
}

export async function renamePool(poolId: string, name: string): Promise<void> {
  const error = validatePoolName(name);
  if (error) throw new Error(error);
  await updateDoc(doc(poolsCol, poolId), { name: name.trim() });
}

/** Number of questions in a pool; used to warn before deleting it. */
export async function countQuestionsInPool(poolId: string): Promise<number> {
  const snap = await getCountFromServer(query(questionsCol, where("poolId", "==", poolId)));
  return snap.data().count;
}

/**
 * Deletes a pool together with all of its questions.
 * Questions are deleted one by one (security rules limit document lookups per batch),
 * and the pool itself last, so a failed attempt can simply be retried.
 */
export async function deletePool(poolId: string): Promise<void> {
  const snap = await getDocs(query(questionsCol, where("poolId", "==", poolId)));
  await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
  await deleteDoc(doc(poolsCol, poolId));
}
