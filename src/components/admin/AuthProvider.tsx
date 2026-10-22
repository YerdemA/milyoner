"use client";

import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { auth } from "@/lib/firebase";
import { isAdmin } from "@/lib/firestore/admins";

type AuthState =
  | { status: "loading" }
  | { status: "signedOut" }
  | { status: "signedIn"; user: User; isAdmin: boolean };

const AuthContext = createContext<AuthState>({ status: "loading" });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: "loading" });

  useEffect(() => {
    return onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setState({ status: "signedOut" });
        return;
      }
      setState({ status: "loading" });
      // If the check itself fails (e.g. offline), treat the user as non-admin;
      // the rules would reject their writes anyway.
      const admin = await isAdmin(user.uid).catch(() => false);
      setState({ status: "signedIn", user, isAdmin: admin });
    });
  }, []);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

export function signOutAdmin() {
  return signOut(auth);
}
