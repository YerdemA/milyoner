import { Timestamp } from "firebase/firestore";

/** Firestore Timestamp -> Date; null while a serverTimestamp() write is still pending. */
export function toDate(value: unknown): Date | null {
  return value instanceof Timestamp ? value.toDate() : null;
}

/** Oldest first; documents with a pending timestamp go last. */
export function byCreatedAt<T extends { createdAt: Date | null }>(a: T, b: T): number {
  return (a.createdAt?.getTime() ?? Infinity) - (b.createdAt?.getTime() ?? Infinity);
}
