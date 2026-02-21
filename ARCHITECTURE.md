# Architecture

## Overview

The Decal Applier is a monorepo containing a React frontend, a Node.js/Express backend, and a directory of static decal assets. The backend receives a livery image and composites the appropriate decal PNGs on top of it using [Sharp](https://sharp.pixelplumbing.com), then streams the result back to the browser as a PNG download.

```
/
├── frontend/   # Vite + React + TypeScript — user interface
├── backend/    # Node.js + Express + TypeScript — image processing API
└── decals/     # PNG decal assets + placement config JSON
```

## Data flow

```
Browser
  │
  │  POST /api/apply
  │  multipart/form-data: { livery (PNG|TGA|PSD), carModel, driverClass }
  │
  ▼
Express (backend)
  │
  ├── multer — receives and buffers the uploaded file
  ├── validation — file type, file size, known car model
  ├── config lookup — reads decals/config.json to find decal files + placement
  ├── Sharp — composites decal PNG(s) onto livery
  │           • PSD input is flattened by @webtoon/psd before compositing
  │           • TGA input is decoded to raw RGBA before being passed to Sharp
  │           • all images share the same canvas dimensions
  │           • decals are layered on top (base decals first, class badge last)
  └── response — PNG file streamed back as Content-Disposition: attachment
```

## Key components

### Frontend (`frontend/`)

Built with Vite, React, and TypeScript.

- **Instructions** — interactive step-by-step checklist at the top of the page; covers the full workflow from finding the base livery TGA through uploading to Trading Paints; checkboxes are session-local state only
- **Sponsors** — static display-only section rendered below the main tool content; lists league sponsors with logo, name, and external link; sponsor data is a typed `Sponsor[]` array defined directly in `frontend/src/components/Sponsors.tsx` — no API or backend involvement; to add or remove sponsors, edit the `SPONSORS` array in that file
- **Upload form** — drag-and-drop or file picker; validates type (PNG/TGA/PSD) and size (≤ 20 MB) on the client before submission
- **Car model selector** — dropdown grouped by series (`GT3 Sprint`, `BWEC`, `Falken`) using `<optgroup>` elements, populated from `/api/config` at app startup
- **Driver class selector** — shown only when the selected car model has class-specific decals
- **Apply button** — POSTs to `/api/apply`, then triggers a browser download of the returned PNG *(Phase 2)*
- **LiveryPreview** — displays a before/after view: a thumbnail of the uploaded livery (PNG files only; TGA and PSD show a placeholder) and, once compositing completes, the resulting PNG alongside a note on how to upload to Trading Paints *(Phase 4)*

### Backend (`backend/`)

Built with Node.js, Express, and TypeScript.

| Route | Purpose |
|-------|---------|
| `GET /health` | Liveness check — returns `{ status: "ok", timestamp }` |
| `GET /api/config` | Returns `{ carModels: { [id]: { label, group, hasClassDecals } } }` |
| `POST /api/apply` | Accepts livery upload, returns composited PNG *(Phase 2)* |

**Image compositing** uses Sharp:
- PSD files are flattened by `@webtoon/psd` (all visible layers composited to a single RGBA buffer) before being passed to Sharp
- TGA files are decoded to raw RGBA before being passed to Sharp
- Decals are composited in order: base decals first, then the class-specific badge
- Output is always PNG regardless of input format

### Brand assets (`frontend/public/`)

Static files served directly by Vite (development) and the web server (production).

| File/directory | Contents |
|----------------|----------|
| `bwrl-logo.png` | BWRL circular badge; used in the page header and as the browser favicon |
| `sponsors/` | Logo PNGs for each league sponsor; referenced by the `SPONSORS` array in `Sponsors.tsx` |

### Decal assets (`decals/`)

Static PNG files checked into the repository alongside a JSON configuration file that describes placement rules.

#### `decals/config.json` schema

```json
{
  "carModels": {
    "<car-id>": {
      "label": "Human-readable name shown in the UI",
      "group": "Series name used to group cars in the dropdown (GT3 Sprint | BWEC | Falken)",
      "decals": {
        "base": [
          {
            "file": "relative path to PNG inside decals/ (lowercase-with-dashes)",
            "x": 0,
            "y": 0,
            "width": 2048,
            "height": 2048
          }
        ],
        "classSpecific": {
          "AM":     [{ "file": "gt3-am/<car-name>.png",     "x": 0, "y": 0, "width": 2048, "height": 2048 }],
          "PRO-AM": [{ "file": "gt3-proam/<car-name>.png",  "x": 0, "y": 0, "width": 2048, "height": 2048 }],
          "PRO":    [{ "file": "gt3-pro/<car-name>.png",    "x": 0, "y": 0, "width": 2048, "height": 2048 }],
          "ROOKIE": [{ "file": "gt3-rookie/<car-name>.png", "x": 0, "y": 0, "width": 2048, "height": 2048 }]
        }
      }
    }
  }
}
```

All decal PNGs are **2048×2048 full-canvas overlays** — the same dimensions as a standard iRacing livery. Placement is always `x: 0, y: 0, width: 2048, height: 2048`. Cars that don't use class badges omit the `classSpecific` key entirely. GT3 Sprint cars use only `classSpecific` entries and set `"base": []`.

**Decal asset directories** (all lowercase-with-dashes):

| Directory | Contents |
|-----------|----------|
| `bwec-gt3/` | Base overlays for BWEC GT3 cars (11 cars) |
| `bwec-gtp/` | Base overlays for BWEC GTP cars (5 cars) |
| `gt3-am/` | AM class badges for GT3 Sprint (11 cars) |
| `gt3-proam/` | PRO-AM class badges for GT3 Sprint (11 cars) |
| `gt3-pro/` | PRO class badges for GT3 Sprint (11 cars) |
| `gt3-rookie/` | Rookie class badges for GT3 Sprint (11 cars) |
| `falken-gt4/` | Base overlays for Falken GT4 cars (6 cars) |
| `falken-lmp3/` | Base overlay for Falken LMP3 car (1 car) |
| `example/` | Tiny placeholder PNGs used in compositor unit tests |

Files within each directory are named `{car-name}.png` in kebab-case (e.g. `ferrari-296-gt3.png`), without series or class suffixes — the directory provides that context.

## Technology choices

| Concern | Choice | Reason |
|---------|--------|--------|
| Frontend framework | React + Vite | Widely known, easy to contribute to |
| Backend runtime | Node.js + Express | Shares TypeScript toolchain with frontend; large ecosystem |
| Image compositing | Sharp | Fast, well-maintained; native support for PNG input |
| PSD flattening | @webtoon/psd | Zero-dependency WebAssembly PSD parser; composites all visible layers to RGBA before Sharp |
| Monorepo tooling | npm workspaces | Zero extra tooling; works with standard Node |
| Containerisation | Docker Compose | Reproducible local setup without installing Node globally |

## Design decisions

- **No authentication** — the app is fully anonymous. No user data is stored; the livery file exists only in memory during processing.
- **No Trading Paints API** — no public API exists. The output is a downloadable PNG the user uploads manually.
- **Decals in the repo** — keeping assets in version control avoids runtime dependencies on external storage. Adding a new car model is a pull request, not an admin UI action.
- **PSD input supported** — PSD layers are flattened using `@webtoon/psd` before compositing with Sharp. The output is always PNG.

## Testing strategy

See [CONTRIBUTING.md](CONTRIBUTING.md) for how to run tests. The target is **80%+ coverage** across unit, integration, and end-to-end layers:

- **Unit** — image compositing logic, config parsing, file-type validation
- **Integration** — Express route tests with real Sharp calls against fixture images
- **E2E** — browser-level tests for the full upload → download flow (Playwright)