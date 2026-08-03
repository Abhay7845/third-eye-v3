import { useEffect, useState } from "react";
import { useSection3Context } from "./Section3Context";
import { toast } from "react-toastify";
import { BASE_URL } from "../data/baseUrl";

const YEARS = ["Yr. 1", "Yr. 2", "Yr. 3", "Yr. 4", "Yr. 5", "Yr. 6"];

// ─── Initial state: all user-editable (blue) input fields ────────────────────
// Each array has 6 entries — index 0 = Yr.1, index 5 = Yr.6
const initialInputs = {
  // Sales Planning Parameters
  walkInPerDay: Array(6).fill(0), // only index 0 (Yr.1) is a blue input; Yr.2–6 are computed
  increaseWalkIns: Array(6).fill(0), // index 0 (Yr.1) is N/A; indices 1–5 (Yr.2–6) are blue inputs
  conversionPct: Array(6).fill(0), // all years are blue inputs
  avgTicketSize: Array(6).fill(0), // only index 0 (Yr.1) is a blue input; Yr.2–6 are computed
  growthTicketSize: Array(6).fill(0), // index 0 (Yr.1) is N/A; indices 1–5 (Yr.2–6) are blue inputs
  storeDays: Array(6).fill(0), // all years are blue inputs

  // Sales Mix %
  plainShare: Array(6).fill(0),
  studdedShare: Array(6).fill(0),
  coinsShare: Array(6).fill(0),

  // Plain Mix %
  lcg: Array(6).fill(0),
  mcg: Array(6).fill(0),
  hcg: Array(6).fill(0),
  stoneShareHCG: Array(6).fill(0),

  // Studded Mix %
  gis: Array(6).fill(0),
  regular: Array(6).fill(0),
  colorStones: Array(6).fill(0),
  solitaireA: Array(6).fill(0),
  solitaireB: Array(6).fill(0),
  solitaireC: Array(6).fill(0),
  solitaireD: Array(6).fill(0),
};

// ─── Computed / auto-populated values ────────────────────────────────────────
const computeValues = (inputs) => {
  // Walk-in per day chain: Yr.1 from user input, Yr.2–6 = prev × (1 + increaseWalkIns%)
  const walkInPerDay = Array(6);
  walkInPerDay[0] = parseFloat(inputs.walkInPerDay[0]) || 0;
  for (let i = 1; i <= 5; i++) {
    const prev = walkInPerDay[i - 1];
    const pct = parseFloat(inputs.increaseWalkIns[i]) || 0;
    walkInPerDay[i] = Math.round(prev * (1 + pct / 100));
  }

  // Buyers per day = walkInPerDay[i] × conversionPct[i] / 100
  const buyersPerDay = walkInPerDay.map((w, i) => {
    const conv = parseFloat(inputs.conversionPct[i]) || 0;
    return Math.round((w * conv) / 100);
  });

  // Average Ticket Size chain: Yr.1 from user input, Yr.2–6 = prev × (1 + growthTicketSize%)
  const avgTicketSize = Array(6);
  avgTicketSize[0] = parseFloat(inputs.avgTicketSize[0]) || 0;
  for (let i = 1; i <= 5; i++) {
    const prev = avgTicketSize[i - 1];
    const pct = parseFloat(inputs.growthTicketSize[i]) || 0;
    avgTicketSize[i] = Math.ceil(prev * (1 + pct / 100));
  }

  const totalSales = Array(6);
  for (let i = 0; i < 6; i++) {
    totalSales[i] = Math.round(
      (buyersPerDay[i] *
        avgTicketSize[i] *
        (parseFloat(inputs.storeDays[0]) || 0)) /
        100000,
    );
  }

  const salesGrowthPct = Array(6).fill("0");
  for (let i = 1; i <= 5; i++) {
    const prev = totalSales[i - 1];
    salesGrowthPct[i] =
      prev > 0 ? Math.round(((totalSales[i] - prev) / prev) * 100) + "%" : "0";
  }

  const totalShareMix = Array(6);
  const remainingShareMix = Array(6);
  for (let i = 0; i < 6; i++) {
    const sum =
      (parseFloat(inputs.plainShare[i]) || 0) +
      (parseFloat(inputs.studdedShare[i]) || 0) +
      (parseFloat(inputs.coinsShare[i]) || 0);
    totalShareMix[i] = +sum.toFixed(2);
    remainingShareMix[i] = +(100 - sum).toFixed(2);
  }

  const totalPlainMix = Array(6);
  const remainingPlainMix = Array(6);
  for (let i = 0; i < 6; i++) {
    const sum =
      (parseFloat(inputs.lcg[i]) || 0) +
      (parseFloat(inputs.mcg[i]) || 0) +
      (parseFloat(inputs.hcg[i]) || 0);
    totalPlainMix[i] = +sum.toFixed(2);
    remainingPlainMix[i] = +(100 - sum).toFixed(2);
  }

  const totalStuddedMix = Array(6);
  const remainingStuddedMix = Array(6);
  for (let i = 0; i < 6; i++) {
    const sum =
      (parseFloat(inputs.gis[i]) || 0) +
      (parseFloat(inputs.regular[i]) || 0) +
      (parseFloat(inputs.colorStones[i]) || 0) +
      (parseFloat(inputs.solitaireA[i]) || 0) +
      (parseFloat(inputs.solitaireB[i]) || 0) +
      (parseFloat(inputs.solitaireC[i]) || 0) +
      (parseFloat(inputs.solitaireD[i]) || 0) +
      (parseFloat(inputs.stoneShareHCG[i]) || 0);
    totalStuddedMix[i] = +sum.toFixed(2);
    remainingStuddedMix[i] = +(100 - sum).toFixed(2);
  }

  return {
    walkInPerDay,
    buyersPerDay,
    avgTicketSize,
    totalSales,
    salesGrowthPct,
    totalShareMix,
    remainingShareMix,
    totalPlainMix,
    remainingPlainMix,
    totalStuddedMix,
    remainingStuddedMix,
  };
};

