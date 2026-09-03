"""Ablation study: what actually helps the failure classifier?

Compares feature sets and model families on backend/ml/data/upi_failures.csv:

  A_desc_logreg  : TF-IDF(error_desc) only + LogisticRegression (text baseline)
  B_rich_logreg  : desc + channel/bank one-hot + numeric + LogisticRegression
  C_rich_rf      : same rich features (NO error_code) + RandomForest (candidate)
  D_leak_rf      : rich + error_code one-hot + RandomForest (memorisation upper bound)
  E_dummy        : stratified dummy (sanity floor)

error_code is deliberately EXCLUDED from A/B/C so we measure generalisation
to paraphrased gateway text — the production case where codes are missing
or novel. D quantifies how much the code leaks.

Usage:
    python backend/ml/ablate.py
Outputs:
    backend/ml/ablation_results.json, backend/ml/ABLATION.md
"""

from __future__ import annotations

import json
import sys
import time
from pathlib import Path

from sklearn.compose import ColumnTransformer
from sklearn.dummy import DummyClassifier
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, f1_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.ensemble import RandomForestClassifier

import pandas as pd

REPO_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPO_ROOT))

ML_DIR = Path(__file__).resolve().parent
DATA_PATH = ML_DIR / "data" / "upi_failures.csv"

TEXT_COL = "error_desc"
CAT_COLS = ["channel", "issuer_bank"]
NUM_COLS = ["amount", "bank_uptime_pct", "attempts_made"]
LABEL_COL = "label"


def make_preprocessor(include_code: bool) -> ColumnTransformer:
    cats = list(CAT_COLS) + (["error_code"] if include_code else [])
    return ColumnTransformer(
        transformers=[
            ("text", TfidfVectorizer(ngram_range=(1, 2), max_features=4000), TEXT_COL),
            ("cat", OneHotEncoder(handle_unknown="ignore"), cats),
            ("num", StandardScaler(), NUM_COLS),
        ]
    )


def build_configs() -> dict[str, Pipeline]:
    return {
        "A_desc_logreg": Pipeline(
            [
                ("prep", ColumnTransformer([("text", TfidfVectorizer(ngram_range=(1, 2), max_features=4000), TEXT_COL)])),
                ("clf", LogisticRegression(max_iter=1000)),
            ]
        ),
        "B_rich_logreg": Pipeline(
            [("prep", make_preprocessor(False)), ("clf", LogisticRegression(max_iter=1000))]
        ),
        "C_rich_rf": Pipeline(
            [
                ("prep", make_preprocessor(False)),
                ("clf", RandomForestClassifier(n_estimators=200, min_samples_leaf=2, n_jobs=-1, random_state=42)),
            ]
        ),
        "D_leak_rf": Pipeline(
            [
                ("prep", make_preprocessor(True)),
                ("clf", RandomForestClassifier(n_estimators=200, min_samples_leaf=2, n_jobs=-1, random_state=42)),
            ]
        ),
        "E_dummy": Pipeline([("prep", make_preprocessor(False)), ("clf", DummyClassifier(strategy="stratified", random_state=42))]),
    }


def evaluate(name: str, pipe: Pipeline, X_train, X_test, y_train, y_test) -> dict:
    t0 = time.perf_counter()
    pipe.fit(X_train, y_train)
    fit_s = time.perf_counter() - t0
    t1 = time.perf_counter()
    pred = pipe.predict(X_test)
    pred_ms = (time.perf_counter() - t1) / max(len(X_test), 1) * 1000.0
    return {
        "config": name,
        "accuracy": round(float(accuracy_score(y_test, pred)), 4),
        "macro_f1": round(float(f1_score(y_test, pred, average="macro", zero_division=0)), 4),
        "weighted_f1": round(float(f1_score(y_test, pred, average="weighted", zero_division=0)), 4),
        "fit_seconds": round(fit_s, 2),
        "predict_ms_per_row": round(pred_ms, 3),
    }


def main() -> None:
    df = pd.read_csv(DATA_PATH)
    X = df[[TEXT_COL, *CAT_COLS, *NUM_COLS, "error_code"]]
    y = df[LABEL_COL]
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    results = [evaluate(n, p, X_train, X_test, y_train, y_test) for n, p in build_configs().items()]
    results.sort(key=lambda r: r["macro_f1"], reverse=True)

    with open(ML_DIR / "ablation_results.json", "w") as f:
        json.dump({"test_size": 0.2, "seed": 42, "n": len(df), "results": results}, f, indent=2)

    lines = [
        "# Ablation study - UPI failure classifier",
        "",
        f"Dataset: `{DATA_PATH.name}` ({len(df)} rows, 80/20 stratified split, seed 42).",
        "Note: `error_code` is excluded from A/B/C to test generalisation to novel codes.",
        "",
        "| Config | Acc | Macro-F1 | Wt-F1 | Fit(s) | Pred ms/row |",
        "|---|---|---|---|---|---|",
    ]
    for r in results:
        lines.append(
            f"| {r['config']} | {r['accuracy']} | {r['macro_f1']} | {r['weighted_f1']} "
            f"| {r['fit_seconds']} | {r['predict_ms_per_row']} |"
        )
    best = max(
        (r for r in results if r["config"] in ("A_desc_logreg", "B_rich_logreg", "C_rich_rf")),
        key=lambda r: r["macro_f1"],
    )["config"]
    lines += [
        "",
        f"**Winner: {best}** - promoted to `train.py`.",
        "Eligibility: D_leak_rf is excluded (sees error_code: memorisation upper bound,",
        "not generalisation); E_dummy is the sanity floor. Winner is the best macro-F1",
        "among A/B/C.",
    ]
    (ML_DIR / "ABLATION.md").write_text("\n".join(lines) + "\n", encoding="utf-8")

    print("\n".join(lines))
    print(f"\nWinner: {best}")


if __name__ == "__main__":
    main()
