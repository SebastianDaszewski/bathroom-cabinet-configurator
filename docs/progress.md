# Progress

Working log for the milestones in [spec.md](spec.md): what was built, which
decisions were made and why. Updated at the end of every milestone.

## Context

- A non-trivial configurator meant to show how the project is structured and
  whether it stays maintainable. Code quality, architecture, tests and a clean
  git history matter more than the number of features.
- Price targets (market level for a 600 × 500 × 500 mm vanity with two drawers):
  ≈ 1236 PLN by default, ≈ 0.40 PLN per mm of width, ≈ 0.35 PLN per mm of
  height, ≈ 44 PLN for a siphon cut-out. The pricing is a cost-based model
  calibrated to these targets; tests check ranges, not exact amounts.
- Construction values are assumptions (18 mm board, 3 mm gap between fronts,
  40 mm depth clearance, margins in R6–R13). They live in
  `src/domain/constants.ts` and can be changed in one place.

## Workflow

- The owner commits, pushes and merges. Branch names, commits and PR titles in
  English.
- Ask before using the `frontend-design` plugin for UI/styling work.
- The UI is in Polish; code identifiers and docs in English.
- Show a plan before each milestone; small PRs, one milestone each.

## Milestones

- [x] **1. Scaffold** — Vite + React 19 + TS strict, R3F + drei, Zustand, Zod,
      Vitest, oxlint, Prettier, GitHub Actions CI, README, CLAUDE.md.
- [x] **2. Domain** — `schema.ts` (Zod, defaults, lenient `parseConfig`),
      `catalog.ts`, `constants.ts`, rules in `domain/rules/` with `normalize()`
      and `allowed*` helpers for the UI. Tests include idempotency of
      `normalize()` over a grid of extreme configs.
      Decisions: R4 — opening / front type win, drilling resets to `none`;
      R10 — an odd millimetre goes to the top front; R6 — spacing falls back
      to the largest multiple of 32 that fits; drawer boxes are always
      chipboard.
- [x] **3. Panels + cut list** — `buildPanels` returns one axis-aligned `Panel`
      per physical piece (centre + size in mm); `cutlist.ts` merges identical
      pieces and writes CSV (`;`, UTF-8 BOM, CRLF for Excel). Invariant tests
      over 72 configs: whole millimetres, nothing outside the cabinet, no
      overlapping panels, holes inside their panel.
      Decisions: Tandem drawers get wooden sides; R6 extended for double
      handles (each handle gets half the front).
- [x] **4. Pricing** — `pricing.config.ts` (all rates), `price(config, panels)`,
      `subtotals`. Integer grosze, margin inside every line, total = sum of
      lines, so the breakdown always adds up.
- [x] **5. 3D scene** — pure helpers in `scene/geometry.ts` (mm → m, centring,
      dimension guides, camera fit) + R3F components. Dimension labels are DOM
      elements projected each frame (drei `Html` lost a label under
      StrictMode). The scene is lazy-loaded, so Three.js is a separate chunk.
- [x] **6. Stepper UI + store + URL sync** — Polish UI. Vanilla Zustand store
      (every update goes through `normalize`, keeps the latest adjustments),
      URL encode/decode of non-default fields, localStorage (URL wins).
      Controls: NumberField (slider + text input committed on blur/Enter),
      ChoiceField, Toggle, DecorPicker. Visual direction: cool bathroom stone +
      tile-glaze teal, Bricolage Grotesque + Instrument Sans.
- [x] **7. Cut-outs & handles in 3D** — every panel is an `ExtrudeGeometry`
      from `panelOutline` (Ø5 handle holes are real holes), placed by
      `panelMatrix` (mirrored bases flipped so faces stay outward). Hardware
      drawn in the scene only: bar handles, edge profile, grip groove, metal
      drawer sides, siphon tray. Drawers open with a button.
      Corrections during review: no back panel (a vanity is open at the back
      for the pipes); siphon cut-out reworked — the drawer bottom stays whole,
      the drawer back gets a gap for the pipe (two pieces) and a shallow tray
      sits in front of it; the cut-out is off by default.
- [x] **8. Countertop** — a full top panel on the carcass, covering the fronts
      (`depth + 18 + 5`), with thickening (second glued board, 36 mm) and
      left / right / front extensions; R12 caps the length at one board
      (2800 mm). `cabinetBounds` drives the scene centre, camera fit and
      invariants. Glued boards share a `glueGroup` and are edge-banded once.
      Also: drawers open individually on click (a drag orbits instead),
      configurable siphon cut-out size (R8, R13), confirmation before reset.
- [x] **9. Look, grain & details** — procedural seamless textures
      (`scene/noise.ts`, tested for tiling) tinted by the decor colour and
      oriented by `Panel.grain`; no outlines; 1 mm rounded edges; studio
      lighting + contact shadow. Domain: side / front grain, continuous grain
      (R14), grain column in the cut list, drawer-bottom decor, front type
      `edge-handle-ready`.
- [x] **10. Summary, CSV, mobile, Playwright** — summary step with the
      configuration, cut list table, CSV download, copy link. Mobile: 3D view
      on top, sticky price bar. Playwright smoke tests on desktop and 375 px;
      separate `e2e` CI job.
- [x] **10b. Summary extras** — price change next to every option and summary
      row (`priceDelta`: normalized price with the option minus without it, so
      rule side effects are included); "?" hints; inquiry form (Zod-validated,
      opens the mail client, no backend); native share; camera views, PNG
      snapshot with dimension labels, fullscreen. Perf: the canvas renders on
      demand and the contact shadow is computed once per shape — e2e tests went
      from ~25 s to 1–5 s each.
- [x] **Deploy** — Vercel, imported from the GitHub repo (every PR gets a
      preview URL): https://bathroom-cabinet-configurator.vercel.app.
- [x] **Polish** — repository cleanup, architecture guide, agent workflow
      notes, enforced module boundaries, coverage thresholds.

## Repo

https://github.com/SebastianDaszewski/bathroom-cabinet-configurator
