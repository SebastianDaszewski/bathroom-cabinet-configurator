# Vanity Cabinet Configurator — Functional Spec

A web configurator for a made-to-measure, wall-hung bathroom vanity cabinet
(two drawers, under a countertop basin). The user sets dimensions, materials,
drawers, fronts and handles, sees a live 3D model with dimensions, gets a price
with a breakdown, and can export a production cut list.

Reference analysed: fabrykamebli.pl product LWUNS2 (built on the commercial
Variantic SaaS player). We reproduce the **behaviour and rules**, not the code,
assets or branding.

---

## 1. Scope

### MVP

- Cabinet dimensions with constraints
- Materials and decors for carcass, fronts, drawer boxes
- Two drawers: runner type, length, siphon cut-out
- Fronts: standard / grip groove / edge handle; handle drilling
- Live 3D preview (parametric geometry, dimension labels, camera reset)
- Price engine with breakdown
- Cut list (panels with dimensions, material, edge banding) + CSV export
- Configuration shareable via URL; persisted in localStorage

### Later (only if time allows)

- Top rail thickening and extensions (left / right / front)
- Grain direction & continuous vertical grain across fronts
- PDF export of the order summary
- PBR textures, soft shadows, AR / screenshot

### Out of scope

- Cart, checkout, accounts, backend

---

## 2. Parameters

All lengths in millimetres (integers).

### 2.1 Carcass

| Param          | Type     | Range / values                | Default     |
| -------------- | -------- | ----------------------------- | ----------- |
| `width`        | int      | 500–1200                      | 600         |
| `height`       | int      | 400–600                       | 500         |
| `depth`        | int      | 390–700                       | 500         |
| `carcassBoard` | enum     | `chipboard`, `acrylic`, `mdf` | `chipboard` |
| `carcassDecor` | decor id | see §2.5                      | `grey-u732` |

### 2.2 Drawers (exactly 2: `top`, `bottom`)

| Param                 | Type     | Values                                    | Default                      |
| --------------------- | -------- | ----------------------------------------- | ---------------------------- |
| `runner`              | enum     | `tandem`, `blum`                          | `blum`                       |
| `opening`             | enum     | `blumotion` (soft close), `tip-on` (push) | `blumotion`                  |
| `drawer[i].length`    | enum     | 350, 400, 450                             | max allowed                  |
| `drawer[i].siphonCut` | bool     | —                                         | top: `true`, bottom: `false` |
| `siphonPosition`      | enum     | `center`, `custom`                        | `center`                     |
| `siphonOffset`        | int      | 200–236 (cut width, from the reference)   | 218                          |
| `siphonX`             | int      | cut-out centre from the left side (R11)   | 300                          |
| `drawerDecor`         | decor id |                                           | `white-w960`                 |

### 2.3 Fronts

| Param                 | Type     | Values                                        | Default     |
| --------------------- | -------- | --------------------------------------------- | ----------- |
| `frontBoard`          | enum     | `chipboard`, `acrylic`, `mdf`, `perfectsense` | `chipboard` |
| `frontDecor`          | decor id |                                               | `oak-h1145` |
| `frontType`           | enum     | `standard`, `grip-groove`, `edge-handle`      | `standard`  |
| `edgeHandleThickness` | int      | 1–4                                           | 2           |

### 2.4 Handle drilling

| Param            | Type | Values                     | Default  |
| ---------------- | ---- | -------------------------- | -------- |
| `handleDrilling` | enum | `none`, `single`, `double` | `none`   |
| `handleSpacing`  | int  | 32–480, step 32            | 128      |
| `handlePosition` | enum | `top-50`, `center`         | `center` |

### 2.5 Decors

Small fixed catalogue (6–10 entries) with: `id`, `name`, `code`, `color`
(hex for flat shading), optional `texture`, `boards` (which board types it is
available on), `pricePerM2Modifier`.

---

## 3. Rules (domain constraints)

Each rule lives in `domain/rules/` as a pure function and has unit tests.

