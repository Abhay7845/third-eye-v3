import React, { useState, useEffect } from "react";
import { BASE_URL } from "./data/baseUrl";

const YEARS = ["Yr 0", "Yr 1", "Yr 2", "Yr 3", "Yr 4", "Yr 5", "Yr 6"];

const r2 = (n) => Math.round((n ?? 0) * 100) / 100;
// sum all non-null values across Yr0–Yr6
const sum6y = (vals) => r2((vals ?? []).filter(v => v !== null && v !== undefined).reduce((s, v) => s + (v ?? 0), 0));

// Bisection IRR — guaranteed convergence when sign changes within [-99.99%, 5000%]
function computeIRR(cashFlows, maxIter = 400, tol = 1e-10) {
  console.log(cashFlows)
  if (!cashFlows.length || cashFlows[0] >= 0) return null;
  const npvAt = (r) =>
    cashFlows.reduce((s, cf, i) => s + cf / Math.pow(1 + r, i), 0);
  let lo = -0.9999, hi = 50;
  // widen or narrow until we bracket a sign change
  if (npvAt(lo) * npvAt(hi) > 0) {
    hi = 5;
    if (npvAt(lo) * npvAt(hi) > 0) return null;
  }
  for (let i = 0; i < maxIter; i++) {
    const mid = (lo + hi) / 2;
    const midNpv = npvAt(mid);
    if (Math.abs(midNpv) < tol || hi - lo < tol) return r2(mid * 100);
    if (npvAt(lo) * midNpv <= 0) hi = mid;
    else lo = mid;
  }
  return r2(((lo + hi) / 2) * 100);
}

