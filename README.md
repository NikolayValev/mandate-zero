# Mandate Zero

Mandate Zero is a playable, turn-based crisis strategy demo built with Next.js.

It is designed as a portfolio project that demonstrates:
- deterministic simulation design (seeded runs)
- modular React architecture
- local-first MVP delivery
- optional Supabase-backed authenticated game flow

## Live App Focus

The primary demo is the local MVP on `/`:
- no signup required
- game state persisted in browser localStorage
- doctrine selection, AP economy, cooldowns, delayed effects, and region escalation
- 3D-style region theater map with pressure and loyalty signals

## Tech Stack

- Next.js 15 (App Router)
- React 19 + TypeScript
- Tailwind CSS + shadcn/ui
- Vitest (unit tests)
- Optional Supabase auth/data flow for protected routes

## Architecture

Core game code is split for clarity and testability:

- `components/mandate-zero/types.ts`
  Shared domain types.
- `components/mandate-zero/data.ts`
  Static game content (doctrines, policies, scenarios, metadata, seed config).
- `components/mandate-zero/engine.ts`
  Pure simulation/game-state functions (RNG, effects, coupling, validation).
- `components/mandate-zero/*.tsx`
  Presentational UI cards and map components.
- `components/mandate-zero-mvp.tsx`
  Runtime orchestration (state, persistence, handlers, composition).

## Getting Started

### 1. Install

```bash
npm install
```

### 2. Run locally

```bash
npm run dev
```

Open `http://localhost:3000`.

## Quality Commands

```bash
npm run typecheck
npm run lint
npm run test
npm run check
npm run build
```

## Testing

Unit tests cover deterministic engine behavior and state guards.
Playwright E2E tests cover decision clarity, determinism, consequence visibility, mobile tap flow, and keyboard smoke.

- Test file: `components/mandate-zero/engine.test.ts`
- Runner: Vitest
- E2E folder: `tests/e2e`
- Runner: Playwright

```bash
npx playwright install chromium
npm run test:e2e
```

## CI

GitHub Actions workflow:
- file: `.github/workflows/ci.yml`
- runs on push/PR to `main`
- gates on: install, typecheck, lint, unit tests, build

## Optional Supabase Sandbox

The repo also includes an authenticated Supabase sandbox on `/protected`.
It currently focuses on:
- authenticated user session validation
- automatic player profile bootstrap (`ensurePlayerProfile`)
- character data reads (`getPlayerCharacterData`)

If you want that flow enabled:

1. Copy `.env.example` to `.env.local`
2. Set:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Run SQL from `supabase/schema.sql` in Supabase SQL Editor

Note: the legacy tutorial UI and `/api/test-functions` route were removed during cleanup.

## Production Readiness Checklist

Use this baseline before tagging releases:

- dependency audits are clean (`npm audit`)
- CI is green on latest commit
- core gameplay checks pass manually (new run, seeded run, win/loss paths)
- localStorage migration behavior verified when schema/version changes
- metadata and copy reviewed for public demo quality

## Portfolio Positioning

For interviews and portfolio pages, emphasize:
- simulation logic extraction into pure tested engine modules
- deterministic seeded replay support for demos
- incremental MVP strategy (local-first, then optional backend integration)
- practical QA setup (unit tests + CI gates)
