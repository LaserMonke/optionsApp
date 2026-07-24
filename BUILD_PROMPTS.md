# BUILD_PROMPTS.md

**Project:** Strike — options education + institutional-grade pricing, for iOS and Android
**Stack:** Expo (React Native) · TypeScript · Skia · Supabase · RevenueCat · Python pricing service
**Tooling:** GitHub + VS Code + Claude Code
**Status:** Pre-revenue. No advice, no execution, no real money.

---

## How to use this file

Each prompt below is written to be pasted **verbatim** into Claude Code as a single session. The rules are:

1. **One prompt per session.** Run `/clear` between prompts. Context bloat is where subtle numerical errors get introduced and never noticed.
2. **Use plan mode for every prompt in Stage 2 and Stage 3** (`Shift+Tab` twice). Make Claude state the formula and its source *before* writing code. Reviewing a wrong plan costs you 30 seconds; reviewing wrong code costs you a week.
3. **Do not proceed to the next prompt until the acceptance criteria pass.** They are written to be mechanically checkable.
4. **Never accept a pricing formula without a golden test.** If Claude cannot cite a published reference value, the correct outcome is that it stops and asks you — not that it invents one.
5. **Every prompt is written to end in a green test run.** If a session ends red, `/clear` and re-run the prompt with the failure output appended. Do not patch forward on top of broken math.

Progress markers: `[ ]` not started · `[~]` in progress · `[x]` done and tests green.

---

## Table of contents

| Stage | Scope | Prompts |
|---|---|---|
| 0 | Foundation, governance, CI | 0.1 – 0.5 |
| 1 | Design system and UI kit | 1.1 – 1.4 |
| 2 | Quant core — deterministic | 2.1 – 2.6 |
| 3 | Quant core — stochastic | 3.1 – 3.5 |
| 4 | Pricing service and API boundary | 4.1 – 4.3 |
| 5 | Backend, auth, data model | 5.1 – 5.4 |
| 6 | Learning engine and content | 6.1 – 6.6 |
| 7 | Gamification and retention | 7.1 – 7.5 |
| 8 | Market data and simulator | 8.1 – 8.4 |
| 9 | Monetisation and paywall | 9.1 – 9.2 |
| 10 | Quality, compliance, launch | 10.1 – 10.6 |

---

# Constraints that override everything

Put these in `CLAUDE.md` before prompt 0.1 and treat them as non-negotiable throughout.

### Financial
- The app **never** gives investment advice, recommendations, or price targets. Copy is descriptive ("this model produces…"), never prescriptive ("you should…").
- Every pricing output carries a model-output disclaimer. Model prices are **not** quotes, valuations, or marks.
- The simulator uses **fake money only**. No real orders, no brokerage links, no order routing, ever, in any build.
- "How to make money with options" is a **learning-outcome** framing, not a promise. Acceptable: "Understand how traders express a view and where the risk sits." Not acceptable: "Make money with options." This distinction is both an App Store review issue and a financial-promotions issue in the UK/EU.

### Legal and store policy — three things in the brief that need changing
- **The "donation" unlock will be rejected.** Apple requires in-app purchase for any unlock of digital content or functionality. A donation that grants access to the simulator is a purchase, not a donation. Ship it as a **non-consumable IAP or an auto-renewing subscription** via RevenueCat. Genuine charitable donations are a separate mechanism and cannot unlock anything.
- **Leaderboard bots must be labelled.** Presenting synthetic accounts as real users is deceptive and creates both App Store 2.3 exposure and consumer-protection exposure. Ship them in a visually distinct, explicitly labelled **"Practice ladder"** — a benchmark to beat, not fake peers. Real-user leaderboards stay separate and real.
- **Market data licensing is a redistribution question, not a pricing question.** Most retail-priced feeds forbid display in a consumer app. The app must be **fully functional on user-entered inputs**, with any live feed as an optional layer. Confirm redistribution rights in writing before the feed ships.

### Privacy
- Minimum age 13 (16 in EEA). Do **not** enter the Kids category — it triggers COPPA obligations you do not want.
- Collect the minimum: username, email, education level, progress. No contacts, no location, no advertising identifiers.
- Complete the App Privacy nutrition label honestly at the same time as prompt 10.4, not after.

### Engineering
- `packages/quant` imports **nothing** from React, Expo, or React Native. Pure TypeScript, runs in Node.
- Time is **always in years**. Volatility is **always decimal** (0.20, never 20). Rates are **always continuously compounded** unless the symbol says otherwise. Document units in JSDoc on every exported function.
- No `any`. No non-null assertions in `packages/quant`.
- Secrets never enter the repo. Supabase anon key is public by design; the service role key is not and must never appear in the app bundle.

---

# Stage 0 — Foundation

### [ ] 0.1 — Repo, monorepo layout, governance files

```
Set up a pnpm monorepo for a React Native options education and pricing app.

Structure:
  packages/quant/       Pure TypeScript quant library. ZERO React/Expo imports.
  packages/shared/      Types shared between app and pricing service (Zod schemas).
  apps/mobile/          Expo app (Expo Router, TypeScript strict).
  services/pricer/      Python FastAPI heavy-compute service (stub for now).
  docs/

Requirements:
- TypeScript strict everywhere. noUncheckedIndexedAccess on. No `any`.
- Vitest for packages/quant and packages/shared. Tests must run in plain Node
  with no simulator and no transpile step beyond esbuild.
- ESLint + Prettier. Add an ESLint rule that FAILS the build if anything under
  packages/quant imports react, react-native, or expo.
- Root scripts: test, test:quant, test:golden, lint, typecheck.

Then create CLAUDE.md at the repo root containing the invariants I paste below,
verbatim, under a "Non-negotiables" heading, plus a Commands section listing the
root scripts.

[PASTE THE "Constraints that override everything" SECTION FROM BUILD_PROMPTS.md HERE]

Do not scaffold the Expo app yet. Do not write any pricing code yet.
```

**Acceptance:** `pnpm install && pnpm typecheck && pnpm lint` clean. Adding `import React from 'react'` to any file in `packages/quant` fails lint.

---

### [ ] 0.2 — Expo app scaffold, SDK pinned deliberately

```
Scaffold the Expo app at apps/mobile.

Before writing anything, check the current Expo SDK situation and tell me which
SDK version supports Expo Go on a physical iOS device right now, because Expo Go
only ships the latest SDK and older SDKs stop working in it. I want to develop in
Expo Go for the first few weeks, so pin whichever SDK that is and state the version
you chose and why.

Include:
- Expo Router with a tab layout: Learn, Practice, Pricer, Profile
- TypeScript strict, path aliases @quant/*, @shared/*
- react-native-reanimated, react-native-gesture-handler
- @shopify/react-native-skia
- zustand, zod, @tanstack/react-query
- expo-secure-store, expo-notifications, expo-haptics

Verify @shopify/react-native-skia runs in Expo Go on the SDK you picked. If it does
not, say so and stop — do not silently substitute a different graphics library.

Add a docs/EXPO_GO_LIMITS.md listing every dependency we may want later that will
force us off Expo Go and onto a development build.
```

