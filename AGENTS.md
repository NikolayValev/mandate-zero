# Mandate Zero Agent Contract

Agents working in this repository must follow both:

- `AGENT_INSTRUCTIONS.md` for architecture and safety constraints.
- `agent/README.md` for continuous improvement workflow.

## Required workflow

1. Run `npm run agent:loop` before handing off significant changes.
2. Read the latest file in `agent/reports/` and apply the active playbook(s) from `agent/skills/`.
3. Keep `agent/memory.json` as the source of truth for iteration history and current focus.

## Skill routing

- `quality-gate-stabilization`: use for typecheck, lint, and unit-test instability.
- `gameplay-flow-hardening`: use for Playwright gameplay flow failures.

## Continuous mode

Use `npm run agent:loop:continuous` when you want the agent to stay active and keep running iterations on a fixed interval.
