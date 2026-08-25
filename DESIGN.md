---
version: 1
name: SG-Partner
description: A Thai-first partner-application system built on four colours — white ground, near-black structure, gold highlight, red action. Warm-tinted surfaces carry white cards lifted by wide faint shadows; red is rationed to buttons and active states so it never competes with itself, and gold flips role between light and dark grounds. Every value here is what ships in src/app/globals.css.

colors:
  brand: "#EF2027"
  brand-hover: "#D4161C"
  brand-ink: "#C8151B"
  brand-soft: "#FEF0F0"
  on-brand: "#FFFFFF"
  gold: "#FFD84D"
  gold-deep: "#D99000"
  gold-ink: "#8A6A00"
  gold-soft: "#FFF9E6"
  nav: "#0A0A0A"
  ink: "#16150F"
  ink-80: "#3B382F"
  ink-48: "#78736A"
  on-dark: "#FFFFFF"
  on-dark-muted: "#C9C5BB"
  canvas: "#FFFFFF"
  surface-tint: "#FDF6F6"
  pearl: "#FCFBF6"
  parchment: "#F7F6F1"
  hairline: "#E5E2D8"
  divider-soft: "#F1EFE7"
  danger: "#DC2626"
  danger-hover: "#B91C1C"
  danger-ink: "#B91C1C"
  on-danger: "#FFFFFF"
  accent: "#FFE169"
  accent-ink: "#8A6A00"
  on-accent: "#16150F"

typography:
  display:
    fontFamily: "IBM Plex Sans Thai, system-ui, sans-serif"
    fontSize: 52px
    fontWeight: 700
    lineHeight: 1.28
    letterSpacing: 0
  h2:
    fontFamily: "IBM Plex Sans Thai, system-ui, sans-serif"
    fontSize: 36px
    fontWeight: 700
    lineHeight: 1.32
    letterSpacing: 0
  h3:
    fontFamily: "IBM Plex Sans Thai, system-ui, sans-serif"
    fontSize: 24px
    fontWeight: 600
    lineHeight: 1.45
    letterSpacing: 0
  lead:
    fontFamily: "IBM Plex Sans Thai, system-ui, sans-serif"
    fontSize: 21px
    fontWeight: 400
    lineHeight: 1.62
    letterSpacing: 0
  body:
    fontFamily: "IBM Plex Sans Thai, system-ui, sans-serif"
    fontSize: 17px
    fontWeight: 400
    lineHeight: 1.62
    letterSpacing: 0
  body-strong:
    fontFamily: "IBM Plex Sans Thai, system-ui, sans-serif"
    fontSize: 17px
    fontWeight: 600
    lineHeight: 1.62
    letterSpacing: 0
  nav-link:
    fontFamily: "IBM Plex Sans Thai, system-ui, sans-serif"
    fontSize: 17px
    fontWeight: 500
    lineHeight: 1.62
    letterSpacing: 0
  caption:
    fontFamily: "IBM Plex Sans Thai, system-ui, sans-serif"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: 0
  fine:
    fontFamily: "IBM Plex Sans Thai, system-ui, sans-serif"
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: 0

rounded:
  input: 12px
  btn: 14px
  card: 24px
  phone: 44px
  sm: 8px
  md: 11px
  lg: 18px
  pill: 9999px
  full: 9999px

spacing:
  xxs: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  xxl: 48px
  section: 80px
  section-lg: 112px

