// Shared "Final Summary" read-only view — used by both RBMDashboard.jsx (RBM/
// Commercial/Admin/Retail approvers) and HistoryPage.jsx (ABM's own History
// page) so every role sees the exact same layout the ABM saw on the Summary
// screen when the request was first submitted to the RBM (Summary.jsx's own
// KPI cards + Income → Expenses → Profitability → Investment → Cash-Flow
// table), instead of two independently-drifting "View" implementations.
import { useState } from "react";
import { YEARS as FS_YEARS, sum6y, fmt, fmtPct, fmtWhole, r2 } from "./Forms/roiFinancialSummary";

export function buildFinalSummaryView(rows) {
  if (!rows?.length) return null;
  const by = {};
  rows.forEach(r => { by[r.Particulars] = r; });
  // Accepts either a single Particulars string or an array of candidates
  // tried in order — needed because the backing stored proc recently
  // started returning a couple of rows under new, more fully-spelled
  // Particulars names (e.g. "Registeration Charges/Temporary Store Cost",
  // "Security Deposit") instead of the older abbreviated ones this view was
  // originally written against; the old name is kept as a fallback for any
  // ROI whose saved snapshot predates that change.
  const yrs = (particulars) => {
    const candidates = Array.isArray(particulars) ? particulars : [particulars];
    for (const p of candidates) {
      const r = by[p];
      if (r) return [r.Yr0 ?? 0, r.Yr1 ?? 0, r.Yr2 ?? 0, r.Yr3 ?? 0, r.Yr4 ?? 0, r.Yr5 ?? 0, r.Yr6 ?? 0];
    }
    return [0, 0, 0, 0, 0, 0, 0];
  };
  const num = (particulars) => {
    const candidates = Array.isArray(particulars) ? particulars : [particulars];
    for (const p of candidates) {
      const v = by[p]?.Header;
      if (v === undefined || v === null || v === "") continue;
      const n = parseFloat(v);
      if (!isNaN(n)) return n;
    }
    return null;
  };

  // Exact saved labels (buildSubmitPayload's e.label in Summary.jsx) — must
  // match verbatim, not the raw-screen Particulars text `yrs()` elsewhere uses.
  // Entries are [displayLabel, lookupKey(s)] — most lookup keys are just the
  // display label itself; "Regn Charges / Temp Store Cost" is the one
  // exception (see `yrs` comment above).
  const EXPENSE_LABELS = [
    ["Rent", "Rent"],
    ["Staff Salaries", "Staff Salaries"],
    ["Security & Housekeeping", "Security & Housekeeping"],
    ["Electricity", "Electricity"],
    ["Repairs & Maintenance", "Repairs & Maintenance"],
    ["Insurance", "Insurance"],
    ["BTL", "BTL"],
    ["Travel & Conveyance", "Travel & Conveyance"],
    ["Telephone / Internet", "Telephone / Internet"],
    ["Credit Card Commission", "Credit Card Commission"],
    ["GST (primarily rental)", "GST (primarily rental)"],
    ["Store — Printing / Pantry etc", "Store — Printing / Pantry etc"],
    ["Consumables, Safety, Cust Exp", "Consumables, Safety, Cust Exp"],
    ["Other — Staff welfare/Uniforms", "Other — Staff welfare/Uniforms"],
    ["BG cost", "BG cost"],
    ["Regn Charges / Temp Store Cost", ["Registeration Charges/Temporary Store Cost", "Regn Charges / Temp Store Cost"]],
  ];

  // "Security deposit" (old, lowercase) was already stored pre-converted to
  // Lakhs; the new "Security Deposit" (capital) row the proc now also
  // returns is raw Rupees — so unlike the plain-string fallbacks above, this
  // one needs an explicit /100000 conversion to land on the same scale
  // before falling back.
  const securityDeposit = by["Security Deposit"]
    ? yrs("Security Deposit").map((v) => v / 100000)
    : yrs("Security deposit");

  return {
    roiType: by["ROI New Store"]?.Header ?? "",
    cityName: by["City Name"]?.Header ?? "",
    ucpSales: yrs("UCP Sales"),
    customerDiscount: yrs("Customer Discount"),
    nsvSales: yrs("NSV Sales"),
    grossEarnings: yrs("Gross earnings/Commission"),
    totalExpenses: yrs("Total expenses"),
    expenses: EXPENSE_LABELS.map(([label, key]) => ({ label, values: yrs(key) })),
    ebitda: yrs("EBITDA / Cash Profit / Operating Profit"),
    depreciation: yrs("Depreciation"),
    pbt: yrs("PBT"),
    roiPct: yrs("ROI%"),
    storeInteriors: num("Store Interiors value on Set Up") ?? 0,
    totalInvestment: yrs("Total Investment"),
    cumDeprn: yrs("Cumulative Depreciation (incl current yr)"),
    currentInteriors: yrs("Current Value of Interiors"),
    workingCapital: yrs("Working Capital / Petty cash @ 1% sale"),
    securityDeposit,
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
      {fmtWhole(v)}
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
            {fmtWhole(v)}
          </td>
        );
      })}
      <td className={`border px-3 py-2 text-xs text-right tabular-nums whitespace-nowrap font-bold ${total != null ? cls : "bg-gray-100 text-gray-500 border-gray-200"}`}>
        {total != null ? fmtWhole(total) : "0.0"}
      </td>
    </tr>
  );
}

