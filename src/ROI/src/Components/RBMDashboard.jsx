import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { BASE_URL } from "./Forms/data/baseUrl";

// ─── Page definitions ─────────────────────────────────────────────────────────
const PAGES = [
  { name: "Basic Store Details", group: "Store Setup", icon: "🏪" },
  { name: "Store Retail Specifications", group: "Store Setup", icon: "📋" },
  { name: "Sales Planning - Ref Store Code Details", group: "Sales Planning", icon: "🔗" },
  { name: "Sales Planning - Sales Summary", group: "Sales Planning", icon: "📈" },
  { name: "Sales Planning - Stock Summary", group: "Sales Planning", icon: "📦" },
  { name: "Sales Planning - Discount", group: "Sales Planning", icon: "🏷️" },
  { name: "Capex Expenses", group: "Expense Planning", icon: "🏗️" },
  { name: "Resource Expenses", group: "Expense Planning", icon: "👥" },
  { name: "Other Expenses", group: "Expense Planning", icon: "📝" },
  { name: "Summary Expenses", group: "Expense Planning", icon: "💼" },
];

const GROUP_COLORS = {
  "Store Setup": "bg-blue-50 text-blue-700 border-blue-200",
  "Sales Planning": "bg-green-50 text-green-700 border-green-200",
  "Expense Planning": "bg-amber-50 text-amber-700 border-amber-200",
};

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CFG = {
  "Pending": { bg: "bg-green-100", text: "text-green-700", dot: "bg-green-500", label: "Completed" },
  // legacy strings
  "Submitted to RBM": { bg: "bg-blue-100", text: "text-blue-700", dot: "bg-blue-500", label: "Submitted" },
  "Approved": { bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-500", label: "Approved" },
  "Rejected": { bg: "bg-red-100", text: "text-red-700", dot: "bg-red-500", label: "Rejected" },
  "Changes Required": { bg: "bg-amber-100", text: "text-amber-700", dot: "bg-amber-500", label: "Changes Required" },
  "Not Available": { bg: "bg-gray-100", text: "text-gray-500", dot: "bg-gray-400", label: "Not Filled" },
  // new status strings
  "Submitted_toRBM": { bg: "bg-blue-100", text: "text-blue-700", dot: "bg-blue-500", label: "Submitted to RBM" },
  "BPM_Requestraised": { bg: "bg-purple-100", text: "text-purple-700", dot: "bg-purple-500", label: "BPM Request Raised" },
};

// Dynamic fallback for pattern-based statuses (Approved_by*, Rejected_by*, SK_by*)
const getCfg = (s) => {
  if (!s) return STATUS_CFG["Not Available"];
  if (STATUS_CFG[s]) return STATUS_CFG[s];
  if (s.startsWith("Approved_by")) return { bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-500", label: `Approved \u2713` };
  if (s.startsWith("Rejected_by")) return { bg: "bg-red-100", text: "text-red-700", dot: "bg-red-500", label: "Rejected" };
  if (s.startsWith("SK_by")) return { bg: "bg-amber-100", text: "text-amber-700", dot: "bg-amber-500", label: "Clarification Sought" };
  return STATUS_CFG["Not Available"];
};

function StatusBadge({ status, size = "sm" }) {
  const cfg = getCfg(status);
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-semibold whitespace-nowrap ${size === "sm" ? "text-xs" : "text-sm"} ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function daysAgo(dateStr) {
  if (!dateStr) return null;
  const d = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000);
  if (d <= 0) return "Today";
  if (d === 1) return "1 day ago";
  return `${d} days ago`;
}

function formatLabel(key) {
  return key.replace(/_/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

function formatValue(v) {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (typeof v === "object") return null;
  const n = parseFloat(v);
  if (!isNaN(n) && String(v).trim() !== "") return n.toLocaleString("en-IN", { maximumFractionDigits: 2 });
  return String(v);
}

const HIDDEN = new Set(["roiid", "roi_id", "ROIID", "status", "inserted_date", "updated_date", "username", "created_date"]);

// ─── PageRow ──────────────────────────────────────────────────────────────────
function PageRow({ page, status, onViewData, expanded, onToggle }) {
  const groupCls = GROUP_COLORS[page.group] ?? "bg-gray-50 text-gray-600 border-gray-200";
  return (
    <div className={`bg-white rounded-xl border transition-all ${expanded ? "border-indigo-200 shadow-md" : "border-slate-200 hover:border-slate-300"}`}>
      <button type="button" onClick={onToggle} className="w-full text-left px-5 py-4 flex items-center gap-3">
        <span className="text-xl">{page.icon}</span>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-slate-800 truncate">{page.name}</p>
          <span className={`text-xs font-medium px-2 py-0.5 rounded border mt-0.5 inline-block ${groupCls}`}>{page.group}</span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <StatusBadge status={status} />
          <span className={`text-slate-400 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}>▼</span>
        </div>
      </button>
      {expanded && (
        <div className="px-5 pb-5 border-t border-slate-100 pt-4">
          <button type="button" onClick={onViewData}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-sm font-semibold rounded-lg transition border border-indigo-200">
            🔍 View Page Data
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Page Data Modal ──────────────────────────────────────────────────────────
const GROUP_GRADIENT = {
  "Store Setup": "from-blue-600 to-cyan-600",
  "Sales Planning": "from-emerald-600 to-green-700",
  "Expense Planning": "from-amber-500 to-orange-600",
};

const YEARS = ["Yr 1", "Yr 2", "Yr 3", "Yr 4", "Yr 5", "Yr 6"];

// Detect comma-separated numeric strings used for 6-year projections
function parseYearly(val) {
  if (typeof val !== "string") return null;
  const parts = val.split(",");
  if (parts.length < 3) return null;
  const nums = parts.map(p => { const n = parseFloat(p.trim()); return isNaN(n) ? null : n; });
  return nums.some(n => n === null) ? null : nums;
}

const fmtN = (n) =>
  n === null || n === undefined || isNaN(n) ? "—"
    : Number(n).toLocaleString("en-IN", { maximumFractionDigits: 2 });

// ─ Renders one object row split into scalar fields + 6-year projection table
function SingleRowContent({ row }) {
  const simple = [], yearly = [], nested = [];
  for (const [k, v] of Object.entries(row)) {
    if (HIDDEN.has(k)) continue;
    if (typeof v === "object" && v !== null) { nested.push({ key: k, value: v }); continue; }
    const yv = parseYearly(String(v ?? ""));
    if (yv) yearly.push({ key: k, values: yv });
    else simple.push({ key: k, value: v });
  }
  return (
    <div className="p-6 space-y-8">
      {/* Scalar fields */}
      {simple.length > 0 && (
        <section>
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 pb-1.5 border-b border-slate-200">
            📋 Field Values
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {simple.map(({ key, value }) => {
              const fv = formatValue(value);
              const isNum = !isNaN(parseFloat(value)) && String(value ?? "").trim() !== "";
              return (
                <div key={key} className="bg-slate-50 hover:bg-white rounded-xl border border-slate-100 hover:border-indigo-200 hover:shadow-sm transition p-3">
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1 leading-tight">{formatLabel(key)}</p>
                  <p className={`text-sm font-bold break-words leading-snug ${isNum ? "text-indigo-700" : "text-slate-800"}`}>{fv ?? "—"}</p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 6-year projection table */}
      {yearly.length > 0 && (
        <section>
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 pb-1.5 border-b border-slate-200">
            📈 6-Year Projections
          </h4>
          <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
            <table className="min-w-full border-collapse text-xs">
              <thead>
                <tr className="bg-indigo-700 text-white">
                  <th className="px-4 py-2.5 text-left font-bold min-w-[200px]">Parameter</th>
                  {YEARS.map(yr => (
                    <th key={yr} className="px-4 py-2.5 text-right font-bold min-w-[90px]">{yr}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {yearly.map(({ key, values }, idx) => (
                  <tr key={key} className={idx % 2 === 0 ? "bg-white" : "bg-indigo-50"}>
                    <td className="px-4 py-2 font-semibold text-slate-700 border-b border-slate-100">{formatLabel(key)}</td>
                    {YEARS.map((_, i) => (
                      <td key={i} className="px-4 py-2 text-right font-bold text-indigo-700 border-b border-slate-100">
                        {values[i] !== undefined ? fmtN(values[i]) : "—"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Nested objects (e.g. JSON blobs) */}
      {nested.map(({ key, value }) => (
        <section key={key}>
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 pb-1.5 border-b border-slate-200">
            📌 {formatLabel(key)}
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {typeof value === "object" && !Array.isArray(value)
              ? Object.entries(value)
                .filter(([k]) => !HIDDEN.has(k))
                .map(([k, v]) => {
                  const fv = formatValue(v);
                  return fv === null ? null : (
                    <div key={k} className="bg-amber-50 rounded-xl border border-amber-100 p-3">
                      <p className="text-xs text-amber-600 font-semibold uppercase tracking-wide mb-1">{formatLabel(k)}</p>
                      <p className="text-sm font-bold text-slate-800 break-words">{fv}</p>
                    </div>
                  );
                })
              : <p className="text-sm text-slate-500 col-span-3">{JSON.stringify(value)}</p>
            }
          </div>
        </section>
      ))}
    </div>
  );
}

// ─ Renders multiple rows as a scrollable table (e.g. RESOURCE expenses, one row per role)
function MultiRowContent({ rows }) {
  const allKeys = [...new Set(rows.flatMap(r => Object.keys(r)))].filter(k => !HIDDEN.has(k));
  return (
    <div className="p-6">
      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 pb-1.5 border-b border-slate-200">
        📋 {rows.length} Record{rows.length !== 1 ? "s" : ""}
      </p>
      <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
        <table className="min-w-full border-collapse text-xs">
          <thead>
            <tr className="bg-amber-600 text-white">
              <th className="px-3 py-2.5 text-left font-bold w-8">#</th>
              {allKeys.map(k => (
                <th key={k} className="px-3 py-2.5 text-left font-bold whitespace-nowrap">{formatLabel(k)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={idx} className={idx % 2 === 0 ? "bg-white hover:bg-amber-50" : "bg-amber-50/50 hover:bg-amber-50"}>
                <td className="px-3 py-2 text-slate-400 font-bold border-b border-slate-100">{idx + 1}</td>
                {allKeys.map(k => {
                  const v = row[k];
                  const yv = parseYearly(String(v ?? ""));
                  const display = yv
                    ? yv.slice(0, 6).map(n => fmtN(n)).join(" │ ")
                    : (formatValue(v) ?? "—");
                  const isNum = !yv && !isNaN(parseFloat(v)) && String(v ?? "").trim() !== "";
                  return (
                    <td key={k} className={`px-3 py-2 border-b border-slate-100 ${isNum ? "text-indigo-700 font-bold" : "text-slate-700"}`}>
                      {display}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PageDataModal({ pageName, data, loading, onClose }) {
  const pageInfo = PAGES.find(p => p.name === pageName);
  const grad = GROUP_GRADIENT[pageInfo?.group] ?? "from-indigo-600 to-blue-700";
  // data is the full array of rows from the API
  const rows = Array.isArray(data) ? data : (data ? [data] : []);
  const totalFields = rows[0] ? Object.keys(rows[0]).filter(k => !HIDDEN.has(k)).length : 0;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden">

        {/* Gradient header */}
        <div className={`bg-gradient-to-r ${grad} px-6 py-5 shrink-0`}>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-4xl drop-shadow">{pageInfo?.icon ?? "📄"}</span>
              <div>
                <p className="text-white/60 text-xs font-semibold uppercase tracking-widest">{pageInfo?.group}</p>
                <h3 className="text-white font-bold text-xl leading-tight">{pageName}</h3>
                {rows.length > 1 && <p className="text-white/60 text-xs mt-0.5">{rows.length} records</p>}
              </div>
            </div>
            <button onClick={onClose}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/35 text-white text-xl font-bold transition shrink-0">
              ×
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="animate-spin w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full" />
              <p className="text-slate-400 text-sm">Loading complete form data…</p>
            </div>
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
              <span className="text-5xl">📭</span>
              <p className="text-sm font-medium">No data submitted for this page yet.</p>
            </div>
          ) : rows.length > 1 ? (
            <MultiRowContent rows={rows} />
          ) : (
            <SingleRowContent row={rows[0]} />
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
          <p className="text-xs text-slate-400">
            {rows.length} record{rows.length !== 1 ? "s" : ""}
            {totalFields > 0 ? ` · ${totalFields} fields` : ""}
          </p>
          <button onClick={onClose}
            className="px-5 py-2 bg-slate-700 hover:bg-slate-800 text-white text-sm font-semibold rounded-lg transition">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Action Modal (Approve / Seek Clarification / Reject) ────────────────────
// Previous level each role sends clarification TO
const CLARIFY_TARGET = {
  "RBM":        "ABM",
  "COMMERCIAL":  "RBM",
  "ADMIN":       "Commercial",
  "RETAIL":      "Admin",
};

function ActionModal({ action, roiid, userRole, onConfirm, onCancel, loading }) {
  const [remark, setRemark] = useState("");
  const needsRemark = action === "clarify" || action === "reject";
  const clarifyTarget = CLARIFY_TARGET[userRole?.toUpperCase()] ?? "previous approver";

  const cfg = {
    approve: {
      grad: "from-emerald-600 to-green-700",
      btn: "bg-emerald-600 hover:bg-emerald-700",
      icon: "✓", label: "Approve",
      desc: `Confirm approval of ROI ${roiid}. It will be forwarded to the next approver.`,
    },
    clarify: {
      grad: "from-violet-600 to-indigo-700",
      btn: "bg-violet-600 hover:bg-violet-700",
      icon: "💬", label: `Seek Clarification from ${clarifyTarget}`,
      desc: `Add your remark below. It will be sent to ${clarifyTarget} for resolution.`,
      placeholder: `Describe what needs clarification from ${clarifyTarget}…`,
      remarkLabel: "Clarification Remark",
    },
    reject: {
      grad: "from-red-600 to-rose-700",
      btn: "bg-red-600 hover:bg-red-700",
      icon: "✗", label: "Reject",
      desc: `Provide a reason for rejecting ROI ${roiid}. The ABM will be notified.`,
      placeholder: "Explain why this ROI is being rejected…",
      remarkLabel: "Rejection Reason",
    },
  }[action];

  const canSubmit = !needsRemark || remark.trim().length > 0;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className={`bg-gradient-to-r ${cfg.grad} px-6 py-5`}>
          <div className="flex items-center gap-3">
            <span className="text-3xl">{cfg.icon}</span>
            <div>
              <h3 className="text-white font-bold text-lg">{cfg.label}</h3>
              <p className="text-white/60 text-xs mt-0.5">ROI: {roiid}</p>
            </div>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-600 leading-relaxed">{cfg.desc}</p>
          {needsRemark && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                {cfg.remarkLabel} <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={4}
                autoFocus
                maxLength={500}
                placeholder={cfg.placeholder}
                value={remark}
                onChange={e => setRemark(e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-300 resize-none"
              />
              <p className="text-xs text-slate-400 text-right">{remark.length} / 500</p>
            </div>
          )}
        </div>
        <div className="px-6 pb-6 flex gap-3">
          <button onClick={onCancel} disabled={loading}
            className="flex-1 px-4 py-2.5 border border-slate-300 rounded-xl text-slate-700 font-semibold text-sm hover:bg-slate-50 transition disabled:opacity-50">
            Cancel
          </button>
          <button onClick={() => onConfirm(remark)} disabled={loading || !canSubmit}
            className={`flex-1 px-4 py-2.5 text-white rounded-xl font-bold text-sm transition disabled:opacity-40 disabled:cursor-not-allowed ${cfg.btn}`}>
            {loading ? "Processing…" : cfg.label}
          </button>
        </div>
      </div>
    </div>
  );
}
// ─── New Store PDF Modal ──────────────────────────────────────────────────────────────────
function NewStorePDFModal({ historyId, onClose }) {
  const [pdfUrl, setPdfUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg]   = useState(null);

  useEffect(() => {
    if (!historyId) return;
    (async () => {
      try {
        const res = await fetch(`${BASE_URL}/history/${encodeURIComponent(historyId)}`);
        if (!res.ok) throw new Error("Failed to fetch history details.");
        const json = await res.json();
        const d = json.data?.[0] ?? {};
        // Scan all string values for a URL that looks like a PDF / document
        const url = d.pdf_url ?? d.document_url ?? d.pdf_link ?? d.file_url ??
          Object.values(d).find(v =>
            typeof v === "string" && v.startsWith("http") &&
            (v.includes(".pdf") || v.includes("blob") || v.includes("drive") || v.includes("/document"))
          ) ?? null;
        if (!url) setErrMsg("No PDF document is linked to this History ID.");
        setPdfUrl(url);
      } catch (e) {
        setErrMsg(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [historyId]);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">
        <div className="bg-gradient-to-r from-blue-700 to-indigo-600 px-6 py-4 shrink-0 flex items-center justify-between">
          <div>
            <h3 className="text-white font-bold text-lg">📄 New Store Document</h3>
            <p className="text-blue-200 text-xs mt-0.5">History ID: {historyId}</p>
          </div>
          <div className="flex items-center gap-3">
            {pdfUrl && (
              <a href={pdfUrl} target="_blank" rel="noopener noreferrer"
                className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white text-sm font-semibold rounded-lg transition">
                ↗ Open in new tab
              </a>
            )}
            <button onClick={onClose}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/35 text-white text-xl font-bold transition">
              ×
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-full gap-3">
              <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
              <p className="text-slate-400 text-sm">Loading document…</p>
            </div>
          ) : errMsg ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-400">
              <span className="text-4xl">📭</span>
              <p className="text-sm">{errMsg}</p>
            </div>
          ) : (
            <iframe src={pdfUrl} className="w-full h-full" title="New Store Document" />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── TOT Section (Commercial role only) ────────────────────────────────────────────────────────────
const TOT_TABS = [
  { key: "Plain_TOT_Final", label: "Plain Final" },
  { key: "Studded_TOT_Final", label: "Studded Final" },
  { key: "Coins_TOT", label: "Coins" },
  { key: "Plain_TOT_Presummary", label: "Plain Pre-Summary" },
  { key: "Plain_TOT_yearwise_data", label: "Plain Yr-wise" },
  { key: "Studded_TOT_Yearwise_data", label: "Studded Yr-wise" },
  { key: "Studded_TOT_slabwise_data", label: "Studded Slab-wise" },
];

function TOTSection({ roiid, onClose }) {
  const [activeTab, setActiveTab] = useState("Plain_TOT_Final");
  const [totData, setTotData] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!roiid) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setTotData({});
      try {
        const results = await Promise.all(
          TOT_TABS.map(async ({ key }) => {
            const res = await fetch(
              `${BASE_URL}/tot_details/${encodeURIComponent(roiid)}?tot_type=${key}`
            );
            if (!res.ok) return [key, []];
            const json = await res.json();
            return [key, json.data ?? []];
          })
        );
        if (!cancelled) setTotData(Object.fromEntries(results));
      } catch (err) {
        console.error("TOT fetch error:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [roiid]);

  const rows = totData[activeTab] ?? [];
  const cols = rows.length > 0
    ? Object.keys(rows[0]).filter(k => k !== "roiid" && k !== "ROIID")
    : [];

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden">

        {/* Modal header */}
        <div className="bg-gradient-to-r from-violet-700 to-purple-600 px-6 py-5 shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-white font-bold text-xl">📊 TOT Analysis</h3>
              <p className="text-violet-200 text-xs mt-0.5">Turn-Over-Time details · ROI {roiid}</p>
            </div>
            <button onClick={onClose}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/35 text-white text-xl font-bold transition">
              ×
            </button>
          </div>

          {/* Tabs inside header */}
          <div className="flex gap-1 mt-4 overflow-x-auto">
            {TOT_TABS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`px-3 py-1.5 text-xs font-semibold whitespace-nowrap rounded-lg transition ${activeTab === key
                  ? "bg-white text-violet-700"
                  : "text-violet-200 hover:bg-white/20"
                  }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-5">
          {loading ? (
            <div className="flex items-center justify-center py-16 gap-3">
              <div className="animate-spin w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full" />
              <p className="text-slate-400 text-sm">Loading TOT data…</p>
            </div>
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
              <span className="text-4xl">📭</span>
              <p className="text-sm font-medium">TOT data not available for this section.</p>
              <p className="text-xs">Ensure the expense summary has been saved to trigger TOT computation.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="min-w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-violet-700 text-white">
                    {cols.map(col => (
                      <th key={col} className="px-3 py-2.5 text-left font-semibold whitespace-nowrap">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? "bg-white hover:bg-violet-50" : "bg-violet-50/40 hover:bg-violet-50"}>
                      {cols.map(col => (
                        <td key={col} className="px-3 py-2 text-slate-700 border-b border-slate-100 whitespace-nowrap">
                          {row[col] ?? "—"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
          <p className="text-xs text-slate-400">
            {rows.length > 0 ? `${rows.length} row${rows.length !== 1 ? "s" : ""} · ${cols.length} columns` : ""}
          </p>
          <button onClick={onClose}
            className="px-5 py-2 bg-slate-700 hover:bg-slate-800 text-white text-sm font-semibold rounded-lg transition">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
// ─── Main Component ───────────────────────────────────────────────────────────
export default function RBMDashboard({ userRole = "RBM" }) {
  const userLog = useSelector((state) => state?.user?.user);

  // Left panel state
  const [roiList, setRoiList] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // Selected ROI state
  const [selectedRoi, setSelectedRoi] = useState(null);
  const [pageStatuses, setPageStatuses] = useState([]);
  const [pagesLoading, setPagesLoading] = useState(false);

  // Expanded page accordion
  const [expandedPage, setExpandedPage] = useState(null);

  // Page data modal
  const [pageModal, setPageModal] = useState({ open: false, pageName: "", data: [], loading: false });

  // Action modal: 'approve' | 'clarify' | 'reject'
  const [confirmAction, setConfirmAction] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showTotModal, setShowTotModal] = useState(false);
  const [roiHistoryId, setRoiHistoryId] = useState(null);
  const [showPdfModal, setShowPdfModal] = useState(false);

  // ── Fetch ROI list ─────────────────────────────────────────────────────────
  useEffect(() => {
    const username = userLog?.name;
    if (!username) return;
    (async () => {
      try {
        setListLoading(true);
        // Commercial sees all ROIs submitted to the commercial queue
        const url = userRole?.toUpperCase() === "COMMERCIAL"
          ? `${BASE_URL}/roi_id?username=Commercial` 
          : userRole?.toUpperCase() === "ADMIN"
          ? `${BASE_URL}/roi_id?username=sunilr`
          : userRole?.toUpperCase() === "Retail"
          ? `${BASE_URL}/roi_id?username=arun`
          : `${BASE_URL}/rbm_roi_id?username=${encodeURIComponent(username)}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to load ROI list");
        const json = await res.json();
        const sorted = (json.data ?? []).slice().sort((a, b) =>
          (b.inserted_date ?? "").localeCompare(a.inserted_date ?? "")
        );
        setRoiList(sorted);
      } catch (err) {
        toast.error(err.message || "No ROI ID history found under your Login");
      } finally {
        setListLoading(false);
      }
    })();
  }, [userLog?.name, userRole]);

  // ── Select ROI ─────────────────────────────────────────────────────────────
  const handleSelectRoi = async (roi) => {
    const roiid = roi.roiid ?? roi.roi_id ?? roi.ROIID ?? "";
    if (selectedRoi?.roiid === roiid) return;
    setSelectedRoi({ ...roi, roiid });
    setPageStatuses([]);
    setExpandedPage(null);
    setRoiHistoryId(null);
    setPagesLoading(true);
    try {
      const summaryRes = await fetch(`${BASE_URL}/summary/${roiid}`);
      if (summaryRes.ok) {
        const json = await summaryRes.json();
        setPageStatuses(json.data ?? []);
      }
      // Fetch history_id for New Store PDF button
      if ((roi.project_type ?? "") === "New Store") {
        const basicRes = await fetch(`${BASE_URL}/fetchScreen?parameter=roi_basic_store_details&roiid=${roiid}`);
        if (basicRes.ok) {
          const bj = await basicRes.json();
          setRoiHistoryId(bj.data?.[0]?.ty_history_id ?? null);
        }
      }
    } catch (err) {
      toast.error("Failed to load ROI details");
    } finally {
      setPagesLoading(false);
    }
  };

  // ── View page data ─────────────────────────────────────────────────────────
  const handleViewPageData = async (pageName) => {
    const roiid = selectedRoi?.roiid;
    setPageModal({ open: true, pageName, data: null, loading: true });
    try {
      const sp = (screen) => fetch(`${BASE_URL}/sales_planning`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ screen, roiid }) });
      const fs = (param) => fetch(`${BASE_URL}/fetchScreen?parameter=${param}&roiid=${roiid}`);
      const ed = (type) => fetch(`${BASE_URL}/expense_details/${roiid}?expense_type=${type}`);

      const fetchers = {
        "Basic Store Details": () => fs("roi_basic_store_details"),
        "Store Retail Specifications": () => fs("roi_store_retail_specifications"),
        "Sales Planning - Ref Store Code Details": () => sp(1),
        "Sales Planning - Sales Summary": () => sp(2),
        "Sales Planning - Stock Summary": () => sp(3),
        "Sales Planning - Discount": () => sp(4),
        "Capex Expenses": () => ed("CAPEX"),
        "Resource Expenses": () => ed("RESOURCE"),
        "Other Expenses": () => ed("OTHER"),
        "Summary Expenses": () => ed("SUMMARY"),
      };

      const res = await fetchers[pageName]?.();
      if (!res) { setPageModal(prev => ({ ...prev, loading: false })); return; }
      const json = await res.json();
      setPageModal({ open: true, pageName, data: json.data ?? [], loading: false });
    } catch {
      toast.error("Failed to load page data");
      setPageModal(prev => ({ ...prev, loading: false }));
    }
  };

  // ── Execute action (remark supplied by ActionModal) ───────────────────────
  const handleConfirmAction = async (remark = "") => {
    const roiid = selectedRoi?.roiid;
    setActionLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/roi/action/${roiid}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: confirmAction,  // 'approve' | 'reject' | 'clarify'
          actor_email: userLog?.name ?? "",
          actor_role: userRole,
          remark: remark.trim(),
          channel: selectedRoi?.channel ?? "Tanishq",
          store_format: selectedRoi?.store_format ?? selectedRoi?.existing_store_format ?? "",
          project_type: selectedRoi?.project_type ?? "",
          region: selectedRoi?.region ?? "",
        }),
      });
      if (!res.ok) throw new Error("Action failed");

      const json = await res.json();
      const newStatus = json.new_status ?? confirmAction;
      const nextApprover = json.next_approver?.[0];
      const msg = confirmAction === "approve"
        ? `ROI approved ✓${nextApprover ? ` — Next: ${nextApprover.approver_name ?? nextApprover.role ?? ""}` : ""}`
        : confirmAction === "reject"
          ? "ROI rejected — ABM notified"
          : "Clarification requested — ABM notified";

      toast.success(msg);
      setSelectedRoi(prev => ({ ...prev, status: newStatus }));
      setRoiList(prev => prev.map(r => (r.roiid ?? r.roi_id ?? r.ROIID) === roiid ? { ...r, status: newStatus } : r));
      setConfirmAction(null);
    } catch (err) {
      toast.error(err.message || "Action failed");
    } finally {
      setActionLoading(false);
    }
  };

  // ── Computed values ────────────────────────────────────────────────────────
  const filteredList = roiList.filter(roi => {
    const id = (roi.roiid ?? roi.roi_id ?? roi.ROIID ?? "").toLowerCase();
    const q = searchQuery.toLowerCase();
    const matchQ = !q || id.includes(q) || (roi.city ?? "").toLowerCase().includes(q) || (roi.project_type ?? "").toLowerCase().includes(q);
    const matchSt = statusFilter === "All" || roi.status === statusFilter;
    return matchQ && matchSt;
  });

  const completedCount = pageStatuses.filter(p => p.status && p.status !== "Not Available").length;
  const roiStatus = selectedRoi?.status ?? "";

  // Each approver can act on the status created by the level directly below them,
  // AND on SK statuses where the level above has sent a query back down to them.
  const ACTIONABLE_STATUS_BY_ROLE = {
    // ABM → RBM → Commercial → Admin → Retail
    "RBM":        ["Submitted_toRBM", "Submitted to RBM", "SK_byCommercial"],
    "COMMERCIAL":  ["Approved_byRBM",        "SK_byAdmin"],
    "ADMIN":       ["Approved_byCommercial"],
    "RETAIL":      ["Approved_byAdmin"],
  };
  const isActionable = (ACTIONABLE_STATUS_BY_ROLE[userRole?.toUpperCase()] ?? []).includes(roiStatus);

  const getPageStatus = (pageName) => {
    const row = pageStatuses.find(p => (p.page_name ?? p.PageName) === pageName);
    return row?.status ?? "Not Available";
  };

  return (
    <div className="flex flex-1 overflow-hidden bg-slate-50">
      {/* ══ Left Sidebar ══════════════════════════════════════════════════ */}
      <aside className="w-80 bg-white border-r border-slate-200 flex flex-col overflow-hidden shadow-sm shrink-0">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-indigo-700 to-blue-600">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">📊</span>
            <h2 className="text-white font-bold text-lg tracking-wide">{userLog?.name}</h2>
          </div>
          <h3 className="text-indigo-200 text-s truncate text-right px-2">{userRole}</h3>
        </div>

        {/* Search + filters */}
        <div className="p-3 border-b border-slate-100 space-y-2">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
            <input
              type="text"
              placeholder="Search ROI, city, project…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
          <div className="flex flex-wrap gap-1">
            {["All", "Submitted to RBM", "Approved", "Changes Required", "Rejected"].map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-2.5 py-0.5 rounded-full text-xs font-medium transition ${statusFilter === s ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>
                {s === "Submitted to RBM" ? "Submitted" : s}
              </button>
            ))}
          </div>
        </div>

        {/* Summary counts */}
        <div className="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100 text-center">
          {[
            { label: "Total", count: roiList.length, color: "text-slate-700" },
            { label: "Pending", count: roiList.filter(r => r.status === "Submitted to RBM").length, color: "text-blue-600" },
            { label: "Approved", count: roiList.filter(r => r.status === "Approved").length, color: "text-emerald-600" },
          ].map(({ label, count, color }) => (
            <div key={label} className="py-2.5">
              <p className={`text-lg font-bold ${color}`}>{count}</p>
              <p className="text-xs text-slate-400">{label}</p>
            </div>
          ))}
        </div>

        {/* ROI list */}
        <div className="flex-1 overflow-y-auto">
          {listLoading ? (
            <div className="p-3 space-y-2">
              {[1, 2, 3, 4].map(i => <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" />)}
            </div>
          ) : filteredList.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-slate-400">
              <span className="text-3xl mb-2">📭</span>
              <p className="text-sm">No requests found</p>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {filteredList.map(roi => {
                const id = roi.roiid ?? roi.roi_id ?? roi.ROIID ?? "";
                const isSelected = selectedRoi?.roiid === id;
                const cfg = getCfg(roi.status);
                return (
                  <button key={id} onClick={() => handleSelectRoi(roi)}
                    className={`w-full text-left p-3 rounded-xl transition-all ${isSelected ? "bg-indigo-50 border border-indigo-200 shadow-sm" : "hover:bg-slate-50 border border-transparent"}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className={`font-bold text-sm truncate ${isSelected ? "text-indigo-700" : "text-slate-800"}`}>{id}</p>
                        <p className="text-xs text-slate-500 mt-0.5 truncate">{[roi.project_type, roi.city].filter(Boolean).join(" · ")}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{daysAgo(roi.inserted_date)}</p>
                      </div>
                      <span className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                        {cfg.label}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </aside>

      {/* ══ Main Content ══════════════════════════════════════════════════ */}
      <main className="flex-1 overflow-y-auto">
        {!selectedRoi ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mb-5">
              <span className="text-5xl">📋</span>
            </div>
            <h3 className="text-xl font-bold text-slate-700">Select an ROI Request</h3>
            <p className="text-slate-400 text-sm mt-2 max-w-xs leading-relaxed">
              Choose a request from the sidebar to review its details, view submitted data, and take action.
            </p>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto p-6 space-y-5">

            {/* ─── ROI Header card ─────────────────────────────────────── */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-700 to-blue-600 px-6 py-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-indigo-300 text-xs font-semibold uppercase tracking-widest">ROI ID</span>
                      <span className="text-white font-extrabold text-xl tracking-widest">{selectedRoi.roiid}</span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-sm text-indigo-100">
                      {selectedRoi.project_type && <span>📁 {selectedRoi.project_type}</span>}
                      {selectedRoi.city && <span>📍 {selectedRoi.city}{selectedRoi.state ? `, ${selectedRoi.state}` : ""}</span>}
                      {selectedRoi.username && <span>👤 {selectedRoi.username}</span>}
                      {selectedRoi.inserted_date && <span>📅 {new Date(selectedRoi.inserted_date).toLocaleDateString("en-IN")}</span>}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <StatusBadge status={roiStatus} size="md" />
                    {/* PDF button shown to all roles for New Store projects */}
                    {selectedRoi.project_type === "New Store" && roiHistoryId && (
                      <button
                        onClick={() => setShowPdfModal(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-semibold rounded-lg transition">
                        📄 View New Store PDF
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Progress */}
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="font-medium text-slate-600">Form Completion</span>
                  <span className="text-slate-500 font-semibold">{completedCount} / {PAGES.length} pages filled</span>
                </div>
                <div className="h-2.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${(completedCount / PAGES.length) * 100}%`,
                      background: "linear-gradient(90deg,#6366f1,#3b82f6)",
                    }}
                  />
                </div>
                {/* ─── TOT Analysis button (Commercial only) ──────────────── */}
                {userRole?.toUpperCase() === "COMMERCIAL" && (
                  <div className="flex justify-end mt-2">
                    <button
                      onClick={() => setShowTotModal(true)}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold text-sm shadow-sm transition active:scale-95">
                      📊 View TOT Analysis
                    </button>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              {isActionable && (
                <div className="px-6 py-4 flex flex-wrap items-center gap-3">
                  <button onClick={() => setConfirmAction("approve")}
                    className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm shadow-sm transition active:scale-95">
                    ✓ Approve
                  </button>
                  <button onClick={() => setConfirmAction("clarify")}
                    className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold text-sm shadow-sm transition active:scale-95">
                    💬 Seek Clarification
                  </button>
                  <button onClick={() => setConfirmAction("reject")}
                    className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-sm shadow-sm transition active:scale-95">
                    ✗ Reject
                  </button>
                </div>
              )}

              {/* Non-actionable status banner with remark */}
              {!isActionable && (
                <div className={`px-6 py-3 border-t border-slate-100 ${getCfg(roiStatus).bg}`}>
                  <p className={`text-sm font-medium ${getCfg(roiStatus).text}`}>
                    {roiStatus === "Approved" && "✓ This ROI has been approved."}
                    {roiStatus === "Rejected" && "✗ This ROI has been rejected."}
                    {roiStatus === "BPM_Requestraised" && "🏭 BPM request raised — forwarded to Retail."}
                    {roiStatus === "Approved_byRBM" && "✓ Approved by RBM — awaiting Commercial review."}
                    {roiStatus === "Approved_byCommercial" && "✓ Approved by Commercial — awaiting Admin review."}
                    {roiStatus === "Approved_byAdmin" && "✓ Approved by Admin — awaiting Retail acceptance."}
                    {roiStatus.startsWith("Rejected_by") && `✗ Rejected by ${roiStatus.replace("Rejected_by", "")} — ABM notified.`}
                    {roiStatus === "SK_byRBM" && "💬 Clarification sent to ABM by RBM — ABM must revise and resubmit."}
                    {roiStatus === "SK_byCommercial" && "💬 Clarification sent to RBM by Commercial — RBM must resolve."}
                    {roiStatus === "SK_byAdmin" && "💬 Clarification sent to Commercial by Admin — Commercial must resolve."}
                    {!["", "Approved", "Rejected", "BPM_Requestraised", "Approved_byRBM", "Approved_byCommercial", "Approved_byAdmin"].includes(roiStatus)
                      && !roiStatus.startsWith("Rejected_by") && !roiStatus.startsWith("SK_by")
                      && `Status: ${roiStatus}`}
                  </p>
                  {selectedRoi?.remarks && (
                    <div className="mt-2 bg-white/60 rounded-lg px-3 py-2 border border-slate-200">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-0.5">Remark</p>
                      <p className="text-sm text-slate-700 whitespace-pre-wrap">{selectedRoi.remarks}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ─── Pages Accordion ─────────────────────────────────────── */}
            <div>
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-3 px-1">Submitted Pages</h3>
              {pagesLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3, 4].map(i => <div key={i} className="h-16 bg-white rounded-xl animate-pulse border border-slate-200" />)}
                </div>
              ) : (
                <div className="space-y-2">
                  {PAGES.map(page => (
                    <PageRow
                      key={page.name}
                      page={page}
                      status={getPageStatus(page.name)}
                      onViewData={() => handleViewPageData(page.name)}
                      expanded={expandedPage === page.name}
                      onToggle={() => setExpandedPage(prev => prev === page.name ? null : page.name)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* ── Modals ──────────────────────────────────────────────────────── */}
      {pageModal.open && (
        <PageDataModal
          pageName={pageModal.pageName}
          data={pageModal.data}
          loading={pageModal.loading}
          onClose={() => setPageModal({ open: false, pageName: "", data: [], loading: false })}
        />
      )}

      {showPdfModal && (
        <NewStorePDFModal
          historyId={roiHistoryId}
          onClose={() => setShowPdfModal(false)}
        />
      )}

      {showTotModal && (
        <TOTSection
          roiid={selectedRoi?.roiid}
          onClose={() => setShowTotModal(false)}
        />
      )}

      {confirmAction && (
        <ActionModal
          action={confirmAction}
          roiid={selectedRoi?.roiid}
          userRole={userRole}
          onConfirm={handleConfirmAction}
          onCancel={() => setConfirmAction(null)}
          loading={actionLoading}
        />
      )}
    </div>
  );
}
