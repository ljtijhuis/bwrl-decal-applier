# Phase 4: UX Polish & Open-Source Readiness

## Context

Phases 1–3 delivered a fully working end-to-end flow with all 34 car models configured. Phase 4 makes the app presentable and polished. The key new user-facing feature is a before/after livery preview. Docker Compose is deferred to Phase 5 (no Docker is installed locally).

Two Phase 4 items are already complete:
- Input hardening (20 MB limit + format validation on both frontend and backend) ✅
- Core content in README.md/CLAUDE.md ✅

---

## Implementation Steps

### 1. Loading spinner in `ApplyButton`

**Files:** `frontend/src/components/ApplyButton.tsx`, `frontend/src/App.css`

- Add a CSS-only spinner (rotating border) inside the button when `isLoading` is true, alongside the existing "Applying…" text.
- Add `@keyframes spin` animation and `.spinner` class to `App.css`.

No new tests needed — the spinner is purely visual and existing tests cover the disabled/enabled states.

---

### 2. Expose `resultUrl` from `useApply`

**File:** `frontend/src/hooks/useApply.ts`

Changes:
- Add `resultUrl: string | null` to the hook's return value (initially `null`).
- After successful apply: call `URL.createObjectURL(blob)`, store in state, **then** pass the blob to the existing `triggerDownload()`. Both happen on success.
- When a new apply starts: revoke the previous object URL and reset `resultUrl` to `null`.
- When an error occurs: reset `resultUrl` to `null`.

**File:** `frontend/src/__tests__/useApply.test.ts`

- Add tests: `resultUrl` is null initially, set after success, reset on new apply, reset on error.

---

### 3. New `LiveryPreview` component

**File:** `frontend/src/components/LiveryPreview.tsx`
**File:** `frontend/src/__tests__/LiveryPreview.test.tsx`

Props:
```ts
{ beforeFile: File | null; resultUrl: string | null }
```

Behaviour:
- **No file selected**: renders nothing (`return null`).
- **File selected, no result yet ("before" state)**:
  - PNG: `<img>` with `URL.createObjectURL(file)` as src. Cleanup via `useEffect` return.
  - TGA: a styled placeholder `<div>` with a file icon and filename text (browsers cannot render TGA natively).
- **Result available ("after" state, `resultUrl !== null`)**:
  - Side-by-side layout: "Before" thumbnail (left) and "After" composited result (right).
  - Left panel reuses the same PNG/TGA rules above.
  - Right panel: `<img src={resultUrl}>` — always PNG, always displayable.
  - Below the after panel: Trading Paints note (see step 4).

CSS additions in `App.css`:
- `.preview-container` — flex row, gap, responsive wrap.
- `.preview-panel` — label + image/placeholder sizing.
- `.preview-placeholder` — styled box for TGA before state.

**Tests:**
- Renders nothing when `beforeFile` is null.
- PNG file → renders `<img>` with object URL src.
- TGA file → renders placeholder with filename.
- With `resultUrl` → renders both before and after panels.
- Object URL is revoked on unmount (mock `URL.createObjectURL` / `revokeObjectURL`).

---

### 4. Trading Paints note

Rendered inside `LiveryPreview` in the "after" panel (only appears once the result is ready):

> "Your livery is ready. Upload the downloaded PNG to Trading Paints via **Manage My Car → Upload Livery**."

Small `<p className="trading-paints-note">` below the after-image.

---

### 5. Wire preview into `App.tsx`

**File:** `frontend/src/App.tsx`

- Import `LiveryPreview`.
- Destructure `resultUrl` from `useApply()`.
- Render `<LiveryPreview beforeFile={selectedFile} resultUrl={resultUrl} />` below the form and above any error banners.

**File:** `frontend/src/__tests__/App.test.tsx`

- Add a test: after a successful apply, a result image appears in the document.

---

### 6. Documentation updates

**`ARCHITECTURE.md`** — add `LiveryPreview` to the frontend components table with a description of its before/after behaviour.

No changes needed to `README.md`, `CLAUDE.md`, or `CONTRIBUTING.md` at this stage (Docker instructions are deferred to Phase 5).

---

## Files Modified

| File | Change |
|------|--------|
| `frontend/src/components/ApplyButton.tsx` | Add spinner element when loading |
| `frontend/src/App.css` | Spinner keyframes + preview layout styles |
| `frontend/src/hooks/useApply.ts` | Expose `resultUrl`, cleanup on re-apply |
| `frontend/src/__tests__/useApply.test.ts` | Tests for `resultUrl` lifecycle |
| `frontend/src/components/LiveryPreview.tsx` | **New** — before/after preview component |
| `frontend/src/__tests__/LiveryPreview.test.tsx` | **New** — unit tests |
| `frontend/src/App.tsx` | Render `LiveryPreview`, pass `resultUrl` |
| `frontend/src/__tests__/App.test.tsx` | Test: result image appears after successful apply |
| `ARCHITECTURE.md` | Add `LiveryPreview` to frontend components table |

---

## Verification

1. **Spinner**: Click Apply → button shows a spinning animation alongside "Applying…" while the request is in flight.
2. **Before preview (PNG)**: Upload a PNG livery → thumbnail appears below the form before clicking Apply.
3. **Before preview (TGA)**: Upload a TGA livery → styled placeholder with filename appears (no broken image icon).
4. **After preview + auto-download**: Click Apply → browser auto-downloads `livery-with-decals.png` AND a side-by-side before/after preview renders with the Trading Paints note below it.
5. **Re-apply**: Upload a second file and apply again → previous preview is replaced, no memory leaks (previous object URLs revoked).
6. **Tests**: `npm test --workspaces` passes with 80%+ coverage maintained.
7. **Types**: `npm run typecheck` passes with no errors.
