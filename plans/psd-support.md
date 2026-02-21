# Plan: Add PSD File Upload Support

## Context

The app currently accepts PNG and TGA livery files. Users with Photoshop-based liveries must export to PNG/TGA before uploading. Adding PSD support removes that extra step.

This was already planned in the project backlog (ARCHITECTURE.md, plans/project_plan.md) with `@webtoon/psd` as the designated library. Sharp does not natively support PSD, so PSD files must be flattened to raw RGBA before passing to Sharp.

---

## Implementation Steps

### 1. Install `@webtoon/psd` as a backend dependency

```bash
npm install @webtoon/psd --workspace=backend
```

### 2. Update `backend/src/services/compositor.ts`

- Add import: `import Psd from '@webtoon/psd';`
- Add `decodePsd(buffer: Buffer)` function **before** `decodeTga`:
  - Check PSD magic bytes (`8BPS`: `0x38 0x42 0x50 0x53`) at bytes 0–3; return `null` if mismatch
  - Safe ArrayBuffer conversion: `buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength)` (avoids Node.js shared pool issue)
  - Call `Psd.parse(arrayBuffer)` and `await psdFile.composite()` to get `Uint8ClampedArray` of RGBA pixels
  - Return `{ data: Buffer.from(compositeData), width, height, channels: 4 }`
- Make `liveryToSharp` **async**, try `decodePsd` first, then `decodeTga`, then fall back to `sharp(buffer)`
- In `applyDecals` (line 94): add `await` — `const base = await liveryToSharp(liveryBuffer); return base.composite(compositeOps).png().toBuffer();`

### 3. Update `backend/src/routes/apply.ts`

- **multer `fileFilter`** (lines 38–39): add `'image/vnd.adobe.photoshop'` and `'application/photoshop'` to the `validMime` array; add `ext === 'psd'` to `validExt`
- **415 error message** (line 113): `'Only PNG, TGA, and PSD files are accepted.'`
- **422 error message** (line 94): `'...Ensure it is a valid PNG, TGA, or PSD file.'`

### 4. Update `frontend/src/components/FileUpload.tsx`

- **`ACCEPTED_TYPES`** (line 3): add `'image/vnd.adobe.photoshop'`, `'application/photoshop'`
- **`ACCEPTED_EXTENSIONS`** (line 4): add `'.psd'`
- **`<input accept>`** (line 88): `".png,.tga,.psd"`
- **Error message** (line 25): `'Only PNG, TGA, and PSD files are accepted.'`
- **Hint text** (line 83): `'Accepted formats: PNG, TGA, PSD — max 20 MB'`

### 4b. Update `frontend/src/components/Instructions.tsx`

- **Step 2 body** (line 16): `'Drag-and-drop or click to select your file in the upload area. TGA, PNG, and PSD are supported.'`

### 5. Update `frontend/src/components/LiveryPreview.tsx`

- **`useEffect`** (lines 17–21): extend non-previewable check to also cover `.psd`
- **`beforeContent`** (lines 30–39): use `ext = beforeFile.name.split('.').pop()?.toUpperCase() ?? ''` and `['TGA', 'PSD'].includes(ext)` pattern; show `"{ext} file"` placeholder label

### 6. Update backend tests

**`backend/src/__tests__/apply.test.ts`**:
- Update 415 error message assertion to match new text
- Add test: `.psd` extension is accepted by multer (attaches a PNG buffer with `.psd` filename — multer accepts it, `decodePsd` returns null, Sharp decodes PNG → 200)
- Add test: `image/vnd.adobe.photoshop` MIME type is accepted (status must not be 415)

**`backend/src/__tests__/compositor.test.ts`** (or create `decodePsd.test.ts`):
- Mock `@webtoon/psd` using `jest.unstable_mockModule` (required for ESM; import module under test dynamically after mock registration)
- Test: buffer with `8BPS` magic bytes triggers `Psd.parse` and returns a valid PNG
- Test: buffer without `8BPS` magic bytes → `decodePsd` returns null, falls through to TGA/Sharp path

