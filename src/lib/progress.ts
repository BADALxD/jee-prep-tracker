import type {
  Chapter,
  ChapterProgress,
  ChapterWithProgress,
  SubjectProgress,
  OverallProgress,
  MockTestStats,
  MockTest,
  SubjectName,
  ChapterRevision,
} from "@/types";
import { PROGRESS_WEIGHTS, READINESS_WEIGHTS } from "@/config/weights";

/**
 * Calculate the weighted completion score for a single chapter.
 * Weights: Theory=25%, Module=45%, PYQ=20%, Mock=10%
 * DB note: mock progress is stored in practice_completed column.
 */
export function calculateChapterCompletion(
  chapter: Chapter,
  progress: ChapterProgress | null
): { completion: number; weightedScore: number } {
  if (!progress) {
    return { completion: 0, weightedScore: 0 };
  }

  const theoryScore = progress.theory_completed ? 1 : 0;
  const moduleScore = progress.module_completed ? 1 : 0;
  const pyqScore = progress.pyq_completed ? 1 : 0;
  const mockScore = progress.practice_completed ? 1 : 0; // practice_completed = mock in UI

  const completion =
    theoryScore * PROGRESS_WEIGHTS.theory +
    moduleScore * PROGRESS_WEIGHTS.module +
    pyqScore * PROGRESS_WEIGHTS.pyq +
    mockScore * PROGRESS_WEIGHTS.mock;

  const weightedScore = completion * chapter.importance_score;

  return {
    completion: Math.round(completion * 100),
    weightedScore,
  };
}

/**
 * Calculate subject-level progress with weighted scoring
 */
export function calculateSubjectProgress(
  subject: SubjectName,
  chapters: Chapter[],
  progressMap: Map<string, ChapterProgress>
): SubjectProgress {
  if (chapters.length === 0) {
    return {
      subject,
      theory_percent: 0,
      module_percent: 0,
      pyq_percent: 0,
      mock_percent: 0,
      overall_percent: 0,
      weighted_completion: 0,
      total_chapters: 0,
      completed_chapters: 0,
      weakest_chapters: [],
      strongest_chapters: [],
    };
  }

  let theoryCount = 0;
  let moduleCount = 0;
  let pyqCount = 0;
  let mockCount = 0;
  let completedChapters = 0;

  let totalImportanceScore = 0;
  let achievedWeightedScore = 0;

  const chaptersWithProgress: ChapterWithProgress[] = chapters.map((chapter) => {
    const progress = progressMap.get(chapter.id) || null;
    const { completion, weightedScore } = calculateChapterCompletion(chapter, progress);

    totalImportanceScore += chapter.importance_score;
    achievedWeightedScore += weightedScore;

    if (progress) {
      if (progress.theory_completed) theoryCount++;
      if (progress.module_completed) moduleCount++;
      if (progress.pyq_completed) pyqCount++;
      if (progress.practice_completed) mockCount++; // practice_completed = mock
    }

    if (completion === 100) completedChapters++;

    return {
      ...chapter,
      progress,
      completion_percent: completion,
      weighted_score: weightedScore,
    };
  });

  const totalChapters = chapters.length;
  const theoryPercent = Math.round((theoryCount / totalChapters) * 100);
  const modulePercent = Math.round((moduleCount / totalChapters) * 100);
  const pyqPercent = Math.round((pyqCount / totalChapters) * 100);
  const mockPercent = Math.round((mockCount / totalChapters) * 100);

  // Weighted completion: chapters with higher importance_score contribute more
  const weightedCompletion =
    totalImportanceScore > 0
      ? Math.round((achievedWeightedScore / totalImportanceScore) * 100)
      : 0;

  // Sort for weakest and strongest
  const sorted = [...chaptersWithProgress].sort(
    (a, b) => a.completion_percent - b.completion_percent
  );

  const weakest = sorted
    .filter((c) => c.completion_percent < 100)
    .slice(0, 5);

  const strongest = [...sorted]
    .reverse()
    .filter((c) => c.completion_percent > 0)
    .slice(0, 5);

  // Overall percent using the defined weights
  const overallPercent = Math.round(
    theoryPercent * PROGRESS_WEIGHTS.theory +
    modulePercent * PROGRESS_WEIGHTS.module +
    pyqPercent * PROGRESS_WEIGHTS.pyq +
    mockPercent * PROGRESS_WEIGHTS.mock
  );

  return {
    subject,
    theory_percent: theoryPercent,
    module_percent: modulePercent,
    pyq_percent: pyqPercent,
    mock_percent: mockPercent,
    overall_percent: overallPercent,
    weighted_completion: weightedCompletion,
    total_chapters: totalChapters,
    completed_chapters: completedChapters,
    weakest_chapters: weakest,
    strongest_chapters: strongest,
  };
}