**Acceptance:** `npx expo start`, QR scans, app opens in Expo Go on a physical device, tabs navigate, a Skia canvas renders a filled circle.

---

### [ ] 0.3 — The validation harness (before any pricer exists)

This prompt is the single highest-leverage item in the file. Run it before Stage 2.

```
In packages/quant/test/, build the validation harness that every pricer will be
tested against. No pricers exist yet — write the harness against interfaces.

1. test/properties.ts — reusable property assertions:
   - putCallParity(pricer, params, tol)
   - inOutParity(barrierPricer, params, tol)      // KI + KO = vanilla
   - digitalAsCallSpreadLimit(pricer, params)
   - monotonicInVol, monotonicInStrike, butterflyNonNegative
   - americanGeEuropean, americanCallEqualsEuropeanWhenNoDividend
   - worstOfLeMinSingles, bestOfGeMaxSingles
   - correlationLimitCollapsesToSingleAsset
   - greeksMatchCentralDifference(pricer, greekFn, params, relTol)
   - mcConvergesAsInvSqrtN(mcPricer, params)   // fit log-log slope, expect -0.5 +/- 0.05

2. test/golden/ — reference price fixtures as JSON, one file per source:
   hull.json, reiner-rubinstein.json, andersen-qe.json, albrecher-trap.json,
   fang-oosterlee-cos.json, broadie-glasserman-kou.json
   Each entry: { source, table, inputs, expected, tolerance, note }
   Leave the arrays EMPTY for now with a schema and a validator that rejects any
   entry missing a `source` string.

3. test/harness.md — how to add a new pricer to the harness.

Rule to encode in the validator and in CLAUDE.md: a golden entry with no citable
source is a test failure, not a passing test. Never fabricate a reference value.
```

**Acceptance:** `pnpm test:quant` runs and passes with zero pricers. Adding a golden entry without a `source` field fails.

---

### [ ] 0.4 — Claude Code automation: hooks and a verifier subagent

```
Configure Claude Code for this repo.

1. .claude/settings.json — a PostToolUse hook on Edit/Write that runs
   `pnpm test:quant` whenever a file under packages/quant changes, and surfaces
   failures immediately.

2. .claude/agents/quant-verifier.md — a subagent whose ONLY job is adversarial
   testing of a newly written pricer. It must never write or fix implementation
   code. Given a pricer, it generates tests for:
     T -> 0, T very large, sigma -> 0, sigma -> 3.0, K -> 0, K -> 10*S,
     barrier exactly at spot, barrier already breached, rho = +/-1,
     zero and negative rates, deep ITM and deep OTM, dividend yield > rate
   It reports which cases produce NaN, Infinity, negative prices, or violated
   no-arbitrage bounds. It does not fix them — it reports.

3. .claude/agents/content-reviewer.md — reviews lesson copy for: prescriptive
   advice language, return promises, missing disclaimers, and reading level
   mismatch against the lesson's declared audience tier.
```

**Acceptance:** Editing a file in `packages/quant` triggers the test run. `@quant-verifier` is invokable.

---

### [ ] 0.5 — CI

```
Add GitHub Actions:
- ci.yml on every PR: install, typecheck, lint, test:quant, test:golden,
  and expo-doctor on apps/mobile. All must pass to merge.
- A separate job that runs the ESLint boundary rule and fails loudly if
  packages/quant gained a React dependency.
- Branch protection notes in docs/CONTRIBUTING.md.
```

**Acceptance:** A PR that breaks a golden test cannot merge.

---

# Stage 1 — Design system

### [ ] 1.1 — Tokens and typography

```
Build the design system at apps/mobile/src/theme/.

Direction: black, white, and blue. Institutional, not retail. The reference points
are a trading terminal and a well-set financial journal — dense, quiet, precise —
not a crypto app and not a pastel edtech app. Spend the boldness in exactly one
place: the data visualisations. Everything around them stays disciplined.

Palette — 6 named tokens, dark-first:
  surface       near-black, NOT pure black   (#0A0B0D range)
  surfaceRaised one step up
  hairline      low-contrast divider, 1px, used instead of cards where possible
  ink           near-white primary text
  inkMuted      secondary text
  accent        one blue, used sparingly and only for state and data
Plus semantic: positive, negative, warning. Positive/negative must NOT be the only
signal for anything — always pair with a sign or a label.

Typography — three roles:
  display   headlines, restrained
  body      prose, high legibility at small sizes
  numeric   ALL figures. Must be tabular-lining. This is non-negotiable.
Numbers must never change width as they update. Set a type scale with explicit
weights and line heights, not multipliers.

Also define: fixed decimal places per field type (price 4dp, greeks 4dp, vol as
percent 2dp, correlation 2dp, money 2dp), spacing scale, radii (small — this is
not a rounded-card product), and elevation.

Provide a light theme too, derived from the same tokens.

Write a short docs/DESIGN.md explaining the choices, then build the tokens.
```

**Acceptance:** A demo screen renders the full scale. A number animating from `9.9999` to `10.0001` does not shift horizontally.

---

### [ ] 1.2 — Primitives

```
Build the UI primitives on top of the tokens. Every one must handle dark and light,
respect reduced motion, meet 44pt touch targets, and expose accessibility labels.

Text, Screen, Row, Divider, Button (primary/secondary/ghost/destructive),
NumericField, LabeledValue, Slider (Reanimated, updates a shared value with NO
React re-render on drag), SegmentedControl, Chip, Sheet, Toast, Skeleton,
EmptyState, ErrorState, ProgressRing, Badge.

Copy rules for every component that renders text: active voice, sentence case,
the button's verb matches the resulting toast ("Save" -> "Saved"). Errors state
what happened and what to do, and never apologise. Empty states invite an action.
```

**Acceptance:** Storybook-style demo route shows all primitives in both themes. Dragging the slider at 60fps produces zero React renders (verify with the profiler).

---

### [ ] 1.3 — Chart kit (Skia)

```
Build the chart primitives in Skia at apps/mobile/src/charts/.

  PayoffChart      payoff at expiry + P&L including premium, multi-leg, with a
                   filled region above/below breakeven and marked breakevens
  GreekChart       one greek vs spot, with a term overlay (multiple T on one axis)
  SmileChart       implied vol vs strike or log-moneyness
  SurfaceChart     vol surface as a heatmap (do a 3D mesh only if it stays 60fps)
  PathFan          Monte Carlo paths with a percentile band, capped at 200 drawn
                   paths regardless of simulation count
  DistributionChart terminal payoff histogram with mean/median/percentile markers
  LadderChart      autocall probability by observation date

Requirements:
- 60fps while a slider drives the inputs. Interpolate on the UI thread.
- Axis labels use the numeric typeface, tabular.
- Every chart takes a `crosshair` prop giving a readout at the touch point.
- Every chart has an accessibility summary describing the shape in words, for
  screen readers. This is not optional — it is the whole content for those users.
```

