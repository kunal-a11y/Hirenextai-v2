# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Auth**: JWT tokens (bcryptjs for hashing, jsonwebtoken for tokens)
- **AI**: OpenAI via Replit AI Integrations proxy (`@workspace/integrations-openai-ai-server`)

## Application: HirenextAI

A full-stack AI-powered job search platform with:

### Features
- **Landing page**: Premium 3D gradient background, animated job card previews, trust badges (Shield, Lock, Users, Award), testimonials section from real users, How It Works section, 6 feature cards, pricing teaser — India-focused copy for BCA/MCA/BTech freshers
- **Navbar**: Clean — only Features, Pricing, Sign In, Get Started (no Contact link). Mobile drawer included.
- **Dedicated Features page** (`/features`): 5 detailed feature sections with stats, benefits lists, and animated cards
- **Dedicated Pricing page** (`/pricing`): Monthly/Annual toggle (25% annual discount), 3 plan cards, FAQ accordion
- **Premium Footer**: Pure black bg, white text, purple accents, 4-column layout (Brand+socials, About, Support, Contact), © 2026 copyright centered at bottom
- **Legal Pages**: `/about`, `/help-center`, `/privacy-policy`, `/terms`, `/cookies`, `/contact` — all with premium dark UI, proper structured content, and mobile responsive
- **Cookie Consent**: First-visit popup (bottom-right) with Accept/Deny buttons, saves to localStorage, does not show again
- Authentication (register/login with JWT tokens, stored in localStorage as `hirenext_token`)
- **Auth page**: Google login (shows "Soon"), Phone OTP flow, Email/Password form, Demo login
- **First-login onboarding modal** ("Setup Your AI Career Assistant") — mandatory 4-step setup flow shown on first dashboard visit: About You (degree + specialization + fresher/experienced), Your Skills (multi-select with popular categories + custom add), Job Preferences (categories + cities + remote toggle), Salary & Goals (min/max CTC in LPA). Saves to `profile.setupCompleted = true` via PATCH /api/profile.
- **Dashboard**: NO left sidebar — full-width layout. Top navbar has Logo + inline nav links (md+) + Avatar Dropdown. Avatar dropdown shows: nav items, AI usage progress bar, Upgrade CTA, Sign Out. Mobile has right-side drawer.
- **Dashboard nav**: Nav items in top header (desktop) and inside avatar dropdown, plus right-side mobile drawer
- Jobs page with real-time live job aggregator (Arbeitnow, Remotive + optional JSearch/Adzuna/SerpAPI) with 30-min cache, source badges, applyUrl links, and DB fallback
- Advanced job search/filter system: keyword search, city dropdown, experience level, dual-range salary slider (₹0–30L), job type, remote toggle, fresher toggle, multi-select skills tags (24 popular skills), sort by latest/salary/match — all synced to URL query params; filter state is preserved on refresh/share
- Sticky filter sidebar (desktop) + slide-up mobile drawer with full filter access; Load More pagination (unlimited, +30 per click, backend cap 150)
- DB indexes on postedAt, location, category, type, isFresher, isRemote, salaryMin/Max, experienceYears, source for fast filtered queries
- Smart search with keyword expansions, relevance scoring, multi-source fallback, trending chips, browse by category
- Saved Jobs system: bookmark jobs from card or detail modal, manage saved jobs at /dashboard/saved-jobs with notes and sort
- AI Recommended Jobs section: horizontal-scroll card strip at the top of the Jobs page, driven by GET /api/jobs/recommended (auth-protected); 5-factor match score (skills 50%, experience 20%, location 15%, salary 10%, job type 5%); profile <40% completion → 25% score penalty; top 10 results; 10-min server-side cache; green/yellow/gray match % badge; ⭐ Best Match label for top 3; skeleton loader; hides/shows CTA if profile <40% complete
- India-first job ordering: when no location filter is set, Indian city jobs (Bangalore, Hyderabad, Mumbai, Delhi, Pune, Chennai, Kolkata) are sorted to the top before international jobs
- Applications tracker with summary bar (total/interviews/offers/follow-ups), expandable rows with notes + follow-up date picker, status change dropdown, overdue/due-soon indicators
- Landing page: animated floating glow blobs (3 CSS keyframe blobs in indigo/purple/violet), typewriter hero headline cycling phrases, scroll indicator arrow, `hover-glow` card effect on feature/trust/testimonial/pricing cards (soft purple shadow + scale-up), Founder section (glass card with floating avatar, gradient ring, Kunal Purohit bio, stats, LinkedIn/GitHub icons), section fade+slide-up reveal via Framer Motion whileInView on all sections
- AI Tools: Cover Letter Generator, Recruiter Message, Resume Optimizer, Interview Prep
- Profile management (skills, education, experience, salary range, remote preference, degree, specialization)
- Subscription management with plan upgrades
- Usage tracking (per-feature monthly limits — each AI tool tracked independently)

