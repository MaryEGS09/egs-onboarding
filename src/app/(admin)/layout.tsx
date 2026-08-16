import { AdminSessionProvider } from "@/components/providers/admin-session-provider";

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <AdminSessionProvider>{children}</AdminSessionProvider>;
}
