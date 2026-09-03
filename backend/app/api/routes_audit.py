from fastapi import APIRouter, Query, Response
from typing import List, Optional
from ..models.schemas import AuditLogEntry, RecoveryStatus, InterventionType, FailureCategory
from ..core.audit_logger import audit_logger

router = APIRouter(prefix="/api/audit", tags=["Audit Trail"])

@router.get("", response_model=List[AuditLogEntry])
async def get_audit_trail(
    status: Optional[RecoveryStatus] = None,
    intervention: Optional[InterventionType] = None,
    category: Optional[FailureCategory] = None,
    search: Optional[str] = None,
    limit: int = Query(default=100, le=500),
    offset: int = 0
):
    if status or intervention or category or search:
        return audit_logger.filter(
            status=status,
            intervention=intervention,
            category=category,
            search=search,
            limit=limit
        )
    return audit_logger.get_all(limit=limit, offset=offset)

@router.get("/csv")
async def download_audit_csv():
    csv_content = audit_logger.export_csv()
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=razorrevive_audit_trail.csv"}
    )

@router.get("/stats")
async def get_audit_stats():
    entries = audit_logger.get_all(limit=1000)
    total_at_risk = sum(e.amount_at_risk for e in entries)
    total_recovered = sum(e.amount_recovered for e in entries)
    stopped_count = sum(1 for e in entries if e.final_status == RecoveryStatus.STOPPED_GUARDRAIL)
    recovered_count = sum(1 for e in entries if e.final_status == RecoveryStatus.RECOVERED)
    
    return {
        "total_records": len(entries),
        "total_at_risk_inr": round(total_at_risk, 2),
        "total_recovered_inr": round(total_recovered, 2),
        "recovered_count": recovered_count,
        "guardrail_stops_count": stopped_count,
        "recovery_rate_pct": round((total_recovered / total_at_risk * 100.0), 2) if total_at_risk > 0 else 0.0
    }
