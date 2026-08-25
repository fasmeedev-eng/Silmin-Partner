# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # dev server on :3000 (Turbopack)
npm run build    # production build (Turbopack)
npm run start    # serve the production build
npm run lint     # eslint (next/core-web-vitals + next/typescript)
```

No test runner is configured yet — there is no `test` script, no test framework in `package.json`, and no test files. If tests are introduced, add the runner and document how to run a single test here.

**Never run `npm run build` while a dev server is up.** Both write `.next`, and the build corrupts it out from under the running server — every route then answers 500 until `.next` is deleted and dev restarted. This has already happened once. To run a second server (to check a page while the first stays up), point it at a different build directory:

```bash
NEXT_DIST_DIR=.next-check npx next dev -p 3001
```

`next.config.ts` reads that variable and defaults to `.next`, so ordinary use is unaffected.

## What this project is

A **Partner application system for mobile-phone retailers**, entered by scanning a QR code. It is not a generic CRUD app; the product requirements define a lead-to-partner pipeline with three distinct surfaces:

1. **Applicant surface** — Google sign-in is required *before* the form opens. Landing page → Sign in with Google → multi-step form (shop info, contact, business profile, sales profile, documents, interests, callback preference, PDPA consent) → review → confirm dialog → submit. The same account is then used to track status and to edit documents when staff requests more.
2. **Back office** — authenticated staff (`admin` sees everything and assigns a Sales Owner; `sales` sees their own assignments). Lists applications, changes status, records notes.
3. **Phase 2 onboarding** — reached only after a shop is screened and agrees: bank account, authorized person, tax/registration documents, contract.

**The two-phase split is a deliberate product constraint, not an implementation shortcut.** Phase 1 must stay short (~2–3 min) and must *not* ask for bank details or juristic-person documents; those belong to phase 2. Do not "helpfully" move phase-2 fields into the public form.

UI copy is **Thai**. The user's own applications are Thai retailers.

### Domain vocabulary

- **Application ID** — format `SG-{year}-{6-digit running}`, e.g. `SG-2026-000125`. Running number resets per year and must be generated atomically (a counter document with `$inc`, plus a unique index) — never `count() + 1`.
- **One application per business, not per branch.** The PRD puts a `จำนวนสาขา` field (1 / 2–5 / more than 5) inside a single application, so a chain files once. The address and the storefront photo are the **main branch's** — the one the shop can be reached at. Details of the other branches are collected during phase-2 onboarding, alongside the contract. Public copy must not tell shops to file one application per branch; it did once, and that contradicted the form.
- **Status** — `New → Reviewing → NeedMoreInfo | Approved | Rejected`, then `Onboarding → ActivePartner`. Status changes need an audit trail (who, when, why).
- **Consent** — PDPA and truthfulness are two separate, never-pre-checked checkboxes. Store acceptance timestamps, policy version, IP, and user agent — a boolean alone is not usable evidence.

### Deferred by explicit decision

LINE Official Account messaging (application notifications and the "add LINE friend" button on the success screen) is **future work**. Notifications for now are in-app + email. Keep the notification layer behind an adapter so LINE can be added without a rewrite. The `lineId` field on the contact is unrelated — it is plain contact info and stays.

## Architecture

Next.js 15 App Router, React 19, TypeScript strict, Tailwind v4. Source lives under `src/`; `@/*` maps to `./src/*`.

**Current state.** The landing page at `/` is built — `src/app/page.tsx` composes sections from `src/components/landing/`, with shared primitives in `src/components/ui/`. `/apply`, `/me`, `/admin`, and `/partner` are placeholder pages. There is still no database layer, no form, and no API route besides the NextAuth handler.

The landing page is a server component that calls `auth()` **only** to swap CTA labels — it never redirects. `/` must stay public: it is what a shop sees immediately after scanning the QR code, and it is the page that earns the sign-in. Sending the QR straight to `/apply` would drop a stranger onto a Google consent screen with no context.

### Auth

`src/auth.ts` is the single NextAuth v5 (beta) instance — it exports `handlers`, `signIn`, `signOut`, and `auth`, which are consumed by `src/app/api/auth/[...nextauth]/route.ts`, `src/middleware.ts`, and server components. JWT session strategy, sign-in page at `/login`.

`src/middleware.ts` protects `/apply`, `/me`, `/partner/*`, and `/admin/*` through a `protectedPrefixes` list. `/` is deliberately absent from the matcher.

**Middleware can only answer "is this person signed in", never "what role do they have".** It runs on the Edge runtime, so it cannot read MongoDB, and the role is deliberately kept out of the JWT. Role checks therefore live in `guardRole` (`src/lib/auth/guard.ts`), called from `src/app/admin/layout.tsx` and `src/app/partner/layout.tsx`, which run on Node. `/admin` admits `admin` and `employee`; `/partner` currently admits `admin` only, as a holding position until phase 2 defines who really belongs there. `guardRole` also rejects `active: false` regardless of role.

A layout guard stops someone *reaching* a page; it does not scope the data on it. Every query inside `/admin` still has to filter by role itself — `sales` sees only the applications assigned to them. Hiding UI is not access control.

Auth is **Google OAuth only** — no passwords, no registration screen, no password reset. The placeholder Credentials provider has been removed; do not reintroduce one.

Sign-in happens in a **modal on the landing page**, not by navigating away: `src/components/auth/login-dialog.tsx` is a client component exposing `LoginDialogProvider` plus a `useLoginDialog()` opener, and `AuthCta` renders a `<Link>` when a session exists or a button that opens the modal when it does not. Leaving the page to sign in loses the context that convinced the shop to sign in at all — which is why the "why do I have to log in" copy lives inside the modal rather than in its own section.

`/login` remains as a full-page fallback for people that `middleware.ts` redirects out of `/apply` or `/me`.

**Post-login destination depends on intent first, role second.** A button with a clear purpose keeps its own destination — "สมัครเป็นพาร์ทเนอร์" goes to `/apply` even for an admin, because what the person asked for outranks what they are. Buttons with no specific intent (the header's "เข้าสู่ระบบ", `/login` with no `callbackUrl`) point at `/after-login`, a route handler that reads the session and sends staff to `/admin` and everyone else to `/me`. The split exists because the role is unknowable at the moment the button is clicked — the session does not exist yet.

**Every post-login destination goes through `resolveRedirect` (`src/lib/safe-redirect.ts`) — the modal and `/login` both.** It accepts a site-relative path or an absolute URL on the same origin (reduced to its path), and drops everything else, so `callbackUrl` cannot be turned into an open redirect. Handling both shapes is required, not defensive padding: `middleware.ts` passes a path, while NextAuth's own `/api/auth/signin` passes a fully-qualified URL. An earlier version accepted only paths and silently sent those users to `/apply` instead of back where they came from.

The client `signIn` takes `redirectTo` (v5); `callbackUrl` is the deprecated v4 alias and still works because `next-auth/react` maps one to the other before posting.

Signing out is a server action inside `SiteHeader`, so it needs no client JS and inherits NextAuth's CSRF handling.

### Database

`mongodb` (the raw driver — no ODM, no Auth.js adapter) connects through `src/lib/db/mongo.ts`, which caches the `MongoClient` promise on `globalThis` so HMR does not open a new connection on every edit. `getDb()` returns the database named in `MONGO_URI` (`silminpartner`).

`src/lib/db/users.ts` owns the `users` collection: `upsertUserOnSignIn` writes the Google profile, and `getUserAccess` reads `{ role, active }` behind a 30-second in-process cache. `role` and `active` are set with `$setOnInsert` only, so signing in again never overwrites a role an admin edited by hand.

**Auth must be split across two files or the Edge bundle breaks.** `src/middleware.ts` runs on the Edge runtime, which has none of the Node APIs the MongoDB driver needs. So `src/auth.config.ts` holds the Edge-safe half (providers, pages, session strategy) and is what `middleware.ts` builds its `auth` from; `src/auth.ts` spreads that config and adds the callbacks that talk to MongoDB, and is imported only from server components and route handlers. Never import `@/auth` from middleware.

**Augment `@auth/core/jwt`, not `next-auth/jwt`.** `next-auth/jwt` is only `export * from "@auth/core/jwt"`, so `declare module "next-auth/jwt"` silently creates a second, unrelated `JWT` interface and the added field types as `{}`. `src/types/next-auth.d.ts` augments the real module. The `Session` augmentation on `next-auth` does work.

The JWT carries only `uid` (the `users._id`). Role is deliberately **not** in the token — see **Roles and ownership** below.

**Bootstrapping the first admin:** sign in once with Google (this creates the `users` document with `role: "user"`), then `node scripts/set-role.mjs <email> admin`. The change takes effect within 30 seconds without signing out — that 30-second window is the whole reason the role is not in the JWT. `node scripts/check-db.mjs` lists every user with their role.

### Intended integrations (env is provisioned, code is not)

`.env` carries credentials for the rest of the intended stack, **not yet installed**:
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `GOOGLE_REFRESH_TOKEN` / `GOOGLE_DRIVE_FOLDER_ID` — file storage. See **Storage split** below.
- `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` — the sign-in OAuth client, picked up automatically by NextAuth v5. Deliberately a **different** Google client from `GOOGLE_CLIENT_ID` above, which writes to Drive as the company account.
- `AUTH_SECRET` — NextAuth. `JWT_SECRET` predates it and may be redundant.

Upload validation (JPG/PNG/PDF, size and count caps) has to be enforced server-side; client checks are UX only.

### Styling

Tailwind v4 through `@tailwindcss/postcss` — there is **no `tailwind.config`**; theme tokens are declared CSS-first in `@theme inline` inside `src/app/globals.css`.

**`DESIGN.md` is the design system and it now documents what actually ships** — the four-colour SG Partner language (white ground / `#0A0A0A` structure / `#FFD84D` gold highlight / `#EF2027` red action), with YAML tokens mirroring `globals.css` at the top and prose guidance below. **Read it before building any UI.** It was rewritten from the earlier Apple/Action-Blue analysis, which described a system this project never shipped; the design detector reads it, so `DESIGN.md` and `globals.css` must be changed together or the detector starts reporting drift that is not real.

The notes below cover what the sections of this file add on top of it. The rules that are easy to violate accidentally:

- **Four colours, unequal amounts** — white ground, `#0A0A0A` structure, `#FFD84D` gold highlight, `#EF2027` red action, plus `--danger` red for errors. The ratio is the design; spreading red and gold evenly is what turns it into a discount flyer. Action Blue `#0066cc` and the old yellow `#FFE169` accent are both superseded and must not reappear.
- Body copy is 17px / weight 400 / **line-height 1.62**. Weight **500 exists** and is the navigation-link weight only.
- Headlines are weight 700 (display, h2) or 600 (h3), with **letter-spacing 0** — never negative.
- Elevation is the `shadow-soft` → `shadow-lift` family (wide and faint), plus `shadow-device` for the phone mockup. `.product-shadow` is the legacy single shadow and now applies to product imagery only.
- Radii: `btn` 14 / `input` 12 / `card` 24 / `phone` 44 for landing-language UI; `sm` 8 / `md` 11 / `lg` 18 is the legacy scale.
- No decorative gradients. The two that exist (the "SG" wordmark, the phone bezel) are structural and documented in `DESIGN.md`.
- Touch targets ≥ 44px, and 52–56px for anything used on a phone in a shop.
- One deliberate exception to the palette: the official four-colour Google "G" in `src/components/auth/google-mark.tsx`. It is a trademark users must recognise, not UI colour — and for the same reason the Google sign-in button is never tinted with the brand red.

`src/app/globals.css` is the implementation of `DESIGN.md`: its colours are declared as CSS variables on `:root` (with `prefers-color-scheme` and `[data-theme]` overrides for the dark palette), and `@theme inline` maps them onto Tailwind utilities — `bg-brand`, `text-ink-48`, `text-body`, `rounded-card`, `shadow-soft`, and so on. `.surface-tint` is the warm page ground that makes white cards read as a separate plane.

#### The landing brand palette

**The product is branded "SG Partner".** It was renamed from "Silmin" partway through; the wordmark is now the logo mark (`src/components/brand/sg-mark.png`, a transparent PNG, also copied to `src/app/icon.png` as the favicon) plus the text lockup in `BrandLogo` (`src/components/brand/brand-logo.tsx`), used by `SiteHeader`, `SiteFooter`, `AdminSidebar`, and the login screens. **The `silmin.co.th` email and domain were deliberately left alone** — renaming them would invent contact details that may not exist, and the Nominatim/Overpass `User-Agent` strings must stay reachable by policy. Change those only when the real domain is known.

The landing page and `SiteHeader` run on a red/gold palette. The four brand colours are white, `#0A0A0A`, yellow `#FFD84D`, red `#EF2027`, specified by the user. **They are deliberately not used in equal amounts**: white is the ground, black is nav and type, yellow is highlight, red is *only* the primary action and the active state. Spreading red and yellow evenly is what turns this into a discount-flyer, and is the single easiest way to wreck it.

| Token | Light | Use |
|---|---|---|
| `--brand` | `#EF2027` | Primary action fill — CTA buttons, the phone's next button, icon chips, active nav underline |
| `--brand-hover` | `#D4161C` | Hover of a `--brand` fill |
| `--brand-ink` | `#C8151B` | Red as **small** text/icon on a light surface (badge label, check glyphs) |
| `--brand-soft` | `#FEF0F0` | Tinted badge background |
| `--on-brand` | `#FFFFFF` | Text on a `--brand` fill |
| `--gold` | `#FFD84D` | Gold **fills** only — the two yellow icon chips in the feature strip |
| `--gold-deep` | `#D99000` | The gold end of the "SG" wordmark gradient |
| `--gold-ink` | `#8A6A00` | Gold as small text on a light surface |

Contrast is the constraint that shapes most of these:

- `#EF2027` on white is ~3.6:1 — fine for large text, **fails for caption-sized text**. Small red text must use `--brand-ink` (~4.9:1). This is why there are two reds.
- `#FFD84D` on white is ~1.5:1 — invisible as text. Gold is a fill, full stop. The "SG" wordmark in the H1 is a `--gold-deep → --brand` gradient precisely so both ends clear 3:1; a flat `--gold` wordmark is a bug.
- White on `#FFD84D` is ~1.5:1, white on `#EF2027` is ~4.5:1. That is why the gold icon chips carry black glyphs while the red ones carry white. The asymmetry is the colours, not an oversight.

Other rules that are easy to get wrong here:

- **`--brand` and `--danger` are different meanings that happen to share a hue.** `--brand` means "press this"; `--danger` means "this failed / this deletes something". Never substitute one for the other — a delete button and a sign-up button must not look identical, even on different pages. This is why red was added as a new token family rather than by widening `--danger`'s remit.
- **Every surface now runs on this palette** — landing, header, footer, `/apply`, `/apply/success`, `/login` and the login dialog, `/me/*`, `/partner/calculator`, and all of `/admin`. `--accent` (the old yellow) survives only as the token `--gold` aliases and in `focus-visible:outline-accent` on the admin sidebar; no page composes with it any more.

#### The back office splits red and black differently from the front

`/admin` is a tool someone stares at all day, and two of its actions are irreversible (rejecting a shop, revoking a role). So red is rationed harder there than on the landing page:

| Element | Treatment | Why |
|---|---|---|
| Sidebar item, current page | `bg-brand` | Small pill; matches the front-end's "active = red" |
| Work-bucket card, selected | `bg-nav` (black) | Four large cards; a red one would dominate the screen all day |
| Status option card, selected | `bg-nav`, **except `Rejected` → `bg-danger`** | See below |
| "ดำเนินการ" / "ยืนยัน" | `bg-nav`, **except `Rejected` → `bg-danger`** | See below |
| Role-change confirm | `bg-nav` | Consistent with the above |
| Deactivate account | danger on hover only | Documented earlier; unchanged |
| Overdue / incomplete-documents flags | `--gold-ink` | Not errors — the pre-existing decision, preserved |

**The Rejected exception is the whole point.** `--brand` and `--danger` are visually indistinguishable, so if the ordinary confirm button were also red, `isDangerStatus()` would still branch in the code but the staff member would see no difference — and the one button that emails a shop "you did not pass" would look exactly like the one that just advances a status. Black for the ordinary path is what keeps that warning real. Do not "unify" these to red.

**`max-w-` was missing on four admin/queue `<main>` elements** (`admin/page.tsx`, `admin/[applicationId]`, `admin/users`, `admin/permissions`) — the class read `mx-auto w-full  px-6`, with the width silently absent. Content stretched edge-to-edge on wide monitors and the queue rows became unscannable. All four are now `max-w-[1180px]`; check for this when adding a new admin page.

**Status chips carry meaning through colour, and the mapping is deliberate** (`statusChipClass` in `status.ts`): **gold** = the ball is in the applicant's court (`Draft`, `NeedMoreInfo`); **black** = settled and good (`Approved`, `ActivePartner`); **danger red** = `Rejected`; **grey** = in progress, nothing to do. Brand red never appears on a chip — a chip is not something you press, and reserving red for buttons and errors is what keeps both legible. Text on the gold chip must stay near-black (white on `#FFD84D` is ~1.5:1).

`/me/[id]`'s five-stage status track intentionally reuses the `FormStepper` visual language (same circles, check marks, and red connectors) — the same person sees both screens, so they should not have to learn two progress idioms. The difference is that the status track is not clickable: it reports where the application *is*, it is not a path the applicant walks.

#### Red means "error" inside a form — never "focused" or "selected"

`--brand` (`#EF2027`) and `--danger` (`#DC2626`) are all but indistinguishable to the eye. On the landing page that is harmless, but a form has to say "this field is wrong" in a way nothing else says. So inside `form-fields.tsx` the hues are split by *job*, and the split is load-bearing:

| State | Treatment |
|---|---|
| Focused input | 2px **ink** ring |
| Selected radio / checkbox / consent row | 2px **ink** ring + `bg-pearl`, with the control's dot or tick filled `--brand` |
| Error | 2px **danger** ring + `bg-danger/[0.04]` + a `CircleAlert` icon beside the message |

The rule to preserve: **a red ring anywhere in a form means the value is wrong.** Brand red survives as the filled dot/tick, the progress bar, the step icon, the required asterisk, and the buttons — all shapes that cannot be mistaken for a field outline. Do not "brand" the focus or selected ring back to red; it silently destroys the only error signal the form has.

The form itself is a white `rounded-card` with `shadow-soft` floating on `surface-tint`, container `860px` (narrower than the landing 1280 — a single column of fields does not want a wide measure).

**The Google sign-in button is never tinted with the brand red.** White fill, dark label, the four-colour "G" — that is Google's own guidance, and a red-washed version makes people hesitate about where the button leads. It gets its prominence from size, shadow, and being the only button in the dialog. Same rule on `/login` and in `LoginDialogProvider`, which deliberately share one layout and one set of reasons: a person bounced there by middleware is answering the same question as someone who clicked from the landing page.

**Progress is a stepper, not a bar** (`src/app/apply/form-stepper.tsx`). A bar only answers "how far along"; the stepper also answers "what is left and what did I already pass", which is what matters in a seven-step form. Rules baked into it:

- **Completed steps are buttons; the current and future ones are not.** Jumping forward would skip the validation of the steps in between. Going back is safe because `goNext` re-validates on the way forward, and `updateOwnApplication`/`submitAction` validate again server-side.
- `STEPS` in `options.ts` carries both `title` (the page `h1`) and `short` (the label under the circle). Seven full Thai titles cannot sit on one line, so keep `short` short — and keep both in that file, since it is the single source for step copy *and* per-step validation.
- Labels are `lg`-only; below that the circles stand alone and the current step's name is carried by the `h1` right underneath. The `<li>`s are `flex-1` and the connectors are absolutely positioned, so the row shrinks instead of overflowing on narrow screens.
- **Red must never out-shout the CTA.** The benefits checklist uses `bg-brand/10` chips with `--brand-ink` glyphs, not five solid red circles, because five saturated dots carry more combined visual weight than the one red button below them and the eye stops at the list. `TrustInfo` is fully grey for the same reason — it sits centimetres from the CTA.
- The reference comp's copy is restaurant-domain placeholder text ("ส่วนลดบนเมนู", "เมนูพิเศษ"). The real product copy (ค่าตอบแทน, แผนผ่อนชำระ) was kept deliberately — the design was taken, the claims were not.

**Landing-only scales.** `--r-btn` 14 / `--r-input` 12 / `--r-card` 24 / `--r-phone` 44 (`rounded-btn`, `rounded-input`, `rounded-card`, `rounded-phone`) are a separate radius scale from the app's `sm`/`md`/`lg`, and `--shadow-soft` / `--shadow-lift` / `--shadow-device` are wide, faint shadows unlike the app's single crisp `.product-shadow`. Weight **500** now exists in the ladder (300/400/500/600/700) and is loaded in `layout.tsx` — it is the nav-link weight only; 400 looks washed out on black and 600 competes with the red CTA.

**The whole landing page runs on this language, not just the hero.** Section rhythm is `tint → canvas → tint → tile → canvas → tile`, set by the `tone` prop on `Section`; the surface change *is* the divider, so never add a rule or border between sections. `Section` and `SectionHeading` (`src/components/ui/section.tsx`) own the 1280 container, the `py-20 lg:py-28` block, and the heading scale — a landing section that hand-rolls its own container will drift out of alignment with the navbar.

**There are no eyebrows/kickers above headings.** `Eyebrow` was deleted, not left unused. A label that restates the heading it sits on ("ก่อนเริ่ม" over "เตรียมไว้ 3 อย่าง…") costs a line and adds nothing; where the words carried meaning they were folded into the heading itself ("หลังกดส่ง คุณจะรู้ตลอด…"). Do not reintroduce the pattern.

Where each colour lands across the page, and why: **gold** is the icon-chip fill in `PrepareSection` and the accent inside `DataScopeSection` (on black it measures ~13:1 — this is the one place gold can carry text and icons directly); **black** is the numbered circles in `ProcessSection`, because a sequence is structure, not an action; **soft red** is the checklist glyphs and the FAQ toggle; **solid red** appears only on buttons and the active nav item. `ProcessSection` deliberately has no red at all.

**Component split** (`src/components/landing/`): `hero.tsx` composes only. `hero-backdrop.tsx`, `phone-mockup.tsx`, `benefits-list.tsx`, `trust-info.tsx`, `feature-strip.tsx` each own one thing. `SiteHeader` stays a **server** component so the sign-out `form` keeps its server action; the hamburger is `mobile-nav.tsx` (client) and receives the sign-out button as a rendered `actions` prop, the same pattern as `AdminSidebar`. Shared link data lives in `src/components/nav-links.ts`, which imports nothing so both sides can use it.

**The nav width budget is measured, not guessed.** The container caps at 1280 (≈1216 usable), and the signed-in cluster plus five links overflows it. That is why the full menu appears at `xl` (1280) rather than `lg`, why หลังบ้าน and the email are dropped from the bar on the landing page only, and why 1024–1279 gets the hamburger. Adding anything to that bar means re-measuring, not eyeballing.

The colours inside `phone-mockup.tsx` (`#0a0a0c`, `#131317`, `#3d3d44`) and its 9.5–15px type are deliberately off both the palette and the type ramp: it is a picture of a device at reduced scale, not page UI. The design detector flags them; that is expected.

#### The danger token

`--danger` (`#dc2626`, red-600) is the fourth color, added deliberately by the user and scoped narrowly: it means "error, rejection, or a destructive action," never "look here." Unlike gold, red-600 has enough contrast on white (~4.8:1) to serve as text directly, so it doesn't need the same fill/ink split — `--danger-ink` exists only so it can brighten to `#F87171` (red-400) on dark surfaces, where `#DC2626` alone reads too dark. `--on-danger` is white text sitting on a `--danger` fill, and `--danger-focus` (same value as `--danger-ink`) is the focus-visible outline color for controls already in a danger state — never the default `:focus-visible` color, which is now the ink ring on form fields.

**Whether a *status* (not just a validation error) gets the danger treatment is decided in exactly one place**: `StatusMeta.dangerStyled` in `status.ts`, read through `isDangerStatus()`. Today only `Rejected` is `true`. Every consumer — `statusChipClass`, the three status-driven boxes on `/me/[applicationId]` (`statusMessage`, the track-stage note, `editBlockedReason`), and the three Rejected-branch spots in `StaffPanel` (the option card, "ดำเนินการ", the confirm dialog's "ยืนยัน") — calls `isDangerStatus()` rather than comparing `=== "Rejected"` directly, so adding a second danger-styled status later is a one-line change to `STATUS_META`, not a grep-and-replace across files.

Current usage: field-level validation errors (`Field`/`ConsentCheckbox`/`TextInput`/`SelectInput` in `form-fields.tsx`, and the matching inline errors and invalid-rings in `steps.tsx`/`documents-step.tsx`), everything gated by `isDangerStatus()` as described above, the document-delete hover state, the deactivate-account hover state in `/admin/users`, and top-level error banners (`role="alert"` banners for a failed submit/action). It is deliberately **not** applied to the "needs action"/"overdue" gold highlights in the back-office queue (those stay `--gold-ink` by design — see **Back office**) or to any success/confirmation banner (those keep `CircleCheck` + `--brand`), since neither of those is actually an error.

Three Tailwind-v4 traps that already cost a debugging round:

- **`@theme inline` does not emit the custom property.** It inlines the value into generated utilities, so `var(--font-sans)` inside a hand-written CSS rule resolves to nothing and the rule silently dies. Declare the real value on `:root` under a separate name (`--font-stack-sans`) and have `@theme inline` point at *that*.
- **The `next/font` variable class belongs on `<html>`, not `<body>`.** `:root` references `--font-plex-thai`; with the class on `<body>` the `:root` declaration is invalid at computed-value time, and the whole font stack falls back to the browser default without any error.
- **A hand-written global rule outside `@layer` always beats a Tailwind utility class, no matter its specificity.** `@import "tailwindcss"` puts every utility inside CSS cascade layers, and an unlayered rule always wins over a layered one regardless of selector specificity — this is a hard rule of the CSS Cascade Layers spec, not a close call. `globals.css` had a bare `:focus-visible { outline: 2px solid var(--accent-focus); ... }` for the site-wide focus ring; inputs in `form-fields.tsx` draw their own focus ring via `focus:ring-2` and tried to cancel the outline with `focus-visible:outline-none`, which compiles to `.focus-visible\:outline-none:focus-visible { outline-style: none; }` — two classes plus a pseudo-class, higher specificity than the bare `:focus-visible` rule, and it still lost, because it's inside Tailwind's layer and the global rule isn't in any layer. Symptom was a focused input showing two concentric borders (the ring plus the outline). Fix: wrap the custom rule in `@layer base { ... }` so normal layer-order rules (base < utilities) decide it instead of specificity. Any future hand-written CSS meant to be overridable by a Tailwind utility must go inside a layer.

## Storage split

Text and numbers go to MongoDB. Files and images go to Google Drive — the database stores only a pointer (`driveFileId`, original filename, mime type, size, uploaded-at), never file bytes.

Drive layout, created inside the parent folder named by `GOOGLE_DRIVE_FOLDER_ID`:

```
silmin_partner/
├── 1_รูปหน้าร้าน          (storefront photo)
├── 2_เอกสารร้านค้า        (shop documents)
├── 3_เอกสารเจ้าของร้าน     (owner documents)
├── 4_เอกสารอื่นๆ           (other documents)
└── _pending               (staging, not part of the original spec)
```

Rules that are easy to get wrong here:

- **Provision the folders idempotently.** Drive happily creates duplicate folders with the same name, so a naive "create the folder before saving" runs on every submission and produces many `silmin_partner` folders. Search by name + parent first, create only if missing, and cache the resulting folder IDs.
- **Uploads land in `_pending` first.** The Application ID does not exist until submit, so files are staged under a draft key, then *moved and renamed* into the category folder on successful submit (Drive `files.update` with `addParents`/`removeParents` — no re-upload). Sweep `_pending` for abandoned drafts.
- **Filename convention:** `{applicationId}_{shopSlug}_{nn}.{ext}`, e.g. `SG-2026-000125_ABC-Mobile_01.jpg`.
- **Never set files to "anyone with the link."** Owner documents are personal data. Back office reads them through a server-side proxy that checks the session first.
- Files consume the quota of the Google account behind `GOOGLE_REFRESH_TOKEN`.

**Implementation.** `src/lib/drive/client.ts` calls the Drive REST API directly with `fetch` — no `googleapis` dependency — and caches the access token in module scope for its full hour. `src/lib/drive/folders.ts` owns `ensureFolders()`, which reads the cached folder IDs from the `settings` collection and falls back to search-then-create; the `settings` document is a cache, never the source of truth, so deleting it is safe and re-provisioning finds the existing folders instead of duplicating them. Uploads go through `POST /api/apply/documents`; reads go through `GET /api/documents/[id]`, which checks session and ownership before streaming, so `driveFileId` never reaches the browser.

`GOOGLE_DRIVE_FOLDER_ID` currently points at a folder named `Stock_Evidences` that another system already fills with `stock_evd_*.jpg`. `silmin_partner/` was created **inside** it, per the user's instruction. Nothing pre-existing was touched, but if that folder is ever cleaned up wholesale, this project's files go with it — worth moving to a dedicated parent before launch.

Still missing: a sweeper for `_pending`, for drafts that are abandoned before submit. Nothing deletes those files today.

## Status tracking

Once signed in, a shop sees its own applications and their current status on its account page — there is no anonymous lookup and no Application-ID-plus-phone form. Phone number stays a contact field only.

`/me` lists the shop's submitted applications plus any resumable draft; `/me/[applicationId]` shows one application in full with a five-step progress track, the submitted data, and its documents. Both query with `ownerUserId` in the filter, and the detail page redirects to `/me` when nothing matches — so a guessed Application ID is indistinguishable from one that does not exist.

`src/lib/application/status.ts` maps each status to its Thai label **and a sentence saying what happens next**; a bare status like `Reviewing` does not tell a shop whether to wait or to act. `STATUS_TRACK` deliberately omits `NeedMoreInfo` and `Rejected` — they are branches off the path, not steps along it, so `trackIndex` parks both at the review stage. The yellow status chip is reserved for statuses where the ball is in the applicant's court (`Draft`, `NeedMoreInfo`), which keeps the single-accent rule intact and makes "you need to do something" scannable.

The label shown for `New` is **รอดำเนินการ**. It appears in `STATUS_META` and again on the submit-success screen; change both together.

### Editing after submission

`/me/[applicationId]/edit` reuses `ApplyForm` with an `applicationId` prop. That prop is the whole switch: autosave to the draft is disabled (otherwise editing a real application would resurrect a stray draft), the documents step attaches uploads to that application instead of the draft, the review step hides the consent boxes, and the submit button calls `updateApplicationAction` instead of `submitAction`.

**Editable only while status is `New` ("รับข้อมูลแล้ว")** — the user's explicit decision. Once staff start reviewing, what they are reading must stop moving. Three layers enforce it, and all three are needed:

1. the detail page renders an explanation from `editBlockedReason()` instead of the edit button,
2. the edit page itself refuses to render the form,
3. `updateOwnApplication` puts the status in the `updateOne` filter, so an edit tab left open while staff change the status writes nothing.

Layer 3 is the one that actually protects the data; the first two only save the user a wasted trip.

**Consent is never re-collected on edit.** The evidence stored at first submit (timestamps, `policyVersion`, IP, user agent) still describes what was agreed to, and overwriting it would destroy the proof. The edit page seeds `consent: { truthful: true, pdpa: true }` purely so `validateForSubmit` passes; `diffApplicationData` strips `consent` before comparing so it never shows up as a change.

Every edit writes an `edited` activity carrying a field-level diff (`src/lib/application/diff.ts`) with Thai labels and option codes resolved to their labels — the audit row reads "จำนวนสาขา: 1 สาขา → 2–5 สาขา", not `"1" → "2-5"`. That history is shown to the applicant too, not just staff, because it is their evidence that the change was recorded.

Not built yet: staff cannot request changes through `NeedMoreInfo` — that status currently blocks the applicant from editing, which is backwards for a status that literally means "we need more from you". Resolve it when the back office lands.

## Thai typography

The product ships in Thai. These three rules are now baked into `DESIGN.md` and into the type ramp in `globals.css`, but they are worth restating because every one of them is easy to undo by copying a snippet from an English design system:

- SF Pro and Inter have no Thai coverage. **IBM Plex Sans Thai** (400/500/600/700) carries Thai; the Latin stack in front of it handles Latin and numerals.
- **Never apply negative letter-spacing.** Use `0` everywhere, display sizes included. Thai stacks vowels above and tone marks below the baseline, and tight tracking collides them.
- **Body line-height stays ≥ 1.6** for the same reason. Display sizes may go to 1.28–1.45 because the glyphs are large enough to survive it.

Credibility on the public form comes as much from structure as from styling: visible step progress, an explanation of why each block of data is asked for, an explicit note that no bank details are requested in phase 1, a readable review step, and error messages that say how to fix the problem.

## The application form

`/apply` is a seven-step form. Steps and their Thai titles live in `STEPS` (`src/lib/application/options.ts`), which is the single source for both the progress bar and per-step validation; every option list and its Thai label lives in that file too, so copy changes happen in one place.

- `src/lib/application/schema.ts` holds the `ApplicationData` shape plus two kinds of Zod schema. `draftSchema` is permissive — a half-filled draft has to save, or people lose work. `stepSchemas` are strict and run twice: on "ถัดไป" for feedback, and again inside `submitAction` on the server, because client validation is only UX.
- **Every field is a string or an array, never `undefined`.** Empty means `""`. This keeps React inputs controlled for the whole lifetime of the form.
- Draft autosave is debounced 1.5s and writes through `saveDraftAction`. Shops fill this in on phones with unreliable signal, so waiting for a step change to save loses a whole step's work.
- **Autosave must be disabled the moment submit starts, not when it succeeds.** A timer already scheduled will otherwise fire after the draft has become a real application and upsert a fresh draft — the user then sees a ghost draft and can submit a duplicate. `submitApplication` also runs `deleteMany({ ownerUserId, status: "Draft" })` as a server-side backstop; do not remove either half.
- Phone numbers are normalised to digits in `validateForSubmit`, so `081-234-5678` and `0812345678` land in the database identically.
- Consent is captured as two never-pre-checked boxes plus `policyVersion`, `ip`, and `userAgent`. Bump `PRIVACY_POLICY_VERSION` in `src/lib/db/applications.ts` whenever the policy text changes, or the stored evidence stops proving what was agreed to.
- The success screen re-queries the application by `applicationId` **and** `ownerUserId` before showing it, so a guessed ID in the URL reveals nothing.

Step 5 (เอกสาร) is a client component that talks to `/api/apply/documents` directly, because documents are Drive pointers rather than form fields and so are not part of `ApplicationData`. It reports its file counts up to `ApplyForm`, which blocks "ถัดไป" until every category marked `required` in `categories.ts` has at least one file (รูปหน้าร้าน and เอกสารเจ้าของร้าน); `submitAction` and `updateApplicationAction` re-check the same rule server-side.

**`documentsComplete()` in `src/lib/application/categories.ts` is the single definition of "เอกสารครบ"** — the applicant form and the back-office ครบ/ไม่ครบ column both call it. Two separate definitions would eventually disagree, and then the queue would flag an application as incomplete that the system itself had just accepted. Note that applications submitted before เอกสารเจ้าของร้าน became required now read as ไม่ครบ, which is correct: the column answers "is this complete by today's rule", not "was it complete when it arrived". `stepSchemas.documents` is empty on purpose — there is nothing about documents inside `ApplicationData` for Zod to check.

### Address and map (step 1)

**พิกัดร้าน (the map) sits *before* ที่อยู่ร้าน (the address fields)** — the user's explicit ordering. Pinning first and letting the address fill itself is faster than working down five cascading dropdowns, but both directions still work: the map pins itself from a completed address too. The copy under the heading has to describe both, or whichever direction it omits looks broken.

Address data comes from a bundled offline dataset (`src/lib/application/data/thai-address.json`, ~491KB, from `kongvut/thai-province-data`) accessed through `src/lib/application/thai-address.ts`. Two gaps in that data drive the design:

- **No Bangkok subdistrict has lat/lng** (all 170 are null; ~7124 of 7452 nationwide do have them). So `nearestSubDistrict()` — the offline point→subdistrict fallback — silently cross-matches Bangkok points into a neighbouring province. It is therefore the *fallback*, capped at 3km, and the primary path is Nominatim reverse-geocoding fed through `matchAdminNames()`.
- **Nominatim names its address fields inconsistently** (Bangkok: `quarter`/`suburb`/`city`; elsewhere: `city_district`/`county`/`province`). `/api/reverse-geocode` therefore returns *every* candidate field untouched and `matchAdminNames()` tries each one, raw and with `ADMIN_PREFIXES` stripped, against the real dataset. Do not "clean this up" by mapping field names to levels — that is the bug this replaced.

Both geocoding routes are **server-side proxies because Nominatim's policy requires an identifying `User-Agent`**, which a browser cannot set. Both are auth-gated.

**Forward geocoding must use structured search, not free text.** `/api/geocode` sends `street` (Thai) plus `city`/`state` in **English** (via `englishNamesOf`), because Nominatim's free-text search returns nothing for pure-Thai queries — repeatedly confirmed, even for a single unambiguous province name. The caller sanity-checks the result against the subdistrict centroid and discards anything more than 10km away.

**House-number autofill falls back to Overpass, in three tiers.** Nominatim only returns `house_number` when the point lands *on* an object tagged with one; a phone's 5–30m GPS drift usually snaps it to the road instead, which returns nothing. So `/api/reverse-geocode` queries the **Overpass API** (`overpass-api.de`, free, no key) for `addr:housenumber` objects within 250m and splits them by distance — measured with haversine on our side, since Overpass's own `around:` measures to polygon edges while we compare against centroids:

| Distance | Behaviour |
|---|---|
| ≤ 45m (`AUTOFILL_RADIUS_M`) | filled into เลขที่ automatically, `houseNumberNearby: true` |
| ≤ 250m (`SUGGEST_RADIUS_M`) | returned as `houseNumberCandidates`, offered as tappable chips — never auto-filled |
| nothing found | the form says so explicitly ("บริเวณนี้ไม่มีข้อมูลเลขที่บ้านในแผนที่") |

- **45m is a correctness boundary, not a tuning knob.** Past it you are filling in a *neighbour's* house number, which is worse than leaving the field blank, because the applicant may not notice before submitting. That is why the 45–250m band is a suggestion the user taps, not an autofill.
- **Every outcome must be visible.** Thai OSM house-number coverage is sparse — rural points routinely have nothing within 250m. Silence there reads as a broken button, which is exactly what got reported; the third tier exists to say "no data here, type it yourself".
- The form refuses to overwrite a house number the user typed themselves when the match is only `houseNumberNearby`; an exact Nominatim hit overwrites freely and shows no note.

**Overpass rate-limiting is the failure mode to know about.** `overpass-api.de` allows only **2 concurrent slots per IP**, and every user shares the server's IP in production. Two defences, both required:

- **Results are cached in-process** keyed by coordinates rounded to 4 decimals (~11m), 1 hour TTL, 500 entries. Empty results are deliberately **not** cached — an empty list may mean "rate-limited", and caching that would pin a wrong answer for an hour.
- **`fetchOverpass` must inspect the body, not just the status.** When rate-limited, Overpass frequently returns **HTTP 200 with an HTML error page** saying `rate_limited` — `response.ok` is `true`, so a status-only check passes, `JSON.parse` then throws, and the request silently degrades to "no house number found" even though the data exists. This was the actual cause of the intermittent failures. It retries up to 3 times on 429, 504, or a non-JSON body containing `rate_limited`/`runtime error`.

Public Overpass mirrors (kumi.systems, private.coffee, osm.jp) were tested and are unreachable from this environment, so there is no failover instance to switch to.

**Never import from `@/lib/drive/folders` (or anything else that reaches MongoDB or Drive) inside a client component.** It pulls the MongoDB driver into the browser bundle, and the error you get is `Module not found: Can't resolve 'child_process'` from a file named `mongocryptd_manager.js`, which points nowhere near the real cause. Shared constants live in `src/lib/application/categories.ts`, which imports nothing at all; `folders.ts` re-exports them for server code.

`node scripts/dev-session.mjs <email>` mints a local session cookie for a user that has already signed in once, so authenticated pages can be exercised without walking the Google flow. Local development only.

## Back office

`/admin` is the staff queue. **There is no assignment** — every `employee` and `admin` sees every application. The difference between the two roles is what they may *do*, never what they may *see*, so no query under `/admin` filters by who is looking; the `salesOwnerId` field from the original schema sketch was dropped.

`listAllApplications` takes status, province, shop type, a submitted-date range, ครบ/ไม่ครบ, a free-text term, sort, page and page size. Three details that matter:

- The ครบ/ไม่ครบ filter is built from `REQUIRED_CATEGORIES`, not hard-coded, so it cannot drift from what the form enforces.
- Free text searches applicationId, shop name, contact name, and — separately — the phone with non-digits stripped, because the database stores `0812345678` while people type `081-234-5678`. The term is regex-escaped first.
- The date range filters on **`submittedAt`, never `updatedAt`** — the question is "what came in this month", and filtering on `updatedAt` would drag old applications a staff member merely touched into the middle of the new ones.

**The back office is designed for staff who are not comfortable with computers.** That constraint drives most of its layout decisions, and undoing them to "clean up the UI" would undo the point:

- Five count cards sit above the queue: a black **ทั้งหมด** card plus the four `KPI_BUCKETS`. They are filter buttons, not decoration — clicking one filters the table below and gets an ink ring, and clicking it again clears the filter. The selected card is ringed rather than filled red, because five large cards in a row would out-shout the one red action button if any of them were solid red.
- The same four buckets appear again as **underlined tabs** directly above the table. They are underlines rather than a second row of pills specifically because the cards above are already pills: two pill rows answering the same question would read as two separate controls.
- Rows lead with the Application ID, but the **shop name is the visually dominant element** — bold, next to a black initials avatar, with the contact name and phone under it. People remember shops; nobody remembers `SG-2026-000004`, so the ID is there to be copied, not to be scanned.
- Age is written out (*"รอมา 5 วัน"*) rather than left as a date to subtract from today, and turns gold past three days on a `New` application.
- **ความคืบหน้า is `trackIndex()` + 1 out of `STATUS_TRACK.length`**, the same five-stage track the applicant sees on `/me/[id]`. It is not a second progress model — a rejected application reads 2/5 because `trackIndex` parks it at the review stage, which is exactly where it stopped.
- **The status chip and the progress bar in a row always agree in colour**, because `statusBarClass` and `statusChipClass` read the same `STATUS_META` flags. They sit two columns apart; if they used different palettes the reader would assume they meant different things.
- The search box and the province / shop-type selects are one `<form>`; ตัวกรอง and Enter both submit it. Document and sort filters stay inside a collapsed `<details>` — they are used rarely and every visible control costs attention daily.
- **Every link on the page preserves the whole filter set** (`hrefWith` in `page.tsx`). Tabs, page numbers, page size, date range and the export link all round-trip `tab`, `range`, `type`, `province`, `documents`, `q` and `sort`. A tab that silently drops the province you just picked is worse than no tab.
- On the detail page, **the action comes before the data**: contact card, then "ขั้นตอนถัดไป", then documents, then the submitted fields in collapsed blocks. The job is calling the shop and deciding, not reading a record top to bottom.
- Each status option is a full-width card carrying a plain-language sentence about what choosing it *does*, not a chip with the status name.
- Status changes and role changes both go through a **confirmation dialog that repeats the outcome** — which shop, which new status, and the exact message the applicant will see. Users who are afraid of clicking the wrong thing need to see the consequence before committing, and it is the cheapest defence against a mis-click that emails a shop.

**The queue has no select-all checkbox and no bulk actions**, though the reference design showed both. Nothing in the system acts on many applications at once, and status change in particular must not: `requiresMessage()` marks `NeedMoreInfo` and `Rejected` as needing a per-application message to the shop, so a bulk version would either send the same sentence to twenty different shops or skip the message entirely. A checkbox with nothing behind it is worse than no checkbox.

**"+ ใบสมัครใหม่" from the reference became "ตรวจใบถัดไป"**, which opens the oldest un-reviewed application (`findOldestPending`). Staff do not create applications — shops submit them — so a create button would have nowhere to go. When nothing is pending the button becomes a muted "ไม่มีใบรอตรวจ" label rather than a dead red button.

The sidebar's คิวใบสมัคร item carries the live `New` count, fetched in the admin layout and passed down (the sidebar is a client component). It is hidden at zero: a badge reading "0" costs a glance and says nothing.

The default sort is "รอนานที่สุดก่อน" for the same reason — an application nobody opened for a week is a shop that has already given up.

`src/lib/application/transitions.ts` holds `ALLOWED_TRANSITIONS`: staff cannot skip stages, `ActivePartner` and `Rejected` are terminal, and `Rejected` is reachable from almost anywhere because the company can walk away at any point. `requiresMessage()` marks `NeedMoreInfo` and `Rejected` as needing a message to the applicant — both statuses are useless if the shop is not told what to fix or why it failed.

**Internal notes and messages to the applicant are two different things, not one.** The PRD has a single หมายเหตุ column, but merging them means an internal note eventually surfaces on the applicant's page. They are kept apart by `Activity.visibility`: `internal` notes are staff-only, everything else is applicant-visible, and a missing value counts as applicant-visible so activities written before the field existed still render. **`listActivities` defaults to excluding internal entries** — the safe direction, so a future caller from an applicant page cannot leak notes by forgetting a flag. `/admin` is the only caller that passes `includeInternal: true`.

The message to the applicant is stored as `statusMessage` on the application itself, not only inside the activity, so `/me/[applicationId]` can show the current instruction prominently instead of making the shop dig through a timeline.

`/admin/[applicationId]` shows the whole application, the consent evidence, the documents, and a `StaffPanel` that offers **only the transitions `ALLOWED_TRANSITIONS` permits from the current status** — the UI never lets someone pick a move that will then be rejected. `changeStatus` still re-checks the rule and puts the current status in the `updateOne` filter, so two staff opening the same application cannot overwrite each other's decision without noticing.

### The application detail page

The page follows a reference comp (a generic admin-template screenshot) closely for layout and chrome, but two of that comp's features describe things this system does not have, and were deliberately not reproduced rather than faked:

- **No "ผู้ดูแลใบสมัคร" (assigned owner) field.** The back office has no assignment — every `employee` and `admin` sees every application (see **Back office** above). The comp's "assigned staff" row is replaced with **ผู้ทำรายการล่าสุด**, sourced from the first `activity` that carries an `actorLabel` (only staff-authored activities set one; the applicant's own `submitted`/`edited`/`document_*` entries don't). This is real audit data already sitting in the `activities` collection, just never surfaced here before.
- **No "แก้ไข" links on the shop/contact/business summary cards.** Staff cannot edit an applicant's submitted data — only the applicant can, and only while status is `New` (see **Editing after submission**). An edit link that opens nothing is worse than no link.
- **No per-file "verified" checkmarks and no "ดาวน์โหลดทั้งหมด" button** on the documents list. The system has no per-document review state (only whole-application `documentsComplete()`) and no zip-export endpoint. Both would need new data or a new endpoint to back them honestly; the list instead shows real file metadata with a real per-file open link, plus a plain count.
- **The five-step "ขั้นตอนการสมัคร" checklist is not a second, more-granular pipeline.** The comp's mock has stages like "ตรวจสอบความน่าเชื่อถือ" and "สร้างบัญชีพาร์ทเนอร์" that don't exist as statuses in this system. The checklist instead re-renders the same `STATUS_TRACK` + `STATUS_META[...].detail` used everywhere else (`ProgressTracker`, `/me/[id]`), so it can never drift out of sync with the actual status model — it's the existing five stages with fuller descriptions, not a new source of truth.

Two components carry real, previously-unsurfaced data onto this page:

- **`StatusMessageCard`** shows `application.statusMessage` — the note last sent to the applicant — which `/me/[id]` already displayed but the staff-facing detail page never did. A staff member picking up a case a colleague already touched needs to see what the shop was told, so they don't contradict it on a call.
- **`ProgressTracker`** is the same `STATUS_TRACK`/`trackIndex()` five-stage stepper `/me/[id]` shows the applicant, **recolored for the back office**: `/me` fills the current stage with brand red (its rule: red = highlight), but a stepper here follows the back-office rule of rationing red instead — the current stage uses `statusBarClass(status)` (gold when the ball is in the shop's court, black once approved, danger red only if rejected, gray while ordinarily in progress), the exact same function the queue table's progress bar already uses. Completed stages are always ink/black regardless of status, since "already passed" is a settled fact, not a live status. `statusOnBarClass()` (in `status.ts`) picks the matching text color for whatever `statusBarClass` returns, since gold needs dark text and everything else needs white — one function, so the two decisions can't drift apart.

**The full option-card `StaffPanel` was kept in its existing position and form (right after the contact card), not replaced by the comp's inline quick-buttons.** That placement and shape — full-width cards with a plain-language sentence, the message field only required where `requiresMessage()` says so, and a confirm dialog that repeats the outcome — is explicit, deliberate, and already documented above; rebuilding it as a second, thinner action surface would either duplicate the safety checks or bypass them. The header's small **"ดำเนินการ"** button (shown only when `canChangeStatus` and `ALLOWED_TRANSITIONS[status]` is non-empty) is a plain anchor link to `#next-steps` — no new state, no new dialog, just a jump to the one real flow.

Server actions in `src/app/admin/actions.ts` call `guardRole` themselves. The layout guard is not enough: a server action can be invoked directly without ever loading the page it belongs to.

**Document access.** `/api/documents/[id]` now has two paths. Owners read their own files with no log entry — looking at your own document is not an event. Staff (`admin`/`employee`) read any file, and **every staff read is written to the `documentAccess` collection** with who, which file, which application, and when. It is a separate collection from `activities` on purpose: this is a security trail, not part of the application's story, and its volume is different by an order of magnitude. Reads are de-duplicated per staff+file for 10 minutes, because one glance at a photo hits the proxy several times and an un-throttled log buries the entries that matter.

### The dashboard

`/admin/dashboard` is the overview screen; **`/admin` stays the queue.** That split is deliberate. `/after-login`, the header's "หลังบ้าน" link and every notification `href` point at `/admin`, and the queue is what a staff member should land on — it leads with *"มี N ใบรอคุณตรวจ"*, which is the job. A dashboard answers "how are we doing", which is a different question and a rarer one. Making the dashboard the landing page would undo that decision, not just move a route.

Every number on it is read from the database. There is no seeded, sampled or estimated figure anywhere, and there must never be — a dashboard is a screen people believe without checking, so one invented number poisons the rest.

`src/lib/db/dashboard.ts` pulls the whole page in **one `$facet` aggregation**: counts by status, counts by shop type, the daily series, the two trend windows, the oldest waiting application, and the stalled `NeedMoreInfo` count. Seven separate queries per page load was the alternative.

Things in it that look arbitrary but are not:

- **Days are cut in `Asia/Bangkok`, via `$dateToString`'s `timezone`.** Cutting on UTC moves anything submitted after 7pm into the next day, and the chart then disagrees with the timestamps in the table right below it.
- **`anchorAt` = `statusChangedAt ?? submittedAt`** is what the trend measures — "when did this application arrive in the state it is in now". `submittedAt` alone would report an application rejected yesterday as activity from the week it was filed.
- **The comparison window is fixed at 7 days**, not tied to the chart's range selector. "จากสัปดาห์ก่อน" is a phrase everyone reads the same way; "จาก 90 วันก่อน" is not.
- **`Trend.percent` is `null` when the previous window is zero**, and the card then says "เพิ่มขึ้น 3 ใบ" instead of a percentage. This is the common case, not an edge case: real volume is single digits per week, and "+300%" off a base of one application is noise dressed up as a statistic.
- **`KPI_BUCKETS` (in `status.ts`) partitions all seven statuses** — no overlap, nothing left out — because the four ring gauges show each bucket's share of the total, and shares that do not add to 100% make the whole strip untrustworthy. The queue uses the same four buckets for its cards and tabs, deliberately: an earlier `WORK_BUCKETS` grouped the same seven statuses a second way (รอคุณตรวจ / กำลังดำเนินการ / จบแล้ว) and was removed, because clicking a card on one page and landing on a different total on the other reads as a bug even when both numbers are right.
- The two chart series are **`submittedAt` per day (red, งานเข้า)** and **`statusChangedAt` per day (gold, งานที่ทำไป)**. The gap between them is the only thing the chart exists to show: red above gold for several days running means work is piling up.
- Clicking a KPI card filters the **table on the same page** rather than jumping to the queue. The dashboard is where someone is reading numbers; making them lose the page to check one of them is the wrong trade. The queue's own cards do the same thing to its own table.
- The gold notice strip under the KPI row renders **only when there is something to act on** (oldest waiting ≥ 3 days, or `NeedMoreInfo` stalled past a week). A banner that is always present becomes invisible within a week.

**Everything on the page does something.** "ดาวน์โหลดรายงาน" is a real CSV export at `/admin/export`; the search box submits to the queue's real search; the range chip re-renders the chart. A control that looks live and is not is worse than no control, because the person who presses it will believe it worked.

`/admin/export` is reachable from both the dashboard and the queue's ส่งออกข้อมูล menu, and **accepts the queue's own filter params** so "ตามตัวกรองที่เลือกอยู่" produces a file matching what is on screen — if the two disagreed, someone would take the wrong file into a meeting without noticing. It streams CSV with a **UTF-8 BOM** (without it Excel on Windows reads the Thai as mojibake) and prefixes any cell starting with `=` `+` `-` `@` with an apostrophe, since those cells hold shop names typed by applicants and Excel would otherwise evaluate them as formulas.

**Charts are hand-written SVG in server components** — no chart library, no client JS. The curve is monotone cubic (Fritsch–Carlson), not a plain cardinal spline: a cardinal spline overshoots, so a day with zero applications dips the line below the axis, which is a picture of an impossible number.

Three sizing rules that were measured, not guessed, and that break silently if changed:

- An SVG with a `viewBox` scales its **text** along with everything else. The chart's `viewBox` is therefore kept close to its real rendered width, capped at `max-w-[720px]`, with a `min-w-[420px]` floor inside an `overflow-x-auto` wrapper so narrow screens scroll the card instead of shrinking the labels to 6px. That floor must stay **below** the card's real inner width at `2xl` (~429px), or wide screens grow a pointless scrollbar.
- The three middle cards go three-across at **`2xl` (1536), not `xl`**. The sidebar takes 256px, so at 1280–1440 — where most laptops sit — a third of the remaining width leaves the chart around 390px and the axis unreadable. Below `2xl` the chart spans the full row and the donut and notifications sit side by side.
- All three of those cards carry **`min-w-0`**. Grid children default to `min-width: auto` and refuse to shrink below their content, so without it the chart's scroll container pushes the *page* sideways instead of scrolling itself (measured: 197px of page overflow at 390px wide).

The donut's legend sits **below** the ring, not beside it as in the reference comp: Thai category names ("ร้านมือถือและอุปกรณ์เสริม") do not fit next to a ring in a 380px card without truncation, and a truncated category name does not identify a category. Its slice colours follow the order of `SHOP_TYPES`, never the order of the counts, so "ร้านมือถือ" is the same colour every day.

**The reference design used blue and green; this does not.** The palette is four colours (`DESIGN.md`), so the donut runs a red → gold → black → grey ramp and the "ระบบออนไลน์" dot is gold. Trend arrows colour by *good or bad*, not up or down — more rejections is bad news even though the arrow points up — and "good" is plain ink, since there is no green to spend.

`AdminTopbar` renders in the layout, so it is on every `/admin` page. It is a server component: the account menu is a `<details>`, not client state, because the sign-out button inside it is a server action and a client component cannot create one. Its "ข้อมูล ณ HH:MM น." is the render time and it earns its place — this screen is left open all day, and that clock is the only thing telling the reader how stale the numbers are.

### Roles and permissions in the UI

`/admin/users` and `/admin/permissions` are **admin-only** — the `/admin` layout admits `employee` too, so both pages call `guardRole(["admin"])` again themselves. A layout guard that is looser than the page needs is not a guard.

The back office has its own chrome: `src/app/admin/layout.tsx` renders `AdminSidebar` (a fixed left rail on `lg`, a top bar below it) and the pages render content only — no `SiteHeader`. The sidebar is a client component so it can highlight the active item with `usePathname`, which is why the sign-out form is built in the layout and passed down as a prop: a server action cannot be created inside a client component. `/admin` is matched exactly rather than by prefix, or it would stay highlighted on every child page; application detail pages (`/admin/SG-…`) deliberately count as part of the queue.

Capabilities are attached to the **role**, not to individual people, and live in `settings._id: "permissions"` behind the same 30-second cache as roles. `can(role, permission)` is the only way to ask: `admin` is always true and not configurable (otherwise an admin could remove their own ability to restore it), `customer` is always false, `employee` reads the stored toggles.

**`PERMISSION_DEFS` lists only capabilities that are actually enforced server-side.** A toggle for a feature that no code checks is worse than no toggle, because whoever switches it off will believe it took effect. Each one is enforced at the action, not just hidden in the UI:

| Permission | Enforced in |
|---|---|
| `viewDocuments` | `/api/documents/[id]` — the staff branch calls `can()` before reading anyone else's file |
| `changeStatus` | `changeStatusAction` via `requireStaff("changeStatus")` |
| `internalNotes` | `addNoteAction`, and again before writing the note attached to a status change |

Guard rails on role changes, all enforced in `changeRoleAction`/`toggleActiveAction`, not only in the UI:

- an admin cannot change or deactivate **their own** account — the one that actually fires in practice, since it is the easy way to lock yourself out;
- the last active admin cannot be demoted or deactivated;
- every role, activation and permission change writes to the `adminAudit` collection, which `/admin/users` renders.

`scripts/set-role.mjs` stays regardless — it is the only way back in if every admin is locked out.

**Pure-data modules exist because of the client bundle, not for tidiness.** `src/lib/auth/roles.ts` (role values and Thai labels) and `src/lib/auth/permission-defs.ts` (permission list) import nothing at all. `guard.ts` imports `@/auth` and `permissions.ts` imports `getDb`, so a client component importing either would drag the MongoDB driver into the browser and fail with `Can't resolve 'child_process'`. This has now happened twice; check the import chain of every `"use client"` file that touches auth.

## Notifications

In-app only. **Not email, not LINE** — the user's explicit decision. `notifyStaffOfNewApplication` and `notifyApplicantOfStatusChange` live in `src/lib/notifications/dispatch.ts`, which is the adapter seam: adding LINE later means adding a second `deliver` inside that file, not touching `applications.ts`.

- **One row per recipient, not one row per event.** "Read" is per-person; a shared row would mark a notification read for the whole team the moment one person opened it. A new application writes one document per active staff member, which is fine at a headcount in the tens.
- **Every dispatch call is wrapped in `try`/`catch` at the call site** in `submitApplication` and `changeStatus`. The application has already been written by that point. Letting a notification failure throw would show the staff member "เปลี่ยนสถานะไม่สำเร็จ" for a status that did change, and they would press it again.
- The collection has a **90-day TTL index**. Notifications are transient; the durable record is `activities`, which is never deleted.
- `markNotificationRead` puts `userId` in the filter, and both server actions in `src/components/notifications/actions.ts` read the user from the session and never accept a `userId` parameter — a server action can be invoked directly, so an id passed in from the client would let anyone mark anyone's notifications read.
- `countUnread` counts with `{ limit: 99 }`. The badge only ever renders "9+".
- The bell (`notification-bell.tsx`) polls every 60s and again on `visibilitychange`, marks read optimistically, and appears in **both** `SiteHeader` and `AdminTopbar`. `SiteHeader` fetches its own notifications rather than taking them as a prop, so the seven pages that use it cannot each forget to pass them.
- `timeAgo` lives in `src/lib/notifications/time-ago.ts` — a pure module with no imports — because it is used by the bell (client) and the dashboard card (server), and two copies would eventually word things differently.

## Roles and ownership

Roles live on the `users` document as a single `role` field: `customer` (ลูกค้า — the default for every new sign-in), `employee` (พนักงานร้าน), `admin` (แอดมิน). Thai labels live in `ROLE_LABELS` (`src/lib/auth/guard.ts`) and are the only place they are spelled out. Today roles are changed with `node scripts/set-role.mjs <email> <role>`; an admin-facing screen is planned (see **Back office**), which reverses an earlier "no role UI at all" decision and is why the guard rails listed there are not optional. Two consequences to respect:

- **Do not trust a role baked into the JWT at sign-in time.** If the role is only read from the token, a role edited in the database has no effect until that person signs out and back in, which is confusing and looks like a bug. Re-read the role from the database (with a short cache) so a direct DB edit takes effect promptly.
- The first `admin` is bootstrapped by signing in once with Google and then running `set-role.mjs`.
- These names replaced an earlier `user` / `sales` / `admin` set. `scripts/migrate-roles.mjs` did that rename in the database and is idempotent; a stored role outside the three valid values matches no rule and is denied everywhere, so any future rename needs the same migration or people silently lose access.

Every application carries `ownerUserId`. Authorization is enforced **server-side on every query**, never by hiding UI:

| Role | Scope |
|---|---|
| `customer` | Create, read, and edit **only their own** applications and documents |
| `employee` | Read applications assigned to them; change status; add notes |
| `admin` | Everything, plus assigning the owner of each application |

A rule the PRD does not state but the workflow requires: **an applicant may edit only while status is `New`.** Editing later would mean staff review one version of the data while the record holds another. See **Editing after submission** above for how it is enforced.

The two Google integrations are unrelated and should not share an OAuth client: sign-in reads the end user's basic profile, while Drive writes files as the company account via `GOOGLE_REFRESH_TOKEN`. Keep separate client credentials so their scopes and consent screens stay independent.

Because login now precedes the form, drafts are stored server-side keyed by `ownerUserId` (resumable across devices), and staged uploads in `_pending` are keyed the same way. Prefill name and email from the Google profile, and state on the sign-in screen *why* signing in is required — being able to return, track status, and update documents — since an unexplained login wall right after a QR scan costs conversions.
