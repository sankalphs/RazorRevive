---
name: RazorRevive
description: A minimal, light, plain-English operations dashboard for an AI failed-payment recovery engine — white cards on soft gray, one blue accent for action, honest metrics a first-time judge reads without a decoder ring.
colors:
  page: "#F7F8FA"
  card: "#FFFFFF"
  line: "#E4E7EC"
  line-strong: "#D0D5DD"
  ink: "#101828"
  ink-2: "#475467"
  ink-3: "#667085"
  ink-4: "#98A2B3"
  accent: "#0B72E9"
  accent-strong: "#0A5FC4"
  accent-soft: "#EFF8FF"
  ok: "#067647"
  ok-soft: "#ECFDF3"
  ok-line: "#ABEFC6"
  warn: "#B54708"
  warn-soft: "#FFFAEB"
  warn-line: "#FEDF89"
  bad: "#B42318"
  bad-soft: "#FEF3F2"
  bad-line: "#FECDCA"
  wash: "#F2F4F7"
typography:
  display:
    fontFamily: "IBM Plex Mono, ui-monospace, Cascadia Mono, Consolas, monospace"
    fontSize: "28px"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "-0.01em"
    fontFeature: "tnum"
  headline:
    fontFamily: "IBM Plex Sans, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "17px"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.02em"
  title:
    fontFamily: "IBM Plex Sans, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "15px"
    fontWeight: 600
    lineHeight: 1.375
  body:
    fontFamily: "IBM Plex Sans, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.625
  caption:
    fontFamily: "IBM Plex Sans, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.5
---

# RazorRevive — Design

## 1. Overview / Creative North Star

RazorRevive (Razorpay Buildathon 2026, AI Risk Manager track) is a **light, minimal, plain-English operations dashboard**: an AI auto-responder for failed payments that a first-time judge understands in one viewport — what failed, what the AI did, what it recovered, what it safely refused to touch. The UI voice is plain words: "Recovered", "Stopped by safety rule", "Promise to pay", "Can't reach the backend". The footer states the truth plainly: "AI Risk Manager · failed-payment recovery · RBI-compliant by design · demo data".

It refuses two things: the incumbent habit of launch-range jargon on every panel, and its own dead previous incarnation — a dark "mission control" world. No dark theme, no glow, no telemetry cosplay. White cards on a #F7F8FA ground, measured numerals, and honest metrics (guardrail stops and false-positive cost surfaced on the landing view, never hidden; demo merchants openly labeled, no fabricated evidence).

**Rules the code enforces:**

- **One accent for action only.** #0B72E9 appears on primary buttons, links, active tabs, selected chips, user chat bubbles, focus rings — never on static prose.
- **Semantic tints for status only.** ok/warn/bad colors and their soft/line tints encode outcomes; they are never decorative.
- **The `.numeric` mono law.** Every measured value (₹, %, counts, timestamps, IDs, sizes) renders in IBM Plex Mono with tabular-nums.
- **`STATUS_TONES` is the single authority** for status labels, text/bg/border tones, and icon mapping — no component invents its own status copy or hexes.
- **A dead backend never reads as zeros.** It reads "Can't reach the backend … a dead backend should never look like zero recovery" with a remedial hint.
- **Every view carries loading / error / empty states** (em-dash stats, dashed-border placeholders, bad-tinted failures in words).
- **Machine names are humanized at the render boundary** (`SMART_MANDATE_RETRY` → "smart mandate retry"; `FAILED` → "Not recovered"; `HARD_STOP_NO_ACTION` → "Stopped — unsafe to act").

## 2. Colors

All tokens live in the single `@theme` block in `frontend/src/index.css`; every component reads from here.

| Role | Token | Hex |
|---|---|---|
| Page ground | `page` | `#F7F8FA` |
| Card surface | `card` | `#FFFFFF` |
| Hairline | `line` | `#E4E7EC` |
| Strong line (fields, unselected chips) | `line-strong` | `#D0D5DD` |
| Ink ramp | `ink` / `ink-2` / `ink-3` / `ink-4` | `#101828` / `#475467` / `#667085` / `#98A2B3` |
| Accent (action) | `accent` | `#0B72E9` |
| Accent hover / pressed | `accent-strong` | `#0A5FC4` |
| Accent wash (selected chips, soft fills) | `accent-soft` | `#EFF8FF` |
| OK text / soft / line | `ok` / `ok-soft` / `ok-line` | `#067647` / `#ECFDF3` / `#ABEFC6` |
| Warn text / soft / line | `warn` / `warn-soft` / `warn-line` | `#B54708` / `#FFFAEB` / `#FEDF89` |
| Bad text / soft / line | `bad` / `bad-soft` / `bad-line` | `#B42318` / `#FEF3F2` / `#FECDCA` |
| Neutral wash (disabled, tracks, scrollbar) | `wash` | `#F2F4F7` |