### Subscription Plans — Feature-Based Limits
- **Free**: Cover Letters 3/mo, Resume Reviews 5/mo, AI Chat 20/mo, Job Match 3/mo, Career Suggestions 2/mo, Job Simplifier 10/mo. Recruiter Outreach & Interview Prep are Pro-only (locked).
- **Pro**: Unlimited all features incl. Recruiter Outreach & Interview Prep (₹199/month)
- **Premium**: Everything in Pro + 1-on-1 career coaching, priority AI, priority support (₹499/month)

### AI Usage System
- `aiUsageTable` tracks per-user, per-type, per-monthYear usage
- Each feature type (`cover-letter`, `resume-optimize`, `chat`, etc.) has its own limit counter (not a shared pool)
- Backend `checkAndConsumeUsage()` queries per-type count against `FEATURE_LIMITS[plan][type]`
- `GET /api/ai/usage` returns `features` object (per-feature used/limit/remaining) + legacy totals
- 402 errors include `feature`, `featureLabel`, `requiredPlan`, `message` for upgrade modal context
- `UpgradeModal` component shown on 402 — Pro-only features show lock icon, exhausted features show limit message

### Recruiter Job Posting System
- **Role-based accounts**: `usersTable.role` — "job_seeker" or "recruiter". Set at registration via `POST /api/auth/register { role }`.
- **Recruiter signup flow**: Sign-up page has a Job Seeker / Recruiter toggle button. Recruiter accounts redirect to `/dashboard/recruiter/setup` after registration.
- **Recruiter onboarding** (`/dashboard/recruiter/setup`): Standalone page (no DashboardLayout) collecting: Company Name, Recruiter Name, Work Email, Company Size, Industry, Website, Phone, Description. Saved to `recruiterProfilesTable`.
- **Recruiter Dashboard** (`/dashboard/recruiter`): Analytics cards (total jobs, views, applications, pending/shortlisted/rejected), job posts list with delete, applicant management panel — shows applicant cards with skills, cover letters, resume links, shortlist/reject actions.
- **Post a Job** (`/dashboard/recruiter/post-job`): Form with title, location, type, category, skills, description, requirements, salary min/max, deadline, fresher-friendly toggle.
- **Recruiter API routes** (`/api/recruiter/*`): Profile CRUD, job CRUD (POST/GET/PATCH/DELETE), applicant listing with profile data, shortlist/reject PATCH, analytics endpoint.
- **Direct Post badge**: Jobs with `isDirectPost=true` show a purple "🏢 Direct Post" badge in the job feed card.
- **Role-aware navigation**: `DashboardLayout` detects `user.role === "recruiter"` and shows recruiter nav items (Dashboard, Post a Job, Browse Jobs, Profile, Subscription) instead of the job seeker nav.
- **DB schema for recruiters**: `recruiterProfilesTable` (company info), `usersTable.role`, `jobsTable.isDirectPost/postedByUserId/viewCount/applicationDeadline/companyWebsite`, `applicationsTable.recruiterStatus/resumeUrl/notes`.

### AI Job Match Score System
- **Pure frontend computation** using `computeMatchScore(job, profile)` in `Jobs.tsx`
- Profile data comes from `useGetProfile()` (already in React Query cache) — no extra API calls
- Match scores computed via `useMemo` and cached in React state (recalculates only when jobs or profile changes)
- **Algorithm (0–100 score):** Skills 45pts + Location 25pts + JobType 15pts + Fresher/Experience 15pts
- Skills matching: fuzzy substring match between user skills and job required skills (normalized lowercase)
- **Badges:** ≥80% = green "Strong Match", 60-79% = amber "Good Match", <60% = red "Low Match"
- **"Best Jobs For You" section:** shows top 4 jobs with ≥60% match at the top when no filters active
- **Sort by Best Match:** client-side sort by matchScore desc (overrides backend sort for "relevant" option)
- Badges only shown for authenticated users with profile skills set up

