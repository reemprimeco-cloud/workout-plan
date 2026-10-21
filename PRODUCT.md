# Product

<!-- impeccable:product-schema 1 -->

## Platform

adaptive

Two surfaces share one product, one account system and one subscription: a React
web app (this repository) and a native SwiftUI iPhone app (`primefit-ios`, a
separate repository). There is no Android app and none is planned; `adaptive`
here means web and iOS, each in its own idiom. The iOS app ships iPhone-only —
iPad support was deliberately dropped before the 1.0 release because no screen
had been designed or verified at that size.

**The iPhone app is the product. The web is not a consumer surface.**

Customers subscribe and train in the app; they are never asked to use a
browser. The web retains exactly four public pages, and each is there for a
concrete reason rather than as a sales channel:

| Page | Why it cannot be hidden |
|---|---|
| `/privacy` | Submitted to Apple in the app's metadata and checked by review |
| `/terms` | Same |
| `/reset-password` | The app's "Forgot password?" email links here — gating it breaks password recovery for every iPhone user |
| Landing page | One page introducing Prime Fit and pointing to the App Store. No pricing, no sign-up, no payment |

Everything else on the web — the dashboard, nutrition, coach, community and the
subscription flow — is internal: admin and operations, behind authentication.

## Users

Anyone in Kuwait and the wider Gulf who wants training and nutrition coaching in
Arabic. The primary user has **no prior relationship with the gym** — they find
the app in the App Store, decide from the paywall whether to trust it, and
subscribe or leave.

That cold-start condition is the defining constraint on every Persuade surface.
There is no in-person handshake carrying the product, no trainer who already
knows them, and no existing membership to trade on. Members of the physical gym
also use the app, but design decisions resolve in favour of the stranger.

## Product Purpose

Put training, nutrition, coaching and gym classes in one Arabic-first app, so
someone in Kuwait can run their whole fitness practice without stitching
together three English-only products that each understand part of it.

Success is a subscriber who keeps renewing because the app is where their
training actually lives — plans, logged sessions, meals, weight history and
coach conversations accumulating in one place over months.

## Positioning

Four claims, all confirmed and all currently true in the code:

- **Arabic-first, genuinely bilingual.** Not an English product with a
  translation layer. In `client/src/contexts/LanguageContext.tsx` the Arabic
  dictionary is declared first and `TranslationKey` is derived from
  `translations.ar` — Arabic is the source of truth for the key set, so a string
  that exists in English but not Arabic is a type error. Exercise names, AI
  coach replies and unit words are all translated, and layout flips to RTL.
- **The AI coach reads your medical reports.** Upload a blood test, X-ray or
  injury report and the coaching adapts around it: movements to avoid, safe
  alternatives, recovery guidance. Implemented server-side in
  `server/routers/health.ts` (`uploadReport`, `analyzeReport`,
  `getPersonalizedPlan`).
- **A real gym stands behind it.** Classes, trainers and a physical place in
  Kuwait — not a pure software product with no one to call.
- **One app instead of three.** Training, nutrition, AI coaching, classes and
  progress in a single place.

## Operating Context

- Someone opens the phone app between sets, one-handed, in a gym. Scanability
  and large tap targets matter more than density.
- The paywall is reached cold from an App Store listing, before any trust
  exists — and it is reached **inside the app**, never in a browser. The web
  landing page's only job is to send someone to the App Store.
- Language is switched inside the app, not inferred from the device. A user may
  flip mid-session and every string must follow immediately.
- Health reports are uploaded as photographs or PDFs, often of printed lab
  results.
- Admin work (CMS, gym classes, notifications, user management) happens on the
  web, not the phone.

## Capabilities and Constraints

**Built and shipping:** workout logging and exercise library · training-plan
generation and a manual plan builder · nutrition goals, meal logging, water
tracking and food-photo analysis · AI coach chat, daily check-ins and insights ·
health-report upload and analysis · gym classes · spin-wheel rewards · weight
and progress charts · Apple Watch / HealthKit sync · local reminders · admin CMS
· notifications.

