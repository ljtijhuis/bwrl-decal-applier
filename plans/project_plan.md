# Broken Wing Racing League — Decal Applier: Multi-Phase Implementation Plan

## Context

League members currently apply decals manually in image editing software before uploading to Trading Paints. This is error-prone and requires onboarding support for new members. The goal is a simple, anonymous web app where a user uploads their livery (PNG, TGA or PSD), selects their car model and driver class, and downloads a finished livery with decals composited in.

**Key decisions locked in:**

- Stack: React (Vite) frontend + Node.js (Express) backend, Sharp for image compositing
- Input formats: PNG and TGA (PSD deferred to backlog)
- Auth: None — fully anonymous, no accounts
- Decal assets: PNG files bundled in the repo, placement rules in a JSON config
- Decal placement is the same for all decals, the templates used are just different
- Output: PNG (compatible with Trading Paints for livery uploads)
- No Trading Paints API (none exists), no Google Drive integration (not needed)

---

## Progress tracker

[x] Phase 1
[ ] Phase 2
[ ] Phase 3
[ ] Phase 4
[ ] Phase 5

---

## Phase 1: Project Scaffold

**Goal:** Establish the monorepo structure, tooling, and a functional UI shell with no backend logic yet.

### Checklist

- [ ] Create monorepo layout:
  ```
  /
  ├── frontend/   (Vite + React + TypeScript)
  ├── backend/    (Node.js + Express + TypeScript)
  └── decals/     (PNG assets + placement config JSON)
  ```
- [ ] Configure shared tooling: ESLint, Prettier, TypeScript
- [ ] Frontend: Build the main UI
  - [ ] Livery file upload (drag-and-drop + file picker, accepts PNG and TGA)
  - [ ] Car model selector (dropdown populated from config)
  - [ ] Driver class selector (AM / PRO-AM / PRO / ROOKIE, only shown when relevant)
  - [ ] "Apply Decals" button (disabled until upload complete)
- [ ] Stub the backend with a `/health` endpoint
- [ ] Add `decals/config.json` schema (car model → decal entries with file path)
- [ ] Add a few example decal PNGs to `decals/` for initial testing

**Deliverable:** Running app with a real-looking UI and working form state, but no image processing yet.

---

## Phase 2: Core Image Compositing

**Goal:** End-to-end flow works — upload livery, get back a composited PNG.

### Checklist

- [ ] Backend `/api/apply` endpoint:
  - [ ] Accept multipart/form-data: `livery` (PNG or TGA), `carModel`, `driverClass`
  - [ ] Validate file type, file size, and known car model
  - [ ] Load correct decal PNGs from `decals/` based on car model + driver class
  - [ ] Use **Sharp** to composite decals onto livery (same dimensions, full-canvas overlay, decal in front)
  - [ ] Return resulting PNG as a file download
- [ ] Add `multer` for file upload handling
- [ ] Wire up frontend to POST to `/api/apply` and trigger browser file download on success
- [ ] Error handling: user-friendly messages for invalid files or unsupported car models

**Deliverable:** Full user flow works end-to-end for at least one car model.

---

## Phase 3: Full Car & Decal Configuration

**Goal:** All supported car models and decal variants are configured and working.

### Checklist

- [ ] Populate `decals/config.json` with all car models and driver classes
- [ ] Add all decal PNG assets to `decals/`
- [ ] Handle cars that don't use driver class badges
- [ ] Validate each car model end-to-end (one test per car)
- [ ] UI car model list driven entirely by config (no hardcoding)

**Deliverable:** All league-supported cars produce correct composited liveries.

---

## Phase 4: UX Polish & Open-Source Readiness

**Goal:** App is presentable, robust, and easy for contributors to run locally.

### Checklist

- [ ] Frontend polish:
  - [ ] Before/after preview (livery thumbnail → composited result)
  - [ ] Loading spinner during compositing
  - [ ] Clear error messages for invalid/oversized files
  - [ ] Note to user on Trading Paints upload format
- [ ] Input hardening: max upload size (20 MB), reject invalid formats on frontend and backend
- [ ] Docker Compose setup (`frontend` + `backend` services)
- [ ] `README.md`: what it does, how to run locally, how to add a new car model
- [ ] Update `CLAUDE.md` with build/run/lint commands

**Deliverable:** Production-ready app with contributor-friendly setup.

---

## Phase 5: Deployment

**Goal:** App is publicly accessible for league members.

### Checklist

- [ ] Choose hosting: Railway (simplest) → Render → Fly.io
- [ ] Configure environment variables (none expected yet, but set up the structure)
- [ ] GitHub Actions CI: lint + type-check on PRs
- [ ] Custom domain (if league has one)

**Deliverable:** App is live at a public URL.

---

## Future / Optional Phases (Backlog)

These are out of scope for the initial build but worth noting:

- **iRacing OAuth login**: Let users log in with their iRacing account to pre-fill car model based on their registered vehicles (iRacing Data API has OAuth 2.0)
- **PSD livery input**: Flatten PSD layers using `@webtoon/psd` before passing to Sharp
- **Admin decal management UI**: Upload/update decal assets through a web UI instead of repo commits
- **TGA output**: If Trading Paints ever requires TGA instead of PNG for full liveries
- **Trading Paints direct upload**: Currently no public API exists; revisit if they release one

---

## Config Schema (Reference)

```json
{
  "carModels": {
    "ferrari-296-gt3": {
      "label": "Ferrari 296 GT3",
      "decals": {
        "base": [
          { "file": "league-logo.png", "x": 100, "y": 200, "width": 150, "height": 80 },
          { "file": "sponsor-banner.png", "x": 300, "y": 400, "width": 200, "height": 50 }
        ],
        "classSpecific": {
          "AM": [{ "file": "class-am.png", "x": 50, "y": 50, "width": 60, "height": 60 }],
          "PRO-AM": [{ "file": "class-proam.png", "x": 50, "y": 50, "width": 60, "height": 60 }],
          "PRO": [{ "file": "class-pro.png", "x": 50, "y": 50, "width": 60, "height": 60 }],
          "ROOKIE": [{ "file": "class-rookie.png", "x": 50, "y": 50, "width": 60, "height": 60 }]
        }
      }
    }
  }
}
```

---

## Verification Strategy

Each phase can be verified independently:

- **Phase 1**: `npm run dev` spins up both frontend and backend; UI renders with all form controls
- **Phase 2**: Upload test liveries in PNG and TGA formats → download button appears → resulting PNG has decal composited correctly (inspect visually)
- **Phase 3**: Test one livery per car model; check each driver class badge variant
- **Phase 4**: Run via Docker Compose from a fresh clone; confirm it works without manual setup
- **Phase 5**: Hit the public URL with a livery and verify the download works end-to-end
