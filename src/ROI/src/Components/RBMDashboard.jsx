import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { BASE_URL } from "./Forms/data/baseUrl";
import RoiPdfReport from "./Forms/RoiPdfReport";
import { routes } from "../../../routes";
// Shared formatters from the ABM-facing Summary.jsx (Screen 5) calc module —
// reused so Final Summary figures render identically, never hand-duplicated.
import { YEARS as FS_YEARS, sum6y, fmt, fmtPct } from "./Forms/roiFinancialSummary";

// ─── Page definitions ─────────────────────────────────────────────────────────
const PAGES = [
  { name: "Basic Store Details", group: "Store Setup", icon: "🏪" },
  { name: "Store Retail Specifications", group: "Store Setup", icon: "📋" },
  { name: "Sales Planning - Ref Store Code Details", group: "Sales Planning", icon: "🔗" },
  { name: "Sales Planning - Sales Summary", group: "Sales Planning", icon: "📈" },
  { name: "Sales Planning - Stock Summary - Phase 1", group: "Sales Planning", icon: "📦" },
  { name: "Sales Planning - Stock Summary - Phase 2", group: "Sales Planning", icon: "📦" },
  { name: "Sales Planning - Discount", group: "Sales Planning", icon: "🏷️" },
  { name: "Capex Expenses", group: "Expense Planning", icon: "🏗️" },
  { name: "Resource Expenses", group: "Expense Planning", icon: "👥" },
  { name: "Other Expenses", group: "Expense Planning", icon: "📝" },
  { name: "Summary Expenses", group: "Expense Planning", icon: "💼" },
  { name: "Final Summary", group: "Final Summary", icon: "📊" },
];

