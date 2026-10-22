"use client";

import { signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import { TextField } from "@/components/ui/Field";
import { LoadingState } from "@/components/ui/Spinner";
import { getErrorMessage } from "@/lib/errors";
import { auth } from "@/lib/firebase";
import { useAuth } from "./AuthProvider";

export default function LoginForm() {
  const authState = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Already signed in (or just signed in): go to the panel. Non-admins see the notice there.
  useEffect(() => {
    if (authState.status === "signedIn") router.replace("/admin");
  }, [authState.status, router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (err) {
      setError(getErrorMessage(err));
      setBusy(false);
    }
  }

  if (authState.status !== "signedOut" && !busy && !error) return <LoadingState />;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
      <TextField
        label="E-posta"
        type="email"
        autoComplete="username"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        autoFocus
      />
      <TextField
        label="Şifre"
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      {error && <Alert tone="error">{error}</Alert>}
      <Button type="submit" size="lg" loading={busy} disabled={!email || !password}>
        Giriş yap
      </Button>
    </form>
  );
}
