# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Broken Wing Racing League Decal Applier** — a web app that lets iRacing league members upload their car livery, apply league decals automatically, and download the result for upload to Trading Paints.

See `project_idea.md` for the full product specification and open questions.

## Planned Architecture

- **Frontend**: React (modern framework)
- **Backend**: Node.js or Python (open-source friendly, community contributions encouraged)
- **Image processing**: server-side compositing of decals onto livery files
- **Decal assets**: upload through an admin interface that lets an admin upload car-specific files.

## Key Domain Concepts

- **Livery**: a custom car skin file uploaded by the user (PNG or compatible format for Trading Paints)
- **Decal**: a league-branded overlay (logo, sponsor, driver class badge) applied on top of the livery; assets exist in PNG, PSD, TGA formats and vary by car model
- **Car/Series**: GT3 cars and LMPs (among others) — decals and livery files are all the same dimensions but templates are different per car model
- **Driver class**: AM, PRO-AM, PRO, ROOKIE — some series use class-specific decals
- **Trading Paints**: the third-party platform where users upload finished liveries; output format must be compatible

## Testing Requirements

Every feature must be built with testability in mind and verified through automated tests. Target **80%+ test coverage** across the codebase.

- **Unit tests**: cover individual functions, components, and modules in isolation
- **Integration tests**: cover interactions between layers (e.g. API endpoints, image processing pipelines, database/storage operations)
- **End-to-end tests**: cover critical user flows (upload livery → apply decals → download result) where feasible

When planning any implementation task, include test coverage as a required deliverable — not an afterthought. Prefer designing code so it is easy to test: pure functions, dependency injection, clear separation of concerns.

## Documentation Requirements

Keep the following files up to date whenever user-facing behaviour, architecture, or contributor workflows change. Reference them when planning work to ensure nothing drifts.

- **`README.md`** — user-facing: what the app does, how to use it, where to get help
- **`ARCHITECTURE.md`** — technical: how the system is structured, key design decisions, data flow, image processing pipeline, component responsibilities
- **`CONTRIBUTING.md`** — contributor-facing: prerequisites, installing dependencies, running the app locally, running tests, submitting changes, code style guidelines

Documentation updates are part of the definition of done for every task — code is not complete until the relevant docs reflect the current state.

## Open Questions (resolve before implementing)

Before writing image-processing or upload logic, clarify:
1. Exact file formats accepted by Trading Paints
2. Decal placement coordinates and scaling rules per car model
3. The third decal asset format (beyond PNG and PSD) stored in Google Drive
4. Whether transparency / layer blending beyond simple overlay is needed
5. Authentication requirements (anonymous uploads vs. user accounts, rate limiting)
6. Hosting/deployment environment
7. Whether to integrate with a Trading Paints API or only produce downloadable files