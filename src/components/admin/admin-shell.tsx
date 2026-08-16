"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Users, ListChecks, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const NAV = [
  { href: "/admin", label: "Clients", icon: Users },
  { href: "/admin/questionnaire", label: "Questionnaire", icon: ListChecks },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen w-full">
      <aside className="flex w-56 shrink-0 flex-col border-r bg-sidebar px-4 py-6 text-sidebar-foreground">
        <Image src="/brand/egs-logo-stacked.png" alt="EGS Marketing Solutions" width={160} height={96} className="mb-6 h-auto w-32 px-2" priority />
        <nav className="flex flex-1 flex-col gap-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 rounded-md px-2 py-2 text-sm transition-colors hover:bg-sidebar-accent",
                pathname === item.href && "bg-sidebar-accent font-medium text-sidebar-accent-foreground",
              )}
            >
              <item.icon className="size-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        <Button variant="ghost" size="sm" className="justify-start" onClick={() => signOut({ callbackUrl: "/admin/login" })}>
          <LogOut className="mr-2 size-4" /> Sign out
        </Button>
      </aside>
      <div className="flex-1 overflow-x-auto bg-background p-6">{children}</div>
    </div>
  );
}
