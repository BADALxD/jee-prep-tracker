"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn, getInitials } from "@/lib/utils";
import {
  LayoutDashboard,
  Atom,
  FlaskConical,
  Calculator,
  ClipboardList,
  BookOpen,
  ShieldCheck,
  LogOut,
  ChevronRight,
} from "lucide-react";
import type { UserProfile } from "@/types";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: <LayoutDashboard className="h-4 w-4" />,
  },
  {
    href: "/subjects/physics",
    label: "Physics",
    icon: <Atom className="h-4 w-4" />,
  },
  {
    href: "/subjects/chemistry",
    label: "Chemistry",
    icon: <FlaskConical className="h-4 w-4" />,
  },
  {
    href: "/subjects/mathematics",
    label: "Mathematics",
    icon: <Calculator className="h-4 w-4" />,
  },
  {
    href: "/mock-tests",
    label: "Mock Tests",
    icon: <ClipboardList className="h-4 w-4" />,
  },
  {
    href: "/materials",
    label: "Materials",
    icon: <BookOpen className="h-4 w-4" />,
  },
  {
    href: "/admin",
    label: "Admin Panel",
    icon: <ShieldCheck className="h-4 w-4" />,
    adminOnly: true,
  },
];

interface SidebarProps {
  user: UserProfile;
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
    router.refresh();
  }

  const filteredNav = navItems.filter(
    (item) => !item.adminOnly || user.is_admin
  );

  return (
    <aside className="fixed inset-y-0 left-0 z-50 flex w-60 flex-col border-r border-zinc-800/50 bg-zinc-950">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2.5 border-b border-zinc-800/50 px-4">
        <div className="flex h-8 w-8 items-center justify-center">
  <Image
    src="/og-image.png"
    alt="JEE Tracker"
    width={32}
    height={32}
    className="rounded-lg"
  />
</div>
        <div>
          <span className="text-sm font-bold text-zinc-100">JEE Tracker</span>
          <p className="text-xs text-zinc-500">v1.0</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-0.5">
          {filteredNav.map((item) => {
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150",
                  isActive
                    ? "bg-indigo-600/15 text-indigo-400"
                    : "text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-100"
                )}
              >
                <span
                  className={cn(
                    "transition-colors",
                    isActive
                      ? "text-indigo-400"
                      : "text-zinc-500 group-hover:text-zinc-300"
                  )}
                >
                  {item.icon}
                </span>
                <span>{item.label}</span>
                {isActive && (
                  <ChevronRight className="ml-auto h-3 w-3 text-indigo-400" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* User section */}
      <div className="border-t border-zinc-800/50 p-3">
        <div className="flex items-center gap-3 rounded-lg p-2">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-xs font-bold text-white">
            {getInitials(user.full_name)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-zinc-200">
              {user.full_name}
            </p>
            <p className="truncate text-xs text-zinc-500">
              JEE {user.target_year} • {user.class}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="flex-shrink-0 rounded p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 transition-colors"
            title="Sign out"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
