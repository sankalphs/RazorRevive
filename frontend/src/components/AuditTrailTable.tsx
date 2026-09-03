import { useState, useEffect, Fragment } from 'react';
import { Search, Download, ChevronDown, ChevronUp } from 'lucide-react';
import { type AuditLogEntry, fetchAuditTrail } from '../services/api';
import { StationHeader, formatINR, StatusReadout, ComplianceReadout, stateInk } from './telemetry';

/* ============================================================
   STA-04 · MISSION LOG
   The immutable ledger as a flight log: mono row stamps,
   one ink per state, expandable decision record showing the
   diagnosis, the compliance certification, and the settlement.
   ============================================================ */

export const AuditTrailTable = () => {
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [interventionFilter, setInterventionFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetchAuditTrail(statusFilter, interventionFilter, search)
      .then((data) => {
        setEntries(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Mission log error:', err);
        setLoading(false);
      });
  }, [statusFilter, interventionFilter]);

  const applySearch = () => {
    setLoading(true);
    fetchAuditTrail(statusFilter, interventionFilter, search)
      .then((data) => {
        setEntries(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Mission log error:', err);
        setLoading(false);
      });
  };

  return (
    <section className="panel-graticule" aria-label="Compliance audit ledger">
      <StationHeader
        code="STA-04 · MISSION LOG"
        title="Compliance & Recovery Audit Ledger"
        subtitle="Immutable, chronological record of every recovery decision: LLM root-cause diagnosis, guardrail certification, and settlement reference. Append-only; exportable as evidence."
        right={
          <a
            href="/api/audit/csv"
            download
            className="numeric text-[10px] tracking-wider border border-[#1C3245] text-[#7C93A6] hover:text-[#2EFF7B] hover:border-[#2EFF7B]/60 px-3 py-2 transition-colors flex items-center gap-2"
          >
            <Download className="w-3.5 h-3.5" />
            EXPORT CSV
          </a>
        }
      />

      {/* Log filters */}
      <div className="border-b border-[#1C3245] px-4 sm:px-5 py-3 flex flex-wrap items-center gap-2.5">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#6A8296]" />
          <input
            type="text"
            placeholder="QUERY TXN ID / MERCHANT"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && applySearch()}
            className="station-input pl-8 pr-3 py-1.5 text-[11px] w-56 caret-signal"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="station-select px-3 py-1.5 text-[11px]"
          aria-label="Filter by status"
        >
          <option value="ALL">ALL STATES</option>
          <option value="RECOVERED">RECOVERED</option>
          <option value="STOPPED_GUARDRAIL">RANGE STOP</option>
          <option value="P2P_SCHEDULED">P2P LOCKED</option>
          <option value="IN_PROGRESS">IN PROGRESS</option>
        </select>
        <select
          value={interventionFilter}
          onChange={(e) => setInterventionFilter(e.target.value)}
          className="station-select px-3 py-1.5 text-[11px]"
          aria-label="Filter by intervention"
        >
          <option value="ALL">ALL INTERVENTIONS</option>
          <option value="SMART_MANDATE_RETRY">MANDATE RETRY</option>
          <option value="HINGLISH_VOICE_P2P">HINGLISH VOICE P2P</option>
          <option value="WHATSAPP_MAGIC_LINK">WHATSAPP LINK</option>
          <option value="CHECKOUT_DYNAMIC_OFFER">DYNAMIC OFFER</option>
          <option value="B2B_COMPLIANT_DUNNING">B2B DUNNING</option>
          <option value="HARD_STOP_NO_ACTION">HARD STOP</option>
        </select>
        <span className="numeric text-[10px] text-[#6A8296] tracking-wider ml-auto">
          {loading ? 'SYNCING…' : `${entries.length} RECORDS`}
        </span>
      </div>

      {/* Telemetry table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-[#0D1524] numeric text-[9px] tracking-[0.18em] text-[#6A8296] border-b border-[#1C3245]">
              <th className="px-4 py-2.5 font-medium">TXN</th>
              <th className="px-4 py-2.5 font-medium">MERCHANT</th>
              <th className="px-4 py-2.5 font-medium text-right">AT RISK</th>
              <th className="px-4 py-2.5 font-medium">INTERVENTION</th>
              <th className="px-4 py-2.5 font-medium">GUARDRAIL</th>
              <th className="px-4 py-2.5 font-medium">STATE</th>
              <th className="px-4 py-2.5 font-medium text-right">RECOVERED</th>
              <th className="px-4 py-2.5 font-medium text-right sr-only">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#12202F]">
            {loading ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center numeric text-[11px] text-[#6A8296] tracking-wider">
                  ACQUIRING LOG RECORDS…
                </td>
              </tr>
            ) : entries.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center numeric text-[11px] text-[#6A8296] tracking-wider">
                  LOG EMPTY · EXECUTE A BATCH LAUNCH OR DISPATCH A WEBHOOK TO GENERATE RECORDS
                </td>
              </tr>
            ) : (
              entries.map((e) => {
                const isExpanded = expandedRow === e.id;
                return (
                  <Fragment key={e.id}>
                    <tr className={`transition-colors ${isExpanded ? 'bg-[#2EFF7B]/[0.03]' : 'hover:bg-[#0D1524]/80'}`}>
                      <td className="px-4 py-2.5 numeric text-[11px] text-[#2EFF7B]">{e.transaction_id}</td>
                      <td className="px-4 py-2.5 text-[#CFE4F2]">{e.merchant_name}</td>
                      <td className="px-4 py-2.5 numeric text-right text-[#CFE4F2]">
                        {formatINR(e.amount_at_risk)}
                      </td>
                      <td className="px-4 py-2.5 numeric text-[10px] tracking-wider text-[#7C93A6]">
                        {e.intervention.replace(/_/g, ' ')}
                      </td>
                      <td className="px-4 py-2.5">
                        <ComplianceReadout ok={e.compliance.is_compliant} />
                      </td>
                      <td className="px-4 py-2.5">
                        <StatusReadout status={e.final_status} />
                      </td>
                      <td className="px-4 py-2.5 numeric text-right text-[#2EFF7B]">
                        {e.amount_recovered > 0 ? formatINR(e.amount_recovered) : '—'}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <button
                          onClick={() => setExpandedRow(isExpanded ? null : e.id)}
                          aria-expanded={isExpanded}
                          aria-label={isExpanded ? 'Collapse decision record' : 'Expand decision record'}
                          className="p-1 text-[#6A8296] hover:text-[#2EFF7B] transition-colors"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </td>
                    </tr>

                    {/* Decision record */}
                    {isExpanded && (
                      <tr className="bg-[#05080F]/70">
                        <td colSpan={8} className="px-4 sm:px-6 py-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {/* Diagnosis */}
                            <div className="border border-[#1C3245] bg-[#0D1524]/60 px-3.5 py-3">
                              <div className="numeric text-[9px] tracking-[0.2em] text-[#7C93A6] mb-2">
                                DIAGNOSIS · {e.diagnosis.category}
                              </div>
                              <div className="text-[11px] text-[#CFE4F2] leading-relaxed">{e.diagnosis.root_cause}</div>
                              <p className="numeric text-[10px] text-[#6A8296] leading-relaxed mt-2 border-t border-[#1C3245] pt-2">
                                {e.diagnosis.ai_reasoning}
                              </p>
                            </div>

                            {/* Compliance certification */}
                            <div className="border border-[#1C3245] bg-[#0D1524]/60 px-3.5 py-3">
                              <div className="numeric text-[9px] tracking-[0.2em] text-[#7C93A6] mb-2">
                                COMPLIANCE CERTIFICATION
                              </div>
                              <div className="space-y-1.5 numeric text-[10px]">
                                {[
                                  { label: 'RBI HOURS 08—19 IST', ok: e.compliance.rbi_hours_ok },
                                  { label: 'TOUCHPOINT ↤3 / 7D', ok: e.compliance.within_touch_limit },
                                  { label: 'NO HARD DECLINE', ok: e.compliance.not_hard_declined },
                                  { label: 'DND / HARDSHIP CLEAR', ok: e.compliance.dnd_clear },
                                  { label: 'DISPUTE CLEAR', ok: e.compliance.dispute_clear },
                                ].map((check) => (
                                  <div key={check.label} className="flex items-center justify-between">
                                    <span className="text-[#7C93A6]">{check.label}</span>
                                    <ComplianceReadout ok={Boolean(check.ok)} />
                                  </div>
                                ))}
                              </div>
                              <p className="text-[10px] text-[#6A8296] leading-relaxed mt-2 border-t border-[#1C3245] pt-2">
                                {e.compliance.reason}
                              </p>
                            </div>

                            {/* Settlement */}
                            <div className="border border-[#1C3245] bg-[#0D1524]/60 px-3.5 py-3">
                              <div className="numeric text-[9px] tracking-[0.2em] text-[#7C93A6] mb-2">
                                SETTLEMENT
                              </div>
                              <div className={`numeric text-[11px] ${stateInk(e.final_status).phosphor || 'text-[#CFE4F2]'}`}>
                                {e.settlement_ref ?? 'NONE · STOPPED OR PENDING'}
                              </div>
                              <div className="space-y-1.5 numeric text-[10px] text-[#7C93A6] mt-3 border-t border-[#1C3245] pt-2">
                                <div className="flex justify-between">
                                  <span>OPERATING COST</span>
                                  <span className="text-[#CFE4F2]">₹{e.cost_incurred.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>LOGGED AT</span>
                                  <span className="text-[#CFE4F2]">{e.timestamp}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};
