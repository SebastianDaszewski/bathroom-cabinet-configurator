# CLAUDE.md

Parametric 3D bathroom vanity configurator. At the start of every session read
`docs/spec.md` (functional spec) and `docs/architecture.md` (modules and how to
extend them). Keep both in sync with the code; put the reasoning behind each
change in the PR description.

## Workflow

- Show a plan and wait for approval before changing code.
- One milestone or fix per branch and PR; keep diffs small and reviewable.
- Do not commit, push or merge — the owner does that (also enforced in
  `.claude/settings.json`).
- Ask before using the `frontend-design` plugin for UI or styling work.

## Commands

- `pnpm dev` / `pnpm build` / `pnpm preview`
- `pnpm test`, `pnpm test:coverage` (Vitest), `pnpm test:e2e` (Playwright)
- `pnpm typecheck`, `pnpm lint` (oxlint), `pnpm knip` (unused code), `pnpm format`
- Before finishing a task run:
  `pnpm lint && pnpm typecheck && pnpm knip && pnpm test:coverage`, and
  `pnpm test:e2e` when the UI or the scene changed.

## Architecture rules

- Data flows one way: `input → normalize → buildPanels → (scene | price | cutlist)`.
- `src/domain/` is pure TS: no React, Three.js, Zustand or DOM, and no imports
  from `state`, `scene`, `features` or `ui` (enforced by oxlint).
- `src/scene/` renders what it receives as props; it never reads the store or
  `features` (enforced by oxlint) and never derives geometry on its own.
- All lengths are integer millimetres in the domain; convert to metres only in `src/scene/`.
- Rules never throw: `normalize()` returns `{ config, adjustments }` and the UI shows adjustments.
- All prices and rates live in `src/domain/pricing.config.ts`; construction
  values in `src/domain/constants.ts`.

## Conventions

- Every rule, the panel builder, pricing and pure scene helpers have unit tests
  next to the file (`*.test.ts`); coverage thresholds are checked in CI.
- The UI is in Polish; code identifiers, commits and docs in English.
- No comments in code or config files (JSDoc included). Names and tests carry the intent.
- Commit messages, PR titles and branch names in English.
