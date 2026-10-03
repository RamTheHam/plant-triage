# PlantTriage flow audit

Baseline: `7b3eddae6f4c8d1b961ed3740826409c07272bea`.

Runner: `e2e@0.16.0`, engine `@e2e-dev/web@0.11.2`, peer
`playwright@1.63.0`, Node 24.19.0. The actual upstream skill, setup,
writing-tests and running guides were read from tester-army/e2e. Tests use
supported `app`, `screen`, `browser`, and `expect` fixtures with no model
steps or external services.

## Flow matrix

| Journey | Automated evidence | Outcome |
| --- | --- | --- |
| Instant money-tree demo, confidence, first aid | Demo lifecycle; reload regression | Rules diagnosis and tailored plan |
| Photo skip/next, native upload/camera input | Photo draft journey, keyboard journey | Camera/gallery supported by native file input |
| Photo preview/remove/reselect, draft reload | Photo draft journey | Resized on-device image persists |
| Valid drag/drop, cancel selection | Drop journey | Accepted image stays present |
| Non-image, corrupt image, >10MB rejection, recovery-photo retry | Invalid photo and recovery error journeys | Visible errors, prior valid photo preserved |
| No symptoms, select/deselect multiple, keyboard, back | Symptom journey, all diagnosis branches | Disabled empty action and accessible selection state |
| All five issue branches and 14-day content | Five generated branch tests | Diagnosis, distinguishing check, tailored first-aid and graduation |
| Weak confidence, close runner-up, select alternative | Alternative journey | Conservative alternative confidence and selected plan survive reload |
| Wet and dry mixed signs | Mixed-signals regression | Soil check warning shown for water diagnoses too |
| Each of fourteen checks and undo | Demo lifecycle | Accurate 0–14 progress and pressed state |
| Reload / restart and resume | Regression, lifecycle, draft, saved-photo journeys | Plan ID, checked days, photos and screen resume |
| Celebrate before all days complete | Improvement regression, saved-photo journey | Celebration keeps actual progress |
| Real before/after upload/remove | Saved-photo journey | Actual images compare, persist, remove |
| Return to plan / diagnose another / restart | Demo lifecycle and saved-photo journey | Clean new active session, old storage records retained |
| Corrupt JSON / malformed plan / unsafe photo data / unavailable quota | Storage error and malformed-state journeys | Usable recovery and visible save failure warning |
| Desktop 1280px / mobile390px / narrow320px | All tests on both targets; narrow viewport journey | Six screens fit and keyboard focus remains meaningful |
| Privacy | Data-URL assertions, fixture-only local server | No photo or diagnosis API calls |

## Reproduced before fixes

`tests/regressions.e2e.ts` ran on the unchanged baseline through the actual
runner and produced three assertion failures:

1. After checking day 1, reload showed home and lost access to the plan.
2. Clicking improvement with zero checks persisted fourteen `true` values.
3. Yellowing + drooping + wilting omitted the mixed-signals warning.

The same three tests pass after the fixes. Additional completed affordances:
validated/resized photos with feedback, real recovery-photo selection/removal,
selectable diagnostic alternatives, accessible toggle states, focus retention,
reduced motion, and current-session persistence. `hidden` styling and overlay
stacking were fixed so the remove-photo action is actually usable.

## Running and evidence

```bash
npm ci
npx playwright install chromium --with-deps
E2E_TELEMETRY_DISABLED=1 npm run test:e2e
```

Validation: the complete suite passed **40/40** (20 tests × desktop and mobile),
with zero skipped tests and no model calls. A final conservative-confidence
round-trip change was verified separately on both targets (2/2).

Outputs are ignored under `.e2e/`: `report.json`, `junit.xml`, `summary.md`,
failure details and artifacts. CI retains them for seven days. No skipped,
expected-failing, stubbed-runner or Playwright Test suites are used.

In this sandbox the browser CDN returned an invalid zip. Execution used an
npm-delivered Chromium153 binary via the official `web({connect})` CDP
mechanism and the environment-only shared launcher. The launcher and browser
are not application dependencies; normal CI installs Chromium from Playwright.
`E2E_CDP_ENDPOINT` optionally connects to an already running local browser.
The sandbox isolates networking per shell call, so the fallback launcher must
start Chromium and the e2e command together.

No model authentication is present. Model-driven exploratory `agent.*` runs
were not executed; deterministic e2e journeys exercise the same app flows.
Native iOS/Android camera permission dialogs, Safari/WebKit, and real plant
recovery over fourteen calendar days are outside the executed browser checks.
Earlier orphaned per-plan records lack symptoms/photos; they remain untouched.
