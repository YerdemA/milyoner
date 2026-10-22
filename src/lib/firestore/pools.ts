import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getCountFromServer,
  getDoc,
  getDocs,
  getDocsFromCache,
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

/** Returns null when the pool does not exist (e.g. deleted or a wrong link). */
export async function getPool(poolId: string): Promise<Pool | null> {
  const snap = await getDoc(doc(poolsCol, poolId));
  return snap.exists() ? toPool(snap) : null;
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

/**
 * Number of questions in a pool. Offline, counts the questions saved in this browser instead
 * (see warmOfflineCache), since count queries only work against the server.
 */
export async function countQuestionsInPool(poolId: string): Promise<number> {
  const q = query(questionsCol, where("poolId", "==", poolId));
  try {
    return (await getCountFromServer(q)).data().count;
  } catch (err) {
    const cached = await getDocsFromCache(q).catch(() => null);
    if (cached) return cached.size;
    throw err;
  }
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
