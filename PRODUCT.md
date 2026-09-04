# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary: Razorpay Buildathon 2026 judges (engineers, fintech operators, product leaders) evaluating the demo in a short, focused session. Secondary: developers exploring the codebase afterward. The product is a demonstration, not a deployed merchant-facing service.

## Product Purpose

RazorRevive is an autonomous AI auto-responder for failed-payment losses, built for the Razorpay Buildathon 2026 "AI Risk Manager" track: stop the merchant losing money to failed payments, chargebacks-adjacent churn, and wasted dunning — defense-only. It ingests failed-payment events (UPI Autopay/eNACH mandate failures, checkout drop-offs, soft declines, B2B overdue invoices), runs a 4-layer root-cause diagnostic cascade (MiniMax-M3 via GMI → exact 17-code rule map → local TF-IDF+LogReg classifier at ≥0.70 confidence → keyword heuristics — a transient LLM timeout never blocks recovery), then dispatches bounded, RBI-compliant recovery interventions: smart mandate-retry sequencing around a bank-gateway health registry, a bilingual Hinglish voice/WhatsApp agent with a Promise-to-Pay tracker, margin-capped checkout incentives, and a 3-stage B2B receivables escalator. Every decision lands in a decision audit ledger with CSV export; a batch simulator measures AI vs naive-dunning baseline with honest metrics (win rates, incremental lift, ROI, false-positive cost avoided via guardrail stops). Success = judges grasp the mechanism, believe the compliance story, and remember the demo.

## Positioning

Recovery that is diagnostically intelligent and regulatorily constrained in one engine: LLM diagnosis feeding RBI-contact-hours enforcement, hard-stops on unrecoverable failures (fraud, expired cards, closed accounts), max-3-touchpoint/7-day windows, DND + Hinglish hardship detection ("paise nahi", "jobless") — a compliance-first recovery system a merchant could actually deploy, not just aggressive dunning.

## Operating Context

Single-page demo app (tab-based, no URL routing), fully in-memory backend state (audit ledger, P2P registry, deferral queue all reset on restart), all intervention outcomes simulated with calibrated probabilities — no real Razorpay keys, no database, no webhook signature verification. Judges click through five tabs: Simulation (batch run + AI vs baseline results), AI Agent (Hinglish chat + promise-to-pay), Bank Health (static demo registry of issuer uptime + retry strategy comparison), Audit Ledger (every decision, exportable), Webhooks (live event testing). KPI figures (₹ at risk, recovered, win rates, ROI multiplier, guardrail stops) are computed from the live in-memory ledger and must remain real endpoint data.

## Capabilities and Constraints

- Pipeline: Detect → Diagnose → Guardrail Check → Intervene → Audit & Settle (backend/app/core/engine.py).
- Diagnosis cascade: LLM (when key present + enabled) → exact rule map → local ML classifier (conf ≥ 0.70) → keyword heuristics; failure at any layer falls through.
- Interventions: SMART_MANDATE_RETRY, HINGLISH_VOICE_P2P, WHATSAPP_MAGIC_LINK (dispatches through the Hinglish agent path), CHECKOUT_DYNAMIC_OFFER, B2B_COMPLIANT_DUNNING, HARD_STOP_NO_ACTION.
- Failure categories: TRANSIENT_TECHNICAL, SOFT_FINANCIAL, HARD_PERMANENT, BEHAVIORAL_DROPOFF, COMMERCIAL_DISPUTE.
- Statuses: AT_RISK, IN_PROGRESS, RECOVERED, FAILED, STOPPED_GUARDRAIL, P2P_SCHEDULED.
- Channels: UPI_AUTOPAY, ENACH, CARD_MANDATE, MAGIC_CHECKOUT, B2B_INVOICE, GATEWAY_CHECKOUT.
- Out-of-hours actions are deferred via a real background dispatcher queue (60s poll), not dropped.
- 8 fictional Indian demo merchants (cult.fit, boAt, Tata Play, Urban Company, Notion India, Zetwerk B2B, SUGAR Cosmetics, Lenskart) seeded by the simulator; these are openly labeled demo data, not customers.
- All ₹ formatting uses en-IN locale.
- Frontend: React 19 + TypeScript + Vite + Tailwind v4; backend: FastAPI on :8000, Vite dev on :5173; `python run.py` boots both.

## Brand Commitments

- Name: RazorRevive (confirmed, keep).
- Agent persona: "Priya" (Hinglish voice/WhatsApp agent).
- "Razorpay Buildathon 2026 Submission" attribution stays.
- No fabricated testimonials, customer logos-as-customers, benchmarks, or deployment claims.

## Evidence on Hand

- Live API data: batch summaries (AI vs baseline win rates, lift, ROI), audit ledger with per-transaction reasoning, bank-health registry snapshot, P2P promises, webhook samples — all from backend/app.
- Backend tests: 39 pytest cases under backend/tests (guardrails, diagnostics, P2P tracker, ML cascade, webhook hardening, batch simulation incl. channel coherence and baseline protection rules) — citable as engineering rigor.
- Measured performance: across 20 seeded 100-txn batches, the AI stack recovers ~54% of at-risk revenue vs ~11% for the naive baseline (~5× lift, ~25 guardrail stops per batch) — single runs vary with composition.
- ML artifact: trained TF-IDF+LogReg classifier (0.987 macro-F1 on a held-out split, ablation study in backend/ml/) used as the offline fallback layer.
- Absences that must not be fabricated: real customers, production metrics, press, testimonials.

## Product Principles

1. Compliance is the product: RBI guardrails are the differentiator, always one glance away.
2. Show the reasoning: every recovered rupee traces to a diagnosis a judge can read.
3. The demo is the proof: interactive simulation beats marketing claims; no invented evidence.
4. India-native by default: Hinglish, ₹/en-IN, real issuer banks, IST contact hours.
5. Recovery, not harassment: hard-stops and touchpoint caps are successes to celebrate, not edge cases to hide.

## Accessibility & Inclusion

Light, minimal demo surface (white cards on a soft gray ground); WCAG AA contrast maintained (measured: body text ≥4.5:1) for judge readability on projectors and laptops.

## Track Commitments

- Track: AI Risk Manager (Razorpay Buildathon 2026) — "stop the merchant losing money" via a working auto-responder for one class of loss (failed payments), with measured performance against a naive baseline.
- Defense-only: the engine never contacts customers outside RBI hours, never exceeds 3 touchpoints/7 days, and hard-stops unrecoverable cases — nothing offense-capable ships.
- Honest metrics: false-positive cost is surfaced, not hidden — guardrail stops ("unsafe actions blocked") appear on the landing view, and baseline harassment-rule tests exist in the backend suite.