**Acceptance:** Payoff chart of a long straddle redraws under 16ms on a mid-range Android device while dragging spot.

---

### [ ] 1.4 — App shell and navigation

```
Build the shell: tab layout (Learn, Practice, Pricer, Profile), stack transitions,
a header with streak and XP that is present but quiet, deep link config, and
splash/icon assets in the palette.

Add a global DisclaimerBar component that appears on every screen showing a model
price. It is persistent, not dismissible, and reads:
"Model output. Not a quote, valuation, or investment advice."
```

**Acceptance:** Cold start under 2s on a mid-range Android device. Deep links resolve.

---

# Stage 2 — Quant core, deterministic tier

> Runs on-device in TypeScript. Powers every slider and every lesson widget. Must be exact and fast.

### [ ] 2.1 — Black-Scholes-Merton and the Greeks

```
Use plan mode. State every formula and its source before writing code.

Implement packages/quant/src/analytic/bs.ts:
- Black-Scholes-Merton with continuous dividend yield q
- Black-76 for futures/forwards
- A discrete-dividend variant using the escrowed-spot adjustment, documented as an
  approximation with its failure modes stated in the JSDoc
- Greeks ANALYTICALLY, not by bumping: delta, gamma, vega, theta, rho, plus
  vanna, volga, charm, veta, speed, zomma, colour
- Implied volatility: bounded Brent or Jaeckel's rational-initial-guess method.
  NOT raw Newton — it diverges deep OTM. Must return a diagnostic when the target
  price violates no-arbitrage bounds rather than returning a garbage number.

Units, stated in JSDoc on every export: T in years, sigma decimal, r and q
continuously compounded.

Use a high-accuracy erf/normal CDF (Cody or West's double-precision routine).
The naive Abramowitz-Stegun approximation is not accurate enough for the Greeks
at the tails — say which one you used and its stated accuracy.

Tests, all through the Stage 0 harness:
- Golden values from Hull, Options Futures and Other Derivatives. Cite table numbers.
- Put-call parity to 1e-12
- Every analytic greek vs central difference, relative error < 1e-5
- IV round-trip: price -> IV -> price recovers to 1e-10 across a strike/maturity grid
- Monotonicity and butterfly non-negativity
Then run @quant-verifier against it and fix everything it finds.
```

**Acceptance:** All golden tests cite a real source. Verifier reports no NaN/Inf across its edge grid.

---

### [ ] 2.2 — American options

```
Implement packages/quant/src/analytic/american.ts:
- Bjerksund-Stensland 2002 closed-form approximation
- Cox-Ross-Rubinstein binomial with Richardson extrapolation, as the reference
  and as the teaching implementation (lessons will step through the tree)
- Leisen-Reimer for faster convergence

Expose the binomial tree's intermediate nodes through an optional callback so a
lesson widget can visualise the tree and the early-exercise boundary.

Tests: American >= European always; American call = European call when q = 0;
Bjerksund-Stensland within 0.5% of a 5000-step binomial across a moneyness grid;
CRR converges to Black-Scholes as steps increase (fit the convergence rate).
```

---

### [ ] 2.3 — Barriers, KO, KI, digitals

```
Use plan mode. This is where sign errors hide and produce plausible numbers.

Implement packages/quant/src/analytic/barriers.ts:
- All eight Reiner-Rubinstein continuous-barrier cases:
  up/down x in/out x call/put, with rebates
- Rebate paid at hit vs rebate paid at expiry as SEPARATE, explicitly named cases
- Cash-or-nothing and asset-or-nothing digitals
- Double barrier via the Ikeda-Kunitomo series, with a documented truncation rule
- DISCRETE monitoring: apply the Broadie-Glasserman-Kou continuity correction,
  shifting the barrier by exp(+/- 0.5826 * sigma * sqrt(T/m)). Sign depends on
  up vs down. Expose monitoring frequency as a first-class parameter and default
  to DAILY, not continuous — continuous monitoring is the unrealistic case and
  should be opt-in.
- Handle the already-breached case explicitly: a knocked-out option is worth the
  rebate, a knocked-in option is worth the vanilla. Never return a formula value
  for a breached barrier.

Tests:
- Golden values from Reiner and Rubinstein's original worked examples. Cite them.
- In-out parity: KI + KO = vanilla, to 1e-10, for all eight combinations
- Barrier far from spot converges to the vanilla price
- Barrier at spot behaves continuously as it crosses
- BGK-corrected discrete price sits between the continuous price and a
  high-resolution Monte Carlo discrete price, and converges to continuous as m -> inf
Run @quant-verifier. Pay specific attention to the sign of the correction.
```

**Acceptance:** In-out parity holds for all eight cases. The BGK correction moves the price in the correct direction for both up and down barriers — verify this by hand on one case before accepting.

---

### [ ] 2.4 — Multi-asset closed forms

```
Implement packages/quant/src/analytic/twoAsset.ts:
- Margrabe exchange option
- Stulz two-asset best-of and worst-of (max and min options)
- Spread option via Kirk's approximation, with its accuracy caveat documented
- Bivariate normal CDF (Drezner-Wesolowsky or Genz), stating accuracy

These give exact answers to check the Monte Carlo basket pricers against later,
which is the whole reason they exist. Note that in the test file.

Tests: worst-of <= min of singles; best-of >= max of singles; rho -> 1 collapses
to a single-asset case; best-of + worst-of = sum of the two vanillas.
```

---

### [ ] 2.5 — Strategy engine

```
Implement packages/quant/src/products/strategies.ts.

A Strategy is a list of Legs. A Leg is {kind, right, K, T, qty, premium, multiplier}
where kind covers underlying, european, american, digital, barrier.

Compute:
- Net payoff at expiry, ANALYTICALLY as a piecewise-linear function with exact
  breakpoints. Do not sample on a grid — the chart must stay smooth under gesture
  and the breakevens must be exact, not interpolated.
- Net P&L including premium
- Net Greeks (sum of leg Greeks, sign-correct for shorts)
- Max profit, max loss, all breakevens, and whether each bound is finite
- Margin-style risk summary: worst case at +/- 3 sigma over the position's horizon

Preset strategies, each with structured metadata (view expressed, vol exposure,
theta sign, defined vs undefined risk):
long/short call/put, covered call, protective put, collar,
bull/bear call and put spreads, straddle, strangle, guts,
butterfly (long/short, call/put/iron), condor, iron condor, iron butterfly,
calendar, diagonal, ratio spreads (call/put), backspreads,
risk reversal, box, jelly roll, synthetic long/short, strap, strip.

Tests: box spread prices to the discounted strike difference; synthetic long
equals underlying to within the carry; iron condor max loss equals width minus
credit; every preset's stated max loss matches the computed payoff minimum.
```

