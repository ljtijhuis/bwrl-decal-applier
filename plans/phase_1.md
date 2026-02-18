# Phase 1 Implementation Plan — Decal Applier Project Scaffold

## Context

The Broken Wing Racing League Decal Applier is a new project with only documentation in place. Phase 1 establishes the monorepo skeleton, developer tooling, a real-looking UI shell with working form state, a stubbed backend health endpoint, and the decal config schema. No image processing is implemented yet.

---

## Directory Layout

```
/
├── package.json              ← Root (npm workspaces)
├── tsconfig.base.json        ← Shared TS config
├── .eslintrc.cjs             ← Root ESLint config
├── .prettierrc               ← Prettier config
├── .gitignore                ← Updated
├── frontend/
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── index.html
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── types/config.ts   ← TypeScript types mirroring decals/config.json schema
│       ├── hooks/useConfig.ts ← Fetches /api/config, provides car model list
│       ├── components/
│       │   ├── FileUpload.tsx        ← Drag-and-drop + file picker (PNG/TGA ≤20MB)
│       │   ├── CarModelSelect.tsx    ← Dropdown from config
│       │   ├── DriverClassSelect.tsx ← Shown only when car needs class badge
│       │   └── ApplyButton.tsx       ← Disabled until file uploaded
│       └── __tests__/
│           ├── FileUpload.test.tsx
│           ├── CarModelSelect.test.tsx
│           ├── DriverClassSelect.test.tsx
│           └── App.test.tsx
├── backend/
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts           ← Express server entry
│       ├── routes/
│       │   ├── health.ts      ← GET /health
│       │   └── config.ts      ← GET /api/config (reads decals/config.json)
│       └── __tests__/
│           ├── health.test.ts
│           └── config.test.ts
└── decals/
    ├── config.json            ← Car model → decal placement config
    └── example/               ← Placeholder PNGs for initial testing
        ├── league-logo.png
        └── class-am.png
```

---

## Step-by-Step Implementation

### 1. Root package.json + npm workspaces

```json
{
  "name": "decal-applier",
  "private": true,
  "workspaces": ["frontend", "backend"],
  "scripts": {
    "dev": "concurrently \"npm run dev -w frontend\" \"npm run dev -w backend\"",
    "lint": "eslint .",
    "format": "prettier --write .",
    "test": "npm run test --workspaces --if-present"
  },
  "devDependencies": {
    "concurrently": "^9",
    "eslint": "^9",
    "@typescript-eslint/eslint-plugin": "^8",
    "@typescript-eslint/parser": "^8",
    "eslint-plugin-react": "^7",
    "eslint-plugin-react-hooks": "^5",
    "prettier": "^3",
    "typescript": "^5"
  }
}
```

### 2. Shared TypeScript base config (`tsconfig.base.json`)

Strict mode enabled. `target: ES2022`, `moduleResolution: bundler`.

### 3. ESLint + Prettier

- `.eslintrc.cjs`: TypeScript + React rules, no-unused-vars enforced
- `.prettierrc`: `singleQuote: true, semi: true, tabWidth: 2`

### 4. Frontend scaffold

- **Bootstrap**: `npm create vite@latest frontend -- --template react-ts` then adjust config
- **vite.config.ts**: proxy `/api` and `/health` to `http://localhost:3001`
- **Dependencies**: No extra UI library (plain HTML + CSS for Phase 1; can add later)
- **Test setup**: Vitest + `@testing-library/react` + jsdom

**Component behaviour:**

| Component | Behaviour |
|-----------|-----------|
| `FileUpload` | Drag-and-drop zone + fallback `<input type="file">`. Accepts `.png`, `.tga`. Rejects files >20 MB with an inline error. Shows filename after selection. |
| `CarModelSelect` | `<select>` populated from `GET /api/config`. Falls back to loading state while fetching. |
| `DriverClassSelect` | Rendered only when the selected car model has `classSpecific` in config. Options: AM, PRO-AM, PRO, ROOKIE. |
| `ApplyButton` | Disabled unless a file is selected AND (car has no class decals OR a driver class is selected). |
| `App` | Composes all components; holds form state as `useState`. |

**Unit tests (Vitest):** each component gets a test file covering:
- FileUpload: renders correctly, rejects oversized files, accepts valid types
- CarModelSelect: renders loading state, renders options from mock config
- DriverClassSelect: hidden when car has no class decals, shown when it does
- App: Apply button starts disabled, enabled after valid selection

### 5. Backend scaffold

