"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import Button from "@/components/ui/Button";
import { signOutAdmin, useAuth } from "./AuthProvider";

const NAV = [
  { href: "/admin", label: "Soru havuzları", match: (p: string) => p === "/admin" || p.startsWith("/admin/havuzlar") },
  { href: "/admin/ayarlar", label: "Ayarlar", match: (p: string) => p.startsWith("/admin/ayarlar") },
];

export default function AdminHeader() {
  const auth = useAuth();
  const email = auth.status === "signedIn" ? auth.user.email : null;

  return (
    <header className="border-b border-line bg-surface">
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center gap-x-6 gap-y-3 px-6 py-4">
        <span className="text-lg font-bold text-accent">Yönetim Paneli</span>
        {/* usePathname suspends on dynamic routes during prerender, so it lives in its own boundary. */}
        <Suspense fallback={<NavLinks pathname="" />}>
          <ActiveNavLinks />
        </Suspense>
        <div className="ml-auto flex items-center gap-3">
          <Link href="/" className="text-base text-muted underline-offset-4 hover:text-fg hover:underline">
            Yarışmaya git →
          </Link>
          {email && <span className="hidden text-sm text-muted md:inline">{email}</span>}
          <Button variant="ghost" onClick={() => signOutAdmin()}>
            Çıkış
          </Button>
        </div>
      </div>
    </header>
  );
}

function ActiveNavLinks() {
  return <NavLinks pathname={usePathname()} />;
}

function NavLinks({ pathname }: { pathname: string }) {
  return (
    <nav className="flex gap-1">
      {NAV.map((item) => {
        const active = item.match(pathname);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`rounded-lg px-3 py-2 text-base font-medium ${active ? "bg-raised text-fg" : "text-muted hover:text-fg"}`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