**Acceptance:** Every preset's declared metadata is verified against the computed payoff, not just asserted.

---

### [ ] 2.6 — Volatility surface

```
Implement packages/quant/src/surface/:
- SVI parameterisation (raw and jump-wings), calibrated by least squares
- Arbitrage checks on the fitted surface: butterfly (Durrleman condition) and
  calendar. A fit that fails either must be REPORTED as failing, not silently used.
- Dupire local volatility from the fitted implied surface, with the standard
  regularisation for the denominator near zero
- Interpolation in total variance, not in vol, along the time axis
- SABR (Hagan) with the Obloj correction for small strikes

Tests: fit to a synthetic surface generated from known Heston parameters and
recover it; arbitrage checks correctly flag a deliberately arbitrageable input set.
```

---

# Stage 3 — Quant core, stochastic tier

### [ ] 3.1 — Heston, semi-analytic

```
Use plan mode. Cite the paper and the equation number for the characteristic
function you choose before writing anything.

Implement packages/quant/src/semianalytic/hestonCOS.ts using the COS method
(Fang and Oosterlee 2008).

CRITICAL: use the Little Trap / Albrecher formulation of the characteristic
function. The original Heston form has a complex-logarithm branch cut that
oscillates and produces wrong prices for longer maturities. This is the single
most common Heston bug and it produces numbers that look completely reasonable.
State explicitly in a code comment which formulation you used and why.

Also implement:
- Truncation range via the cumulant-based rule from the paper
- Adaptive N (number of cosine terms) with a convergence check
- Carr-Madan FFT as an independent cross-check implementation

Tests:
- Golden values from Fang and Oosterlee's tables. Cite them.
- Vol-of-vol -> 0 with v0 = theta must reproduce Black-Scholes to 1e-8
- COS and Carr-Madan agree to 1e-6
- Long maturity (T = 10, 15, 20) stays stable — this is the trap test, and it is
  the reason the whole prompt exists
- Feller condition violated (2*kappa*theta < xi^2) still produces finite prices
- Put-call parity on Heston prices
```

**Acceptance:** T = 20 prices are smooth and monotone in strike. If they oscillate, the characteristic function is wrong — do not proceed.

---

### [ ] 3.2 — Random number generation

```
Implement packages/quant/src/mc/rng.ts:
- A seeded, reproducible PRNG (PCG32 or xoshiro256**). Never Math.random.
- Sobol sequence with Owen scrambling, direction numbers from Joe and Kuo,
  supporting at least 1024 dimensions
- Inverse normal CDF via Acklam or Wichura AS241, stating accuracy
- Brownian bridge construction for path generation (so Sobol's low dimensions
  carry the most variance)
- Antithetic pairing

Tests: seeded runs are bit-identical across processes; Sobol's discrepancy beats
pseudorandom on a known integral; the inverse normal matches the forward CDF to
1e-9 across the range including tails.
```

---

### [ ] 3.3 — Monte Carlo engine

```
Use plan mode.

Implement packages/quant/src/mc/engine.ts.

Discretisation:
- GBM exact
- Heston via Andersen's QE scheme WITH the martingale correction. Do NOT use
  Euler on the variance process — it goes negative and biases every price. State
  this in a comment.
- Bates (Heston + Merton jumps)
- A local-stochastic-vol (LSV) path generator using the Dupire leverage function

Variance reduction, all switchable and all reported in the output:
- Antithetic variates
- Control variate using the analytic Black-Scholes (or Heston COS) price
- Sobol + Brownian bridge
- Importance sampling for deep OTM, optional

Path features the payoff layer needs:
- Running min/max with the BROWNIAN BRIDGE exit-probability correction for
  barriers. Checking the barrier only at grid points systematically underprices
  knock-outs — this correction is required, not optional.
- Running average (arithmetic and geometric) for Asians
- Observation-date sampling for callable/autocallable schedules

Output must ALWAYS include: price, standard error, 95% CI, paths used, time
elapsed, and which variance reduction techniques were active. A Monte Carlo price
without a standard error is not a price. Enforce this in the return type.

Greeks:
- Pathwise derivative where the payoff is differentiable
- Likelihood ratio where it is not
- Bump-and-revalue with COMMON RANDOM NUMBERS enforced by the type system — the
  same seed must be reused across bumps or the Greeks are noise

Tests:
- MC vanilla converges to Black-Scholes within 3 standard errors at 1e6 paths
- Standard error scales as 1/sqrt(N): fit the log-log slope, expect -0.5 +/- 0.05
- MC barrier with the bridge correction matches the analytic continuous barrier
- MC Heston matches the COS price within 3 standard errors
- Geometric Asian matches its closed form exactly (this is the cleanest MC test
  available — use it)
- Control variate demonstrably reduces standard error by >3x on a vanilla
```

**Acceptance:** Convergence slope test passes. Barrier MC without the bridge correction visibly overprices the knock-out relative to analytic — verify the correction fixes it.

---

### [ ] 3.4 — Longstaff-Schwartz and multi-asset

```
Implement:
- packages/quant/src/mc/lsm.ts — Longstaff-Schwartz least-squares Monte Carlo for
  early exercise and callable features. Basis functions configurable (Laguerre,
  polynomial). Use only in-the-money paths in the regression, per the paper.
  Report the low-bias/high-bias duality if you implement both estimators.
- packages/quant/src/mc/multiAsset.ts — correlated multi-asset paths.

CRITICAL for multi-asset: run Higham's nearest-correlation-matrix algorithm on
the input correlation matrix BEFORE Cholesky. User-entered correlation matrices
are almost never positive semi-definite and Cholesky will simply throw. Report to
the caller when a repair was applied and how large the adjustment was — the user
should know their matrix was modified.

Tests: LSM American put matches a high-resolution binomial within 0.5%; Higham
repair on a deliberately non-PSD matrix produces a valid PSD matrix with minimal
Frobenius distance; correlated paths reproduce the target correlation to within
Monte Carlo error.
```

---

### [ ] 3.5 — Structured products