const GROUP_COLORS = {
  "Store Setup": "bg-blue-50 text-blue-700 border-blue-200",
  "Sales Planning": "bg-green-50 text-green-700 border-green-200",
  "Expense Planning": "bg-amber-50 text-amber-700 border-amber-200",
  "Final Summary": "bg-indigo-50 text-indigo-700 border-indigo-200",
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
  "Final Summary": "from-indigo-600 to-purple-700",
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

// ─── Final Summary rich view ──────────────────────────────────────────────────
// Reads the already-computed figures straight off the saved /summary_screen_5
// snapshot instead of recomputing via roiFinancialSummary.js's parseApiRows —
// that function's internal lookup keys (e.g. "Telephone/Internet", "Store -
// Printing/Pantry etc") are the RAW per-screen Particulars text, which differs
// from the friendlier labels actually saved for ~5 expense rows (e.g. saved as
// "Telephone / Internet", "Store — Printing / Pantry etc") — re-running it
// against the saved snapshot silently zeroed those specific expense rows.
// Reading the saved Particulars at face value sidesteps the mismatch entirely
// and is more faithful anyway (shows exactly what was submitted, no re-derive).
function buildFinalSummaryView(rows) {
  if (!rows?.length) return null;
  const by = {};
  rows.forEach(r => { by[r.Particulars] = r; });
  const yrs = (particulars) => {
    const r = by[particulars];
    if (!r) return [0, 0, 0, 0, 0, 0, 0];
    return [r.Yr0 ?? 0, r.Yr1 ?? 0, r.Yr2 ?? 0, r.Yr3 ?? 0, r.Yr4 ?? 0, r.Yr5 ?? 0, r.Yr6 ?? 0];
  };
  const num = (particulars) => {
    const v = by[particulars]?.Header;
    if (v === undefined || v === null || v === "") return null;
    const n = parseFloat(v);
    return isNaN(n) ? null : n;
  };

  // Exact saved labels (buildSubmitPayload's e.label in Summary.jsx) — must
  // match verbatim, not the raw-screen Particulars text `yrs()` elsewhere uses.
  const EXPENSE_LABELS = [
    "Rent", "Staff Salaries", "Security & Housekeeping", "Electricity",
    "Repairs & Maintenance", "Insurance", "BTL", "Travel & Conveyance",
    "Telephone / Internet", "Credit Card Commission", "GST (primarily rental)",
    "Store — Printing / Pantry etc", "Consumables, Safety, Cust Exp",
    "Other — Staff welfare/Uniforms", "BG cost", "Regn Charges / Temp Store Cost",
  ];

  return {
    roiType: by["ROI New Store"]?.Header ?? "",
    cityName: by["City Name"]?.Header ?? "",
    ucpSales: yrs("UCP Sales"),
    customerDiscount: yrs("Customer Discount"),
    nsvSales: yrs("NSV Sales"),
    grossEarnings: yrs("Gross earnings/Commission"),
    totalExpenses: yrs("Total expenses"),
    expenses: EXPENSE_LABELS.map(label => ({ label, values: yrs(label) })),
    ebitda: yrs("EBITDA / Cash Profit / Operating Profit"),
    depreciation: yrs("Depreciation"),
    pbt: yrs("PBT"),
    roiPct: yrs("ROI%"),
    storeInteriors: num("Store Interiors value on Set Up") ?? 0,
    totalInvestment: yrs("Total Investment"),
    cumDeprn: yrs("Cumulative Depreciation (incl current yr)"),
    currentInteriors: yrs("Current Value of Interiors"),
    workingCapital: yrs("Working Capital / Petty cash @ 1% sale"),
    securityDeposit: yrs("Security deposit"),
    capex: yrs("Capital Expenditure"),
    signingFee: yrs("Signing Fee"),
    advRent: yrs("Advance paid ( Rent )"),
    cashOutflow: yrs("Incremental Working capital - Cash outflow"),
    capexTotal: yrs("Total"),
    kpis: {
      rentRevenue5yr: num("Rent to revenue ratio (5 yr)"),
      revPerSqft: num("Revenue per Square Feet (Average)"),
      revenueCAGR: num("Revenue - CAGR"),
      payout5yr: num("Payout % (5 yr)"),
      irr: num("Internal Rate of Return (IRR)"),
      npv: num("Net Present Value (NPV) @11% cost of capital"),
      paybackCapex: num("Payback period (years) - for only Capex"),
    },
  };
}

function FSKpiCard({ label, value, sub, color = "indigo" }) {
  const palette = {
    indigo: "from-indigo-500 to-indigo-700",
    green: "from-green-500 to-emerald-600",
    amber: "from-amber-500 to-orange-600",
    blue: "from-blue-500 to-blue-700",
  };
  return (
    <div className={`rounded-xl bg-gradient-to-br ${palette[color]} text-white p-5 shadow-md`}>
      <p className="text-xs font-semibold text-white/70 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-2xl font-extrabold">{value}</p>
      {sub && <p className="text-xs text-white/60 mt-1">{sub}</p>}
    </div>
  );
}

function FSNum({ v, bold = false }) {
  const isNeg = typeof v === "number" && v < 0;
  return (
    <td className={`border border-gray-200 px-3 py-2 text-right text-xs tabular-nums whitespace-nowrap bg-white ${bold ? "font-bold" : ""} ${isNeg ? "text-red-600" : "text-gray-800"}`}>
      {fmt(v)}
    </td>
  );
}

function FSLabel({ children, indent = false, bold = false, muted = false }) {
  return (
    <td className={`border border-gray-200 px-3 py-2 text-xs min-w-[230px] sticky left-0 z-10 bg-white ${indent ? "pl-6" : ""} ${bold ? "font-bold text-gray-900" : muted ? "text-gray-500" : "text-gray-700"}`}>
      {children}
    </td>
  );
}

function FSSectionHead({ children }) {
  return (
    <tr>
      <td colSpan={9} className="border border-indigo-200 bg-indigo-700 text-white text-xs font-bold px-3 py-2 sticky left-0">
        {children}
      </td>
    </tr>
  );
}

function FSTotalRow({ label, values, color = "amber", total }) {
  const palette = {
    amber: "bg-amber-100 font-bold text-amber-900 border-amber-300",
    green: "bg-green-100 font-bold text-green-900 border-green-300",
    blue: "bg-blue-100 font-bold text-blue-900 border-blue-300",
  };
  const cls = palette[color] ?? palette.amber;
  return (
    <tr>
      <td className={`border px-3 py-2 text-xs sticky left-0 z-10 ${cls}`}>{label}</td>
      {values.map((v, i) => {
        const isNeg = typeof v === "number" && v < 0;
        return (
          <td key={i} className={`border px-3 py-2 text-xs text-right tabular-nums whitespace-nowrap ${cls} ${isNeg ? "text-red-700" : ""}`}>
            {fmt(v)}
          </td>
        );
      })}
      <td className={`border px-3 py-2 text-xs text-right tabular-nums whitespace-nowrap font-bold ${total != null ? cls : "bg-gray-100 text-gray-500 border-gray-200"}`}>
        {total != null ? fmt(total) : "0.0"}
      </td>
    </tr>
  );
}

function FinalSummaryContent({ d }) {
  const [expExpanded, setExpExpanded] = useState(false);
  const [invExpanded, setInvExpanded] = useState(false);
  const [cashExpanded, setCashExpanded] = useState(false);

  if (!d) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
        <span className="text-5xl">📭</span>
        <p className="text-sm font-medium">No Final Summary data submitted for this ROI yet.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <FSKpiCard label="NPV @ 11% CoC" value={`₹ ${fmt(d.kpis.npv)} L`} sub="Net Present Value" color="green" />
        <FSKpiCard label="Payback Period" value={d.kpis.paybackCapex !== null ? `${d.kpis.paybackCapex} yr` : "0.0"} sub="For Capex only" color="blue" />
        <FSKpiCard label="IRR" value={d.kpis.irr !== null ? fmtPct(d.kpis.irr) : "0.0"} sub="Internal Rate of Return" color="indigo" />
        <FSKpiCard label="Rev / Sq.Ft" value={d.kpis.revPerSqft ? `₹ ${d.kpis.revPerSqft.toFixed(2)}` : "0.0"} sub="Average across 6 years" color="amber" />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
          <div>
            <h4 className="text-sm font-bold text-slate-700">ROI Summary — {d.roiType}</h4>
            <p className="text-xs text-slate-400 mt-0.5">All figures in ₹ Lacs</p>
          </div>
          <span className="text-xs text-slate-400 bg-slate-100 px-3 py-1 rounded-full">{d.roiType} · {d.cityName}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-xs">
            <thead>
              <tr className="bg-indigo-700 text-white text-xs font-semibold">
                <th className="border border-indigo-600 px-3 py-3 text-left min-w-[230px] sticky left-0 bg-indigo-700 z-20">Particulars</th>
                {FS_YEARS.map(yr => (
                  <th key={yr} className="border border-indigo-600 px-3 py-3 text-center min-w-[90px]">{yr}</th>
                ))}
                <th className="border border-amber-500 px-3 py-3 text-center min-w-[100px] bg-amber-600">6Y Total</th>
              </tr>
            </thead>
            <tbody>
              <FSSectionHead>Income</FSSectionHead>
              <tr>
                <FSLabel>UCP Sales</FSLabel>
                {d.ucpSales.map((v, i) => <FSNum key={i} v={v} />)}
                <FSNum v={sum6y(d.ucpSales)} bold />
              </tr>
              <tr>
                <FSLabel indent>Customer Discount</FSLabel>
                {d.customerDiscount.map((v, i) => <FSNum key={i} v={v} />)}
                <FSNum v={sum6y(d.customerDiscount)} />
              </tr>
              <FSTotalRow label="NSV Sales" values={d.nsvSales} color="blue" total={sum6y(d.nsvSales)} />
              <FSTotalRow label="Gross Earnings / Commission" values={d.grossEarnings} color="green" total={sum6y(d.grossEarnings)} />

              <FSSectionHead>
                <button type="button" className="flex items-center gap-2 w-full text-left" onClick={() => setExpExpanded(e => !e)}>
                  <span>{expExpanded ? "▼" : "▶"}</span> Total Expenses
                </button>
              </FSSectionHead>
              <FSTotalRow label="Total Expenses" values={d.totalExpenses} color="amber" total={sum6y(d.totalExpenses)} />
              {expExpanded && d.expenses.map(({ label, values }) => (
                <tr key={label}>
                  <FSLabel indent>{label}</FSLabel>
                  {values.map((v, i) => <FSNum key={i} v={v} />)}
                  <FSNum v={sum6y(values)} />
                </tr>
              ))}

              <FSSectionHead>Profitability</FSSectionHead>
              <FSTotalRow label="EBITDA / Cash Profit / Operating Profit" values={d.ebitda} color="green" total={sum6y(d.ebitda)} />
              <tr>
                <FSLabel indent muted>Depreciation</FSLabel>
                {d.depreciation.map((v, i) => <FSNum key={i} v={v} />)}
                <FSNum v={sum6y(d.depreciation)} />
              </tr>
              <FSTotalRow label="PBT (Profit Before Tax)" values={d.pbt} color="green" total={sum6y(d.pbt)} />
              <tr>
                <FSLabel bold>ROI %</FSLabel>
                {d.roiPct.map((v, i) => <FSNum key={i} v={v} />)}
                <td className="border border-gray-100 px-3 py-2 text-right text-xs text-gray-400 bg-gray-50">—</td>
              </tr>

              <FSSectionHead>
                <button type="button" className="flex items-center gap-2 w-full text-left" onClick={() => setInvExpanded(e => !e)}>
                  <span>{invExpanded ? "▼" : "▶"}</span> Total Investment
                </button>
              </FSSectionHead>
              <FSTotalRow label="Total Investment" values={d.totalInvestment} color="amber" />
              {invExpanded && (
                <>
                  <tr>
                    <FSLabel indent>Store Interiors value on Set Up</FSLabel>
                    {FS_YEARS.map((_, i) => (
                      <td key={i} className="border border-gray-200 px-3 py-2 text-right text-xs text-gray-600 bg-white">
                        {i === 0 ? fmt(d.storeInteriors) : "0.0"}
                      </td>
                    ))}
                    <td className="border border-gray-100 px-3 py-2 text-right text-xs text-gray-400 bg-gray-50">—</td>
                  </tr>
                  <tr>
                    <FSLabel indent>Cumulative Depreciation (incl. current yr)</FSLabel>
                    {d.cumDeprn.map((v, i) => <FSNum key={i} v={v} />)}
                    <td className="border border-gray-100 px-3 py-2 text-right text-xs text-gray-400 bg-gray-50">—</td>
                  </tr>
                  <tr>
                    <FSLabel indent>Current Value of Interiors</FSLabel>
                    {d.currentInteriors.map((v, i) => <FSNum key={i} v={v} />)}
                    <td className="border border-gray-100 px-3 py-2 text-right text-xs text-gray-400 bg-gray-50">—</td>
                  </tr>
                  <tr>
                    <FSLabel indent>Working Capital / Petty Cash @ 1% sale</FSLabel>
                    {d.workingCapital.map((v, i) => <FSNum key={i} v={v} />)}
                    <td className="border border-gray-100 px-3 py-2 text-right text-xs text-gray-400 bg-gray-50">—</td>
                  </tr>
                  <tr>
                    <FSLabel indent>Security Deposit</FSLabel>
                    {d.securityDeposit.map((v, i) => <FSNum key={i} v={v} />)}
                    <td className="border border-gray-100 px-3 py-2 text-right text-xs text-gray-400 bg-gray-50">—</td>
                  </tr>
                </>
              )}

              <FSSectionHead>
                <button type="button" className="flex items-center gap-2 w-full text-left" onClick={() => setCashExpanded(e => !e)}>
                  <span>{cashExpanded ? "▼" : "▶"}</span> Cash Outflow (−) / Inflow (+)
                </button>
              </FSSectionHead>
              <FSTotalRow label="Net Cash Flow" values={d.capexTotal} color="blue" />
              {cashExpanded && (
                <>
                  <tr>
                    <FSLabel indent>Capital Expenditure</FSLabel>
                    {d.capex.map((v, i) => <FSNum key={i} v={v} />)}
                    <td className="border border-gray-100 px-3 py-2 text-right text-xs text-gray-400 bg-gray-50">—</td>
                  </tr>
                  <tr>
                    <FSLabel indent muted>Signing Fee</FSLabel>
                    {d.signingFee.map((v, i) => <FSNum key={i} v={v} />)}
                    <td className="border border-gray-100 px-3 py-2 text-right text-xs text-gray-400 bg-gray-50">—</td>
                  </tr>
                  <tr>
                    <FSLabel indent muted>Advance paid (Rent)</FSLabel>
                    {d.advRent.map((v, i) => <FSNum key={i} v={v} />)}
                    <td className="border border-gray-100 px-3 py-2 text-right text-xs text-gray-400 bg-gray-50">—</td>
                  </tr>
                  <tr>
                    <FSLabel indent muted>Incremental Working capital - Cash outflow</FSLabel>
                    {d.cashOutflow.map((v, i) => <FSNum key={i} v={v} />)}
                    <td className="border border-gray-100 px-3 py-2 text-right text-xs text-gray-400 bg-gray-50">—</td>
                  </tr>
                  <tr>
                    <FSLabel indent muted>Operating profit (Before Interest & Deprn)</FSLabel>
                    {d.ebitda.map((v, i) => <FSNum key={i} v={v} />)}
                    <td className="border border-gray-100 px-3 py-2 text-right text-xs text-gray-400 bg-gray-50">—</td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100">
          <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Key Metrics</h4>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-0 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
          {[
            { label: "Rent to Revenue Ratio (5 yr)", value: d.kpis.rentRevenue5yr !== null ? fmtPct(d.kpis.rentRevenue5yr) : "0.0" },
            { label: "Revenue per Sq. Ft. (Average)", value: d.kpis.revPerSqft ? `₹ ${d.kpis.revPerSqft.toFixed(2)}` : "0.0" },
            { label: "Revenue — CAGR", value: d.kpis.revenueCAGR !== null ? fmtPct(d.kpis.revenueCAGR) : "0.0" },
            { label: "Payout % (5 yr)", value: d.kpis.payout5yr !== null ? fmtPct(d.kpis.payout5yr) : "0.0" },
            { label: "IRR", value: d.kpis.irr !== null ? fmtPct(d.kpis.irr) : "0.0" },
            { label: "NPV @ 11% Cost of Capital", value: d.kpis.npv !== null ? `₹ ${fmt(d.kpis.npv)} L` : "0.0" },
            { label: "Payback Period (Capex)", value: d.kpis.paybackCapex !== null ? `${d.kpis.paybackCapex} years` : "0.0" },
          ].map(({ label, value }) => (
            <div key={label} className="px-5 py-4">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">{label}</p>
              <p className={`text-lg font-extrabold mt-1 ${value === "0.0" ? "text-slate-300" : "text-slate-900"}`}>{value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PageDataModal({ pageName, data, loading, onClose }) {
  const pageInfo = PAGES.find(p => p.name === pageName);
  const grad = GROUP_GRADIENT[pageInfo?.group] ?? "from-indigo-600 to-blue-700";
  const isFinalSummary = pageName === "Final Summary";
  // data is the full array of rows from the API
  const rows = Array.isArray(data) ? data : (data ? [data] : []);
  const totalFields = rows[0] ? Object.keys(rows[0]).filter(k => !HIDDEN.has(k)).length : 0;
  const finalSummaryData = useMemo(
    () => (isFinalSummary ? buildFinalSummaryView(rows) : null),
    [isFinalSummary, rows]
  );

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
        <div className="flex-1 min-h-0 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="animate-spin w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full" />
              <p className="text-slate-400 text-sm">Loading complete form data…</p>
            </div>
          ) : isFinalSummary ? (
            <FinalSummaryContent d={finalSummaryData} />
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
        <div className="flex-1 min-h-0 overflow-auto p-5">
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
  const navigate = useNavigate();

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
        // Surface the backend's actual message (e.g. role-specific "No ROI
        // requests found...") instead of a hardcoded string that doesn't
        // reflect the real cause (network/server error vs. genuinely empty list).
        const json = await res.json().catch(() => null);
        if (!res.ok || json?.success === false) {
          throw new Error(json?.message || `Failed to load ROI list (HTTP ${res.status}).`);
        }
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
      // Screen-1 (Basic Store Details) is the source of truth for region/
      // store_format/project_type — the ROI list APIs don't reliably include
      // these, and sending them blank in the approve/reject/clarify payload
      // risks the backend's own auto-resolve coming up empty too (→ 403
      // "could not resolve the approval chain"). Always pull them here so
      // the action payload never has to guess. Also carries ty_history_id
      // for the New Store PDF button.
      const basicRes = await fetch(`${BASE_URL}/fetchScreen?parameter=roi_basic_store_details&roiid=${roiid}`);
      if (basicRes.ok) {
        const bj = await basicRes.json();
        const basic = bj.data?.[0] ?? {};
        // DB columns are actually `TY_historyID` / `exsisting_store_format` (both
        // misspelled/odd-cased on the backend) — "ty_history_id"/"existing_store_format"
        // never matched, so store_format silently stayed "" in the approve/reject/
        // clarify payload every time.
        setRoiHistoryId(basic.TY_historyID ?? null);
        setSelectedRoi(prev => ({
          ...prev,
          region: prev?.region || basic.region || "",
          store_format: prev?.store_format || basic.exsisting_store_format || basic.new_store_format || "",
          project_type: prev?.project_type || basic.project_type || "",
        }));
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
        "Sales Planning - Stock Summary - Phase 1": () => sp(3),
        "Sales Planning - Stock Summary - Phase 2": () => sp(4),
        "Sales Planning - Discount": () => sp(5),
        "Capex Expenses": () => ed("CAPEX"),
        "Resource Expenses": () => ed("RESOURCE"),
        "Other Expenses": () => ed("OTHER"),
        "Summary Expenses": () => ed("SUMMARY"),
        "Final Summary": () => fetch(`${BASE_URL}/summary_screen_5/${roiid}`),
      };

      const res = await fetchers[pageName]?.();
      if (!res) { setPageModal(prev => ({ ...prev, loading: false })); return; }
      // Backend returns a JSON body with a specific `message` even on 404/500
      // (e.g. "No saved data found for ROI '...' (section: ...)") — surface that
      // instead of a generic failure so the user knows exactly what's missing.
      const json = await res.json().catch(() => null);
      if (!res.ok || json?.success === false) {
        throw new Error(json?.message || `Failed to load page data (HTTP ${res.status}).`);
      }
      setPageModal({ open: true, pageName, data: json.data ?? [], loading: false });
    } catch (err) {
      toast.error(err.message || "Failed to load page data");
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
          actor_email: userLog?.email ?? "",
          actor_role: userRole,
          remark: remark.trim(),
          channel: selectedRoi?.channel ?? "Tanishq",
          store_format: selectedRoi?.store_format ?? selectedRoi?.existing_store_format ?? "",
          project_type: selectedRoi?.project_type ?? "",
          region: selectedRoi?.region ?? "",
        }),
      });
      // Backend always returns a JSON body (even on 403/422/500) with a specific
      // `message` — e.g. "not authorised to act on it", "no approver configured
      // for this stage" — surface that instead of a generic "Action failed" so
      // the user knows exactly what went wrong and how to fix it.
      const json = await res.json().catch(() => null);
      if (!res.ok || json?.success === false) {
        throw new Error(json?.message || `Action failed (HTTP ${res.status}).`);
      }
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
    // Final Summary has no page-level status row of its own — it mirrors the
    // ROI's own overall status (Submitted to RBM/Approved_by*/etc.), not a
    // fixed "Completed" badge, since that's what the approval list actually shows.
    if (pageName === "Final Summary") return roiStatus;
    const row = pageStatuses.find(p => (p.page_name ?? p.PageName) === pageName);
    return row?.status ?? "Not Available";
  };
  // Counted via getPageStatus (not the raw pageStatuses array) so Final Summary —
  // which has no row of its own and always mirrors roiStatus — counts as filled too.
  const completedCount = PAGES.filter(p => getPageStatus(p.name) !== "Not Available").length;

  return (
    <div className="flex flex-1 h-full min-h-0 overflow-hidden bg-slate-50">
      {/* ══ Left Sidebar ══════════════════════════════════════════════════ */}
      <aside className="w-80 bg-white border-r border-slate-200 flex flex-col overflow-hidden shadow-sm shrink-0">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-indigo-700 to-blue-600">
          <button type="button" onClick={() => navigate(routes.NEW_STORE)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 mb-3 bg-white/15 hover:bg-white/25 text-white text-xs font-semibold rounded-lg transition">
            ← Back to Third Eye
          </button>
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
        <div className="flex-1 min-h-0 overflow-y-auto">
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
      <main className="flex-1 min-h-0 overflow-y-auto">
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
                    {/* Every ROI reaching this dashboard has already been submitted */}
                    {!!roiStatus && (
                      <RoiPdfReport
                        roiid={selectedRoi.roiid}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition"
                      />
                    )}
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
