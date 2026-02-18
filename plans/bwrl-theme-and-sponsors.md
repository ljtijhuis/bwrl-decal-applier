# Plan: BWRL Theme, Logo, Favicon & Sponsors

## Context

The app currently uses a generic dark-blue colour scheme. The goal is to brand it with the official Broken Wing Racing League visual identity: dark forest green header with orange accents (matching the BWRL badge's colours), the league logo in the header, a favicon using the same logo, and a sponsors section at the bottom of the page.

---

## Brand Colour Palette (from BWRL logo)

| Token              | Value                        | Replaces            |
| ------------------ | ---------------------------- | ------------------- |
| Background         | `#0D0D0D`                    | `#0f0f11`           |
| Surface/panels     | `#0F1F10`                    | `#16161c`           |
| Header bg          | gradient `#1B5C20 → #2E7D34` | `#1a1a20` solid     |
| Header border      | `3px solid #E8500A`          | `1px solid #2a2a35` |
| Border             | `#2A4A2D`                    | `#2a2a35`, `#333`   |
| Primary accent     | `#E8500A`                    | `#5566cc`           |
| Accent hover       | `#C94008`                    | `#4455bb`           |
| Link / code colour | `#F07030`                    | `#7788ee`           |
| Text               | `#E8E8E8`                    | unchanged           |
| Muted text         | `#888`                       | unchanged           |
| Error              | `#E05555`                    | unchanged           |

---

## Logo Asset Strategy

Two logo files exist in `plans/`:
- `plans/bwrl_logo.png` — standalone circular badge (high quality); **this is the file to use**
- `plans/bwrl_banner.png` — full banner (badge + league name text side by side); not used in the app to avoid duplicating the text that already appears in the `<h1>`

During implementation, step 1 copies `plans/bwrl_logo.png` → `frontend/public/bwrl-logo.png`. This serves both the header `<img>` (64×64) and the favicon `<link>`. No placeholder is needed — the real file already exists.

---

## Implementation Steps

### 1. Copy logo — `plans/bwrl_logo.png` → `frontend/public/bwrl-logo.png`

Copy the standalone circular badge from `plans/bwrl_logo.png` to `frontend/public/bwrl-logo.png`. This single file serves both the header `<img>` (64×64) and the favicon `<link>`. The banner file (`plans/bwrl_banner.png`) is kept as a reference but not used in the app.

### 2. Favicon + theme-color — `frontend/index.html`

Add to `<head>`:

```html
<meta name="theme-color" content="#1B5C20" /> <link rel="icon" type="image/png" href="/bwrl-logo.png" />
```

### 3. Full colour retheme — `frontend/src/App.css`

- Replace every blue/dark-neutral token with the BWRL values from the table above.
- Replace `.app-header` background with the green gradient + orange border.
- Replace `.app-header h1` / `.app-subtitle` rules with BEM rules:
  `.app-header__inner`, `.app-header__logo`, `.app-header__text`, `.app-header__title`, `.app-header__subtitle`.
- Append sponsors CSS block (see below).

**Sponsors CSS:**

```css
.sponsors {
  background: #0f1f10;
  border-top: 1px solid #2a4a2d;
  padding: 2rem 1rem;
}
.sponsors__inner {
  max-width: 1080px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
}
.sponsors__heading {
  margin: 0;
  font-size: 0.85rem;
  font-weight: 600;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}
.sponsors__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 2rem;
  justify-content: center;
  align-items: center;
}
.sponsors__item {
  display: flex;
}
.sponsors__link {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
  text-decoration: none;
  opacity: 0.75;
  transition: opacity 0.2s;
}
.sponsors__link:hover {
  opacity: 1;
}
.sponsors__logo {
  height: 48px;
  width: auto;
  max-width: 120px;
  object-fit: contain;
  filter: grayscale(30%);
  transition: filter 0.2s;
}
.sponsors__link:hover .sponsors__logo {
  filter: grayscale(0%);
}
.sponsors__name {
  font-size: 0.75rem;
  color: #888;
  text-align: center;
}
```

### 4. Header restructure + Sponsors mount — `frontend/src/App.tsx`

Replace `<header>`:

```tsx
<header className="app-header">
  <div className="app-header__inner">
    <img src="/bwrl-logo.png" alt="Broken Wing Racing League logo" className="app-header__logo" width="64" height="64" />
    <div className="app-header__text">
      <h1 className="app-header__title">Broken Wing Racing League</h1>
      <p className="app-header__subtitle">Decal Applier</p>
    </div>
  </div>
</header>
```

Add `<Sponsors />` after `</main>`:

```tsx
import { Sponsors } from './components/Sponsors';
// ...
<main className="app-main"> ... </main>
<Sponsors />
```

### 5. New component — `frontend/src/components/Sponsors.tsx`

```ts
export interface Sponsor {
  id: string;
  name: string;
  logoUrl: string; // relative path under /sponsors/ or absolute URL
  website: string;
}

// Populate SPONSORS array with real data when available.
// Website scraping was blocked by Wix JavaScript rendering;
// update this array manually with sponsor names + logo URLs.
const SPONSORS: Sponsor[] = [];

interface SponsorsProps {
  sponsors?: Sponsor[]; // optional prop for testing with injected data
}

export function Sponsors({ sponsors = SPONSORS }: SponsorsProps) {
  if (sponsors.length === 0) return null;
  // ... render section with heading + logo grid
}
```

Rendering: `<section aria-label="League sponsors">` with `<ul role="list">` grid of logo + name links.

### 6. Tests — `frontend/src/__tests__/Sponsors.test.tsx`

Cover:

- Renders nothing when `sponsors` prop is `[]`
- Renders one list item per sponsor
- Each logo has correct `alt` text
- Each link has `target="_blank"` + `rel="noopener noreferrer"`
- Each link has a descriptive `aria-label`
- Section has `aria-label="League sponsors"`
- `onError` on `<img>` hides the image (`fireEvent.error(img)`)

Use the optional `sponsors` prop to inject test data without module mocking.

### 7. Documentation

**`README.md`** — Add a "Branding" note:

- App uses the BWRL forest-green + orange theme.
- Logo served from `frontend/public/bwrl-logo.png` — replace this file to update the header image and favicon.
- Sponsor list is defined in `frontend/src/components/Sponsors.tsx` (`SPONSORS` array).

**`ARCHITECTURE.md`** — Under frontend components, add:

- `Sponsors` — static display component; sponsor data is a typed `Sponsor[]` array defined directly in the component file; no API or backend involvement.
- Note that brand assets are static files in `frontend/public/`.

**`CONTRIBUTING.md`** — Add a note: sponsor data lives in `Sponsors.tsx` as a typed array; no backend changes needed to update the list.

---

## Verification

1. `npm run dev` — confirm the header shows the green gradient with orange border, logo image renders (or placeholder), and subtitle text is readable.
2. Browser tab — favicon shows the BWRL logo PNG once the real file is in place.
3. Sponsors section — renders below the main form showing all 5 sponsors with logos and links.
4. `npm test --workspace=frontend` — all existing tests pass; new `Sponsors.test.tsx` passes; coverage stays ≥ 80%.
5. `npm run typecheck` — no TypeScript errors.
6. Mobile (780px breakpoint) — header stacks logo + text cleanly; sponsors grid wraps correctly.

---

## Critical Files

| File                                       | Change                                                                              |
| ------------------------------------------ | ----------------------------------------------------------------------------------- |
| `frontend/public/bwrl-logo.png`            | **NEW** — copied from `plans/bwrl_logo.png` (standalone circular badge)             |
| `frontend/public/sponsors/*.png`           | **NEW** — 5 sponsor logos downloaded from Wix CDN                                  |
| `frontend/index.html`                      | Add favicon link + theme-color meta                                                 |
| `frontend/src/App.css`                     | Full colour retheme + header BEM rules + sponsors CSS                               |
| `frontend/src/App.tsx`                     | Header JSX restructure + Sponsors import + mount                                    |
| `frontend/src/components/Sponsors.tsx`     | **NEW** — Sponsors component with real sponsor data (local image paths)             |
| `frontend/src/__tests__/Sponsors.test.tsx` | **NEW** — Sponsors tests                                                            |
| `README.md`                                | Branding note                                                                       |
| `ARCHITECTURE.md`                          | Sponsors component + static assets note                                             |
| `CONTRIBUTING.md`                          | Sponsors data location note                                                         |

---

## Sponsor Data (from Wix page source)

Five sponsors were extracted from `plans/sponsors.md`. Logo images will be **downloaded and stored locally** in `frontend/public/sponsors/` during implementation — the user requested local copies rather than hot-linking the Wix CDN.

### Download step (implementation step 1b)

Download each logo using `curl` to `frontend/public/sponsors/`:

| Local file                          | Wix CDN source URL                                                                                              |
|-------------------------------------|-----------------------------------------------------------------------------------------------------------------|
| `gitgud-racing.png`                 | `https://static.wixstatic.com/media/a67460_9c6470d6d3884c00b0c05f28b21b33f9~mv2.png`                          |
| `speedreels.png`                    | `https://static.wixstatic.com/media/a67460_bc6f6001571f4beeb0c9505e18d154ab~mv2.png`                          |
| `simmotion.png`                     | `https://static.wixstatic.com/media/a67460_8ffa26f7e54b4650a88db6c408c809d4~mv2.png`                          |
| `allstate-jevicky.png`              | `https://static.wixstatic.com/media/a67460_8a4902620b70477a89d0a2b55792c4b5~mv2.png`                          |
| `rdoks.png`                         | `https://static.wixstatic.com/media/a67460_7c55e6419f0643b8abc879be8f6c599a~mv2.png`                          |

### SPONSORS array (using local paths)

```ts
const SPONSORS: Sponsor[] = [
  {
    id: 'gitgud-racing',
    name: 'Gitgud Racing',
    logoUrl: '/sponsors/gitgud-racing.png',
    website: 'https://gitgudracing.com/',
  },
  {
    id: 'speedreels',
    name: 'Speed Reels',
    logoUrl: '/sponsors/speedreels.png',
    website: 'https://www.instagram.com/speedreels.official/',
  },
  {
    id: 'simmotion',
    name: 'Sim Motion',
    logoUrl: '/sponsors/simmotion.png',
    website: 'https://simmotion.com/',
  },
  {
    id: 'allstate-jevicky',
    name: 'Allstate — John Jevicky',
    logoUrl: '/sponsors/allstate-jevicky.png',
    website: 'https://agents.allstate.com/john-jevicky-pittsburgh-pa.html',
  },
  {
    id: 'rdoks',
    name: 'Rdoks',
    logoUrl: '/sponsors/rdoks.png',
    website: 'https://www.patreon.com/Rdoks',
  },
];
```