```
Implement packages/quant/src/products/structured.ts. Each product is a payoff
schedule evaluated on multi-asset LSV paths.

Products:
- Worst-of autocallable (Phoenix): observation dates, autocall barrier, coupon
  barrier, memory coupon accrual, terminal capital barrier with worst-of downside
- Barrier Reverse Convertible: fixed coupon, knock-in put on the worst-of,
  American or European KI observation as a parameter
- Capital-protected note with participation and cap
- Twin-win, shark fin, digital coupon note, cliquet
- Best-of and worst-of vanilla baskets

Outputs, because these are what make it a desk tool rather than a demo:
- Fair value AND issue price, so the embedded margin is visible
- COUPON SOLVER: invert for the coupon that makes issue price exactly 100. This
  is the actual workflow a structurer uses — make it a first-class function.
- Autocall probability by observation date, and expected life
- Terminal payoff distribution
- Greeks decomposed PER UNDERLYING: delta, vega, gamma by asset
- CEGA: sensitivity to correlation. Worst-of products are heavily short
  correlation and this single number is the most educational output in the app.
  Compute it by bumping the correlation matrix with Higham repair and common
  random numbers.

Tests: worst-of autocall with correlation -> 1 collapses to a single-asset
autocall; coupon solver round-trips (solve for coupon, reprice, get 100 back);
zero coupon barrier reduces to a known simpler structure; cega is negative for
worst-of products and positive for best-of — verify the sign, it is the point.
```

**Acceptance:** Coupon solver converges in under 20 iterations. Cega sign is correct for both worst-of and best-of.

---

# Stage 4 — Pricing service and API boundary

### [ ] 4.1 — Shared contract

```
In packages/shared/, define the pricing contract with Zod:
  PricingRequest, PricingResult, CalibrationRequest, CalibrationResult
Discriminated union over product type. Every result carries: value, standard
error (null for deterministic), method used, compute time, and a warnings array.

Then define a PricingClient interface with two implementations:
  LocalPricer   — dispatches to packages/quant, runs on device
  RemotePricer  — dispatches to services/pricer over HTTP

A router picks between them by product type and complexity, with the rule:
anything that needs more than ~50k paths goes remote. The UI must never know
which one ran. Moving a product between tiers must not change a single line of UI.

Tests: the same PricingRequest through both clients returns results agreeing
within tolerance for products implemented in both.
```

---

### [ ] 4.2 — Python pricing service

```
Build services/pricer with FastAPI + NumPy + Numba.

Port the heavy paths: multi-asset LSV Monte Carlo, LSM, structured products,
Heston and SVI calibration (differential evolution then local refinement).

Requirements:
- Implements the PricingRequest/PricingResult contract exactly. Generate the
  Pydantic models from the Zod schemas or keep a single source of truth — do not
  hand-maintain two copies.
- Auth via Supabase JWT verification.
- Rate limiting per user.
- Request timeout with a partial-result response (return the paths completed so
  far with the resulting standard error, rather than failing).
- Structured logging, no PII in logs.
- Golden tests IDENTICAL to the TypeScript ones. The Python and TypeScript
  pricers must agree to within Monte Carlo error on every shared product. This
  cross-language agreement is your strongest correctness signal in the whole
  project — treat a divergence as a build failure.
```

**Acceptance:** Cross-language agreement test passes on every shared product.

---

### [ ] 4.3 — Client integration

```
Wire the app to the PricingClient:
- React Query with aggressive caching keyed on the full request
- Optimistic local price shown instantly while the remote result is in flight,
  clearly marked "fast estimate" until the precise result replaces it
- Cancellation on input change
- Offline: fall back to local tier, and tell the user which products are
  unavailable offline rather than failing silently
- Every displayed MC price shows its confidence interval. Never show a Monte
  Carlo point estimate alone.
```

---

# Stage 5 — Backend and data model

### [ ] 5.1 — Supabase schema

```
Design the Postgres schema in supabase/migrations/.

Tables: profiles, education_levels, tracks, lessons, lesson_blocks, user_progress,
quiz_questions, quiz_attempts, xp_events, streaks, levels, certificates,
leaderboard_entries, practice_ladder (the labelled bots), sim_accounts,
sim_positions, sim_orders, sim_fills, notification_prefs, feature_flags.

Rules:
- Row Level Security ON for every table, no exceptions. Write the policies.
- XP, streaks, levels, and certificates are computed SERVER-SIDE in Postgres
  functions. The client may never write to xp_events directly. If XP is
  client-writable, the leaderboard is worthless within a week.
- Streak logic runs in a Postgres function against the user's stored timezone,
  not the device clock. Include a configurable streak freeze.
- practice_ladder rows carry an is_synthetic boolean that the API always returns
  and the UI always renders. It is never optional and never hidden.
- Audit trail on sim_orders and sim_fills.
- Indexes for the leaderboard queries (they will be your hottest path).

Generate TypeScript types from the schema into packages/shared.
```

---

### [ ] 5.2 — Auth and onboarding

```
Implement auth with Supabase:
- Email + password, plus Sign in with Apple (required by App Store review if any
  other social login ships) and Google
- Username: unique, validated, profanity-filtered, changeable once per 30 days
- Session in expo-secure-store, never AsyncStorage
- Password reset, email verification, account deletion (required by App Store —
  in-app deletion, not an email request)
- Age gate at 13+ (16 in EEA), stored, enforced

Onboarding, 5 screens maximum before the first lesson:
1. What the app does, in one sentence
2. Age gate
3. Education level: High school / Undergraduate / Postgraduate or professional
4. Self-assessed options familiarity: None / Some / Confident
5. Goal: Understand the basics / Prepare for interviews / Go deep on quant

Screens 3-5 set the learning track. Everything after onboarding is personalised
off these three fields plus observed performance.

Get the user into a real lesson within 60 seconds of first open. Do not gate the
first lesson behind account creation — let them try it, then prompt to save
progress. This single decision moves activation more than anything else in the app.
```

---

### [ ] 5.3 — Sync and offline

```
Offline-first progress:
- Local queue of progress events, synced when online, idempotent by event ID
- Conflict resolution: server wins for XP and streaks (they are authoritative),
  client wins for UI preferences
- Downloaded lessons available offline
- Sync status visible but not intrusive
```

---

### [ ] 5.4 — Analytics

```
Instrument for retention, using a privacy-respecting analytics tool (PostHog
self-hosted or similar). No advertising SDKs, no IDFA.

Core events: onboarding_step, lesson_start, lesson_complete, block_complete,
quiz_attempt, quiz_pass, streak_extend, streak_break, level_up, certificate_earn,
pricer_open, pricer_input_change, sim_open, paywall_view, paywall_dismiss,
purchase, notification_open, session_start.

Build the funnels that actually matter: install -> onboard -> first lesson
complete -> D1 -> D7 -> D30 -> paywall view -> purchase.

Add cohort retention by education level and by track. If one track retains far
worse than the others, that is your highest-value fix and you will not see it
without this.
```

---

# Stage 6 — Learning engine and content

### [ ] 6.1 — Content model