function parseApiRows(rows, opts = {}) {
  if (!rows?.length) return null;
  const by = {};
  rows.forEach((r) => {
    by[r.Particulars] = r;
  });

  const yrs = (name) => {
    const r = by[name];
    if (!r) return [0, 0, 0, 0, 0, 0, 0];
    return [
      r.Yr0 ?? 0,
      r.Yr1 ?? 0,
      r.Yr2 ?? 0,
      r.Yr3 ?? 0,
      r.Yr4 ?? 0,
      r.Yr5 ?? 0,
      r.Yr6 ?? 0,
    ];
  };
  const scalar = (name) => parseFloat(by[name]?.Header) || 0;

  // Expense-side values come from expense planning (stored in Rupees).
  // Sales-side values (UCP Sales, Gross earnings) come from sales planning (stored in Lakhs).
  // Normalise expenses to Lakhs so EBITDA / PBT / IRR use consistent units.
  const LAKH = 100_000;
  const toLakh = (arr) => arr.map((v) => (v !== null ? r2((v ?? 0) / LAKH) : null));

  const gross = yrs("Gross earnings/Commission"); // already in Lakhs
  const ucpSales = yrs("UCP Sales");
  const customerDiscount = yrs("Customer Discount");


  // NSV: prefer the API row, fall back to UCP − Customer Discount
  const nsvFromApi = yrs("NSV Sales");
  const nsvSales = nsvFromApi.some((v, i) => i > 0 && (v ?? 0) > 0)
    ? nsvFromApi
    : [null, ...ucpSales.slice(1).map((u, i) => r2((u ?? 0) - (customerDiscount[i + 1] ?? 0)))];

  const stockTotal = yrs("Stock_Total")
  const bgCost = YEARS.map((_, i) => {
    if ((by["ROI New Store"]?.Header ?? "") === "L2" || (by["ROI New Store"]?.Header ?? "") === "L4") {
      return (stockTotal[i] * 0.2 * (0.75 / 100))
    }
    else return 0
  })

  // Build expense line items first — totExp is derived from these
  const expenses = [
    { label: "Rent", values: toLakh(yrs("Rent")) },
    { label: "Staff Salaries", values: toLakh(yrs("Staff Salaries")) },
    { label: "Security & Housekeeping", values: toLakh(yrs("Security & Housekeeping")) },
    { label: "Electricity", values: toLakh(yrs("Electricity")) },
    { label: "Repairs & Maintenance", values: toLakh(yrs("Repairs & Maintenance")) },
    { label: "Insurance", values: toLakh(yrs("Insurance")) },
    { label: "BTL", values: toLakh(yrs("BTL")) },
    { label: "Travel & Conveyance", values: toLakh(yrs("Travel & Conveyance")) },
    { label: "Telephone / Internet", values: toLakh(yrs("Telephone/Internet")) },
    { label: "Credit Card Commission", values: toLakh(yrs("Credit Card Commission")) },
    { label: "GST (primarily rental)", values: toLakh(yrs("GST (primarily rental)")) },
    { label: "Store \u2014 Printing / Pantry etc", values: toLakh(yrs("Store - Printing/Pantry etc")) },
    { label: "Consumables, Safety, Cust Exp", values: toLakh(yrs("Consumables, Safety, Cust experience")) },
    { label: "Other \u2014 Staff welfare/Uniforms", values: toLakh(yrs("Other - Staff welfare/Uniforms etc")) },
    { label: "BG cost", values: bgCost },
    { label: "Regn Charges / Temp Store Cost", values: toLakh(yrs("Registeration Charges/Temporary Store Cost")) },
  ];

  // Total expenses — Excel formula:
  // L2.5 → 0; Yr0 = Elec×20% + Staff×20% + Insurance×30% + RegnCharges_Yr0; Yr1–6 = Σ all items
  const isL2_5 = (by["ROI New Store"]?.Header ?? "") === "L2.5";
  const _elec = expenses.find(e => e.label === "Electricity")?.values ?? Array(7).fill(0);
  const _staff = expenses.find(e => e.label === "Staff Salaries")?.values ?? Array(7).fill(0);
  const _ins = expenses.find(e => e.label === "Insurance")?.values ?? Array(7).fill(0);
  const _regn = expenses.find(e => e.label === "Regn Charges / Temp Store Cost")?.values ?? Array(7).fill(0);
  const totExp = Array.from({ length: 7 }, (_, i) => {
    if (isL2_5) return i === 0 ? null : 0;
    if (i === 0) return r2((_elec[1] ?? 0) * 0.2 + (_staff[1] ?? 0) * 0.2 + (_ins[1] ?? 0) * 0.3 + (_regn[0] ?? 0));
    return r2(expenses.reduce((s, e) => s + (e.values[i] ?? 0), 0));
  });
  const storeInteriors = toLakh(yrs("Store Interiors value on Set Up"))[0]; // Rupees → Lakhs
  const ebitda = [
    null,
    ...Array.from({ length: 6 }, (_, i) =>
      r2((gross[i + 1] ?? 0) - (totExp[i + 1] ?? 0)),
    ),
  ];

  const deprn = Array(7).fill(0);

  const cummDepIncYr = YEARS?.map((_, i) => {
    if (i === 0) return 0;
    if (i === 1) {
      deprn.fill(storeInteriors * 0.2, 1, 6);
      return (storeInteriors * 0.2)
    };
    if (i === 2) return deprn[2] + (storeInteriors * 0.2);
    if (i === 3) return deprn[3] + (deprn[2] + (storeInteriors * 0.2));
    if (i === 4) return deprn[4] + (deprn[3] + deprn[2] + (storeInteriors * 0.2));
    if (i === 5) return deprn[5] + (deprn[4] + deprn[3] + deprn[2] + (storeInteriors * 0.2));
    if (i === 6) return deprn[6] + (deprn[5] + deprn[4] + deprn[3] + deprn[2] + (storeInteriors * 0.2));
  })

  const pbt = [...ebitda.map((e, i) => r2((e ?? 0) - deprn[i]))];

  const currentValueOfInteriors = Array(7).fill(0)
  currentValueOfInteriors[0] = storeInteriors - deprn[0];
  for (let i = 1; i <= 6; i++) {
    currentValueOfInteriors[i] = currentValueOfInteriors[i - 1] - deprn[i]
  }

  const workingCapital_atRate_1per = YEARS.map((_, i) => {
    if ((by["ROI New Store"]?.Header ?? "") === "L2.5" || (by["ROI New Store"]?.Header ?? "") === "L3") {
      return (stockTotal[i] + (ucpSales[i] * 0.01) / 12)
    }
    else return (ucpSales[i] * 0.01) / 12
  })

  const secDep = toLakh(yrs("Security Deposit"));
  const totalInv = YEARS.map((_, i) => {
    return r2(workingCapital_atRate_1per[i] + currentValueOfInteriors[i] + secDep[i])
  });

  // Capital expenditure
  const calCapex = Array(7).fill(0);
  calCapex[0] = -currentValueOfInteriors[0];
  calCapex[6] = calCapex[0] + calCapex[0] * 0.05;

  // Sigin
  const calSigningFee = Array(7).fill(0)
  calSigningFee[0] = (by["ROI New Store"]?.Header ?? "") === "L1" ? 0 : -10;

  const calAdvanceRent = Array(7).fill(0)
  calAdvanceRent[0] = secDep[0]
  for (let i = 0; i <= 5; i++) {
    calAdvanceRent[6] = calAdvanceRent[6] + calAdvanceRent[i]
  }

  // Working Capital cash outflow
  const calIncWorkingCapitalCashOutflow = Array(7).fill(0)
  // Formula : Yr0
  calIncWorkingCapitalCashOutflow[0] = -workingCapital_atRate_1per[1];
  // Formula : Yr 1 -> Yr 5 => (workingCap[currYr] - workingCap[nextYr])
  for (let i = 1; i <= 5; i++) {
    calIncWorkingCapitalCashOutflow[i] = (workingCapital_atRate_1per[i] - workingCapital_atRate_1per[i + 1])
  }
  // Formula : Yr 6 => sum of Yr0 till Yr5
  calIncWorkingCapitalCashOutflow[6] = calIncWorkingCapitalCashOutflow.slice(0, 5).reduce((sum, val) => (sum + val), 0);

  // Net Cash Flow
  const calCapexTotal = Array(7).fill(0)
  for (let i = 0; i <= 6; i++) {
    calCapexTotal[i] = calCapex[i] + calSigningFee[i] + calAdvanceRent[i] + calIncWorkingCapitalCashOutflow[i] + ebitda[i]
  }

  // ROI %
  const roiPct = Array(7).fill(0)
  for (let i = 1; i <= 5; i++) {
    roiPct[i] = ebitda[i] / (-calCapexTotal[i] - (roiPct[i - 1] / 2))
  }
  roiPct[6] = (ebitda[6] + calCapex[6] + calSigningFee[6] + calAdvanceRent[6]) / (-(calCapexTotal.slice(0, 5).reduce((s, v) => s + v, 0)))

  const pbtYrs = pbt.slice(1).map((v) => v ?? 0);
  const grossYrs = gross.slice(1).map((v) => v ?? 0);


  // Rent / Revenue (5yr) — both sides must be in Lakhs
  const rentR = by["Rent"];
  const rent5 = rentR
    ? [rentR.Yr1, rentR.Yr2, rentR.Yr3, rentR.Yr4, rentR.Yr5].reduce((s, v) => s + v, 0) : 0;
  const rev5 = ucpSales.slice(0, 6).reduce((s, v) => s + v, 0);
  const rentRev5 = rev5 > 0 ? r2(((rent5 / 100000) / rev5) * 100) : null;

  // Rev per sqft — requires retailArea passed via opts
  const retailArea = opts.retailArea ?? 0;
  const totalUCP = ucpSales.slice(0, 7).reduce((s, v) => s + v, 0);
  const revPerSqft = retailArea > 0 ? (totalUCP / (retailArea * 6)) : 0;

  // Revenue CAGR Yr1 → Yr6
  const cagr = ucpSales[1] > 0 && ucpSales[6] > 0 ? r2((Math.pow(ucpSales[6] / ucpSales[1], 0.2) - 1) * 100) : null;

  // Payout % (5 yr)
  const grossEarning5 = gross.slice(0, 6).reduce((s, v) => s + v, 0);
  const grossUCPSales5 = ucpSales.slice(0, 6).reduce((s, v) => s + v, 0);
  const payOutPer = (grossEarning5 / grossUCPSales5) * 100

  // IRR
  const hasPositive = calCapexTotal.some(v => v > 0);
  const hasNegative = calCapexTotal.some(v => v < 0);
  const irr = (hasPositive & hasNegative) > 0 ? computeIRR(calCapexTotal) : null;

  // NPV @ 11%
  let npv = calCapexTotal[0] + calCapexTotal.slice(1).reduce((sum, cf, i) => sum + cf / Math.pow(1.11, i + 1), 0)

  // Payback period
  const calculatePaybackPeriod = (initialCapex,cashFlows)=>{
    const investment = Math.abs(initialCapex)
    let cummulativeCashFlow = 0
    for( let i = 0;i<cashFlows.length;i++){
      cummulativeCashFlow += cashFlows[i];
      if(cummulativeCashFlow >= investment) return i+1
    }
    return 6
  }

  const payback = calculatePaybackPeriod(calCapex[0],calCapexTotal.slice(1));

  return {
    roiType: by["ROI New Store"]?.Header ?? "0.0",
    cityName: by["City Name"]?.Header ?? "0.0",
    ucpSales,
    customerDiscount,
    nsvSales,
    grossEarnings: gross,
    totalExpenses: totExp,
    expenses,
    ebitda,
    depreciation: deprn,
    pbt,
    roiPct,
    storeInteriors,
    totalInvestment: totalInv,
    cumDeprn: cummDepIncYr,
    currentInteriors: currentValueOfInteriors,
    workingCapital: workingCapital_atRate_1per,
    securityDeposit: secDep,
    capex: calCapex,
    signingFee: calSigningFee,
    advRent: calAdvanceRent,
    cashOutflow: calIncWorkingCapitalCashOutflow,
    capexTotal: calCapexTotal,
    kpis: {
      rentRevenue5yr: rentRev5,
      revPerSqft,
      revenueCAGR: cagr,
      payout5yr: payOutPer,
      irr,
      npv,
      paybackCapex: payback,
    },
    hasNegative,
    hasPositive,
  };
}