The ink ramp carries all hierarchy: `ink` for values and titles, `ink-2` for labels and body, `ink-3` for captions/subtitles, `ink-4` only for placeholders, disabled, loading em-dashes, and the baseline bar fill. Chat message area sits on `bg-page` inside the white card; table headers use `bg-page`.

**WCAG discipline:** measured body text ≥ 4.5:1 (light theme, `color-scheme: light`), tuned for projectors and laptops in a short judge session.

## 3. Typography

Two self-hosted families, latin-subset woff2 in `/public/fonts`, `font-display: swap`, no CDN.

- **IBM Plex Sans** — 400/500/600/700 — the UI voice (body default 14px, antialiased).
- **IBM Plex Mono** — 400/500/600 — every measured value, via the `.numeric` class (mono + `tabular-nums` + `-0.01em` tracking). Payload textareas are mono at 12.5px.

Size ramp actually used (Tailwind arbitrary values, no type scale):

- 10.5px — chat timestamps
- 11.5px — bank Healthy/Struggling pills, "Example scenario" badge
- 12px — captions, StatusBadge, table headers, footnotes
- 12.5px — sub-captions, quick replies, promise tracker lines
- 13px — body text, table cells, error copy
- 13.5px — panel-subtitles adjacent labels, chat bubbles, tab labels
- 14px — buttons, bank names
- 15px — `PanelHeader` titles
- 16px — webhook outcome/recovered cells
- 17px — product name, comparison stat cells
- 26px — bank uptime numerals
- 28px — landing stat numerals

Large numerals get `tracking-tight` + `font-semibold` + `leading-none`; body copy uses `leading-relaxed` with `max-w-[72ch]`-style caps in subtitles.

## 4. Layout

- **1200px max column** (`max-w-[1200px] mx-auto px-4 sm:px-6`), vertical rhythm via `py-6` main + `space-y-6` section gaps.
- **Header** (sticky, `z-50`, white, hairline bottom): 28px LogoMark (32×32 viewBox, `rx=8` accent square + white bolt) → name "Razor**Revive**" 17px bold tracking-tight with "Revive" in accent → tagline right ("AI auto-responder that recovers failed payments — safely, within RBI rules") → 5 tabs (Simulation, AI Agent, Bank Health, Audit Ledger, Webhooks), each icon + 13.5px label, active = 2px `border-accent` underline with `text-accent-strong` + `bg-accent-soft/60`, inactive = transparent border, `hover:bg-wash`. `aria-current="page"` on the active tab.
- **Panel anatomy** — `PanelHeader` (px-5 pt-4 pb-3): 15px semibold title, optional 13px `ink-3` subtitle (`max-w-[72ch]`), optional right slot (`shrink-0`) for badge/buttons.
- **Grid ladders:** stats `grid-cols-1 sm:grid-cols-2 xl:grid-cols-4` with `divide-x` hairlines; bank cards `1 / sm:2 / xl:3` (`gap-3`); paired panels `1 / lg:2` (`gap-6`); chat view `lg:grid-cols-3` with chat spanning 2 (`h-[640px]`); decision records `md:grid-cols-3`.
- **Footer:** hairline top, white, 12px `ink-3` — attribution left ("RazorRevive · Razorpay Buildathon 2026 submission"), positioning right.

## 5. Elevation & Depth

- **One shadow token:** `shadow-card` = `0 1px 2px rgba(16,24,40,0.04)` on white cards. No layered shadows, no glows (the only glow is the 3px accent focus halo on `.field`, a state, not elevation).
- **One authored motion:** the `arrive` keyframe — 0.3s ease-out, opacity 0→1, 4px rise — applied when results land (expanded decision records, promise tracker, webhook verdicts, error notices). Everything else is `transition-colors`, bar fills (`duration-700`), or a spinner.
- Depth otherwise comes from hairlines (`border-line`) and tone, never from shadow stacking.

## 6. Shapes

- **8px** — controls: `.field` inputs/selects/textareas, buttons (`rounded-lg`), chips, stat cells, inner detail boxes.
- **12px** — cards (`rounded-xl`) and bank cards.
- **16px** — chat bubbles (`rounded-2xl`), with one 4px directional corner (`rounded-tr-sm` user / `rounded-tl-sm` assistant) pointing at the avatar.
- **Full-round** — status pills (`rounded-full`), quick replies, webhook sample chips, progress bars, avatars.
- **Dashed hairlines** (`border-dashed border-line-strong`) — reserved for loading/empty/"not yet" states; solid bad-tint borders mark errors.