/**
 * Calculate overall progress across all subjects
 */
export function calculateOverallProgress(
  physicsProgress: SubjectProgress,
  chemistryProgress: SubjectProgress,
  mathProgress: SubjectProgress
): OverallProgress {
  const subjects = [physicsProgress, chemistryProgress, mathProgress];

  const theory_percent = Math.round(
    subjects.reduce((sum, s) => sum + s.theory_percent, 0) / 3
  );
  const module_percent = Math.round(
    subjects.reduce((sum, s) => sum + s.module_percent, 0) / 3
  );
  const pyq_percent = Math.round(
    subjects.reduce((sum, s) => sum + s.pyq_percent, 0) / 3
  );
  const mock_percent = Math.round(
    subjects.reduce((sum, s) => sum + s.mock_percent, 0) / 3
  );

  const overall_percent = Math.round(
    subjects.reduce((sum, s) => sum + s.overall_percent, 0) / 3
  );

  const weighted_completion = Math.round(
    subjects.reduce((sum, s) => sum + s.weighted_completion, 0) / 3
  );

  const allChapters = [
    ...physicsProgress.weakest_chapters,
    ...chemistryProgress.weakest_chapters,
    ...mathProgress.weakest_chapters,
  ].sort((a, b) => a.completion_percent - b.completion_percent);

  const allStrongest = [
    ...physicsProgress.strongest_chapters,
    ...chemistryProgress.strongest_chapters,
    ...mathProgress.strongest_chapters,
  ].sort((a, b) => b.completion_percent - a.completion_percent);

  return {
    theory_percent,
    module_percent,
    pyq_percent,
    mock_percent,
    overall_percent,
    weighted_completion,
    physics: physicsProgress,
    chemistry: chemistryProgress,
    mathematics: mathProgress,
    weakest_chapters: allChapters.slice(0, 5),
    strongest_chapters: allStrongest.slice(0, 5),
  };
}

/**
 * Calculate mock test statistics
 */
export function calculateMockTestStats(tests: MockTest[]): MockTestStats {
  if (tests.length === 0) {
    return {
      total_tests: 0,
      best_score: 0,
      average_score: 0,
      recent_score: 0,
      best_percentage: 0,
      average_percentage: 0,
      recent_percentage: 0,
      recent_tests: [],
      full_mock_count: 0,
last5_full_mock_average: 0,
confidence: "None",
    };
  }

  const percentages = tests.map((t) =>
    Math.round((t.score / t.total_marks) * 100)
  );

  const bestPercentage = Math.max(...percentages);

  const averagePercentage = Math.round(
    percentages.reduce((sum, p) => sum + p, 0) / tests.length
  );

  const sorted = [...tests].sort(
    (a, b) =>
      new Date(b.test_date).getTime() -
      new Date(a.test_date).getTime()
  );

  const recentTest = sorted[0];

  const bestTest =
    tests.find(
      (t) => Math.round((t.score / t.total_marks) * 100) === bestPercentage
    ) || tests[0];
    const fullMocks = tests.filter(
  (t) => t.test_type === "full"
);

const last5FullMocks = [...fullMocks]
  .sort(
    (a, b) =>
      new Date(b.test_date).getTime() -
      new Date(a.test_date).getTime()
  )
  .slice(0, 5);

const last5FullMockAverage =
  last5FullMocks.length === 0
    ? 0
    : Math.round(
        last5FullMocks.reduce(
          (sum, t) => sum + t.score,
          0
        ) / last5FullMocks.length
      );

const confidence =
  fullMocks.length === 0
    ? "None"
    : fullMocks.length < 3
    ? "Low"
    : fullMocks.length < 5
    ? "Medium"
    : "High";

  return {
    total_tests: tests.length,
    best_score: bestTest.score,
    average_score: Math.round(
      tests.reduce((sum, t) => sum + t.score, 0) / tests.length
    ),
    recent_score: recentTest.score,
    best_percentage: bestPercentage,
    average_percentage: averagePercentage,
    recent_percentage: Math.round(
      (recentTest.score / recentTest.total_marks) * 100
    ),
    recent_tests: sorted.slice(0, 5),
    full_mock_count: fullMocks.length,
last5_full_mock_average: last5FullMockAverage,
confidence,
  };
}