function buildSubmitPayload(d) {
  const row = (particulars, vals, header) => {
    const o = { particulars };
    if (header !== undefined) o.header = String(header);
    if (vals) {
      ["yr0", "yr1", "yr2", "yr3", "yr4", "yr5", "yr6"].forEach((k, i) => {
        o[k] = vals[i] ?? 0;
      });
      o["6Yr"] = r2(vals.slice(1).reduce((s, v) => s + (v ?? 0), 0));
    }
    return o;
  };
  return [
    { particulars: "ROI New Store", header: d.roiType },
    { particulars: "City Name", header: d.cityName },
    row("UCP Sales", d.ucpSales),
    row("Customer Discount", d.customerDiscount),
    row("NSV Sales", d.nsvSales),
    row("Gross earnings/Commission", d.grossEarnings),
    row("Total expenses", d.totalExpenses),
    ...d.expenses.map((e) => row(e.label, e.values)),
    row("EBITDA / Cash Profit / Operating Profit", d.ebitda),
    row("Depreciation", d.depreciation),
    row("PBT", d.pbt),
    row("ROI%", d.roiPct),
    row("Total Investment", d.totalInvestment),
    {
      particulars: "Store Interiors value on Set Up",
      header: String(d.storeInteriors),
    },
    row("Cumulative Depreciation (incl current yr)", d.cumDeprn),
    row("Current Value of Interiors", d.currentInteriors),
    row("Working Capital / Petty cash @ 1% sale", d.workingCapital),
    row("Security deposit", d.securityDeposit),
    row("Capital Expenditure", d.capex),
    row("Signing Fee", d.signingFee),
    row("Advance paid ( Rent )", d.advRent),
    row("Incremental Working capital - Cash outflow", d.cashOutflow),
    row("Operating profit (Before Interest & Deprn)", d.ebitda),
    row("Total", d.capexTotal),
    {
      particulars: "Rent to revenue ratio (5 yr)",
      header: String(d.kpis.rentRevenue5yr ?? 0),
    },
    {
      particulars: "Revenue per Square Feet (Average)",
      header: String(d.kpis.revPerSqft ?? 0),
    },
    { particulars: "Revenue - CAGR", header: String(d.kpis.revenueCAGR ?? 0) },
    { particulars: "Payout % (5 yr)", header: String(d.kpis.payout5yr ?? 0) },
    {
      particulars: "Internal Rate of Return (IRR)",
      header: String(d.kpis.irr ?? 0),
    },
    {
      particulars: "Net Present Value (NPV) @11% cost of capital",
      header: String(d.kpis.npv ?? 0),
    },
    {
      particulars: "Payback period (years) - for only Capex",
      header: String(d.kpis.paybackCapex ?? 0),
    },
  ];
}

