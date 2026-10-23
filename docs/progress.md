# Progress

Working log for the milestones in [spec.md](spec.md). Update it at the end of
every milestone.

## Context

- This is a test assignment: a non-trivial configurator that demonstrates how
  the project is structured and whether it stays maintainable — not something
  that can be generated in two prompts. Code quality, architecture, tests and a
  clean git history matter more than the number of features.
- The spec was reverse-engineered from the behaviour of a real made-to-measure
  vanity configurator (fabrykamebli.pl, product LWUNS2, built on the commercial
  Variantic player). Only the options, ranges and rules were taken over — no
  code, assets or branding.
- Observed reference pricing (computed client-side): default 600×500×500 ≈
  1236 PLN; ≈ 0.41 PLN/mm of width, ≈ 0.35 PLN/mm of height. Depth also changes
  the allowed drawer lengths. Our pricing is our own cost-based model,
  calibrated only to land in a similar range.
- Values assumed by us, not visible in the reference: 18 mm board, 3 mm gap
  between fronts, 40 mm depth clearance for drawers (R2), thresholds in R6–R8.
  The owner may adjust them.

## Workflow

- The user commits, pushes and merges. Branch names, commits and PR titles in
  English.
- Ask before using the `frontend-design` plugin for UI/styling work.
- Show a plan before each milestone; small PRs, one milestone each.

## Milestones

- [x] **1. Scaffold** — Vite + React 19 + TS strict, R3F + drei, Zustand, Zod,
      Vitest, oxlint (Vite template default, replaces ESLint), Prettier, GitHub
      Actions CI, README, CLAUDE.md. Placeholder 3D box in `App.tsx`.
      Known: bundle ≈ 1.1 MB because of Three.js — code-split in milestone 5.
- [x] **2. Domain** — `schema.ts` (Zod, defaults, lenient `parseConfig`),
      `catalog.ts` (4 boards, 8 decors, 2 runners), `constants.ts`, rules
      R1–R10 in `domain/rules/` with `normalize()` + `allowed*` helpers for the
      UI. 86 unit tests incl. idempotency of `normalize()`.
      Decisions: R4 — opening/front type win, drilling resets to `none`;
      R10 — odd mm goes to the top front; R6 — spacing falls back to the
      largest multiple of 32 that fits; R8 is dormant with the current ranges
      (limit ≥ 344 vs. max 236), kept as a guard; drawer boxes are always
      chipboard; adjustment reasons in English.
- [x] **3. Panels + cut list** — `panels.ts` (`buildPanels` → one axis-aligned
      `Panel` per piece, centre + size in mm, cut-outs in panel coordinates),
      `cutlist.ts` (merge identical pieces, CSV with `;` + BOM). Runner specs in
      the catalogue, new construction constants. 199 tests incl. invariants
      over 72 configs: integer sizes, everything inside the cabinet, no
      overlapping panels, holes and notches inside their panel.
      Decisions: tandem drawers get wooden sides; new `siphonX` + rule R11 for
      a custom cut-out position; R6 extended — with `double` drilling each
      handle gets half the front (`width/2 - 120`), otherwise holes would land
      outside the front. Drawer box sizes, runner deductions and siphon notch
      depth are our assumptions.
- [x] **4. Pricing** — `pricing.config.ts` (all rates), `pricing.ts`
      (`price(config, panels)`, `subtotals`). Integer grosze, margin inside
      every line, total = sum of lines. Calibrated: default 1237.12 PLN,
      ≈ 0.39 PLN/mm width, ≈ 0.34 PLN/mm height (tests check ranges, not exact
      amounts). 218 tests. All rates are our own estimates.
- [x] **5. 3D scene** — `scene/geometry.ts` (pure: mm → m, cabinet centred on
      the origin, decor colours, W/H/D guides, camera distance from cabinet
      size) + R3F components: panel meshes with outlined edges, dimension lines
      with DOM labels projected each frame (drei `Html` lost a label under
      StrictMode), orbit camera that keeps its angle and refits its
      distance when the size changes, "Reset view". Scene lazy-loaded: app
      chunk 317 kB (97 kB gzip), Three.js chunk 958 kB (255 kB gzip); chunk
      warning limit raised to 1000 kB. Only pure helpers are unit-tested
      (229 tests); the scene itself gets a Playwright smoke test in M8.
- [ ] 6. Stepper UI + store + URL sync
- [ ] 7. Cut-outs & handles in 3D, open-drawers toggle
- [ ] 8. Summary, CSV export, responsive polish, deploy

## Repo

https://github.com/SebastianDaszewski/bathroom-cabinet-configurator
