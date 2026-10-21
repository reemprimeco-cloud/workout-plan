---
name: Prime Fit
description: Arabic-first training, nutrition and coaching, in the calm of a Gulf clinic.
colors:
  deep-harbour-navy: "#1B2E5E"
  harbour-navy-light: "#2A4A8C"
  shallow-water-blue: "#7BB8D4"
  tide-light: "#A8D4E8"
  open-water-blue: "#5BA3C4"
  sea-mist: "#F0F4F8"
  surface-white: "#FFFFFF"
  harbour-mid: "#3D5A80"
  harbour-haze: "#7A9BB5"
  tide-line: "#D0DFF0"
  signal-success: "#22C55E"
  signal-warning: "#F59E0B"
  signal-danger: "#EF4444"
typography:
  display:
    fontFamily: "Inter, Tajawal, sans-serif"
    fontSize: "20px"
    fontWeight: 800
    lineHeight: 1.2
  headline:
    fontFamily: "Inter, Tajawal, sans-serif"
    fontSize: "17px"
    fontWeight: 700
    lineHeight: 1.3
  title:
    fontFamily: "Inter, Tajawal, sans-serif"
    fontSize: "15px"
    fontWeight: 600
    lineHeight: 1.4
  body:
    fontFamily: "Tajawal, Inter, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Inter, Tajawal, sans-serif"
    fontSize: "12px"
    fontWeight: 600
    lineHeight: 1.4
rounded:
  sm: "8px"
  md: "10px"
  lg: "12px"
  xl: "16px"
  pill: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  xxl: "28px"
components:
  button-primary:
    backgroundColor: "{colors.deep-harbour-navy}"
    textColor: "{colors.surface-white}"
    rounded: "{rounded.lg}"
    padding: "13px 16px"
    typography: "{typography.title}"
  button-success:
    backgroundColor: "{colors.signal-success}"
    textColor: "{colors.surface-white}"
    rounded: "{rounded.lg}"
    padding: "13px 16px"
  card:
    backgroundColor: "{colors.surface-white}"
    textColor: "{colors.deep-harbour-navy}"
    rounded: "{rounded.xl}"
    padding: "20px"
  badge:
    backgroundColor: "#E8F0FF"
    textColor: "{colors.deep-harbour-navy}"
    rounded: "{rounded.pill}"
    padding: "4px 12px"
    typography: "{typography.label}"
  input:
    backgroundColor: "{colors.surface-white}"
    textColor: "{colors.deep-harbour-navy}"
    rounded: "{rounded.md}"
    padding: "11px 12px"
  input-focus:
    backgroundColor: "{colors.surface-white}"
    textColor: "{colors.deep-harbour-navy}"
    rounded: "{rounded.md}"
  tab-active:
    backgroundColor: "{colors.deep-harbour-navy}"
    textColor: "{colors.surface-white}"
    rounded: "{rounded.md}"
    padding: "10px 24px"
  tab-rest:
    backgroundColor: "{colors.surface-white}"
    textColor: "{colors.harbour-mid}"
    rounded: "{rounded.md}"
    padding: "10px 24px"
---

# Design System: Prime Fit

## Overview

**Creative North Star: "The Gulf Clinic"**

Prime Fit looks like a well-run clinic with a view of the water. It is composed
and precise, because it asks people to upload blood tests and trusts them with
guidance in return — but it is lit by Gulf daylight, not fluorescent tube. The
whole palette is cool blues on a bright, slightly cool paper: deep navy for
authority, sky and tide blues for everything the user can act on, and a pale
sea-mist ground that keeps the interface feeling open rather than clinical.

Depth is atmosphere, not architecture. Surfaces float on soft, navy-tinted
shadows the way paper sits on a desk in daylight — a shadow here means "this is
a thing you can pick up," never "this ranks above that." Components are soft,
calm and unhurried: generously rounded, nothing sharp, nothing shouting.
Someone opens this between sets, one-handed, half-paying-attention, and nothing
in the interface should raise their heart rate further.

Arabic is not a mode in this system — it is the ground state. `direction: rtl`
is set on the `html` element itself, and English is the override. That single
fact drives more layout decisions than any grid: every new surface is laid out
in logical properties and read right-to-left first.

