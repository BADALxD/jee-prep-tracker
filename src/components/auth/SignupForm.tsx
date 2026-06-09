"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Mail, Lock, User, AlertCircle, CheckCircle } from "lucide-react";
import { generateYearOptions } from "@/lib/utils";
import type { UserClass, UserCategory } from "@/types";

export function SignupForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    full_name: "",
    target_year: new Date().getFullYear() + 1,
    class: "12th" as UserClass,
    category: "General" as UserCategory,
    target_college: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const yearOptions = generateYearOptions().map((y) => ({
    value: String(y),
    label: `JEE ${y}`,
  }));

  const classOptions: { value: UserClass; label: string }[] = [
    { value: "11th", label: "Class 11th" },
    { value: "12th", label: "Class 12th" },
    { value: "dropper", label: "Dropper" },
  ];

  const categoryOptions: { value: UserCategory; label: string }[] = [
    { value: "General", label: "General" },
    { value: "OBC", label: "OBC" },
    { value: "SC", label: "SC" },
    { value: "ST", label: "ST" },
    { value: "EWS", label: "EWS" },
    { value: "PwD", label: "PwD" },
  ];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);

    const supabase = createClient();

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          full_name: formData.full_name,
        },
      },
    });

    if (authError) {
      setError(authError.message);
      setIsLoading(false);
      return;
    }

    if (authData.user) {
      const { error: profileError } = await supabase.from("user_profiles").insert({
        id: authData.user.id,
        email: formData.email,
        full_name: formData.full_name,
        target_year: formData.target_year,
        class: formData.class,
        category: formData.category,
        target_college: formData.target_college,
        is_admin: false,
      });

      if (profileError) {
        setError("Failed to create profile. Please try again.");
        setIsLoading(false);
        return;
      }
    }

    setSuccess(true);
    setIsLoading(false);

    // If email confirmation is disabled, redirect to dashboard
    if (authData.session) {
      router.push("/dashboard");
    }
  }

  if (success && !formData.email) {
    return null;
  }

  if (success) {
    return (
      <div className="space-y-4 text-center">
        <div className="flex justify-center">
          <CheckCircle className="h-12 w-12 text-emerald-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-zinc-100">Account Created!</h3>
          <p className="mt-1 text-sm text-zinc-400">
            Check your email to confirm your account, then{" "}
            <Link href="/auth/login" className="text-indigo-400 hover:underline">
              sign in
            </Link>
            .
          </p>
        </div>
      </div>
    );
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
        label="Full Name"
        type="text"
        placeholder="John Doe"
        value={formData.full_name}
        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
        leftIcon={<User className="h-4 w-4" />}
        required
      />

      <Input
        label="Email address"
        type="email"
        placeholder="you@example.com"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        leftIcon={<Mail className="h-4 w-4" />}
        required
        autoComplete="email"
      />

      <div className="grid grid-cols-2 gap-3">
        <Select
          label="Target Year"
          value={String(formData.target_year)}
          onChange={(e) =>
            setFormData({ ...formData, target_year: Number(e.target.value) })
          }
          options={yearOptions}
        />
        <Select
          label="Class"
          value={formData.class}
          onChange={(e) =>
            setFormData({ ...formData, class: e.target.value as UserClass })
          }
          options={classOptions}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Select
          label="Category"
          value={formData.category}
          onChange={(e) =>
            setFormData({ ...formData, category: e.target.value as UserCategory })
          }
          options={categoryOptions}
        />
        <Input
          label="Target College"
          type="text"
          placeholder="IIT Bombay"
          value={formData.target_college}
          onChange={(e) =>
            setFormData({ ...formData, target_college: e.target.value })
          }
        />
      </div>

      <Input
        label="Password"
        type="password"
        placeholder="••••••••"
        value={formData.password}
        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
        leftIcon={<Lock className="h-4 w-4" />}
        required
        hint="At least 6 characters"
      />

      <Input
        label="Confirm Password"
        type="password"
        placeholder="••••••••"
        value={formData.confirmPassword}
        onChange={(e) =>
          setFormData({ ...formData, confirmPassword: e.target.value })
        }
        leftIcon={<Lock className="h-4 w-4" />}
        required
      />

      <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
        Create Account
      </Button>

      <p className="text-center text-sm text-zinc-500">
        Already have an account?{" "}
        <Link
          href="/auth/login"
          className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
