import { useEffect, useRef, useState } from "react";
import { useSection4Context } from "./Section4Context";
import { toast } from "react-toastify";
import { BASE_URL } from "../data/baseUrl";

const YEARS = ["Yr. 1", "Yr. 2", "Yr. 3", "Yr. 4", "Yr. 5", "Yr. 6"];

const fmt = (n) =>
  n === null || n === undefined || isNaN(n)
    ? "—"
    : Number(n).toLocaleString("en-IN", { maximumFractionDigits: 0 });

const fmtPct = (n) =>
  n === null || n === undefined || isNaN(n) ? "—" : `${Number(n).toFixed(2)}%`;

// ─── Reusable table cells ────────────────────────────────────────────────────
function LabelCell({ label, subLabel }) {
  return (
    <td className='border border-gray-200 px-3 py-2 text-sm text-gray-800 bg-white min-w-[200px]'>
      <strong>{label}</strong>
      {subLabel && (
        <div className='text-xs text-gray-400 mt-0.5'>{subLabel}</div>
      )}
    </td>
  );
}

function AutoCell({ value, prefix = "₹", highlight = false }) {
  return (
    <td
      className={`border border-gray-200 px-3 py-2 text-sm text-right ${highlight
        ? "bg-amber-50 font-bold text-amber-800"
        : "bg-gray-50 text-gray-700"
        }`}>
      {value === "—" || value === null || value === undefined
        ? "—"
        : `${prefix} ${fmt(value)}`}
    </td>
  );
}

function BlueInputCell({ value, onChange, disabled, prefix = "" }) {
  return (
    <td
      className={`border border-gray-200 p-0 ${disabled ? "bg-gray-100" : "bg-blue-50"
        }`}>
      <div className='flex items-center'>
        {prefix && (
          <span className='pl-2 text-sm text-blue-700 font-bold'>{prefix}</span>
        )}
        <input
          type='number'
          min={0}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={`w-full px-2 py-2 bg-transparent text-center text-sm text-blue-900 focus:outline-none focus:ring-1 focus:ring-inset focus:ring-blue-400 ${disabled ? "cursor-not-allowed text-gray-500" : ""
            }`}
        />
      </div>
    </td>
  );
}

function SectionHeader({ label }) {
  return (
    <thead>
      <tr className='bg-[#233044] text-white text-sm font-semibold'>
        <th className='border border-[#1a2535] px-3 py-2 text-left min-w-[200px]'>
          {label}
        </th>
        {YEARS.map((yr) => (
          <th
            key={yr}
            className='border border-[#1a2535] px-3 py-2 text-center min-w-[110px]'>
            {yr}
          </th>
        ))}
        <th className='border border-[#1a2535] px-3 py-2 text-center min-w-[120px]'>
          Security Deposit
        </th>
      </tr>
    </thead>
  );
}

function SectionHeaderNoSD({ label, extraCol }) {
  return (
    <thead>
      <tr className='bg-[#233044] text-white text-sm font-semibold'>
        <th className='border border-[#1a2535] px-3 py-2 text-left min-w-[200px]'>
          {label}
        </th>
        {extraCol && (
          <th className='border border-[#1a2535] px-3 py-2 text-left min-w-[140px]'>
            {extraCol}
          </th>
        )}
        <th className='border border-[#1a2535] px-3 py-2 text-left min-w-[160px]'>
          Annual Cost Escalation
        </th>
        {YEARS.map((yr) => (
          <th
            key={yr}
            className='border border-amber-600 px-3 py-2 text-center min-w-[110px]'>
            {yr}
          </th>
        ))}
      </tr>
    </thead>
  );
}

