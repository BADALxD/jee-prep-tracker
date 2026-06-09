// Database types matching Supabase schema

export type UserClass = "11th" | "12th" | "dropper";
export type UserCategory = "General" | "OBC" | "SC" | "ST" | "EWS" | "PwD";
export type SubjectName = "Physics" | "Chemistry" | "Mathematics";
export type ChemistrySection = "Physical" | "Inorganic" | "Organic";
export type ReadinessLevel = "Beginner" | "Intermediate" | "Advanced" | "Exam Ready";

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  target_year: number;
  class: UserClass;
  category: UserCategory;
  target_college: string;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

export interface Chapter {
  id: string;
  subject: SubjectName;
  chemistry_section: ChemistrySection | null;
  name: string;
  chapter_number: number;
  difficulty_weight: number; // 1-5
  dependency_score: number; // 1-3
  importance_score: number; // difficulty_weight * dependency_score
  created_at: string;
}

export interface ChapterProgress {
  id: string;
  user_id: string;
  chapter_id: string;
  theory_completed: boolean;
  module_completed: boolean;
  practice_completed: boolean;
  pyq_completed: boolean;
  // Future-ready fields
  revision_count: number;
  last_revision_date: string | null;
  confidence_score: number | null; // 1-5
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  chapter?: Chapter;
}

export interface MockTest {
  id: string;
  user_id: string;

  subject: string;
  score: number;
  total_marks: number;
  test_date: string;

  created_at: string;
}

export interface Material {
  id: string;
  title: string;
  description: string | null;
  subject: SubjectName | null;
  material_type: "pdf_notes" | "pyq_pdf" | "mock_paper" | "important_link" | "video" | "other";
  file_url: string | null;
  external_url: string | null;
  file_size_bytes: number | null;
  uploaded_by: string;
  is_active: boolean;
  // Future-ready fields
  chapter_id: string | null;
  tags: string[] | null;
  view_count: number;
  download_count: number;
  created_at: string;
  updated_at: string;
}

export interface ReadinessScore {
  id: string;
  user_id: string;
  overall_score: number; // 0-100
  weighted_completion_score: number;
  weighted_pyq_score: number;
  weighted_practice_score: number;
  mock_test_score: number;
  readiness_level: ReadinessLevel;
  // Breakdown
  physics_score: number;
  chemistry_score: number;
  mathematics_score: number;
  // Future-ready fields
  predicted_rank_min: number | null;
  predicted_rank_max: number | null;
  predicted_percentile: number | null;
  calculated_at: string;
  created_at: string;
}

// Computed/derived types

export interface SubjectProgress {
  subject: SubjectName;
  theory_percent: number;
  module_percent: number;
  practice_percent: number;
  pyq_percent: number;
  overall_percent: number;
  weighted_completion: number;
  total_chapters: number;
  completed_chapters: number;
  weakest_chapters: ChapterWithProgress[];
  strongest_chapters: ChapterWithProgress[];
}

export interface ChapterWithProgress extends Chapter {
  progress: ChapterProgress | null;
  completion_percent: number;
  weighted_score: number;
}

export interface OverallProgress {
  theory_percent: number;
  module_percent: number;
  practice_percent: number;
  pyq_percent: number;
  overall_percent: number;
  weighted_completion: number;
  physics: SubjectProgress;
  chemistry: SubjectProgress;
  mathematics: SubjectProgress;
  weakest_chapters: ChapterWithProgress[];
  strongest_chapters: ChapterWithProgress[];
}

export interface MockTestStats {
  total_tests: number;
  best_score: number;
  average_score: number;
  recent_score: number;
  best_percentage: number;
  average_percentage: number;
  recent_percentage: number;
  recent_tests: MockTest[];
}

export interface DashboardData {
  user: UserProfile;
  progress: OverallProgress;
  readiness: ReadinessScore | null;
  mock_stats: MockTestStats;
}

// Store types for Zustand
export interface AppStore {
  user: UserProfile | null;
  isLoading: boolean;
  setUser: (user: UserProfile | null) => void;
  setLoading: (loading: boolean) => void;
}
