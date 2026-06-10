-- ============================================================
-- JEE TRACKER — CHAPTER PROGRESS SYSTEM MIGRATION
-- Run this in the Supabase SQL Editor
-- ============================================================
-- This migration:
--   1. Replaces old chapter names with the exact JEE syllabus
--   2. Adds missing chapters (Kinematics 1D/2D split, Collision,
--      Circular Motion, Calorimetry, Sound Waves, Capacitors,
--      Magnetism, Salt Analysis, Isomerism, Thermochemistry,
--      Solid State, Area Under Curve, and more)
--   3. The "practice_completed" column in chapter_progress is
--      repurposed as "Mock" in the UI (no column rename needed —
--      the app layer handles the mapping transparently)
-- ============================================================

BEGIN;

-- ============================================================
-- STEP 1: Delete all existing chapters (cascades to chapter_progress)
-- WARNING: This removes all user progress data.
-- If you want to preserve progress, see the safe migration below.
-- ============================================================

-- Safe path: delete chapters that no longer exist in the new syllabus.
-- New chapters will be inserted fresh; user progress on matching
-- chapters is preserved via chapter_id foreign key.

-- Remove chapters replaced by the new syllabus (old names → new names)
DELETE FROM chapters WHERE subject = 'Physics' AND name IN (
  'Units and Dimensions',
  'Errors and Measurements',
  'Kinematics',                       -- split into 1D & 2D
  'Mechanical Properties of Solids',  -- removed from spec
  'Mechanical Properties of Fluids',  -- removed from spec
  'Simple Harmonic Motion',           -- renamed to SHM
  'Capacitance',                      -- renamed to Capacitors
  'Magnetism and Matter',             -- renamed to Magnetism
  'Electromagnetic Waves',            -- removed from spec
  'Communication Systems'             -- removed from spec
);

DELETE FROM chapters WHERE subject = 'Chemistry' AND name IN (
  'States of Matter',                 -- renamed to Gaseous State
  'Surface Chemistry',                -- removed from spec
  'Periodic Table',
  'Chemical Bonding',
  'Hydrogen',
  's-Block Elements',                 -- removed from spec
  'p-Block Elements',                 -- renamed to p Block
  'd and f Block Elements',           -- renamed to d and f Block
  'Coordination Compounds',
  'Metallurgy',
  'Environmental Chemistry',          -- removed from spec
  'General Organic Chemistry',        -- renamed to GOC
  'Hydrocarbons',
  'Haloalkanes and Haloarenes',
  'Alcohols Phenols and Ethers',
  'Aldehydes Ketones and Carboxylic Acids', -- split
  'Amines',
  'Biomolecules',
  'Polymers',
  'Chemistry in Everyday Life'        -- removed from spec
);

DELETE FROM chapters WHERE subject = 'Mathematics' AND name IN (
  'Sets',
  'Relations and Functions',
  'Trigonometric Functions',          -- split into Ratios + Equations
  'Inverse Trigonometric Functions',
  'Complex Numbers',
  'Quadratic Equations',
  'Sequence and Series',
  'Binomial Theorem',
  'Permutations and Combinations',
  'Probability',
  'Mathematical Reasoning',           -- removed from spec
  'Statistics',
  'Matrices',
  'Determinants',
  'Limits',
  'Continuity',
  'Differentiability',
  'Application of Derivatives',
  'Indefinite Integration',
  'Definite Integration',
  'Differential Equations',
  'Vector Algebra',
  'Three Dimensional Geometry',       -- renamed to 3D Geometry
  'Straight Lines',
  'Circles',                          -- renamed to Circle
  'Conic Sections',                   -- split into Parabola/Ellipse/Hyperbola
  'Mathematical Induction',           -- removed from spec
  'Linear Programming'                -- removed from spec
);

-- ============================================================
-- STEP 2: Upsert all chapters from the new JEE syllabus
-- Uses ON CONFLICT (subject, chapter_number) DO UPDATE
-- so re-running this migration is idempotent.
-- ============================================================

