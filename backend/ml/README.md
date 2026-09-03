# Local failure classifier — data + training artefacts

`make_dataset.py` builds `data/upi_failures.csv` from the backend's own
canonical `DETERMINISTIC_RULES` (same source as the prompt prose), with
paraphrased gateway text so models generalise instead of memorising codes.

* `make_dataset.py` — Phase 1: synthetic corpus builder (5k rows)
* `ablate.py` — Phase 2: ablation study (text-only vs rich features vs RF,
  plus code-leakage upper bound and dummy floor)
* `train.py` — Phase 2b: trains the winner → `upi_failure_model.joblib`
* `ABLATION.md` + `ablation_results.json` — Phase 2 outputs
* `../app/core/ml_model.py` — Phase 3: offline loader + `ml_diagnose()`,
  cascaded as rule match → ML (conf ≥ 0.70) → heuristics inside
  `deterministic_adapter()`; LLM-failure paths fall through to it too.

Result: **A_desc_logreg wins — 0.987 macro-F1, 37KB, ~0.02ms/row.**
Tabular features added no lift; RF was 10x slower for −0.004.
