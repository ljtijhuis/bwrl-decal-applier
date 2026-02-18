# Phase 3: Full Car & Decal Configuration

## Context

Phases 1 and 2 established the app scaffold and end-to-end compositing flow using two placeholder car models with tiny example decals. Phase 3 replaces those with all 34 real car models across three league series (GT3 Sprint, BWEC, Falken), introduces series-based `<optgroup>` grouping in the UI, and adds per-car-model integration tests.

All 86 real decal PNG assets are already on disk but have inconsistent names (mixed case, spaces, series-specific suffixes like "BWEC Decal" and "AM Decal"). This phase also renames all asset files and directories to a clean, consistent `lowercase-with-dashes` convention.

---

## Key Facts

- **3 series:** GT3 Sprint (class decals), BWEC (no class decals), Falken (no class decals)
- **34 total car models:** 11 GT3 Sprint + 11 BWEC GT3 + 5 BWEC GTP + 6 Falken GT4 + 1 Falken LMP3
- **All decal placements:** `x:0, y:0, width:2048, height:2048` — full-canvas overlays
- **GT3 Sprint cars** use only `classSpecific` decals; set `"base": []`
- **Naming convention for renamed files:** `{car-name}.png` in kebab-case (directory encodes the series/class context)
- **Existing tests reference old IDs** (`ferrari-296-gt3`, `porsche-911-gt3-r`) — all must be updated

---

## Implementation Steps

### Step 1 — Rename decal asset directories and files

Rename all 8 active decal directories to lowercase-with-dashes, and rename every PNG inside to `{car-name}.png` (kebab-case, no spaces, no "Decal"/"BWEC"/"AM" suffixes). Use `git mv` to preserve history.

**Directory renames:**

| Old | New |
|-----|-----|
| `decals/BWEC-GT3/` | `decals/bwec-gt3/` |
| `decals/BWEC-GTP/` | `decals/bwec-gtp/` |
| `decals/GT3-AM/` | `decals/gt3-am/` |
| `decals/GT3-PROAM/` | `decals/gt3-proam/` |
| `decals/GT3-PRO/` | `decals/gt3-pro/` |
| `decals/GT3-Rookie/` | `decals/gt3-rookie/` |
| `decals/Falken-GT4/` | `decals/falken-gt4/` |
| `decals/Falken-LPM3/` | `decals/falken-lmp3/` ← also fixes LPM3→LMP3 typo |

**File rename convention:** Files are named by car only (no class/series suffix — the directory provides that context).

**Complete file rename mapping:**

`bwec-gt3/` and all 4 class directories (`gt3-am/`, `gt3-proam/`, `gt3-pro/`, `gt3-rookie/`) share the same 11 filenames:

| Car | Filename |
|-----|----------|
| Acura NSX GT3 Evo | `acura-nsx-gt3-evo.png` |
| Aston Martin Vantage GT3 Evo | `aston-martin-vantage-gt3-evo.png` |
| Audi R8 LMS GT3 Evo | `audi-r8-lms-gt3-evo.png` |
| BMW M4 GT3 | `bmw-m4-gt3.png` |
| Corvette Z06 GT3.R | `corvette-z06-gt3r.png` |
| Ferrari 296 GT3 | `ferrari-296-gt3.png` |
| Lamborghini Huracán GT3 Evo | `lamborghini-huracan-gt3-evo.png` |
| McLaren 720S GT3 | `mclaren-720s-gt3.png` |
| Mercedes-AMG GT3 Evo | `mercedes-amg-gt3-evo.png` |
| Ford Mustang GT3 | `ford-mustang-gt3.png` |
| Porsche 992 GT3 R | `porsche-992-gt3r.png` |

`bwec-gtp/`:

| Car | Old filename | New filename |
|-----|-------------|--------------|
| Acura ARX-06 GTP | `Acura GTP Decal.png` | `acura-arx-06-gtp.png` |
| BMW M Hybrid V8 GTP | `BMW GTP Decal.png` | `bmw-m-hybrid-v8-gtp.png` |
| Cadillac V-Series.R GTP | `Cad GTP Decal.png` | `cadillac-v-series-r-gtp.png` |
| Ferrari 499P | `Ferrari 499P Decal.png` | `ferrari-499p.png` |
| Porsche 963 GTP | `Porsche GTP Decal.png` | `porsche-963-gtp.png` |

`falken-gt4/`:

