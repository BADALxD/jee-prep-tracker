import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { MobileNav } from "@/components/dashboard/MobileNav";
import { AdminClient } from "@/components/admin/AdminClient";
import type { UserProfile, Material } from "@/types";

export const metadata = { title: "Admin — JEE Tracker" };

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", authUser.id)
    .single();

  if (!profile || !profile.is_admin) redirect("/dashboard");

  // Fetch admin data
  const [{ data: users }, { data: materials }, { count: userCount }] = await Promise.all([
    supabase
      .from("user_profiles")
      .select("*, chapter_progress(count), mock_tests(count)")
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("materials")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase.from("user_profiles").select("*", { count: "exact", head: true }),
  ]);

  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="hidden lg:block">
        <Sidebar user={profile as UserProfile} />
      </div>
      <MobileNav user={profile as UserProfile} />
      <main className="lg:pl-60">
        <AdminClient
          adminUser={profile as UserProfile}
          users={(users || []) as UserProfile[]}
          materials={(materials || []) as Material[]}
          totalUsers={userCount || 0}
        />
      </main>
    </div>
  );
}
