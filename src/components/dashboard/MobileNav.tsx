"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Atom,
  FlaskConical,
  Calculator,
  ClipboardList,
  BookOpen,
  ShieldCheck,
  X,
  Menu,
  Zap,
  LogOut,
} from "lucide-react";
import type { UserProfile } from "@/types";

interface MobileNavProps {
  user: UserProfile;
}

export function MobileNav({ user }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
    { href: "/subjects/physics", label: "Physics", icon: <Atom className="h-5 w-5" /> },
    { href: "/subjects/chemistry", label: "Chemistry", icon: <FlaskConical className="h-5 w-5" /> },
    { href: "/subjects/mathematics", label: "Mathematics", icon: <Calculator className="h-5 w-5" /> },
    { href: "/mock-tests", label: "Mock Tests", icon: <ClipboardList className="h-5 w-5" /> },
    { href: "/materials", label: "Materials", icon: <BookOpen className="h-5 w-5" /> },
    ...(user.is_admin ? [{ href: "/admin", label: "Admin", icon: <ShieldCheck className="h-5 w-5" /> }] : []),
  ];

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
  }

  return (
    <>
      {/* Mobile header */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-zinc-800/50 bg-zinc-950/90 px-4 backdrop-blur-sm lg:hidden">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600">
            <Zap className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="text-sm font-bold text-zinc-100">JEE Tracker</span>
        </div>
        <button
          onClick={() => setIsOpen(true)}
          className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 bg-zinc-950 border-r border-zinc-800/50 flex flex-col transition-transform duration-300 lg:hidden",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-14 items-center justify-between border-b border-zinc-800/50 px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600">
              <Zap className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-sm font-bold text-zinc-100">JEE Tracker</span>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          {navItems.map((item) => {
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-indigo-600/15 text-indigo-400"
                    : "text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-100"
                )}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-zinc-800/50 p-3">
          <div className="flex items-center justify-between px-2 py-1">
            <div>
              <p className="text-sm font-medium text-zinc-200">{user.full_name}</p>
              <p className="text-xs text-zinc-500">JEE {user.target_year}</p>
            </div>
            <button
              onClick={handleLogout}
              className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-800 hover:text-red-400 transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