The one thing this system must never become is the other end of its own
metaphor: a cold medical records screen. Grey-on-grey, borderless density, no
daylight. The clinic half supplies precision; the Gulf half supplies the reason
anyone would want to open it.

**Key Characteristics:**
- Cool-blue spectrum only; warmth appears exclusively as semantic signal
- RTL-first layout, with Inter and Tajawal both present in every font stack
- Soft ambient shadows, navy-tinted, 2px hover lift
- 16px cards, full-pill badges, nothing with a sharp corner
- Calm density — generous padding, no compressed tables

## Colors

A single cool spectrum running from deep navy through sky to pale mist, with
warmth admitted only when the interface needs to signal state.

### Primary
- **Deep Harbour Navy** (`#1B2E5E`): The system's authority colour. Body text,
  headings, primary button fills, active tab fills, table headers. It is also
  the text colour, which is why the interface reads as navy-on-paper rather
  than black-on-white.
- **Harbour Navy Light** (`#2A4A8C`): The second stop of the table-header
  gradient and the only lighter navy in use. Not a hover state.

### Secondary
- **Shallow Water Blue** (`#7BB8D4`): Everything the user can act on or is being
  drawn toward — section-header underlines, progress-fill gradient start,
  day-card hover borders, scrollbar thumb, pull-to-refresh spinner.
- **Tide Light** (`#A8D4E8`): The softest actionable blue, used for large tinted
  fills where Shallow Water would be too saturated.
- **Open Water Blue** (`#5BA3C4`): Sits between sky and navy. Used sparingly for
  accent text on tinted badges.

### Neutral
- **Sea Mist** (`#F0F4F8`): The page ground. Never white — the cool tint is what
  makes white cards read as objects sitting on a surface.
- **Surface White** (`#FFFFFF`): Card and panel fills only.
- **Harbour Mid** (`#3D5A80`): Secondary text and resting tab labels.
- **Harbour Haze** (`#7A9BB5`): Tertiary text, placeholders, muted metadata.
- **Tide Line** (`#D0DFF0`): Borders, dividers, progress-bar troughs.

### Signal
- **Signal Success** (`#22C55E`) · **Signal Warning** (`#F59E0B`) ·
  **Signal Danger** (`#EF4444`): State only — confirmation, caution, error and
  the free-trial CTA. These are the only non-blue hues the system admits.

### Named Rules

**The Cool Spectrum Rule.** Every structural colour is a cool blue between
Deep Harbour Navy and Sea Mist. Warmth enters only as a semantic signal. A warm
decorative accent — a gold border, an orange heading, a red that isn't an error
— is outside the system.

**The Navy Text Rule.** Body text is Deep Harbour Navy, not black and not grey.
Pure black on Sea Mist reads as a foreign element pasted into the page.

## Typography

**Display Font:** Inter (fallback Tajawal, then sans-serif)
**Body Font:** Tajawal (fallback Inter, then sans-serif)

**Character:** Inter brings the clinic — neutral, legible, authoritative at
heavy weights. Tajawal brings the Arabic, with genuine Arabic letterforms rather
than a Latin face stretched to cope. Together they read as competent and calm,
and critically, neither script ever falls back to a system default.

### Hierarchy
- **Display** (800, 20px, 1.2): Page and major section titles.
- **Headline** (700, 17px, 1.3): Card titles and sub-section heads. All `h1`–`h6`
  are Inter 700 by default.
- **Title** (600, 15px, 1.4): Tab labels, button text, emphasised rows.
- **Body** (400, 14px, 1.6): Running text, table cells, descriptions.
- **Label** (600, 12px, 1.4): Badges, captions, metadata. Error text drops to
  11px at the same weight.

### Named Rules

**The Two-Script Rule.** Every font stack lists both Inter and Tajawal, in the
order appropriate to its role. A mixed Arabic/English string — which in this
product is most strings — must never fall through to a system default mid-
sentence.

**The Heavy-Head Rule.** Hierarchy is carried by weight, not size. The jump from
body to display is 14px to 20px but 400 to 800. Reaching for a larger size
before a heavier weight produces the wrong system.

