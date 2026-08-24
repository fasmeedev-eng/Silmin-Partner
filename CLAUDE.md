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

`DESIGN.md` (562 lines) is the project's design system: an Apple-style language with YAML tokens at the top and prose guidance below. Read it before building any UI. The rules that are easy to violate accidentally:

- Exactly one accent hue, plus one semantic danger hue. **The brand palette is white / `#FFE169` / black / `--danger` red — Action Blue `#0066cc` from `DESIGN.md` is superseded and must not reappear.** Red is not a second accent: it is reserved for error/rejection/destructive meaning only (see `--danger` family below), never used to draw attention the way yellow is. See **The yellow rule** below, which is the part that is easy to get wrong.
- Body copy is 17px / weight 400 / line-height 1.47. Weight 500 does not exist in the ladder (300 / 400 / 600 / 700).
- Headlines are weight 600 with negative letter-spacing.
- Exactly one drop-shadow in the whole system, and it is only for product photography — never cards, buttons, or text. Elevation comes from surface-color change instead.
- No decorative gradients. Radii come from the scale only (`sm` 8 / `md` 11 / `lg` 18 / pill).
- Touch targets ≥ 44px — the application form is used on phones in shops.
- One deliberate exception to the single-accent rule: the official four-color Google "G" in `src/components/auth/google-mark.tsx`. It is a trademark users must recognise, not UI color.

`src/app/globals.css` now implements the system: `DESIGN.md` colors are declared as CSS variables on `:root` (with `prefers-color-scheme` and `[data-theme]` overrides for the dark palette), and `@theme inline` maps them onto Tailwind utilities — `bg-parchment`, `text-ink-48`, `text-body`, `rounded-lg`, and so on. The single permitted drop-shadow lives in one class, `.product-shadow`.

#### The yellow rule

`#FFE169` is a very light yellow: against white it measures about **1.3:1**, so it is invisible as text, as an icon stroke, or as a hairline on any light surface. It is not a drop-in replacement for the blue it succeeded. The palette therefore splits the one hue into two tokens by role:

| Token | Value (light) | Use |
|---|---|---|
| `--accent` | `#FFE169` | **Fills only** on light surfaces — button backgrounds, icon chips. On dark surfaces it is also the text/icon color. |
| `--accent-ink` | `#8A6A00` | Text, icons, and thin marks that need to read as "accent" on a light surface (5.1:1 on white). Becomes `#FFE169` in dark theme. |
| `--on-accent` | `#16150F` | Text sitting on an `--accent` fill. |
| `--accent-hover` | `#FFD633` | Hover state of an `--accent` fill. Do not use `--accent-focus` for this — it is the dark amber focus ring. |

So: **yellow is a surface on white, and an ink on black.** Anything yellow on a light background must be a filled shape big enough to read as one. A yellow check mark, underline, or 2px rule on white is a bug, not a style choice.

The consequence for layout is that light sections carry almost no yellow — it appears at the buttons and the icon chips, and everything else is structure. The yellow gets its full voice on the black tiles (`tone="tile"`), which is why the closing CTA is a black section: it makes the last button on the page the highest-contrast element on it.

One deliberate exception to the single-hue rule is the four-color Google mark, noted above.

#### The danger token

`--danger` (`#dc2626`, red-600) is the fourth color, added deliberately by the user and scoped narrowly: it means "error, rejection, or a destructive action," never "look here." Unlike `#FFE169`, red-600 has enough contrast on white (~4.8:1) to serve as text directly, so it doesn't need the same fill/ink split — `--danger-ink` exists only so it can brighten to `#F87171` (red-400) on dark surfaces, where `#DC2626` alone reads too dark. `--on-danger` is white text sitting on a `--danger` fill. Current usage: field-level validation errors (`Field`/`CheckboxCard` in `form-fields.tsx`, and the matching inline errors in `steps.tsx`/`documents-step.tsx`), the Rejected status chip (`statusChipClass` in `status.ts`), the Rejected transition option/confirm buttons in `StaffPanel`, the document-delete hover state, and top-level error banners (`role="alert"` banners for a failed submit/action). It is deliberately **not** applied to the "needs action"/"overdue" yellow highlights in the back-office queue (those stay `--accent-ink` by design — see **Back office**) or to any success/confirmation banner (those keep `CircleCheck` + `--accent-ink`), since neither of those is actually an error.

Two Tailwind-v4 traps that already cost a debugging round:

- **`@theme inline` does not emit the custom property.** It inlines the value into generated utilities, so `var(--font-sans)` inside a hand-written CSS rule resolves to nothing and the rule silently dies. Declare the real value on `:root` under a separate name (`--font-stack-sans`) and have `@theme inline` point at *that*.
- **The `next/font` variable class belongs on `<html>`, not `<body>`.** `:root` references `--font-plex-thai`; with the class on `<body>` the `:root` declaration is invalid at computed-value time, and the whole font stack falls back to the browser default without any error.

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

The product ships in Thai, and `DESIGN.md` was derived from an English, SF Pro–based system — its display rules do not transfer directly:

- SF Pro and Inter have no Thai coverage. Use **IBM Plex Sans Thai** or **Noto Sans Thai** (weights 400/600) for Thai text; keep the `DESIGN.md` stack for Latin and numerals.
- **Do not apply negative letter-spacing to Thai.** Use `0`. The tight tracking in `DESIGN.md` is Latin-only.
- Thai stacks vowels above and tone marks below the baseline, so line-height must be **≥ 1.6** — the 1.07–1.47 values in `DESIGN.md` collide glyphs and read as low quality.