### 7. Update frontend tests

**`frontend/src/__tests__/FileUpload.test.tsx`**:
- Add `makePsd()` factory: `new File([...], 'livery.psd', { type: 'image/vnd.adobe.photoshop' })`
- Add test: valid PSD accepted via `userEvent.upload`
- Add test: valid PSD accepted via drag-drop (`fireEvent.drop`)
- Update existing invalid-type error assertion to match `'Only PNG, TGA, and PSD files are accepted.'`

**`frontend/src/__tests__/LiveryPreview.test.tsx`**:
- Add test: PSD file shows placeholder (no `<img>`, `createObjectURL` not called)

**`frontend/src/__tests__/__snapshots__/Instructions.test.tsx.snap`**:
- The snapshot contains the old "Both TGA and PNG are supported." text; run `npm test -- --updateSnapshot --workspace=frontend` after updating `Instructions.tsx` to regenerate it

### 8. Documentation

**`README.md`**: Add PSD to supported input formats table and upload step description

**`ARCHITECTURE.md`**:
- Update data flow diagram MIME type comment to include PSD
- Add `@webtoon/psd` to technology table with rationale
- Update image processing section to describe PSD flattening step
- Remove/update "PSD input deferred" note — replace with "PSD supported via `@webtoon/psd`"

---

## Critical Files

| File | Change |
|------|--------|
| `backend/src/services/compositor.ts` | Add `decodePsd`, make `liveryToSharp` async |
| `backend/src/routes/apply.ts` | Extend multer validation + error messages |
| `frontend/src/components/FileUpload.tsx` | Accept `.psd`, update constants + UI text |
| `frontend/src/components/Instructions.tsx` | Update step 2 body to mention PSD |
| `frontend/src/components/LiveryPreview.tsx` | Show placeholder for PSD (like TGA) |
| `backend/src/__tests__/apply.test.ts` | New PSD acceptance tests + updated message assertions |
| `backend/src/__tests__/compositor.test.ts` | Mocked `decodePsd` unit tests (ESM-safe mock) |
| `frontend/src/__tests__/FileUpload.test.tsx` | PSD acceptance tests + updated error assertion |
| `frontend/src/__tests__/LiveryPreview.test.tsx` | PSD placeholder test |
| `README.md` | Add PSD to supported formats |
| `ARCHITECTURE.md` | Update image pipeline docs |

---

## Key Gotchas

1. **`Buffer` → `ArrayBuffer` conversion**: `@webtoon/psd` requires an `ArrayBuffer`. Use `buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength)` — not just `buffer.buffer` — because Node.js `Buffer` may share a pool and have a non-zero `byteOffset`.

2. **`liveryToSharp` becoming async**: This is a propagating change. `applyDecals` is already async; it just needs an `await` added. TypeScript will catch any missed awaits at compile time.

3. **Jest ESM mocking**: The backend uses `ts-jest` with ESM mode. Mocking `@webtoon/psd` requires `jest.unstable_mockModule` (not `jest.mock`), and the module under test must be dynamically imported **after** mock registration via a top-level `let compositor: typeof import(...)` pattern.

4. **`application/octet-stream` on frontend**: Not added to `ACCEPTED_TYPES` on the frontend (it would allow any binary file). The `.psd` extension check handles this case reliably.

5. **20 MB file size limit**: PSD files with many layers can exceed 20 MB. Users will get a 413 response. The limit is intentionally unchanged for now (single constant to update later if needed).

---

## Verification

1. `npm install` — confirms `@webtoon/psd` added to `backend/package.json`
2. `npm run typecheck` — confirms no TypeScript errors (especially the `async` propagation)
3. `npm test --workspaces` — all new and existing tests pass
4. Manual end-to-end: `npm run dev`, upload a `.psd` livery file, verify download returns a valid PNG with decals applied
5. Manual negative test: upload a `.jpg` file, confirm 415 error with updated message
