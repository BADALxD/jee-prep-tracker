"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { calculateMockTestStats } from "@/lib/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { cn, formatDate } from "@/lib/utils";
import {
  Plus, X, Trophy, TrendingUp, BarChart2, ClipboardList, Trash2
} from "lucide-react";
import toast from "react-hot-toast";
import type { MockTest } from "@/types";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface MockTestClientProps {
  initialTests: MockTest[];
  userId: string;
}

export function MockTestClient({ initialTests, userId }: MockTestClientProps) {
  const [tests, setTests] = useState<MockTest[]>(initialTests);
  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({
    test_name: "",
    test_date: new Date().toISOString().split("T")[0],
    marks_obtained: "",
    maximum_marks: "300",
  });

  const supabase = createClient();
  const stats = calculateMockTestStats(tests);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const obtained = Number(form.marks_obtained);
    const maximum = Number(form.maximum_marks);

    if (obtained > maximum) {
      toast.error("Marks obtained cannot exceed maximum marks");
      return;
    }

    setIsLoading(true);
    const { data, error } = await supabase
      .from("mock_tests")
      .insert({
  user_id: userId,
  subject: form.test_name,
  score: obtained,
  total_marks: maximum,
  test_date: form.test_date,
})
      .select()
      .single();

    if (error) {
      toast.error("Failed to save test");
    } else {
      toast.success("Test recorded!");
      setTests([data as MockTest, ...tests]);
      setShowForm(false);
      setForm({ test_name: "", test_date: new Date().toISOString().split("T")[0], marks_obtained: "", maximum_marks: "300" });
    }
    setIsLoading(false);
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from("mock_tests").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete");
    } else {
      setTests(tests.filter((t) => t.id !== id));
      toast.success("Test deleted");
    }
  }

  // Chart data (chronological)
  const chartData = [...tests]
    .sort((a, b) => new Date(a.test_date).getTime() - new Date(b.test_date).getTime())
    .map((t) => ({
      name: t.subject.length > 12 ? t.subject.slice(0, 12) + "…" : t.subject,
percentage: Math.round((t.score / t.total_marks) * 100),
marks: t.score,
    }));

  return (
    <div className="px-4 py-6 lg:px-8 lg:py-8 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Mock Tests</h1>
          <p className="text-sm text-zinc-400 mt-0.5">Track your test performance over time</p>
        </div>
        <Button onClick={() => setShowForm((v) => !v)} size="sm">
          {showForm ? <X className="h-4 w-4 mr-1.5" /> : <Plus className="h-4 w-4 mr-1.5" />}
          {showForm ? "Cancel" : "Add Test"}
        </Button>
      </div>

      {/* Add form */}
      {showForm && (
        <Card className="border-indigo-500/20 bg-indigo-500/5">
          <CardHeader className="pb-3">
            <CardTitle>Log New Test</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="sm:col-span-2 lg:col-span-2">
                <Input
                  label="Test Name"
                  placeholder="JEE Main Mock #1"
                  value={form.test_name}
                  onChange={(e) => setForm({ ...form, test_name: e.target.value })}
                  required
                />
              </div>
              <Input
                label="Date"
                type="date"
                value={form.test_date}
                onChange={(e) => setForm({ ...form, test_date: e.target.value })}
                required
              />
              <Input
                label="Max Marks"
                type="number"
                placeholder="300"
                value={form.maximum_marks}
                onChange={(e) => setForm({ ...form, maximum_marks: e.target.value })}
                required
              />
              <Input
                label="Marks Obtained"
                type="number"
                placeholder="e.g. 240"
                value={form.marks_obtained}
                onChange={(e) => setForm({ ...form, marks_obtained: e.target.value })}
                required
              />
              <div className="flex items-end sm:col-span-2 lg:col-span-3">
                <Button type="submit" isLoading={isLoading} className="w-full sm:w-auto">
                  Save Test
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      {tests.length > 0 && (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatsCard
              title="Total Tests"
              value={stats.total_tests}
              icon={<ClipboardList className="h-5 w-5 text-indigo-400" />}
              iconBg="bg-indigo-500/10"
            />
            <StatsCard
              title="Best Score"
              value={`${stats.best_percentage}%`}
              subtitle={`${stats.best_score} marks`}
              icon={<Trophy className="h-5 w-5 text-amber-400" />}
              iconBg="bg-amber-500/10"
            />
            <StatsCard
              title="Average Score"
              value={`${stats.average_percentage}%`}
              subtitle={`${stats.average_score} marks avg`}
              icon={<BarChart2 className="h-5 w-5 text-blue-400" />}
              iconBg="bg-blue-500/10"
            />
            <StatsCard
              title="Most Recent"
              value={`${stats.recent_percentage}%`}
              subtitle={`${stats.recent_score} marks`}
              icon={<TrendingUp className="h-5 w-5 text-emerald-400" />}
              iconBg="bg-emerald-500/10"
            />
          </div>

          {/* Chart */}
          {chartData.length >= 2 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Performance Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="perfGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="name"
                        tick={{ fill: "#71717a", fontSize: 10 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        domain={[0, 100]}
                        tick={{ fill: "#71717a", fontSize: 10 }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) => `${v}%`}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "#18181b",
                          border: "1px solid #27272a",
                          borderRadius: "8px",
                          fontSize: "12px",
                        }}
                        formatter={(value: number) => [`${value}%`, "Score"]}
                      />
                      <Area
                        type="monotone"
                        dataKey="percentage"
                        stroke="#6366f1"
                        strokeWidth={2}
                        fill="url(#perfGrad)"
                        dot={{ fill: "#6366f1", r: 3 }}
                        activeDot={{ r: 5 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Test history */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Test History</CardTitle>
        </CardHeader>
        <CardContent>
          {tests.length === 0 ? (
            <div className="py-12 text-center">
              <ClipboardList className="h-10 w-10 text-zinc-700 mx-auto mb-3" />
              <p className="text-sm text-zinc-500">No tests recorded yet</p>
              <p className="text-xs text-zinc-600 mt-1">Click &ldquo;Add Test&rdquo; to log your first mock test</p>
            </div>
          ) : (
            <div className="space-y-2">
              {tests.map((test) => (
                <div
                  key={test.id}
                  className="flex items-center gap-4 rounded-xl border border-zinc-800/50 bg-zinc-900/30 px-4 py-3 hover:bg-zinc-900/50 transition-colors group"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-200 truncate">{test.subject}</p>
                    <p className="text-xs text-zinc-500">{formatDate(test.test_date)}</p>
                  </div>
                  <div className="text-center flex-shrink-0">
                    <p className="text-xs text-zinc-500">
                      {test.score}/{test.total_marks}
                    </p>
                  </div>
                  <div className="flex-shrink-0 w-16 text-right">
                    <Badge
                      variant={
                        Math.round((test.score / test.total_marks) * 100) >= 70 ? "success" :
                        Math.round((test.score / test.total_marks) * 100) >= 50 ? "warning" : "danger"
                      }
                    >
                      {Math.round((test.score / test.total_marks) * 100)}%
                    </Badge>
                  </div>
                  <button
                    onClick={() => handleDelete(test.id)}
                    className={cn(
                      "p-1.5 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-all",
                      "opacity-0 group-hover:opacity-100"
                    )}
                    title="Delete test"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
