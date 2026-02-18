# Phase 2: Core Image Compositing

## Context

Phase 1 delivered a complete UI shell and backend config endpoint. Phase 2 makes the app actually useful: users upload a livery, the backend composites league decals on top using Sharp, and the browser downloads the resulting PNG. The `handleSubmit` in `App.tsx` is currently a stub (line 28–31).

---

## Files to Create

### Backend
| File | Purpose |
|---|---|
| `backend/src/services/compositor.ts` | Pure `applyDecals()` function — reads decal PNGs, resizes, composites via Sharp |
| `backend/src/routes/apply.ts` | `POST /api/apply` route + multer middleware + `multerErrorHandler` |
| `backend/src/__tests__/compositor.test.ts` | Unit tests for compositor (no HTTP layer) |
| `backend/src/__tests__/apply.test.ts` | Integration tests via supertest |

### Frontend
| File | Purpose |
|---|---|
| `frontend/src/hooks/useApply.ts` | `useApply()` hook — POST to `/api/apply`, handle blob download |
| `frontend/src/__tests__/useApply.test.ts` | Unit tests for the hook |

---

## Files to Modify

| File | Change |
|---|---|
| `backend/package.json` | Add `sharp`, `multer` to dependencies; `@types/multer` to devDependencies |
| `backend/src/index.ts` | Register `applyRouter` at `/api/apply` and `multerErrorHandler` after all routes |
| `frontend/src/App.tsx` | Replace `handleSubmit` stub; add `isLoading`/`applyError` state via `useApply` |
| `frontend/src/components/ApplyButton.tsx` | Add `isLoading` prop; show "Applying…" text while loading |
| `frontend/src/__tests__/App.test.tsx` | Replace Phase 2 placeholder test; add error-path test |
| `frontend/e2e/smoke.spec.ts` | Add download E2E test using a fixture PNG |

---

## Implementation Steps

### 1. Install dependencies
```bash
npm install sharp multer --workspace=backend
npm install --save-dev @types/multer --workspace=backend
```

### 2. `backend/src/services/compositor.ts`

Pure function — no config lookup, just compositing. Route handler resolves which decals to use.

```typescript
interface DecalEntry { file: string; x: number; y: number; width: number; height: number; }

export async function applyDecals(
  liveryBuffer: Buffer,
  decalEntries: DecalEntry[],
  decalsDir: string
): Promise<Buffer>
```

Algorithm:
1. For each entry: `readFile(join(decalsDir, entry.file))` → resize to `{width, height}` with `fit: 'fill'` → collect as `{ input, left: entry.x, top: entry.y }`
2. `sharp(liveryBuffer).composite(ops).png().toBuffer()`

TGA input is handled natively by Sharp/libvips — no extra library needed.

### 3. `backend/src/routes/apply.ts`

Follow the patterns in `config.ts` (lines 1–7 for ESM `__dirname`, local interface declarations, `readFile` for config).

**Multer config:** memory storage, 20 MB `fileSize` limit. `fileFilter` accepts `image/png` MIME type OR `.png`/`.tga` extension (case-insensitive) — TGA has no standard MIME type. Reject with `cb(new Error('INVALID_FILE_TYPE'))`.

**Validation order (all → 400 on failure):**
1. File present (`req.file`)
2. `carModel` field present
3. `carModel` exists in config
4. If `carConfig.decals.classSpecific` exists: `driverClass` must be present and a valid key

**Resolve entries:** `[...base, ...(classSpecific[driverClass] ?? [])]`

**Composite:** call `applyDecals(req.file.buffer, entries, DECALS_DIR)` in a `try/catch` → 422 on Sharp failure.

**Response:** `Content-Type: image/png`, `Content-Disposition: attachment; filename="livery-with-decals.png"`, send buffer.

**`multerErrorHandler`:** exported separately, registered in `index.ts`. Maps `MulterError.LIMIT_FILE_SIZE` → 413, `INVALID_FILE_TYPE` message → 415.

### 4. Register in `backend/src/index.ts`

After the existing `app.use('/api/config', configRouter)` line:
```typescript
import { applyRouter, multerErrorHandler } from './routes/apply.js';
app.use('/api/apply', applyRouter);
app.use(multerErrorHandler);  // must be after all routes
```