| Car | Old filename | New filename |
|-----|-------------|--------------|
| Aston Martin Vantage GT4 | `Aston Martin GT4 - BWFS.png` | `aston-martin-vantage-gt4.png` |
| BMW M4 G82 GT4 Evo | `BMW M4 G82 GT4 Evo - BWFS.png` | `bmw-m4-g82-gt4-evo.png` |
| Ford Mustang GT4 | `Ford Mustang GT4 - BWFS.png` | `ford-mustang-gt4.png` |
| McLaren 570S GT4 | `McLaren 570S GT4 - BWFS.png` | `mclaren-570s-gt4.png` |
| Mercedes-AMG GT4 | `Mercedes AMG GT4 - BWFS.png` | `mercedes-amg-gt4.png` |
| Porsche 718 Cayman GT4 | `Porsche 718 Cayman GT4 - BWFS.png` | `porsche-718-cayman-gt4.png` |

`falken-lmp3/`:

| Car | Old filename | New filename |
|-----|-------------|--------------|
| LMP3 | `LMP3 Decals - BWFS.png` | `lmp3.png` |

**Implementation approach:** Use a shell script (not individual `git mv` calls) to batch the renames in a single commit. Rename directories first, then files within each directory.

**Keep `decals/example/` untouched** — compositor tests depend on its existing files.

**Verify:** `find decals -name "*.png" | grep -v example | grep " "` should return nothing (no spaces left).

---

### Step 2 — Write `decals/config.json`

Complete replacement using the new file paths. Config entry format:

```json
{
  "carModels": {
    "<car-id>": {
      "label": "Human-readable name for UI display",
      "group": "GT3 Sprint | BWEC | Falken",
      "decals": {
        "base": [],
        "classSpecific": { "AM": [...], "PRO-AM": [...], "PRO": [...], "ROOKIE": [...] }
      }
    }
  }
}
```

Cars without class decals omit `classSpecific`. GT3 Sprint cars have `"base": []` (required — `apply.ts` spreads it).

**GT3 Sprint cars** (group: `"GT3 Sprint"`, hasClassDecals: true) — example entry:

```json
"ferrari-296-gt3-sprint": {
  "label": "Ferrari 296 GT3",
  "group": "GT3 Sprint",
  "decals": {
    "base": [],
    "classSpecific": {
      "AM":     [{ "file": "gt3-am/ferrari-296-gt3.png",     "x": 0, "y": 0, "width": 2048, "height": 2048 }],
      "PRO-AM": [{ "file": "gt3-proam/ferrari-296-gt3.png",  "x": 0, "y": 0, "width": 2048, "height": 2048 }],
      "PRO":    [{ "file": "gt3-pro/ferrari-296-gt3.png",    "x": 0, "y": 0, "width": 2048, "height": 2048 }],
      "ROOKIE": [{ "file": "gt3-rookie/ferrari-296-gt3.png", "x": 0, "y": 0, "width": 2048, "height": 2048 }]
    }
  }
}
```

All 11 GT3 Sprint IDs and labels:

| ID | Label |
|----|-------|
| `acura-nsx-gt3-evo-sprint` | Acura NSX GT3 Evo |
| `aston-martin-vantage-gt3-evo-sprint` | Aston Martin Vantage GT3 Evo |
| `audi-r8-lms-gt3-evo-sprint` | Audi R8 LMS GT3 Evo |
| `bmw-m4-gt3-sprint` | BMW M4 GT3 |
| `corvette-z06-gt3r-sprint` | Corvette Z06 GT3.R |
| `ferrari-296-gt3-sprint` | Ferrari 296 GT3 |
| `lamborghini-huracan-gt3-evo-sprint` | Lamborghini Huracán GT3 Evo |
| `mclaren-720s-gt3-sprint` | McLaren 720S GT3 |
| `mercedes-amg-gt3-evo-sprint` | Mercedes-AMG GT3 Evo |
| `ford-mustang-gt3-sprint` | Ford Mustang GT3 |
| `porsche-992-gt3r-sprint` | Porsche 992 GT3 R |

**BWEC GT3 cars** (group: `"BWEC"`, hasClassDecals: false) — example:

```json
"ferrari-296-gt3-bwec": {
  "label": "Ferrari 296 GT3",
  "group": "BWEC",
  "decals": {
    "base": [{ "file": "bwec-gt3/ferrari-296-gt3.png", "x": 0, "y": 0, "width": 2048, "height": 2048 }]
  }
}
```

IDs follow the same pattern with `-bwec` suffix and `bwec-gt3/` path prefix.

**BWEC GTP cars** (group: `"BWEC"`, hasClassDecals: false):

| ID | Label | File |
|----|-------|------|
| `acura-arx-06-gtp` | Acura ARX-06 GTP | `bwec-gtp/acura-arx-06-gtp.png` |
| `bmw-m-hybrid-v8-gtp` | BMW M Hybrid V8 GTP | `bwec-gtp/bmw-m-hybrid-v8-gtp.png` |
| `cadillac-v-series-r-gtp` | Cadillac V-Series.R GTP | `bwec-gtp/cadillac-v-series-r-gtp.png` |
| `ferrari-499p` | Ferrari 499P | `bwec-gtp/ferrari-499p.png` |
| `porsche-963-gtp` | Porsche 963 GTP | `bwec-gtp/porsche-963-gtp.png` |

