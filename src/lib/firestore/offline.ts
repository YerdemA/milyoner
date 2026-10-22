import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

const WARMED_KEY = "bilgi-yarismasi.offline-warmed";

/**
 * Reads every question once per browser session, so all pools are saved in the local
 * Firestore cache and a quiz can be started even if the internet drops later.
 * Costs one read per question per session, well within the free quota at classroom scale.
 */
export async function warmOfflineCache(): Promise<void> {
  try {
    if (!navigator.onLine || sessionStorage.getItem(WARMED_KEY)) return;
    await getDocs(collection(db, "questions"));
    sessionStorage.setItem(WARMED_KEY, "1");
  } catch {
    // Best effort: the quiz still works online.
  }
}