**Built but deliberately hidden:** the community feed. The `community.*`
procedures exist and work; the tab is not shown. It was shipping as a
placeholder, which is a Guideline 2.1 rejection, and advertising an unbuilt
feature to paying subscribers is worse than its absence.

**Roles:** `admin` and `user` only. There is no trainer role; a trainer today is
an admin.

**Subscription tiers:** Free (7-day trial, one per email address), Prime Plus,
Prime Pro.

**Apple's USD prices are the only prices.** Decided, not open:

| | Monthly | Yearly |
|---|---|---|
| Prime Plus | $9.99 | $89.99 |
| Prime Pro | $19.99 | $179.99 |

Apple converts these to each storefront, so a Kuwaiti subscriber sees roughly
3.05 KWD for Prime Plus monthly. There is no second price list.

The KWD figures still in `PLAN_PRICES` (2.626 / 25.354 / 4.646 / 45.556) and the
MyFatoorah web checkout they drive are **retired**, not live alternatives. They
were never a deliberate second price tier — they undercut Apple's by 9–32%
because Apple sells only at fixed price points and the nearest tier upward also
had to absorb Apple's 15–30% commission. No surface should quote them, and the
web checkout is no longer a path a customer can reach.

**Authentication:** email + password, Google, and Sign in with Apple (iOS).

**Account rules:** one active device per account — signing in ends other
sessions. One Apple subscription entitles one app account; a receipt claimed by
a second account revokes the first. Account deletion is reachable from inside
the app and cascades to all of the user's data.

**Clinical boundary:** the coach gives fitness guidance only. It does not
diagnose, and it tells users to consult a healthcare professional. This is
enforced in the system prompt and is not negotiable in copy or UI.

## Brand Commitments

- The product is **Prime Fit**; the company credit in the footer is **Primeco**.
- Available assets are `client/public/logo512.png` and `logo192.png`. There is
  no full logo lockup, wordmark file, icon set or brand guideline document.
- Every user-facing string must exist in both Arabic and English. A feature that
  cannot ship bilingual is not finished.

## Evidence on Hand

**Real:** a populated exercise library with Arabic translations
(`client/src/data`, `exerciseTranslations.ts`) · the two logo PNGs · a live
production deployment at `workout-plan-weld.vercel.app` · the iOS app published
on the App Store.

**Does not exist — must not be fabricated:** customer testimonials · named
members or trainers · before/after photographs · press coverage · partner or
client logos · download counts, retention figures, review scores or any other
metric · claims about results, weight lost or outcomes achieved.

A Persuade surface needing social proof has none available today. Ask for real
material rather than inventing a placeholder that reads as real.

## Product Principles

1. **Arabic is the source language, not a translation target.** When the two
   languages conflict — on length, on layout, on tone — Arabic is not the one
   that gets compromised.
2. **Earn trust cold.** The primary user arrives knowing nothing about the gym
   or the people behind it. Nothing may assume a relationship that does not
   exist.
3. **Never advertise what is not built.** This was learned at the cost of real
   App Review rejections. A placeholder, a disabled control or a "coming soon"
   badge is worse than the feature's absence.
4. **One subscription, one person.** Entitlement is bound to a single account
   and a single active device, and every surface reflects that honestly.
5. **Stay inside the clinical line.** The coach advises on training and
   nutrition. It never diagnoses, and it never implies medical authority it
   does not have.

## Accessibility & Inclusion

- Full RTL layout for Arabic, including interpolated strings and unit words.
- Icon-only controls carry VoiceOver labels on iOS.
- The app is used in a gym: one-handed reach, glanceable text and generous tap
  targets are functional requirements, not refinements.
- No formal conformance standard (WCAG level or equivalent) has been committed
  to. That decision is open.