```
Define the lesson content model in packages/shared.

A Lesson has: id, track, tier (foundation/core/advanced), estimated minutes,
prerequisites, learning objectives, and an ordered list of Blocks.

Block types:
  prose        markdown, with a declared reading level
  formula      LaTeX with a plain-English gloss underneath — ALWAYS both
  widget       an interactive pricing widget, referencing a widget id and params
  checkpoint   inline question, immediate feedback
  callout      intuition / warning / real-world note
  recap        key points

Rules:
- Every formula block MUST have a plain-English gloss. A formula with no gloss
  fails content validation.
- Every widget block declares which quant function it calls, so content and code
  cannot drift apart.
- Content is authored as MDX-like files in content/, validated by a Zod schema at
  build time, and seeded into Supabase. Broken content fails CI.
```

---

### [ ] 6.2 — Adaptive tracks

```
Build the personalisation engine.

Three tracks, seeded by education level and self-assessment, then adjusted by
observed performance:
  Foundation      concept-first, minimal algebra, heavy visuals
  Core            standard undergraduate treatment, full derivations available
                  but collapsible
  Advanced        measure-theoretic asides, full derivations expanded, Heston and
                  Monte Carlo content unlocked earlier

The SAME lesson renders differently by track: prose swaps to a different reading
level, formula blocks expand or collapse, widget complexity scales. Do not fork
the curriculum into three copies — one lesson, three renderings, or content
maintenance will collapse.

Adaptation rules:
- Two failed checkpoints in a lesson -> offer the Foundation rendering of it
- Perfect quiz scores across a unit -> offer to move up a track
- Never demote silently. Always offer, never impose.
```

---

### [ ] 6.3 — Vertical feed

```
Build the vertical swipe feed — the primary lesson delivery mechanism.

Each Block is a full-screen card. Swipe up for the next block. This is the
retention mechanic, so it has to feel right:
- Snap-to-card paging, no partial states
- Gesture handled entirely on the UI thread
- Windowed rendering: 2 cards ahead, 1 behind, everything else unmounted
- Widgets pause when off-screen and resume on-screen
- Progress dots along the edge, not a top bar
- Swipe DOWN to revisit — never lock users forward, since the ability to go back
  is what separates a lesson from a feed
- Handle interruption: return to the exact block on reopen

Honest note to encode in the design: the format borrows the pacing of a short-form
feed but the content is sequential and finite. Do not add infinite scroll, do not
autoplay into unrelated content, and do end each unit with a clear stopping point.
The goal is a completed lesson, not maximised time-in-app.
```

**Acceptance:** 60fps swiping on a mid-range Android device with a live Skia widget on screen.

---

### [ ] 6.4 — Interactive widgets

```
Build the lesson widget library. Each is a small interactive component calling a
real pricer from packages/quant. These are the product's moat — they are the
reason to use this instead of reading a PDF.

  PayoffExplorer        drag strike and spot, payoff redraws live
  ParityBreaker         break put-call parity, the arbitrage is computed and shown
  BinomialTree          increase steps, watch convergence to Black-Scholes
  DeltaHedgeSim         hedge a short call, choose rebalancing frequency, see the
                        P&L distribution over many runs — the single best lesson
                        in the whole app about what "delta hedging" actually means
  GreekPlayground       any greek vs spot vs time, side by side
  GammaThetaTradeoff    move one, watch the other
  SmileFitter           drag market points, watch SVI refit and arbitrage flags
  HestonSmile           move vol-of-vol and rho, watch the smile tilt and the
                        skew appear
  BarrierMonitor        move the barrier, toggle continuous vs daily monitoring,
                        see the BGK correction change the price
  StrategyBuilder       add legs, net payoff and greeks
  MCVisualiser          paths, convergence, and the standard error shrinking as
                        paths increase
  AutocallDesigner      build a worst-of autocallable, solve for the coupon, see
                        the cega

Every widget: 60fps, works offline where the local tier supports it, has a reset
button, and has a one-line "what to notice" prompt so the interaction has a point.
```

---

### [ ] 6.5 — Curriculum

```
Author the curriculum in content/. Ground it in Hull, Options Futures and Other
Derivatives, and cite chapters in the instructor notes — but write ALL prose
originally. Do not reproduce text, worked examples, exhibits, or problem sets from
Hull or any other textbook. Cite as a reading reference, never as a content source.

Units:
 1. What an option is — rights, obligations, moneyness, intrinsic vs time value
 2. Payoff diagrams — long/short, call/put, and reading any diagram cold
 3. No-arbitrage — forwards, carry, put-call parity, price bounds
 4. Binomial trees — replication, risk-neutral probability, convergence
 5. Black-Scholes — the hedging argument, the PDE, the assumptions, and precisely
    where each assumption fails in real markets
 6. The Greeks — one lesson each, intuition first and formula second
 7. Volatility — realised vs implied, the smile, term structure, and why the
    smile exists after 1987
 8. Strategies — spreads, straddles, butterflies, calendars, risk reversals,
    ratios. For each: the view expressed, the vol exposure, the theta sign, and
    what kills the trade
 9. Exotics — digitals, barriers, Asians, lookbacks, and why a digital's delta
    explodes near expiry
10. Stochastic volatility — Heston, SABR, local vol, LSV, a note on rough vol
11. Numerical methods — Monte Carlo, variance reduction, LSM, PDE schemes
12. Multi-asset and structured products — correlation, dispersion, worst-of
    mechanics, and the dealer's short-correlation position
13. Practice — using the pricer and the simulator to test a view

Include a unit on "How traders express a view", which is the honest version of
"how to make money with options". It covers: what edge is and where it comes from,
why most retail options P&L is negative, transaction costs and the bid-offer,
assignment risk, and position sizing. Frame it as risk literacy. No return
promises, no strategy recommendations, no backtested performance claims.

Run @content-reviewer over every lesson before committing.
```

---

### [ ] 6.6 — Quizzes and certification

```
Build assessment:
- Inline checkpoints with immediate, explanatory feedback (say WHY the wrong
  answer is wrong, not just that it is)
- End-of-unit quizzes, randomised order, pulled from a larger bank
- Spaced repetition: an SM-2 style scheduler resurfaces previously-missed
  concepts. This is what makes the learning stick and what brings users back.
- Final certification exam per level: timed, comprehensive, multiple attempts
  with a cooldown, and a different question set per attempt

Question types: multiple choice, numeric answer with tolerance, "price this
option" (checked against the actual pricer), payoff-diagram identification,
and drag-to-order for sequences.

Certificates: rendered as a shareable image, with a verification code and a
public verification page. State plainly on the certificate that it is a course
completion record, not a professional qualification or accreditation.
```

---

# Stage 7 — Gamification and retention

### [ ] 7.1 — XP and levels