### Job Aggregator API Keys (Optional — for more sources)
- `RAPID_API_KEY` → Enables JSearch (RapidAPI) — premium India job listings
- `ADZUNA_APP_ID` + `ADZUNA_APP_KEY` → Enables Adzuna India — salary-tagged India jobs
- `SERP_API_KEY` → Enables Google Jobs via SerpAPI — broad search coverage

Without keys: Arbeitnow + Remotive (free sources) + DB are used automatically.

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   ├── api-server/         # Express API server
│   │   └── src/
│   │       ├── lib/auth.ts          # JWT + bcrypt helpers
│   │       ├── middlewares/authenticate.ts
│   │       └── routes/
│   │           ├── auth.ts          # /api/auth/*
│   │           ├── jobs.ts          # /api/jobs/*
│   │           ├── applications.ts  # /api/applications/*
│   │           ├── ai.ts            # /api/ai/* (OpenAI powered)
│   │           ├── profile.ts       # /api/profile
│   │           └── subscription.ts  # /api/subscription
│   └── hirenextai/         # React+Vite frontend (root path /)
│       └── src/
│           ├── pages/
│           │   ├── Landing.tsx
│           │   ├── Login.tsx
│           │   ├── Register.tsx
│           │   └── dashboard/
│           │       ├── Jobs.tsx
│           │       ├── Applications.tsx
│           │       ├── AITools.tsx
│           │       ├── Profile.tsx
│           │       └── Subscription.tsx
│           ├── components/layout/
│           │   ├── Navbar.tsx
│           │   └── DashboardLayout.tsx
│           └── hooks/use-auth.ts   # Auth state with zustand
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   ├── db/                 # Drizzle ORM schema + DB connection
│   │   └── src/schema/
│   │       ├── users.ts           # users + sessions tables
│   │       ├── jobs.ts            # jobs table
│   │       ├── applications.ts    # applications table
│   │       ├── profiles.ts        # user profiles table
│   │       └── ai_usage.ts        # AI usage + subscriptions tables
│   └── integrations-openai-ai-server/  # OpenAI client (Replit AI Integration)
├── scripts/                # Utility scripts
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references.

- **Always typecheck from the root** — run `pnpm run typecheck`
- **`emitDeclarationOnly`** — we only emit `.d.ts` files during typecheck
- **Project references** — when package A depends on package B, A's `tsconfig.json` must list B in its `references` array

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references

## Packages

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server. Routes live in `src/routes/` and use `@workspace/api-zod` for request/response validation and `@workspace/db` for persistence.

- Entry: `src/index.ts` — reads `PORT`, starts Express
- App setup: `src/app.ts` — mounts CORS, JSON/urlencoded parsing, routes at `/api`
- Auth: JWT-based with 30-day expiry, token in `Authorization: Bearer <token>` header
- AI: Uses OpenAI via `@workspace/integrations-openai-ai-server` (model: `gpt-5-mini`)
- `pnpm --filter @workspace/api-server run dev` — run the dev server

### `artifacts/hirenextai` (`@workspace/hirenextai`)

React + Vite frontend at root path `/`.

- Auth state managed with zustand store in `hooks/use-auth.ts`
- Token stored in localStorage as `hirenext_token`
- Uses `@workspace/api-client-react` for generated React Query hooks
- Dark premium theme with glassmorphism UI and Framer Motion animations
- `pnpm --filter @workspace/hirenextai run dev` — run dev server

### `lib/db` (`@workspace/db`)

Database layer using Drizzle ORM with PostgreSQL.

- Tables: `users`, `sessions`, `jobs`, `applications`, `profiles`, `ai_usage`, `subscriptions`
- `pnpm --filter @workspace/db run push` — sync schema to database

### `lib/api-spec` (`@workspace/api-spec`)

OpenAPI 3.1 spec (`openapi.yaml`) and Orval config. Run codegen:
`pnpm --filter @workspace/api-spec run codegen`

## Environment Variables

- `DATABASE_URL` — PostgreSQL connection string
- `AI_INTEGRATIONS_OPENAI_BASE_URL` — OpenAI proxy URL (Replit AI Integration)
- `AI_INTEGRATIONS_OPENAI_API_KEY` — OpenAI API key (Replit AI Integration)
- `JWT_SECRET` — JWT signing secret (defaults to a dev value, set in production)
