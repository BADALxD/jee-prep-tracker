import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { MobileNav } from "@/components/dashboard/MobileNav";
import { MockTestClient } from "@/components/dashboard/MockTestClient";
import type { UserProfile, MockTest } from "@/types";

export const metadata = { title: "Mock Tests — JEE Tracker" };

export default async function MockTestsPage() {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) redirect("/auth/login");

  const [{ data: profile }, { data: tests }] = await Promise.all([
    supabase.from("user_profiles").select("*").eq("id", authUser.id).single(),
    supabase
      .from("mock_tests")
      .select("*")
      .eq("user_id", authUser.id)
      .order("test_date", { ascending: false }),
  ]);

  if (!profile) redirect("/auth/login");

  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="hidden lg:block">
        <Sidebar user={profile as UserProfile} />
      </div>
      <MobileNav user={profile as UserProfile} />
      <main className="lg:pl-60">
        <MockTestClient
          initialTests={(tests || []) as MockTest[]}
          userId={authUser.id}
        />
      </main>
    </div>
  );
}
