import csv
import io
import threading
from typing import List, Optional, Dict, Any
from ..models.schemas import AuditLogEntry, RecoveryStatus, FailureCategory, InterventionType

class AuditLogger:
    """
    Deep Audit Ledger module: one interface owns every stored row.

    Ordering contract (documented once, here):
    - reads (get_all / filter / all_entries) return newest-first;
    - export_csv writes oldest-first chronological order for evidence.
    All state changes hold an internal lock; callers never touch the rows.
    """
    def __init__(self):
        self._entries: List[AuditLogEntry] = []
        self._lock = threading.Lock()

    def record(self, entry: AuditLogEntry) -> AuditLogEntry:
        with self._lock:
            self._entries.append(entry)
        return entry

    def get_all(self, limit: int = 100, offset: int = 0) -> List[AuditLogEntry]:
        # Newest-first snapshot under lock; delegates to the single filter path.
        return self.filter(limit=limit, offset=offset)

    def all_entries(self) -> List[AuditLogEntry]:
        """Full ledger, newest first, for aggregate statistics."""
        with self._lock:
            return list(reversed(self._entries))

    def count(self) -> int:
        with self._lock:
            return len(self._entries)

    def clear(self):
        with self._lock:
            self._entries.clear()

    def filter(
        self,
        status: Optional[RecoveryStatus] = None,
        intervention: Optional[InterventionType] = None,
        category: Optional[FailureCategory] = None,
        search: Optional[str] = None,
        limit: int = 100,
        offset: int = 0
    ) -> List[AuditLogEntry]:
        results = []
        search_lower = search.lower() if search else None

        with self._lock:
            snapshot = list(reversed(self._entries))

        for entry in snapshot:
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

        return results[offset : offset + limit]

    def export_csv(self) -> str:
        """Exports full audit trail as an RFC-4180 compliant CSV string.

        Chronological (oldest-first) so the exported evidence reads in
        event order, while paged reads stay newest-first.
        """
        with self._lock:
            snapshot = list(self._entries)
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

        for e in snapshot:
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