### 5. `frontend/src/hooks/useApply.ts`

Returns `{ apply, isLoading, error }`. Mirrors the structure of `useConfig.ts`.

```typescript
export function useApply(): {
  apply: (params: { file: File; carModelId: string; driverClass: DriverClass | '' }) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}
```

`apply()` builds `FormData`, POSTs to `/api/apply`, on success calls an internal `triggerDownload(blob, 'livery-with-decals.png')` helper (creates `<a>`, sets `href`/`download`, clicks, revokes). On non-ok response, reads `res.json().error`. On network error, sets error from `err.message`.

### 6. `frontend/src/App.tsx`

```typescript
const { apply, isLoading, error: applyError } = useApply();

const isApplyEnabled =
  selectedFile !== null && carModelId !== '' && (!needsClassDecal || driverClass !== '') && !isLoading;

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!selectedFile || !carModelId) return;
  await apply({ file: selectedFile, carModelId, driverClass });
};
```

Add `applyError` banner (same pattern as `configError` banner at line 41–45).

Pass `isLoading` to `<ApplyButton disabled={!isApplyEnabled} isLoading={isLoading} />`.

### 7. `frontend/src/components/ApplyButton.tsx`

Add `isLoading: boolean` prop. Button text: `isLoading ? 'Applying…' : 'Apply Decals'`.

---

## Error Response Contract

| Condition | Status | `error` message |
|---|---|---|
| No livery file | 400 | "No livery file uploaded." |
| Missing `carModel` | 400 | "carModel is required." |
| Unknown `carModel` | 400 | "Unknown car model: {carModel}" |
| Missing/invalid `driverClass` (class-decal car) | 400 | "driverClass is required and must be one of AM, PRO-AM, PRO, ROOKIE for this car model." |
| File too large | 413 | "File is too large. Maximum size is 20 MB." |
| Unsupported file type | 415 | "Only PNG and TGA files are accepted." |
| Sharp decode failure | 422 | "Could not process the uploaded image. Ensure it is a valid PNG or TGA file." |

All responses: `{ error: string }`.

---

## Test Strategy

### `compositor.test.ts` (unit)
- Generate a 300×300 PNG in `beforeAll` using `sharp({ create: ... }).png().toBuffer()` — no committed fixtures
- Test: returns Buffer, output is valid PNG, composites one decal (from `decals/example/`), composites two decals, rejects invalid buffer, rejects missing decal file

### `apply.test.ts` (integration via supertest)
- Generate `pngBuffer` the same way in `beforeAll`
- Test happy paths: Ferrari+AM → 200 PNG, Porsche (no class) → 200 PNG, Porsche+driverClass ignored → 200
- Test all error paths per the table above
- TGA: test `.tga` extension accepted by multer using a PNG buffer with filename `livery.tga` — multer accepts it; if Sharp decodes it the test passes, if not it returns 422

### `useApply.test.ts` (unit)
- Stub `fetch` globally with `vi.stubGlobal`
- Stub `URL.createObjectURL` / `URL.revokeObjectURL`
- Test: initial state, loading state during in-flight request, download triggered on success (createObjectURL + click + revokeObjectURL called), error set on non-ok, error set on network failure, `driverClass` included/excluded from FormData correctly

### `App.test.tsx` updates
- Replace "Phase 2 placeholder" test with: success → `URL.createObjectURL` called
- Add: API error → error banner text visible

### E2E
- Add fixture: `frontend/e2e/fixtures/minimal.png` (smallest valid PNG, committed as binary)
- Test: upload fixture, select Porsche, click Apply → `page.waitForEvent('download')` → `suggestedFilename` is `livery-with-decals.png`

---

## Verification

```bash
# 1. Install
npm install

# 2. Type-check
npm run typecheck

# 3. Lint
npm run lint

# 4. All tests
npm test --workspaces

# 5. Manual end-to-end
npm run dev
# Upload a PNG, select Ferrari 296 GT3, select AM → PNG downloads with league-logo + class badge composited
# Upload a PNG, select Porsche 911 GT3 R → PNG downloads with league-logo only
# Upload a TGA → same result as PNG
# Upload a 21 MB file → error message shown
# Upload a JPEG → error message shown
```
