# DEPLOY.md

How to run, test, and publish the app.

---

## 1. Prerequisites

| Item | Notes |
|---|---|
| Node 20 LTS + pnpm 9 | `corepack enable` |
| Expo account | Free tier is fine to start; EAS builds have a free monthly quota |
| Supabase project | One per environment (dev / staging / prod) |
| Apple Developer Program | US$99/yr. Enrol early — verification can take days |
| Google Play Developer | US$25 one-off. New personal accounts need 12 testers for 14 days before production access |
| RevenueCat account | Free below the revenue threshold |
| Market data vendor key | Server-side only |

Install the CLIs:

```bash
pnpm add -g eas-cli
pnpm dlx supabase --version   # or brew install supabase/tap/supabase
```

---

## 2. Environments

Three Supabase projects, three EAS build profiles, three app bundle identifiers so all
three can sit on one phone at once.

| Env | Bundle ID | Supabase | Distribution |
|---|---|---|---|
| dev | `ai.kristal.optionslab.dev` | dev project | Expo Go / dev client |
| staging | `ai.kristal.optionslab.stg` | staging project | TestFlight + Play internal |
| prod | `ai.kristal.optionslab` | prod project | App Store + Play production |

### Secrets

Nothing sensitive goes in `app.config.ts`, `.env` committed files, or the client bundle.

- **Client-safe** (Supabase URL, Supabase anon key, RevenueCat public SDK key) → EAS
  environment variables, prefixed `EXPO_PUBLIC_`.
- **Server-only** (Supabase service role key, market data vendor key, RevenueCat secret
  key) → `supabase secrets set` on the relevant project.

```bash
eas env:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "..."
supabase secrets set MARKET_DATA_API_KEY="..." --project-ref <ref>
```

Verify before every release: `npx expo export` then grep the bundle for the first six
characters of each server-only key. Any hit is a release blocker.

---

## 3. Local development

```bash
pnpm install
pnpm --filter quant test          # pricing library must be green first
supabase start                    # local Postgres + Edge Function runtime
supabase db reset                 # applies migrations + seed
pnpm --filter mobile dev
```

Press `i` / `a` to open a simulator, or scan the QR with Expo Go on a physical device.

Once native modules are in (Skia, RevenueCat, notifications), Expo Go stops being
enough — build a development client once per platform and reuse it:

```bash
eas build --profile development --platform ios
eas build --profile development --platform android
```

Then `pnpm --filter mobile dev --dev-client`.

### Edge Functions locally

```bash
supabase functions serve --env-file supabase/.env.local
```

---

## 4. Database migrations

Never edit a table in the Supabase dashboard on staging or prod. Migrations only.

```bash
supabase migration new add_streak_freezes
# edit the generated SQL
supabase db reset                                  # test locally
supabase db push --project-ref <staging-ref>       # promote
supabase db push --project-ref <prod-ref>
```

Every migration that creates a table must, in the same file, enable RLS and add
policies. A migration that creates a table without RLS fails review.

Deploy functions:

```bash
supabase functions deploy price-basket --project-ref <ref>
```

---

## 5. Pre-release checklist

Run this in full before every store submission.

**Quant**
- [ ] `pnpm --filter quant test` green, including all benchmark comparisons
- [ ] MC results reproducible from a fixed seed
- [ ] Server-side caps on paths, steps, and assets verified by an over-limit request

**Security**
- [ ] No server-only secret in the exported bundle
- [ ] RLS on every table; cross-user read test passes
- [ ] Rate limits active on all pricing endpoints
- [ ] Vendor market data never returned raw to the client

**Legal and compliance**
- [ ] Disclaimer renders on every screen producing a number
- [ ] Risk disclosure gate cannot be skipped; acknowledgement stored
- [ ] Unlimited-loss warning present on naked short strategies
- [ ] Structured product lessons cover issuer credit risk
- [ ] Paywall copy uses "unlock", never "donation" or "tip"
- [ ] Practice bots labelled on every leaderboard surface
- [ ] Privacy policy and terms live and linked in-app
- [ ] Certificate wording states it is not a professional qualification