Everything else in `DESIGN.md` (single accent, spacing rhythm, one shadow, no gradients) applies unchanged. Credibility on the public form comes as much from structure as from styling: visible step progress, an explanation of why each block of data is asked for, an explicit note that no bank details are requested in phase 1, a readable review step, and error messages that say how to fix the problem.

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

**Never import from `@/lib/drive/folders` (or anything else that reaches MongoDB or Drive) inside a client component.** It pulls the MongoDB driver into the browser bundle, and the error you get is `Module not found: Can't resolve 'child_process'` from a file named `mongocryptd_manager.js`, which points nowhere near the real cause. Shared constants live in `src/lib/application/categories.ts`, which imports nothing at all; `folders.ts` re-exports them for server code.

`node scripts/dev-session.mjs <email>` mints a local session cookie for a user that has already signed in once, so authenticated pages can be exercised without walking the Google flow. Local development only.

## Back office

`/admin` is the staff queue. **There is no assignment** — every `employee` and `admin` sees every application. The difference between the two roles is what they may *do*, never what they may *see*, so no query under `/admin` filters by who is looking; the `salesOwnerId` field from the original schema sketch was dropped.

`listAllApplications` takes status, province, ครบ/ไม่ครบ, a free-text term, sort and page. Two details that matter:

- The ครบ/ไม่ครบ filter is built from `REQUIRED_CATEGORIES`, not hard-coded, so it cannot drift from what the form enforces.
- Free text searches applicationId, shop name, contact name, and — separately — the phone with non-digits stripped, because the database stores `0812345678` while people type `081-234-5678`. The term is regex-escaped first.

**The back office is designed for staff who are not comfortable with computers.** That constraint drives most of its layout decisions, and undoing them to "clean up the UI" would undo the point:

- The queue leads with a sentence, not a table header: *"มี 3 ใบรอคุณตรวจ"*. The first thing on screen answers what to do, not what exists.
- The seven statuses collapse into **three work buckets** (`WORK_BUCKETS` in `status.ts`) shown as large count cards. Seven chips force the reader to translate each one; three buckets answer "which pile is today's work" at a glance. Individual statuses still show on each row.
- Rows lead with the **shop name**, not the Application ID. People remember shops; nobody remembers `SG-2026-000004`.
- Age is written out (*"รอมา 5 วัน"*) rather than left as a date to subtract from today, and turns yellow past three days on a `New` application.
- The list is one card per row rather than a spreadsheet grid — a table reads as data to study, a list reads as work to do.
- Only the search box is visible by default; province, document and sort filters sit inside a collapsed `<details>`, because they are used rarely and every visible control costs attention daily.
- On the detail page, **the action comes before the data**: contact card, then "ขั้นตอนถัดไป", then documents, then the submitted fields in collapsed blocks. The job is calling the shop and deciding, not reading a record top to bottom.
- Each status option is a full-width card carrying a plain-language sentence about what choosing it *does*, not a chip with the status name.
- Status changes and role changes both go through a **confirmation dialog that repeats the outcome** — which shop, which new status, and the exact message the applicant will see. Users who are afraid of clicking the wrong thing need to see the consequence before committing, and it is the cheapest defence against a mis-click that emails a shop.

The default sort is "รอนานที่สุดก่อน" for the same reason — an application nobody opened for a week is a shop that has already given up.

`src/lib/application/transitions.ts` holds `ALLOWED_TRANSITIONS`: staff cannot skip stages, `ActivePartner` and `Rejected` are terminal, and `Rejected` is reachable from almost anywhere because the company can walk away at any point. `requiresMessage()` marks `NeedMoreInfo` and `Rejected` as needing a message to the applicant — both statuses are useless if the shop is not told what to fix or why it failed.

**Internal notes and messages to the applicant are two different things, not one.** The PRD has a single หมายเหตุ column, but merging them means an internal note eventually surfaces on the applicant's page. They are kept apart by `Activity.visibility`: `internal` notes are staff-only, everything else is applicant-visible, and a missing value counts as applicant-visible so activities written before the field existed still render. **`listActivities` defaults to excluding internal entries** — the safe direction, so a future caller from an applicant page cannot leak notes by forgetting a flag. `/admin` is the only caller that passes `includeInternal: true`.

The message to the applicant is stored as `statusMessage` on the application itself, not only inside the activity, so `/me/[applicationId]` can show the current instruction prominently instead of making the shop dig through a timeline.

`/admin/[applicationId]` shows the whole application, the consent evidence, the documents, and a `StaffPanel` that offers **only the transitions `ALLOWED_TRANSITIONS` permits from the current status** — the UI never lets someone pick a move that will then be rejected. `changeStatus` still re-checks the rule and puts the current status in the `updateOne` filter, so two staff opening the same application cannot overwrite each other's decision without noticing.

Server actions in `src/app/admin/actions.ts` call `guardRole` themselves. The layout guard is not enough: a server action can be invoked directly without ever loading the page it belongs to.

**Document access.** `/api/documents/[id]` now has two paths. Owners read their own files with no log entry — looking at your own document is not an event. Staff (`admin`/`employee`) read any file, and **every staff read is written to the `documentAccess` collection** with who, which file, which application, and when. It is a separate collection from `activities` on purpose: this is a security trail, not part of the application's story, and its volume is different by an order of magnitude. Reads are de-duplicated per staff+file for 10 minutes, because one glance at a photo hits the proxy several times and an un-throttled log buries the entries that matter.

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
