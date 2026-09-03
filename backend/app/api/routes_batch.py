from fastapi import APIRouter
from ..models.schemas import BatchSimulationRequest, BatchSummary
from ..simulation.batch_runner import BatchSimulationEngine

router = APIRouter(prefix="/api/batch", tags=["Batch Simulation"])

# Cached or latest batch summary
latest_summary: BatchSummary = None

@router.post("/simulate", response_model=BatchSummary)
async def run_batch_simulation(req: BatchSimulationRequest):
    global latest_summary
    # Cap batch size safely between 10 and 500
    safe_size = max(10, min(req.batch_size, 500))
    summary = await BatchSimulationEngine.run_batch_simulation(
        size=safe_size,
        vertical_mix=req.vertical_mix,
        enable_llm=req.enable_llm
    )
    latest_summary = summary
    return summary

@router.get("/latest", response_model=BatchSummary)
async def get_latest_batch():
    global latest_summary
    if not latest_summary:
        # Run a default realistic 100-txn batch on initial start
        latest_summary = await BatchSimulationEngine.run_batch_simulation(size=100, enable_llm=False)
    return latest_summary
