import threading
import asyncio
from fastapi import APIRouter
from ..models.schemas import BatchSimulationRequest, BatchSummary
from ..simulation.batch_runner import BatchSimulationEngine

router = APIRouter(prefix="/api/batch", tags=["Batch Simulation"])

# Cached or latest batch summary — guarded by a lock, never touched directly.
_latest_summary: BatchSummary = None
_latest_lock = threading.Lock()


def _get_latest() -> BatchSummary | None:
    with _latest_lock:
        return _latest_summary


def _set_latest(summary: BatchSummary) -> None:
    global _latest_summary
    with _latest_lock:
        _latest_summary = summary


# Serializes cold-start simulation so concurrent first calls cannot
# double-run the demo batch (the lock only guards the cache itself).
_cold_start_lock = asyncio.Lock()

@router.post("/simulate", response_model=BatchSummary)
async def run_batch_simulation(req: BatchSimulationRequest):
    # Cap batch size safely between 10 and 500
    safe_size = max(10, min(req.batch_size, 500))
    summary = await BatchSimulationEngine.run_batch_simulation(
        size=safe_size,
        vertical_mix=req.vertical_mix,
        enable_llm=req.enable_llm
    )
    _set_latest(summary)
    return summary

@router.get("/latest", response_model=BatchSummary)
async def get_latest_batch():
    cached = _get_latest()
    if not cached:
        async with _cold_start_lock:
            cached = _get_latest()
            if not cached:
                # Run a default realistic 100-txn batch on initial start
                cached = await BatchSimulationEngine.run_batch_simulation(size=100, enable_llm=False)
                _set_latest(cached)
    return cached
