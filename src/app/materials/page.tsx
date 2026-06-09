import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { MobileNav } from "@/components/dashboard/MobileNav";
import { MaterialsClient } from "@/components/dashboard/MaterialsClient";
import type { UserProfile, Material } from "@/types";

export const metadata = { title: "Materials — JEE Tracker" };

export default async function MaterialsPage() {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) redirect("/auth/login");

  const [{ data: profile }, { data: materials }] = await Promise.all([
    supabase.from("user_profiles").select("*").eq("id", authUser.id).single(),
    supabase
      .from("materials")
      .select("*")
      .order("created_at", { ascending: false }),
  ]);

  if (!profile) redirect("/auth/login");

  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="hidden lg:block">
        <Sidebar user={profile as UserProfile} />
      </div>
      <MobileNav user={profile as UserProfile} />
      <main className="lg:pl-60">
        <MaterialsClient
          materials={(materials || []) as Material[]}
        />
      </main>
    </div>
  );
}