| #   | Rule                                                                                                                                                                                                 |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1  | Dimensions are clamped to their ranges; non-integer input is rounded.                                                                                                                                |
| R2  | Allowed drawer lengths = `{350,400,450}` where `length <= depth - 40` (back panel + clearance). Min depth 390 → only 350; depth ≥ 490 → all three.                                                   |
| R3  | If the selected drawer length becomes invalid after a depth change, it falls back to the largest allowed one (and the UI shows why).                                                                 |
| R4  | `tip-on` and `handleDrilling != none` are mutually exclusive (push-to-open fronts have no handles). Same for `edge-handle` and `grip-groove` + drilling.                                             |
| R5  | `edge-handle`: each front height is reduced by `edgeHandleThickness`.                                                                                                                                |
| R6  | `handleSpacing` must be `<= width - 2*60` (handle fits on the front with margin); with `double` drilling each handle gets half the front: `<= width/2 - 2*60`. Options above the limit are disabled. |
| R7  | `double` handle drilling requires `width >= 800`.                                                                                                                                                    |
| R8  | Siphon cut-out width must leave ≥ 60 mm of drawer side on each side: `siphonOffset <= width - 2*18 - 120`.                                                                                           |
| R9  | A decor may only be selected for a board type it supports; changing the board resets an incompatible decor to the first compatible one.                                                              |
| R10 | Drawer front heights: the inner front gap is 3 mm, the two fronts split the height equally: `frontH = (height - 3) / 2` (minus R5).                                                                  |
| R11 | With `siphonPosition = custom`, `siphonX` is clamped so the cut-out keeps the R8 margin: `18 + 60 + siphonOffset/2 <= siphonX <= width - (18 + 60 + siphonOffset/2)`.                                |

Resolutions: in R4 the opening / front type wins and `handleDrilling` resets to
`none`; in R6 the spacing falls back to the largest multiple of 32 that fits; in
R10 an odd remainder goes to the top front (e.g. height 500 → 249 + 248). R8
cannot trigger with the current ranges and is kept as a guard. Drawer boxes are
always chipboard (R9 checks `drawerDecor` against it).

Rule violations never throw in the UI: the engine returns a **normalized
configuration + a list of adjustments/warnings** that the UI displays.

---

## 4. Derived model: panels (cut list)

`buildPanels(config) → Panel[]` — the single source of truth for both the 3D
scene and the cut list (geometry and production list can never diverge).

Assumptions: board thickness `t = 18`, drawer board 16 mm, back panel HDF 3 mm
nailed onto the back, fronts overlay the carcass with 2 mm gaps at the sides.
Drawer box height = front height − 70; the box sits 25 mm above its front's lower
edge. All construction constants live in `domain/constants.ts`.

| Panel            | Qty | Length × Width                                               | Material | Edge banding |
| ---------------- | --- | ------------------------------------------------------------ | -------- | ------------ |
| Side             | 2   | `height` × `depth`                                           | carcass  | front edge   |
| Bottom           | 1   | `width - 2t` × `depth`                                       | carcass  | front edge   |
| Top rail (front) | 1   | `width - 2t` × 100                                           | carcass  | front edge   |
| Top rail (back)  | 1   | `width - 2t` × 100                                           | carcass  | —            |
| Back             | 1   | `width - 2` × `height - 2`                                   | HDF 3 mm | —            |
| Drawer front     | 2   | `width - 4` × `frontH`                                       | front    | all 4        |
| Drawer bottom    | 2   | `width - 2t - runner.bottomDeduction` × `drawer.length - 10` | drawer   | —            |
| Drawer back      | 2   | `width - 2t - runner.backDeduction` × box height − 16        | drawer   | top          |
| Drawer side      | 4   | `drawer.length` × box height (tandem only)                   | drawer   | top          |

Runner specs (assumed): `blum` — metal sides, bottom −75, back −87; `tandem` —
wooden 16 mm sides with 5 mm clearance each, bottom and back −42.

`buildPanels` returns one `Panel` per physical piece (e.g. `side-left`,
`side-right`); the cut list merges identical pieces into rows with a quantity.

`Panel` = `{ id, name, material, board, decor, length, width, thickness,
edges: { l1, l2, w1, w2 }, axes, position, size, cutouts[] }`.

- Coordinates in mm: x → right, y → up, z → front; origin at the left, bottom,
  back corner of the carcass. `position` is the centre of the panel's box,
  `size` its extent per axis, `axes` the world axes of length, width and
  thickness. All panels are axis-aligned, so no rotation is needed.
