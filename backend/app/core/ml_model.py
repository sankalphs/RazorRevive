"""Local ML fallback for failure diagnosis (MiniMax-M3 student).

Loads the 37KB TF-IDF + LogisticRegression pipeline trained in backend/ml
(ablation winner: 0.987 macro-F1, ~0.02ms/row on CPU). Pure offline, no key,
no network — it sits between the exact rule match and the keyword heuristics:

    known error_code -> DETERMINISTIC_RULES (unchanged, 0.96 conf)
    novel/paraphrased text -> ML classifier (if conf >= threshold)
    anything else -> keyword heuristics (unchanged)

A missing model file or missing sklearn never blocks recovery: ml_diagnose
returns None and callers fall through to the heuristics.
"""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Optional

logger = logging.getLogger("RazorRevive.MLDiagnosis")

MODEL_PATH = Path(__file__).resolve().parents[2] / "ml" / "upi_failure_model.joblib"
MIN_CONFIDENCE = 0.70

_model = None
_model_failed = False


def _load_model():
    global _model, _model_failed
    if _model is not None or _model_failed:
        return _model
    try:
        import joblib

        if not MODEL_PATH.exists():
            logger.info("ML model file missing (%s); heuristics only.", MODEL_PATH)
            _model_failed = True
            return None
        _model = joblib.load(MODEL_PATH)
        logger.info("Loaded local ML diagnosis model (%s).", MODEL_PATH.name)
    except Exception as e:  # sklearn missing, corrupt file, version skew
        logger.warning("ML model unavailable (%s); heuristics only.", e)
        _model_failed = True
        return None
    return _model


# Category -> (recommended action, retry delay hrs), mirroring the rule table.
_ACTION_BY_CATEGORY = {
    "TRANSIENT_TECHNICAL": ("SMART_MANDATE_RETRY", 2),
    "SOFT_FINANCIAL": ("HINGLISH_VOICE_P2P", 24),
    "HARD_PERMANENT": ("HARD_STOP_NO_ACTION", 0),
    "BEHAVIORAL_DROPOFF": ("CHECKOUT_DYNAMIC_OFFER", 0),
    "COMMERCIAL_DISPUTE": ("B2B_COMPLIANT_DUNNING", 0),
}


def ml_diagnose(txn) -> Optional["DiagnosisResult"]:
    """Predicts the failure category from gateway text. Returns None when
    the model is unavailable so callers can fall through to heuristics."""
    # Local imports: keeps core importable without sklearn installed.
    from ..models.schemas import DiagnosisResult, FailureCategory, InterventionType

    model = _load_model()
    if model is None:
        return None
    text = (txn.razorpay_error_desc or txn.razorpay_error_code or "").strip()
    if not text:
        return None
    try:
        proba = model.predict_proba([text])[0]
        best = int(proba.argmax())
        label = str(model.classes_[best])
        confidence = float(proba[best])
    except Exception as e:
        logger.warning("ML inference failed (%s); heuristics only.", e)
        return None
    if confidence < MIN_CONFIDENCE or label not in _ACTION_BY_CATEGORY:
        return None
    action_name, delay = _ACTION_BY_CATEGORY[label]
    return DiagnosisResult(
        category=FailureCategory(label),
        root_cause=text,
        confidence=round(confidence, 3),
        recommended_action=InterventionType(action_name),
        ai_reasoning=(
            f"Local ML classifier (TF-IDF+LogReg, ablation macro-F1 0.987) "
            f"predicted {label} at confidence {confidence:.2f} from gateway text."
        ),
        recommended_retry_delay_hours=delay,
    )
