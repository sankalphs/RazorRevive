import { useState, useEffect, Fragment } from 'react';
import { Search, Download, ChevronDown, ChevronUp } from 'lucide-react';
import { type AuditLogEntry, fetchAuditTrail } from '../services/api';
import { PanelHeader, formatINR, StatusBadge, ComplianceBadge, DecisionRecord, humanizeIntervention, AUDIT_CSV_URL } from './telemetry';

/* ============================================================
   AUDIT LEDGER — every decision the engine made, why it
   made it, and whether it passed the safety rules. Rows
   expand into the full decision record.
   ============================================================ */

export const AuditTrailTable = () => {
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [interventionFilter, setInterventionFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setFailed(false);
    fetchAuditTrail(statusFilter, interventionFilter, search)
      .then((data) => {
        setEntries(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Audit log error:', err);
        setFailed(true);
        setLoading(false);
      });
  }, [statusFilter, interventionFilter]);

  const applySearch = () => {
    setLoading(true);
    setFailed(false);
    fetchAuditTrail(statusFilter, interventionFilter, search)
      .then((data) => {
        setEntries(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Audit log error:', err);
        setFailed(true);
        setLoading(false);
      });
  };

  return (
    <section className="bg-white border border-line rounded-xl shadow-card" aria-label="Audit ledger">
      <PanelHeader
        title="Audit ledger"
        subtitle="Every recovery decision, in order: the AI's diagnosis, the safety checks it passed, and the settlement. Exportable as CSV evidence."
        right={
          <a
            href={AUDIT_CSV_URL}
            download
            className="flex items-center gap-2 text-[12.5px] font-medium border border-line-strong text-ink-2 hover:text-accent hover:border-accent/50 px-3 py-2 rounded-lg transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </a>
        }
      />

      {/* Filters */}
      <div className="border-b border-line px-5 py-3 flex flex-wrap items-center gap-2.5">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-4" />
          <input
            type="text"
            placeholder="Search transaction or merchant…"
            aria-label="Search audit ledger"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && applySearch()}
            className="field pl-8 pr-3 py-1.5 text-[13px] w-60 caret-accent"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="field px-3 py-1.5 text-[13px]"
          aria-label="Filter by status"
        >
          <option value="ALL">All outcomes</option>
          <option value="RECOVERED">Recovered</option>
          <option value="STOPPED_GUARDRAIL">Stopped by safety rule</option>
          <option value="P2P_SCHEDULED">Promise to pay</option>
          <option value="IN_PROGRESS">In progress</option>
        </select>
        <select
          value={interventionFilter}
          onChange={(e) => setInterventionFilter(e.target.value)}
          className="field px-3 py-1.5 text-[13px]"
          aria-label="Filter by action"
        >
          <option value="ALL">All actions</option>
          <option value="SMART_MANDATE_RETRY">Smart mandate retry</option>
          <option value="HINGLISH_VOICE_P2P">Hinglish voice agent</option>
          <option value="WHATSAPP_MAGIC_LINK">WhatsApp payment link</option>
          <option value="CHECKOUT_DYNAMIC_OFFER">Checkout offer</option>
          <option value="B2B_COMPLIANT_DUNNING">B2B invoice follow-up</option>
          <option value="HARD_STOP_NO_ACTION">No action (stopped)</option>
        </select>
        <span className="text-[12.5px] text-ink-3 ml-auto numeric">
          {loading ? 'Loading…' : `${entries.length} records`}
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto max-w-full [contain:paint]">
        <table className="w-full text-left text-[13px]">
          <thead>
            <tr className="bg-page text-[12px] font-medium text-ink-3 border-b border-line">
              <th className="px-5 py-2.5 font-medium">Transaction</th>
              <th className="px-4 py-2.5 font-medium">Merchant</th>
              <th className="px-4 py-2.5 font-medium text-right">At risk</th>
              <th className="px-4 py-2.5 font-medium">Action</th>
              <th className="px-4 py-2.5 font-medium">Safety</th>
              <th className="px-4 py-2.5 font-medium">Outcome</th>
              <th className="px-4 py-2.5 font-medium text-right">Recovered</th>
              <th className="px-4 py-2.5 text-right sr-only">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {loading ? (
              <tr>
                <td colSpan={8} className="px-5 py-12 text-center text-[13px] text-ink-3">
                  Loading records…
                </td>
              </tr>
            ) : failed ? (
              <tr>
                <td colSpan={8} className="px-5 py-12 text-center">
                  <div className="text-[13.5px] font-semibold text-bad">Can't load the ledger</div>
                  <p className="text-[13px] text-ink-3 mt-1">
                    The audit service isn't responding. Start the backend on port 8000 and reload.
                  </p>
                </td>
              </tr>
            ) : entries.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-5 py-12 text-center text-[13px] text-ink-3">
                  No records yet — run a simulation or send a webhook to generate some.
                </td>
              </tr>
            ) : (
              entries.map((e) => {
                const isExpanded = expandedRow === e.id;
                return (
                  <Fragment key={e.id}>
                    <tr className={`transition-colors ${isExpanded ? 'bg-accent-soft/60' : 'hover:bg-page'}`}>
                      <td className="px-5 py-2.5 numeric text-[12.5px] text-ink font-medium">{e.transaction_id}</td>
                      <td className="px-4 py-2.5 text-ink">{e.merchant_name}</td>
                      <td className="px-4 py-2.5 numeric text-right text-ink">{formatINR(e.amount_at_risk)}</td>
                      <td className="px-4 py-2.5 text-[12.5px] text-ink-3">
                        {humanizeIntervention(e.intervention)}
                      </td>
                      <td className="px-4 py-2.5">
                        <ComplianceBadge ok={e.compliance.is_compliant} />
                      </td>
                      <td className="px-4 py-2.5">
                        <StatusBadge status={e.final_status} />
                      </td>
                      <td className="px-4 py-2.5 numeric text-right text-ok font-medium">
                        {e.amount_recovered > 0 ? formatINR(e.amount_recovered) : '—'}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <button
                          onClick={() => setExpandedRow(isExpanded ? null : e.id)}
                          aria-expanded={isExpanded}
                          aria-label={isExpanded ? 'Hide decision details' : 'Show decision details'}
                          className="p-1.5 text-ink-4 hover:text-accent hover:bg-accent-soft rounded-md transition-colors"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </td>
                    </tr>

                    {/* Decision record — one shared shape */}
                    {isExpanded && (
                      <tr className="bg-page">
                        <td colSpan={8} className="px-5 sm:px-8 py-4">
                          <DecisionRecord record={e} />
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
