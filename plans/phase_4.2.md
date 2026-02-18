# Plan: Add Step-by-Step Checklist to Decal Applier Page

## Context

League members currently receive only a Discord message with a YouTube link when they ask how to install decals. The web app itself has minimal guidance — just a post-processing note saying "Upload to Trading Paints via Manage My Car → Upload Livery". A step-by-step checklist on the same page will give users everything they need without leaving the app.

## What will be built

A new **`Instructions` component** rendered above the apply form in `App.tsx`. It is a numbered, interactive checklist covering the full workflow: preparing the livery → using this tool → uploading to Trading Paints. Users can tick off steps as they go.

---

## Steps to show in the checklist

1. **Find your base livery** — your TGA is in `Documents/iRacing/paint/[car folder]`, named `car_[yourCustomerID].tga`. If it isn't there yet, open Trading Paints, run your paint once in a session, and the Downloader will save it automatically.
2. **Upload your TGA** — drag-and-drop or click to select the file in the upload area above.
3. **Select your car model** — choose the car you're racing from the dropdown.
4. **Select your driver class** — choose AM, Pro-Am, Pro, or Rookie *(only shown for cars with class badges)*.
5. **Click "Apply Decals"** — the tool composites the league decals onto your livery and automatically downloads the result as a PNG.
6. **Go to Trading Paints** — visit [tradingpaints.com](https://www.tradingpaints.com) and sign in, then click **Upload**.
7. **Upload the PNG** — select the downloaded PNG, choose the correct vehicle, and upload to **My Paints**.
8. **Upload your spec map** — also upload `car_spec_[yourCustomerID].mip` (or `.map`) from the same iRacing paints folder. This controls the shiny/matte finish of your car and is required for correct in-game appearance.

> **First time?** Make sure the **Trading Paints Downloader** app is installed and running — it's what distributes your livery to other racers in-session. Download it from the Trading Paints website.

---

## Implementation plan

### 1. New component — `frontend/src/components/Instructions.tsx`

- Renders a `<section>` with heading "How to use this tool".
- Contains an `<ol>` list where each item has a `<label>` wrapping a `<input type="checkbox">` and the instruction text.
- Checkbox state is local to the component (`useState<Set<number>>`); checks persist only for the session.
- Step 4 (driver class) is always visible in the list even if the car doesn't need it — phrased as an optional note so the list doesn't jump around.
- No props required.

### 2. Update `App.tsx`

- Import and render `<Instructions />` inside `.main-content`, **above** the `<form>`.

### 3. Add styles to `App.css`

New CSS classes matching existing dark theme and BEM naming:

```
.instructions             — section wrapper, subtle border, padding
.instructions__heading    — label-style uppercase heading (matches .preview-label)
.instructions__list       — ol reset, flex column, gap
.instructions__item       — flex row, gap, cursor pointer
.instructions__item--done — text with line-through + muted color when checked
.instructions__checkbox   — visually styled checkbox (accent-color: #5566cc)
```

### 4. Tests — `frontend/src/__tests__/Instructions.test.tsx`

- Renders all 8 steps.
- Clicking a label toggles the checked state and applies `--done` class.
- Snapshot test.

### 5. Documentation updates

- **`README.md`**: Add a "Using the app" section that reflects the same 8-step flow.
- **`ARCHITECTURE.md`**: Note the new `Instructions` component in the component inventory.

---

## Critical files to modify

| File | Change |
|------|--------|
| `frontend/src/components/Instructions.tsx` | **Create** — new component |
| `frontend/src/__tests__/Instructions.test.tsx` | **Create** — unit tests |
| `frontend/src/App.tsx` | Import + render `<Instructions />` above `<form>` |
| `frontend/src/App.css` | Add `.instructions*` styles |
| `README.md` | Add "Using the app" section |
| `ARCHITECTURE.md` | Update component inventory |

---

## Verification

1. `npm run dev` — visit `localhost:5173`, confirm checklist appears above the form.
2. Click each checkbox — verify strike-through style applies/removes correctly.
3. `npm test --workspace=frontend` — all tests pass including new Instructions tests.
4. `npm run typecheck` — no TypeScript errors.
5. `npm run lint` — no lint errors.
