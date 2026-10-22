import type { ReactNode } from "react";
import AdminGuard from "@/components/admin/AdminGuard";
import AdminHeader from "@/components/admin/AdminHeader";

// Every page in this group requires an admin; /admin/giris lives outside it.
// Auth is checked in the browser (Firebase client SDK), so panel pages are never server-rendered;
// each page therefore sets `instant = false` to skip Next's instant-navigation validation.
export default function AdminPanelLayout({ children }: { children: ReactNode }) {
  return (
    <AdminGuard>
      <AdminHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">{children}</main>
    </AdminGuard>
  );
}