// ─── Reusable cell components (defined outside to avoid re-creation) ──────────

function BlueInputCell({
  value,
  onChange,
  bgColor = "bg-blue-50",
  textColor = "text-blue-900",
}) {
  return (
    <td className={`border border-gray-200 p-0 ${bgColor}`}>
      <strong>
        <input
          type='number'
          min={0}
          value={value}
          onChange={onChange}
          className={`w-full px-2 py-2 bg-transparent text-center text-sm ${textColor} focus:outline-none focus:ring-1 focus:ring-inset focus:ring-blue-400`}
        />
      </strong>
    </td>
  );
}

function getRefCellClasses(value, refValue) {
  const num = parseFloat(value);
  const ref = parseFloat(refValue);
  if (isNaN(num) || isNaN(ref) || num === 0)
    return { bgColor: "bg-blue-50", textColor: "text-blue-900" };
  if (num > ref)
    return { bgColor: "bg-green-100", textColor: "text-green-700" };
  if (ref > 0 && num >= ref * 0.95)
    return { bgColor: "bg-yellow-100", textColor: "text-yellow-700" };
  return { bgColor: "bg-red-100", textColor: "text-red-700" };
}

function AutoCell({ value = "—" }) {
  return (
    <td className='border border-gray-200 px-2 py-2 bg-gray-50 text-center text-sm text-gray-400'>
      <strong>{value}</strong>
    </td>
  );
}

function NACell() {
  return <td className='border border-gray-200 bg-gray-100' />;
}

function LabelCell({ label, bold = false }) {
  return (
    <td
      className={`border border-gray-200 px-3 py-2 text-sm text-gray-800 bg-white${
        bold ? " font-semibold" : ""
      }`}>
      <strong>{label}</strong>
    </td>
  );
}

function TotalRow({ label, values }) {
  return (
    <tr className='bg-indigo-50'>
      <LabelCell label={label} bold />
      {values.map((v, i) => (
        <AutoCell key={i} value={v} />
      ))}
    </tr>
  );
}

function RemainingRow({ values }) {
  return (
    <tr>
      <td className='border border-gray-200 px-3 py-2 text-sm text-gray-700 bg-white font-semibold'>
        Remaining %
      </td>
      {values.map((v, i) => {
        const num = parseFloat(v);
        const isOver = num < 0;
        const isDone = num === 0;
        const cellCls = isOver
          ? "bg-red-50 text-red-600"
          : isDone
          ? "bg-green-50 text-green-600"
          : "bg-amber-50 text-amber-600";
        const tip = isOver
          ? `Over by ${Math.abs(num)}% — reduce one of the shares`
          : isDone
          ? "Fully allocated"
          : `${num}% still to be allocated`;
        return (
          <td
            key={i}
            title={tip}
            className={`border border-gray-200 px-3 py-2 text-center text-sm font-semibold cursor-help ${cellCls}`}>
            {isDone ? "✓" : `${v}%`}
          </td>
        );
      })}
    </tr>
  );
}

