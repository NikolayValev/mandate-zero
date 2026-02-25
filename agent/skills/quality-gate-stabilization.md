# Skill: Quality Gate Stabilization

Goal: recover build health quickly when static checks or unit tests fail.

Signals:
- `typecheck` fails
- `lint` fails
- `unit-tests` fails

Playbook:
1. Fix compile/type and lint errors first.
2. Re-run the single failing command.
3. Run the full validation chain only after local fixes are green.
