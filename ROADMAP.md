# Java Academy — Roadmap & Improvement Plan

**Vision:** An interactive, fun, gamified platform to learn Java zero → advanced: lessons, live playground, LeetCode-style challenges, quizzes, flashcards, games, and Duke the AI tutor — all tracking your progress.

**Current state (verified):** Working scaffold. 19 shallow lessons, Monaco playground with Docker/local runner, basic quizzes/achievements/flashcards, auth backend, rule-based Duke. One duplicate nested scaffold (`java-academy/java-academy/`) should be removed. App likely never run end-to-end (no `node_modules`). Not deployed.

---

## Phase 0 — Foundation & Cleanup (do first, 1–2 days)

Goal: single clean repo, runs locally end-to-end, safe to build on.

| Task | Where | Priority |
|---|---|---|
| Delete duplicate scaffold `java-academy/java-academy/` | root | P0 |
| Add `.gitignore` (node_modules, dist, .env, *.log, backend/data/*.json except keep templates) | root | P0 |
| Verify fresh `npm install` + `npm run dev` on both apps works | frontend/ backend/ | P0 |
| Verify playground runs Java (Docker Desktop OR local JDK fallback) | backend/src/index.ts | P0 |
| Add `README` quick-start + script section to run both servers with one command | README.md | P1 |
| Add a root `package.json` with `concurrently` to run frontend+backend together | root | P1 |
| Move API base URL to env/config so frontend isn't hard-coded to same origin | frontend | P2 |
| Add health endpoint `/api/health` (reports docker available, db mode) | backend/src/index.ts | P2 |

**Done when:** fresh clone → two commands → app opens, lessons load, code runs, progress persists.

---

## Phase 1 — Core Learning Loop (highest value, 1–2 weeks)

Goal: lessons actually teach + a real LeetCode-style challenge judge.

### 1A. Content depth (migrate prototype richness)

| Task | Where |
|---|---|
| Port analogies, tips, and per-lesson quizzes from `java_masterclass_zero_to_hero.html` into `lessons.json` (add fields: `analogy`, `tips[]`, `examples[]`, `commonMistakes[]`) | backend/data/lessons.json |
| Add 1–2 runnable code examples per lesson (linked to playground snippets) | lessons.json + frontend/src/pages/Playground.tsx |
| Add `module` field to lessons (Fundamentals / OOP / Collections / Concurrency / JVM / Tools) for curriculum map | lessons.json + Lessons.tsx |
| Extend 19 lessons → ~35 covering: packages, records/sealed classes, `Optional`, `enum`, reflection, JDBC, HTTP clients, testing (JUnit), design patterns, Spring basics | lessons.json |

### 1B. Challenge Judge (the LeetCode piece)

| Task | Where |
|---|---|
| Define problem schema: `{ id, title, difficulty, lessonId, statement, starterCode, tests: [{ input, expectedOutput, isPublic }], hints[] }` | backend/data/challenges.json |
| Write 25–40 problems across 3 difficulties, mapped to lessons (easy: loops/strings/arrays; medium: OOP/collections/streams; hard: concurrency/recursion) | challenges.json |
| Backend endpoint `POST /api/challenges/:id/run` — compile + run student `Solution` with each test, return per-test pass/fail/actual/expected | backend/src/index.ts (reuse run-sandbox infra) |
| Backend endpoint `POST /api/challenges/:id/submit` — full tests, store result, award XP + achievement | backend/src/index.ts |
| Challenge detail endpoint `GET /api/challenges/:id` (public tests visible, hidden tests only after submit) | backend/src/index.ts |
| Frontend: Challenges page — list with difficulty filter, Monaco editor, test output panel (green/red rows), hints toggle, "Run tests" vs "Submit" | frontend/src/pages/Challenges.tsx |
| Extend `Playground` to load a challenge's starter code automatically | Playground.tsx |

### 1C. Wire auth properly

| Task | Where |
|---|---|
| Auth context (token in localStorage, user info, logout), protected routes, pass real userId to all API calls | frontend/src/context/AuthContext.tsx, App.tsx |
| Fix `/api/progress` GET to return only the requesting user's progress | backend/src/index.ts |
| Seed a default user flow: anonymous still works, login upgrades progress | frontend/src/pages/Login.tsx |

**Done when:** a beginner can read a lesson → answer its quiz → solve its challenge with test feedback → progress tracked to their account.

---

## Phase 2 — Gamification & Engagement (1 week)

Goal: momentum + fun. Build on existing achievements.

| Task | Where | Priority |
|---|---|---|
| XP + levels: XP per completed lesson/quiz/challenge, level = f(xp), show in sidebar + Profile | backend (progress model), frontend Profile.tsx, App.tsx | P1 |
| Streaks: daily check-in streak + streak calendar on Profile (based on progress timestamps) | backend/src/index.ts, Profile.tsx | P1 |
| Leaderboard (optional, local-only unless public): weekly XP ranking among local users | backend | P2 |
| Achievement set: first-run, streak-3/7/30, first correct challenge, difficulty badges (easy/medium/hard solver), speedrunner | backend/src/index.ts + Achievements.tsx | P1 |
| Progress rings/bars on lessons list ("3/8 done in OOP") | Lessons.tsx | P2 |
| Unlockable Duke cosmetics/emotes on level-up (cheap, high delight) | frontend/src/components/Duke.tsx | P2 |

---

## Phase 3 — Games (the "fun way", 1–2 weeks)

Goal: playful practice that reinforces lessons. All generated from lesson data where possible.

| Game | Description | Data source |
|---|---|---|
| **Guess the Output** | Show a short Java snippet, user picks the printed output; streak counter, leaderboard of streaks | auto-generated from curated snippet+answer pairs in `backend/data/games.json` |
| **Bug Hunt** | Show a broken snippet (1–2 injected bugs), user identifies the bug line; lives system | generated from lesson code examples + injected mutations |
| **Fill the Gap** | Code with `____` blanks, user types the missing token (auto-complete accepted) | from lesson code examples |
| **Speed Drills** | Timed MCQ on syntax/concepts, 60s sprint | from quizzes.json |
| **Java Crossword / Matching** (stretch) | Match term↔definition in pairs grid | from flashcards |

**Done when:** at least Guess-the-Output + Bug Hunt are playable, award XP/achievements, and feed the same streak/XP system.

---

## Phase 4 — Duke the AI Tutor (1 week)

Goal: Duke goes from placeholder to genuinely useful.

| Task | Where | Priority |
|---|---|---|
| Add conversation history to `/api/ai-chat` (short memory window) | backend/src/index.ts | P1 |
| Inject richer context: lesson content, analogy, user's last quiz/challenge result, skill level | backend | P1 |
| Support actions: "quiz me", "explain like I'm 5", "walk through my code" (accept code from client) | backend | P2 |
| Model config via env (provider, model, temperature); default to a cheap model (gpt-4o-mini / claude-haiku / gemini-flash) | backend | P1 |
| Rate-limit + token cap to control cost; graceful fallback to rule-based when key absent | backend | P1 |
| Code feedback loop: after a failed challenge, Duke explains the failing test | frontend Challenges.tsx + backend | P2 |
| Streaming replies (SSE) so chat feels instant | backend + Duke.tsx | P3 |

---

## Phase 5 — Polish & Hardening (ongoing, 1–2 weeks)

| Area | Tasks |
|---|---|
| **Tests** | Backend: vitest/jest for judge runner + auth + progress endpoints. Frontend: vitest + React Testing Library smoke tests for pages. CI already exists (`.github/workflows/ci.yml`) — add `npm test` steps |
| **Types** | Move shared types (Lesson, Quiz, Challenge, User) to `shared/types.ts` used by both apps |
| **Error handling** | Consistent `{error}` responses, frontend toast/error states on every fetch, loading skeletons |
| **Security** | Move JWT secret + API keys to `.env` (never commit); validate challenge code (size, forbid `System.exit`/reflection where possible); keep Docker sandbox defaults strict |
| **Accessibility** | Keyboard nav for quiz options, aria labels, focus rings, contrast pass |
| **Performance** | Lazy-load Monaco, route-level code splitting, cache lessons/challenges in localStorage |
| **Responsive** | Sidebar collapses to drawer under ~1024px, Duke panel toggles on mobile |

---

## Phase 6 — Enhanced / Scale (later)

- **Deploy**: backend + frontend to free tier (Render/Fly/Railway), Postgres managed (Neon/Supabase), static frontend to Netlify/Vercel.
- **Public sandbox**: replace local Docker with Piston/Judge0/JDoodle API so the deployed site can run Java safely.
- **Content pipeline**: markdown lesson authoring (so you write lessons fast) compiled to lessons.json.
- **Spaced repetition** for flashcards (SM-2 algorithm).
- **Session-based resume**: "Continue where you left off" home page.
- **Multi-user sharing**: public profile pages, challenge-specific leaderboards.
- **Mobile app** (stretch) or PWA.

---

## Idea improvements (reconsidering the concept)

1. **One clear curriculum promise**: "zero → junior backend engineer" beats vague "zero → advanced". Cut/rename lessons accordingly.
2. **Scope discipline**: games are engagement, not teaching — keep them small (2–3 games max) and reuse existing data.
3. **Learning loop first**: Read → Run → Quiz → Challenge → Repeat. Everything should reinforce this loop; features outside it are postponed.
4. **Judge correctness before content volume**: 40 quality challenges with meaningful tests beat 100 shallow ones.
5. **Default frictionless**: anonymous usage must work fully; login is an upgrade, not a gate.

---

## Definition of done (project-level)

- [ ] Fresh setup runs in ≤ 2 commands; README documents everything
- [ ] 35+ deep lessons with analogies + examples + quizzes
- [ ] 25+ challenges with working judge and per-test feedback
- [ ] XP, streaks, achievements live across lessons/quizzes/challenges/games
- [ ] 2+ games playable and rewarding
- [ ] Duke gives context-aware, helpful answers (with or without paid key)
- [ ] Auth wired; progress is per-user and survives reloads
- [ ] Tests in CI; no failing builds
- [ ] Deployed URL you can share
