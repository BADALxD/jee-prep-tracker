import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { MobileNav } from "@/components/dashboard/MobileNav";
import type { UserProfile } from "@/types";

export default async function SubjectsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", authUser.id)
    .single();

  if (!profile) redirect("/auth/login");

  const user = profile as UserProfile;

  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="hidden lg:block">
        <Sidebar user={user} />
      </div>
      <MobileNav user={user} />
      <main className="lg:pl-60">
        <div className="min-h-screen">{children}</div>
      </main>
    </div>
  );
}
