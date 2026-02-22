# Broken Wing Racing League — Decal Applier

A web app for [Broken Wing Racing League](https://www.brokenwingracingleague.com) members on iRacing. Upload your car livery, select your car model and driver class, and download a finished livery with league decals applied — ready to upload to [Trading Paints](https://www.tradingpaints.com).

## What it does

League members used to apply decals manually in image editing software. This tool automates that:

1. Upload your livery (PNG, TGA, or PSD)
2. Select your car model
3. Select your driver class (AM, PRO-AM, PRO, ROOKIE) — only shown for series that use class badges
4. Click **Apply Decals**
5. Download the finished PNG and upload it to Trading Paints

No account required. Your file is processed and returned immediately; nothing is stored.

## Using the app

A step-by-step checklist is shown at the top of the page for reference. Here is the full flow:

1. **Find your base livery** — your TGA is in `Documents/iRacing/paint/[car folder]`, named `car_[yourCustomerID].tga`. If it isn't there yet, run your paint in Trading Paints once and the Downloader will save it automatically.
2. **Upload your livery** — drag-and-drop or click to select a PNG, TGA, or PSD file.
3. **Select your car model** — choose the car you're racing from the dropdown.
4. **Select your driver class** — choose AM, Pro-Am, Pro, or Rookie (only shown for cars with class badges).
5. **Click "Apply Decals"** — the tool downloads the result as a PNG automatically.
6. **Go to Trading Paints** — sign in and click **Upload**.
7. **Upload the PNG** — select the downloaded PNG, choose the correct vehicle, and upload to **My Paints**.
8. **Upload your spec map** — also upload `car_spec_[yourCustomerID].mip` (or `.map`) from the same iRacing paints folder, so the shiny/matte finish displays correctly in-game.

> **First time?** Install and run the [Trading Paints Downloader](https://www.tradingpaints.com/page/Install) — it distributes your livery to other racers in-session.

## Supported formats

| Input | Output |
|-------|--------|
| PNG   | PNG    |
| TGA   | PNG    |
| PSD   | PNG    |

The output PNG is compatible with Trading Paints livery uploads.

## Running locally

### Prerequisites

- [Node.js](https://nodejs.org) 20+ (Node 24 recommended; the repo ships a `.nvmrc` for nvm users)
- [npm](https://www.npmjs.com) 10+
- [Docker](https://www.docker.com) and Docker Compose (optional, for the containerised setup)

### With Docker Compose (recommended)

```bash
docker compose up
```

The app will be available at `http://localhost:5173`.

### Without Docker

```bash
# Install all workspace dependencies
npm install

# Start backend (port 3001) and frontend (port 5173) in parallel
npm run dev
```

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3001`

See [CONTRIBUTING.md](CONTRIBUTING.md) for a full development setup guide.

## Running in production

The backend API can be deployed on its own; the frontend lives in the league website's separate codebase.

```bash
git clone git@github.com:ljtijhuis/bwrl-decal-applier.git
cd bwrl-decal-applier
npm install
cp backend/.env.example backend/.env      # set ALLOWED_ORIGINS to the league website domain
npm start                                  # builds backend, then serves the API
```

`npm start` compiles the TypeScript source and starts the server on `PORT` (default 3001). For persistent background execution, wrap with `pm2` or a systemd unit.

See [ARCHITECTURE.md](ARCHITECTURE.md) for the full deployment topology, environment variable reference, and process manager guidance.

## Branding

The app uses the Broken Wing Racing League brand identity — forest-green header with orange accents, matching the BWRL badge colours.

- **Logo** — served from `frontend/public/bwrl-logo.png`. Replace this file to update the header image and browser favicon simultaneously.
- **Sponsor logos** — stored in `frontend/public/sponsors/`. To update a sponsor's logo, replace the corresponding PNG file in that directory.
- **Sponsor list** — defined as a typed array (`SPONSORS`) in `frontend/src/components/Sponsors.tsx`. Edit that array to add, remove, or reorder sponsors. No backend or config changes are needed.

## Adding a new car model

Car models and decal placement rules live in `decals/config.json`. To add a new car:

1. Add the decal PNG file(s) to `decals/`
2. Add an entry to `decals/config.json` following the existing schema
3. The car will appear automatically in the UI — no code changes needed

See [ARCHITECTURE.md](ARCHITECTURE.md) for the full config schema.