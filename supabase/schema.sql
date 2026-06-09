-- ============================================================
-- JEE TRACKER — COMPLETE SUPABASE SCHEMA
-- Run this in the Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE user_class AS ENUM ('11th', '12th', 'dropper');
CREATE TYPE user_category AS ENUM ('General', 'OBC', 'SC', 'ST', 'EWS', 'PwD');
CREATE TYPE subject_name AS ENUM ('Physics', 'Chemistry', 'Mathematics');
CREATE TYPE chemistry_section AS ENUM ('Physical', 'Inorganic', 'Organic');
CREATE TYPE material_type AS ENUM ('pdf_notes', 'pyq_pdf', 'mock_paper', 'important_link', 'video', 'other');
CREATE TYPE readiness_level AS ENUM ('Beginner', 'Intermediate', 'Advanced', 'Exam Ready');

-- ============================================================
-- TABLES
-- ============================================================

-- User Profiles (extends Supabase auth.users)
CREATE TABLE user_profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT NOT NULL,
  full_name     TEXT NOT NULL,
  target_year   INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM NOW()) + 1,
  class         user_class NOT NULL DEFAULT '12th',
  category      user_category NOT NULL DEFAULT 'General',
  target_college TEXT NOT NULL DEFAULT '',
  is_admin      BOOLEAN NOT NULL DEFAULT FALSE,
  -- Future-ready fields
  avatar_url    TEXT,
  phone         TEXT,
  city          TEXT,
  bio           TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Chapters (seeded once, global for all users)
CREATE TABLE chapters (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject            subject_name NOT NULL,
  chemistry_section  chemistry_section,  -- only for Chemistry
  name               TEXT NOT NULL,
  chapter_number     INTEGER NOT NULL,
  difficulty_weight  INTEGER NOT NULL CHECK (difficulty_weight BETWEEN 1 AND 5),
  dependency_score   INTEGER NOT NULL CHECK (dependency_score BETWEEN 1 AND 3),
  importance_score   INTEGER GENERATED ALWAYS AS (difficulty_weight * dependency_score) STORED,
  -- Future-ready fields
  description        TEXT,
  estimated_hours    INTEGER,
  video_url          TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (subject, chapter_number)
);

-- Chapter Progress (per user, per chapter)
CREATE TABLE chapter_progress (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id              UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  chapter_id           UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  theory_completed     BOOLEAN NOT NULL DEFAULT FALSE,
  module_completed     BOOLEAN NOT NULL DEFAULT FALSE,
  practice_completed   BOOLEAN NOT NULL DEFAULT FALSE,
  pyq_completed        BOOLEAN NOT NULL DEFAULT FALSE,
  -- Future-ready fields (V2+)
  revision_count       INTEGER NOT NULL DEFAULT 0,
  last_revision_date   DATE,
  confidence_score     INTEGER CHECK (confidence_score BETWEEN 1 AND 5),
  notes                TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, chapter_id)
);

