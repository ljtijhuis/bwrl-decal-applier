# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Broken Wing Racing League Decal Applier** — a web app that lets iRacing league members upload their car livery, apply league decals automatically, and download the result for upload to Trading Paints.

See `plans/project_plan.md` for the phased implementation plan and progress tracker.

## Architecture

Monorepo using npm workspaces:

```
/
├── frontend/   Vite + React + TypeScript — user interface
├── backend/    Node.js + Express 5 + TypeScript — image processing API
└── decals/     PNG decal assets + config.json placement rules
```

- **Image processing**: Sharp (server-side compositing)
- **Auth**: None — fully anonymous, no accounts, no data stored
- **Decal assets**: PNG files checked into the repo; placement rules in `decals/config.json`
- **Output**: Always PNG, regardless of input format (PNG or TGA accepted)
- **Trading Paints**: No API exists; users download the result and upload manually

## Key Domain Concepts

- **Livery**: a custom car skin file uploaded by the user (PNG or TGA)
- **Decal**: a league-branded overlay (logo, sponsor, driver class badge) composited on top of the livery; assets are PNG and vary by car model
- **Car model**: each car has its own decal template; all livery images share the same pixel dimensions
- **Driver class**: AM, PRO-AM, PRO, ROOKIE — some car models have class-specific badge decals
- **Trading Paints**: third-party platform where users upload finished liveries

## Commands

### Setup

```bash
npm install      # installs all workspace dependencies
```

### Development

```bash
npm run dev                          # start frontend (port 5173) + backend (port 3001) in parallel
npm run dev --workspace=frontend     # frontend only
npm run dev --workspace=backend      # backend only
```

### Testing

```bash
npm test --workspaces                         # all unit + integration tests
npm test --workspace=frontend                 # frontend unit tests (Vitest)
npm test --workspace=backend                  # backend integration tests (Jest)
npm run test:coverage --workspace=frontend    # frontend coverage report
npm run test:coverage --workspace=backend     # backend coverage report
npm run test:e2e --workspace=frontend         # Playwright e2e (requires app running)
```

### Type checking

```bash
npm run typecheck                    # type-check all workspaces
npm run typecheck --workspace=frontend
npm run typecheck --workspace=backend
```

### Linting & formatting

```bash
npm run lint      # ESLint across all workspaces
npm run format    # Prettier across all workspaces
```

### Building

```bash
npm run build --workspace=frontend   # Vite production build
npm run build --workspace=backend    # tsc compile to dist/
```

## Testing Requirements

Every feature must be built with testability in mind. Target **80%+ coverage** across the codebase.

- **Unit tests**: components, hooks, pure functions (Vitest for frontend, Jest for backend)
- **Integration tests**: Express routes with real Sharp calls against fixture images
- **E2E tests**: Playwright for critical user flows (upload → apply → download)

Tests are part of the definition of done — code is not complete until tests pass.

Prefer pure functions, dependency injection, and clear separation of concerns to keep code testable.

### Testing gotchas

- **`userEvent.upload` respects `<input accept>`**: when testing file-type rejection logic, use `fireEvent.change(input, { target: { files: [file] } })` instead of `userEvent.upload`. `userEvent` silently drops files that don't match the accept attribute, so the component's JS validation code never runs.
- **Async hook state updates**: components that fetch on mount (e.g. `useConfig`) will trigger an `act()` warning in the first test that renders them without awaiting the fetch. This is benign — use `waitFor` in subsequent assertions.

## Documentation Requirements

Keep the following files up to date whenever user-facing behaviour, architecture, or contributor workflows change:

- **`README.md`** — user-facing: what the app does, how to use it, where to get help
- **`ARCHITECTURE.md`** — technical: system structure, key design decisions, data flow, image processing pipeline
- **`CONTRIBUTING.md`** — contributor-facing: prerequisites, local setup, running tests, submitting changes

Documentation updates are part of the definition of done.

### During planning

When producing an implementation plan, always include a **Documentation** section that identifies which of the above files need updating and what specifically will change (e.g. new endpoint added → ARCHITECTURE.md; new setup step → CONTRIBUTING.md; user-facing behaviour changes → README.md). Documentation file updates must appear as explicit line items in the plan and in the implementation steps, not as an afterthought.

When we are done planning and about to start execution, copy your generated plan file to the project specific plan folder at `./plans/` **before writing any code**. This must be the first action taken after the user approves the plan, before any file edits or commands.

## Development Notes

### npm workspaces and binary resolution

Jest and other CLI tools are hoisted to the root `node_modules/.bin/` by npm workspaces — they don't exist under `backend/node_modules/.bin/`. Use `$(npm root)/.bin/<tool>` in scripts to resolve the hoisted binary correctly.

### Node version

This project requires Node 20+ and is pinned to Node 24 via `.nvmrc`. If you use nvm and don't have Node 24 as your default, run `nvm use` after cloning.

### Decal config schema

`decals/config.json` is the single source of truth for car models. Cars without class badges omit the `classSpecific` key entirely. The `/api/config` endpoint transforms this into `{ carModels: { [id]: { label, hasClassDecals } } }` for the frontend.
