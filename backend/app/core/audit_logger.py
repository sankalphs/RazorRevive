import csv
import io
from typing import List, Optional, Dict, Any
from ..models.schemas import AuditLogEntry, RecoveryStatus, FailureCategory, InterventionType

class AuditLogger:
    """
    In-memory thread-safe chronological audit ledger for RazorRevive.
    Tracks every event, AI diagnosis, compliance check, and final settlement.
    """
    def __init__(self):
        self._entries: List[AuditLogEntry] = []

    def record(self, entry: AuditLogEntry) -> AuditLogEntry:
        self._entries.append(entry)
        return entry

    def get_all(self, limit: int = 100, offset: int = 0) -> List[AuditLogEntry]:
        # Return newest first
        reversed_list = list(reversed(self._entries))
        return reversed_list[offset : offset + limit]

    def count(self) -> int:
        return len(self._entries)

    def clear(self):
        self._entries.clear()

    def filter(
        self,
        status: Optional[RecoveryStatus] = None,
        intervention: Optional[InterventionType] = None,
        category: Optional[FailureCategory] = None,
        search: Optional[str] = None,
        limit: int = 100
    ) -> List[AuditLogEntry]:
        results = []
        search_lower = search.lower() if search else None

        for entry in reversed(self._entries):
            if status and entry.final_status != status:
                continue
            if intervention and entry.intervention != intervention:
                continue
            if category and entry.diagnosis.category != category:
                continue
            if search_lower:
                match_id = search_lower in entry.transaction_id.lower()
                match_merch = search_lower in entry.merchant_name.lower()
                match_event = search_lower in entry.event.lower()
                if not (match_id or match_merch or match_event):
                    continue
            results.append(entry)
            if len(results) >= limit:
                break

        return results

    def export_csv(self) -> str:
        """Exports full audit trail as an RFC-4180 compliant CSV string."""
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Header
        writer.writerow([
            "Audit ID",
            "Transaction ID",
            "Timestamp (IST)",
            "Merchant",
            "Amount at Risk (INR)",
            "Amount Recovered (INR)",
            "Cost Incurred (INR)",
            "Final Status",
            "Failure Category",
            "Root Cause",
            "Confidence",
            "Intervention",
            "Compliance Passed",
            "Compliance Notes",
            "Settlement Reference"
        ])

        for e in self._entries:
            writer.writerow([
                e.id,
                e.transaction_id,
                e.timestamp,
                e.merchant_name,
                f"{e.amount_at_risk:.2f}",
                f"{e.amount_recovered:.2f}",
                f"{e.cost_incurred:.2f}",
                e.final_status.value,
                e.diagnosis.category.value,
                e.diagnosis.root_cause,
                f"{e.diagnosis.confidence:.2f}",
                e.intervention.value,
                "YES" if e.compliance.is_compliant else "NO",
                e.compliance.reason,
                e.settlement_ref or "N/A"
            ])

        return output.getvalue()

# Global singleton
audit_logger = AuditLogger()