```
Implement the XP and level system, ALL server-side.

XP sources: block complete, lesson complete, quiz pass (scaled by score),
checkpoint streak, spaced-repetition review, first-time widget interaction,
daily goal met.

Anti-farming: diminishing returns on repeats, server-enforced rate limits, and
XP granted only on genuine first completion. Assume the client is hostile.

Levels 1-30 with a rank ladder, each stage having a distinct icon that visibly
improves. Milestone levels unlock: advanced lessons, extra pricer models, and
simulator features. Design the ladder so the free tier reaches a satisfying
milestone — a paywall that arrives before the user has felt progress converts badly.

Level-up moment: a real animation, haptics, and a shareable card. This is one of
the two or three highest-value seconds in the entire product.
```

---

### [ ] 7.2 — Streaks

```
Implement streaks, server-computed in the user's timezone.
- Daily goal is configurable: Casual 5 min / Regular 10 min / Serious 20 min
- Streak freeze, earned or purchased with in-app XP currency (not real money)
- Weekend amnesty, optional
- Milestone celebrations at 3, 7, 14, 30, 100, 365
- Repair window: a short grace period after a break, once per month

Design honestly: a streak should reward consistency, not exploit anxiety. No
countdown-to-loss pressure notifications late at night, no dark patterns around
the freeze purchase, and let the user turn streaks off entirely in settings
without losing anything else.
```

---

### [ ] 7.3 — Leaderboards

```
Build two clearly separated ladders.

1. Real leaderboard: weekly XP among real users. Global, plus by education level,
   plus friends. Tiered leagues with promotion and relegation.

2. Practice ladder: labelled synthetic benchmarks. These MUST be visually and
   textually distinct — a badge on every row, a header explaining what they are,
   and never mixed into the real leaderboard. Their purpose is to give a new user
   something to pace against on day one when the real board is empty. Give them
   plausible, non-personal names (e.g. "Benchmark: Steady", "Benchmark: Fast")
   rather than fake human names.

Presenting synthetic accounts as real users is deceptive and is an App Store and
consumer-protection risk. This separation is not negotiable.

Privacy: leaderboard participation is opt-in, usernames only, and opting out is
one tap and does not affect anything else.
```

---

### [ ] 7.4 — Notifications

```
Implement notifications with expo-notifications.

Types: daily reminder at the user's chosen time, streak-at-risk (one, in the
early evening, never late at night), spaced-repetition review due, weekly
progress summary, league result, new content.

Personalisation: send at the user's historically most active time, adapt tone to
track and progress, and reference the actual next lesson by name rather than
sending a generic nudge.

Hard rules:
- Ask for permission AFTER the user completes their first lesson, never on first
  launch. Permission conversion roughly doubles.
- Maximum 2 per day, hard cap, enforced server-side.
- Granular opt-outs per type.
- Automatic backoff: after 5 consecutive ignored notifications, reduce frequency;
  after 10, stop and re-engage only on open. A user who ignores you is telling
  you something.
- No guilt copy, no fake urgency, no fake social pressure ("3 friends are ahead
  of you" when they are not).
```

---

### [ ] 7.5 — Sharing and growth

```
Build the organic growth surfaces:
- Shareable cards: level up, certificate, streak milestone, a payoff diagram of a
  strategy the user built, and a "here's what a worst-of autocallable actually
  pays" card. The pricing visuals are far more shareable than the streak counts —
  lead with those.
- Referral: both users get streak freezes or XP, never a discount that
  cannibalises the paywall
- Deep links from every shared card into the specific lesson or strategy

ASO: write the App Store and Play listings targeting "options trading course",
"black scholes calculator", "options pricing", "derivatives learning". Keep every
claim accurate — no performance claims, no "make money" language in metadata, as
that is a common rejection trigger for finance apps.
```

---

# Stage 8 — Market data and simulator

### [ ] 8.1 — Data provider abstraction

```
Before writing any integration, build a provider-agnostic layer:
  MarketDataProvider interface: quotes, option chains, historical bars, corporate
  actions. Implementations: MockProvider (deterministic, for tests and offline),
  DelayedProvider, RealtimeProvider.

The app MUST be fully functional with user-entered inputs and MockProvider. Live
data is an enhancement layer, never a dependency. If the feed dies, every lesson,
every pricer, and every widget still works.

Then research and report to me, before integrating anything: for each candidate
vendor, what the licence permits regarding DISPLAY and REDISTRIBUTION of quotes
in a consumer mobile app, whether delayed data has different terms, and what
attribution or exchange agreements are required. Do not sign us up to something
that forbids the thing we are building. Present the findings and stop.
```

**Acceptance:** Airplane mode — every lesson, widget, and pricer still works.

---

### [ ] 8.2 — Data integration

```
Integrate the provider chosen in 8.1.
- Server-side proxy through the pricing service. API keys NEVER in the app bundle.
- Caching and rate-limit management at the proxy, so cost scales with data, not
  with users.
- Required attribution rendered wherever data appears.
- Graceful staleness: show the timestamp, and mark data as stale rather than
  showing an old number as if it were current.
- Snapshot the chain for the simulator so a paused session resumes coherently.
```

---

### [ ] 8.3 — Paper trading simulator

```
Build the fake-money simulator. Paywalled.

- Starting balance, resettable
- Order types: market, limit. Fills against the bid-offer with configurable
  slippage — filling at mid teaches the wrong lesson and is the most common flaw
  in retail paper trading.
- Commissions and fees modelled, on by default
- Position tracking with live P&L, decomposed into delta, gamma, theta, and vega
  contributions. This decomposition is the entire educational payload — a user who
  learns that they lost money to theta while being right on direction has learned
  more than from any lesson.
- Assignment and expiry handled properly, including early assignment on
  dividends for short ITM calls
- Portfolio Greeks, scenario grid (spot x vol), and a stress panel
- Trade journal: for every trade the user records their view beforehand, and
  reviews it at close
- Leaderboard by risk-adjusted return, never by raw return, because ranking by
  raw return rewards the most reckless user and teaches exactly the wrong thing

Every screen: "Simulated trading with virtual currency. Not a brokerage account.
No real orders are placed." Persistent, not dismissible.
```

---

### [ ] 8.4 — Simulator onboarding

```
Guided first session: a scripted scenario walking the user through one trade,
explaining bid-offer, why the fill was not at mid, and what happens to the
position overnight. Then release them into free play.

Also add a "what went wrong" review: after any closed trade, attribute the P&L
across delta, gamma, theta, vega, and slippage.
```

---

# Stage 9 — Monetisation

### [ ] 9.1 — Paywall and IAP

