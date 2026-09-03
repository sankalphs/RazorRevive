"""Trains the winning ablation config on the full corpus.

Winner: A_desc_logreg - TF-IDF(error_desc, 1-2 grams, 4k features) +
LogisticRegression. Text alone reached 0.987 macro-F1; tabular features
added no lift and RandomForest was 10x slower at inference for -0.004.
error_code is excluded so the model generalises to novel codes.

Usage:
    python backend/ml/train.py
Output:
    backend/ml/upi_failure_model.joblib  (sklearn Pipeline, predict-ready)
"""

from __future__ import annotations

import sys
import time
from pathlib import Path

import joblib
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline

REPO_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPO_ROOT))

ML_DIR = Path(__file__).resolve().parent
DATA_PATH = ML_DIR / "data" / "upi_failures.csv"
MODEL_PATH = ML_DIR / "upi_failure_model.joblib"


def build_pipeline() -> Pipeline:
    return Pipeline(
        [
            ("tfidf", TfidfVectorizer(ngram_range=(1, 2), max_features=4000)),
            ("clf", LogisticRegression(max_iter=1000)),
        ]
    )


def main() -> None:
    df = pd.read_csv(DATA_PATH)
    X = df["error_desc"].astype(str)
    y = df["label"]
    pipe = build_pipeline()
    t0 = time.perf_counter()
    pipe.fit(X, y)
    print(f"trained on {len(df)} rows in {time.perf_counter() - t0:.1f}s")
    joblib.dump(pipe, MODEL_PATH)
    print(f"saved -> {MODEL_PATH} ({MODEL_PATH.stat().st_size / 1024:.0f} KB)")
    print("classes:", list(pipe.classes_))


if __name__ == "__main__":
    main()
