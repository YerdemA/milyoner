"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import { LoadingState } from "@/components/ui/Spinner";
import { signOutAdmin, useAuth } from "./AuthProvider";

/** Renders children only for signed-in admins; sends everyone else to the login page. */
export default function AdminGuard({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (auth.status === "signedOut") router.replace("/admin/giris");
  }, [auth.status, router]);

  if (auth.status !== "signedIn") return <LoadingState />;
  if (!auth.isAdmin) return <NoAccess email={auth.user.email} />;
  return <>{children}</>;
}

function NoAccess({ email }: { email: string | null }) {
  const [busy, setBusy] = useState(false);
  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center gap-5 p-6">
      <h1 className="text-3xl font-bold">Yetkiniz yok</h1>
      <Alert tone="error">
        <strong>{email}</strong> hesabının yönetici yetkisi yok. Yönetici olmak için Firebase
        konsolunda <code>admins</code> koleksiyonuna bu hesabın UID&apos;si ile bir belge
        eklenmelidir.
      </Alert>
      <Button
        variant="secondary"
        loading={busy}
        onClick={() => {
          setBusy(true);
          signOutAdmin();
        }}
      >
        Çıkış yap ve başka hesapla giriş yap
      </Button>
    </main>
  );
}
