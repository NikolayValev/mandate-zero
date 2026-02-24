# Mandate Zero - Agent Instructions

Welcome, future AI Agent! You are working on **Mandate Zero**, a playable, turn-based crisis strategy demo built with Next.js.

This document serves as your guide to the architecture, project structure, and rules for modifying this codebase safely. Please read this entirely before making changes.

## 🎯 Project Goals & Philosophy

- **Local-First MVP:** The primary demo (`/` route) runs entirely in the browser using `localStorage`. No signup required.
- **Deterministic Simulation:** The game engine must be deterministic. Given the same random seed and actions, it must produce the exact same outcome.
- **Separation of Concerns:** Pure game logic is entirely decoupled from the UI/React layer.

## 🛠️ Tech Stack

- **Framework:** Next.js 15 (App Router)
- **UI:** React 19, Tailwind CSS, shadcn/ui components
- **Language:** TypeScript (Strict typing is mandatory)
- **Testing:** 
  - Unit Tests: Vitest (for the pure game engine)
  - E2E Tests: Playwright (for user flows and UI determinism)
- **Optional Backend:** Supabase (Auth & Database for the `/protected` route)

## 📂 Directory Map

When looking for code, start here:

- `app/` - Next.js App Router structure. Contains `page.tsx` for the main local MVP and `protected/` for the authenticated flow.
- `components/mandate-zero/` - **The Core Domain.** This is where the game lives.
  - `types.ts` - Shared domain interfaces and types. **Update this first** when adding new game concepts.
  - `data.ts` - Static game content dictionaries (doctrines, policies, scenarios, metadata).
  - `engine.ts` - Pure simulation functions (RNG, state mutations, validity checks). **No React code or side-effects here.**
  - `*.tsx` - Presentational UI components (e.g., cards, map regions) specific to the game.
- `components/mandate-zero-mvp.tsx` - The main runtime composition. Connects the `engine.ts` logic to the React state and `localStorage`.
- `tests/e2e/` - Playwright end-to-end tests validating the full UI flow.

## 📏 Core Rules for Agents

1. **Maintain Determinism**
   - NEVER use `Math.random()` in the game engine. Always use the seeded random functions provided in `engine.ts` (e.g., passing and updating the `seed` state).
   - Side effects (like `localStorage` access or network calls) **must not** happen inside `engine.ts`.

2. **Strict Typing**
   - Do not use `any`. Always define explicit interfaces in `components/mandate-zero/types.ts`.
   - Ensure the Next.js build (`npm run typecheck`) passes before committing changes.

3. **Modifying the Engine (`engine.ts` & `data.ts`)**
   - If you add a new policy, doctrine, or game effect, define it statically in `data.ts`.
   - If you write logic to process that effect, add it to `engine.ts` as a pure function.
   - **Immediately update `components/mandate-zero/engine.test.ts`** to cover your new logic. Vitest coverage is critical here.

4. **Modifying the Game State schema**
   - If you add or remove properties from the core `GameState` interface, you **must consider localStorage migration**. 
   - Ensure `components/mandate-zero-mvp.tsx` handles fallback values for older saved game states if necessary, or clears the state if the structural change is breaking.

## 🧪 Testing Commands

Before notifying the user that a task is complete, ensure these quality checks pass:

```bash
# 1. Typecheck the codebase
npm run typecheck

# 2. Run the pure engine unit tests
npm run test

# 3. (Optional but recommended for UI logic) Run E2E tests
npm run test:e2e

# 4. Standard validation
npm run lint
```

When building new UI components, use Tailwind CSS and favor existing `shadcn/ui` patterns found in `components/ui/`. Keep components modular and single-purpose.
