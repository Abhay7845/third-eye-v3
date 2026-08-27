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
  const [showModal, setShowModal] = useState(false);
  const [screen1Expenses, setScreen1Expenses] = useState(null);

  // Yr1 and escalation % are user-editable for all non-locked rows
  const [editableRows, setEditableRows] = useState({
    repairs: { yr1: 0, esc: 5 },
    insurance: { yr1: 0, esc: 5 },
    btl: { yr1: 100000, esc: 10 },
    travel: { yr1: 17500 * 12, esc: 7 },
    telephone: { yr1: 11000 * 12, esc: 7 },
    creditCard: { yr1: 0, esc: 5 },
    gst: { yr1: 0, esc: 3 },
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
  useEffect(() => {
    const roiid = storeData?.roiid;
    if (!roiid || isSaved) return;
    (async () => {
      try {
        const res = await fetch(`${BASE_URL}/expense_details/${roiid}?expense_type=SUMMARY`);
        if (!res.ok) return;
        const json = await res.json();
        const row = json?.data?.[0];
        if (!row) return;
        const rent = row.rent ?? row;
        if (rent.revenueSharing != null) setRevenueSharing(rent.revenueSharing);
        if (rent.sba?.length) setSba(rent.sba);
        if (rent.ratePerSqft?.length) setRatePerSqft(rent.ratePerSqft);
        if (rent.revSharePct?.length) setRevSharePct(rent.revSharePct);
        if (rent.minGuaranteeMth?.length) setMinGuaranteeMth(rent.minGuaranteeMth);
        if (rent.securityDeposit != null) setSecurityDepositRate(rent.securityDeposit);
        if (row.expenseSummary?.editableRowState)
          setEditableRows(row.expenseSummary.editableRowState);
        if (row.expenseSummary?.lockedRowEsc)
          setLockedRowEsc(row.expenseSummary.lockedRowEsc);
        // Restore Yr1 totals for locked rows from saved expense rows
        const savedRows = row.expenseSummary?.rows ?? [];
        const yr1 = (lbl) => savedRows.find((r) => r.label === lbl)?.values?.[0] ?? null;
        const sal = yr1("Salaries");
        const sHk = yr1("Security & Housekeeping");
        const elec = yr1("Electricity");
        if (sal != null || sHk != null || elec != null)
          setLockedRowYr1({ salaries: sal ?? 0, secHk: sHk ?? 0, electricity: elec ?? 0 });
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
    const sal = subpage4_2Data?.salaries?.totalAnnualTotal;
    const sec = subpage4_2Data?.securityHousekeeping?.totalAnnual;
    const elec = subpage4_2Data?.electricity?.total;
    if (!sal && !sec && !elec) return;
    setLockedRowYr1({ salaries: sal ?? 0, secHk: sec ?? 0, electricity: elec ?? 0 });
  }, [subpage4_2Data?.salaries?.totalAnnualTotal, subpage4_2Data?.securityHousekeeping?.totalAnnual, subpage4_2Data?.electricity?.total]);

  // Seed ratePerSqft from upstream salary data when context loads after a resume
  useEffect(() => {
    const sqft = subpage4_2Data?.salaries?.sqftPerEmp;
    if (sqft == null) return; // guard null/undefined only — 0 is a valid (if uncommon) seed
    setRatePerSqft((prev) =>
      prev.every((v) => v == null || v === undefined || Number(v) <= 0)
        ? Array(6).fill(sqft)
        : prev,
    );
  }, [subpage4_2Data?.salaries?.sqftPerEmp]);

  const fetchExpenseData = async () => {
    if (!storeData?.roiid) return;
    try {
      const res = await fetch(`${BASE_URL}/sales_planning`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ screen: 1, roiid: storeData.roiid }),
      });
      if (!res.ok) {
        toast.error("Failed to load key expense reference data.");
        return;
      }
      const json = await res.json();
      setScreen1Expenses(json.data?.[0] ?? null);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load key expense reference data.");
    }
  };

  useEffect(() => {
    fetchExpenseData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeData?.roiid]);

  // Seed editable Yr1 values from screen-1 key expenses once loaded
  useEffect(() => {
    if (!screen1Expenses || isRestoredRef.current) return;
    const s = screen1Expenses;
    const toAnn = (m) => (parseFloat(m) || 0) * 12;
    const _interiors = subpage4_1Data?.interiors ?? 0;
    const _nos = subpage4_2Data?.salaries?.totalNos ?? 0;
    setEditableRows((prev) => ({
      repairs: {
        ...prev.repairs,
        yr1: toAnn(s["repairs maintenance"]) || prev.repairs.yr1,
      },
      insurance: {
        ...prev.insurance,
        yr1: toAnn(s.insurance) || _interiors * 0.01 || prev.insurance.yr1,
      },
      btl: { ...prev.btl, yr1: toAnn(s.btl) || prev.btl.yr1 },
      travel: {
        ...prev.travel,
        yr1: toAnn(s["travel & Conveyance"]) || prev.travel.yr1,
      },
      telephone: {
        ...prev.telephone,
        yr1: toAnn(s["telephone/internet"]) || prev.telephone.yr1,
      },
      creditCard: {
        ...prev.creditCard,
        yr1: toAnn(s["credit card commission"]) || prev.creditCard.yr1,
      },
      gst: {
        ...prev.gst,
        yr1: toAnn(s["GST (primarily rental)"]) || prev.gst.yr1,
      },
      printing: {
        ...prev.printing,
        yr1: toAnn(s["Store - Printing/Pantry"]) || prev.printing.yr1,
      },
      consumables: {
        ...prev.consumables,
        yr1: toAnn(s.consumables) || prev.consumables.yr1,
      },
      staffWelfare: {
        ...prev.staffWelfare,
        yr1:
          toAnn(s["Other - Staff welfare/Uniforms"]) ||
          3500 * _nos * 12 ||
          prev.staffWelfare.yr1,
      },
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen1Expenses]);

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
  const totalCapex = subpage4_1Data?.totalCapex ?? 0;
  const interiors = subpage4_1Data?.interiors ?? 0;

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
  const totalNos = subpage4_2Data?.salaries?.totalNos ?? 0;

  // Expense summary rows — locked=true rows are read-only; others expose Yr1 + escalation% inputs
  const expenseRows = [
    { key: null, locked: true, escKey: null, escEditable: false, yr1Editable: false, label: "Rent", basis: "as under", escalation: "—", values: annualRent },
    { key: null, locked: true, escKey: "salaries", escEditable: true, yr1Editable: false, label: "Salaries", basis: "as under", escalation: "", values: salaryEscalated },
    { key: null, locked: true, escKey: "secHk", escEditable: true, yr1Editable: false, label: "Security & Housekeeping", basis: "as under", escalation: "", values: secHkEscalated },
    { key: null, locked: true, escKey: "electricity", escEditable: true, yr1Editable: false, label: "Electricity", basis: "as under", escalation: "", values: electricityEscalated },
    { key: "repairs", locked: false, escKey: null, escEditable: false, yr1Editable: false, label: "Repairs & Maintenance", basis: "1%–3% initial capex", escalation: "", values: escalate(editableRows.repairs.yr1, editableRows.repairs.esc) },
    { key: "insurance", locked: false, escKey: null, escEditable: false, yr1Editable: false, label: "Insurance", basis: "1% interiors", escalation: "", values: escalate(editableRows.insurance.yr1, editableRows.insurance.esc) },
    { key: "btl", locked: false, escKey: null, escEditable: false, yr1Editable: false, label: "BTL", basis: "0.3% sale", escalation: "", values: escalate(editableRows.btl.yr1, editableRows.btl.esc) },
    { key: "travel", locked: false, escKey: null, escEditable: true, yr1Editable: true, label: "Travel & Conveyance", basis: "17.5k p.m", escalation: "", values: escalate(editableRows.travel.yr1, editableRows.travel.esc) },
    { key: "telephone", locked: false, escKey: null, escEditable: true, yr1Editable: true, label: "Telephone/Internet", basis: "11k p.m", escalation: "", values: escalate(editableRows.telephone.yr1, editableRows.telephone.esc) },
    { key: "creditCard", locked: false, escKey: null, escEditable: false, yr1Editable: false, label: "Credit Card Commission", basis: "30% sale @ 1.2%", escalation: "", values: escalate(editableRows.creditCard.yr1, editableRows.creditCard.esc) },
    { key: "gst", locked: false, escKey: null, escEditable: false, yr1Editable: false, label: "GST (primarily rental)", basis: "0.1% sale", escalation: "", values: escalate(editableRows.gst.yr1, editableRows.gst.esc) },
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
            disabled={isSaved}
            className={`px-4 py-2 border-2 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-400 ${revenueSharing === "Yes"
              ? "border-green-400 bg-green-50 text-green-800"
              : "border-gray-300 bg-white text-gray-700"
              } ${isSaved ? "cursor-not-allowed" : ""}`}>
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
                  disabled={isSaved}
                />
              ))}
              <td className='border border-gray-200 p-1 bg-blue-50'>
                <input
                  type='number'
                  min={0}
                  value={securityDepositRate}
                  onChange={(e) => setSecurityDepositRate(e.target.value)}
                  disabled={isSaved}
                  className={`w-full px-2 py-2 bg-transparent text-center text-sm text-blue-900 focus:outline-none focus:ring-1 focus:ring-blue-400 ${isSaved ? "cursor-not-allowed" : ""
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
                    disabled={isSaved}
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
                      disabled={isSaved}
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
                        disabled={isSaved}
                        className={`w-full px-2 py-2 bg-transparent text-center text-sm text-blue-900 focus:outline-none focus:ring-1 focus:ring-inset focus:ring-blue-400 ${isSaved ? "cursor-not-allowed text-gray-500" : ""}`}
                      />
                      <span className='pr-2 text-xs text-blue-600'>%</span>
                    </div>
                  </td>
                ) : (
                  <td className='border border-gray-200 px-3 py-2 text-xs text-gray-500 text-center bg-white'>
                    {locked ? escalation : `${editableRows[key]?.esc ?? ""}%`}
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
                          disabled={isSaved}
                          className={`w-full px-2 py-2 bg-transparent text-center text-sm text-blue-900 focus:outline-none focus:ring-1 focus:ring-inset focus:ring-blue-400 ${isSaved ? "cursor-not-allowed text-gray-500" : ""}`}
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

        {!isSaved ? (
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
          <div className='flex items-center gap-3 bg-green-100 border border-green-400 text-green-800 font-semibold px-6 py-3 rounded-lg'>
            ✓ Expense Planning Complete
          </div>
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
