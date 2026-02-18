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
  │  multipart/form-data: { livery (PNG|TGA), carModel, driverClass }
  │
  ▼
Express (backend)
  │
  ├── multer — receives and buffers the uploaded file
  ├── validation — file type, file size, known car model
  ├── config lookup — reads decals/config.json to find decal files + placement
  ├── Sharp — composites decal PNG(s) onto livery
  │           • TGA input is decoded by Sharp before compositing
  │           • all images share the same canvas dimensions
  │           • decals are layered on top (base decals first, class badge last)
  └── response — PNG file streamed back as Content-Disposition: attachment
```

## Key components

### Frontend (`frontend/`)

Built with Vite, React, and TypeScript.

- **Upload form** — drag-and-drop or file picker; validates type (PNG/TGA) and size (≤ 20 MB) on the client before submission
- **Car model selector** — dropdown populated from `decals/config.json` at app startup (or bundled at build time)
- **Driver class selector** — shown only when the selected car model has class-specific decals
- **Apply button** — POSTs to `/api/apply`, then triggers a browser download of the returned PNG *(Phase 2)*
- **Preview** — shows a thumbnail of the uploaded livery before submission and the composited result after *(Phase 4)*

### Backend (`backend/`)

Built with Node.js, Express, and TypeScript.

| Route | Purpose |
|-------|---------|
| `GET /health` | Liveness check — returns `{ status: "ok", timestamp }` |
| `GET /api/config` | Returns `{ carModels: { [id]: { label, hasClassDecals } } }` |
| `POST /api/apply` | Accepts livery upload, returns composited PNG *(Phase 2)* |

**Image compositing** uses Sharp:
- TGA files are decoded to a raw buffer before being passed to Sharp
- Decals are composited in order: base decals first, then the class-specific badge
- Output is always PNG regardless of input format

### Decal assets (`decals/`)

Static PNG files checked into the repository alongside a JSON configuration file that describes placement rules.

#### `decals/config.json` schema

```json
{
  "carModels": {
    "<car-id>": {
      "label": "Human-readable name shown in the UI",
      "decals": {
        "base": [
          {
            "file": "relative path to PNG inside decals/",
            "x": 0,
            "y": 0,
            "width": 150,
            "height": 80
          }
        ],
        "classSpecific": {
          "AM":     [{ "file": "class-am.png",    "x": 50, "y": 50, "width": 60, "height": 60 }],
          "PRO-AM": [{ "file": "class-proam.png", "x": 50, "y": 50, "width": 60, "height": 60 }],
          "PRO":    [{ "file": "class-pro.png",   "x": 50, "y": 50, "width": 60, "height": 60 }],
          "ROOKIE": [{ "file": "class-rookie.png","x": 50, "y": 50, "width": 60, "height": 60 }]
        }
      }
    }
  }
}
```

Cars that don't use class badges omit the `classSpecific` key entirely.

## Technology choices

| Concern | Choice | Reason |
|---------|--------|--------|
| Frontend framework | React + Vite | Widely known, easy to contribute to |
| Backend runtime | Node.js + Express | Shares TypeScript toolchain with frontend; large ecosystem |
| Image compositing | Sharp | Fast, well-maintained; native support for PNG and TGA input |
| Monorepo tooling | npm workspaces | Zero extra tooling; works with standard Node |
| Containerisation | Docker Compose | Reproducible local setup without installing Node globally |

## Design decisions

- **No authentication** — the app is fully anonymous. No user data is stored; the livery file exists only in memory during processing.
- **No Trading Paints API** — no public API exists. The output is a downloadable PNG the user uploads manually.
- **Decals in the repo** — keeping assets in version control avoids runtime dependencies on external storage. Adding a new car model is a pull request, not an admin UI action.
- **PSD input deferred** — PSD flattening (`@webtoon/psd`) is in the backlog; the initial release handles PNG and TGA only.

## Testing strategy

See [CONTRIBUTING.md](CONTRIBUTING.md) for how to run tests. The target is **80%+ coverage** across unit, integration, and end-to-end layers:

- **Unit** — image compositing logic, config parsing, file-type validation
- **Integration** — Express route tests with real Sharp calls against fixture images
- **E2E** — browser-level tests for the full upload → download flow (Playwright)