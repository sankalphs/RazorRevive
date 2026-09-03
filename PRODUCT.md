# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary: Razorpay Buildathon 2026 judges (engineers, fintech operators, product leaders) evaluating the demo in a short, focused session. Secondary: developers exploring the codebase afterward. The product is a demonstration, not a deployed merchant-facing service.

## Product Purpose

RazorRevive is an autonomous AI revenue-recovery engine for Indian merchants. It ingests failed-payment events (UPI Autopay/eNACH mandate failures, checkout drop-offs, soft declines, B2B overdue invoices), runs an LLM root-cause diagnostician (MiniMax-M3 via GMI, with a deterministic rule-map fallback that never blocks recovery), then dispatches bounded, RBI-compliant recovery interventions: smart mandate-retry sequencing around live bank-gateway health, a bilingual Hinglish voice/WhatsApp agent with a Promise-to-Pay tracker, margin-capped checkout incentives, and a 3-stage B2B receivables escalator. Every decision lands in an immutable audit ledger with CSV export; a batch simulator proves ROI against a naive-dunning baseline. Success = judges grasp the mechanism, believe the compliance story, and remember the demo.

## Positioning

Recovery that is diagnostically intelligent and regulatorily constrained in one engine: LLM diagnosis feeding RBI-contact-hours enforcement, hard-stops on unrecoverable failures (fraud, expired cards, closed accounts), max-3-touchpoint/7-day windows, DND + Hinglish hardship detection ("paise nahi", "jobless") — a compliance-first recovery system a merchant could actually deploy, not just aggressive dunning.

## Operating Context

Single-page demo app (tab-based, no URL routing), fully in-memory backend state, all data simulated or LLM-generated — no real Razorpay keys, no database. Judges click through five views: Batch Simulator & ROI, Hinglish Voice/P2P Agent, Mandate Sequencer & Bank Health, Compliance Audit Ledger, Webhook Sandbox. KPI figures (₹ at risk, recovered, win rates, ROI multiplier, guardrail stops) are computed from the live in-memory ledger and must remain real endpoint data.

## Capabilities and Constraints

- Pipeline: Detect → Diagnose → Guardrail Check → Intervene → Audit & Settle (backend/app/core/engine.py).
- Interventions: SMART_MANDATE_RETRY, HINGLISH_VOICE_P2P, WHATSAPP_MAGIC_LINK, CHECKOUT_DYNAMIC_OFFER, B2B_COMPLIANT_DUNNING, HARD_STOP_NO_ACTION.
- Failure categories: TRANSIENT_TECHNICAL, SOFT_FINANCIAL, HARD_PERMANENT, BEHAVIORAL_DROPOFF, COMMERCIAL_DISPUTE.
- Statuses: AT_RISK, IN_PROGRESS, RECOVERED, FAILED, STOPPED_GUARDRAIL, P2P_SCHEDULED.
- Channels: UPI_AUTOPAY, ENACH, CARD_MANDATE, MAGIC_CHECKOUT, B2B_INVOICE, GATEWAY_CHECKOUT.
- 8 fictional Indian demo merchants (cult.fit, boAt, Tata Play, Urban Company, Notion India, Zetwerk B2B, SUGAR Cosmetics, Lenskart) seeded by the simulator; these are openly labeled demo data, not customers.
- All ₹ formatting uses en-IN locale.
- Frontend: React 19 + TypeScript + Vite + Tailwind v4; backend: FastAPI on :8000, Vite dev on :5173; `python run.py` boots both.

## Brand Commitments

- Name: RazorRevive (confirmed, keep).
- Agent persona: "Priya" (Hinglish voice/WhatsApp agent).
- "Razorpay Buildathon 2026 Submission" attribution stays.
- No fabricated testimonials, customer logos-as-customers, benchmarks, or deployment claims.

## Evidence on Hand

- Live API data: batch summaries (AI vs baseline win rates, lift, ROI), audit ledger with per-transaction LLM reasoning, bank-health registry, P2P promises, webhook samples — all from backend/app.
- Backend tests: 23 pytest cases under backend/tests (guardrails, diagnostics, P2P tracker, batch simulation incl. channel coherence and baseline harassment rules) — citable as engineering rigor.
- Absences that must not be fabricated: real customers, production metrics, press, testimonials.

## Product Principles

1. Compliance is the product: RBI guardrails are the differentiator, always one glance away.
2. Show the reasoning: every recovered rupee traces to a diagnosis a judge can read.
3. The demo is the proof: interactive simulation beats marketing claims; no invented evidence.
4. India-native by default: Hinglish, ₹/en-IN, real issuer banks, IST contact hours.
5. Recovery, not harassment: hard-stops and touchpoint caps are successes to celebrate, not edge cases to hide.

## Accessibility & Inclusion

Dark-first demo surface; maintain WCAG-conscious contrast for judge readability on projectors and laptops.