- `l1`/`l2` are the two edges along the length, `w1`/`w2` along the width.
- `cutouts` are in panel coordinates (`u` along the length, `v` along the
  width, from the panel's minimum corner): handle holes Ø5 (two per handle,
  `handleSpacing` apart, at the front's centre or 50 mm from its top) and the
  siphon notch — 200 mm deep from the back edge of the drawer bottom, and in the
  drawer back from the top edge down to a 30 mm strip.

Cut list CSV: `;` separator, UTF-8 with BOM, CRLF (opens correctly in Excel
with a Polish locale). Columns: name, material, decor, length, width,
thickness, qty, edge banding (`D1 D2 S1 S2` — długość / szerokość), notes (cut-outs and holes).

---

## 5. Pricing

Cost-based, not hard-coded per size — `price(config) → { total, lines[] }`.

```
boards   = Σ panel area (m²) × board price/m² × decor modifier
edging   = Σ banded length (m) × edging price/m
hardware = runners × 2 + handles + Tip-On units
machining= siphon cut-outs + drilled holes
labour   = base + per-panel rate
total    = (boards + edging + hardware + machining + labour) × margin, rounded to 0.01
```

All rates live in one `pricing.config.ts`. Calibration target (sanity check
against the reference, not a copy): default config ≈ 1200–1250 PLN, width
500 → 1200 adds ≈ 0.4 PLN/mm, height ≈ 0.35 PLN/mm.

Implementation notes:

- `price(config, panels) → { total, lines[] }`, each line
  `{ category, label, quantity, unit, unitPrice, amount }`; `subtotals(lines)`
  sums the five categories for the breakdown.
- Money is integer grosze in the domain; the UI formats it as PLN.
- The margin is included in every line (each line rounded on its own) and
  `total` is the sum of the lines, so the breakdown always adds up.
- Boards are grouped by material + board + decor; drawer boxes (16 mm) have
  their own rate. Edge-handle profile is hardware, grip-groove milling is
  machining, both priced per metre of front.
- Rates are gross (VAT included), no separate VAT line.

The UI shows the total and an expandable breakdown (boards / edging / hardware /
machining / labour).

---

## 6. UI

- Left: stepper with tabs — **Dimensions → Materials & colours → Drawers →
  Fronts & handles → Summary**. Each numeric field = slider + number input.
- Centre: 3D view (orbit controls, dimension labels for W/H/D, camera reset,
  toggle "open drawers" to show siphon cut-outs).
- Right / bottom on mobile: price, breakdown, warnings from rules,
  buttons: _Copy link_, _Export cut list (CSV)_.
- Responsive down to 375 px; 3D view on top on mobile.
- The UI is in Polish, including every user-facing string produced by the
  domain (adjustment reasons, catalogue names, price lines, cut list). Code
  identifiers and docs stay in English. No i18n framework.
- Adjustments from `normalize()` are shown for the latest change only (or once
  after loading a link with invalid values) and can be dismissed.
- Configuration is kept in the URL (only fields that differ from the defaults,
  e.g. `?width=800&drawers.top.length=400`) and in localStorage; the URL wins on
  load.

---

## 7. Architecture

```
src/
  domain/          # pure TS, no React/Three — fully unit-tested
    schema.ts      # Zod schema + Config type + defaults
    rules/         # R1–R11, normalize(config) → { config, adjustments }
    panels.ts      # buildPanels(config) → Panel[]
    pricing.ts     # price(config, panels) → { total, lines }
    cutlist.ts     # panels → rows, CSV
    catalog.ts     # decors, boards, runners
  state/           # Zustand store: config, normalize on every update, URL sync
  scene/           # react-three-fiber: Panel → mesh, labels, camera
  features/        # stepper steps, summary, price panel
  ui/              # presentational components
```

Stack: Vite, React, TypeScript (strict), @react-three/fiber + drei, Zustand,
Zod, Vitest, Playwright (1–2 smoke tests), oxlint + Prettier.
Deploy: Vercel (or VPS).

Principles:

- Data flows one way: `input → normalize → panels → (scene | price | cutlist)`.
- The domain does not know React or Three exists.
- Every rule and the pricing formula are covered by unit tests.

---

## 8. Milestones (one PR each)

1. Scaffold: Vite + TS + lint + Vitest + CI, README, CLAUDE.md
2. Domain: schema, catalog, rules + tests
3. Panels + cut list + tests
4. Pricing + tests
5. 3D scene from panels (carcass, fronts, drawers, labels)
6. Stepper UI + store + URL sync
7. Cut-outs & handles in 3D, open-drawers toggle
8. Summary, CSV export, responsive polish, deploy