**Falken GT4 cars** (group: `"Falken"`, hasClassDecals: false):

| ID | Label | File |
|----|-------|------|
| `aston-martin-gt4-falken` | Aston Martin Vantage GT4 | `falken-gt4/aston-martin-vantage-gt4.png` |
| `bmw-m4-g82-gt4-evo-falken` | BMW M4 G82 GT4 Evo | `falken-gt4/bmw-m4-g82-gt4-evo.png` |
| `ford-mustang-gt4-falken` | Ford Mustang GT4 | `falken-gt4/ford-mustang-gt4.png` |
| `mclaren-570s-gt4-falken` | McLaren 570S GT4 | `falken-gt4/mclaren-570s-gt4.png` |
| `mercedes-amg-gt4-falken` | Mercedes-AMG GT4 | `falken-gt4/mercedes-amg-gt4.png` |
| `porsche-718-cayman-gt4-falken` | Porsche 718 Cayman GT4 | `falken-gt4/porsche-718-cayman-gt4.png` |

**Falken LMP3** (group: `"Falken"`, hasClassDecals: false):

| ID | Label | File |
|----|-------|------|
| `lmp3-falken` | LMP3 | `falken-lmp3/lmp3.png` |

---

### Step 3 — Update `backend/src/routes/config.ts`

Add `group: string` to `CarModelConfig` interface and include it in the API response:

```typescript
// In CarModelConfig interface — add:
group: string;

// In the response construction loop:
carModels[id] = {
  label: car.label,
  group: car.group,          // ADD THIS
  hasClassDecals: ...,
};
```

No changes to `apply.ts` — it only reads `decals`, not `group` or `label`.

---

### Step 4 — Update `frontend/src/types/config.ts`

Add `group: string` to `ApiCarModel`:

```typescript
export interface ApiCarModel {
  label: string;
  group: string;   // ADD THIS
  hasClassDecals: boolean;
}
```

This is the type boundary — TypeScript will surface all places (component files, test mocks) where `group` must be added.

---

### Step 5 — Update `frontend/src/components/CarModelSelect.tsx`

Replace the flat `Object.entries` render with grouped `<optgroup>` rendering. Preserve config insertion order for group ordering:

```tsx
{config && (() => {
  const groupOrder: string[] = [];
  const grouped: Record<string, Array<[string, ApiCarModel]>> = {};
  for (const [id, car] of Object.entries(config.carModels)) {
    if (!grouped[car.group]) {
      groupOrder.push(car.group);
      grouped[car.group] = [];
    }
    grouped[car.group].push([id, car]);
  }
  return groupOrder.map((groupName) => (
    <optgroup key={groupName} label={groupName}>
      {grouped[groupName].map(([id, car]) => (
        <option key={id} value={id}>{car.label}</option>
      ))}
    </optgroup>
  ));
})()}
```

---

### Step 6 — Update `backend/src/__tests__/config.test.ts`

Replace references to old placeholder IDs. Update existing 4 tests; add 2 new:

- **Test 2:** `ferrari-296-gt3-sprint` → `hasClassDecals: true`, `group: 'GT3 Sprint'`
- **Test 3:** `ferrari-296-gt3-bwec` → `hasClassDecals: false`, `group: 'BWEC'`
- **Test 4:** Every car has `{ label: String, group: String, hasClassDecals: Boolean }`
- **Test 5 (new):** Total car count is 34
- **Test 6 (new):** Exactly 3 distinct group values: `'GT3 Sprint'`, `'BWEC'`, `'Falken'`

---

### Step 7 — Update `backend/src/__tests__/apply.test.ts`

**Part A — Update existing error-case tests:**
- `ferrari-296-gt3` → `ferrari-296-gt3-sprint`
- `porsche-911-gt3-r` → `ferrari-296-gt3-bwec`

**Part B — Add per-car `test.each` integration tests:**

