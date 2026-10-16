// Builds the BPMSummary tables (same shape as BPMDummyData.bpm_dummy_data)
// from the live ROI flow's roiContext + parsed financial summary (`d` from
// roiFinancialSummary.parseApiRows), instead of the hardcoded dummy values.
// Fields with no real data source in the current ROI model are left blank
// ("-") rather than guessed.

const r2 = (n) => (n === null || n === undefined ? null : Math.round(n * 100) / 100);
const pct = (num, den) => (den ? r2((num / den) * 100) : null);

export function buildBpmSummaryData(roiContext = {}, d = null) {
  const field = (field, remarks) => ({ field, remarks: remarks ?? "" });

  const isNewStore = (roiContext?.projectType ?? "New Store") === "New Store";

  const data = [
    field("ROIID", roiContext?.roiId ?? ""),
    field("Division", "Jewellery"),
    field("Brand", "Tanishq"),
    field("Region", roiContext?.region ?? ""),
    field("Sub Region", ""),
    field("State", roiContext?.state ?? ""),
    field("City", roiContext?.newCity || roiContext?.city || ""),
    field("Subcity", ""),
    field(
      "Store Classification",
      roiContext?.existingStoreFormat || roiContext?.storeType || "",
    ),
    field("Add to an Existing Store", isNewStore ? "No" : "Yes"),
    field("Property Selection By", ""),
    field("Property Lease By", ""),
    field("Asset By", ""),
    field("Inventory By", ""),
    field("Operations By", ""),
  ];

  const yr = (arr, i) => (Array.isArray(arr) ? arr[i] ?? null : null);
  // Yr0..Yr6 indices → Year1..Year5 = Yr1..Yr5
  const row5 = (arr) => [1, 2, 3, 4, 5].map((i) => yr(arr, i));

  const additionalDiscountPct = [1, 2, 3, 4, 5].map((i) =>
    pct(yr(d?.customerDiscount, i), yr(d?.ucpSales, i)),
  );

  const capexYr0 = d ? Math.abs(yr(d.capex, 0) ?? 0) : null;
  const securityDepositYr0 = d ? Math.abs(yr(d.securityDeposit, 0) ?? 0) : null;

  const yearRow = (metric, values) => ({
    metric,
    year1: values[0] ?? null,
    year2: values[1] ?? null,
    year3: values[2] ?? null,
    year4: values[3] ?? null,
    year5: values[4] ?? null,
  });

  const snvData = d
    ? [
        yearRow("Turnover NSV (Lakhs Rs.) (Total Sales)", row5(d.nsvSales)),
        yearRow("Payout (Lakhs Rs.)", row5(d.grossEarnings)),
        yearRow("PBT (Lakhs Rs.)", row5(d.pbt)),
        yearRow("Inventory (Lakhs Rs.) (Stock)", row5(d.stockTotal)),
        yearRow("Capital Investment by Company (Lakhs Rs.)", [capexYr0]),
        yearRow("Capital Investment by Franchise (Lakhs Rs.)", [0]),
        yearRow("Initial Security Deposit (Lakhs Rs.)", [securityDepositYr0]),
        yearRow("IRR Computation - 5 years (%)", [d.kpis?.irr ?? null]),
        yearRow("NPV Computation - 5 years (Lakhs Rs.)", [d.kpis?.npv ?? null]),
        yearRow("CTC (Cost to Company) - 5 years (%)", [null]),
        yearRow("Rent to Revenue - 5 years (%)", [d.kpis?.rentRevenue5yr ?? null]),
        yearRow("Additional Discount (%)", additionalDiscountPct),
      ]
    : [];

  return {
    columns: ["Fields to be Given in BPM Summary", "Values"],
    data,
    snv_turnover_years: {
      columns: ["Metric", "Year-1", "Year-2", "Year-3", "Year-4", "Year-5"],
      data: snvData,
    },
  };
}
