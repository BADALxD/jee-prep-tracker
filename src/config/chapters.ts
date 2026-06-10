import type { SubjectName, ChemistrySection } from "@/types";

interface ChapterSeed {
  subject: SubjectName;
  chemistry_section: ChemistrySection | null;
  name: string;
  chapter_number: number;
  difficulty_weight: number; // 1-5
  dependency_score: number; // 1-3
}

/**
 * Master chapter list matching the JEE syllabus exactly.
 * Chapter numbers are per-subject (Physics: 1-32, Chemistry: 1-29, Mathematics: 1-28).
 *
 * DB note: The Supabase chapters table has a UNIQUE(subject, chapter_number) constraint.
 * If the DB has older chapter names, run the migration in supabase/migrations/ to update them.
 */
export const CHAPTERS_DATA: ChapterSeed[] = [
  // ==================== PHYSICS ====================
  // Mechanics
  { subject: "Physics", chemistry_section: null, name: "Units & Dimensions",        chapter_number: 1,  difficulty_weight: 2, dependency_score: 2 },
  { subject: "Physics", chemistry_section: null, name: "Errors & Experiments",       chapter_number: 2,  difficulty_weight: 2, dependency_score: 2 },
  { subject: "Physics", chemistry_section: null, name: "Vectors",                    chapter_number: 3,  difficulty_weight: 3, dependency_score: 3 },
  { subject: "Physics", chemistry_section: null, name: "Kinematics 1D",              chapter_number: 4,  difficulty_weight: 3, dependency_score: 3 },
  { subject: "Physics", chemistry_section: null, name: "Kinematics 2D",              chapter_number: 5,  difficulty_weight: 3, dependency_score: 3 },
  { subject: "Physics", chemistry_section: null, name: "Laws of Motion",             chapter_number: 6,  difficulty_weight: 4, dependency_score: 3 },
  { subject: "Physics", chemistry_section: null, name: "Friction",                   chapter_number: 7,  difficulty_weight: 3, dependency_score: 2 },
  { subject: "Physics", chemistry_section: null, name: "Circular Motion",            chapter_number: 8,  difficulty_weight: 3, dependency_score: 2 },
  { subject: "Physics", chemistry_section: null, name: "Work Power Energy",          chapter_number: 9,  difficulty_weight: 4, dependency_score: 3 },
  { subject: "Physics", chemistry_section: null, name: "Center of Mass (COM)",       chapter_number: 10, difficulty_weight: 4, dependency_score: 2 },
  { subject: "Physics", chemistry_section: null, name: "Collision",                  chapter_number: 11, difficulty_weight: 3, dependency_score: 2 },
  { subject: "Physics", chemistry_section: null, name: "Rotational Motion",          chapter_number: 12, difficulty_weight: 5, dependency_score: 3 },
  { subject: "Physics", chemistry_section: null, name: "Gravitation",                chapter_number: 13, difficulty_weight: 3, dependency_score: 2 },
  // Oscillation & Waves
  { subject: "Physics", chemistry_section: null, name: "SHM",                        chapter_number: 14, difficulty_weight: 4, dependency_score: 3 },
  { subject: "Physics", chemistry_section: null, name: "Waves",                      chapter_number: 15, difficulty_weight: 4, dependency_score: 2 },
  { subject: "Physics", chemistry_section: null, name: "Sound Waves",                chapter_number: 16, difficulty_weight: 3, dependency_score: 2 },
  // Thermal Physics
  { subject: "Physics", chemistry_section: null, name: "Thermal Properties of Matter", chapter_number: 17, difficulty_weight: 2, dependency_score: 2 },
  { subject: "Physics", chemistry_section: null, name: "Calorimetry",                chapter_number: 18, difficulty_weight: 2, dependency_score: 2 },
  { subject: "Physics", chemistry_section: null, name: "Kinetic Theory of Gases",    chapter_number: 19, difficulty_weight: 3, dependency_score: 2 },
  { subject: "Physics", chemistry_section: null, name: "Thermodynamics",             chapter_number: 20, difficulty_weight: 4, dependency_score: 3 },
  // Electricity & Magnetism
  { subject: "Physics", chemistry_section: null, name: "Electrostatics",             chapter_number: 21, difficulty_weight: 4, dependency_score: 3 },
  { subject: "Physics", chemistry_section: null, name: "Capacitors",                 chapter_number: 22, difficulty_weight: 4, dependency_score: 2 },
  { subject: "Physics", chemistry_section: null, name: "Current Electricity",        chapter_number: 23, difficulty_weight: 4, dependency_score: 3 },
  { subject: "Physics", chemistry_section: null, name: "Magnetic Effects of Current",chapter_number: 24, difficulty_weight: 4, dependency_score: 3 },
  { subject: "Physics", chemistry_section: null, name: "Magnetism",                  chapter_number: 25, difficulty_weight: 3, dependency_score: 2 },
  { subject: "Physics", chemistry_section: null, name: "Electromagnetic Induction",  chapter_number: 26, difficulty_weight: 5, dependency_score: 3 },
  { subject: "Physics", chemistry_section: null, name: "Alternating Current",        chapter_number: 27, difficulty_weight: 4, dependency_score: 2 },
  // Optics
  { subject: "Physics", chemistry_section: null, name: "Ray Optics",                 chapter_number: 28, difficulty_weight: 4, dependency_score: 2 },
  { subject: "Physics", chemistry_section: null, name: "Wave Optics",                chapter_number: 29, difficulty_weight: 4, dependency_score: 2 },
  // Modern Physics
  { subject: "Physics", chemistry_section: null, name: "Dual Nature of Matter",      chapter_number: 30, difficulty_weight: 3, dependency_score: 2 },
  { subject: "Physics", chemistry_section: null, name: "Atoms",                      chapter_number: 31, difficulty_weight: 3, dependency_score: 2 },
  { subject: "Physics", chemistry_section: null, name: "Nuclei",                     chapter_number: 32, difficulty_weight: 3, dependency_score: 2 },
  { subject: "Physics", chemistry_section: null, name: "Semiconductor Electronics",  chapter_number: 33, difficulty_weight: 3, dependency_score: 2 },

  // ==================== CHEMISTRY - PHYSICAL ====================
  { subject: "Chemistry", chemistry_section: "Physical", name: "Mole Concept",          chapter_number: 1,  difficulty_weight: 3, dependency_score: 3 },
  { subject: "Chemistry", chemistry_section: "Physical", name: "Atomic Structure",       chapter_number: 2,  difficulty_weight: 3, dependency_score: 3 },
  { subject: "Chemistry", chemistry_section: "Physical", name: "Gaseous State",          chapter_number: 3,  difficulty_weight: 2, dependency_score: 2 },
  { subject: "Chemistry", chemistry_section: "Physical", name: "Thermodynamics",         chapter_number: 4,  difficulty_weight: 4, dependency_score: 3 },
  { subject: "Chemistry", chemistry_section: "Physical", name: "Thermochemistry",        chapter_number: 5,  difficulty_weight: 3, dependency_score: 2 },
  { subject: "Chemistry", chemistry_section: "Physical", name: "Chemical Equilibrium",   chapter_number: 6,  difficulty_weight: 4, dependency_score: 3 },
  { subject: "Chemistry", chemistry_section: "Physical", name: "Ionic Equilibrium",      chapter_number: 7,  difficulty_weight: 5, dependency_score: 3 },
  { subject: "Chemistry", chemistry_section: "Physical", name: "Redox Reactions",        chapter_number: 8,  difficulty_weight: 3, dependency_score: 2 },
  { subject: "Chemistry", chemistry_section: "Physical", name: "Electrochemistry",       chapter_number: 9,  difficulty_weight: 4, dependency_score: 2 },
  { subject: "Chemistry", chemistry_section: "Physical", name: "Chemical Kinetics",      chapter_number: 10, difficulty_weight: 4, dependency_score: 2 },
  { subject: "Chemistry", chemistry_section: "Physical", name: "Solid State",            chapter_number: 11, difficulty_weight: 3, dependency_score: 2 },
  { subject: "Chemistry", chemistry_section: "Physical", name: "Solutions",              chapter_number: 12, difficulty_weight: 3, dependency_score: 2 },

  // ==================== CHEMISTRY - INORGANIC ====================
  { subject: "Chemistry", chemistry_section: "Inorganic", name: "Periodic Table",          chapter_number: 13, difficulty_weight: 3, dependency_score: 3 },
  { subject: "Chemistry", chemistry_section: "Inorganic", name: "Chemical Bonding",        chapter_number: 14, difficulty_weight: 5, dependency_score: 3 },
  { subject: "Chemistry", chemistry_section: "Inorganic", name: "Coordination Compounds",  chapter_number: 15, difficulty_weight: 4, dependency_score: 2 },
  { subject: "Chemistry", chemistry_section: "Inorganic", name: "d and f Block",           chapter_number: 16, difficulty_weight: 3, dependency_score: 2 },
  { subject: "Chemistry", chemistry_section: "Inorganic", name: "p Block",                 chapter_number: 17, difficulty_weight: 4, dependency_score: 2 },
  { subject: "Chemistry", chemistry_section: "Inorganic", name: "Hydrogen",                chapter_number: 18, difficulty_weight: 2, dependency_score: 1 },
  { subject: "Chemistry", chemistry_section: "Inorganic", name: "Metallurgy",              chapter_number: 19, difficulty_weight: 2, dependency_score: 1 },
  { subject: "Chemistry", chemistry_section: "Inorganic", name: "Salt Analysis",           chapter_number: 20, difficulty_weight: 3, dependency_score: 2 },

  // ==================== CHEMISTRY - ORGANIC ====================
  { subject: "Chemistry", chemistry_section: "Organic", name: "General Organic Chemistry (GOC)", chapter_number: 21, difficulty_weight: 5, dependency_score: 3 },
  { subject: "Chemistry", chemistry_section: "Organic", name: "Isomerism",                        chapter_number: 22, difficulty_weight: 4, dependency_score: 3 },
  { subject: "Chemistry", chemistry_section: "Organic", name: "Hydrocarbons",                     chapter_number: 23, difficulty_weight: 3, dependency_score: 2 },
  { subject: "Chemistry", chemistry_section: "Organic", name: "Haloalkanes & Haloarenes",         chapter_number: 24, difficulty_weight: 3, dependency_score: 2 },
  { subject: "Chemistry", chemistry_section: "Organic", name: "Alcohols Phenols and Ethers",      chapter_number: 25, difficulty_weight: 3, dependency_score: 2 },
  { subject: "Chemistry", chemistry_section: "Organic", name: "Aldehydes and Ketones",            chapter_number: 26, difficulty_weight: 4, dependency_score: 2 },
  { subject: "Chemistry", chemistry_section: "Organic", name: "Carboxylic Acids",                 chapter_number: 27, difficulty_weight: 3, dependency_score: 2 },
  { subject: "Chemistry", chemistry_section: "Organic", name: "Amines",                           chapter_number: 28, difficulty_weight: 3, dependency_score: 2 },
  { subject: "Chemistry", chemistry_section: "Organic", name: "Biomolecules",                     chapter_number: 29, difficulty_weight: 2, dependency_score: 1 },
  { subject: "Chemistry", chemistry_section: "Organic", name: "Polymers",                         chapter_number: 30, difficulty_weight: 2, dependency_score: 1 },

  // ==================== MATHEMATICS ====================
  // Algebra
  { subject: "Mathematics", chemistry_section: null, name: "Sets",                          chapter_number: 1,  difficulty_weight: 2, dependency_score: 2 },
  { subject: "Mathematics", chemistry_section: null, name: "Relations & Functions",         chapter_number: 2,  difficulty_weight: 3, dependency_score: 2 },
  { subject: "Mathematics", chemistry_section: null, name: "Quadratic Equations",           chapter_number: 3,  difficulty_weight: 3, dependency_score: 3 },
  { subject: "Mathematics", chemistry_section: null, name: "Sequence & Series",             chapter_number: 4,  difficulty_weight: 3, dependency_score: 2 },
  { subject: "Mathematics", chemistry_section: null, name: "Binomial Theorem",              chapter_number: 5,  difficulty_weight: 3, dependency_score: 2 },
  { subject: "Mathematics", chemistry_section: null, name: "Permutation & Combination",     chapter_number: 6,  difficulty_weight: 5, dependency_score: 3 },
  { subject: "Mathematics", chemistry_section: null, name: "Complex Numbers",               chapter_number: 7,  difficulty_weight: 5, dependency_score: 3 },
  { subject: "Mathematics", chemistry_section: null, name: "Matrices",                      chapter_number: 8,  difficulty_weight: 3, dependency_score: 2 },
  { subject: "Mathematics", chemistry_section: null, name: "Determinants",                  chapter_number: 9,  difficulty_weight: 3, dependency_score: 2 },
  { subject: "Mathematics", chemistry_section: null, name: "Probability",                   chapter_number: 10, difficulty_weight: 5, dependency_score: 3 },
  { subject: "Mathematics", chemistry_section: null, name: "Statistics",                    chapter_number: 11, difficulty_weight: 2, dependency_score: 1 },
  // Trigonometry
  { subject: "Mathematics", chemistry_section: null, name: "Trigonometric Ratios",          chapter_number: 12, difficulty_weight: 3, dependency_score: 3 },
  { subject: "Mathematics", chemistry_section: null, name: "Trigonometric Equations",       chapter_number: 13, difficulty_weight: 3, dependency_score: 2 },
  { subject: "Mathematics", chemistry_section: null, name: "Inverse Trigonometric Functions",chapter_number: 14, difficulty_weight: 3, dependency_score: 2 },
  // Coordinate Geometry
  { subject: "Mathematics", chemistry_section: null, name: "Straight Lines",                chapter_number: 15, difficulty_weight: 3, dependency_score: 2 },
  { subject: "Mathematics", chemistry_section: null, name: "Circle",                        chapter_number: 16, difficulty_weight: 3, dependency_score: 2 },
  { subject: "Mathematics", chemistry_section: null, name: "Parabola",                      chapter_number: 17, difficulty_weight: 4, dependency_score: 2 },
  { subject: "Mathematics", chemistry_section: null, name: "Ellipse",                       chapter_number: 18, difficulty_weight: 4, dependency_score: 2 },
  { subject: "Mathematics", chemistry_section: null, name: "Hyperbola",                     chapter_number: 19, difficulty_weight: 4, dependency_score: 2 },
  // Calculus
  { subject: "Mathematics", chemistry_section: null, name: "Limits",                        chapter_number: 20, difficulty_weight: 4, dependency_score: 3 },
  { subject: "Mathematics", chemistry_section: null, name: "Continuity",                    chapter_number: 21, difficulty_weight: 3, dependency_score: 2 },
  { subject: "Mathematics", chemistry_section: null, name: "Differentiability",             chapter_number: 22, difficulty_weight: 4, dependency_score: 3 },
  { subject: "Mathematics", chemistry_section: null, name: "Applications of Derivatives",   chapter_number: 23, difficulty_weight: 5, dependency_score: 3 },
  { subject: "Mathematics", chemistry_section: null, name: "Indefinite Integration",        chapter_number: 24, difficulty_weight: 5, dependency_score: 3 },
  { subject: "Mathematics", chemistry_section: null, name: "Definite Integration",          chapter_number: 25, difficulty_weight: 5, dependency_score: 3 },
  { subject: "Mathematics", chemistry_section: null, name: "Area Under Curve",              chapter_number: 26, difficulty_weight: 4, dependency_score: 2 },
  { subject: "Mathematics", chemistry_section: null, name: "Differential Equations",        chapter_number: 27, difficulty_weight: 4, dependency_score: 2 },
  // Vector & 3D
  { subject: "Mathematics", chemistry_section: null, name: "Vector Algebra",                chapter_number: 28, difficulty_weight: 3, dependency_score: 2 },
  { subject: "Mathematics", chemistry_section: null, name: "3D Geometry",                   chapter_number: 29, difficulty_weight: 4, dependency_score: 2 },
];

export function getChaptersBySubject(subject: SubjectName) {
  return CHAPTERS_DATA.filter((c) => c.subject === subject);
}

export function getChaptersBySection(section: ChemistrySection) {
  return CHAPTERS_DATA.filter((c) => c.chemistry_section === section);
}
