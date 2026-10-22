import Link from "next/link";
import LoginForm from "@/components/admin/LoginForm";

export default function AdminLoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-8 shadow-2xl">
        <h1 className="text-3xl font-bold">Yönetici girişi</h1>
        <p className="mb-6 mt-2 text-base text-muted">
          Soru havuzlarını ve soruları düzenlemek için giriş yapın.
        </p>
        <LoginForm />
        <Link href="/" className="mt-6 block text-center text-sm text-muted hover:text-fg">
          ← Yarışma ekranına dön
        </Link>
      </div>
    </main>
  );
}