## 7. Components

- **Buttons.** Primary: `bg-accent text-white hover:bg-accent-strong active:translate-y-px` (Run simulation, Send, Send webhook). Running/disabled: `bg-wash text-ink-3` + `cursor-wait`/`cursor-not-allowed` with spinner. Ghost: `border-line-strong text-ink-2 hover:bg-wash`; link-flavored ghosts pick up `hover:text-accent` (Export CSV, Copy).
- **Chips.** `aria-pressed` toggle buttons. Selected: `border-accent text-accent-strong bg-accent-soft`; unselected: `border-line-strong text-ink-2 bg-white hover:bg-wash`. Batch-size chips add `.numeric`; webhook samples and quick replies use `rounded-full`.
- **StatusBadge** (`telemetry.tsx`): full-round pill, icon (CheckCircle2/Clock3/MinusCircle/Loader) + plain-English label, all three tone classes from `STATUS_TONES`.
- **ComplianceBadge**: inline `Passed` (CheckCircle2, `text-ok`) / `Blocked` (ShieldAlert, `text-bad`) — no pill.
- **Chat**: Bot/User avatars (28px `rounded-full`; assistant `bg-accent text-white`, user `bg-line text-ink-2`); user bubbles accent blue, assistant white with hairline; timestamps 10.5px mono; "Priya is typing…" pulse; scenario selector cards; promise-to-pay tracker in warn tints ("Follow-up paused · reminder scheduled").
- **Bank cards**: Healthy (white, ok pill `border-ok-line bg-ok-soft text-ok`) vs Struggling (`bg-bad-soft border-bad-line`, white bad pill); 26px uptime numeral, full-round bar, peak-congestion footer.
- **Audit table**: filter bar (search `.field` + two selects + record count), hairline-divided rows, expandable rows via chevron (`aria-expanded`, expanded row `bg-accent-soft/60`, detail row on `bg-page` with `.arrive`) opening a 3-cell decision record (AI diagnosis / safety checks / settlement).
- **Fields**: `.field` class — white, `line-strong` border, 8px radius, accent border + 12% halo on focus, `ink-4` placeholders; selects use an inline SVG chevron, textareas are mono.

## 8. Browser Surfaces

- **Selection**: `::selection` accent bg / white text (plus `selection:bg-accent selection:text-white` on the root div).
- **Caret**: `.caret-accent` on chat and search inputs.
- **Focus-visible**: 2px solid `#0B72E9`, offset 2 — buttons, links, inputs, selects, textareas, `[tabindex]`.
- **Range inputs**: `accent-color: #0B72E9`.
- **Scrollbar** (WebKit): 8px, `wash` track, `line-strong` thumb with 2px `wash` border and 4px radius, `ink-4` on hover; `.no-scrollbar` hides it where a scroll affordance already exists (tab row, quick replies).

## 9. Do's and Don'ts

**Do**

1. Read every status label, tone, and icon from `STATUS_TONES` — it is the only authority.
2. Use `.numeric` for every measured value, ID, and timestamp.
3. Say backend failures in words ("Can't reach the backend… Start the backend on port 8000 and reload") — never zeros.
4. Use dashed-border placeholders for loading/empty states and bad-tint boxes for errors, in every view.
5. Use `.arrive` when results land; let bar fills transition at `duration-700`.
6. Keep metrics honest: guardrail stops visible on the landing view, demo data labeled as demo data.

**Don't**

1. Don't hand-pick hexes outside the `@theme` tokens.
2. Don't use accent blue for non-interactive text — it means action, selection, or focus.
3. Don't apply ok/warn/bad tints decoratively — they encode status only.
4. Don't show zeros or fake numbers for dead telemetry.
5. Don't round chat bubbles below `rounded-2xl` (16px) or forget the directional corner.
6. Don't add shadows, glows, dark surfaces, or launch-range jargon — that world is dead.

## 10. Accessibility Notes

- `aria-pressed` on all chip/toggle buttons; `aria-current="page"` on the active tab.
- Chat log: `role="log"` + `aria-live="polite"` + `aria-label`.
- Audit rows: `aria-expanded` + dynamic `aria-label` on the expand chevron; `sr-only` "Details" header cell keeps the action column legible to screen readers.
- Every section/nav/select/input carries an `aria-label`.
- Contrast measured at ≥ 4.5:1 for body text; focus-visible ring is 2px accent at 2px offset on all interactive elements.
- The Hinglish voice degrades honestly: if `speechSynthesis` is missing, a warn-tinted note says the text chat still works.
