# CLAUDE.md

Parametric 3D bathroom vanity configurator. Read `docs/spec.md` (functional spec)
and `docs/progress.md` (context, status, workflow) at the start of every session.
Keep both in sync with the code; tick off milestones in `progress.md`.

## Commands

- `pnpm dev` / `pnpm build`
- `pnpm test` (Vitest), `pnpm test:e2e` (Playwright), `pnpm typecheck`, `pnpm lint` (oxlint), `pnpm format`
- Before finishing a task run: `pnpm lint && pnpm typecheck && pnpm test`

## Architecture rules

- Data flows one way: `input → normalize → buildPanels → (scene | price | cutlist)`.
- `src/domain/` is pure TS: no imports from React, Three.js, Zustand or the DOM.
- All lengths are integer millimetres in the domain; convert to metres only in `src/scene/`.
- The scene renders `Panel[]` from the domain — never derive geometry in components.
- Rules never throw: `normalize()` returns `{ config, adjustments }` and the UI shows adjustments.
- All prices/rates live in `src/domain/pricing.config.ts`.

## Conventions

- Every rule, the panel builder and pricing have unit tests next to the file (`*.test.ts`).
- Small, focused changes; one milestone from the spec per PR.
- No comments in code or config files (JSDoc included). Names and tests carry the intent.
- Commit messages, PR titles and branch names in English.
- Do not commit, push or merge — the user does that.
