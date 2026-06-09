import type { Metadata } from "next";
import { Zap } from "lucide-react";

export const metadata: Metadata = {
  title: "Sign In",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-zinc-950 flex">
      {/* Left panel - decorative */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-zinc-950 via-zinc-900 to-indigo-950/30">
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-grid opacity-40" />

        {/* Glow effects */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 h-72 w-72 rounded-full bg-indigo-600/20 blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 h-48 w-48 rounded-full bg-violet-600/10 blur-3xl" />

        <div className="relative z-10 flex flex-col p-12">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 shadow-lg shadow-indigo-500/30">
              <Zap className="h-5 w-5 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-xl font-bold text-zinc-100">JEE Tracker</span>
          </div>

          {/* Content */}
          <div className="mt-auto">
            <h1 className="text-4xl font-bold text-zinc-100 leading-tight mb-4">
              Track your path
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">
                to your dream IIT
              </span>
            </h1>
            <p className="text-zinc-400 text-lg leading-relaxed max-w-sm">
              Structured chapter tracking, mock test analytics, and AI-powered
              readiness scoring — everything you need to crack JEE.
            </p>

            {/* Feature list */}
            <ul className="mt-8 space-y-3">
              {[
                "Track 89 chapters across Physics, Chemistry & Mathematics",
                "Weighted progress scoring based on chapter importance",
                "Mock test performance analytics",
                "Real-time readiness score (0–100)",
              ].map((feature) => (
                <li key={feature} className="flex items-start gap-2.5 text-sm text-zinc-400">
                  <span className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-400 text-xs">
                    ✓
                  </span>
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Right panel - auth form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold text-zinc-100">JEE Tracker</span>
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}
