# Bathroom Cabinet Configurator

Parametric 3D configurator for a made-to-measure, wall-hung bathroom vanity
cabinet. Set dimensions, materials, drawers, fronts and handles — get a live 3D
model, a price with a cost breakdown, and a production cut list.

> Work in progress. See [docs/spec.md](docs/spec.md) for the full functional spec
> and the milestone plan.

## Stack

Vite · React · TypeScript (strict) · Three.js via @react-three/fiber + drei ·
Zustand · Zod · Vitest · oxlint · Prettier

## Architecture

```
input → normalize (rules) → panels → 3D scene | price | cut list
```

- `src/domain/` — pure TypeScript: config schema, rules, panel builder,
  pricing, cut list. No React, no Three.js. Fully unit-tested.
- `src/state/` — store; every update goes through `normalize()`.
- `src/scene/` — renders the panels produced by the domain, never computes
  geometry on its own, so the 3D model and the cut list cannot diverge.
- `src/features/`, `src/ui/` — configurator steps and presentational components.

## Scripts

```bash
pnpm install
pnpm dev          # dev server
pnpm test         # unit tests
pnpm typecheck
pnpm lint
pnpm format
pnpm build
```
