"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Mail, Lock, AlertCircle } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setIsLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <Input
        label="Email address"
        type="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        leftIcon={<Mail className="h-4 w-4" />}
        required
        autoComplete="email"
      />

      <Input
        label="Password"
        type="password"
        placeholder="••••••••"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        leftIcon={<Lock className="h-4 w-4" />}
        required
        autoComplete="current-password"
      />

      <div className="flex justify-end">
        <Link
          href="/auth/forgot-password"
          className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          Forgot password?
        </Link>
      </div>

      <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
        Sign In
      </Button>

      <p className="text-center text-sm text-zinc-500">
        Don&apos;t have an account?{" "}
        <Link
          href="/auth/signup"
          className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
        >
          Create one
        </Link>
      </p>
    </form>
  );
}
