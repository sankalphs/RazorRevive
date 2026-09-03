# Local failure classifier — data + training artefacts

`make_dataset.py` builds `data/upi_failures.csv` from the backend's own
canonical `DETERMINISTIC_RULES` (same source as the prompt prose), with
paraphrased gateway text so models generalise instead of memorising codes.

* `make_dataset.py` — Phase 1: synthetic corpus builder
* `ablate.py` — Phase 2: ablation study (baseline vs features vs model)
* `train.py` — Phase 2b: trains the winning config → `upi_failure_model.joblib`
* `ABLATION.md` + `ablation_results.json` — Phase 2 outputs