// ─── Escalation calculator ────────────────────────────────────────────────────
function escalate(base, pct, years = 6) {
  const result = [];
  let current = base;
  for (let i = 0; i < years; i++) {
    result.push(Math.round(current));
    current = current * (1 + pct / 100);
  }
  return result;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Subpage4_3({ handlePrevious, onNext }) {
  const { storeData, subpage4_1Data, subpage4_2Data, markStepSaved } = useSection4Context();
  // true once rent-restore runs; prevents the seed effect from overwriting restored values
  const isRestoredRef = useRef(false);
  // ── Rent inputs (6 years) ─────────────────────────────────────────────────
  const [revenueSharing, setRevenueSharing] = useState("No");
  const selected_sba = storeData?.project_type === "Store Expansion" ||
    storeData?.project_type === "New Store" ||
    storeData?.project_type === "Relocation"
    ? parseFloat(storeData?.new_over_all_area_SBA)
    : parseFloat(storeData?.existing_overall_area_SBA);



  const [sba, setSba] = useState(Array(6).fill(selected_sba));
  // initialized to empty; seeded by the sync effect below once subpage4_2Data loads
  const [ratePerSqft, setRatePerSqft] = useState(
    Array(6).fill(subpage4_2Data?.salaries?.sqftPerEmp ?? null),
  );
  const [revSharePct, setRevSharePct] = useState([2.0, 2.0, 2.0, 2.3, 2.3, 2.3]);
  const [minGuaranteeMth, setMinGuaranteeMth] = useState(
    Array(6).fill(5500000),
  );
  const [nsv, setNsv] = useState(Array(6).fill(0)); // Net Sales Values for Rev Sharing calc
  const [securityDepositRate, setSecurityDepositRate] = useState(0); // single value

  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [totalSalesAllYears, setTotalSalesAllYears] = useState(Array(6).fill(0)); // Sales Planning Yr1-6 Total Sales (Subpage3_2)
  const [btlValues, setBtlValues] = useState(Array(6).fill(100000)); // BTL = each year's own Total Sales × 0.3% × 100000
  const [creditCardValues, setCreditCardValues] = useState(Array(6).fill(0)); // each year's own Total Sales × 30% × 1.2% (×0.5% for L2/L4)
  const [gstValues, setGstValues] = useState(Array(6).fill(0)); // each year's own Total Sales × 0.1%
  // Fallback Capex/Resource/Electricity totals fetched directly from the DB —
  // subpage4_1Data/subpage4_2Data in context are only populated by Subpage4_1/
  // 4_2's own handleSave, NOT by their resume effects, so they're empty when
  // the wizard is resumed straight into this stage (e.g. via History/stepper).
  const [capexFallback, setCapexFallback] = useState(null);
  const [resourceFallback, setResourceFallback] = useState(null);
  const [otherFallback, setOtherFallback] = useState(null);

  // Rows with no annual cost escalation at all (Yr1 value repeats flat across all 6 years)
  const NO_ESCALATION_ROWS = new Set(["repairs", "insurance", "btl", "creditCard", "gst"]);

  // Yr1 and escalation % are user-editable for all non-locked rows
  const [editableRows, setEditableRows] = useState({
    repairs: { yr1: 0, esc: 0 },
    insurance: { yr1: 0, esc: 0 },
    btl: { yr1: 100000, esc: 0 },
    travel: { yr1: 17500 * 12, esc: 7 },
    telephone: { yr1: 11000 * 12, esc: 7 },
    creditCard: { yr1: 0, esc: 0 },
    gst: { yr1: 0, esc: 0 },
    printing: { yr1: 17500 * 12, esc: 10 },
    consumables: { yr1: 20000 * 12, esc: 10 },
    staffWelfare: { yr1: 0, esc: 10 },
  });
  const updateEditableRow = (rowKey, field, value) =>
    setEditableRows((prev) => ({
      ...prev,
      [rowKey]: {
        ...prev[rowKey],
        // clamp escalation % to 0-99 and always store as number to prevent leading-zero display
        [field]: field === 'esc'
          ? Math.min(Math.max(parseFloat(value) || 0, 0), 99)
          : parseFloat(value) || 0,
      },
    }));

  // user-editable escalation % for the three upstream-locked rows
  const [lockedRowEsc, setLockedRowEsc] = useState({ salaries: 5, secHk: 5, electricity: 5 });
  // Yr1 base for locked rows — restored from SUMMARY on resume, synced from subpage4_2Data in live flow
  const [lockedRowYr1, setLockedRowYr1] = useState({ salaries: 0, secHk: 0, electricity: 0 });
  const updateLockedEsc = (key, value) =>
    setLockedRowEsc((prev) => ({ ...prev, [key]: Math.min(Math.max(parseFloat(value) || 0, 0), 99) }));

  // Restore previously saved rent & editable-row inputs when resuming
  //
  // NOTE: `/expense_details?expense_type=SUMMARY` does NOT return the nested
  // `{rent, expenseSummary}` shape this page saves — it returns the raw
  // `roi_expense_summary` rows, ONE ROW PER EXPENSE LABEL (columns: Header,
  // "Annual cost escalation", Yr1..Yr6, "Security Deposit"; verified directly
  // against the table). Must be re-assembled by Header below.
  useEffect(() => {
    const roiid = storeData?.roiid;
    if (!roiid || isSaved) return;
    (async () => {
      try {
        const res = await fetch(`${BASE_URL}/expense_details/${roiid}?expense_type=SUMMARY`);
        if (!res.ok) return;
        const json = await res.json();
        const rows = json?.data ?? [];
        if (!rows.length) return;

        // Normalize so minor label-string differences from the SP (hyphen vs
        // em-dash, "Exp" vs "experience", etc.) don't break the lookup.
        const norm = (s) =>
          (s ?? "").toString().toLowerCase().replace(/[\u2014\u2013]/g, "-").replace(/\s+/g, " ").trim();
        const byHeader = {};
        rows.forEach((r) => { byHeader[norm(r.Header)] = r; });
        const find = (label) => byHeader[norm(label)];
        const yr1Of = (r) => (r ? parseFloat(r.Yr1) || 0 : 0);
        const escOf = (r, fallback) => (r ? parseFloat(r["Annual cost escalation"]) || 0 : fallback);
        const yearsOf = (r) => (r ? [1, 2, 3, 4, 5, 6].map((n) => parseFloat(r[`Yr${n}`]) || 0) : null);

        const sbaRow = find("Square Foot - Super Built Area");
        const rateRow = find("Rate per Square Foot");
        const revShareRow = find("Revenue Sharing (% of Net Sales)");
        const minGuaranteeRow = find("Min Gurantee / Monthly (?)");
        const btlRow = find("BTL");
        const creditCardRow = find("Credit Card Commission");
        const gstRow = find("GST (primarily rental)");

        if (yearsOf(sbaRow)) setSba(yearsOf(sbaRow));
        if (yearsOf(rateRow)) setRatePerSqft(yearsOf(rateRow));
        if (yearsOf(revShareRow)) setRevSharePct(yearsOf(revShareRow));
        if (yearsOf(minGuaranteeRow)) setMinGuaranteeMth(yearsOf(minGuaranteeRow));
        if (yearsOf(btlRow)) setBtlValues(yearsOf(btlRow));
        if (yearsOf(creditCardRow)) setCreditCardValues(yearsOf(creditCardRow));
        if (yearsOf(gstRow)) setGstValues(yearsOf(gstRow));
        // No explicit Yes/No flag is persisted (main.py sends NULL for the
        // revenue-share/min-guarantee params when "No") — infer it from
        // whether a real revenue-share % was actually saved.
        setRevenueSharing(yearsOf(revShareRow)?.some((v) => v > 0) ? "Yes" : "No");

        const secDepVal = Math.max(0, ...rows.map((r) => parseFloat(r["Security Deposit"]) || 0));
        setSecurityDepositRate(secDepVal);

        // Editable rows — restore Yr1 base + escalation % from their own saved row
        const EDITABLE_HEADERS = {
          repairs: "Repairs & Maintenance",
          insurance: "Insurance",
          btl: "BTL",
          travel: "Travel & Conveyance",
          telephone: "Telephone/Internet",
          creditCard: "Credit Card Commission",
          gst: "GST (primarily rental)",
          printing: "Store - Printing/Pantry etc",
          consumables: "Consumables, Safety, Cust experience",
          staffWelfare: "Other - Staff welfare/Uniforms etc",
        };
        setEditableRows((prev) => {
          const updated = { ...prev };
          Object.entries(EDITABLE_HEADERS).forEach(([key, label]) => {
            const row = find(label);
            if (!row) return;
            updated[key] = {
              yr1: yr1Of(row),
              esc: NO_ESCALATION_ROWS.has(key) ? 0 : escOf(row, updated[key]?.esc ?? 0),
            };
          });
          return updated;
        });

        // Locked rows (Salaries/Sec & HK/Electricity) — Yr1 base + escalation %
        // restored straight from their saved rows.
        const LOCKED_HEADERS = { salaries: "Salaries", secHk: "Security & Housekeeping", electricity: "Electricity" };
        const lockedYr1 = {};
        const lockedEsc = {};
        Object.entries(LOCKED_HEADERS).forEach(([key, label]) => {
          const row = find(label);
          lockedYr1[key] = yr1Of(row);
          lockedEsc[key] = escOf(row, 5);
        });
        setLockedRowYr1(lockedYr1);
        setLockedRowEsc(lockedEsc);

        isRestoredRef.current = true;
        markStepSaved(2);
        setIsSaved(true);
      } catch (e) {
        console.error("Failed to load saved rent data:", e);
      }
    })();
  }, [storeData?.roiid]);

  // Sync locked-row Yr1 values from subpage4_2Data in the live (non-resume) flow
  useEffect(() => {
    if (isRestoredRef.current) return; // don't clobber values restored from a saved SUMMARY row
    const sal = subpage4_2Data?.salaries?.totalAnnualTotal ?? resourceFallback?.totalAnnualTotal;
    const sec = subpage4_2Data?.securityHousekeeping?.totalAnnual ?? resourceFallback?.secHkTotalAnnual;
    const elec = subpage4_2Data?.electricity?.total ?? otherFallback?.electricityTotal;
    if (!sal && !sec && !elec) return;
    setLockedRowYr1({ salaries: sal ?? 0, secHk: sec ?? 0, electricity: elec ?? 0 });
  }, [
    subpage4_2Data?.salaries?.totalAnnualTotal,
    subpage4_2Data?.securityHousekeeping?.totalAnnual,
    subpage4_2Data?.electricity?.total,
    resourceFallback,
    otherFallback,
  ]);

  // Seed ratePerSqft from upstream salary data when context loads after a resume
  useEffect(() => {
    if (isRestoredRef.current) return; // don't clobber values restored from a saved SUMMARY row
    const sqft = subpage4_2Data?.salaries?.sqftPerEmp;
    if (sqft == null) return; // guard null/undefined only — 0 is a valid (if uncommon) seed
    setRatePerSqft((prev) =>
      prev.every((v) => v == null || v === undefined || Number(v) <= 0)
        ? Array(6).fill(sqft)
        : prev,
    );
  }, [subpage4_2Data?.salaries?.sqftPerEmp]);

  // Fetch Yr.1-6 Total Sales from Sales Planning (Subpage3_2) — drives the BTL
  // (per-year)/Credit Card Commission/GST (Yr1-based) Yr1 formulas below.
  useEffect(() => {
    const roiid = storeData?.roiid;
    if (!roiid) return;
    (async () => {
      try {
        const res = await fetch(`${BASE_URL}/sales_planning`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ screen: 2, roiid }),
        });
        if (!res.ok) return;
        const json = await res.json();
        const row = (json?.data ?? []).find((r) => r.Header === "Sales Planning_Total Sales");
        if (row) {
          setTotalSalesAllYears([1, 2, 3, 4, 5, 6].map((n) => parseFloat(row[`Yr${n}`]) || 0));
        }
      } catch (e) {
        console.error("Failed to load Sales Planning total sales:", e);
      }
    })();
  }, [storeData?.roiid]);

  // Seed BTL/Credit Card Commission/GST per-year (not a flat Yr1 escalation)
  // from each year's own Total Sales.
  useEffect(() => {
    if (isRestoredRef.current) return;
    if (!totalSalesAllYears.some((v) => v > 0)) return;

    const storeFormat = (storeData?.existing_store_format ?? storeData?.new_store_format ?? "")
      .trim()
      .toUpperCase();
    const isL2orL4 = storeFormat === "L2" || storeFormat === "L4";

    setBtlValues(totalSalesAllYears.map((sales) => Math.round(sales * 0.003) * 100000));
    setCreditCardValues(
      totalSalesAllYears.map((sales) => {
        const base = sales * 0.3 * 0.012 * 100000;
        return isL2orL4 ? base * 0.005 : base;
      }),
    );
    setGstValues(totalSalesAllYears.map((sales) => sales * 0.001 * 100000));
  }, [totalSalesAllYears, storeData?.existing_store_format, storeData?.new_store_format]);

  // Fallback fetch: Capex totals (Interiors, Total capex) direct from the DB
  useEffect(() => {
    const roiid = storeData?.roiid;
    if (!roiid) return;
    (async () => {
      try {
        const res = await fetch(`${BASE_URL}/expense_details/${roiid}?expense_type=CAPEX`);
        if (!res.ok) return;
        const json = await res.json();
        const row = json?.data?.[0];
        if (!row) return;
        setCapexFallback({
          interiors: parseFloat(row.Interiors) || 0,
          totalCapex: parseFloat(row["Total capex"]) || 0,
        });
      } catch (e) {
        console.error("Failed to load fallback Capex data:", e);
      }
    })();
  }, [storeData?.roiid]);

  // Fallback fetch: Resource totals (Salaries + Security & Housekeeping annual cost, staff count)
  useEffect(() => {
    const roiid = storeData?.roiid;
    if (!roiid) return;
    (async () => {
      try {
        const res = await fetch(`${BASE_URL}/expense_details/${roiid}?expense_type=RESOURCE`);
        if (!res.ok) return;
        const json = await res.json();
        const rows = json?.data ?? [];
        if (!rows.length) return;
        const SEC_HK = ["security", "housekeeping", "house keeping"];
        const isSecHk = (r) => SEC_HK.includes((r.Role ?? "").trim().toLowerCase());
        const salRows = rows.filter((r) => !isSecHk(r));
        const secRows = rows.filter(isSecHk);
        const sumCol = (arr, col) => arr.reduce((s, r) => s + (parseFloat(r[col]) || 0), 0);
        setResourceFallback({
          totalAnnualTotal: sumCol(salRows, "Annual Total"),
          totalNos: salRows.reduce((s, r) => s + (parseInt(r.No_of_Resource) || 0), 0),
          secHkTotalAnnual: sumCol(secRows, "Annual Total"),
        });
      } catch (e) {
        console.error("Failed to load fallback resource data:", e);
      }
    })();
  }, [storeData?.roiid]);

  // Fallback fetch: Electricity annual total
  useEffect(() => {
    const roiid = storeData?.roiid;
    if (!roiid) return;
    (async () => {
      try {
        const res = await fetch(`${BASE_URL}/expense_details/${roiid}?expense_type=OTHER`);
        if (!res.ok) return;
        const json = await res.json();
        const row = json?.data?.[0];
        if (!row) return;
        setOtherFallback({ electricityTotal: parseFloat(row.Electricity_Total) || 0 });
      } catch (e) {
        console.error("Failed to load fallback electricity data:", e);
      }
    })();
  }, [storeData?.roiid]);

  // Seed Yr1 for repairs/insurance/printing/consumables/staffWelfare from the
  // defined formulas (Capex, Interiors, staff count). BTL/Credit Card
  // Commission/GST have their own dedicated per-year effect above (each uses
  // its own year's Total Sales, not a flat Yr1 escalation).
  useEffect(() => {
    if (isRestoredRef.current) return;
    const totalCapexVal = subpage4_1Data?.totalCapex ?? capexFallback?.totalCapex ?? 0;
    const interiorsVal = subpage4_1Data?.interiors ?? capexFallback?.interiors ?? 0;
    const staffNos = subpage4_2Data?.salaries?.totalNos ?? resourceFallback?.totalNos ?? 0;
    if (!totalCapexVal && !interiorsVal && !staffNos) return;

    const repairsYr1 = totalCapexVal * 0.01;
    const insuranceYr1 = interiorsVal * 0.01;
    const printingYr1 = 17500 * 12;
    const consumablesYr1 = 20000 * 12;
    const staffWelfareYr1 = 3500 * staffNos * 12;

    setEditableRows((prev) => ({
      ...prev,
      repairs: { ...prev.repairs, yr1: repairsYr1 },
      insurance: { ...prev.insurance, yr1: insuranceYr1 },
      printing: { ...prev.printing, yr1: printingYr1 },
      consumables: { ...prev.consumables, yr1: consumablesYr1 },
      staffWelfare: { ...prev.staffWelfare, yr1: staffWelfareYr1 },
    }));
  }, [
    subpage4_1Data?.totalCapex,
    subpage4_1Data?.interiors,
    subpage4_2Data?.salaries?.totalNos,
    capexFallback,
    resourceFallback,
  ]);

  // Getting NSV value
  useEffect(() => {
    const fetchNSV = async () => {
      try {
        const roiid = storeData?.roiid
        const res = await fetch(
          `${BASE_URL}/summary_screen_5/${roiid}`,
        );
        if (!res.ok) throw new Error("Failed to Fetch NSV data.");
        const json = await res.json();
        const nsvRaw = json?.data.filter(it => it.Particulars === 'NSV Sales')
        const nsv = YEARS?.map((y)=>{
          let newY = y.replace(". ","")
          return nsvRaw[0][`${newY}`]
        })
        setNsv(nsv)
      } catch (e) {
        toast.error(e.message);
      }
    }
    fetchNSV()
  }, [])

  // Pull year-1 data — lockedRowYr1 is authoritative (restored from SUMMARY on resume, or synced from subpage4_2Data live)
  const salaryYr1 = lockedRowYr1.salaries;
  const secHkYr1 = lockedRowYr1.secHk;
  const electricityYr1 = lockedRowYr1.electricity;
  const totalCapex = subpage4_1Data?.totalCapex ?? capexFallback?.totalCapex ?? 0;
  const interiors = subpage4_1Data?.interiors ?? capexFallback?.interiors ?? 0;

  // ── Computed rent ─────────────────────────────────────────────────────────
  const annualRent = YEARS.map((_, i) => {
    const baseRent = sba[i] * ratePerSqft[i] * 12;
    if (revenueSharing === "No") return baseRent;
    // Revenue sharing: max of (revShare% × NSV × 100000) or (minGuarantee × 12)
    const revShare =
      (revSharePct[i] / 100) * (parseFloat(nsv[i]) || 0) * 100000;
    const minGuaranteeAnnual = parseFloat(minGuaranteeMth[i]) * 12;
    return Math.max(revShare, minGuaranteeAnnual);
  });
  const monthlyRent = annualRent.map((r) => Math.round(r / 12));

  // Locked rows: computed from upstream subpages (not user-editable Yr1)
  const salaryEscalated = escalate(salaryYr1, lockedRowEsc.salaries);
  const secHkEscalated = escalate(secHkYr1, lockedRowEsc.secHk);
  const electricityEscalated = escalate(electricityYr1, lockedRowEsc.electricity);
  const totalNos = subpage4_2Data?.salaries?.totalNos ?? resourceFallback?.totalNos ?? 0;

  // Expense summary rows — locked=true rows are read-only; others expose Yr1 + escalation% inputs
  const expenseRows = [
    { key: null, locked: true, escKey: null, escEditable: false, yr1Editable: false, label: "Rent", basis: "as under", escalation: "—", values: annualRent },
    { key: null, locked: true, escKey: "salaries", escEditable: true, yr1Editable: false, label: "Salaries", basis: "as under", escalation: "", values: salaryEscalated },
    { key: null, locked: true, escKey: "secHk", escEditable: true, yr1Editable: false, label: "Security & Housekeeping", basis: "as under", escalation: "", values: secHkEscalated },
    { key: null, locked: true, escKey: "electricity", escEditable: true, yr1Editable: false, label: "Electricity", basis: "as under", escalation: "", values: electricityEscalated },
    { key: "repairs", locked: false, escKey: null, escEditable: false, yr1Editable: false, label: "Repairs & Maintenance", basis: "1%–3% initial capex", escalation: "% capex", values: escalate(editableRows.repairs.yr1, editableRows.repairs.esc) },
    { key: "insurance", locked: false, escKey: null, escEditable: false, yr1Editable: false, label: "Insurance", basis: "1% interiors", escalation: "% interior", values: escalate(editableRows.insurance.yr1, editableRows.insurance.esc) },
    { key: "btl", locked: false, escKey: null, escEditable: false, yr1Editable: false, label: "BTL", basis: "0.3% sale (per year)", escalation: "% sale", values: btlValues },
    { key: "travel", locked: false, escKey: null, escEditable: true, yr1Editable: true, label: "Travel & Conveyance", basis: "17.5k p.m", escalation: "", values: escalate(editableRows.travel.yr1, editableRows.travel.esc) },
    { key: "telephone", locked: false, escKey: null, escEditable: true, yr1Editable: true, label: "Telephone/Internet", basis: "11k p.m", escalation: "", values: escalate(editableRows.telephone.yr1, editableRows.telephone.esc) },
    { key: "creditCard", locked: false, escKey: null, escEditable: false, yr1Editable: false, label: "Credit Card Commission", basis: "30% sale @ 1.2% (per year)", escalation: "% sale", values: creditCardValues },
    { key: "gst", locked: false, escKey: null, escEditable: false, yr1Editable: false, label: "GST (primarily rental)", basis: "0.1% sale (per year)", escalation: "% sale", values: gstValues },
    { key: "printing", locked: false, escKey: null, escEditable: true, yr1Editable: false, label: "Store — Printing/Pantry etc", basis: "17.5k p.m", escalation: "", values: escalate(editableRows.printing.yr1, editableRows.printing.esc) },
    { key: "consumables", locked: false, escKey: null, escEditable: true, yr1Editable: false, label: "Consumables, Safety, Cust Exp", basis: "20k p.m", escalation: "", values: escalate(editableRows.consumables.yr1, editableRows.consumables.esc) },
    { key: "staffWelfare", locked: false, escKey: null, escEditable: true, yr1Editable: false, label: "Other — Staff welfare/Uniforms", basis: "3.5k/person/month", escalation: "", values: escalate(editableRows.staffWelfare.yr1, editableRows.staffWelfare.esc) },
  ];

  const totalExpenses = YEARS.map((_, i) =>
    expenseRows.reduce((sum, row) => sum + (parseFloat(row.values[i]) || 0), 0),
  );

  const isFormComplete =
    revenueSharing !== "" &&
    sba.every((v) => parseFloat(v) > 0) &&
    ratePerSqft.every((v) => parseFloat(v) > 0);

  const handleInputArray = (setter, index, value) => {
    setter((prev) => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    const payload = {
      roiid: storeData?.roiid,
      // store_format is needed by the TOT engine to look up correct DB rates
      store_format: storeData?.existing_store_format ?? storeData?.new_store_format ?? "",
      rent: {
        revenueSharing,
        sba,
        ratePerSqft,
        revSharePct,
        minGuaranteeMth,
        annualRent,
        monthlyRent,
        securityDeposit: securityDepositRate,
      },
      expenseSummary: {
        editableRowState: editableRows, lockedRowEsc, rows: expenseRows.map((r) => ({
          label: r.label,
          basis: r.basis,
          escalation: r.locked
            ? r.escalation
            : `${editableRows[r.key]?.esc ?? ""}%`,
          values: r.values,
        })),
        total: totalExpenses,
      },
    };

    try {
      const res = await fetch(`${BASE_URL}/expense_planning_page3`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        toast.error(
          errData?.message ??
          "Failed to save expense summary. Please try again.",
        );
        return;
      }
      setIsSaved(true);
      setIsEditing(false);
      markStepSaved(2);
      setShowModal(true);
    } catch (err) {
      console.error(err);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className='p-6 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen space-y-8'>
      {/* Header */}
      {/* <div>
        <h2 className='text-xl font-bold text-gray-800 mb-1'>
          Stage 3 — Rent &amp; Expense Summary
        </h2>
        <p className='text-gray-500 text-sm'>
          Configure rent terms and review the 6-year expense projection
        </p>
      </div> */}

      {/* ──────────────────────────────────────────────────────────────
                REVENUE SHARING TOGGLE
            ────────────────────────────────────────────────────────────── */}
      <div className='bg-white rounded-xl shadow-lg p-6'>
        <div className='flex items-center gap-6'>
          <span className='text-sm font-bold text-gray-700 min-w-[200px]'>
            Revenue Sharing For Rentals
          </span>
          <select
            value={revenueSharing}
            onChange={(e) => setRevenueSharing(e.target.value)}
            disabled={isSaved && !isEditing}
            className={`px-4 py-2 border-2 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-400 ${revenueSharing === "Yes"
              ? "border-green-400 bg-green-50 text-green-800"
              : "border-gray-300 bg-white text-gray-700"
              } ${isSaved && !isEditing ? "cursor-not-allowed" : ""}`}>
            <option value='No'>No</option>
            <option value='Yes'>Yes</option>
          </select>
          {revenueSharing === "Yes" && (
            <span className='text-xs text-amber-700 bg-amber-100 px-3 py-1 rounded-full'>
              Max of: (RevShare% × NSV × 1,00,000) or (Min Guarantee × 12)
            </span>
          )}
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────────
                RENT TABLE
            ────────────────────────────────────────────────────────────── */}
      <div className='bg-white rounded-xl shadow-lg overflow-x-auto'>
        <div className='px-6 py-4 border-b border-gray-100'>
          <h3 className='text-lg font-bold text-gray-800'>
            Rent &amp; Security Deposit (₹)
          </h3>
        </div>
        <table className='min-w-full border-collapse text-sm'>
          <SectionHeader label='Parameter' />
          <tbody>
            {/* SBA */}
            <tr>
              <LabelCell label='Square Foot — Super Built Area' />
              {sba.map((v, i) => (
                <BlueInputCell
                  key={i}
                  value={v}
                  onChange={(e) => handleInputArray(setSba, i, e.target.value)}
                  disabled={true}
                />
              ))}
              <td className='border border-gray-200 px-3 py-2 text-right text-gray-600 bg-gray-50'>
                {fmt(0)}
              </td>
            </tr>

            {/* Rate per sqft */}
            <tr>
              <LabelCell label='Rate per Square Foot (₹)' />
              {ratePerSqft.map((v, i) => (
                <BlueInputCell
                  key={i}
                  value={v}
                  onChange={(e) => setRatePerSqft(Array(6).fill(e.target.value))}
                  disabled={isSaved && !isEditing}
                />
              ))}
              <td className='border border-gray-200 p-1 bg-blue-50'>
                <input
                  type='number'
                  min={0}
                  value={securityDepositRate}
                  onChange={(e) => setSecurityDepositRate(e.target.value)}
                  disabled={isSaved && !isEditing}
                  className={`w-full px-2 py-2 bg-transparent text-center text-sm text-blue-900 focus:outline-none focus:ring-1 focus:ring-blue-400 ${isSaved && !isEditing ? "cursor-not-allowed" : ""
                    }`}
                />
              </td>
            </tr>

            {/* Revenue sharing % — only visible when YES */}
            {revenueSharing === "Yes" && (
              <tr>
                <LabelCell
                  label='Revenue Sharing (% of Net Sales)'
                  subLabel='NSV in Lakhs'
                />
                {revSharePct.map((v, i) => (
                  <BlueInputCell
                    key={i}
                    value={v}
                    onChange={(e) => {
                      const clamped = Math.min(Math.max(parseFloat(e.target.value) || 0, 0), 99);
                      setRevSharePct(Array(6).fill(clamped));
                    }}
                    disabled={isSaved && !isEditing}
                  />
                ))}
                <td className='border border-gray-200 px-3 py-2 bg-gray-50' />
              </tr>
            )}

            {/* Min Guarantee — only visible when YES */}
            {revenueSharing === "Yes" && (
              <>
                <tr>
                  <LabelCell
                    label='Net Sales Value — NSV (₹ Lakhs)'
                    subLabel='For revenue share calc'
                  />
                  {nsv.map((v, i) => (
                    <BlueInputCell
                      key={i}
                      value={v}
                      onChange={(e) => setNsv(Array(6).fill(e.target.value))}
                      disabled={true}
                    />
                  ))}
                  <td className='border border-gray-200 px-3 py-2 bg-gray-50' />
                </tr>
                <tr>
                  <LabelCell label='Min Guarantee / Monthly (₹)' />
                  {minGuaranteeMth.map((v, i) => (
                    <BlueInputCell
                      key={i}
                      value={v}
                      onChange={(e) => setMinGuaranteeMth(Array(6).fill(e.target.value))}
                      disabled={isSaved && !isEditing}
                    />
                  ))}
                  <td className='border border-gray-200 px-3 py-2 bg-gray-50' />
                </tr>
              </>
            )}

            {/* Security Deposit — user editable single value */}
            {/* <tr>
              <LabelCell label='Security Deposit (₹)' />
              {YEARS.map((_, i) => (
                <td
                  key={i}
                  className='border border-gray-200 px-3 py-2 bg-gray-50 text-center text-gray-400'>
                  {fmt(0)}
                </td>
              ))}
              <td className='border border-gray-200 p-1 bg-blue-50'>
                <input
                  type='number'
                  min={0}
                  value={securityDepositRate}
                  onChange={(e) => setSecurityDepositRate(e.target.value)}
                  disabled={isSaved}
                  className={`w-full px-2 py-2 bg-transparent text-center text-sm text-blue-900 focus:outline-none focus:ring-1 focus:ring-blue-400 ${
                    isSaved ? "cursor-not-allowed" : ""
                  }`}
                />
              </td>
            </tr> */}

            {/* Total Monthly Rent */}
            <tr className='bg-orange-50'>
              <td className='border border-orange-200 px-3 py-2 text-sm font-semibold'>
                Total Monthly Rent
              </td>
              {monthlyRent.map((v, i) => (
                <td
                  key={i}
                  className='border border-orange-200 px-3 py-2 text-right text-orange-700 font-semibold'>
                  ₹ {fmt(v)}
                </td>
              ))}
              <td className='border border-orange-200 px-3 py-2' />
            </tr>

            {/* Total Annual Rent — computed */}
            <tr className='bg-amber-100 font-bold'>
              <td className='border border-amber-300 px-3 py-2 text-sm'>
                Total Annual Rent
              </td>
              {annualRent.map((v, i) => (
                <td
                  key={i}
                  className='border border-amber-300 px-3 py-2 text-right text-amber-800'>
                  ₹ {fmt(v)}
                </td>
              ))}
              <td className='border border-amber-300 px-3 py-2 text-xs text-gray-500 italic'>
                {revenueSharing === "No"
                  ? "(SBA × Rate) × 12"
                  : "Max of RevShare or Min Guarantee × 12"}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ──────────────────────────────────────────────────────────────
                EXPENSE SUMMARY TABLE
            ────────────────────────────────────────────────────────────── */}
      <div className='bg-white rounded-xl shadow-lg overflow-x-auto'>
        <div className='px-6 py-4 border-b border-gray-100 flex items-center justify-between'>
          <h3 className='text-lg font-bold text-gray-800'>
            Expense Summary — Value in ₹ Terms
          </h3>
          <span className='text-xs text-gray-400'>
            6-year projection with escalation
          </span>
        </div>
        <table className='min-w-full border-collapse text-sm'>
          <SectionHeaderNoSD label='Expense Item' extraCol='Basis' />
          <tbody>
            {expenseRows.map(({ key, label, basis, escalation, values, locked, escKey, escEditable, yr1Editable }) => (
              <tr key={label} className='hover:bg-gray-50'>
                <LabelCell label={label} />
                <td className='border border-gray-200 px-3 py-2 text-xs text-gray-500 italic bg-white'>
                  {basis}
                </td>
                {/* Escalation %: editable (blue) only for rows with escEditable=true */}
                {escEditable ? (
                  <td className='border border-gray-200 p-0 bg-blue-50'>
                    <div className='flex items-center'>
                      <input
                        type='number' min={0} max={99} step={0.5}
                        value={locked ? lockedRowEsc[escKey] : editableRows[key].esc}
                        onChange={(e) =>
                          locked
                            ? updateLockedEsc(escKey, e.target.value)
                            : updateEditableRow(key, "esc", e.target.value)
                        }
                        disabled={isSaved && !isEditing}
                        className={`w-full px-2 py-2 bg-transparent text-center text-sm text-blue-900 focus:outline-none focus:ring-1 focus:ring-inset focus:ring-blue-400 ${isSaved && !isEditing ? "cursor-not-allowed text-gray-500" : ""}`}
                      />
                      <span className='pr-2 text-xs text-blue-600'>%</span>
                    </div>
                  </td>
                ) : (
                  <td className='border border-gray-200 px-3 py-2 text-xs text-gray-500 text-center bg-white'>
                    {locked
                      ? escalation
                      : NO_ESCALATION_ROWS.has(key)
                        ? `${escalation}`
                        : `${editableRows[key]?.esc ?? ""}%`}
                  </td>
                )}
                {/* Yr1 editable only for travel & telephone; all other year cells auto-computed */}
                {values.map((v, i) => {
                  if (yr1Editable && i === 0) {
                    return (
                      <td key={i} className='border border-gray-200 p-0 bg-blue-50'>
                        <input
                          type='number' min={0}
                          value={editableRows[key].yr1}
                          onChange={(e) => updateEditableRow(key, "yr1", e.target.value)}
                          disabled={isSaved && !isEditing}
                          className={`w-full px-2 py-2 bg-transparent text-center text-sm text-blue-900 focus:outline-none focus:ring-1 focus:ring-inset focus:ring-blue-400 ${isSaved && !isEditing ? "cursor-not-allowed text-gray-500" : ""}`}
                        />
                      </td>
                    );
                  }
                  return (
                    <td key={i} className='border border-gray-200 px-3 py-2 text-right text-sm text-gray-700 bg-gray-50'>
                      {(parseFloat(v) || 0) === 0 ? "—" : `₹ ${fmt(v)}`}
                    </td>
                  );
                })}
              </tr>
            ))}

            {/* Total row */}
            <tr className='bg-amber-100 font-bold'>
              <td className='border border-amber-300 px-3 py-2' colSpan={3}>
                Total
              </td>
              {totalExpenses.map((v, i) => (
                <td
                  key={i}
                  className='border border-amber-300 px-3 py-2 text-right text-amber-800 text-base'>
                  ₹ {fmt(v)}
                </td>
              ))}
            </tr>
          </tbody>
        </table>

        {/* Notes */}
        <div className='px-6 py-3 bg-amber-50 border-t border-amber-200 text-xs text-amber-800 space-y-1'>
          <p>
            • Salaries: increase accounts for both headcount increase and mean
            salary increase.
          </p>
          <p>
            • Credit Card Commission &amp; GST rows depend on NSV — enter NSV
            above for revenue-sharing stores.
          </p>
        </div>
      </div>

      {/* Validation hint */}
      {!isFormComplete && (
        <div className='bg-yellow-100 border-l-4 border-yellow-500 p-4 rounded-lg text-sm text-yellow-800'>
          Please fill in all rent parameters (SBA and rate) for all 6 years
          before saving.
        </div>
      )}

      {/* Navigation */}
      <div className='flex justify-start gap-4 mt-4'>

        {!isSaved || isEditing ? (
          <button
            type='button'
            disabled={!isFormComplete || isSaving}
            onClick={handleSave}
            className={`font-semibold px-8 py-3 rounded-lg shadow-lg transition transform ${isFormComplete && !isSaving
              ? "bg-amber-600 hover:bg-amber-700 text-white hover:scale-105 cursor-pointer"
              : "bg-gray-400 text-gray-200 cursor-not-allowed"
              }`}>
            {isSaving ? "Saving…" : "Save & Complete"}
          </button>
        ) : (
          <>
            <button
              type='button'
              onClick={() => setIsEditing(true)}
              className='px-6 py-3 bg-white text-amber-700 border border-amber-300 rounded-lg font-semibold text-sm hover:bg-amber-50 transition'>
              ✎ Edit
            </button>
            <div className='flex items-center gap-3 bg-green-100 border border-green-400 text-green-800 font-semibold px-6 py-3 rounded-lg'>
              ✓ Expense Planning Complete
            </div>
          </>
        )}
      </div>

      {/* ── Summary Modal ─────────────────────────────────────────── */}
      {showModal && (
        <div className='fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4'>
          <div className='bg-white rounded-2xl shadow-2xl w-full max-w-lg'>
            <div className='bg-gradient-to-r from-green-500 to-emerald-600 px-8 py-6 rounded-t-2xl'>
              <div className='flex items-center gap-3'>
                <span className='text-3xl'>✅</span>
                <div>
                  <h2 className='text-xl font-bold text-white'>
                    Expense Planning Complete
                  </h2>
                  <p className='text-green-100 text-sm mt-0.5'>
                    Rent & Expense data saved successfully
                  </p>
                </div>
              </div>
            </div>
            <div className='p-8 space-y-3'>
              <div className='grid grid-cols-2 gap-3'>
                <div className='bg-gray-50 rounded-lg px-4 py-3'>
                  <p className='text-xs text-gray-400 uppercase tracking-wide font-medium'>
                    Revenue Sharing
                  </p>
                  <p className='text-gray-800 font-semibold mt-0.5'>
                    {revenueSharing}
                  </p>
                </div>
                <div className='bg-gray-50 rounded-lg px-4 py-3'>
                  <p className='text-xs text-gray-400 uppercase tracking-wide font-medium'>
                    Security Deposit
                  </p>
                  <p className='text-gray-800 font-semibold mt-0.5'>
                    ₹ {Number(securityDepositRate).toLocaleString("en-IN")}
                  </p>
                </div>
              </div>
            </div>
            <div className='px-8 pb-8 flex justify-end'>
              <button
                type='button'
                onClick={() => {
                  setShowModal(false);
                  onNext?.();
                }}
                className='px-8 py-3 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 transition'>
                Proceed to Review →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
