---
name: RazorRevive
description: Mission control for autonomous, RBI-compliant revenue recovery — every failed payment a countdown the range safely flies.
colors:
  signal: "#2EFF7B"
  amber: "#FFB300"
  abort: "#FF4D4D"
  text: "#CFE4F2"
  dim: "#7C93A6"
  faint: "#6A8296"
  uplink-copy: "#F5E9C8"
  void: "#05080F"
  panel: "#0A101C"
  raise: "#0D1524"
  grid: "#12202F"
  edge: "#1C3245"
typography:
  display:
    fontFamily: "IBM Plex Mono, ui-monospace, Cascadia Mono, Consolas, monospace"
    fontSize: "26px"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "-0.025em"
    fontFeature: "tnum"
  headline:
    fontFamily: "IBM Plex Sans, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "17px"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.025em"
  title:
    fontFamily: "IBM Plex Sans, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "15px"
    fontWeight: 600
    lineHeight: 1.375
  body:
    fontFamily: "IBM Plex Sans, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.625
  label:
    fontFamily: "IBM Plex Mono, ui-monospace, Cascadia Mono, Consolas, monospace"
    fontSize: "10px"
    fontWeight: 500
    lineHeight: 1
    letterSpacing: "0.18em"
rounded:
  none: "0px"
  lamp: "9999px"
spacing:
  panel-gap: "20px"
  gutter: "16px"
  gutter-wide: "20px"
  graticule-cell: "28px"
components:
  button-go:
    backgroundColor: "{colors.signal}"
    textColor: "{colors.void}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "16px 24px"
  button-go-hold:
    backgroundColor: "rgba(255, 179, 0, 0.06)"
    textColor: "{colors.amber}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "16px 24px"
  chip-guard-on:
    backgroundColor: "rgba(46, 255, 123, 0.07)"
    textColor: "{colors.signal}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "6px 12px"
  chip-guard-off:
    backgroundColor: "transparent"
    textColor: "{colors.dim}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "6px 12px"
  input-station:
    backgroundColor: "{colors.raise}"
    textColor: "{colors.text}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "10px 14px"
  nav-tab-active:
    backgroundColor: "rgba(46, 255, 123, 0.04)"
    textColor: "{colors.signal}"
    rounded: "{rounded.none}"
    padding: "10px 20px"
  nav-tab-idle:
    backgroundColor: "transparent"
    textColor: "{colors.dim}"
    rounded: "{rounded.none}"
    padding: "10px 20px"
  panel-graticule:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.text}"
    rounded: "{rounded.none}"
  readout-state:
    backgroundColor: "rgba(46, 255, 123, 0.06)"
    textColor: "{colors.signal}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "3px 8px"
  readout-phosphor:
    textColor: "{colors.signal}"
    typography: "{typography.display}"
---

# Design System: RazorRevive

## Overview

**Creative North Star: "Mission Control, Sriharikota"**

RazorRevive's recovery engine is rendered as launch operations at the Indian spaceport: every failed payment is a countdown the range safely flies, not a red error badge. The judge lands on a live range — IST clock ticking, T+ mission elapsed running, RBI contact window armed, bank radar sweeping — and grasps the mechanism in one viewport. Density is instrument-plate density: abundant 9–11px mono microtext with wide uppercase tracking, a few large phosphor measurements, and one human subtitle per console explaining what the instruments mean.

The material is a near-black void carrying one etched green graticule: square-edged instrument plates stamped with station codes (STA-01…05), separated by 1px steel edges. Color is spent almost entirely on three phosphor inks with launch-range semantics — signal green for GO and recovery, amber for holds, counts, and commitments, abort red for range stops — applied one ink per state, never mixed. Type speaks in two voices: IBM Plex Mono is the only voice permitted for measurement, and IBM Plex Sans the only voice for human explanation. The confirmed visual anti-reference is the category default this world refuses: the navy card-grid SaaS dashboard.

The world was dealt (direction seed `c062e598`, position 1 of 7 grounded candidates, model pick, code-led build) and finished through a ship-verdict review; this document records the built world from code, and where this text and any earlier intention disagree, the code wins. Three truth laws from the review are binding visual behavior: dead telemetry reads SIGNAL LOST, never zeros; scenario panels not backed by the live ledger carry an ILLUSTRATIVE PROFILE stamp; and no invented metrics anywhere.

