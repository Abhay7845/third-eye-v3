import React, { useState, useEffect } from "react";
import { BASE_URL } from "./data/baseUrl";

const YEARS = ["Yr 0", "Yr 1", "Yr 2", "Yr 3", "Yr 4", "Yr 5", "Yr 6"];

const r2 = (n) => Math.round((n ?? 0) * 100) / 100;

// Bisection IRR — guaranteed convergence when sign changes within [-99.99%, 5000%]
function computeIRR(cashFlows, maxIter = 400, tol = 1e-10) {
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
    if (!r) return [null, 0, 0, 0, 0, 0, 0];
    return [
      null,
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
  const totExp = toLakh(yrs("Total expenses"));    // Rupees → Lakhs
  const ucpSales = yrs("UCP Sales");
  const customerDiscount = yrs("Customer Discount");

  // NSV: prefer the API row, fall back to UCP − Customer Discount
  const nsvFromApi = yrs("NSV Sales");
  const nsvSales = nsvFromApi.some((v, i) => i > 0 && (v ?? 0) > 0)
    ? nsvFromApi
    : [null, ...ucpSales.slice(1).map((u, i) => r2((u ?? 0) - (customerDiscount[i + 1] ?? 0)))];

  const ebitda = [
    null,
    ...Array.from({ length: 6 }, (_, i) =>
      r2((gross[i + 1] ?? 0) - (totExp[i + 1] ?? 0)),
    ),
  ];
  const deprn = [null, 0, 0, 0, 0, 0, 0];
  const pbt = [null, ...ebitda.slice(1).map((e) => r2((e ?? 0) - 0))];

  const storeInteriors = scalar("Store Interiors value on Set Up") / LAKH; // Rupees → Lakhs
  const secDep = scalar("Security Deposit") / LAKH;
  const totalInv = r2(storeInteriors + secDep);
  const roiPct = [
    null,
    ...pbt
      .slice(1)
      .map((p) => (totalInv > 0 ? r2(((p ?? 0) / totalInv) * 100) : null)),
  ];

  const pbtYrs = pbt.slice(1).map((v) => v ?? 0);
  const grossYrs = gross.slice(1).map((v) => v ?? 0);

  // NPV @ 11%
  let npv = -totalInv;
  pbtYrs.forEach((v, i) => {
    npv += v / Math.pow(1.11, i + 1);
  });
  npv = r2(npv);

  // IRR
  const irrCashFlows = [-totalInv, ...pbtYrs];
  const irr = totalInv > 0 ? computeIRR(irrCashFlows) : null;

  // Payback period
  let cum = -totalInv,
    payback = null;
  for (let i = 0; i < pbtYrs.length; i++) {
    cum += pbtYrs[i];
    if (cum >= 0 && payback === null) {
      payback = i + 1;
      break;
    }
  }

  // Revenue CAGR Yr1 → Yr6
  const g1 = grossYrs[0],
    g6 = grossYrs[5];
  const cagr = g1 > 0 && g6 > 0 ? r2((Math.pow(g6 / g1, 0.2) - 1) * 100) : null;

  // Rent / Revenue (5yr)
  const rentR = by["Rent"];
  const rent5 = rentR
    ? [rentR.Yr1, rentR.Yr2, rentR.Yr3, rentR.Yr4, rentR.Yr5].reduce(
      (s, v) => s + (v ?? 0),
      0,
    )
    : 0;
  const rev5 = grossYrs.slice(0, 5).reduce((s, v) => s + v, 0);
  const rentRev5 = rev5 > 0 ? r2((rent5 / rev5) * 100) : null;

  // Rev per sqft — requires retailArea passed via opts
  const retailArea = opts.retailArea ?? 0;
  const avgGross = grossYrs.reduce((s, v) => s + v, 0) / 6;
  const revPerSqft = retailArea > 0 ? Math.round(avgGross / retailArea * 100000) : 0;

  return {
    roiType: by["ROI New Store"]?.Header ?? "—",
    cityName: by["City Name"]?.Header ?? "—",
    ucpSales,
    customerDiscount,
    nsvSales,
    grossEarnings: gross,
    totalExpenses: totExp,
    expenses: [
      { label: "Rent", values: yrs("Rent") },
      { label: "Staff Salaries", values: yrs("Staff Salaries") },
      {
        label: "Security & Housekeeping",
        values: yrs("Security & Housekeeping"),
      },
      { label: "Electricity", values: yrs("Electricity") },
      { label: "Repairs & Maintenance", values: yrs("Repairs & Maintenance") },
      { label: "Insurance", values: yrs("Insurance") },
      { label: "BTL", values: yrs("BTL") },
      { label: "Travel & Conveyance", values: yrs("Travel & Conveyance") },
      { label: "Telephone / Internet", values: yrs("Telephone/Internet") },
      {
        label: "Credit Card Commission",
        values: yrs("Credit Card Commission"),
      },
      {
        label: "GST (primarily rental)",
        values: yrs("GST (primarily rental)"),
      },
      {
        label: "Store \u2014 Printing / Pantry etc",
        values: yrs("Store - Printing/Pantry etc"),
      },
      {
        label: "Consumables, Safety, Cust Exp",
        values: yrs("Consumables, Safety, Cust experience"),
      },
      {
        label: "Other \u2014 Staff welfare/Uniforms",
        values: yrs("Other - Staff welfare/Uniforms etc"),
      },
      { label: "BG cost", values: [null, 0, 0, 0, 0, 0, 0] },
      {
        label: "Regn Charges / Temp Store Cost",
        values: [0, 0, 0, 0, 0, 0, 0],
      },
    ],
    ebitda,
    depreciation: deprn,
    pbt,
    roiPct,
    storeInteriors,
    totalInvestment: Array(7).fill(totalInv),
    cumDeprn: [0, 0, 0, 0, 0, 0, 0],
    currentInteriors: Array(7).fill(storeInteriors),
    workingCapital: [null, 0, 0, 0, 0, 0, 0],
    securityDeposit: Array(7).fill(secDep),
    capex: [-storeInteriors, null, null, null, null, null, secDep],
    capexTotal: [-totalInv, 0, 0, 0, 0, 0, secDep],
    kpis: {
      rentRevenue5yr: rentRev5,
      revPerSqft,
      revenueCAGR: cagr,
      payout5yr: null,
      irr,
      npv,
      paybackCapex: payback,
    },
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
    row("Signing Fee", Array(7).fill(0)),
    row("Advance paid ( Rent )", Array(7).fill(0)),
    row("Incremental Working capital - Cash outflow", Array(7).fill(0)),
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
  if (n === null || n === undefined) return "—";
  if (n === 0) return " - ";
  const abs = Math.abs(n).toLocaleString("en-IN", { maximumFractionDigits: 0 });
  return n < 0 ? `(${abs})` : abs;
};

const fmtPct = (n, decimals = 1) => {
  if (n === null || n === undefined) return "—";
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

function SectionHead({ children, colSpan = 8 }) {
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

function TotalRow({ label, values, color = "amber" }) {
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
          const res = await fetch(`https://d6oojw29okpcs.cloudfront.net/ThirdEye//history/${encodeURIComponent(historyId).replace(' ','_')}`);
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
        const res = await fetch(
          `${BASE_URL}/summary_screen_5/${roiContext.roiId}`,
        );
        if (!res.ok) throw new Error("Failed to load summary data.");
        const json = await res.json();
        const retailArea = parseFloat(
          roiContext?.historyRetailArea || roiContext?.existingRetailArea
        ) || 0;
        setApiData(parseApiRows(json.data, { retailArea }));
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
  const irr         = d?.kpis?.irr;
  const payback     = d?.kpis?.paybackCapex;
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
            ["City", roiContext?.city ?? "—", false],
            ["Region", roiContext?.region ?? "—", false],
            roiContext?.projectType === "New Store"
              ? ["History ID", roiContext?.historyId ?? "—", true]
              : ["Store Code", roiContext?.existingStoreCode || "—", true],
          ].map(([label, value, mono]) => (
            <div key={label} className='min-w-0'>
              <p className='text-xs text-gray-400 font-semibold uppercase tracking-wide'>
                {label}
              </p>
              <p
                className={`font-bold text-gray-800 mt-0.5 truncate ${
                  mono ? "font-mono text-xs" : ""
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
            d.kpis.paybackCapex !== null ? `${d.kpis.paybackCapex} yr` : "—"
          }
          sub='For Capex only'
          color='blue'
        />
        <KpiCard
          label='IRR'
          value={d.kpis.irr !== null ? fmtPct(d.kpis.irr) : "—"}
          sub='Internal Rate of Return'
          color='indigo'
        />
        <KpiCard
          label='Rev / Sq.Ft'
          value={d.kpis.revPerSqft !== null ? `₹ ${d.kpis.revPerSqft}` : "—"}
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
              All figures in ₹ Lacs &nbsp;·&nbsp; Category L1
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
              </tr>
            </thead>

            <tbody>
              {/* ── INCOME ────────────────────────────────────────────── */}
              <SectionHead>Income</SectionHead>

              <tr>
                <Label>1. UCP Sales</Label>
                {d.ucpSales.map((v, i) => (
                  <Num key={i} v={v} />
                ))}
              </tr>
              <tr>
                <Label indent>Customer Discount</Label>
                {d.customerDiscount.map((v, i) => (
                  <Num key={i} v={v} />
                ))}
              </tr>
              <TotalRow label='NSV Sales' values={d.nsvSales} color='blue' />
              <TotalRow
                label='2. Gross Earnings / Commission'
                values={d.grossEarnings}
                color='green'
              />

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
              />

              {expExpanded &&
                d.expenses.map(({ label, values }) => (
                  <tr key={label}>
                    <Label indent>{label}</Label>
                    {values.map((v, i) => (
                      <Num key={i} v={v} />
                    ))}
                  </tr>
                ))}

              {/* ── PROFITABILITY ─────────────────────────────────────── */}
              <SectionHead>Profitability</SectionHead>

              <TotalRow
                label='4. EBITDA / Cash Profit / Operating Profit'
                values={d.ebitda}
                color='green'
              />
              <tr>
                <Label indent muted>
                  Depreciation
                </Label>
                {d.depreciation.map((v, i) => (
                  <Num key={i} v={v} />
                ))}
              </tr>
              <TotalRow
                label='5. PBT (Profit Before Tax)'
                values={d.pbt}
                color='green'
              />

              <tr>
                <Label bold>6. ROI %</Label>
                {d.roiPct.map((v, i) => (
                  <Num key={i} v={v} />
                ))}
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
                        {i === 0 ? fmt(d.storeInteriors) : "—"}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <Label indent>
                      Cumulative Depreciation (incl. current yr)
                    </Label>
                    {d.cumDeprn.map((v, i) => (
                      <Num key={i} v={v} />
                    ))}
                  </tr>
                  <tr>
                    <Label indent>Current Value of Interiors</Label>
                    {d.currentInteriors.map((v, i) => (
                      <Num key={i} v={v} />
                    ))}
                  </tr>
                  <tr>
                    <Label indent>Working Capital / Petty Cash @ 1% sale</Label>
                    {d.workingCapital.map((v, i) => (
                      <Num key={i} v={v} />
                    ))}
                  </tr>
                  <tr>
                    <Label indent>Security Deposit</Label>
                    {d.securityDeposit.map((v, i) => (
                      <Num key={i} v={v} />
                    ))}
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
                  </tr>
                  <tr>
                    <Label indent muted>
                      Signing Fee
                    </Label>
                    {YEARS.map((_, i) => (
                      <td
                        key={i}
                        className='border border-gray-200 px-3 py-2 text-right text-xs text-gray-400 bg-white'>
                        {" "}
                        -{" "}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <Label indent muted>
                      Advance paid (Rent)
                    </Label>
                    {YEARS.map((_, i) => (
                      <td
                        key={i}
                        className='border border-gray-200 px-3 py-2 text-right text-xs text-gray-400 bg-white'>
                        {" "}
                        -{" "}
                      </td>
                    ))}
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
                  : "—",
            },
            {
              label: "Revenue per Sq. Ft. (Average)",
              value:
                d.kpis.revPerSqft !== null
                  ? `₹ ${d.kpis.revPerSqft.toFixed(2)}`
                  : "—",
            },
            {
              label: "Revenue — CAGR",
              value:
                d.kpis.revenueCAGR !== null ? fmtPct(d.kpis.revenueCAGR) : "—",
            },
            {
              label: "Payout % (5 yr)",
              value: d.kpis.payout5yr !== null ? fmtPct(d.kpis.payout5yr) : "—",
            },
            {
              label: "IRR",
              value: d.kpis.irr !== null ? fmtPct(d.kpis.irr) : "—",
            },
            {
              label: "NPV @ 11% Cost of Capital",
              value: d.kpis.npv !== null ? `₹ ${fmt(d.kpis.npv)} L` : "—",
            },
            {
              label: "Payback Period (Capex)",
              value:
                d.kpis.paybackCapex !== null
                  ? `${d.kpis.paybackCapex} years`
                  : "—",
            },
          ].map(({ label, value }) => (
            <div key={label} className='px-6 py-4'>
              <p className='text-[10px] font-semibold text-gray-400 uppercase tracking-wide'>
                {label}
              </p>
              <p
                className={`text-lg font-extrabold mt-1 ${value === "—" ? "text-gray-300" : "text-gray-900"
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