-- Mock Tests
CREATE TABLE mock_tests (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  test_name        TEXT NOT NULL,
  test_date        DATE NOT NULL,
  marks_obtained   NUMERIC(7,2) NOT NULL,
  maximum_marks    NUMERIC(7,2) NOT NULL CHECK (maximum_marks > 0),
  percentage       NUMERIC(5,2) GENERATED ALWAYS AS (ROUND((marks_obtained / maximum_marks) * 100, 2)) STORED,
  -- Future-ready fields (V2+)
  test_type        TEXT,  -- 'Full Length', 'Subject', 'Chapter'
  subject          subject_name,
  physics_marks    NUMERIC(7,2),
  chemistry_marks  NUMERIC(7,2),
  mathematics_marks NUMERIC(7,2),
  time_taken_minutes INTEGER,
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Materials (admin-uploaded)
CREATE TABLE materials (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title            TEXT NOT NULL,
  description      TEXT,
  subject          subject_name,    -- null = all subjects
  material_type    material_type NOT NULL DEFAULT 'pdf_notes',
  file_url         TEXT,
  external_url     TEXT,
  file_size_bytes  BIGINT,
  uploaded_by      UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  is_active        BOOLEAN NOT NULL DEFAULT TRUE,
  -- Future-ready fields (V2+)
  chapter_id       UUID REFERENCES chapters(id) ON DELETE SET NULL,
  tags             TEXT[],
  view_count       INTEGER NOT NULL DEFAULT 0,
  download_count   INTEGER NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Readiness Scores (cached calculation)
CREATE TABLE readiness_scores (
  id                        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                   UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  overall_score             NUMERIC(5,2) NOT NULL DEFAULT 0,
  weighted_completion_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  weighted_pyq_score        NUMERIC(5,2) NOT NULL DEFAULT 0,
  weighted_practice_score   NUMERIC(5,2) NOT NULL DEFAULT 0,
  mock_test_score           NUMERIC(5,2) NOT NULL DEFAULT 0,
  readiness_level           readiness_level NOT NULL DEFAULT 'Beginner',
  -- Subject breakdown
  physics_score             NUMERIC(5,2) NOT NULL DEFAULT 0,
  chemistry_score           NUMERIC(5,2) NOT NULL DEFAULT 0,
  mathematics_score         NUMERIC(5,2) NOT NULL DEFAULT 0,
  -- Future-ready fields (V2+ percentile predictor)
  predicted_rank_min        INTEGER,
  predicted_rank_max        INTEGER,
  predicted_percentile      NUMERIC(5,2),
  calculated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_chapter_progress_user_id ON chapter_progress(user_id);
CREATE INDEX idx_chapter_progress_chapter_id ON chapter_progress(chapter_id);
CREATE INDEX idx_chapter_progress_user_chapter ON chapter_progress(user_id, chapter_id);

CREATE INDEX idx_chapters_subject ON chapters(subject);
CREATE INDEX idx_chapters_section ON chapters(chemistry_section);
CREATE INDEX idx_chapters_importance ON chapters(importance_score DESC);

CREATE INDEX idx_mock_tests_user_id ON mock_tests(user_id);
CREATE INDEX idx_mock_tests_user_date ON mock_tests(user_id, test_date DESC);
CREATE INDEX idx_mock_tests_percentage ON mock_tests(user_id, percentage DESC);

CREATE INDEX idx_materials_subject ON materials(subject);
CREATE INDEX idx_materials_type ON materials(material_type);
CREATE INDEX idx_materials_active ON materials(is_active) WHERE is_active = TRUE;

CREATE INDEX idx_readiness_user_id ON readiness_scores(user_id);
CREATE INDEX idx_readiness_calculated ON readiness_scores(user_id, calculated_at DESC);

CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_user_profiles_admin ON user_profiles(is_admin) WHERE is_admin = TRUE;

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chapter_progress_updated_at
  BEFORE UPDATE ON chapter_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mock_tests_updated_at
  BEFORE UPDATE ON mock_tests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_materials_updated_at
  BEFORE UPDATE ON materials
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapter_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE mock_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE readiness_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;

-- user_profiles policies
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON user_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- chapters policies (read-only for all authenticated users)
CREATE POLICY "Authenticated users can view chapters"
  ON chapters FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage chapters"
  ON chapters FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- chapter_progress policies
CREATE POLICY "Users can view own progress"
  ON chapter_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress"
  ON chapter_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
  ON chapter_progress FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own progress"
  ON chapter_progress FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all progress"
  ON chapter_progress FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- mock_tests policies
CREATE POLICY "Users can view own tests"
  ON mock_tests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tests"
  ON mock_tests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tests"
  ON mock_tests FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tests"
  ON mock_tests FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all tests"
  ON mock_tests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- materials policies
CREATE POLICY "Authenticated users can view active materials"
  ON materials FOR SELECT
  USING (auth.role() = 'authenticated' AND is_active = TRUE);

CREATE POLICY "Admins can manage materials"
  ON materials FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- readiness_scores policies
CREATE POLICY "Users can view own readiness"
  ON readiness_scores FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own readiness"
  ON readiness_scores FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own readiness"
  ON readiness_scores FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================================
-- SEED: CHAPTER DATA
-- ============================================================

INSERT INTO chapters (subject, chemistry_section, name, chapter_number, difficulty_weight, dependency_score) VALUES
-- PHYSICS
('Physics', NULL, 'Units and Dimensions',              1,  2, 2),
('Physics', NULL, 'Errors and Measurements',           2,  2, 2),
('Physics', NULL, 'Vectors',                           3,  3, 3),
('Physics', NULL, 'Kinematics',                        4,  3, 3),
('Physics', NULL, 'Laws of Motion',                    5,  4, 3),
('Physics', NULL, 'Friction',                          6,  3, 2),
('Physics', NULL, 'Work Power Energy',                 7,  4, 3),
('Physics', NULL, 'Centre of Mass',                    8,  4, 2),
('Physics', NULL, 'Rotational Motion',                 9,  5, 3),
('Physics', NULL, 'Gravitation',                       10, 3, 2),
('Physics', NULL, 'Mechanical Properties of Solids',   11, 2, 1),
('Physics', NULL, 'Mechanical Properties of Fluids',   12, 3, 2),
('Physics', NULL, 'Simple Harmonic Motion',            13, 4, 3),
('Physics', NULL, 'Waves',                             14, 4, 2),
('Physics', NULL, 'Thermal Properties of Matter',      15, 2, 2),
('Physics', NULL, 'Thermodynamics',                    16, 4, 3),
('Physics', NULL, 'Kinetic Theory of Gases',           17, 3, 2),
('Physics', NULL, 'Electrostatics',                    18, 4, 3),
('Physics', NULL, 'Capacitance',                       19, 4, 2),
('Physics', NULL, 'Current Electricity',               20, 4, 3),
('Physics', NULL, 'Magnetic Effects of Current',       21, 4, 3),
('Physics', NULL, 'Magnetism and Matter',              22, 3, 2),
('Physics', NULL, 'Electromagnetic Induction',         23, 5, 3),
('Physics', NULL, 'Alternating Current',               24, 4, 2),
('Physics', NULL, 'Electromagnetic Waves',             25, 2, 1),
('Physics', NULL, 'Ray Optics',                        26, 4, 2),
('Physics', NULL, 'Wave Optics',                       27, 4, 2),
('Physics', NULL, 'Dual Nature of Matter',             28, 3, 2),
('Physics', NULL, 'Atoms',                             29, 3, 2),
('Physics', NULL, 'Nuclei',                            30, 3, 2),
('Physics', NULL, 'Semiconductor Electronics',         31, 3, 2),
('Physics', NULL, 'Communication Systems',             32, 2, 1),

-- CHEMISTRY - PHYSICAL
('Chemistry', 'Physical', 'Mole Concept',              1,  3, 3),
('Chemistry', 'Physical', 'Atomic Structure',          2,  3, 3),
('Chemistry', 'Physical', 'States of Matter',          3,  2, 2),
('Chemistry', 'Physical', 'Thermodynamics',            4,  4, 3),
('Chemistry', 'Physical', 'Chemical Equilibrium',      5,  4, 3),
('Chemistry', 'Physical', 'Ionic Equilibrium',         6,  5, 3),
('Chemistry', 'Physical', 'Redox Reactions',           7,  3, 2),
('Chemistry', 'Physical', 'Electrochemistry',          8,  4, 2),
('Chemistry', 'Physical', 'Chemical Kinetics',         9,  4, 2),
('Chemistry', 'Physical', 'Solutions',                 10, 3, 2),
('Chemistry', 'Physical', 'Surface Chemistry',         11, 2, 1),

-- CHEMISTRY - INORGANIC
('Chemistry', 'Inorganic', 'Periodic Table',           12, 3, 3),
('Chemistry', 'Inorganic', 'Chemical Bonding',         13, 5, 3),
('Chemistry', 'Inorganic', 'Hydrogen',                 14, 2, 1),
('Chemistry', 'Inorganic', 's-Block Elements',         15, 2, 2),
('Chemistry', 'Inorganic', 'p-Block Elements',         16, 4, 2),
('Chemistry', 'Inorganic', 'd and f Block Elements',   17, 3, 2),
('Chemistry', 'Inorganic', 'Coordination Compounds',   18, 4, 2),
('Chemistry', 'Inorganic', 'Metallurgy',               19, 2, 1),
('Chemistry', 'Inorganic', 'Environmental Chemistry',  20, 1, 1),

-- CHEMISTRY - ORGANIC
('Chemistry', 'Organic', 'General Organic Chemistry',              21, 5, 3),
('Chemistry', 'Organic', 'Hydrocarbons',                           22, 3, 2),
('Chemistry', 'Organic', 'Haloalkanes and Haloarenes',             23, 3, 2),
('Chemistry', 'Organic', 'Alcohols Phenols and Ethers',            24, 3, 2),
('Chemistry', 'Organic', 'Aldehydes Ketones and Carboxylic Acids', 25, 4, 2),
('Chemistry', 'Organic', 'Amines',                                 26, 3, 2),
('Chemistry', 'Organic', 'Biomolecules',                           27, 2, 1),
('Chemistry', 'Organic', 'Polymers',                               28, 2, 1),
('Chemistry', 'Organic', 'Chemistry in Everyday Life',             29, 1, 1),

-- MATHEMATICS
('Mathematics', NULL, 'Sets',                          1,  2, 2),
('Mathematics', NULL, 'Relations and Functions',       2,  3, 2),
('Mathematics', NULL, 'Trigonometric Functions',       3,  3, 3),
('Mathematics', NULL, 'Inverse Trigonometric Functions', 4, 3, 2),
('Mathematics', NULL, 'Complex Numbers',               5,  5, 3),
('Mathematics', NULL, 'Quadratic Equations',           6,  3, 3),
('Mathematics', NULL, 'Sequence and Series',           7,  3, 2),
('Mathematics', NULL, 'Binomial Theorem',              8,  3, 2),
('Mathematics', NULL, 'Permutations and Combinations', 9,  5, 3),
('Mathematics', NULL, 'Probability',                   10, 5, 3),
('Mathematics', NULL, 'Mathematical Reasoning',        11, 1, 1),
('Mathematics', NULL, 'Statistics',                    12, 2, 1),
('Mathematics', NULL, 'Matrices',                      13, 3, 2),
('Mathematics', NULL, 'Determinants',                  14, 3, 2),
('Mathematics', NULL, 'Limits',                        15, 4, 3),
('Mathematics', NULL, 'Continuity',                    16, 3, 2),
('Mathematics', NULL, 'Differentiability',             17, 4, 3),
('Mathematics', NULL, 'Application of Derivatives',    18, 5, 3),
('Mathematics', NULL, 'Indefinite Integration',        19, 5, 3),
('Mathematics', NULL, 'Definite Integration',          20, 5, 3),
('Mathematics', NULL, 'Differential Equations',        21, 4, 2),
('Mathematics', NULL, 'Vector Algebra',                22, 3, 2),
('Mathematics', NULL, 'Three Dimensional Geometry',    23, 4, 2),
('Mathematics', NULL, 'Straight Lines',                24, 3, 2),
('Mathematics', NULL, 'Circles',                       25, 3, 2),
('Mathematics', NULL, 'Conic Sections',                26, 4, 2),
('Mathematics', NULL, 'Mathematical Induction',        27, 2, 1),
('Mathematics', NULL, 'Linear Programming',            28, 2, 1);

-- ============================================================
-- FUNCTION: auto-create profile on signup
-- ============================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
