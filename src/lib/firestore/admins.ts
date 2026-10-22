import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

/**
 * A user is an admin when admins/{uid} exists. These documents are created by hand
 * in the Firebase console; the app can only read the signed-in user's own document.
 */
export async function isAdmin(uid: string): Promise<boolean> {
  const snap = await getDoc(doc(db, "admins", uid));
  return snap.exists();
}
