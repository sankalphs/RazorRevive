import { useState, useEffect, Fragment } from 'react';
import { Shield, Search, Download, CheckCircle, XCircle, Clock, ChevronDown, ChevronUp, FileText } from 'lucide-react';
import { type AuditLogEntry, fetchAuditTrail } from '../services/api';

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
        console.error('Audit trail load error:', err);
        setLoading(false);
      });
  }, [statusFilter, interventionFilter]);

  const toggleRow = (id: string) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'RECOVERED':
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center space-x-1">
            <CheckCircle className="w-3 h-3" />
            <span>Recovered</span>
          </span>
        );
      case 'STOPPED_GUARDRAIL':
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30 flex items-center space-x-1">
            <XCircle className="w-3 h-3" />
            <span>Stopped (Guardrail)</span>
          </span>
        );
      case 'P2P_SCHEDULED':
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center space-x-1">
            <Clock className="w-3 h-3" />
            <span>P2P Scheduled</span>
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/30">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="bg-[#101828] border border-[#1E2E52] rounded-2xl p-6 shadow-xl space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <Shield className="w-5 h-5 text-emerald-400" />
            <span>Compliance &amp; Recovery Audit Ledger</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Immutable, chronological decision logs of every recovery intervention, LLM diagnosis, and compliance certification.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search txn ID or merchant..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setLoading(true);
                  fetchAuditTrail(statusFilter, interventionFilter, search)
                    .then((data) => {
                      setEntries(data);
                      setLoading(false);
                    })
                    .catch((err) => {
                      console.error('Audit trail load error:', err);
                      setLoading(false);
                    });
                }
              }}
              className="bg-[#162238] border border-[#1E2E52] rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#3395FF]"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#162238] border border-[#1E2E52] rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-[#3395FF]"
          >
            <option value="ALL">All Statuses</option>
            <option value="RECOVERED">Recovered</option>
            <option value="STOPPED_GUARDRAIL">Stopped (Guardrail)</option>
            <option value="P2P_SCHEDULED">P2P Scheduled</option>
            <option value="IN_PROGRESS">In Progress</option>
          </select>

          {/* Intervention Filter */}
          <select
            value={interventionFilter}
            onChange={(e) => setInterventionFilter(e.target.value)}
            className="bg-[#162238] border border-[#1E2E52] rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-[#3395FF]"
          >
            <option value="ALL">All Interventions</option>
            <option value="SMART_MANDATE_RETRY">Mandate Retry</option>
            <option value="HINGLISH_VOICE_P2P">Hinglish Voice P2P</option>
            <option value="WHATSAPP_MAGIC_LINK">WhatsApp Link</option>
            <option value="CHECKOUT_DYNAMIC_OFFER">Dynamic Offer</option>
            <option value="B2B_COMPLIANT_DUNNING">B2B Dunning</option>
            <option value="HARD_STOP_NO_ACTION">Hard Stop</option>
          </select>

          {/* CSV Download Button */}
          <a
            href="/api/audit/csv"
            download
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#162238] hover:bg-[#1E2E52] border border-[#1E2E52] text-xs font-semibold text-slate-200 rounded-xl transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export CSV</span>
          </a>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="overflow-x-auto border border-[#1E2E52] rounded-xl">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-[#0D1527] text-slate-400 uppercase text-[10px] font-semibold tracking-wider border-b border-[#1E2E52]">
            <tr>
              <th className="px-4 py-3">Transaction ID</th>
              <th className="px-4 py-3">Merchant</th>
              <th className="px-4 py-3">Amount at Risk</th>
              <th className="px-4 py-3">Intervention Type</th>
              <th className="px-4 py-3">Compliance Check</th>
              <th className="px-4 py-3">Final Status</th>
              <th className="px-4 py-3">Amount Recovered</th>
              <th className="px-4 py-3 text-right">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1E2E52]">
            {loading ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                  Loading audit trail records...
                </td>
              </tr>
            ) : entries.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                  No audit trail records found. Execute a batch simulation or fire a webhook to generate logs.
                </td>
              </tr>
            ) : (
              entries.map((e) => {
                const isExpanded = expandedRow === e.id;
                return (
                  <Fragment key={e.id}>
                    <tr className="hover:bg-[#162238]/50 transition-colors">
                      <td className="px-4 py-3 font-mono text-[11px] text-blue-400">{e.transaction_id}</td>
                      <td className="px-4 py-3 font-medium text-white">{e.merchant_name}</td>
                      <td className="px-4 py-3 font-bold text-white">₹{e.amount_at_risk.toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-[11px] text-slate-300">
                          {e.intervention.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {e.compliance.is_compliant ? (
                          <span className="text-emerald-400 flex items-center space-x-1">
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Passed</span>
                          </span>
                        ) : (
                          <span className="text-rose-400 flex items-center space-x-1">
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Guardrail Triggered</span>
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">{getStatusBadge(e.final_status)}</td>
                      <td className="px-4 py-3 font-bold text-emerald-400">
                        {e.amount_recovered > 0 ? `₹${e.amount_recovered.toLocaleString('en-IN')}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => toggleRow(e.id)}
                          className="p-1 rounded hover:bg-[#1E2E52] text-slate-400 hover:text-white transition-colors"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </td>
                    </tr>

                    {/* Expandable Decision Drawer */}
                    {isExpanded && (
                      <tr className="bg-[#0A1020]/90">
                        <td colSpan={8} className="px-6 py-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                            {/* Diagnosis Box */}
                            <div className="p-3 rounded-xl bg-[#162238] border border-[#1E2E52] space-y-1">
                              <div className="font-bold text-white flex items-center space-x-1.5 mb-1 text-[11px] uppercase tracking-wider text-purple-400">
                                <FileText className="w-3.5 h-3.5" />
                                <span>AI Root-Cause Diagnosis</span>
                              </div>
                              <p className="text-slate-300">
                                <strong>Category:</strong> {e.diagnosis.category}
                              </p>
                              <p className="text-slate-300">
                                <strong>Root Cause:</strong> {e.diagnosis.root_cause}
                              </p>
                              <p className="text-slate-400 text-[11px] italic">
                                "{e.diagnosis.ai_reasoning}"
                              </p>
                            </div>

                            {/* Compliance Box */}
                            <div className="p-3 rounded-xl bg-[#162238] border border-[#1E2E52] space-y-1">
                              <div className="font-bold text-white flex items-center space-x-1.5 mb-1 text-[11px] uppercase tracking-wider text-blue-400">
                                <Shield className="w-3.5 h-3.5" />
                                <span>Compliance Certification</span>
                              </div>
                              <p className="text-slate-300">
                                <strong>RBI Hours (08-19 IST):</strong>{' '}
                                {e.compliance.rbi_hours_ok ? 'Compliant' : 'Deferred'}
                              </p>
                              <p className="text-slate-300">
                                <strong>Touchpoint Ceiling:</strong>{' '}
                                {e.compliance.within_touch_limit ? 'Within limit (<3)' : 'Exhausted'}
                              </p>
                              <p className="text-slate-300">
                                <strong>DND &amp; Hardship:</strong>{' '}
                                {e.compliance.dnd_clear && e.compliance.dispute_clear ? 'Clear' : 'Suppressed'}
                              </p>
                              <p className="text-[11px] text-slate-400">{e.compliance.reason}</p>
                            </div>

                            {/* Action & Settlement Box */}
                            <div className="p-3 rounded-xl bg-[#162238] border border-[#1E2E52] space-y-1">
                              <div className="font-bold text-white flex items-center space-x-1.5 mb-1 text-[11px] uppercase tracking-wider text-emerald-400">
                                <CheckCircle className="w-3.5 h-3.5" />
                                <span>Settlement Reference</span>
                              </div>
                              <p className="text-slate-300 font-mono text-[11px]">
                                {e.settlement_ref ? e.settlement_ref : 'No settlement (Stopped / Pending)'}
                              </p>
                              <p className="text-slate-300">
                                <strong>Operational Cost:</strong> ₹{e.cost_incurred.toFixed(2)}
                              </p>
                              <p className="text-slate-400 text-[11px]">
                                Timestamp: {e.timestamp}
                              </p>
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
    </div>
  );
};
