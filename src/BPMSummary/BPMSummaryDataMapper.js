// Builds the BPMSummary tables (same shape as BPMDummyData.bpm_dummy_data)
// directly from the backend's GET /bpm_sumarry/{roiId} response row — this is
// now the single source of truth for BPM Summary figures (replaces the old
// client-side derivation from roiContext/parseApiRows output).

export function mapBpmSummaryResponse(row = {}) {
  const field = (field, remarks) => ({ field, remarks: remarks ?? "-" });

  const data = [
    field("ROIID", row.roiid),
    field("Division", row.division),
    field("Brand", row.brand),
    field("Region", row.region),
    field("Sub Region", row.sub_region),
    field("State", row.state),
    field("City", row.city),
    field("Subcity", row.subcity),
    field("Store Classification", row.store_classification),
    field("Add to an Existing Store", row.add_to_existing_store),
    field("Property Selection By", row.property_selection_by),
    field("Property Lease By", row.property_lease_by),
    field("Asset By", row.asset_by),
    field("Inventory By", row.inventory_by),
    field("Operations By", row.operations_by),
  ];

  // Pulls Yr1..Yr5 for a given `{prefix}_y1`..`{prefix}_y5` column family.
  const years = (prefix) => [1, 2, 3, 4, 5].map((y) => row[`${prefix}_y${y}`] ?? null);

  const yearRow = (metric, values) => ({
    metric,
    year1: values[0] ?? null,
    year2: values[1] ?? null,
    year3: values[2] ?? null,
    year4: values[3] ?? null,
    year5: values[4] ?? null,
  });

  const snvData = [
    yearRow("Turnover NSV (Lakhs Rs.) (Total Sales)", years("turnover_nsv")),
    yearRow("Payout (Lakhs Rs.)", years("payout")),
    yearRow("PBT (Lakhs Rs.)", years("pbt")),
    yearRow("Inventory (Lakhs Rs.) (Stock)", years("inventory")),
    yearRow("Capital Investment by Company (Lakhs Rs.)", [row.company_capital_investment]),
    yearRow("Capital Investment by Franchise (Lakhs Rs.)", [row.franchise_capital_investment]),
    yearRow("Initial Security Deposit (Lakhs Rs.)", [row.initial_security_deposit]),
    yearRow("IRR Computation - 5 years (%)", [row.irr_5_years]),
    yearRow("NPV Computation - 5 years (Lakhs Rs.)", [row.npv_5_years]),
    yearRow("CTC (Cost to Company) - 5 years (%)", [row.ctc_5_years]),
    yearRow("Rent to Revenue - 5 years (%)", [row.rent_to_revenue_5_years]),
    yearRow("Additional Discount (%)", years("additional_discount")),
  ];

  return {
    columns: ["Fields to be Given in BPM Summary", "Values"],
    data,
    snv_turnover_years: {
      columns: ["Metric", "Year-1", "Year-2", "Year-3", "Year-4", "Year-5"],
      data: snvData,
    },
  };
}
