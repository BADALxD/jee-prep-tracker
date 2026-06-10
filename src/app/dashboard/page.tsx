import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  calculateSubjectProgress,
  calculateOverallProgress,
  calculateMockTestStats,
  calculateReadinessScore,
} from "@/lib/progress";
import { ReadinessMeter } from "@/components/dashboard/ReadinessMeter";
import { SubjectCard } from "@/components/dashboard/SubjectCard";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { ProgressBar } from "@/components/ui/Progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { cn, formatDate } from "@/lib/utils";
import {
  Target,
  TrendingUp,
  ClipboardList,
  Trophy,
  BookOpen,
  ChevronRight,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import type { Chapter, ChapterProgress, MockTest, UserProfile } from "@/types";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) redirect("/auth/login");

  const [
    { data: profile },
    { data: chapters },
    { data: progressData },
    { data: mockTests },
  ] = await Promise.all([
    supabase.from("user_profiles").select("*").eq("id", authUser.id).single(),
    supabase.from("chapters").select("*").order("chapter_number"),
    supabase.from("chapter_progress").select("*").eq("user_id", authUser.id),
    supabase
      .from("mock_tests")
      .select("*")
      .eq("user_id", authUser.id)
      .order("test_date", { ascending: false }),
  ]);

  if (!profile) redirect("/auth/login");

  const user = profile as UserProfile;

  // Build progress map
  const progressMap = new Map<string, ChapterProgress>();
  (progressData || []).forEach((p: ChapterProgress) => {
    progressMap.set(p.chapter_id, p);
  });

  const physicsChapters = (chapters || []).filter((c: Chapter) => c.subject === "Physics");
  const chemistryChapters = (chapters || []).filter((c: Chapter) => c.subject === "Chemistry");
  const mathChapters = (chapters || []).filter((c: Chapter) => c.subject === "Mathematics");

  const physicsProgress = calculateSubjectProgress("Physics", physicsChapters, progressMap);
  const chemistryProgress = calculateSubjectProgress("Chemistry", chemistryChapters, progressMap);
  const mathProgress = calculateSubjectProgress("Mathematics", mathChapters, progressMap);
  const overallProgress = calculateOverallProgress(physicsProgress, chemistryProgress, mathProgress);
  const mockStats = calculateMockTestStats(mockTests as MockTest[] || []);
  const readinessScore = calculateReadinessScore(overallProgress, mockStats);

  // Subject completion percentages (using weighted overall_percent)
  const physicsCompletion = physicsProgress.overall_percent;
  const chemistryCompletion = chemistryProgress.overall_percent;
  const mathCompletion = mathProgress.overall_percent;

  return (
    <div className="px-4 py-6 lg:px-8 lg:py-8 space-y-6 max-w-7xl mx-auto">
      {/* Welcome header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">
            Welcome back, {user.full_name.split(" ")[0]} 👋
          </h1>
          <p className="text-sm text-zinc-400 mt-0.5">
            JEE {user.target_year} · {user.class} · {user.category}
            {user.target_college && ` · Targeting ${user.target_college}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/mock-tests"
            className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
          >
            <ClipboardList className="h-3.5 w-3.5" />
            Log Test
          </Link>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatsCard
          title="Overall Completion"
          value={`${overallProgress.overall_percent}%`}
          subtitle="Weighted progress"
          icon={<Target className="h-5 w-5 text-indigo-400" />}
          iconBg="bg-indigo-500/10"
        />
        <StatsCard
          title="Readiness Score"
          value={readinessScore}
          subtitle="Out of 100"
          icon={<TrendingUp className="h-5 w-5 text-emerald-400" />}
          iconBg="bg-emerald-500/10"
        />
        <StatsCard
          title="Mock Tests"
          value={mockStats.total_tests}
          subtitle={
            mockStats.total_tests > 0
              ? `Best: ${mockStats.best_percentage}%`
              : "No tests yet"
          }
          icon={<ClipboardList className="h-5 w-5 text-amber-400" />}
          iconBg="bg-amber-500/10"
        />
        <StatsCard
          title="PYQ Progress"
          value={`${overallProgress.pyq_percent}%`}
          subtitle="Previous year questions"
          icon={<BookOpen className="h-5 w-5 text-blue-400" />}
          iconBg="bg-blue-500/10"
        />
      </div>

      {/* Main content grid */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Left column: Subjects */}
        <div className="space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-300">Subject Progress</h2>
            <span className="text-xs text-zinc-500">Weighted scoring</span>
          </div>

          <SubjectCard progress={physicsProgress} />
          <SubjectCard progress={chemistryProgress} />
          <SubjectCard progress={mathProgress} />

          {/* Subject completion summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Subject Completion</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { label: "Physics", value: physicsCompletion, color: "bg-indigo-500", href: "/subjects/physics" },
                  { label: "Chemistry", value: chemistryCompletion, color: "bg-emerald-500", href: "/subjects/chemistry" },
                  { label: "Mathematics", value: mathCompletion, color: "bg-amber-500", href: "/subjects/mathematics" },
                ].map((item) => (
                  <Link key={item.label} href={item.href} className="flex items-center gap-3 group">
                    <span className="w-24 text-xs text-zinc-400 group-hover:text-zinc-200 transition-colors">{item.label}</span>
                    <ProgressBar
                      value={item.value}
                      barClassName={item.color}
                      className="flex-1"
                    />
                    <span className="w-9 text-right text-xs font-semibold text-zinc-300">
                      {item.value}%
                    </span>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Preparation breakdown by component */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Preparation Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { label: "Theory", value: overallProgress.theory_percent, color: "bg-blue-500", weight: "25%" },
                  { label: "Module", value: overallProgress.module_percent, color: "bg-violet-500", weight: "45%" },
                  { label: "PYQ", value: overallProgress.pyq_percent, color: "bg-amber-500", weight: "20%" },
                  { label: "Mock", value: overallProgress.mock_percent, color: "bg-emerald-500", weight: "10%" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3">
                    <span className="w-16 text-xs text-zinc-400">{item.label}</span>
                    <span className="w-8 text-[10px] text-zinc-600">{item.weight}</span>
                    <ProgressBar
                      value={item.value}
                      barClassName={item.color}
                      className="flex-1"
                    />
                    <span className="w-9 text-right text-xs font-semibold text-zinc-300">
                      {item.value}%
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column: Readiness + weak/strong */}
        <div className="space-y-4">
          {/* Readiness meter */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle>Readiness Score</CardTitle>
                <Sparkles className="h-4 w-4 text-indigo-400" />
              </div>
            </CardHeader>
            <CardContent>
              <ReadinessMeter
                score={readinessScore}
                physicsScore={physicsCompletion}
                chemistryScore={chemistryCompletion}
                mathScore={mathCompletion}
              />
            </CardContent>
          </Card>

          {/* Weakest chapters */}
          {overallProgress.weakest_chapters.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-400" />
                  <CardTitle>Weak Chapters</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {overallProgress.weakest_chapters.slice(0, 5).map((ch) => (
                    <div key={ch.id} className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-[10px] flex-shrink-0">
                        {ch.subject.slice(0, 3)}
                      </Badge>
                      <span className="flex-1 text-xs text-zinc-400 truncate">{ch.name}</span>
                      <span className="text-xs font-medium text-amber-400">
                        {ch.completion_percent}%
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent mock tests */}
          {mockStats.recent_tests.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-amber-400" />
                    <CardTitle>Recent Tests</CardTitle>
                  </div>
                  <Link
                    href="/mock-tests"
                    className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-0.5"
                  >
                    View all <ChevronRight className="h-3 w-3" />
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2.5">
                  {mockStats.recent_tests.slice(0, 4).map((test) => (
                    <div
                      key={test.id}
                      className="flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-zinc-300 truncate">
                          {test.subject}
                        </p>
                        <p className="text-[10px] text-zinc-500">
                          {formatDate(test.test_date)}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p
                          className={cn(
                            "text-xs font-bold",
                            ((test.score / test.total_marks) * 100) >= 70
                              ? "text-emerald-400"
                              : ((test.score / test.total_marks) * 100) >= 50
                              ? "text-amber-400"
                              : "text-red-400"
                          )}
                        >
                          {Math.round((test.score / test.total_marks) * 100)}%
                        </p>
                        <p className="text-[10px] text-zinc-500">
                          {test.score}/{test.total_marks}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Strong chapters */}
          {overallProgress.strongest_chapters.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-emerald-400" />
                  <CardTitle>Strong Chapters</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {overallProgress.strongest_chapters.slice(0, 4).map((ch) => (
                    <div key={ch.id} className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-[10px] flex-shrink-0">
                        {ch.subject.slice(0, 3)}
                      </Badge>
                      <span className="flex-1 text-xs text-zinc-400 truncate">{ch.name}</span>
                      <span className="text-xs font-medium text-emerald-400">
                        {ch.completion_percent}%
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