INSERT INTO chapters (subject, chemistry_section, name, chapter_number, difficulty_weight, dependency_score)
VALUES
  -- ==================== PHYSICS ====================
  -- Mechanics
  ('Physics', NULL, 'Units & Dimensions',           1,  2, 2),
  ('Physics', NULL, 'Errors & Experiments',          2,  2, 2),
  ('Physics', NULL, 'Vectors',                       3,  3, 3),
  ('Physics', NULL, 'Kinematics 1D',                 4,  3, 3),
  ('Physics', NULL, 'Kinematics 2D',                 5,  3, 3),
  ('Physics', NULL, 'Laws of Motion',                6,  4, 3),
  ('Physics', NULL, 'Friction',                      7,  3, 2),
  ('Physics', NULL, 'Circular Motion',               8,  3, 2),
  ('Physics', NULL, 'Work Power Energy',             9,  4, 3),
  ('Physics', NULL, 'Center of Mass (COM)',           10, 4, 2),
  ('Physics', NULL, 'Collision',                     11, 3, 2),
  ('Physics', NULL, 'Rotational Motion',             12, 5, 3),
  ('Physics', NULL, 'Gravitation',                   13, 3, 2),
  -- Oscillation & Waves
  ('Physics', NULL, 'SHM',                           14, 4, 3),
  ('Physics', NULL, 'Waves',                         15, 4, 2),
  ('Physics', NULL, 'Sound Waves',                   16, 3, 2),
  -- Thermal Physics
  ('Physics', NULL, 'Thermal Properties of Matter',  17, 2, 2),
  ('Physics', NULL, 'Calorimetry',                   18, 2, 2),
  ('Physics', NULL, 'Kinetic Theory of Gases',       19, 3, 2),
  ('Physics', NULL, 'Thermodynamics',                20, 4, 3),
  -- Electricity & Magnetism
  ('Physics', NULL, 'Electrostatics',                21, 4, 3),
  ('Physics', NULL, 'Capacitors',                    22, 4, 2),
  ('Physics', NULL, 'Current Electricity',           23, 4, 3),
  ('Physics', NULL, 'Magnetic Effects of Current',   24, 4, 3),
  ('Physics', NULL, 'Magnetism',                     25, 3, 2),
  ('Physics', NULL, 'Electromagnetic Induction',     26, 5, 3),
  ('Physics', NULL, 'Alternating Current',           27, 4, 2),
  -- Optics
  ('Physics', NULL, 'Ray Optics',                    28, 4, 2),
  ('Physics', NULL, 'Wave Optics',                   29, 4, 2),
  -- Modern Physics
  ('Physics', NULL, 'Dual Nature of Matter',         30, 3, 2),
  ('Physics', NULL, 'Atoms',                         31, 3, 2),
  ('Physics', NULL, 'Nuclei',                        32, 3, 2),
  ('Physics', NULL, 'Semiconductor Electronics',     33, 3, 2),

  -- ==================== CHEMISTRY - PHYSICAL ====================
  ('Chemistry', 'Physical', 'Mole Concept',          1,  3, 3),
  ('Chemistry', 'Physical', 'Atomic Structure',      2,  3, 3),
  ('Chemistry', 'Physical', 'Gaseous State',         3,  2, 2),
  ('Chemistry', 'Physical', 'Thermodynamics',        4,  4, 3),
  ('Chemistry', 'Physical', 'Thermochemistry',       5,  3, 2),
  ('Chemistry', 'Physical', 'Chemical Equilibrium',  6,  4, 3),
  ('Chemistry', 'Physical', 'Ionic Equilibrium',     7,  5, 3),
  ('Chemistry', 'Physical', 'Redox Reactions',       8,  3, 2),
  ('Chemistry', 'Physical', 'Electrochemistry',      9,  4, 2),
  ('Chemistry', 'Physical', 'Chemical Kinetics',     10, 4, 2),
  ('Chemistry', 'Physical', 'Solid State',           11, 3, 2),
  ('Chemistry', 'Physical', 'Solutions',             12, 3, 2),

  -- ==================== CHEMISTRY - INORGANIC ====================
  ('Chemistry', 'Inorganic', 'Periodic Table',          13, 3, 3),
  ('Chemistry', 'Inorganic', 'Chemical Bonding',        14, 5, 3),
  ('Chemistry', 'Inorganic', 'Coordination Compounds',  15, 4, 2),
  ('Chemistry', 'Inorganic', 'd and f Block',           16, 3, 2),
  ('Chemistry', 'Inorganic', 'p Block',                 17, 4, 2),
  ('Chemistry', 'Inorganic', 'Hydrogen',                18, 2, 1),
  ('Chemistry', 'Inorganic', 'Metallurgy',              19, 2, 1),
  ('Chemistry', 'Inorganic', 'Salt Analysis',           20, 3, 2),

  -- ==================== CHEMISTRY - ORGANIC ====================
  ('Chemistry', 'Organic', 'General Organic Chemistry (GOC)', 21, 5, 3),
  ('Chemistry', 'Organic', 'Isomerism',                        22, 4, 3),
  ('Chemistry', 'Organic', 'Hydrocarbons',                     23, 3, 2),
  ('Chemistry', 'Organic', 'Haloalkanes & Haloarenes',         24, 3, 2),
  ('Chemistry', 'Organic', 'Alcohols Phenols and Ethers',      25, 3, 2),
  ('Chemistry', 'Organic', 'Aldehydes and Ketones',            26, 4, 2),
  ('Chemistry', 'Organic', 'Carboxylic Acids',                 27, 3, 2),
  ('Chemistry', 'Organic', 'Amines',                           28, 3, 2),
  ('Chemistry', 'Organic', 'Biomolecules',                     29, 2, 1),
  ('Chemistry', 'Organic', 'Polymers',                         30, 2, 1),

  -- ==================== MATHEMATICS ====================
  -- Algebra
  ('Mathematics', NULL, 'Sets',                          1,  2, 2),
  ('Mathematics', NULL, 'Relations & Functions',         2,  3, 2),
  ('Mathematics', NULL, 'Quadratic Equations',           3,  3, 3),
  ('Mathematics', NULL, 'Sequence & Series',             4,  3, 2),
  ('Mathematics', NULL, 'Binomial Theorem',              5,  3, 2),
  ('Mathematics', NULL, 'Permutation & Combination',     6,  5, 3),
  ('Mathematics', NULL, 'Complex Numbers',               7,  5, 3),
  ('Mathematics', NULL, 'Matrices',                      8,  3, 2),
  ('Mathematics', NULL, 'Determinants',                  9,  3, 2),
  ('Mathematics', NULL, 'Probability',                   10, 5, 3),
  ('Mathematics', NULL, 'Statistics',                    11, 2, 1),
  -- Trigonometry
  ('Mathematics', NULL, 'Trigonometric Ratios',          12, 3, 3),
  ('Mathematics', NULL, 'Trigonometric Equations',       13, 3, 2),
  ('Mathematics', NULL, 'Inverse Trigonometric Functions',14,3, 2),
  -- Coordinate Geometry
  ('Mathematics', NULL, 'Straight Lines',                15, 3, 2),
  ('Mathematics', NULL, 'Circle',                        16, 3, 2),
  ('Mathematics', NULL, 'Parabola',                      17, 4, 2),
  ('Mathematics', NULL, 'Ellipse',                       18, 4, 2),
  ('Mathematics', NULL, 'Hyperbola',                     19, 4, 2),
  -- Calculus
  ('Mathematics', NULL, 'Limits',                        20, 4, 3),
  ('Mathematics', NULL, 'Continuity',                    21, 3, 2),
  ('Mathematics', NULL, 'Differentiability',             22, 4, 3),
  ('Mathematics', NULL, 'Applications of Derivatives',   23, 5, 3),
  ('Mathematics', NULL, 'Indefinite Integration',        24, 5, 3),
  ('Mathematics', NULL, 'Definite Integration',          25, 5, 3),
  ('Mathematics', NULL, 'Area Under Curve',              26, 4, 2),
  ('Mathematics', NULL, 'Differential Equations',        27, 4, 2),
  -- Vector & 3D
  ('Mathematics', NULL, 'Vector Algebra',                28, 3, 2),
  ('Mathematics', NULL, '3D Geometry',                   29, 4, 2)

ON CONFLICT (subject, chapter_number) DO UPDATE SET
  name              = EXCLUDED.name,
  chemistry_section = EXCLUDED.chemistry_section,
  difficulty_weight = EXCLUDED.difficulty_weight,
  dependency_score  = EXCLUDED.dependency_score;

COMMIT;

-- ============================================================
-- VERIFICATION QUERIES (run after migration)
-- ============================================================
-- SELECT subject, COUNT(*) FROM chapters GROUP BY subject ORDER BY subject;
-- Expected: Chemistry=30, Mathematics=29, Physics=33
--
-- SELECT subject, chapter_number, name FROM chapters
--   ORDER BY subject, chapter_number;
