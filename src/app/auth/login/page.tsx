import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Sign In — JEE Tracker",
};

export default function LoginPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-100">Welcome back</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Sign in to continue your JEE preparation journey
        </p>
      </div>
      <LoginForm />
    </div>
  );
}
