// Progress calculation weights configuration
// Theory=25%, Module=45%, PYQ=20%, Mock=10%

export const PROGRESS_WEIGHTS = {
  theory: 0.25,   // 25%
  module: 0.45,   // 45%
  pyq: 0.20,      // 20%
  mock: 0.10,     // 10%
} as const;

// Readiness score weights
export const READINESS_WEIGHTS = {
  weighted_completion: 0.40,  // 40% - weighted chapter completion
  pyq_completion: 0.30,       // 30% - PYQ completion (exam-specific)
  mock_test_performance: 0.30, // 30% - mock test scores
} as const;

// Readiness levels
export const READINESS_LEVELS = [
  { min: 0, max: 25, level: "Beginner", color: "#ef4444", bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/20" },
  { min: 26, max: 50, level: "Intermediate", color: "#f59e0b", bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20" },
  { min: 51, max: 75, level: "Advanced", color: "#3b82f6", bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20" },
  { min: 76, max: 100, level: "Exam Ready", color: "#10b981", bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20" },
] as const;

export function getReadinessLevel(score: number) {
  for (const level of READINESS_LEVELS) {
    if (score >= level.min && score <= level.max) return level;
  }
  return READINESS_LEVELS[0];
}

// Subject colors
export const SUBJECT_COLORS = {
  Physics: {
    primary: "#6366f1",
    light: "#818cf8",
    dark: "#4f46e5",
    bg: "bg-indigo-500/10",
    text: "text-indigo-400",
    border: "border-indigo-500/20",
    gradient: "from-indigo-500 to-violet-600",
  },
  Chemistry: {
    primary: "#10b981",
    light: "#34d399",
    dark: "#059669",
    bg: "bg-emerald-500/10",
    text: "text-emerald-400",
    border: "border-emerald-500/20",
    gradient: "from-emerald-500 to-teal-600",
  },
  Mathematics: {
    primary: "#f59e0b",
    light: "#fbbf24",
    dark: "#d97706",
    bg: "bg-amber-500/10",
    text: "text-amber-400",
    border: "border-amber-500/20",
    gradient: "from-amber-500 to-orange-600",
  },
} as const;

// App metadata
export const APP_CONFIG = {
  name: "JEE Tracker",
  tagline: "Your Path to IIT",
  version: "1.0.0",
  supportEmail: "support@jeetracker.com",
} as const;