```
Implement purchases with RevenueCat.

IMPORTANT — correcting the original brief: the simulator unlock cannot ship as a
"donation". Apple requires in-app purchase for any unlock of digital content or
functionality, and a donation that grants access is a purchase. Implement it as:
  - a non-consumable "Simulator" unlock, and/or
  - an auto-renewing subscription for simulator + advanced content
Both through StoreKit and Google Play Billing via RevenueCat.

Requirements:
- Restore purchases (required by review)
- Full price, period, and renewal terms shown BEFORE purchase
- Links to Terms and Privacy on the paywall (required)
- Subscription management link
- Entitlements verified server-side; never trust the client
- Family Sharing consideration for the non-consumable
- Student pricing if the platform supports it in your markets

Paywall placement: after the user has completed a meaningful amount of free
content and hit a level milestone. Never in the first session. Show exactly what
is unlocked, with a preview of the simulator rather than a description of it.
```

---

### [ ] 9.2 — Free tier design

```
Define the free/paid split and implement the gates.

Free: all foundation and core lessons, all quizzes, certificates up to the
intermediate level, the full pricer for vanillas and barriers, leaderboards,
streaks.

Paid: the simulator, advanced lessons (Heston, LSV, structured products), the
structured-product designer, the full Monte Carlo engine with large path counts,
advanced certificates, live market data.

The free tier has to be genuinely good on its own. An app that feels like a demo
does not get recommended, and word of mouth is the only distribution you have.
```

---

# Stage 10 — Quality, compliance, launch

### [ ] 10.1 — Performance

```
Profile and fix on a mid-range Android device, not a flagship, and not a simulator.

Targets: cold start < 2s, feed swipe 60fps, pricer input to redraw < 16ms,
memory < 200MB during Monte Carlo, no dropped frames during widget interaction.

Techniques: memoise pricer calls by input hash, run local Monte Carlo in chunks
with yields so the UI thread breathes, windowed lists everywhere, lazy-load Skia
widgets, precompute lesson payoff curves at build time.
```

---

### [ ] 10.2 — Accessibility

```
Full pass:
- Every interactive element labelled
- Charts have text alternatives DESCRIBING THE SHAPE, not just the title. For a
  screen reader user this text is the entire chart.
- Dynamic Type support up to the largest sizes without layout breakage
- Colour is never the only signal — pair with sign, label, or shape
- Contrast meets WCAG AA against both themes
- Reduced motion respected: the feed still works, transitions become instant
- VoiceOver and TalkBack tested end to end on a full lesson
```

---

### [ ] 10.3 — Testing

```
- Unit: packages/quant at 90%+ coverage, all golden and property tests green
- Integration: pricing client, auth flows, sync, purchases (sandbox)
- E2E with Maestro: onboarding, first lesson, quiz, level up, paywall, purchase,
  simulator trade
- Snapshot tests on every chart at fixed inputs, so a rendering regression is
  caught rather than shipped
- Load test the pricing service
- Manual matrix: oldest supported iOS and Android, smallest and largest screens,
  slow network, offline, mid-flight interruption
```

---

### [ ] 10.4 — Legal and compliance

```
Produce, and route past a lawyer before launch:
- Terms of Service
- Privacy Policy (GDPR and CCPA, data deletion, retention)
- Financial disclaimer, shown at onboarding with explicit acknowledgement and
  available permanently in settings
- Model risk disclaimer wherever a price appears
- Simulator disclaimer
- Certificate disclaimer: course completion, not a professional qualification
- Third-party licence attributions
- Market data attribution per the vendor agreement
- App Privacy nutrition label, completed honestly

Then audit every screen for prescriptive language. Any string that tells a user
what to do with money is a bug — file it and fix it.
```

---

### [ ] 10.5 — Store readiness

```
- Icons and splash for every required size
- Screenshots for every required device class, showing real content
- App Store and Play descriptions, keywords, and a preview video
- Age rating questionnaire (expect 17+ / Mature given financial content)
- Export compliance (standard encryption exemption)
- Sign in with Apple present if any other social login ships
- In-app account deletion present
- Prepare responses to the predictable review questions: is this a financial
  service (no), does it facilitate trading (no), is the simulator real money (no),
  what are the certificate claims (course completion only)
```

---

### [ ] 10.6 — DEPLOY.md

```
Write DEPLOY.md covering the full path from local to stores:

1. Local: prerequisites, env setup, Supabase local, running the pricing service,
   Expo Go on a physical device, and exactly which SDK to pin and why
2. The Expo Go -> development build transition: what forces it, how to run
   `eas build --profile development`, internal distribution
3. EAS configuration: eas.json profiles for development, preview, production
4. Environment and secrets: EAS secrets, Supabase keys, RevenueCat keys, the
   market data key (server-side only), and what must never enter the bundle
5. Supabase: migrations, seeding content, RLS verification, backups
6. Pricing service: containerisation, deploy target, health checks, scaling
7. Internal testing: TestFlight and Play internal track, build numbering
8. Beta: external TestFlight and Play closed testing, feedback intake
9. Submission: store listings, review notes, the demo account reviewers will need,
   and how to explain the simulator to a reviewer
10. Post-launch: EAS Update for JS-only fixes and its limits, crash monitoring,
    the rollback procedure, and the release checklist
11. Incident runbook: pricing service down, market data down, Supabase degraded,
    bad update shipped

Include a one-page pre-release checklist that must be ticked before any submission.
```

---

# Build order

Do not build in file order. Build in dependency order:

```
Stage 0  ──►  Stage 2  ──►  Stage 3  ──►  Stage 4
   │                            │
   ▼                            ▼
Stage 1  ──►  Stage 6  ◄──  Stage 5  ──►  Stage 7
                 │                            │
                 ▼                            ▼
              Stage 8  ──►  Stage 9  ──►  Stage 10
```

**Milestones worth stopping at:**

| Milestone | Reached after | Ship to |
|---|---|---|
| Verified quant core | 2.6 | Nobody — it's a library |
| Playable pricer demo | 1.4 + 2.6 | Yourself, in Expo Go |
| First learnable unit | 6.4 (units 1–5) | 5 friends |
| Closed beta | 7.4 | 50 students |
| Paid beta | 9.2 | TestFlight external |
| Launch | 10.6 | Stores |

---

# The one risk that outweighs the rest

Everything in Stages 5 through 10 is ordinary app engineering. It will be fine.

The risk is Stage 2 and 3. A language model will confidently produce a barrier formula with a flipped sign, or a Heston characteristic function with the wrong logarithm branch, and the resulting prices will look completely reasonable. They will move in the right direction when you drag the slider. They will pass a smell test. And they will be wrong, in an app that teaches people how options are priced.

That is why the golden tests come before the pricers, why parity checks are non-negotiable, why the Python and TypeScript implementations must agree, and why `@quant-verifier` exists. Every hour spent on prompt 0.3 is worth ten later.

Do not skip it.