- **Dependencies**: `express`, `cors`, `dotenv`; dev: `ts-node-dev`, `@types/express`, `@types/cors`
- **Test setup**: Jest + Supertest
- **`src/index.ts`**: Creates Express app, mounts routes, listens on `PORT` (default 3001)
- **`GET /health`**: Returns `{ status: "ok", timestamp: "<ISO string>" }`
- **`GET /api/config`**: Reads `decals/config.json` and returns a simplified structure for the UI: `{ carModels: { [id]: { label, hasClassDecals } } }`

**Integration tests (Jest + Supertest):**
- `/health` returns 200 with correct body
- `/api/config` returns 200 with valid structure matching the config file

### 6. `decals/config.json`

Populate with two example car models:
- `ferrari-296-gt3` — has class-specific decals
- `porsche-911-gt3-r` — base decals only (no class badges)

Decal entries reference placeholder PNG files under `decals/example/`.

### 7. Placeholder decal PNGs

Create two minimal 1×1 transparent PNGs (or small, clearly labelled placeholder images) in `decals/example/`:
- `league-logo.png`
- `class-am.png`

These are just scaffolding; real assets come in Phase 3.

---

## Critical Files

| File | Purpose |
|------|---------|
| `/package.json` | Workspace root, shared scripts |
| `/tsconfig.base.json` | Shared strict TS config |
| `/.eslintrc.cjs` | Shared lint rules |
| `/frontend/src/App.tsx` | Root component, form state |
| `/frontend/src/components/FileUpload.tsx` | Upload UX |
| `/frontend/src/components/CarModelSelect.tsx` | Car dropdown |
| `/frontend/src/components/DriverClassSelect.tsx` | Class selector |
| `/frontend/src/hooks/useConfig.ts` | Fetches backend config |
| `/backend/src/index.ts` | Express entry point |
| `/backend/src/routes/health.ts` | /health endpoint |
| `/backend/src/routes/config.ts` | /api/config endpoint |
| `/decals/config.json` | Single source of truth for car models |

---

## Testing (Definition of Done — 80%+ coverage required)

### Frontend (Vitest + @testing-library/react)

| File | Tests |
|------|-------|
| `FileUpload.test.tsx` | Renders correctly; rejects files > 20 MB with error; rejects non-PNG/TGA with error; accepts valid PNG/TGA; calls `onFileChange` callback |
| `CarModelSelect.test.tsx` | Shows loading state while config loading; renders option per car model from mock config; calls `onChange` on selection |
| `DriverClassSelect.test.tsx` | Hidden when `hasClassDecals=false`; visible when `hasClassDecals=true`; renders all 4 class options; calls `onChange` |
| `App.test.tsx` | Apply button disabled initially; disabled when file selected but class not chosen (class-required car); enabled once both file and class selected; enabled immediately when car has no class decals |
| `useConfig.test.ts` | Returns loading state on mount; returns parsed config on success; returns error state on fetch failure |

Coverage target: all branches of file-type validation, class-conditional logic, and button-enabled logic.

### Backend (Jest + Supertest)

| File | Tests |
|------|-------|
| `health.test.ts` | `GET /health` returns 200; body has `status: "ok"` and `timestamp` string |
| `config.test.ts` | `GET /api/config` returns 200; body has `carModels` with correct ids and labels; `hasClassDecals` is `true` for Ferrari, `false` for Porsche; returns 500 if config file missing |

### E2E (Playwright — Phase 1 scope)

A minimal smoke test confirming the UI renders and the Apply button state transitions work. Full E2E (upload → download) is deferred to Phase 2 when backend processing exists.

- App loads without console errors
- Car model dropdown populates from backend
- Driver class appears/disappears on car model switch
- Apply button disabled/enabled state correct

---

## Documentation Updates (Definition of Done)

All three docs must be updated as part of Phase 1:

| File | What to update |
|------|---------------|
| `README.md` | Add local dev setup: prerequisites (Node 20+, npm 10+), `npm install`, `npm run dev`, open `http://localhost:5173` |
| `ARCHITECTURE.md` | Confirm/update the monorepo layout, npm workspaces approach, Vite proxy config, config-driven car model list, `/api/config` endpoint role |
| `CONTRIBUTING.md` | Add: tooling setup commands, how to run tests (`npm test --workspaces`), lint/format commands, how to add a car model to config.json |

---

## Verification

1. `npm install` at root — installs all workspaces
2. `npm run dev` — starts both frontend (port 5173) and backend (port 3001)
3. Open browser at `http://localhost:5173`:
   - Upload zone renders; accepts PNG/TGA, rejects other types
   - Car model dropdown shows two options (Ferrari, Porsche)
   - Driver class dropdown appears when Ferrari selected, hidden for Porsche
   - Apply button disabled until file selected
4. `curl http://localhost:3001/health` returns `{"status":"ok",...}`
5. `curl http://localhost:3001/api/config` returns car model config
6. `npm test` — all unit and integration tests pass
7. `npm run lint` — no lint errors