components:
  nav-bar:
    backgroundColor: "{colors.nav}"
    textColor: "{colors.on-dark}"
    typography: "{typography.nav-link}"
    height: 80px
  button-brand:
    backgroundColor: "{colors.brand}"
    textColor: "{colors.on-brand}"
    typography: "{typography.body-strong}"
    rounded: "{rounded.btn}"
    padding: 0 28px
    height: 56px
  button-brand-hover:
    backgroundColor: "{colors.brand-hover}"
    textColor: "{colors.on-brand}"
    rounded: "{rounded.btn}"
  button-outline:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.body-strong}"
    rounded: "{rounded.btn}"
    padding: 0 28px
    height: 56px
  button-dark:
    backgroundColor: "{colors.nav}"
    textColor: "{colors.on-dark}"
    typography: "{typography.body-strong}"
    rounded: "{rounded.btn}"
    padding: 0 32px
    height: 56px
  button-nav-brand:
    backgroundColor: "{colors.brand}"
    textColor: "{colors.on-brand}"
    typography: "{typography.caption}"
    rounded: "{rounded.btn}"
    padding: 0 20px
    height: 46px
  button-nav-ghost:
    backgroundColor: transparent
    textColor: "{colors.on-dark}"
    typography: "{typography.caption}"
    rounded: "{rounded.btn}"
    padding: 0 20px
    height: 46px
  card-surface:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    padding: 24px
  card-dark:
    backgroundColor: "{colors.nav}"
    textColor: "{colors.on-dark}"
    rounded: "{rounded.card}"
    padding: 24px
  text-input:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.input}"
    padding: 0 16px
    height: 52px
  option-row:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.input}"
    padding: 10px 16px
    height: 56px
  chip-gold:
    backgroundColor: "{colors.gold}"
    textColor: "{colors.nav}"
    typography: "{typography.fine}"
    rounded: "{rounded.pill}"
    padding: 0 14px
  chip-dark:
    backgroundColor: "{colors.nav}"
    textColor: "{colors.on-dark}"
    typography: "{typography.fine}"
    rounded: "{rounded.pill}"
    padding: 0 14px
  chip-neutral:
    backgroundColor: "{colors.pearl}"
    textColor: "{colors.ink-80}"
    typography: "{typography.fine}"
    rounded: "{rounded.pill}"
    padding: 0 14px
  badge-brand-soft:
    backgroundColor: "{colors.brand-soft}"
    textColor: "{colors.brand-ink}"
    typography: "{typography.caption}"
    rounded: "{rounded.pill}"
    padding: 8px 16px
  step-marker-current:
    backgroundColor: "{colors.brand}"
    textColor: "{colors.on-brand}"
    typography: "{typography.fine}"
    rounded: "{rounded.full}"
    size: 36px
  step-marker-todo:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink-48}"
    typography: "{typography.fine}"
    rounded: "{rounded.full}"
    size: 36px
  footer:
    backgroundColor: "{colors.nav}"
    textColor: "{colors.on-dark-muted}"
    typography: "{typography.caption}"
    padding: 56px
---

## Overview

SG Partner is a Thai-language application system for mobile-phone retailers, entered by scanning a QR code in a shop. The design language was set by the landing page and then carried, unchanged, through every other surface: the application form, the applicant's status pages, the installment calculator, the sign-in screens, and the whole back office.

The system runs on **four colours used in deliberately unequal amounts**. White is the ground. Near-black `{colors.nav}` is structure — navigation, footer, type, and anything that means "settled" or "selected". Gold `{colors.gold}` is highlight. Red `{colors.brand}` is action. The ratio is the design: spread red and gold evenly and the result reads as a discount flyer, which is the single easiest way to wreck it.

Depth comes from two things only — a **warm-tinted ground** (`{colors.surface-tint}`, white mixed with 2% brand red) with **white cards floating on it**, and one family of wide, faint shadows. There are no decorative gradients, no glass, no borders used as decoration. A section changes meaning by changing its surface, not by drawing a line.

**Key characteristics:**
- Four colours, unequal amounts: white ground, black structure, gold highlight, red action.
- Warm tint under white cards — the tint is what makes a plain white card read as a separate plane.
- Rounded rectangles, not capsules: `{rounded.btn}` 14px for buttons, `{rounded.card}` 24px for cards, `{rounded.input}` 12px for fields.
- Wide faint shadows (`shadow-soft` → `shadow-lift` on hover) instead of borders for elevation.
- Thai-first typography: zero letter-spacing everywhere, line-height ≥ 1.6 for body.
- One motion idea per element: buttons and interactive cards lift 2px on hover; nothing else moves except the phone mockup's slow float.
- Red is never a section background, never a chip, and never a form field's focus ring.

## Colors