## Layout

The page ground is Sea Mist; content sits on Surface White cards with 16px
radius and 20px internal padding. Rhythm runs on a 4px base — 4, 8, 12, 16, 20,
28 — with 12px the default gap between related elements and 20–28px between
sections.

Direction is RTL at the root. Layout uses logical properties
(`marginInlineStart`, `paddingInline`) so a single tree serves both languages;
where a physical side is genuinely needed, it is selected from the language
state rather than hard-coded.

The only declared breakpoint is **768px**, where exercise imagery drops from
200px to 160px tall and table padding tightens. Everything above that is fluid.

Mobile is a first-class target rather than a fallback: safe-area insets are
exposed as `--safe-top`/`--safe-bottom`/`--safe-left`/`--safe-right`, viewport
height uses `100dvh`, and a 44px minimum touch target is available as a utility.

### Named Rules

**The RTL-First Rule.** Arabic is the ground state and English is the override.
New layout is reasoned about right-to-left first and written in logical
properties. `left` and `right` in a style object are a defect unless they are
being chosen from the language state.

**The Breathing Room Rule.** Density is never the answer to too much content.
Padding below 12px inside a card, or gaps below 8px between controls, belongs to
the cold-records failure mode this system rejects.

## Elevation & Depth

Depth is ambient, not structural. Shadows are navy-tinted and diffuse — light
falling on paper in a bright room — and they describe that a surface is liftable,
never that it outranks another surface. A modal and a card may carry the same
shadow; what separates them is position and scale, not depth.

### Shadow Vocabulary
- **Ambient rest** (`box-shadow: 0 4px 20px rgba(27,46,94,0.08)`): Every card
  and panel at rest.
- **Ambient lift** (`box-shadow: 0 8px 32px rgba(27,46,94,0.18)`): Hover, paired
  with `transform: translateY(-2px)` over 0.3s.
- **Selection ring** (`box-shadow: 0 0 0 4px rgba(27,46,94,0.1)`): A selected
  day card. A ring, not a shadow — it marks state, not height.

### Named Rules

**The Daylight Rule.** Shadows are tinted with the navy (`rgba(27,46,94,...)`),
never neutral black. A grey or black shadow on Sea Mist reads as dirt rather
than light.

**The Lift-on-Touch Rule.** The 2px rise on hover is the system's one physical
gesture. It belongs to things that can actually be picked up — cards, tappable
rows. A static panel that lifts is lying about what it does.

## Shapes

Nothing in this system has a sharp corner. The radius scale runs 8px (skeletons,
small chips) → 10px (inputs, tabs) → 12px (buttons, imagery, icon tiles) → 16px
(cards), with badges fully pilled. 16px is the default for any new container.

Borders are thin and pale: 1.5px Tide Line on inputs, 2px transparent on
selectable cards so the border can appear on hover without shifting layout, and
a 3px Shallow Water underline beneath section headers — the one place a border
is used as emphasis rather than containment.

Icon tiles are 44×44px with 12px radius, matching the minimum touch target.

### Named Rules

**The Soft Corner Rule.** 16px for containers, 12px for controls, pill for
badges. A 0px or 4px corner is outside the system, and a radius above 16px on a
large surface starts reading as a toy.

**The Reserved-Border Rule.** Selectable surfaces carry a 2px transparent border
at rest so that showing the border on hover never moves anything.

## Components

### Buttons
- **Shape:** Gently rounded (12px radius), full-width inside cards and forms.
- **Primary:** Deep Harbour Navy fill, white text, 700 weight, ~13px vertical
  padding. The single highest-intent action on a surface.
- **Success:** Signal Success fill, same geometry. Reserved for the free-trial
  path, where the action is a gift rather than a charge.
- **Hover / Focus:** Fill darkens; no shadow change. Press uses the `haptic-press`
  utility — `scale(0.95)` and 0.85 opacity over 0.08s.