```typescript
describe('per-car-model compositing', () => {
  let liveryBuffer: Buffer;

  beforeAll(async () => {
    liveryBuffer = await sharp({
      create: { width: 2048, height: 2048, channels: 4, background: { r: 100, g: 100, b: 100, alpha: 1 } },
    }).png().toBuffer();
  });

  const nonClassDecalCars: [string][] = [
    // 11 BWEC GT3 + 5 BWEC GTP + 6 Falken GT4 + 1 Falken LMP3
    ['acura-nsx-gt3-evo-bwec'], ['ferrari-296-gt3-bwec'], /* ...all 23... */
  ];

  const classDecalCars: [string][] = [
    // 11 GT3 Sprint
    ['acura-nsx-gt3-evo-sprint'], ['ferrari-296-gt3-sprint'], /* ...all 11... */
  ];

  test.each(nonClassDecalCars)('composites %s (no driverClass)', async (carModelId) => {
    const res = await request(app)
      .post('/api/apply')
      .attach('livery', liveryBuffer, { filename: 'livery.png', contentType: 'image/png' })
      .field('carModel', carModelId);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/image\/png/);
  });

  test.each(classDecalCars)('composites %s with driverClass AM', async (carModelId) => {
    const res = await request(app)
      .post('/api/apply')
      .attach('livery', liveryBuffer, { filename: 'livery.png', contentType: 'image/png' })
      .field('carModel', carModelId)
      .field('driverClass', 'AM');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/image\/png/);
  });
});
```

Use a static inline data table (not dynamic config.json read) for deterministic test discovery. Total: 34 new integration tests.

---

### Step 8 — Update frontend tests

**`frontend/src/__tests__/CarModelSelect.test.tsx`:**
- Add `group` to mock entries; use two distinct groups in the mock
- Use distinct labels per car in the mock (avoid `getByRole` ambiguity from identical labels across groups)
- Add test: one `<optgroup>` element per distinct group
- Add test: each car is inside its correct `<optgroup>`
- Update any test referencing old car IDs

**`frontend/src/__tests__/useConfig.test.ts` and `App.test.tsx`:**
- Add `group` field to all `ApiCarModel` mock objects (TypeScript will require this after Step 4)

---

### Step 9 — Documentation

**`ARCHITECTURE.md`:**
- Update `/api/config` endpoint description: response now includes `group`
- Update config schema reference to show `group` field and file naming convention
- Note that `CarModelSelect` uses `<optgroup>` elements grouped by series

**`CONTRIBUTING.md`:**
- Update "Adding a new car model" to document:
  - `group` field requirement
  - Series suffix convention for IDs (`-sprint`, `-bwec`, `-falken`)
  - File naming: `{car-name}.png` in the appropriate directory, all lowercase-with-dashes
  - New series: just introduce a new `group` string value — UI renders it automatically
  - Per-car test entry in `apply.test.ts` `test.each` table

---

## Critical Files

| File | Change |
|------|--------|
| `decals/` (directories + 86 PNGs) | Rename to lowercase-with-dashes |
| `decals/config.json` | Complete rewrite — all 34 cars, clean file paths |
| `backend/src/routes/config.ts` | Add `group` to interface + response |
| `frontend/src/types/config.ts` | Add `group: string` to `ApiCarModel` |
| `frontend/src/components/CarModelSelect.tsx` | Flat list → `<optgroup>` rendering |
| `backend/src/__tests__/config.test.ts` | Update IDs, add group/count assertions |
| `backend/src/__tests__/apply.test.ts` | Update IDs, add 34 per-car `test.each` tests |
| `frontend/src/__tests__/CarModelSelect.test.tsx` | Add group field to mocks, add optgroup tests |
| `frontend/src/__tests__/useConfig.test.ts` | Add `group` to mock objects |
| `frontend/src/__tests__/App.test.tsx` | Add `group` to mock objects |
| `ARCHITECTURE.md` | Update config schema + API docs |
| `CONTRIBUTING.md` | Update "Adding a car model" instructions |

---

## Verification

```bash
# After Step 1 — no spaces in decal filenames
find decals -name "*.png" | grep -v example | grep " "
# → (no output)

# After Step 2 — 34 car models in config
node -e "const c=JSON.parse(require('fs').readFileSync('decals/config.json','utf8')); console.log(Object.keys(c.carModels).length)"
# → 34

# After Steps 3–5 — no type errors
npm run typecheck
# → clean

# After Steps 6–8 — all tests pass
npm test --workspaces
npm run test:coverage --workspace=backend    # → ≥80%
npm run test:coverage --workspace=frontend   # → ≥80%

# Full health check
npm run lint
npm run dev
# → UI shows 3 optgroups: "GT3 Sprint" (11 cars), "BWEC" (16 cars), "Falken" (7 cars)
```

### Edge cases confirmed
- `base: []` on GT3 Sprint cars is safe — `apply.ts` spreads it: `const entries = [...carConfig.decals.base]`
- File paths no longer contain spaces — no encoding concerns
- Two cars share the same `label` (e.g. "Ferrari 296 GT3" in Sprint and BWEC) — `value` is always the unique ID, so selection is unambiguous
- 34 integration tests do real Sharp compositing on 2048×2048 images; expect ~30–60s for the backend suite
