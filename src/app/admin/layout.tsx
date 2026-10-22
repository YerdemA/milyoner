import type { Metadata } from "next";
import { AuthProvider } from "@/components/admin/AuthProvider";

export const metadata: Metadata = {
  title: "Yönetim Paneli · Nabız",
};

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return <AuthProvider>{children}</AuthProvider>;
}