- **Known defect:** The project ships 53 shadcn/ui components, and `Button`'s
  variants reference `bg-primary text-primary-foreground`, `border-ring` and
  `bg-destructive` — none of which are defined, because there is no Tailwind
  `@theme` block and no shadcn token layer. Every call site works around this by
  overriding the component entirely with inline `style={{}}`. Treat the shadcn
  variant API as non-functional until it is themed; do not write
  `<Button variant="secondary">` and expect a colour.

### Cards / Containers
- **Corner Style:** 16px.
- **Background:** Surface White on a Sea Mist page.
- **Shadow Strategy:** Ambient rest, ambient lift on hover with a 2px rise.
- **Border:** None by default. Selectable variants carry a 2px transparent
  border that becomes Shallow Water on hover and Deep Harbour Navy plus a
  selection ring when active.
- **Internal Padding:** 20px standard, 16px for compact rows.

### Badges
- **Style:** Fully pilled, 4px × 12px padding, 12px Inter at 600.
- **Palette:** A pale tinted fill with a saturated text colour from the same
  family.
- **Known defect:** The class names lie. `.badge-orange`, `.badge-green` and
  `.badge-purple` are all blue — survivors of an earlier palette. Choose a badge
  by the colour you want, not by the word in the class name, and prefer defining
  a new semantic class over reusing a misnamed one.

### Inputs / Fields
- **Style:** Surface White, 1.5px Tide Line border, 10px radius, 11px × 12px
  padding, 14px text in Deep Harbour Navy.
- **Icon affordance:** A 16px Harbour Haze icon is absolutely positioned on the
  leading edge with 40px of padding reserved for it, side chosen from the
  language state.
- **Focus:** Border colour shifts to Deep Harbour Navy over 0.2s. No ring, no
  glow, no shadow.
- **Error:** Border and 11px helper text in Signal Danger.

### Navigation
- **Style:** A 56px sticky top bar with a bottom border and a backdrop blur.
- **Known defect:** The bar is written as `bg-background/95`, which is undefined
  in this project — the same missing shadcn token layer as `Button`. The chrome
  is relying on a token that does not exist.
- **Mobile:** Bottom-anchored navigation respects the home indicator via
  `bottom-nav-safe` (`padding-bottom: max(8px, var(--safe-bottom))`).

### Progress Bar (signature)
A 12px trough in Tide Line at 6px radius, filled with a left-to-right gradient
from Shallow Water Blue into Deep Harbour Navy, animating width over 1s. It is
the system's one piece of expressive colour — the spectrum itself, used to show
progress through it.

### Section Header (signature)
A 44px icon tile, a heavy Inter title, and a 3px Shallow Water Blue rule beneath
the whole row. It is how every major block on every screen announces itself, and
it is the only sanctioned use of a border as emphasis.

## Do's and Don'ts

### Do:
- **Do** lead with Deep Harbour Navy for authority and Shallow Water Blue for
  anything actionable; let Sea Mist carry the page.
- **Do** reach for weight before size when building hierarchy — 400 → 600 → 700
  → 800 across a 14–20px range.
- **Do** write layout in logical properties and reason right-to-left first.
- **Do** give every new container 16px corners, 20px padding and the ambient
  rest shadow.
- **Do** keep shadows navy-tinted (`rgba(27,46,94,…)`), diffuse and low-opacity.
- **Do** define a colour once. The palette currently lives in three places —
  `:root` custom properties, Tailwind's untouched default theme, and
  `const NAVY = "#1B2E5E"` re-declared in six page files. New work consolidates
  toward `:root`; it does not add a seventh copy.

### Don't:
- **Don't** let the clinic half win. Grey-on-grey, borderless dense tables and
  compressed padding produce the cold medical-records screen this system
  explicitly rejects. Daylight and breathing room are load-bearing.
- **Don't** use `left` or `right` in a style object unless the value is being
  selected from the language state.
- **Don't** rely on shadcn variant classes (`bg-primary`, `text-primary-foreground`,
  `border-ring`, `bg-background`) until a token layer exists. They resolve to
  nothing today.
- **Don't** introduce a warm or saturated hue as decoration. Green, amber and red
  mean success, caution and error — nothing else.
- **Don't** use pure black or neutral grey for text or shadow anywhere.
- **Don't** trust the `.badge-*` colour names; three of them are blue.
