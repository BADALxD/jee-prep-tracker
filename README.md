# JEE Tracker — Production-Ready V1

A full-stack JEE preparation tracker built with Next.js 15, Supabase, TypeScript, and Tailwind CSS.

---

## Folder Structure

```
jee-tracker/
├── src/
│   ├── app/
│   │   ├── auth/
│   │   │   ├── layout.tsx            # Auth split-panel layout
│   │   │   ├── login/page.tsx
│   │   │   └── signup/page.tsx
│   │   ├── dashboard/
│   │   │   ├── layout.tsx            # Dashboard layout (server, auth-gated)
│   │   │   └── page.tsx              # Main dashboard
│   │   ├── subjects/
│   │   │   ├── layout.tsx
│   │   │   ├── physics/page.tsx
│   │   │   ├── chemistry/page.tsx
│   │   │   └── mathematics/page.tsx
│   │   ├── mock-tests/page.tsx
│   │   ├── materials/page.tsx
│   │   ├── admin/page.tsx
│   │   ├── globals.css
│   │   ├── layout.tsx                # Root layout
│   │   └── page.tsx                  # Root → redirect
│   ├── components/
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx
│   │   │   └── SignupForm.tsx
│   │   ├── dashboard/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── MobileNav.tsx
│   │   │   ├── ReadinessMeter.tsx
│   │   │   ├── SubjectCard.tsx
│   │   │   ├── StatsCard.tsx
│   │   │   ├── MockTestClient.tsx
│   │   │   └── MaterialsClient.tsx
│   │   ├── subjects/
│   │   │   ├── ChapterRow.tsx
│   │   │   ├── SubjectChapterList.tsx
│   │   │   └── SubjectProgressHeader.tsx
│   │   ├── admin/
│   │   │   └── AdminClient.tsx
│   │   └── ui/
│   │       ├── Button.tsx
│   │       ├── Input.tsx
│   │       ├── Card.tsx
│   │       ├── Badge.tsx
│   │       ├── Select.tsx
│   │       ├── Progress.tsx          # ProgressBar + ProgressRing
│   │       └── Checkbox.tsx
│   ├── config/
│   │   ├── weights.ts                # Progress weights, readiness levels
│   │   └── chapters.ts               # Chapter seed data
│   ├── hooks/
│   │   ├── useUser.ts
│   │   └── useProgress.ts
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts             # Browser client
│   │   │   ├── server.ts             # Server client
│   │   │   └── middleware.ts         # Session middleware
│   │   ├── progress.ts               # Progress calculation engine
│   │   ├── store.ts                  # Zustand store
│   │   └── utils.ts                  # Utility functions
│   ├── types/
│   │   └── index.ts                  # All TypeScript types
│   └── middleware.ts                 # Next.js middleware (auth routing)
├── supabase/
│   └── schema.sql                    # Complete DB schema + seed data
├── .env.example
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## Environment Variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
NEXT_PUBLIC_APP_URL=http://localhost:3000
ADMIN_EMAIL=admin@yoursite.com
```

Get these from: **Supabase Dashboard → Settings → API**

---

## Setup Instructions

### 1. Clone & Install

```bash
git clone <your-repo>
cd jee-tracker
npm install
```

### 2. Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for it to provision (~2 minutes)
3. Go to **SQL Editor** → **New Query**
4. Paste the full contents of `supabase/schema.sql`
5. Click **Run** — this creates all tables, indexes, RLS policies, triggers, and seeds all 89 chapters

### 3. Configure Auth

In your Supabase dashboard:
- **Authentication → Settings → Email Auth** → Enable email confirmations (or disable for dev)
- **Authentication → URL Configuration** → Add `http://localhost:3000` to allowed redirect URLs

### 4. Create .env.local

Copy `.env.example` to `.env.local` and fill in your Supabase credentials.

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 6. Create Your First Admin

1. Sign up as a normal user via the UI
2. In Supabase SQL Editor, run:
```sql
UPDATE user_profiles
SET is_admin = TRUE
WHERE email = 'your-email@example.com';
```
3. Refresh the app — the Admin Panel link will appear in the sidebar

---

## Vercel Deployment

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit: JEE Tracker V1"
git remote add origin https://github.com/yourusername/jee-tracker.git
git push -u origin main
```

### 2. Import to Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New Project**
2. Import your GitHub repository
3. Framework: **Next.js** (auto-detected)

### 3. Add Environment Variables

In Vercel project settings → **Environment Variables**, add:

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Your service role key |
| `NEXT_PUBLIC_APP_URL` | Your Vercel URL (e.g. `https://jee-tracker.vercel.app`) |

### 4. Deploy

Click **Deploy**. Your app will be live in ~60 seconds.

### 5. Update Supabase Auth URLs

In Supabase → **Authentication → URL Configuration**:
- **Site URL**: `https://your-app.vercel.app`
- **Redirect URLs**: Add `https://your-app.vercel.app/**`

---

## Architecture Notes

### Progress Calculation

The engine uses **importance-weighted scoring** — chapters with higher `importance_score` (difficulty × dependency) contribute more to the overall progress:

```
chapter_completion = theory×0.25 + module×0.25 + practice×0.30 + pyq×0.20
weighted_score = chapter_completion × importance_score
subject_weighted = Σ(weighted_score) / Σ(importance_score)
```

### Readiness Score (0–100)

```
readiness = weighted_completion×0.35 + pyq×0.25 + practice×0.20 + mock_avg×0.20
```

### Future-Ready Database

All V2+ fields are already in the schema:
- `revision_count`, `last_revision_date`, `confidence_score` on `chapter_progress`
- `predicted_rank_min/max`, `predicted_percentile` on `readiness_scores`
- `test_type`, subject-wise marks on `mock_tests`
- Chapter importance scores computed automatically via SQL `GENERATED ALWAYS AS`

---

## Feature Summary

| Feature | Status |
|---------|--------|
| Auth (login/signup/logout) | ✅ |
| User profiles | ✅ |
| 89 chapters pre-seeded | ✅ |
| Chapter tracking (4 fields) | ✅ |
| Weighted progress engine | ✅ |
| Readiness score 0–100 | ✅ |
| Readiness levels (4 tiers) | ✅ |
| Mock test tracker + history | ✅ |
| Performance chart | ✅ |
| Materials section | ✅ |
| Admin panel | ✅ |
| Dark mode | ✅ |
| Mobile responsive | ✅ |
| RLS policies | ✅ |
| Future-ready DB schema | ✅ |

---

## Scaling to V2

These can be added without any DB migration:

- **AI Study Planner** — use `confidence_score` + `revision_count` + `importance_score`
- **Revision Tracker** — use `revision_count` + `last_revision_date`
- **Percentile Predictor** — populate `predicted_rank_*` in `readiness_scores`
- **Smart Recommendations** — query weakest chapters by `importance_score DESC`
- **Advanced Analytics** — subject-wise mock breakdown using `physics_marks`, etc.