### Brand & Action
- **Brand Red** (`{colors.brand}` — #EF2027): every primary action. CTA buttons, the active nav item and its underline, filled radio dots and checkbox ticks, the form progress bar, step markers, required asterisks, icon chips that sit beside an action.
- **Brand Hover** (`{colors.brand-hover}` — #D4161C): the hover fill. Never used as a resting colour.
- **Brand Ink** (`{colors.brand-ink}` — #C8151B): red as **small** text or a thin glyph on a light surface. `{colors.brand}` on white measures ~3.6:1 — fine for large type, **fails for caption-sized text** — so anything at 14px or below that must read as red uses this instead. That is the entire reason there are two reds.
- **Brand Soft** (`{colors.brand-soft}` — #FEF0F0): tinted background for the hero badge and for soft red check chips. Also expressed as `bg-brand/10` where a translucent version is wanted over an unknown ground.

### Gold
- **Gold** (`{colors.gold}` — #FFD84D): **fills only** on light surfaces. Icon chips, status chips that mean "the ball is in your court", the draft card's ground. #FFD84D on white is ~1.5:1 — invisible as text, so gold never carries type on a light ground.
- **Gold Deep** (`{colors.gold-deep}` — #D99000): the gold end of the "SG" wordmark gradient in the H1. Chosen because it clears 3:1 on white, so both ends of the gradient are legible.
- **Gold Ink** (`{colors.gold-ink}` — #8A6A00): gold as small text on a light surface — the back office's "overdue" and "documents incomplete" flags.
- **Gold Soft** (`{colors.gold-soft}` — #FFF9E6): tinted ground for the resumable-draft card and for staff messages to the applicant.

**Gold flips role between grounds.** On white it can only be a fill. On `{colors.nav}` it measures ~13:1 and becomes the best text and icon colour in the system — which is why the dark data-scope section, the calculator's result table, and the locked-rules panel all use gold type on black.

### Surface
- **Canvas** (`{colors.canvas}` — #FFFFFF): cards, inputs, and the sections that alternate against tint.
- **Surface Tint** (`{colors.surface-tint}` — ≈#FDF6F6): white with 2% brand red mixed in, applied through the `.surface-tint` class. This is the page ground for `/apply`, `/me`, `/login`, `/partner/calculator`, and all of `/admin`, and it alternates with canvas down the landing page. **Its only job is to make white cards visible**; without it, a white card on white is just a shadow.
- **Pearl** (`{colors.pearl}` — #FCFBF6) and **Parchment** (`{colors.parchment}` — #F7F6F1): inset grounds *inside* a white card — note boxes, read-only fields, summary blocks.
- **Nav Black** (`{colors.nav}` — #0A0A0A): the navigation bar, the footer, dark sections, selected state on large cards, and the "confirm" button in the back office.

### Text
- **Ink** (`{colors.ink}` — #16150F): headings and body on light surfaces. Warm near-black, not pure black.
- **Ink 80** (`{colors.ink-80}` — #3B382F): secondary body copy.
- **Ink 48** (`{colors.ink-48}` — #78736A): captions, metadata, placeholder text, and non-competing icons.
- **On Dark** (#FFFFFF) and **On Dark Muted** (`{colors.on-dark-muted}` — #C9C5BB): type on `{colors.nav}`. On dark grounds secondary text is expressed as `text-white/55` … `text-white/70` rather than a fixed token.

### Danger
`{colors.danger}` (#DC2626) means **error, rejection, or a destructive action** — never "look here". It is a different meaning that happens to share a hue with `{colors.brand}`, and keeping the two apart drives several rules below.

### Hairlines
`{colors.hairline}` (#E5E2D8) is the 1px ring on cards and fields, usually at 70% (`ring-hairline/70`) so it reads as a softening edge rather than a drawn border. On dark grounds it becomes `border-white/[0.08]`.

### Gradients
**Two, both deliberate, both structural.** The "SG" wordmark in the hero H1 is `{colors.gold-deep}` → `{colors.brand}`, used because a flat gold wordmark is unreadable. The phone mockup's outer bezel is a three-stop dark gradient simulating light on metal. **No decorative background gradients exist**; atmosphere on the landing page comes from large, heavily blurred colour blooms at low opacity, which is a different thing.

## Typography

### Font Family
**IBM Plex Sans Thai**, weights 400 / 500 / 600 / 700, loaded through `next/font` in `src/app/layout.tsx`. The Latin stack in front of it (`-apple-system`, `SF Pro`, `Segoe UI`) handles Latin and numerals; Thai falls through to Plex.

**The `next/font` variable class must sit on `<html>`, not `<body>`** — `:root` in `globals.css` references `--font-plex-thai`, and with the class on `<body>` that declaration is invalid at computed-value time and the entire stack silently falls back to the browser default.

### Hierarchy

| Token | Size | Weight | Line height | Use |
|---|---|---|---|---|
| `{typography.display}` | 52px | 700 | 1.28 | Landing hero H1 only |
| `{typography.h2}` | 36px | 700 | 1.32 | Section headings, page H1s |
| `{typography.h3}` | 24px | 600 | 1.45 | Card headings, dialog titles, the logo wordmark |
| `{typography.lead}` | 21px | 400 | 1.62 | The paragraph directly under a heading; large numbers in tables |
| `{typography.body}` | 17px | 400 | 1.62 | Default paragraph, form labels' values, list items |
| `{typography.body-strong}` | 17px | 600 | 1.62 | Button labels, card titles, inline emphasis |
| `{typography.nav-link}` | 17px | 500 | 1.62 | Navigation links only |
| `{typography.caption}` | 14px | 400 | 1.6 | Field labels, secondary copy, metadata |
| `{typography.fine}` | 12px | 400 | 1.55 | Legal notes, chips, timestamps, helper text |

### Principles

- **Letter-spacing is 0 everywhere.** Thai stacks vowels above and tone marks below the baseline; negative tracking collides them. Tight tracking belongs to Latin-only systems and must not be reintroduced here, including on display sizes.
- **Line-height never drops below 1.6 for body-sized text**, for the same reason. Display sizes may go to 1.28–1.45 because the glyphs are large enough to survive it. Long prose inside cards is pushed further to `leading-[1.7]`.
- **Weight 500 exists and is reserved for navigation links.** On the black bar, 400 looks washed out and 600 competes with the red CTA beside it. Do not use 500 for body copy.
- **Headings are 700 at display and h2 sizes, 600 at h3.** There is no 800.
- **Numbers that can change get `tabular-nums`** — money, counts, step numbers, phone numbers, application IDs. Without it, digits jitter as values update.
- Body copy is 17px, not 16px.

## Layout

### Spacing System
Base unit 4px; structural rhythm snaps to 8 / 12 / 16 / 24 / 32 / 48. Section blocks are `{spacing.section}` (80px) on narrow screens and `{spacing.section-lg}` (112px) from `lg` up. Card padding is 24px, rising to 28px at `sm` on larger cards.

### Containers
| Width | Used by |
|---|---|
| 1280px | Navigation bar, landing sections, the hero — the master alignment |
| 1180px | Back-office pages |
| 1080px | Installment calculator |
| 1040px | `/me` list and application detail |
| 860px | The application form and its edit mode |
| 640px / 560px | Success and single-message screens |
| 27rem | Sign-in dialog and `/login` card |

The form is narrow on purpose: a single column of fields does not want a wide measure. **Every `<main>` needs an explicit `max-w-`** — four admin pages once shipped with the value silently missing from the class string and stretched edge-to-edge on wide monitors.

### Whitespace
The heading of a section always has more space above it than below it. A card's title sits 20–24px from its first content row. Interactive cards in a list are separated by 12–16px, which is close enough to read as one list and far enough that the shadows do not merge.

## Elevation & Depth

| Level | Treatment | Use |
|---|---|---|
| Flat | No shadow, no ring | Full-bleed sections, nav, footer |
| Hairline | `ring-1 ring-hairline/70` | Inset boxes inside a card, fields |
| Soft | `0 20px 60px rgb(10 10 10 / 0.08)` | Every floating card |
| Lift | `0 24px 70px rgb(10 10 10 / 0.14)` | Hover state of an interactive card or button |
| Device | `0 44px 96px -28px rgb(10 10 10 / 0.32)` | The phone mockup only |
| Product | `drop-shadow(3px 5px 30px rgb(0 0 0 / 0.22))` | Legacy `.product-shadow`, product imagery only |

Shadows are **wide, far-offset and very faint** — they read as "this is floating" rather than "this has a dark edge". A tight or dark shadow is wrong here even if the blur is large.

### Decorative depth
The hero backdrop uses three heavily blurred colour blooms (gold behind the phone, red at the bottom-left corner, a smaller denser red inside it), a low-opacity dot grid at the left edge, and two 1.5px curved lines sweeping bottom-left to top-right. Everything is `aria-hidden` and `pointer-events-none`, and every piece sits under 30% opacity. The target is "detailed up close, clean at a glance".

## Shapes

### Border radius

| Token | Value | Use |
|---|---|---|
| `{rounded.input}` | 12px | Text fields, selects, option rows, inset note boxes, small icon tiles |
| `{rounded.btn}` | 14px | Every button, and quick-pick chips |
| `{rounded.card}` | 24px | Cards, dialogs, dark panels, the map frame |
| `{rounded.phone}` | 44px | Phone mockup bezel only |
| `{rounded.pill}` | 9999px | Status chips, avatars, step markers, icon circles |
| `{rounded.sm}` / `{rounded.md}` / `{rounded.lg}` | 8 / 11 / 18px | Legacy scale; do not use for new landing-language UI |

Buttons are **rounded rectangles, not capsules**. The pill radius is reserved for things that are already circular or chip-shaped — mixing the two grammars is what makes an interface look assembled rather than designed.

## Components

### Navigation
**`nav-bar`** — 80px tall, `{colors.nav}` ground, 1px `white/8` bottom border, 1280px container. Left: the SG logo mark plus the "SG partner" lockup (`BrandLogo`). Centre: section links in `{typography.nav-link}`, the current one in `{colors.brand}` with a 2px red underline; others grow the same underline from the left on hover over 300ms. Right: a ghost outline button and a solid `{colors.brand}` button. The full link row appears at `xl` (1280px) — below that a hamburger opens a full-width panel, because the link row plus the signed-in cluster measurably overflows the container at `lg`.

### Buttons
- **`button-brand`** — the primary action. `{colors.brand}` fill, white label at `{typography.body-strong}`, `{rounded.btn}`, 56px tall, `shadow-soft`. Hover lifts 2px to `shadow-lift` and darkens to `{colors.brand-hover}`.
- **`button-outline`** — the secondary. White fill, `{colors.ink}` label, hairline ring, same size and same lift.
- **`button-dark`** — `{colors.nav}` fill. The confirm action inside the back office, and any place a primary action must **not** be red (see the danger rule below).
- **`button-nav-brand` / `button-nav-ghost`** — 46px versions for the navigation bar. Their focus ring is white, because both the gold and the red focus colours disappear against black.
- Every button carries `whitespace-nowrap`: a wrapped Thai label makes a fixed-height button overflow its bar.

### Cards
**`card-surface`** — white, `{rounded.card}`, `shadow-soft`, `ring-1 ring-hairline/70`, floating on `{colors.surface-tint}`. If the card is a link or otherwise clickable it also lifts 2px on hover; **if it is not clickable it must not move**, because a hover lift is an affordance and promising one that does not exist is worse than a flat card.

**`card-dark`** — `{colors.nav}`, used where content should be read rather than skimmed: the data-scope promise on the landing page, the contact block on an application, the calculator's results, the locked-rules panel. Gold carries type inside it.

### Forms
**`text-input`** — white, `{rounded.input}`, hairline ring, 52px tall.

Focus and selection are **ink**, not brand red, and this is load-bearing:

| State | Treatment |
|---|---|
| Focused field | 2px **ink** ring |
| Selected radio / checkbox / option row | 2px **ink** ring + pearl fill, with the dot or tick filled `{colors.brand}` |
| Error | 2px **danger** ring + `bg-danger/[0.04]` + a `CircleAlert` icon beside the message |

`{colors.brand}` and `{colors.danger}` are near-indistinguishable, so if focus or selection were red, a field being edited would look identical to a field that is wrong. **A red ring anywhere in a form means the value is wrong.** Red survives inside the control as the filled dot or tick, and outside it on the progress bar, the step markers, the required asterisk, and the buttons — shapes that can never be mistaken for a field outline.

Also: `focus:outline-none` alone is not enough. Chrome treats text inputs as `:focus-visible` even on mouse click, so the global focus outline draws a second ring outside the one the field paints itself. Every field needs `focus-visible:outline-none` as well, and the global rule must live inside `@layer base` (see Do's and Don'ts).

### Steppers
`FormStepper` (the seven-step application form) and the five-stage status track on `/me/[id]` share one visual language: 32–36px circles joined by 2px connectors, red for completed and current, hairline for upcoming, a check mark replacing the number once a step is done, and a `ring-4 ring-brand/15` halo on the current one. Labels appear only at `lg`; below that the circles stand alone and the page `h1` names the current step. The difference between them is behavioural — completed steps in the form are buttons that jump back, while the status track is never clickable because it reports where something *is* rather than a path the reader walks.

### Status chips
Colour carries the meaning: **gold** = the ball is in the reader's court; **black** = settled and good; **danger red** = rejected; **pearl/grey** = in progress, nothing to do. Brand red never appears on a chip — a chip is not something you press. Text on a gold chip must be near-black.

### Footer
`{colors.nav}` ground with a 1px `white/8` top border, the logo lockup, contact rows with gold icons, and legal links. Black at the top of the page and black at the bottom bookends the whole site.

## Do's and Don'ts

### Do
- Put white cards on `{colors.surface-tint}`; that contrast is what the whole layout depends on.
- Use `{colors.brand}` for the one thing you most want pressed on a screen, and let everything else be black, grey, or gold.
- Use gold as a **fill** on light grounds and as **type** on dark ones.
- Give small red text `{colors.brand-ink}` and small gold text `{colors.gold-ink}`.
- Use `{rounded.btn}` 14px for buttons, `{rounded.card}` 24px for cards, `{rounded.input}` 12px for fields.
- Lift interactive cards and buttons 2px on hover, with `motion-reduce:hover:translate-y-0`.
- Set `tabular-nums` on any number that changes.
- Give every `<main>` an explicit `max-w-`.

### Don't
- Don't use red as a section background, a status chip, or a form field's focus/selected ring.
- Don't make an ordinary confirm button red in the back office — red there is reserved for the irreversible branch (rejecting an application, revoking access), and that warning only works if the two look different.
- Don't set type in `{colors.gold}` on a light surface, or white type on a gold fill. Both measure ~1.5:1.
- Don't tint the Google sign-in button. White fill, dark label, four-colour "G" — anything else makes people hesitate about where it leads.
- Don't apply negative letter-spacing, ever.
- Don't drop body line-height below 1.6.
- Don't add hover motion to something that is not clickable.
- Don't draw a rule or border between sections; change the surface instead.
- Don't add decorative gradients or glass.
- Don't put an eyebrow/kicker label above a heading — fold the words into the heading or delete them.
- Don't mix the pill and rounded-rectangle button grammars on one screen.

## Responsive Behavior

### Breakpoints
Tailwind defaults: `sm` 640, `md` 768, `lg` 1024, `xl` 1280, `2xl` 1536.

| Width | Behaviour |
|---|---|
| < 640 | Everything single column. Buttons go full width. Grids collapse to one. The mobile CTA bar pins to the bottom. |
| 640–1023 | Two-column grids appear. Navigation still collapsed to the hamburger. |
| 1024–1279 | Hero and calculator go two-column. The nav link row is **still** hidden — it does not fit beside the signed-in cluster until 1280. |
| ≥ 1280 | Full navigation. Containers cap; margins absorb the rest. |

### Touch targets
Minimum 44px, and 52–56px for anything used on a phone in a shop — form fields, primary buttons, option rows. Icon-only buttons are 44px square even when the glyph is 16px.

### Collapsing
The application form's stepper drops its labels below `lg` and keeps the circles. The calculator's two columns stack with inputs above results. Back-office rows keep one card per row at every width rather than becoming a table. The hero's phone mockup moves to the end of the DOM order on mobile (`order-last`), so the headline, benefits, and CTA come first.

## Iteration Guide

1. Work on one component at a time and reference its YAML key (`{component.button-brand}`, `{component.card-dark}`).
2. Use `{token.refs}` — never inline a hex value that already exists as a token.
3. All values here mirror `src/app/globals.css`. Change the CSS and this file together, or the design detector will start reporting drift that is not real.
4. Document default and selected/pressed states. Hover is described in prose, not as separate tokens.
5. When something needs emphasis, try surface change → weight → size → colour, in that order. Reaching for red first is what breaks the ratio.

## Known Gaps

- **Dark mode exists in tokens but is not designed.** `globals.css` carries a full `prefers-color-scheme: dark` palette and every surface uses tokens, so the app renders in dark mode without breaking — but no screen has been reviewed there and the tinted-ground-plus-white-card idea does not have a worked-out dark equivalent.
- **Wide-screen layouts are under-verified.** The two-column calculator and the fixed back-office sidebar were built to spec but reviewed mainly at narrow widths.
- The phone mockup's internal colours (`#0a0a0c`, `#131317`, `#3d3d44`) and its 9.5–15px type sit outside the palette and the type ramp on purpose — it is a picture of a device at reduced scale, not page UI. The detector flags them; that is expected.
- `{colors.accent}` / `{colors.accent-ink}` (the superseded yellow `#FFE169` system) still exist as tokens and are referenced by one focus-ring utility in the admin sidebar. No page composes with them any more; they are kept only so removing them can be a separate, verified change.
- Empty, loading, and error states are specified for the surfaces that have them (queue, calculator, document upload, form validation) but there is no general skeleton or spinner pattern.
