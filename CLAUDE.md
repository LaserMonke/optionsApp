# CLAUDE.md

Operating rules for any AI agent (Claude Code, Copilot, etc.) working in this repo.
Read this file in full before writing code. These rules override convenience.

---

## 1. What this product is

A mobile app (iOS + Android) that teaches options and structured products to students
and undergraduates, with an embedded pricing engine used. And a realtime options market with real world data behind a paywall.

It is **not**:

- an investment advice service
- a trading or execution venue
- a source of live tradeable quotes
- a valuation service for any real position a user holds

Every design decision must keep it on the education side of that line. If a feature
would make the app more useful as a trading tool but blurs the education boundary,
the answer is no.

---

## 2. Non-negotiable financial rules

### 2.1 Disclaimers

Every screen that outputs a price, a Greek, a payoff, or a P&L number must render the
shared `<PricerDisclaimer />` component. Never a hand-rolled string. The canonical text
lives in `src/constants/legal.ts` and must not be edited without a compliance review
note in the PR description.

Required disclaimer content:

- Educational and illustrative purposes only.
- Not investment, tax, or legal advice; no recommendation to buy or sell.
- Model output, not a market quote. Real prices differ materially.
- Model assumptions (frictionless markets, known vol, no credit risk) do not hold.
- Options and structured products can lose 100% of capital; some strategies have
  unlimited loss potential.
- Past performance and backtested figures do not predict future results.

The onboarding flow must include a one-time, explicitly acknowledged risk disclosure
(checkbox + timestamp stored in `user_disclosures`). Do not let users skip it.

### 2.2 Language bans

The agent must never generate copy, lesson text, notification text, or UI labels that:

- recommend a position ("you should buy", "a good trade here is", "consider going long")
- imply a forecast ("is likely to rise", "we expect vol to")
- describe a strategy as safe, guaranteed, low-risk, or capital-protected without the
  qualifier that protection is subject to issuer credit risk
- describe the app's output as a valuation, fair value, or quote — use **model price**
- use the words *donation*, *tip*, or *support us* for the paid unlock (see §4.3)

