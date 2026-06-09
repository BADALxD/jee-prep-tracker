import type { Metadata } from "next";
import { SignupForm } from "@/components/auth/SignupForm";

export const metadata: Metadata = {
  title: "Create Account — JEE Tracker",
};

export default function SignupPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-100">Create your account</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Start tracking your JEE preparation today
        </p>
      </div>
      <SignupForm />
    </div>
  );
}
