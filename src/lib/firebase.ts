import { getApp, getApps, initializeApp, type FirebaseOptions } from "firebase/app";
import { getAuth } from "firebase/auth";
import {
  getFirestore,
  initializeFirestore,
  memoryLocalCache,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from "firebase/firestore";

// Each variable must be referenced explicitly so Next.js can inline it into the client bundle.
const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const missingKeys = Object.entries(firebaseConfig)
  .filter(([key, value]) => !value && key !== "storageBucket")
  .map(([key]) => key);

if (missingKeys.length > 0) {
  console.warn(
    `[firebase] Missing config values: ${missingKeys.join(", ")}. ` +
      "Copy .env.example to .env.local and fill in the values from the Firebase console.",
  );
}

// Reuse the existing app during hot reload instead of initializing twice.
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const db = createFirestore();
export const auth = getAuth(app);

/**
 * In the browser, everything read from Firestore is also kept in IndexedDB, so the quiz can
 * still be set up and played when the classroom loses its internet connection.
 */
function createFirestore(): Firestore {
  try {
    return initializeFirestore(app, {
      localCache:
        typeof window === "undefined"
          ? memoryLocalCache()
          : persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
    });
  } catch {
    // Already initialized (hot reload).
    return getFirestore(app);
  }
}
