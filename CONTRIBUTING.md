# Contributing

Thanks for your interest in contributing to the Broken Wing Racing League Decal Applier. This guide covers everything you need to get the project running locally, make changes, and submit them.

## Prerequisites

- [Node.js](https://nodejs.org) 20 or later (Node 24 recommended; the repo ships a `.nvmrc` for nvm users)
- [npm](https://www.npmjs.com) 10 or later (bundled with Node 20+)
- [Docker](https://www.docker.com) and Docker Compose (optional, for the containerised setup)
- [Git](https://git-scm.com)

## Installation

```bash
git clone https://github.com/broken-wing-racing/decal-applier.git
cd decal-applier
npm install
```

`npm install` at the root installs dependencies for both `frontend/` and `backend/` via npm workspaces.

## Running the app locally

### Option A — Docker Compose (recommended for a clean environment)

```bash
docker compose up
```

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3001`

### Option B — directly with Node

From the repo root, `npm run dev` starts both services in parallel via `concurrently`:

```bash
npm run dev
```

Or start them separately:

```bash
# Terminal 1
npm run dev --workspace=backend    # http://localhost:3001

# Terminal 2
npm run dev --workspace=frontend   # http://localhost:5173
```

## Running tests

### All tests

```bash
npm test --workspaces
```

### Backend tests only (Jest + Supertest)

```bash
npm test --workspace=backend
```

### Frontend unit tests only (Vitest + Testing Library)

```bash
npm test --workspace=frontend
```

### End-to-end tests (Playwright)

E2E tests require the full app to be running first:

```bash
npm run dev                          # start the app
npm run test:e2e --workspace=frontend  # run Playwright tests
```

### Coverage report

```bash
npm run test:coverage --workspace=frontend
npm run test:coverage --workspace=backend
```

We target **80%+ coverage** across unit, integration, and E2E tests. Pull requests that drop coverage below this threshold will need to include additional tests.

## Code style

Formatting and linting are enforced by [ESLint](https://eslint.org) and [Prettier](https://prettier.io). Run them before pushing:

```bash
npm run lint --workspaces
npm run format --workspaces
```

Both are checked in CI, so a failing lint means a failing PR.

TypeScript is used throughout. Avoid `any`; use proper types or `unknown` where the type is genuinely unknown.

## Project structure

```
/
├── frontend/       Vite + React + TypeScript
├── backend/        Node.js + Express + TypeScript
└── decals/         PNG decal assets + config.json
```

See [ARCHITECTURE.md](ARCHITECTURE.md) for a full walkthrough of how the pieces fit together.

## Adding a new car model

1. **Add the decal PNG file(s)** to the appropriate subdirectory under `decals/`, using the naming convention `{car-name}.png` in kebab-case (e.g. `bwec-gt3/audi-r8-lms-gt3-evo.png`). All decals must be 2048×2048 RGBA PNG files.

2. **Add an entry to `decals/config.json`** following the existing schema (see [ARCHITECTURE.md](ARCHITECTURE.md)):
   - Choose a kebab-case `id`. If the same car appears in multiple series, include a series suffix (e.g. `ferrari-296-gt3-sprint`, `ferrari-296-gt3-bwec`).
   - Set `"group"` to one of the existing series values (`"GT3 Sprint"`, `"BWEC"`, `"Falken"`). To add an entirely new series, introduce a new group string — the UI renders it automatically as a new `<optgroup>`.
   - For **GT3 Sprint cars**: set `"base": []` and populate all four `classSpecific` classes (AM, PRO-AM, PRO, ROOKIE), each pointing to the file in the corresponding class directory.
   - For **all other cars**: populate `"base"` with the single decal entry and omit `classSpecific`.
   - All decal placements use `"x": 0, "y": 0, "width": 2048, "height": 2048`.

3. **Add a test entry** in the appropriate `test.each` table in `backend/src/__tests__/apply.test.ts`:
   - Cars without class decals → add `['your-car-id']` to the `nonClassDecalCars` array.
   - GT3 Sprint cars → add `['your-car-id']` to the `classDecalCars` array.

4. **Open a pull request** — no UI component changes are needed; the car appears automatically in the correct dropdown group.

## Submitting changes

1. Fork the repository and create a branch from `main`
2. Make your changes, including tests
3. Ensure `npm run lint --workspaces` and `npm test --workspaces` pass
4. Open a pull request with a clear description of what changed and why
5. A maintainer will review and merge

## Reporting issues

Open an issue on GitHub describing the problem, the steps to reproduce it, and the expected vs. actual behaviour. Screenshots or a minimal test livery file are helpful.