**Quality**
- [ ] End-to-end run passes: signup → lesson → quiz → certificate → pricer → purchase → restore
- [ ] Purchase and restore tested with a sandbox account on both platforms
- [ ] Tested on a low-end Android (≤4GB RAM) and the smallest supported iPhone
- [ ] Accessibility: screen reader pass, maximum dynamic type, AA contrast
- [ ] Offline: app opens, cached lessons readable, pricer degrades gracefully
- [ ] Notifications respect quiet hours and per-type opt-outs

---

## 6. Building

```bash
eas build --profile production --platform all
```

`eas.json` profiles:

- `development` — dev client, internal distribution, dev Supabase
- `preview` — release build, internal distribution, staging Supabase, for ad-hoc testers
- `production` — store build, prod Supabase, auto-increment build number

Bump `version` in `app.config.ts` for user-visible releases; EAS handles
`buildNumber` / `versionCode`.

---

## 7. Testing before release

**iOS — TestFlight**

```bash
eas submit --platform ios --latest
```

Internal testers (up to 100 on your team) get builds immediately. External testing (up
to 10,000) needs a short Beta App Review, usually under a day. Fill in the test
information field — reviewers reject builds with no instructions.

**Android — Play internal testing**

```bash
eas submit --platform android --latest
```

Internal testing track is instant, up to 100 testers. Note the closed-testing
requirement for newer personal developer accounts: 12 testers opted in for 14
continuous days before you can promote to production. Start that clock early — it is
the single most common cause of a delayed launch.

---

## 8. Store submission

### Assets needed

- App icon 1024×1024, no alpha, no rounded corners
- Screenshots: iPhone 6.9" and 6.5"; Android phone; plus tablet sets if you declare
  tablet support
- Short description (80 chars) and full description
- Privacy policy URL
- Support URL and contact email

### App Store review notes — write these explicitly

Financial apps get extra scrutiny. In the review notes field, state:

> This is an educational app for students learning derivatives. It contains no
> brokerage, trading, or execution functionality and provides no investment advice. All
> pricing output is theoretical model output shown for teaching purposes and is labelled
> as such throughout. The in-app purchase unlocks additional educational calculators.

Provide a demo account with the Pro unlock already granted.

### Common rejection causes for this app class

| Cause | Fix |
|---|---|
| Purchase framed as a donation | Use "Unlock". Digital functionality must use IAP |
| Missing restore purchases | Required for non-consumables |
| Looks like financial advice | Audit copy against CLAUDE.md §2.2 |
| Age rating inconsistent with content | Declare honestly; the app is educational, not gambling |
| Incomplete privacy labels | Match the labels to what Supabase actually stores |
| Login wall with no demo account | Supply working credentials |
| Guideline 4.2 "minimum functionality" | Ensure the free tier is a substantive app on its own |

### Google Play specifics

- Complete the Data Safety form to match the privacy policy exactly; mismatches get
  flagged.
- Declare the target audience honestly. If you declare users under 13, Families policy
  and additional restrictions apply — the 13+ gate avoids this.
- Financial services declaration: this app is not a financial services app, but if the
  store form asks, describe it as educational software.

---

## 9. Post-release

- **OTA updates:** `eas update --branch production` ships JS-only changes without a
  store review. Native changes, permission changes, and anything altering the paywall
  still need a full build and review.
- **Monitoring:** Sentry for crashes, Supabase logs for Edge Function errors and
  latency, RevenueCat dashboard for purchase failures.
- **Rollback:** `eas update:rollback` for OTA. For a bad native build, expedite a fixed
  build; App Store phased release lets you pause a rollout.
- **Watch after launch:** Edge Function cost and cold starts on the MC endpoints, vendor
  API usage against quota, and day-1/day-7 retention on the lesson feed.

---

## 10. Release cadence

Ship staging weekly to TestFlight and Play internal. Ship production every two to four
weeks. Cut a release branch, run §5 in full, tag it, and keep a CHANGELOG entry per
release.