export function FinalSummaryContent({ d }) {
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
                <FSLabel>1. UCP Sales</FSLabel>
                {d.ucpSales.map((v, i) => <FSNum key={i} v={v} />)}
                <FSNum v={sum6y(d.ucpSales)} bold />
              </tr>
              <tr>
                <FSLabel indent>Customer Discount</FSLabel>
                {d.customerDiscount.map((v, i) => <FSNum key={i} v={v} />)}
                <FSNum v={sum6y(d.customerDiscount)} />
              </tr>
              <FSTotalRow label="NSV Sales" values={d.nsvSales} color="blue" total={sum6y(d.nsvSales)} />
              <FSTotalRow label="2. Gross Earnings / Commission" values={d.grossEarnings} color="green" total={sum6y(d.grossEarnings)} />
              {/* UI-only: Gross Earnings as % of UCP Sales per year — same row Summary.jsx
                  shows directly below "2. Gross Earnings / Commission" (was missing here). */}
              <tr>
                <FSLabel indent muted>%</FSLabel>
                {d.ucpSales.map((u, i) => {
                  const g = d.grossEarnings[i];
                  const pct = g && u ? r2((g / u) * 100) : null;
                  return (
                    <td key={i} className="border border-gray-200 px-3 py-2 text-right text-xs tabular-nums text-indigo-600 bg-indigo-50">
                      {pct !== null ? `${pct.toFixed(2)}%` : "-"}
                    </td>
                  );
                })}
                <td className="border border-gray-200 px-3 py-2 text-right text-xs tabular-nums text-indigo-600 bg-indigo-50">
                  {r2((sum6y(d.grossEarnings) / sum6y(d.ucpSales)) * 100)}%
                </td>
              </tr>

              <FSSectionHead>
                <button type="button" className="flex items-center gap-2 w-full text-left" onClick={() => setExpExpanded(e => !e)}>
                  <span>{expExpanded ? "▼" : "▶"}</span> 3. Total Expenses
                </button>
              </FSSectionHead>
              <FSTotalRow label="3. Total Expenses" values={d.totalExpenses} color="amber" total={sum6y(d.totalExpenses)} />
              {expExpanded && d.expenses.map(({ label, values }) => (
                <tr key={label}>
                  <FSLabel indent>{label}</FSLabel>
                  {values.map((v, i) => <FSNum key={i} v={v} />)}
                  <FSNum v={sum6y(values)} />
                </tr>
              ))}

              <FSSectionHead>Profitability</FSSectionHead>
              <FSTotalRow label="4. EBITDA / Cash Profit / Operating Profit" values={d.ebitda} color="green" total={sum6y(d.ebitda)} />
              <tr>
                <FSLabel indent muted>Depreciation</FSLabel>
                {d.depreciation.map((v, i) => <FSNum key={i} v={v} />)}
                <FSNum v={sum6y(d.depreciation)} />
              </tr>
              <FSTotalRow label="5. PBT (Profit Before Tax)" values={d.pbt} color="green" total={sum6y(d.pbt)} />
              <tr>
                <FSLabel bold>6. ROI %</FSLabel>
                {d.roiPct.map((v, i) => <FSNum key={i} v={v} />)}
                <td className="border border-gray-100 px-3 py-2 text-right text-xs text-gray-400 bg-gray-50">—</td>
              </tr>

              <FSSectionHead>
                <button type="button" className="flex items-center gap-2 w-full text-left" onClick={() => setInvExpanded(e => !e)}>
                  <span>{invExpanded ? "▼" : "▶"}</span> 7. Total Investment
                </button>
              </FSSectionHead>
              <FSTotalRow label="7. Total Investment" values={d.totalInvestment} color="amber" />
              {invExpanded && (
                <>
                  <tr>
                    <FSLabel indent>Store Interiors value on Set Up</FSLabel>
                    {FS_YEARS.map((_, i) => (
                      <td key={i} className="border border-gray-200 px-3 py-2 text-right text-xs text-gray-600 bg-white">
                        {i === 0 ? fmtWhole(d.storeInteriors) : "0.0"}
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
