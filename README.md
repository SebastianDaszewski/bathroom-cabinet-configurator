# Bathroom Vanity Configurator

A configurator for a made-to-measure, wall-hung bathroom vanity with two drawers
and a countertop for a vessel basin. The customer sets dimensions, materials,
drawers, fronts and handles; the app shows a live 3D model, a cost-based price
with a breakdown, and a production cut list that can be downloaded as CSV.

**Live demo:** _added after the first Vercel deployment_

The UI is in Polish (the target market); code and documentation are in English.

## What it does

- **Dimensions** — carcass 500–1200 × 400–600 × 390–700 mm; countertop with
  optional thickening (36 mm) and left / right / front extensions.
- **Materials** — board type and decor for carcass, fronts, drawer boxes and
  drawer bottoms; grain direction for sides and fronts, optional continuous
  grain across both fronts.
- **Drawers** — concealed (Tandem) or metal-box (Blum) runners, soft-close or
  push-to-open, three lengths limited by depth, a siphon cut-out of
  configurable size and position.
- **Fronts and handles** — plain, milled grip, edge handle (with or without
  the profile); single or double handle drilling with standard 32 mm spacing.
- **3D view** — built from the same panel list as the cut list; procedural
  wood / concrete / laminate textures oriented by grain; drawers open on click.
- **Price** — boards by area, edge banding by length, hardware, machining and
  labour, margin included per line, so the breakdown always adds up.
- **Rules** — invalid combinations are corrected, never rejected: the app
  explains each automatic change ("drawer shortened to 400 mm because…").
- **Price per option** — every choice and every summary row shows what it
  adds or saves, computed from the real price engine, not a lookup table.
- **Summary** — grouped configuration, cut list, CSV download, an inquiry form
  that opens the mail client with the configuration and link (no backend; set
  `INQUIRY_EMAIL` in `src/features/inquiry/inquiry.ts`), sharing.
- **3D tools** — camera views, PNG snapshot, fullscreen, drawers open on click.
- **Sharing** — the configuration lives in the URL and in localStorage.

## Architecture

```
user input ─▶ normalize (rules R1–R14) ─▶ buildPanels ─┬─▶ 3D scene
                                                        ├─▶ price
                                                        └─▶ cut list / CSV
```

- `src/domain/` — pure TypeScript, no React or Three.js: config schema (Zod),
  catalogue, rules, panel builder, pricing, cut list. Every rule returns a
  corrected config plus a list of adjustments; nothing throws.
- `src/scene/` — React Three Fiber. Renders `Panel[]` from the domain and never
  invents geometry, so the 3D model and the cut list cannot diverge. Mapping,
  texture and hardware maths live in pure, tested helpers.
- `src/state/` — Zustand store; every update goes through `normalize()`; URL and
  localStorage sync.
- `src/features/`, `src/ui/` — stepper, price panel, summary; presentational
  controls.

The functional spec, rules and assumptions are in [docs/spec.md](docs/spec.md);
the decision log per milestone is in [docs/progress.md](docs/progress.md).

## Running locally

Requires Node 24 and pnpm 10.

```bash
pnpm install
pnpm dev            # http://localhost:5173
```

| Command          | What it does                                   |
| ---------------- | ---------------------------------------------- |
| `pnpm test`      | Unit tests (Vitest) — domain, state, scene     |
| `pnpm test:e2e`  | Smoke tests (Playwright) on desktop and 375 px |
| `pnpm typecheck` | TypeScript, strict                             |
| `pnpm lint`      | oxlint                                         |
| `pnpm format`    | Prettier                                       |
| `pnpm build`     | Production build                               |

The first `pnpm test:e2e` needs a browser: `pnpm exec playwright install chromium`.

## Testing

- Every rule, the panel builder, pricing, cut list, URL encoding and the scene
  helpers have unit tests next to the code.
- Invariant tests run the panel builder over a grid of extreme configurations:
  whole-millimetre sizes, nothing outside the cabinet, no overlapping panels,
  holes inside their panel.
- Pricing tests check calibration ranges against the reference shop instead of
  exact amounts, so tuning a rate does not break them.
- Playwright covers loading, a price update, the CSV download, the reset
  confirmation, option prices and hints, inquiry validation, camera views and
  the mobile layout.
- CI runs lint, formatting, types, unit tests and the build, plus a separate
  Playwright job.

## Assumptions

The option set and price level follow a real made-to-measure vanity
configurator (fabrykamebli.pl, product LWUNS2); no code, assets or branding
were taken from it. Construction values that the reference does not show —
board thickness, gaps, clearances, drawer box sizes, rates — are our own and
are listed in `src/domain/constants.ts` and `src/domain/pricing.config.ts`.