function SectionHeader({ label }) {
  return (
    <thead>
      <tr className='bg-indigo-700 text-white text-sm font-semibold'>
        <th className='border border-indigo-600 px-3 py-2 text-left min-w-[230px]'>
          {label}
        </th>
        {YEARS.map((yr) => (
          <th
            key={yr}
            className='border border-indigo-600 px-3 py-2 text-center min-w-[95px]'>
            {yr}
          </th>
        ))}
      </tr>
    </thead>
  );
}

// Fields that auto-propagate Yr.1 value across all years
const MIX_FIELDS = new Set([
  "plainShare",
  "studdedShare",
  "coinsShare",
  "lcg",
  "mcg",
  "hcg",
  "stoneShareHCG",
  "gis",
  "regular",
  "colorStones",
  "solitaireA",
  "solitaireB",
  "solitaireC",
  "solitaireD",
]);

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Subpage3_2({ handleNext, handlePrevious }) {
  const [inputs, setInputs] = useState(initialInputs);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const { storeParticulars, markStepSaved, setSubpage3_2Data, forwardDetail } =
    useSection3Context();
  const computed = computeValues(inputs);

  const [validationMetrics, setValidationMetrics] = useState({
    plainShare: 0,
    studdedShare: 0,
    coinsShare: 0,
    lcg: 0,
    mcg: 0,
    hcg: 0,
    stoneShareHCG: 0,
    gis: 0,
    regular: 0,
    colorStones: 0,
    solitaireA: 0,
    solitaireB: 0,
    solitaireC: 0,
    solitaireD: 0,
  });

  useEffect(() => {
    const region = forwardDetail?.region;
    const fmt = forwardDetail?.storeFormat;
    if (!region || !fmt) return;
    (async () => {
      try {
        const res = await fetch(
          `${BASE_URL}/validation_metrics?region=${encodeURIComponent(
            region,
          )}&store_format=${encodeURIComponent(fmt)}`,
        );
        if (!res.ok) {
          toast.error("Failed to load validation metrics.");
          return;
        }
        const json = await res.json();
        if (!json.success || !json.data) return;
        const d = json.data;
        const get = (field) =>
          d.find((x) => x.Exclusive_Field === field)?.Region_Value ?? 0;
        const allLCG = d.filter((x) => x.Exclusive_Field === "LCG");
        const allMCG = d.filter((x) => x.Exclusive_Field === "MCG");
        const allHCG = d.filter((x) => x.Exclusive_Field === "HCG");
        setValidationMetrics({
          plainShare: get("Plain Share"),
          studdedShare: get("Studded Share"),
          coinsShare: get("Coins /Silver Share"),
          lcg: allLCG[0]?.Region_Value ?? 0,
          mcg: allMCG[0]?.Region_Value ?? 0,
          hcg: allHCG[0]?.Region_Value ?? 0,
          stoneShareHCG: get("Stone share in plain (HCG only)"),
          gis: get("GIS"),
          regular: get("Regular"),
          colorStones: get("Color Stones"),
          solitaireA: get("Solitaire A(<70C)"),
          solitaireB:
            d.find(
              (x) =>
                x.Exclusive_Field.includes("Solitaire") &&
                x.Exclusive_Field.includes("B"),
            )?.Region_Value ?? 0,
          solitaireC: get("Solitaire C(1CRT+)"),
          solitaireD: get("Solitaire D(2CRT+)"),
        });
      } catch (e) {
        console.error(e);
        toast.error("Failed to load validation metrics.");
      }
    })();
  }, [forwardDetail?.region, forwardDetail?.storeFormat]);

  // ── Form completeness: all required blue-input fields must be filled ────
  const hasOver100 = computed.remainingShareMix.some((v) => v < 0);
  const hasOver100Plain = computed.remainingPlainMix.some((v) => v < 0);
  const hasOver100Studded = computed.remainingStuddedMix.some((v) => v < 0);

  const storeFormat = forwardDetail?.storeFormat ?? "";
  const isBelowL1L2Threshold =
    (storeFormat === "L1" || storeFormat === "L2.5") &&
    computed.totalSales[0] < 10000;

  const isFormComplete =
    !hasOver100 &&
    !hasOver100Plain &&
    !hasOver100Studded &&
    !isBelowL1L2Threshold &&
    // Section 1 — Sales Planning core fields
    parseFloat(storeParticulars["Super Built Up Area"]) > 0 &&
    parseFloat(storeParticulars["Carpet area"]) > 0 &&
    parseFloat(inputs.walkInPerDay[0]) > 0 &&
    inputs.increaseWalkIns.slice(1).every((v) => parseFloat(v) >= 0) &&
    inputs.conversionPct.every((v) => parseFloat(v) >= 0) &&
    parseFloat(inputs.avgTicketSize[0]) > 0 &&
    inputs.growthTicketSize.slice(1).every((v) => parseFloat(v) > 0) &&
    parseFloat(inputs.storeDays[0]) > 0 &&
    // Section 2 — Sales Mix must sum to exactly 100% every year
    computed.remainingShareMix.every((v) => v === 0) &&
    // Section 3 — Plain Mix must sum to exactly 100% every year
    computed.remainingPlainMix.every((v) => v === 0) &&
    // Section 4 — Studded Mix must sum to exactly 100% every year
    computed.remainingStuddedMix.every((v) => v === 0);

  const incompleteReasons = [];
  if (
    !(
      parseFloat(storeParticulars["SBA"]) > 0 &&
      parseFloat(storeParticulars["Carpet area"]) > 0 &&
      parseFloat(inputs.walkInPerDay[0]) > 0 &&
      parseFloat(inputs.avgTicketSize[0]) > 0 &&
      parseFloat(inputs.storeDays[0]) > 0
    )
  )
    incompleteReasons.push("Fill all required fields in Sales Planning");
  if (
    !inputs.increaseWalkIns.slice(1).every((v) => parseFloat(v) >= 0) ||
    !inputs.conversionPct.every((v) => parseFloat(v) >= 0) ||
    !inputs.growthTicketSize.slice(1).every((v) => parseFloat(v) > 0)
  )
    incompleteReasons.push("Fill all yearly % fields in Sales Planning");
  if (hasOver100)
    incompleteReasons.push("Sales Mix % exceeds 100% in one or more years");
  else if (!computed.remainingShareMix.every((v) => v === 0))
    incompleteReasons.push("Sales Mix % must sum to 100% for each year");
  if (hasOver100Plain)
    incompleteReasons.push("Plain Mix % exceeds 100% in one or more years");
  else if (!computed.remainingPlainMix.every((v) => v === 0))
    incompleteReasons.push("Plain Sales Mix % must sum to 100% for each year");
  if (hasOver100Studded)
    incompleteReasons.push("Studded Mix % exceeds 100% in one or more years");
  else if (!computed.remainingStuddedMix.every((v) => v === 0))
    incompleteReasons.push(
      "Studded Sales Mix % must sum to 100% for each year",
    );
  if (isBelowL1L2Threshold)
    incompleteReasons.push(
      "Does Not Fit the minimum threshold of an L1 or L2.5 Store. Please rework the sales projections accordingly",
    );

  const handleSave = async () => {
    try {
      setIsSaving(true);

      // ── Full payload: every user input + every computed value ──────────
      const payload = {
        roiid: forwardDetail?.roiid || "16072614152",
        inputs: {
          totalAreaSBA: storeParticulars["Super Built Up Area"],
          totalAreaCarpet: storeParticulars["Carpet area"],
          walkInPerDayYr1: inputs.walkInPerDay[0],
          increaseWalkIns: inputs.increaseWalkIns.slice(1), // Yr.2–6
          conversionPct: inputs.conversionPct,
          avgTicketSizeYr1: inputs.avgTicketSize[0],
          growthTicketSize: inputs.growthTicketSize.slice(1), // Yr.2–6
          storeDays: inputs.storeDays[0],
          salesMix: {
            plainShare: inputs.plainShare,
            studdedShare: inputs.studdedShare,
            coinsShare: inputs.coinsShare,
          },
          plainMix: {
            lcg: inputs.lcg,
            mcg: inputs.mcg,
            hcg: inputs.hcg,
            stoneShareHCG: inputs.stoneShareHCG,
          },
          studdedMix: {
            gis: inputs.gis,
            regular: inputs.regular,
            colorStones: inputs.colorStones,
            solitaireA: inputs.solitaireA,
            solitaireB: inputs.solitaireB,
            solitaireC: inputs.solitaireC,
            solitaireD: inputs.solitaireD,
          },
        },
        // ── Computed / auto-populated values ─────────────────────────
        computed: {
          walkInPerDay: computed.walkInPerDay,
          buyersPerDay: computed.buyersPerDay,
          avgTicketSize: computed.avgTicketSize,
          totalSales: computed.totalSales,
          salesGrowthPct: computed.salesGrowthPct,
        },
      };
      // The data required for the calculation in Subpage3_3
      const data_forward = {
        roiid: forwardDetail?.roiid || 16072614152,
        total_sales_data: computed.totalSales,
        plainShare: inputs.plainShare,
        studdedShare: inputs.studdedShare,
        coinsShare: inputs.coinsShare,
        lcg: inputs.lcg,
        mcg: inputs.mcg,
        hcg: inputs.hcg,
        stoneShareHCG: inputs.stoneShareHCG,
        gis: inputs.gis,
        regular: inputs.regular,
        colorStones: inputs.colorStones,
        solitaireA: inputs.solitaireA,
        solitaireB: inputs.solitaireB,
        solitaireC: inputs.solitaireC,
        solitaireD: inputs.solitaireD,
      };

      setSubpage3_2Data(data_forward);
      const res = await fetch(`${BASE_URL}/sales_planning_page_2`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        setIsSaving(false);
        toast.error("Failed to save sales planning data. Please try again.");
        return;
      }
      setIsSaving(false);
      setIsSaved(true);
      markStepSaved(1);
      setShowModal(true);
    } catch (e) {
      console.error(e);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (field, yearIndex, value) => {
    setIsSaved(false); // any edit invalidates the saved state
    setInputs((prev) => {
      const updated = [...prev[field]];
      updated[yearIndex] = value;
      // Propagate Yr.1 value to all other years for mix fields
      if (MIX_FIELDS.has(field) && yearIndex === 0) {
        for (let i = 1; i < 6; i++) updated[i] = value;
      }
      return { ...prev, [field]: updated };
    });
  };

  // Helper: render a row where ALL 6 cells are blue inputs
  const allInputRow = (label, field) => (
    <tr key={field}>
      <LabelCell label={label} />
      {YEARS.map((_, i) => (
        <BlueInputCell
          key={i}
          value={inputs[field][i]}
          onChange={(e) => handleChange(field, i, e.target.value)}
        />
      ))}
    </tr>
  );

  // Helper: render a row with ref-based colour coding per cell
  const refInputRow = (label, field, refValue) => (
    <tr key={field}>
      <LabelCell label={label} />
      {YEARS.map((_, i) => {
        const { bgColor, textColor } = getRefCellClasses(
          inputs[field][i],
          refValue,
        );
        return (
          <BlueInputCell
            key={i}
            value={inputs[field][i]}
            onChange={(e) => handleChange(field, i, e.target.value)}
            bgColor={bgColor}
            textColor={textColor}
          />
        );
      })}
    </tr>
  );

  return (
    <div>
      <div className='subpage3_2 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 min-h-screen'>
        {/* Page Header */}
        <div className='mb-6'>
          <h2 className='text-3xl font-bold text-gray-800 mb-2'>
            Sales Planning Parameters &amp; Sales Mix %
          </h2>
          <p className='text-sm text-gray-500 flex items-center gap-3'>
            <span className='flex items-center gap-1'>
              <span className='inline-block w-5 h-5 bg-blue-50 border border-blue-300 rounded' />
              Blue cells — user input
            </span>
            <span className='flex items-center gap-1'>
              <span className='inline-block w-5 h-5 bg-gray-50 border border-gray-300 rounded' />
              Grey cells — auto-calculated
            </span>
          </p>
        </div>

        <div className='space-y-6'>
          {/* ──────────────────────────────────────────────────────────
                        SECTION 1 — Sales Planning Parameters
                    ────────────────────────────────────────────────────────── */}
          <div className='bg-white rounded-lg shadow-md overflow-x-auto'>
            <table className='min-w-full border-collapse'>
              <SectionHeader label='Sales Planning' />
              <tbody>
                {/* Total Area SBA — auto (from store particulars) */}
                <tr>
                  <LabelCell label='Total Area (SBA)' />
                  {/* <BlueInputCell
                                        value={storeParticulars['SBA']}
                                        onChange={(e) => handleChange("storeParticulars['SBA']", 0, e.target.value)}
                                    /> */}
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <AutoCell
                      key={i}
                      value={storeParticulars["Super Built Up Area"]}
                    />
                  ))}
                </tr>

                {/* Total Area Carpet — auto */}
                <tr>
                  <LabelCell label='Total Area – Carpet Sqft.' />
                  {/* <BlueInputCell
                                        value={storeParticulars['Carpet area']}
                                        onChange={(e) => handleChange("storeParticulars['Carpet area']", 0, e.target.value)}
                                    /> */}
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <AutoCell key={i} value={storeParticulars["Carpet area"]} />
                  ))}
                </tr>

                {/* Increase in Walk-ins: Yr.1 = N/A, Yr.2–6 = blue inputs */}
                <tr>
                  <LabelCell label='Increase in Walk-ins % per day' />
                  <NACell />
                  {[1, 2, 3, 4, 5].map((i) => (
                    <BlueInputCell
                      key={i}
                      value={inputs.increaseWalkIns[i]}
                      onChange={(e) =>
                        handleChange("increaseWalkIns", i, e.target.value)
                      }
                    />
                  ))}
                </tr>

                {/* Walk-in per day: Yr.1 = blue input, Yr.2–6 = auto */}
                <tr>
                  <LabelCell label='Walk-in per day' />
                  <BlueInputCell
                    value={inputs.walkInPerDay[0]}
                    onChange={(e) =>
                      handleChange("walkInPerDay", 0, e.target.value)
                    }
                  />
                  {[1, 2, 3, 4, 5].map((i) => (
                    <AutoCell key={i} value={computed.walkInPerDay[i]} />
                  ))}
                </tr>

                {/* Conv.% — all blue inputs */}
                {allInputRow("Conv. %", "conversionPct")}

                {/* Buyers per day — all auto */}
                <tr>
                  <LabelCell label='Buyers per day' />
                  {computed.buyersPerDay.map((v, i) => (
                    <AutoCell key={i} value={v} />
                  ))}
                </tr>

                {/* Growth in Ticket Size: Yr.1 = N/A, Yr.2–6 = blue inputs */}
                <tr>
                  <LabelCell label='Growth in Ticket Size %' />
                  <NACell />
                  {[1, 2, 3, 4, 5].map((i) => (
                    <BlueInputCell
                      key={i}
                      value={inputs.growthTicketSize[i]}
                      onChange={(e) =>
                        handleChange("growthTicketSize", i, e.target.value)
                      }
                    />
                  ))}
                </tr>

                {/* Average Ticket Size: Yr.1 = blue input, Yr.2–6 = auto */}
                <tr>
                  <LabelCell label='Average Ticket Size (Rs)' />
                  <BlueInputCell
                    value={inputs.avgTicketSize[0]}
                    onChange={(e) =>
                      handleChange("avgTicketSize", 0, e.target.value)
                    }
                  />
                  {[1, 2, 3, 4, 5].map((i) => (
                    <AutoCell key={i} value={computed.avgTicketSize[i]} />
                  ))}
                </tr>

                {/* No. of store days — all blue inputs */}
                <tr>
                  <LabelCell label='No. of store days in a year' />
                  <BlueInputCell
                    value={inputs.storeDays[0]}
                    onChange={(e) =>
                      handleChange("storeDays", 0, e.target.value)
                    }
                  />
                  {[1, 2, 3, 4, 5].map((i) => (
                    <AutoCell key={i} value={inputs.storeDays[0]} />
                  ))}
                </tr>

                {/* Total Sales — all auto */}
                <TotalRow label='Total Sales' values={computed.totalSales} />

                {/* L1 / L2.5 minimum threshold warning */}
                {isBelowL1L2Threshold && (
                  <tr>
                    <td
                      colSpan={7}
                      className='bg-red-50 border border-red-300 px-3 py-2 text-red-700 text-sm font-semibold text-center'>
                      ⚠️ Does Not Fit the minimum threshold of an L1 or L2.5
                      Store. Please rework the sales projections accordingly
                    </td>
                  </tr>
                )}

                {/* Sales Growth %: Yr.1 = N/A, Yr.2–6 = auto */}
                <tr>
                  <LabelCell label='Sales Growth %' />
                  <NACell />
                  {[1, 2, 3, 4, 5].map((i) => (
                    <AutoCell key={i} value={computed.salesGrowthPct[i]} />
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          <p className='text-xs text-gray-500 italic px-1'>
            Red indicates significantly less than comparable metrics for the
            Region and Green indicates significantly higher. Please fill the
            pricing metrics accurately basis the boutique / cluster / region
            current numbers.
          </p>

          {/* ──────────────────────────────────────────────────────────
                        SECTION 2 — Sales Mix %
                    ────────────────────────────────────────────────────────── */}
          <div className='bg-white rounded-lg shadow-md overflow-x-auto'>
            <table className='min-w-full border-collapse'>
              <SectionHeader label='Sales Mix %' />
              <tbody>
                {refInputRow(
                  `Plain Share - (Ref = ${validationMetrics.plainShare})`,
                  "plainShare",
                  validationMetrics.plainShare,
                )}
                {refInputRow(
                  `Studded Share - (Ref = ${validationMetrics.studdedShare})`,
                  "studdedShare",
                  validationMetrics.studdedShare,
                )}
                {refInputRow(
                  `Coins Share - (Ref = ${validationMetrics.coinsShare})`,
                  "coinsShare",
                  validationMetrics.coinsShare,
                )}
                {/* Inline warning when any year exceeds 100% */}
                {hasOver100 && (
                  <tr>
                    <td
                      colSpan={7}
                      className='bg-red-50 border border-red-300 px-3 py-2 text-red-700 text-sm font-semibold text-center'>
                      ⚠️ Total exceeds 100% in{" "}
                      {computed.remainingShareMix
                        .map((v, i) => (v < 0 ? YEARS[i] : null))
                        .filter(Boolean)
                        .join(", ")}{" "}
                      — reduce Plain, Studded or Coins share
                    </td>
                  </tr>
                )}
                <TotalRow label='Total Share' values={computed.totalShareMix} />
                <RemainingRow values={computed.remainingShareMix} />
              </tbody>
            </table>
          </div>

          <p className='text-xs text-gray-500 italic px-1'>
            Red indicates significantly less than comparable metrics for the
            Region and Green indicates significantly higher. Please fill the
            pricing metrics accurately basis the boutique / cluster / region
            current numbers.
          </p>

          {/* ──────────────────────────────────────────────────────────
                        SECTION 3 — Plain Sales Mix %
                    ────────────────────────────────────────────────────────── */}
          <div className='bg-white rounded-lg shadow-md overflow-x-auto'>
            <table className='min-w-full border-collapse'>
              <SectionHeader label='Plain Sales Mix %' />
              <tbody>
                {refInputRow(
                  `LCG - (Ref = ${validationMetrics.lcg})`,
                  "lcg",
                  validationMetrics.lcg,
                )}
                {refInputRow(
                  `MCG - (Ref = ${validationMetrics.mcg})`,
                  "mcg",
                  validationMetrics.mcg,
                )}
                {refInputRow(
                  `HCG - (Ref = ${validationMetrics.hcg})`,
                  "hcg",
                  validationMetrics.hcg,
                )}
                {/* Inline warning when any year exceeds 100% */}
                {hasOver100Plain && (
                  <tr>
                    <td
                      colSpan={7}
                      className='bg-red-50 border border-red-300 px-3 py-2 text-red-700 text-sm font-semibold text-center'>
                      ⚠️ Total exceeds 100% in{" "}
                      {computed.remainingPlainMix
                        .map((v, i) => (v < 0 ? YEARS[i] : null))
                        .filter(Boolean)
                        .join(", ")}{" "}
                      — reduce LCG, MCG or HCG share
                    </td>
                  </tr>
                )}
                <TotalRow
                  label='Total Plain Mix'
                  values={computed.totalPlainMix}
                />
                <RemainingRow values={computed.remainingPlainMix} />
              </tbody>
            </table>
          </div>

          {/* ──────────────────────────────────────────────────────────
                        SECTION 4 — Studded Sales Mix %
                    ────────────────────────────────────────────────────────── */}
          <div className='bg-white rounded-lg shadow-md overflow-x-auto'>
            <table className='min-w-full border-collapse'>
              <SectionHeader label='Studded Sales Mix %' />
              <tbody>
                {refInputRow(
                  `GIS - (Ref = ${validationMetrics.gis})`,
                  "gis",
                  validationMetrics.gis,
                )}
                {refInputRow(
                  `Regular - (Ref = ${validationMetrics.regular})`,
                  "regular",
                  validationMetrics.regular,
                )}
                {refInputRow(
                  `Color Stones - (Ref = ${validationMetrics.colorStones})`,
                  "colorStones",
                  validationMetrics.colorStones,
                )}
                {refInputRow(
                  `Solitaire A (<70C) - (Ref = ${validationMetrics.solitaireA})`,
                  "solitaireA",
                  validationMetrics.solitaireA,
                )}
                {refInputRow(
                  `Solitaire B (70\u2013100C) - (Ref = ${validationMetrics.solitaireB})`,
                  "solitaireB",
                  validationMetrics.solitaireB,
                )}
                {refInputRow(
                  `Solitaire C (1 CRT+) - (Ref = ${validationMetrics.solitaireC})`,
                  "solitaireC",
                  validationMetrics.solitaireC,
                )}
                {refInputRow(
                  `Solitaire D (2 CRT+) - (Ref = ${validationMetrics.solitaireD})`,
                  "solitaireD",
                  validationMetrics.solitaireD,
                )}
                {refInputRow(
                  `Stone Share in Plain (HCG only) - (Ref = ${validationMetrics.stoneShareHCG})`,
                  "stoneShareHCG",
                  validationMetrics.stoneShareHCG,
                )}
                {/* Inline warning when any year exceeds 100% */}
                {hasOver100Studded && (
                  <tr>
                    <td
                      colSpan={7}
                      className='bg-red-50 border border-red-300 px-3 py-2 text-red-700 text-sm font-semibold text-center'>
                      ⚠️ Total exceeds 100% in{" "}
                      {computed.remainingStuddedMix
                        .map((v, i) => (v < 0 ? YEARS[i] : null))
                        .filter(Boolean)
                        .join(", ")}{" "}
                      — reduce one of the studded shares
                    </td>
                  </tr>
                )}
                <TotalRow
                  label='Total Studded Mix'
                  values={computed.totalStuddedMix}
                />
                <RemainingRow values={computed.remainingStuddedMix} />
              </tbody>
            </table>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className='flex justify-end mt-10'>
          {/* <button
                        type="button"
                        onClick={handlePrevious}
                        className="bg-gray-500 hover:bg-gray-600 text-white font-semibold px-6 py-2 rounded-lg"
                    >
                        ← Previous
                    </button> */}
          <div className='flex gap-3 flex-col items-end'>
            {/* Incomplete reasons hint */}
            {!isFormComplete && incompleteReasons.length > 0 && (
              <ul className='text-xs text-red-500 text-right space-y-0.5'>
                {incompleteReasons.map((r, i) => (
                  <li key={i}>⚠️ {r}</li>
                ))}
              </ul>
            )}
            {!isSaved ? (
              <button
                type='button'
                onClick={handleSave}
                disabled={isSaving || !isFormComplete}
                title={!isFormComplete ? incompleteReasons.join(" | ") : ""}
                className={`font-semibold px-8 py-2 rounded-lg shadow transition ${
                  isSaving || !isFormComplete
                    ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                    : "bg-green-600 hover:bg-green-700 text-white cursor-pointer"
                }`}>
                {isSaving ? "Saving..." : "Save"}
              </button>
            ) : (
              <button
                type='button'
                onClick={handleNext}
                className='bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-2 rounded-lg shadow'>
                Next →
              </button>
            )}
          </div>
        </div>
      </div>
      {/* ── Summary Modal ─────────────────────────────────────── */}
      {showModal && (
        <div className='fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4'>
          <div className='bg-white rounded-2xl shadow-2xl w-full max-w-lg'>
            <div className='bg-gradient-to-r from-green-500 to-emerald-600 px-8 py-6 rounded-t-2xl'>
              <div className='flex items-center gap-3'>
                <span className='text-3xl'>✅</span>
                <div>
                  <h2 className='text-xl font-bold text-white'>
                    Sales Planning Saved
                  </h2>
                  <p className='text-green-100 text-sm mt-0.5'>
                    Step 2 of Sales Planning complete
                  </p>
                </div>
              </div>
            </div>
            <div className='p-8'>
              <h3 className='text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3'>
                Total Sales (in Lakhs)
              </h3>
              <div className='grid grid-cols-3 gap-2'>
                {computed.totalSales.map((v, i) => (
                  <div key={i} className='bg-gray-50 rounded-lg px-3 py-2'>
                    <p className='text-xs text-gray-400 font-medium'>
                      Yr. {i + 1}
                    </p>
                    <p className='text-gray-800 font-semibold mt-0.5'>
                      {v?.toLocaleString("en-IN") ?? "—"}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <div className='px-8 pb-8 flex justify-end'>
              <button
                type='button'
                onClick={() => {
                  setShowModal(false);
                  handleNext();
                }}
                className='px-8 py-3 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 transition'>
                Proceed to Pricing Metrics →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
