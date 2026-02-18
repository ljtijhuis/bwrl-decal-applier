# Broken Wing Racing League — Decal Applier

A web app for [Broken Wing Racing League](https://example.com) members on iRacing. Upload your car livery, select your car model and driver class, and download a finished livery with league decals applied — ready to upload to [Trading Paints](https://www.tradingpaints.com).

## What it does

League members used to apply decals manually in image editing software. This tool automates that:

1. Upload your livery (PNG or TGA)
2. Select your car model
3. Select your driver class (AM, PRO-AM, PRO, ROOKIE) — only shown for series that use class badges
4. Click **Apply Decals**
5. Download the finished PNG and upload it to Trading Paints

No account required. Your file is processed and returned immediately; nothing is stored.

## Supported formats

| Input | Output |
|-------|--------|
| PNG   | PNG    |
| TGA   | PNG    |

The output PNG is compatible with Trading Paints livery uploads.

## Running locally

### Prerequisites

- [Node.js](https://nodejs.org) 20+
- [Docker](https://www.docker.com) and Docker Compose (optional, for the containerised setup)

### With Docker Compose (recommended)

```bash
docker compose up
```

The app will be available at `http://localhost:5173`.

### Without Docker

```bash
# Install dependencies
npm install --workspaces

# Start backend and frontend in parallel
npm run dev
```

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3000`

See [CONTRIBUTING.md](CONTRIBUTING.md) for a full development setup guide.

## Adding a new car model

Car models and decal placement rules live in `decals/config.json`. To add a new car:

1. Add the decal PNG file(s) to `decals/`
2. Add an entry to `decals/config.json` following the existing schema
3. The car will appear automatically in the UI — no code changes needed

See [ARCHITECTURE.md](ARCHITECTURE.md) for the full config schema.