/**
 * Calculate readiness score (0-100)
 * Based on weighted chapter completion, PYQ coverage, and mock test performance
 */
export function calculateReadinessScore(
  progress: OverallProgress,
  mockStats: MockTestStats
): number {
  const weightedCompletionScore = progress.weighted_completion;
  const pyqScore = progress.pyq_percent;
  const mockScore = mockStats.total_tests > 0 ? mockStats.average_percentage : 0;

  const readinessScore = Math.round(
    weightedCompletionScore * READINESS_WEIGHTS.weighted_completion +
    pyqScore * READINESS_WEIGHTS.pyq_completion +
    mockScore * READINESS_WEIGHTS.mock_test_performance
  );

  return Math.min(100, Math.max(0, readinessScore));
}
export function calculateRevisionHealth(
  chapters: Chapter[],
  revisions: ChapterRevision[],
  progressMap: Map<string, ChapterProgress>
): number {
  if (chapters.length === 0) return 0;

  const today = new Date();

  const chapterScores = chapters.map((chapter) => {
    const completedRevisions = revisions
  .filter(
    (r) =>
      r.chapter_id === chapter.id &&
      r.completed &&
      r.completed_at
  )
  .sort(
    (a, b) =>
      new Date(b.completed_at!).getTime() -
      new Date(a.completed_at!).getTime()
  );

const progress = progressMap.get(chapter.id);

const manualRevisionDate = progress?.last_revision_date
  ? new Date(progress.last_revision_date)
  : null;

const revisionCompletedDate =
  completedRevisions.length > 0
    ? new Date(completedRevisions[0].completed_at!)
    : null;

const lastRevisionDate =
  manualRevisionDate && revisionCompletedDate
    ? manualRevisionDate > revisionCompletedDate
      ? manualRevisionDate
      : revisionCompletedDate
    : manualRevisionDate || revisionCompletedDate;

if (!lastRevisionDate) {
  return 0;
}

    const daysSinceRevision = Math.floor(
      (today.getTime() - lastRevisionDate.getTime()) /
        (1000 * 60 * 60 * 24)
    );

    if (daysSinceRevision <= 7) return 100;
    if (daysSinceRevision <= 14) return 90;
    if (daysSinceRevision <= 30) return 75;
    if (daysSinceRevision <= 60) return 50;
    if (daysSinceRevision <= 90) return 25;

    return 0;
  });

  return Math.round(
  chapterScores.reduce(
    (sum: number, score: number) => sum + score,
    0
  ) / chapterScores.length
);
}

/**
 * Format percentage for display
 */
export function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}

/**
 * Get color class based on percentage
 */
export function getProgressColor(percent: number): string {
  if (percent >= 75) return "text-emerald-400";
  if (percent >= 50) return "text-blue-400";
  if (percent >= 25) return "text-amber-400";
  return "text-red-400";
}

export function getProgressBarColor(percent: number): string {
  if (percent >= 75) return "bg-emerald-500";
  if (percent >= 50) return "bg-blue-500";
  if (percent >= 25) return "bg-amber-500";
  return "bg-red-500";
}