Use the second person for mechanics ("a long call gains when spot rises above the
strike") and never for action ("you should buy a call").

### 2.3 Unlimited-loss strategies

Any strategy screen involving naked short options must display a max-loss field reading
"Unlimited" (calls) or the full notional (puts), styled with the danger token, above
the payoff chart — not below it, not in a tooltip.

### 2.4 Structured products

Structured product lessons must always cover, in this order: payoff mechanics, issuer
credit risk, liquidity/secondary market risk, fees embedded in the note, and the
scenarios in which the product underperforms holding the underlying. A structured
product lesson that omits credit risk is a defect, not an incomplete draft.

---

## 3. Content and IP rules

**Do not reproduce copyrighted material.** Hull, Wilmott, Gatheral, Glasserman, Joshi,
exchange rulebooks, vendor documentation and any textbook are references for *concepts
only*.

- Never copy sentences, paragraphs, worked examples, exercise text, tables, or figures.
- Never reproduce a diagram's specific layout, axis labels, and annotations from a book.
- Write every lesson from scratch in this project's own voice, with original numbers.
- Formulas and standard results (Black-Scholes-Merton, Reiner-Rubinstein barrier
  formulas, Heston characteristic function, Andersen QE scheme) are mathematics and are
  fine to implement and state. Attribute the result to its author in a References block.
- Every lesson's frontmatter carries a `references:` list naming the sources consulted.
  This is attribution, not licence to quote.

Market data from the paid vendor is **licensed, not owned**. Assume redistribution is
prohibited unless the contract says otherwise. Consequences: cache server-side, never
expose a raw vendor payload through a public endpoint, never let a user export a data
series, and delay or coarsen any quote shown in-app per the vendor terms.

---

## 4. Architecture rules

### 4.1 Stack

- **Expo (React Native) + TypeScript**, `expo-router` for navigation.
- Styling: **NativeWind** (Tailwind for RN) or StyleSheet. There is **no HTML and no
  CSS file** in the app itself — RN has no DOM. HTML/CSS appears only in the marketing
  site under `web/` and in the generated PDF certificate template.
- Charts: `@shopify/react-native-skia` for payoff diagrams and Greek surfaces.
  Reanimated 3 for gesture-driven scrubbing.
- Lists: `@shopify/flash-list`, vertical paging, for the reels-style lesson feed.
- Backend: **Supabase** — Postgres + Auth + Row Level Security + Edge Functions (Deno)
  + Storage (certificates) + `pg_cron` (notification scheduling).
- Payments: **RevenueCat** wrapping StoreKit 2 and Google Play Billing.
- Monorepo: `pnpm` workspaces.

### 4.2 Where pricing runs

`packages/quant` is a **pure TypeScript library with zero React and zero I/O**. It is
the single source of truth for all pricing maths and is consumed by both the app and
the Edge Functions.

Split by cost:

| Method | Runs where | Why |
|---|---|---|
| BSM closed form, Greeks, implied vol solver | On device | Microseconds; works offline |
| Analytic barrier (Reiner–Rubinstein), digitals | On device | Closed form |
| Binomial / trinomial trees (American, ≤2000 steps) | On device | Acceptable on modern phones |
| Monte Carlo (GBM, ≥50k paths) | Edge Function | JS on device drops frames |
| Heston / SABR / local vol MC | Edge Function | Too heavy for the JS thread |
| Basket / multi-asset with correlation | Edge Function | Cholesky + N assets × M paths |

Never run a Monte Carlo on the JS thread. If a device-side simulation is genuinely
required, it goes in a Rust→WASM module or a worklet, never inline in a component.

Edge Functions must be deterministic given a seed, must cap `paths` and `steps` at
server-side limits, and must be rate-limited per user.

### 4.3 Monetisation

The pricer unlock is an **in-app purchase (non-consumable) via RevenueCat**. It is not a
donation. Calling it a donation while gating digital functionality violates App Store
Review Guideline 3.1.1 and Google Play's billing policy, and misrepresents a commercial
transaction. Copy must say "Unlock the Options Sim" or similar.

Free tier must remain genuinely useful: all lessons, all quizzes, certificates, and the
basic BSM pricer. The paywall sits in front of exotics, stochastic vol, basket pricing,
and strategy builder — not in front of education.

### 4.4 Leaderboard integrity

- All point awards are computed **server-side** in an Edge Function from a verified quiz
  submission. The client never writes to `points` or `streaks`. RLS enforces this.
- Bot entries exist to make an empty leaderboard feel alive. They must be **visibly
  labelled** — a "Practice bot" badge and a distinct avatar treatment — on every surface
  they appear. Never let a bot be mistaken for a person. Bots are excluded from any
  ranking that is shown as a real-world credential.
- Bot names must not resemble real people or reuse real usernames.

### 4.5 Data protection

- The audience skews young. Set the App Store age rating honestly, gate signup at 13+
  (16+ in the EEA unless you implement parental consent), and do not collect date of
  birth beyond what the age gate needs.
- Education level is a free-choice enum, optional, and used only to route content.
- No advertising SDKs, no third-party analytics that fingerprint. Use Supabase-side
  event logging.
- Every table has RLS on. There are no exceptions and no "temporarily disable RLS to
  debug" commits.

---

## 5. Code conventions

- TypeScript `strict: true`. No `any` in `packages/quant`. No non-null assertions in
  pricing code.
- All money and rate inputs are `number` in decimal form (5% = `0.05`), never percent
  integers. Volatility is annualised decimal. Time is in years. Document the convention
  in every function's JSDoc.
- Every pricing function is pure, takes a single typed params object, and returns a
  typed result object including the method used and its parameters, so the UI can
  display provenance.
- Every pricing function has a test asserting against a published benchmark value or
  against an independent method (MC within tolerance of closed form, tree converging to
  BSM). Put-call parity, and the Greeks' finite-difference agreement, are tested as
  invariants.
- Conventional Commits. Branch per phase (`phase-03-quant-core`). No direct pushes to
  `main`.
- Secrets live in EAS secrets and Supabase Function secrets. A vendor API key in the app
  bundle is a shipping blocker — the client calls our Edge Function, which calls the
  vendor.

---

## 6. Agent working style in this repo

1. Read `BUILD_PROMPTS.md` and work the phases in order. Do not skip ahead.
2. Before writing code for a phase, restate the acceptance criteria and list the files
   you will create or change. Wait for confirmation on anything touching payments,
   auth, RLS, or legal copy.
3. Small, reviewable diffs. One concern per commit.
4. Never invent a numerical result. If a benchmark value is needed for a test, derive it
   from an independent implementation in the repo and say so in a comment.
5. If a requested feature conflicts with §2, §3, or §4.3, stop and say so rather than
   implementing it.
6. Do not add a dependency without noting its licence and bundle size impact in the PR.

---

## 7. Definition of done for any user-facing screen

- [ ] Renders correctly on iOS and Android, small and large phone, and with the OS text
      size at maximum
- [ ] Dark and light mode both use design tokens, no hard-coded hex
- [ ] Screen reader labels on every interactive element and on chart summaries
- [ ] Loading, empty, error, and offline states exist
- [ ] Any numeric output carries the disclaimer component
- [ ] No network call blocks first paint
