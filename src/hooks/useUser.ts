"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAppStore } from "@/lib/store";
import type { UserProfile } from "@/types";

export function useUser() {
  const { user, isLoading, setUser, setLoading } = useAppStore();

  useEffect(() => {
    const supabase = createClient();

    async function fetchUser() {
      setLoading(true);
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", authUser.id)
        .single();

      setUser(profile as UserProfile);
      setLoading(false);
    }

    fetchUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        setUser(null);
        setLoading(false);
        return;
      }

      if (event === "SIGNED_IN" && session.user) {
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();
        setUser(profile as UserProfile);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [setUser, setLoading]);

  return { user, isLoading };
}