// ─── Formatters ───────────────────────────────────────────────────────────────
const fmt = (n) => {
  if (n === null || n === undefined) return "0.0";
  if (n === 0) return " - ";
  const abs = Math.abs(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return n < 0 ? `(${abs})` : abs;
};

const fmtPct = (n, decimals = 1) => {
  if (n === null || n === undefined) return "0.0";
  return `${Number(n).toFixed(decimals)}%`;
};

// ─── Cell component ───────────────────────────────────────────────────────────
function Num({ v, bold = false, highlight = false }) {
  const text = fmt(v);
  const isNeg = typeof v === "number" && v < 0;
  return (
    <td
      className={`border border-gray-200 px-3 py-2 text-right text-xs tabular-nums whitespace-nowrap ${highlight ? "bg-amber-50" : "bg-white"
        } ${bold ? "font-bold" : ""} ${isNeg ? "text-red-600" : "text-gray-800"
        }`}>
      {text}
    </td>
  );
}

function Label({ children, indent = false, bold = false, muted = false }) {
  return (
    <td
      className={`border border-gray-200 px-3 py-2 text-xs min-w-[230px] sticky left-0 z-10 bg-white ${indent ? "pl-6" : ""
        } ${bold
          ? "font-bold text-gray-900"
          : muted
            ? "text-gray-500"
            : "text-gray-700"
        }`}>
      {children}
    </td>
  );
}

function SectionHead({ children, colSpan = 9 }) {
  return (
    <tr>
      <td
        colSpan={colSpan}
        className='border border-indigo-200 bg-indigo-700 text-white text-xs font-bold px-3 py-2 sticky left-0'>
        {children}
      </td>
    </tr>
  );
}

function TotalRow({ label, values, color = "amber", total }) {
  const palette = {
    amber: "bg-amber-100 font-bold text-amber-900 border-amber-300",
    green: "bg-green-100 font-bold text-green-900 border-green-300",
    blue: "bg-blue-100  font-bold text-blue-900  border-blue-300",
    red: "bg-red-50    font-bold text-red-800   border-red-200",
  };
  const cls = palette[color] ?? palette.amber;
  return (
    <tr>
      <td className={`border px-3 py-2 text-xs sticky left-0 z-10 ${cls}`}>
        {label}
      </td>
      {values.map((v, i) => {
        const isNeg = typeof v === "number" && v < 0;
        return (
          <td
            key={i}
            className={`border px-3 py-2 text-xs text-right tabular-nums whitespace-nowrap ${cls} ${isNeg ? "text-red-700" : ""
              }`}>
            {fmt(v)}
          </td>
        );
      })}
      <td className={`border px-3 py-2 text-xs text-right tabular-nums whitespace-nowrap font-bold ${total != null ? cls : "bg-gray-100 text-gray-500 border-gray-200"
        } ${typeof total === "number" && total < 0 ? "!text-red-700" : ""}`}>
        {total != null ? fmt(total) : "0.0"}
      </td>
    </tr>
  );
}

// ─── KPI card ─────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, color = "indigo" }) {
  const palette = {
    indigo: "from-indigo-500 to-indigo-700",
    green: "from-green-500  to-emerald-600",
    amber: "from-amber-500  to-orange-600",
    blue: "from-blue-500   to-blue-700",
  };
  return (
    <div
      className={`rounded-xl bg-gradient-to-br ${palette[color]} text-white p-5 shadow-md`}>
      <p className='text-xs font-semibold text-white/70 uppercase tracking-wide mb-1'>
        {label}
      </p>
      <p className='text-2xl font-extrabold'>{value}</p>
      {sub && <p className='text-xs text-white/60 mt-1'>{sub}</p>}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function SummaryPage5({ roiContext, onPrevious, onHome }) {
  const [expExpanded, setExpExpanded] = useState(true);
  const [invExpanded, setInvExpanded] = useState(false);
  const [cashExpanded, setCashExpanded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [apiData, setApiData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [showPdf, setShowPdf] = useState(false);

  const isNewStore = roiContext?.projectType === "New Store";
  const historyId = roiContext?.historyId;

  // ─── Inline PDF modal (only for New Store) ──────────────────────────────
  function NewStorePDFModal({ onClose }) {
    const [pdfUrl, setPdfUrl] = useState(null);
    const [pdLoading, setPdLoading] = useState(true);
    const [pdErr, setPdErr] = useState(null);
    useEffect(() => {
      if (!historyId) return;
      (async () => {
        try {
          const res = await fetch(`https://d6oojw29okpcs.cloudfront.net/ThirdEye//history/${encodeURIComponent(historyId).replace(' ', '_')}`);
          if (!res.ok) throw new Error("Failed to fetch history details.");
          const json = await res.json();
          const d = json.data?.[0] ?? {};
          const url = d.pdf_url ?? d.document_url ?? d.pdf_link ?? d.file_url ??
            Object.values(d).find(v =>
              typeof v === "string" && v.startsWith("http") &&
              (v.includes(".pdf") || v.includes("blob") || v.includes("drive") || v.includes("/document"))
            ) ?? null;
          if (!url) setPdErr("No PDF document is linked to this History ID.");
          setPdfUrl(url);
        } catch (e) {
          setPdErr(e.message);
        } finally {
          setPdLoading(false);
        }
      })();
    }, []);
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
            {pdLoading ? (
              <div className="flex items-center justify-center h-full gap-3">
                <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
                <p className="text-slate-400 text-sm">Loading document…</p>
              </div>
            ) : pdErr ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-400">
                <span className="text-4xl">📭</span>
                <p className="text-sm">{pdErr}</p>
              </div>
            ) : (
              <iframe src={pdfUrl} className="w-full h-full" title="New Store Document" />
            )}
          </div>
        </div>
      </div>
    );
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!roiContext?.roiId) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const roiid = roiContext.roiId
        const res = await fetch(
          `${BASE_URL}/summary_screen_5/${roiid}`,
        );
        if (!res.ok) throw new Error("Failed to load summary data.");
        const json = await res.json();
        const retailArea = parseFloat(roiContext?.historyRetailArea || roiContext?.existingRetailArea) || 0;
        const res2 = await fetch(`${BASE_URL}/sales_planning`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ screen: 3, roiid }),
        });
        if (!res.ok) throw new Error("Failed to load Stock data.");
        const json2 = await res2.json();
        let stockTotal = json2?.data.filter((it) => it.Header === 'Stock_Total')
        stockTotal[0].Yr0 = 0
        stockTotal[0].Particulars = stockTotal[0].Header
        stockTotal[0].Header = ''
        delete stockTotal[0].roiid
        delete stockTotal[0].status
        let finalDataToParse = [...json?.data, ...stockTotal]
        setApiData(parseApiRows(finalDataToParse, { retailArea }));
      } catch (e) {
        setFetchError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [roiContext?.roiId]);

  const d = apiData;

  // ── Submission validation rules ─────────────────────────────────────────
  const storeFormat = d?.roiType ?? "";
  const irr = d?.kpis?.irr;
  const payback = d?.kpis?.paybackCapex;
  const validationWarnings = d ? (() => {
    const w = [];
    if (storeFormat === "L1" && irr !== null && irr < 17.95)
      w.push("The IRR is very low for an L1 Store. Please tweak the projections to improve the IRR to minimum 18%.");
    if ((storeFormat === "L2" || storeFormat === "L4") && irr !== null && irr < 15)
      w.push("The IRR is very low for an L2/L4 Store. Please tweak the projections to improve the IRR to minimum 16%.");
    if (storeFormat === "L3" && irr !== null && irr < 11.95)
      w.push("The IRR is very low for an L3 Store. Please tweak the projections to improve the IRR to minimum 12%.");
    if (storeFormat === "L2.5" && irr !== null && irr < 11.75)
      w.push("The IRR is very low for an L2.5 Store. Please tweak the projections to improve the IRR to minimum 12%.");
    if (storeFormat === "L1" && payback !== null && payback > 4)
      w.push("The CAPEX Payback period is very high for an L1 Store. Please rework the projections.");
    if (storeFormat !== "L1" && storeFormat !== "" && payback !== null && payback > 5)
      w.push("The CAPEX Payback period is very high for the Store. Please rework the projections.");
    if(!d.hasNegative & irr === null)
      w.push("IRR cannot be calculated Please make sure an intial investment is neagtive")
    if(!d.hasPositive & irr === null)
      w.push("IRR cannot be calculated Please make sure at least one future ccash flow/return is positive")
    return w;
  })() : [];
  const canSubmit = validationWarnings.length === 0;

  const handleSubmit = async () => {
    if (!d || !roiContext?.roiId) return;
    setSubmitting(true);
    try {
      const saveRes = await fetch(`${BASE_URL}/summary_screen_5/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roiid: roiContext.roiId,
          summary_data: buildSubmitPayload(d),
        }),
      });
      if (!saveRes.ok) throw new Error("Failed to save summary.");
      const statusRes = await fetch(
        `${BASE_URL}/roi/submit/${roiContext.roiId}`,
        { method: "POST" },
      );
      if (!statusRes.ok) throw new Error("Failed to update status.");
      setSubmitted(true);
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading)
    return (
      <div className='flex items-center justify-center min-h-[60vh]'>
        <p className='text-gray-400 text-lg animate-pulse'>
          Loading summary\u2026
        </p>
      </div>
    );
  if (fetchError)
    return (
      <div className='p-8 text-center'>
        <p className='text-red-500 font-semibold'>{fetchError}</p>
      </div>
    );
  if (!d)
    return (
      <div className='flex items-center justify-center min-h-[60vh]'>
        <p className='text-gray-400'>No summary data available for this ROI.</p>
      </div>
    );

  if (submitted) {
    return (
      <div className='flex flex-col items-center justify-center min-h-[60vh] p-12 text-center'>
        <div className='text-7xl mb-6'>🎉</div>
        <h2 className='text-xl font-extrabold text-gray-900 mb-2'>
          ROI Request Submitted!
        </h2>
        <p className='text-gray-500 text-lg mb-4'>
          Your request has been submitted for approval.
        </p>
        {roiContext?.roiId && (
          <div className='bg-indigo-50 border border-indigo-200 rounded-xl px-8 py-4 mt-2'>
            <p className='text-indigo-500 text-xs font-semibold uppercase tracking-widest mb-1'>
              ROI ID
            </p>
            <p className='text-2xl font-extrabold text-indigo-800 font-mono'>
              {roiContext.roiId}
            </p>
          </div>
        )}
        <button
          onClick={onHome}
          className='mt-8 px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm shadow-lg transition'>
          ← Back to Main Page
        </button>
      </div>
    );
  }

  return (
    <div className='p-6 bg-gradient-to-br from-slate-50 to-indigo-50 min-h-screen space-y-6'>
      {/* ── Completion banner ──────────────────────────────────────────────── */}
      <div className='bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl px-8 py-6 flex items-center justify-between shadow-lg'>
        <div className='flex items-center gap-4'>
          <span className='text-4xl'>✅</span>
          <div>
            <h2 className='text-xl font-extrabold text-white'>
              ROI Form Complete
            </h2>
            <p className='text-green-100 text-sm mt-0.5'>
              All sections filled. Review the summary below before submitting.
            </p>
          </div>
        </div>
        {roiContext?.roiId && (
          <div className='bg-white/20 rounded-xl px-5 py-3 text-right'>
            <p className='text-white/70 text-xs font-semibold uppercase tracking-widest'>
              ROI ID
            </p>
            <p className='text-white font-extrabold text-lg font-mono tracking-widest'>
              {roiContext.roiId}
            </p>
          </div>
        )}
      </div>

      {/* ── Context info strip ────────────────────────────────────────────── */}
      <div className='bg-white rounded-xl shadow-sm border border-gray-100 px-6 py-4'>
        <div className='grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm'>
          {[
            ["Project Type", roiContext?.projectType ?? "New Store", false],
            ["City", roiContext?.city ?? "0.0", false],
            ["Region", roiContext?.region ?? "0.0", false],
            roiContext?.projectType === "New Store"
              ? ["History ID", roiContext?.historyId ?? "0.0", true]
              : ["Store Code", roiContext?.existingStoreCode || "0.0", true],
          ].map(([label, value, mono]) => (
            <div key={label} className='min-w-0'>
              <p className='text-xs text-gray-400 font-semibold uppercase tracking-wide'>
                {label}
              </p>
              <p
                className={`font-bold text-gray-800 mt-0.5 truncate ${mono ? "font-mono text-xs" : ""
                  }`}
                title={String(value)}>
                {value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── KPI cards ─────────────────────────────────────────────────────── */}
      <div className='grid grid-cols-2 sm:grid-cols-4 gap-4'>
        <KpiCard
          label='NPV @ 11% CoC'
          value={`₹ ${fmt(d.kpis.npv)} L`}
          sub='Net Present Value'
          color='green'
        />
        <KpiCard
          label='Payback Period'
          value={
            d.kpis.paybackCapex !== null ? `${d.kpis.paybackCapex} yr` : "0.0"
          }
          sub='For Capex only'
          color='blue'
        />
        <KpiCard
          label='IRR'
          value={d.kpis.irr !== null ? fmtPct(d.kpis.irr) : "0.0"}
          sub='Internal Rate of Return'
          color='indigo'
        />
        <KpiCard
          label='Rev / Sq.Ft'
          value={d.kpis.revPerSqft !== null ? `₹ ${d.kpis.revPerSqft.toFixed(2)}` : "0.0"}
          sub='Average across 6 years'
          color='amber'
        />
      </div>

      {/* ── Main financial table ───────────────────────────────────────────── */}
      <div className='bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden'>
        {/* Table header */}
        <div className='px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2'>
          <div>
            <h3 className='text-lg font-bold text-gray-800'>
              ROI Summary — {roiContext?.projectType ?? "New Store"}
            </h3>
            <p className='text-xs text-gray-400 mt-0.5'>
              All figures in ₹ Lacs &nbsp;·&nbsp; Category {d.roiType}
            </p>
          </div>
          <span className='text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full'>
            {d.roiType} &nbsp;&middot;&nbsp; {d.cityName}
          </span>
        </div>

        <div className='overflow-x-auto'>
          <table className='min-w-full border-collapse text-xs'>
            {/* Column headers */}
            <thead>
              <tr className='bg-indigo-700 text-white text-xs font-semibold'>
                <th className='border border-indigo-600 px-3 py-3 text-left min-w-[230px] sticky left-0 bg-indigo-700 z-20'>
                  Particulars
                </th>
                {YEARS.map((yr) => (
                  <th
                    key={yr}
                    className='border border-indigo-600 px-3 py-3 text-center min-w-[90px]'>
                    {yr}
                  </th>
                ))}
                <th className='border border-amber-500 px-3 py-3 text-center min-w-[100px] bg-amber-600'>
                  6Y Total
                </th>
              </tr>
            </thead>
            <tbody>
              {/* ── INCOME ── */}
              <SectionHead>Income</SectionHead>

              <tr>
                <Label>1. UCP Sales</Label>
                {d.ucpSales.map((v, i) => (
                  <Num key={i} v={v} />
                ))}
                <Num v={sum6y(d.ucpSales)} bold />
              </tr>
              <tr>
                <Label indent>Customer Discount</Label>
                {d.customerDiscount.map((v, i) => (
                  <Num key={i} v={v} />
                ))}
                <Num v={sum6y(d.customerDiscount)} />
              </tr>
              <TotalRow label='NSV Sales' values={d.nsvSales} color='blue' total={sum6y(d.nsvSales)} />
              <TotalRow
                label='2. Gross Earnings / Commission'
                values={d.grossEarnings}
                color='green'
                total={sum6y(d.grossEarnings)}
              />
              {/* UI-only: Gross Earnings as % of UCP Sales per year */}
              <tr>
                <Label indent muted>%</Label>
                {YEARS.map((y, i) => {
                  const u = d.ucpSales[i];
                  const g = d.grossEarnings[i];
                  const pct = g && u ? r2((g / u) * 100) : null;
                  return (
                    <td key={i} className='border border-gray-200 px-3 py-2 text-right text-xs tabular-nums text-indigo-600 bg-indigo-50'>
                      {pct !== null ? `${pct.toFixed(2)}%` : "-"}
                    </td>
                  );

                })}
                <td className='border border-gray-200 px-3 py-2 text-right text-xs tabular-nums text-indigo-600 bg-indigo-50'>
                  {r2((sum6y(d.grossEarnings) / sum6y(d.ucpSales)) * 100)}%
                </td>
              </tr>

              {/* ── EXPENSES ──────────────────────────────────────────── */}
              <SectionHead>
                <button
                  className='flex items-center gap-2 w-full text-left'
                  onClick={() => setExpExpanded((e) => !e)}>
                  <span>{expExpanded ? "▼" : "▶"}</span>
                  3. Total Expenses
                </button>
              </SectionHead>

              <TotalRow
                label='3. Total Expenses'
                values={d.totalExpenses}
                color='amber'
                total={sum6y(d.totalExpenses)}
              />

              {expExpanded &&
                d.expenses.map(({ label, values }) => (
                  <tr key={label}>
                    <Label indent>{label}</Label>
                    {values.map((v, i) => (
                      <Num key={i} v={v} />
                    ))}
                    <Num v={sum6y(values)} />
                  </tr>
                ))}

              {/* ── PROFITABILITY ─────────────────────────────────────── */}
              <SectionHead>Profitability</SectionHead>

              <TotalRow
                label='4. EBITDA / Cash Profit / Operating Profit'
                values={d.ebitda}
                color='green'
                total={sum6y(d.ebitda)}
              />
              <tr>
                <Label indent muted>
                  Depreciation
                </Label>
                {d.depreciation.map((v, i) => (
                  <Num key={i} v={v} />
                ))}
                <Num v={sum6y(d.depreciation)} />
              </tr>
              <TotalRow
                label='5. PBT (Profit Before Tax)'
                values={d.pbt}
                color='green'
                total={sum6y(d.pbt)}
              />

              <tr>
                <Label bold>6. ROI %</Label>
                {d.roiPct.map((v, i) => (
                  <Num key={i} v={v} />
                ))}
                <td className='border border-gray-100 px-3 py-2 text-right text-xs text-gray-400 bg-gray-50'>—</td>
              </tr>

              {/* ── INVESTMENT ────────────────────────────────────────── */}
              <SectionHead>
                <button
                  className='flex items-center gap-2 w-full text-left'
                  onClick={() => setInvExpanded((e) => !e)}>
                  <span>{invExpanded ? "▼" : "▶"}</span>
                  7. Total Investment
                </button>
              </SectionHead>

              <TotalRow
                label='7. Total Investment'
                values={d.totalInvestment}
                color='amber'
              />

              {invExpanded && (
                <>
                  <tr>
                    <Label indent>Store Interiors value on Set Up</Label>
                    {YEARS.map((_, i) => (
                      <td
                        key={i}
                        className='border border-gray-200 px-3 py-2 text-right text-xs text-gray-600 bg-white'>
                        {i === 0 ? fmt(d.storeInteriors) : "0.0"}
                      </td>
                    ))}
                    <td className='border border-gray-100 px-3 py-2 text-right text-xs text-gray-400 bg-gray-50'>—</td>
                  </tr>
                  <tr>
                    <Label indent>
                      Cumulative Depreciation (incl. current yr)
                    </Label>
                    {d.cumDeprn.map((v, i) => (
                      <Num key={i} v={v} />
                    ))}
                    <td className='border border-gray-100 px-3 py-2 text-right text-xs text-gray-400 bg-gray-50'>—</td>
                  </tr>
                  <tr>
                    <Label indent>Current Value of Interiors</Label>
                    {d.currentInteriors.map((v, i) => (
                      <Num key={i} v={v} />
                    ))}
                    <td className='border border-gray-100 px-3 py-2 text-right text-xs text-gray-400 bg-gray-50'>—</td>
                  </tr>
                  <tr>
                    <Label indent>Working Capital / Petty Cash @ 1% sale</Label>
                    {d.workingCapital.map((v, i) => (
                      <Num key={i} v={v} />
                    ))}
                    <td className='border border-gray-100 px-3 py-2 text-right text-xs text-gray-400 bg-gray-50'>—</td>
                  </tr>
                  <tr>
                    <Label indent>Security Deposit</Label>
                    {d.securityDeposit.map((v, i) => (
                      <Num key={i} v={v} />
                    ))}
                    <td className='border border-gray-100 px-3 py-2 text-right text-xs text-gray-400 bg-gray-50'>—</td>
                  </tr>
                </>
              )}

              {/* ── CASH FLOW ─────────────────────────────────────────── */}
              <SectionHead>
                <button
                  className='flex items-center gap-2 w-full text-left'
                  onClick={() => setCashExpanded((e) => !e)}>
                  <span>{cashExpanded ? "▼" : "▶"}</span>
                  Cash Outflow (−) / Inflow (+)
                </button>
              </SectionHead>

              <TotalRow
                label='Net Cash Flow'
                values={d.capexTotal}
                color='blue'
              />

              {cashExpanded && (
                <>
                  <tr>
                    <Label indent>Capital Expenditure</Label>
                    {d.capex.map((v, i) => (
                      <Num key={i} v={v} />
                    ))}
                    <td className='border border-gray-100 px-3 py-2 text-right text-xs text-gray-400 bg-gray-50'>—</td>
                  </tr>
                  <tr>
                    <Label indent muted>
                      Signing Fee
                    </Label>
                    {d.signingFee.map((v, i) => (
                      <Num key={i} v={v} />
                    ))}
                    <td className='border border-gray-100 px-3 py-2 text-right text-xs text-gray-400 bg-gray-50'>—</td>
                  </tr>
                  <tr>
                    <Label indent muted>
                      Advance paid (Rent)
                    </Label>
                    {d.advRent.map((v, i) => (
                      <Num key={i} v={v} />
                    ))}
                    <td className='border border-gray-100 px-3 py-2 text-right text-xs text-gray-400 bg-gray-50'>—</td>
                  </tr>
                  <tr>
                    <Label indent muted>
                      Incremental Working capital - Cash outflow
                    </Label>
                    {d.cashOutflow.map((v, i) => (
                      <Num key={i} v={v} />
                    ))}
                    <td className='border border-gray-100 px-3 py-2 text-right text-xs text-gray-400 bg-gray-50'>—</td>
                  </tr>
                  <tr>
                    <Label indent muted>
                      Operating profit (Before Interest & Deprn)
                    </Label>
                    {d.ebitda?.map((v, i) => (
                      <Num key={i} v={v} />
                    ))}
                    <td className='border border-gray-100 px-3 py-2 text-right text-xs text-gray-400 bg-gray-50'>—</td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Additional KPIs table ──────────────────────────────────────────── */}
      <div className='bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden'>
        <div className='px-6 py-4 border-b border-gray-100'>
          <h3 className='text-sm font-bold text-gray-800 uppercase tracking-wide'>
            Key Metrics
          </h3>
        </div>
        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-0 divide-y sm:divide-y-0 sm:divide-x divide-gray-100'>
          {[
            {
              label: "Rent to Revenue Ratio (5 yr)",
              value:
                d.kpis.rentRevenue5yr !== null
                  ? fmtPct(d.kpis.rentRevenue5yr)
                  : "0.0",
            },
            {
              label: "Revenue per Sq. Ft. (Average)",
              value:
                d.kpis.revPerSqft !== null
                  ? `₹ ${d.kpis.revPerSqft.toFixed(2)}`
                  : "0.0",
            },
            {
              label: "Revenue — CAGR",
              value:
                d.kpis.revenueCAGR !== null ? fmtPct(d.kpis.revenueCAGR) : "0.0",
            },
            {
              label: "Payout % (5 yr)",
              value: d.kpis.payout5yr !== null ? fmtPct(d.kpis.payout5yr) : "0.0",
            },
            {
              label: "IRR",
              value: d.kpis.irr !== null ? fmtPct(d.kpis.irr) : "0.0",
            },
            {
              label: "NPV @ 11% Cost of Capital",
              value: d.kpis.npv !== null ? `₹ ${fmt(d.kpis.npv)} L` : "0.0",
            },
            {
              label: "Payback Period (Capex)",
              value:
                d.kpis.paybackCapex !== null
                  ? `${d.kpis.paybackCapex} years`
                  : "0.0",
            },
          ].map(({ label, value }) => (
            <div key={label} className='px-6 py-4'>
              <p className='text-[10px] font-semibold text-gray-400 uppercase tracking-wide'>
                {label}
              </p>
              <p
                className={`text-lg font-extrabold mt-1 ${value === "0.0" ? "text-gray-300" : "text-gray-900"
                  }`}>
                {value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Action bar ────────────────────────────────────────────────────── */}
      {/* Validation warnings — shown above submit when thresholds fail */}
      {validationWarnings.length > 0 && (
        <div className='bg-red-50 border border-red-300 rounded-2xl px-6 py-4 space-y-2'>
          <p className='text-xs font-bold text-red-700 uppercase tracking-wide mb-1'>⚠ Cannot Submit — Please resolve the following issues:</p>
          {validationWarnings.map((msg, i) => (
            <div key={i} className='flex items-start gap-2 text-sm text-red-700'>
              <span className='mt-0.5 flex-shrink-0'>•</span>
              <span>{msg}</span>
            </div>
          ))}
        </div>
      )}
      <div className='bg-white rounded-2xl shadow-sm border border-gray-100 px-6 py-5 flex items-center justify-start gap-4'>
        <div className='flex items-center gap-3'>
          <p className='text-xs text-gray-400 hidden sm:block'>
            All sections are complete. Submit your ROI request for approval.
          </p>
          {/* PDF button for New Store — shown only on the Summary page */}
          {/* {isNewStore && historyId && (
            <button
              type='button'
              onClick={() => setShowPdf(true)}
              className='px-5 py-3 rounded-xl font-bold text-sm shadow-lg transition bg-blue-600 hover:bg-blue-700 text-white'>
              📄 View New Store PDF
            </button>
          )} */}
          <button
            type='button'
            onClick={handleSubmit}
            disabled={submitting || !canSubmit}
            className={`px-8 py-3 rounded-xl font-bold text-sm shadow-lg transition ${submitting || !canSubmit
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-green-600 hover:bg-green-700 text-white"
              }`}>
            {submitting ? "Submitting…" : "Submit for Approval ✓"}
          </button>
        </div>
      </div>
      {/* PDF modal */}
      {showPdf && <NewStorePDFModal onClose={() => setShowPdf(false)} />}
    </div>
  );
}
