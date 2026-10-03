# PlantTriage 🌿

A static, mobile-first web app: photograph your sick plant, tap its symptoms,
get an **honest rules-based diagnosis** and a **day-by-day 14-day revive plan**.

Built as MVP #2 from `plan-mvp-pair.md` (idea rank #2, score 8.3).

## Holy-shit frame (<15 s)

Tap **"🌱 MY money tree is DYING"** on the home screen → instant demo diagnosis
(root rot, honest confidence) → 14-day checkable revive plan → **"I saved him"**
before/after screen. No photo, no typing, no API key.

## What it does

- **Photo / upload** (camera or gallery) — used only on-device for the
  before/after comparison. Never uploaded anywhere.
- **Symptom selection** — yellowing, brown/crispy tips, drooping stems, spots,
  wilting. Multi-select.
- **Rules-based diagnosis engine** — 5 issues (overwatering/root rot,
  underwatering, sunburn, pests, nutrient deficiency) with:
  - honest confidence (LIKELY / POSSIBLE / WORTH CHECKING + %),
  - a **"how to tell for sure"** 2-second soil check,
  - a **runner-up** second opinion when two issues are a close race,
  - a **mixed-signals** warning when symptoms point both ways.
- **14-day revive plan** — one small step per day, checkable, tailored per
  diagnosis (first aid on day 1, treatment, feeding, watering habit).
  Progress persists in `localStorage`.
- **"I saved him"** — before/after screen with confetti and the transformation
  framing: *"You're the person whose plants survive."*

## Honesty note (visible in-app)

This is an **MVP demo**: a *rules engine* reading the symptoms you tap, **not a
vision model** looking at your photo. The photo is only for your own
before/after. The DeepSeek-vision-backed version is the next iteration and
needs a real backend (never ship an API key in static front-end code).

## Run it

No build step. Open `index.html`, or serve locally:

```bash
python -m http.server 8000
# → http://localhost:8000
```

Deploy: push this folder to a GitHub repo and enable Pages (root, `main`).

## Files

```
index.html      6 screens (home, photo, symptoms, diagnosis, plan, saved)
css/style.css   mobile-first, 390px-tested, warm plant-saver design
js/app.js       rules engine, plan generator, demo, localStorage persistence
```

## Tech

Vanilla HTML/CSS/JS. Zero dependencies, zero network calls, zero API keys,
works offline. Private by construction.

## Recovery progress and photos

The current rescue (including unfinished photo/symptom selection, checked days,
and before/after photos) resumes on reload. Photos are validated and resized
locally; nothing leaves the device. On the recovery screen, **Add a recovery
photo** creates a real before/after comparison; **Back to my plan** resumes the
checklist. Reporting improvement does not mark uncompleted days done.

A close alternative diagnosis can be selected after checking the distinguishing
signs. Its confidence remains **WORTH CHECKING**. Starting a new rescue clears
only the active UI session; existing per-plan storage records and unrelated
storage are retained. Earlier versions did not store enough information to
resume old plans; those records are preserved but cannot be reconstructed with
photos/symptoms. If storage is unavailable, a visible message explains that
progress remains available only in the current tab.

## End-to-end tests

Node >=22.12 and Python 3 are required. The pinned `e2e` runner from
[tester-army/e2e](https://github.com/tester-army/e2e) uses its official
`@e2e-dev/web` browser engine. Playwright is the engine's required peer,
not a separate test runner. These exact interaction tests need no model/key:

```bash
npm ci
npx playwright install chromium --with-deps
npm run test:e2e
npm run test:e2e:desktop
npm run test:e2e:mobile
```

The config starts and stops a local static server on free ports. Every test
gets isolated browser storage and uses synthetic images. No production data,
accounts, paid services or personal records are used. CI runs desktop and
390px mobile Chromium on pull requests and pushes to main and uploads reports.
See [the flow matrix](docs/e2e-audit.md).
