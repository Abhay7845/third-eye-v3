// Shared financial-summary calculation + formatting helpers.
// Extracted from Summary.jsx so the identical (approver-facing) figures can be
// reused by the ROI PDF report without duplicating/drifting the calc logic.

export const YEARS = ["Yr 0", "Yr 1", "Yr 2", "Yr 3", "Yr 4", "Yr 5", "Yr 6"];

export const r2 = (n) => Math.round((n ?? 0) * 100) / 100;
// sum all non-null values across Yr0–Yr6
export const sum6y = (vals) => r2((vals ?? []).filter(v => v !== null && v !== undefined).reduce((s, v) => s + (v ?? 0), 0));

// Bisection IRR — guaranteed convergence when sign changes within [-99.99%, 5000%]
export function computeIRR(cashFlows, maxIter = 400, tol = 1e-10) {
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

export function parseApiRows(rows, opts = {}) {
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
  const calculatePaybackPeriod = (initialCapex, cashFlows) => {
    const investment = Math.abs(initialCapex)
    let cummulativeCashFlow = 0
    for (let i = 0; i < cashFlows.length; i++) {
      cummulativeCashFlow += cashFlows[i];
      if (cummulativeCashFlow >= investment) return i + 1
    }
    return 6
  }

  const payback = calculatePaybackPeriod(calCapex[0], calCapexTotal.slice(1));

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

// ─── Formatters ───────────────────────────────────────────────────────────────
export const fmt = (n) => {
  if (n === null || n === undefined) return "0.0";
  if (n === 0) return " - ";
  const abs = Math.abs(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return n < 0 ? `(${abs})` : abs;
};

export const fmtPct = (n, decimals = 1) => {
  if (n === null || n === undefined) return "0.0";
  return `${Number(n).toFixed(decimals)}%`;
};