**Key Characteristics:**
- Near-black void (#05080F) with one etched green graticule (28px cell) carrying every major panel
- Three phosphor state inks — signal green, amber, range-stop red — one ink per state, never ambiguous
- Two voices: IBM Plex Mono for every measurement, IBM Plex Sans for every human sentence
- Square-edged instrument plates stamped with station codes (STA-01…05)
- Live range furniture: IST clock, persistent T+ mission elapsed, RBI contact-window state, sweeping tab rail, orbiting TCO mark
- Truth laws: SIGNAL LOST over zeros, ILLUSTRATIVE PROFILE stamps on illustrative scenarios, demo data openly labeled
- Self-hosted fonts (no CDN) and a WCAG-measured ink floor (#6A8296 at 5.0:1 on void)

## Colors

The palette is a deep blue-black instrument field on which exactly three phosphor inks do all the semantic work; everything else is surface, edge, and ink ramp.

### Primary
- **Phosphor Signal Green** (#2EFF7B): the GO ink. Fills the solid GO/DISPATCH/TRANSMIT plates (with void text), underlines the active station tab with its notch diamond, inks RECOVERED state readouts and recovered rupee figures, lights the T+ mission elapsed and STATUS lamps, and owns browser chrome — selection background, caret, focus ring, scrollbar hover, range accent. Its rarity is the point: green means the range says GO.

### Secondary
- **Countdown Amber** (#FFB300): the hold ink. Holds and counts in progress (T-10s→T-00s countdown strip, HOLD button state, ACQUIRING SIGNAL), the P2P commitment lock, RBI-window-closed state, uplink (customer) transmissions, and the TCO orbiter's ascending node. Amber never means failure — it means wait, locked, or queued.

### Tertiary
- **Range-Stop Red** (#FF4D4D): the abort ink. STOPPED_GUARDRAIL (RANGE STOP) and FAILED states, DEGRADED issuer cards with their glow, LOSS-OF-SIGNAL and DISPATCH-REJECTED states, and guardrail-failure readouts (HOLD). In this world red is often a success being celebrated — a range-safety stop that correctly fired.

### Neutral
- **Console Text** (#CFE4F2): primary ink for body copy, table figures, and the neutral IN_PROGRESS / AT_RISK state chips.
- **Secondary Slate** (#7C93A6): secondary copy — subtitles, labels, table interventions, baseline trace, transmission captions.
- **Microtext Slate** (#6A8296): the floor ink for 9–10px uppercase stamps, placeholder text, readout codes, and the footer. The dimmest ink permitted anywhere (see The Faint-Floor Rule).
- **Uplink Parchment** (#F5E9C8): body text inside customer uplink transmission blocks — a warm tint that keeps human-sent messages visually distinct from machine downlinks.
- **Launch Void** (#05080F): the page background and the recessed level — countdown strip and log-expand interiors dim toward it.
- **Instrument Panel** (#0A101C): every major panel plate and the graticule's base; also header, footer, and scrollbar track.
- **Raised Control Plate** (#0D1524): controls and inset cards — inputs, table headers, manifest rows, decision records, comms target cards.
- **Graticule Hairline** (#12202F): row dividers inside the mission log table.
- **Panel Edge Steel** (#1C3245): every border, panel divider, and divide line in the system.

Reserved, currently unused: `--color-signal-dim` (#1E7A44), `--color-amber-dim` (#8F6300), `--color-abort-dim` (#8F2626) are declared in the theme but appear in no component. They are reserved dim variants, not part of the working system.

### Named Rules
**The One-Ink-Per-State Rule.** Every recovery state owns exactly one ink, mapped once in `STATE_INKS` (telemetry.tsx) and never hand-picked: RECOVERED → signal green, P2P_SCHEDULED → amber (labeled P2P LOCKED), STOPPED_GUARDRAIL → abort red (labeled RANGE STOP), FAILED → abort red, IN_PROGRESS and AT_RISK → neutral Console Text on faint borders. Never mix inks for a state, never invent a second tone.

**The Faint-Floor Rule.** Microtext Slate (#6A8296) is the dimmest ink that may ship on any surface: measured 5.0:1 on void, 4.75:1 on panel, 4.56:1 on raise against the 4.5:1 small-text floor. Secondary copy uses #7C93A6; nothing darker is ever text. Known open item from the review: idle chip borders at 60% faint alpha sit ≈2.45:1, below the 3:1 non-text floor — do not copy that alpha pattern into new components blindly.

## Typography

**Display Font:** IBM Plex Mono (ui-monospace, Cascadia Mono, Consolas fallbacks) — self-hosted latin woff2
**Body Font:** IBM Plex Sans (-apple-system, Segoe UI, Roboto fallbacks) — self-hosted latin woff2
**Label/Mono Font:** IBM Plex Mono (same stack as Display)

**Character:** Two voices, strictly divided. The mono voice is the range's instrumentation — measured, stamped, unemotional. The sans voice is the human at the console — explanatory, plain, warm. The pairing is the world's clearest signal: if a string could be read aloud by an instrument, it is mono; if a human would say it to another human, it is sans.

### Hierarchy
- **Display** (Mono 400, 26px stepping to 30px at sm, line-height 1, tracking −0.025em, tabular figures): the big measurements — vehicle-status readouts (at-risk, recovered, lift, ROI) and issuer uptime percentages. Phosphor ink when the value is a live measurement; Console Text when neutral.
- **Headline** (Sans 700, 17px, line-height 1, tracking tight): the RAZORREVIVE callsign, with REVIVE in signal green. The only bold sans at this scale.
- **Title** (Sans 600, 15px, line-height 1.375): every StationHeader console title.
- **Body** (Sans 400, 12px, line-height 1.625): explanatory copy, subtitles (capped ~72ch), transmission message text, profile step bodies.
- **Label** (Mono 400–500, 9–11px, uppercase, 0.14–0.25em tracking): the world's most abundant voice — station codes, readout captions, stamps, table headers, filter controls, footer. Buttons are labels enlarged: mono 12–14px semibold at 0.12em tracking, uppercase.

### Named Rules
**The Two Voices Rule.** Every measured value, timestamp, code, status, price, and machine utterance renders in IBM Plex Mono with tabular figures (the `.numeric` law: mono, `tabular-nums`, −0.01em tracking). Every sentence written for a human renders in IBM Plex Sans. No string switches voices.

## Layout

A single-page range, tab-based with no URL routing. A sticky command bar (58px, panel at 95% opacity with backdrop blur) carries the TCO mark, callsign, and — at lg and up — flight telemetry: IST clock, MISSION ELAPSED T+, CONTACT POLICY (RBI window open/closed), DIAGNOSTICIAN status, separated by 1px edge dividers. Below it, the five-station tab rail; below that, the Vehicle Status Board stays visible on every station, followed by the active station's console. The mission epoch persists per-browser via localStorage (`rrv-mission-epoch`) so T+ survives reloads.

Content lives in a 1440px max-width column with 16px gutters (20px from sm up). Sibling panels stack at a 20px rhythm. Readout walls and economics strips divide with 1px hairlines rather than gaps — divide-based grids on edge/grid colors — while card walls (issuer radar) use 3px gaps. The graticule itself is a 28px cell.

**The Station Chrome Rule.** Every console panel opens with the same station header before any content: a signal-green mono code (10px, 0.25em, uppercase), a Sans title, one dim human subtitle (~72ch), and an optional right-hand readout slot. No panel invents its own header anatomy.

Responsive ladder: single column on mobile (tab labels shorten to one word); at sm (640px) readouts go two-up and tabs show full labels; at lg (1024px) command telemetry appears, the comms console splits 1+2 columns, the sequencer goes content+launch-control, and paired panels go two-up; at xl (1280px) the status board is a four-readout wall and the radar a three-column wall.

## Elevation & Depth

No drop shadows exist anywhere in the system. Depth is conveyed three ways: tonal layering (void → panel → raise, with recessed interiors dimming toward void), the etched graticule (28px grid of 3% green lines with a 4% phosphor bloom at the panel crown), and phosphor glow — the only "shadow" vocabulary, and it is semantic, not structural: glow means the instrument is live in its ink.

### Shadow Vocabulary
- **glow-signal** (`0 1px 0 0 rgba(46,255,123,0.25) inset, 0 0 20px -8px rgba(46,255,123,0.28)`): live signal-green plates — the RRV smart-sequencer profile.
- **glow-amber** (`0 1px 0 0 rgba(255,179,0,0.25) inset, 0 0 20px -8px rgba(255,179,0,0.28)`): live amber plates.
- **glow-abort** (`0 1px 0 0 rgba(255,77,77,0.25) inset, 0 0 20px -8px rgba(255,77,77,0.3)`): DEGRADED issuer cards.
- **Trace glows** (`0 0 12px rgba(46,255,123,0.5)` / `0 0 10px rgba(255,77,77,0.5)`): fill bars inside trajectory and uptime traces.
- **GO hover bloom** (`0 0 30px -8px rgba(46,255,123,0.6)`): the primary button's only hover treatment.

### Named Rules
**The Phosphor Ceiling Rule.** Phosphor glow (box and text) belongs to measured readouts, live status lamps, and active state plates only — never to body copy, never to headings, never as decoration. A glowing paragraph is a category error.

## Shapes

The form language is the square instrument plate: 0px radius on every panel, button, chip, input, table, and transmission block. The only circles in the system are semantic instruments — the 7px StatusLamp (full round) and the TCO mark's orbiting node; the favicon's 8px corner radius is the one soft corner anywhere, and it ships at 16px, not in-app. Edges are 1px Panel Edge Steel; empty and acquiring states use dashed edge borders instead of color. One signature geometry: the active station tab carries a 7px square rotated 45° — a diamond notch centered under the 2px signal underline.

**The Square Plate Rule.** If a surface is square, it is an instrument; circles are reserved for lamps and orbiters. Never round a plate, chip, or control.

## Components

Every console reads its inks, formatters, and chrome from `components/telemetry.tsx` — INK constants, STATE_INKS, StationHeader, StatusLamp, StatusReadout, ComplianceReadout. New stations import; they never re-declare.

### Buttons
Instrument actuators — only the range's primary command gets a solid plate.
- **Shape:** square (0px radius), 1px border.
- **Primary (GO family — EXECUTE BATCH LAUNCH, DISPATCH WEBHOOK, TRANSMIT):** solid signal plate, void text, mono uppercase 12–14px semibold at 0.12em tracking, 16px vertical padding (10px for TRANSMIT); hover blooms the 30px green glow; active settles 1px downward.
- **Hold/running state:** amber ghost — amber text on a 6% amber tint with a 60% amber border, wait cursor, spinning icon. (This spinner is the one transient looping icon in the codebase; do not multiply it.)
- **Secondary/ghost (PLAY VOICE, EXPORT CSV, COPY, filter chips as buttons):** transparent with edge border and dim text; hover lifts to Console Text and brightens the border; EXPORT's hover additionally shifts to signal green.

### Chips
- **Style:** square, mono 10–12px, transparent idle with edge border and dim text; selected: signal border, signal text, 7% signal tint; `aria-pressed` throughout.
- **Variants:** hardware-guard switches (batch size, verticals — verticals carry a StatusLamp, LLM engage), preset signal chips (Signal Ingest), test vectors (comms quick-transmissions). Known open item: idle borders at 60% faint alpha ≈2.45:1 against the 3:1 non-text floor.

### Cards / Containers
- **Corner Style:** 0px radius everywhere.
- **Background:** the graticule plate for every major panel (panel base, 28px etch, crown bloom, 1px edge border); raised plates (#0D1524) for inset cards — decision records, manifest rows, comms targets, diagnosis blocks; recessed void tints for countdown strips and expanded log rows.
- **Shadow Strategy:** none at rest; semantic phosphor glow only (see Elevation & Depth).
- **Border:** 1px Panel Edge Steel; dashed for empty/acquiring states.
- **Internal Padding:** 14–20px; the system's panel-gap rhythm is 20px.

### Inputs / Fields
- **Style:** raised plate background, 1px edge border, mono voice, Console Text; placeholders in Microtext Slate; the caret is signal green. Selects replace native chrome with a 10×6 dim chevron SVG and panel-colored options; the JSON editor is a mono textarea under the same law.
- **Focus:** border turns signal green with a 1px signal ring and a 16px green bloom — and globally, every interactive element takes a 2px signal outline offset 2px on focus-visible.
- **Error / Disabled:** no red inputs; malformed dispatches answer as DISPATCH REJECTED panels in abort ink. Disabled TRANSMIT drops to edge border with faint text on transparent.

### Navigation
- **Command bar:** sticky, panel at 95% + backdrop blur, 58px; 34px TCO mark (6s orbit), RAZOR (text ink) REVIVE (signal) at 17px bold, a bordered mono role chip, and a faint mono range line. Flight telemetry right, lg and up only, divided by 1px edge.
- **Station tab rail:** carries the ambient 7s scanline sweep on its panel base. Square tabs: mono station code (9px, 0.15em) + 14px icon + label (full at sm+, one-word short below). Active: signal text, 2px signal bottom underline, 4% signal tint, and the rotated-45° notch diamond; idle: dim, hovering to Console Text.

### Station Consoles (signature)
- **StationHeader:** the shared chrome — code / title / subtitle / right slot (see The Station Chrome Rule).
- **StatusLamp:** 7px round lamp; lit in its ink with an 8px ink-tinted halo, dark faint when off.
- **StatusReadout:** one-ink state chip — mono 10px, state border at 50% ink alpha, 6–8% ink tint, icon, STATE_INKS label (RECOVERED / P2P LOCKED / RANGE STOP / FAILED / IN PROGRESS / AT RISK).
- **ComplianceReadout:** PASS in signal / HOLD in abort with its icon — the compliance story at a glance.
- **Vehicle readout:** mono code caption, ACQ/LOCK lamp pair, the Display-size value with phosphor ink when live, dim dashes while loading, arrival animation on land, sans explanation below.
- **Transmission blocks:** squared message plates — downlink green (Priya) at 4% signal tint with 35% signal border, uplink amber (customer) at 6% amber tint with 40% amber border and Uplink Parchment body; each stamped with lamp, direction, and IST time.
- **Countdown strip:** recessed void band; T-phase in phosphor amber, 1px progress fill in amber (300ms per phase), phase call in mono.

## Do's and Don'ts

### Do:
- **Do** give every measured value the mono voice with tabular figures — the `.numeric` law (IBM Plex Mono, tabular-nums, −0.01em).
- **Do** read state inks from `INK` / `STATE_INKS` in telemetry.tsx — one ink per state, never a hand-picked second green, amber, or red.
- **Do** render dead telemetry as SIGNAL LOST / LOSS OF SIGNAL / DISPATCH REJECTED with a remediation line (e.g. VERIFY BACKEND ON :8000) — never zeros, never blank panels.
- **Do** stamp any scenario panel not backed by the live ledger ILLUSTRATIVE PROFILE — as STA-03's Profile B does.
- **Do** keep text inks at Microtext Slate (#6A8296) or brighter (measured 5.0:1 void / 4.75:1 panel / 4.56:1 raise); use #7C93A6 for secondary copy, #CFE4F2 for primary.
- **Do** keep motion to the four loops — readout arrival (0.5s, cubic-bezier(0.16,1,0.3,1)), tab-rail sweep (7s), TCO orbit (6s), cursor blink (1.4s steps) — plus brief state fills (300ms countdown, 700ms bars).
- **Do** ship fonts self-hosted from `/fonts` (latin woff2) — no CDN.
- **Do** open every console with the StationHeader chrome and stamp it with a station code (STA-01…05 pattern).

### Don't:
- **Don't** round corners (0px radius) — circles belong to StatusLamps and the orbiter mark only.
- **Don't** phosphor-glow body copy or headings; text-phosphor and glow utilities are for measured readouts and live plates only.
- **Don't** invent metrics, benchmarks, or customers — illustrative scenarios get stamped, demo data stays labeled (footer: DEMO DATA).
- **Don't** add new looping animations; the hold-spinner on the GO button is the one transient exception in code — don't copy it further.
- **Don't** style failures as raw red error badges; failure gets mission language (LOSS OF SIGNAL, RANGE STOP, DISPATCH REJECTED) in its one ink with a remediation stamp.
- **Don't** define colors outside the `@theme` block and INK constants; alpha tints derive only from the three state inks.
