# Ablation study - UPI failure classifier

Dataset: `upi_failures.csv` (5000 rows, 80/20 stratified split, seed 42).
Note: `error_code` is excluded from A/B/C to test generalisation to novel codes.

| Config | Acc | Macro-F1 | Wt-F1 | Fit(s) | Pred ms/row |
|---|---|---|---|---|---|
| D_leak_rf | 1.0 | 1.0 | 1.0 | 0.75 | 0.123 |
| A_desc_logreg | 0.987 | 0.987 | 0.9869 | 0.13 | 0.02 |
| B_rich_logreg | 0.985 | 0.985 | 0.9849 | 0.17 | 0.027 |
| C_rich_rf | 0.983 | 0.9832 | 0.983 | 0.84 | 0.206 |
| E_dummy | 0.208 | 0.1952 | 0.2089 | 0.07 | 0.026 |

**Winner: A_desc_logreg** - promoted to `train.py`.
Eligibility: D_leak_rf is excluded (sees error_code: memorisation upper bound,
not generalisation); E_dummy is the sanity floor. Winner is the best macro-F1
among A/B/C.
