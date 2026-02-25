# Skill: Gameplay Flow Hardening

Goal: keep UI gameplay flow stable on real interaction paths.

Signals:
- `e2e-mobile-tapflow` fails
- Playwright visibility/timeout failures in tap flow

Playbook:
1. Reproduce with headed Playwright.
2. Stabilize selectors and waits instead of adding arbitrary delays.
3. Update tests when behavior changed intentionally and document the change.
