import { useState, useEffect } from "react";
import { useSection3Context } from "./Section3Context";
import { toast } from "react-toastify";
import { BASE_URL } from "../data/baseUrl";
import { useSelector } from "react-redux";

const YEARS = ["Yr. 1", "Yr. 2", "Yr. 3", "Yr. 4", "Yr. 5", "Yr. 6"];

// ─── Initial state: all user-editable (blue) input fields ────────────────────

// Scales an array proportionally to sum to exactly 100%; replaces zeros with 0.1.
function normalizeGroup(rawVals) {
  let vals = rawVals.map((v) => {
    const n = parseFloat(v) || 0;
    return n <= 0 ? 0.1 : n;
  });
  const sum = vals.reduce((s, v) => s + v, 0);
  let scaled = vals.map((v) => parseFloat(((v / sum) * 100).toFixed(2)));
  const drift = parseFloat(
    (100 - scaled.reduce((s, v) => s + v, 0)).toFixed(2),
  );
  scaled[scaled.length - 1] = parseFloat(
    (scaled[scaled.length - 1] + drift).toFixed(2),
  );
  return scaled;
}

const initialInputs = {
  baseRate22K: Array(6).fill(0), // user must enter current 22K gold rate
  markupPct: Array(6).fill(2), // 2% default
  lcgAMC: Array(6).fill(0), // pre-filled from validation_metrics on load
  mcgAMC: Array(6).fill(0),
  hcgAMC: Array(6).fill(0),
  coinsAMC: Array(6).fill(0),
  stockTurnPlain: Array(6).fill(2),
  stockTurnStudded: Array(6).fill(1.8),
  stockTurnCoins: Array(6).fill(3),
  bgCoinsStockTurn: Array(6).fill(0),
};

// ─── Computed / auto-populated values ────────────────────────────────────────
const computeValues = (inputs, subpage3_2Data) => {
  // Total stock turn: TODO — weighted avg needs sales mix data from Subpage3_2
  const totalStockTurn = Array(6);
  // const remainingStockTurn = Array(6);
  for (let i = 0; i < 6; i++) {
    const sum =
      (parseFloat(inputs.stockTurnPlain[i]) || 0) +
      (parseFloat(inputs.stockTurnStudded[i]) || 0) +
      (parseFloat(inputs.stockTurnCoins[i]) || 0);
    totalStockTurn[i] = +sum.toFixed(2);
    // remainingStockTurn[i] = +(100 - sum).toFixed(2);
  }

  // Stock = (Total Sales × Share%) / Stock Turn — TODO needs Subpage3_2 data
  const stockPlain = Array(6).fill("-"); // TODO: (totalSales[i] × plainShare[i] / 100) / stockTurnPlain[i]
  const stockStudded = Array(6).fill("-"); // TODO: (totalSales[i] × studdedShare[i] / 100) / stockTurnStudded[i]
  const stockCoins = Array(6).fill("-"); // TODO: (totalSales[i] × coinsShare[i] / 100) / stockTurnCoins[i]
  const totalStock = Array(6).fill("-"); // TODO: stockPlain + stockStudded + stockCoins

  if (subpage3_2Data) {
    for (let i = 0; i <= 5; i++) {
      stockPlain[i] = (
        subpage3_2Data.total_sales_data[i] *
        subpage3_2Data.plainShare[i] *
        inputs.stockTurnPlain[i]
      ).toFixed(2);

      stockStudded[i] = (
        subpage3_2Data.total_sales_data[i] *
        subpage3_2Data.studdedShare[i] *
        inputs.stockTurnStudded[i]
      ).toFixed(2);

      stockCoins[i] = (
        subpage3_2Data.total_sales_data[i] *
        subpage3_2Data.coinsShare[i] *
        inputs.stockTurnCoins[i]
      ).toFixed(2);

      totalStock[i] = (
        Number(stockPlain[i]) +
        Number(stockStudded[i]) +
        Number(stockCoins[i])
      ).toFixed(0);
    }
  }

  // Brand Guidelines — Plain and Studded come from DB
  const bgPlainStockTurn = Array(6).fill("-"); // TODO: from DB [Plain, Total_Sales, Region]
  const bgStuddedStockTurn = Array(6).fill("-"); // TODO: from DB [Studded, Total_Sales, Region]
  const bgTotalStockTurn = Array(6).fill("-"); // TODO: weighted average of all three

  const bgCoinsStockTurn = Array(6);
  bgCoinsStockTurn[0] = parseFloat(inputs.bgCoinsStockTurn[0]) || 0;
  bgPlainStockTurn[0] = 2.2;
  bgStuddedStockTurn[0] = 2.4;
  bgTotalStockTurn[0] = (
    Number(bgCoinsStockTurn[0]) +
    Number(bgPlainStockTurn[0]) +
    Number(bgStuddedStockTurn[0])
  ).toFixed(2);
  for (let i = 0; i < 5; i++) {
    bgCoinsStockTurn[i + 1] = (bgCoinsStockTurn[i] * 1.1).toFixed(2);
    bgPlainStockTurn[i + 1] = (bgPlainStockTurn[i] * 1.1).toFixed(2);
    bgStuddedStockTurn[i + 1] = (bgStuddedStockTurn[i] * 1.1).toFixed(2);
    bgTotalStockTurn[i + 1] = (
      Number(bgCoinsStockTurn[i + 1]) +
      Number(bgPlainStockTurn[i + 1]) +
      Number(bgStuddedStockTurn[i + 1])
    ).toFixed(2);
  }
  return {
    totalStockTurn,
    // remainingStockTurn,
    stockPlain,
    stockStudded,
    stockCoins,
    totalStock,
    bgPlainStockTurn,
    bgStuddedStockTurn,
    bgTotalStockTurn,
    bgCoinsStockTurn,
  };
};

// ─── Reusable cell components ─────────────────────────────────────────────────

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
          className={`w-full px-2 py-2 bg-transparent text-center text-sm ${textColor} focus:outline-none focus:bg-blue-100 focus:ring-1 focus:ring-inset focus:ring-blue-400`}
        />
      </strong>
    </td>
  );
}

function AutoCell({ value = "—" }) {
  return (
    <td className='border border-gray-200 px-3 py-2 bg-gray-50 text-center text-sm text-gray-400'>
      <strong>{value}</strong>
    </td>
  );
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
      {values?.map((v, i) => (
        <AutoCell key={i} value={v} />
      ))}
    </tr>
  );
}

function SubSectionRow({ label }) {
  return (
    <tr className='bg-blue-100'>
      <td
        colSpan={7}
        className='border border-blue-200 px-3 py-1.5 text-sm font-bold text-blue-800'>
        {label}
      </td>
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

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Subpage3_3({ handleNext, handlePrevious }) {
  const [inputs, setInputs] = useState(initialInputs);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const { markStepSaved, subpage3_2Data, forwardDetail } = useSection3Context();
  const computed = computeValues(inputs, subpage3_2Data);
  // const hasOver100StockTurn = computed.remainingStockTurn.some((v) => v < 0);
  const userLog = useSelector((state) => state?.user?.user);

  const [amcMetrics, setAmcMetrics] = useState({
    lcg: 0,
    mcg: 0,
    hcg: 0,
    coins: 0,
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
        if (!res.ok) return;
        const json = await res.json();
        if (!json.success || !json.data) return;
        const d = json.data;
        const get = (field) =>
          d.find((x) => x.Exclusive_Field === field)?.Region_Value ?? 0;
        setAmcMetrics({
          lcg: get("AMC - LCG"),
          mcg: get("AMC - MCG"),
          hcg: get("AMC - HCG"),
          coins: get("AMC - Coins AMC%"),
        });
        // Normalize the 4 AMC% values to sum to exactly 100% before pre-filling
        if (!isSaved) {
          const rawAMC = [
            get("AMC - LCG"),
            get("AMC - MCG"),
            get("AMC - HCG"),
            get("AMC - Coins AMC%"),
          ];
          if (rawAMC.some((v) => v > 0)) {
            const [normLcg, normMcg, normHcg, normCoins] =
              normalizeGroup(rawAMC);
            setInputs((prev) => ({
              ...prev,
              lcgAMC:
                prev.lcgAMC[0] === 0 ? Array(6).fill(normLcg) : prev.lcgAMC,
              mcgAMC:
                prev.mcgAMC[0] === 0 ? Array(6).fill(normMcg) : prev.mcgAMC,
              hcgAMC:
                prev.hcgAMC[0] === 0 ? Array(6).fill(normHcg) : prev.hcgAMC,
              coinsAMC:
                prev.coinsAMC[0] === 0
                  ? Array(6).fill(normCoins)
                  : prev.coinsAMC,
            }));
          }
        }
      } catch (e) {
        console.error(e);
      }
    })();
  }, [forwardDetail?.region, forwardDetail?.storeFormat]);

  // Load previously saved pricing metrics when resuming
  useEffect(() => {
    const roiid = forwardDetail?.roiid;
    if (!roiid || isSaved) return;
    (async () => {
      try {
        const res = await fetch(`${BASE_URL}/sales_planning`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ screen: 3, roiid }),
        });
        if (!res.ok) return;
        const json = await res.json();
        const row = json?.data?.[0];
        if (!row) return;
        const inp = row.inputs ?? row;
        setInputs((prev) => ({
          ...prev,
          baseRate22K: inp.baseRate22K ?? prev.baseRate22K,
          markupPct: inp.markupPct ?? prev.markupPct,
          lcgAMC: inp.plainAMC?.lcg ?? prev.lcgAMC,
          mcgAMC: inp.plainAMC?.mcg ?? prev.mcgAMC,
          hcgAMC: inp.plainAMC?.hcg ?? prev.hcgAMC,
          coinsAMC: inp.coinsAMC ?? prev.coinsAMC,
          stockTurnPlain: inp.stockTurnPlain ?? prev.stockTurnPlain,
          stockTurnStudded: inp.stockTurnStudded ?? prev.stockTurnStudded,
          stockTurnCoins: inp.stockTurnCoins ?? prev.stockTurnCoins,
          bgCoinsStockTurn: inp.bgCoinsStockTurn ?? prev.bgCoinsStockTurn,
        }));
        setIsSaved(true);
      } catch (e) {
        console.error("Failed to load saved pricing metrics:", e);
      }
    })();
  }, [forwardDetail?.roiid]);

  const totalAMCPct = +(
    (parseFloat(inputs.lcgAMC[0]) || 0) +
    (parseFloat(inputs.mcgAMC[0]) || 0) +
    (parseFloat(inputs.hcgAMC[0]) || 0) +
    (parseFloat(inputs.coinsAMC[0]) || 0)
  ).toFixed(2);
  const amcEquals100 = Math.abs(totalAMCPct - 100) < 0.01;
  const amcOver100 = totalAMCPct > 100.005;
  // Same value repeated across all 6 years since Yr.1 propagates
  const amcTotalRow = Array(6).fill(totalAMCPct);
  const amcRemainingRow = Array(6).fill(+(100 - totalAMCPct).toFixed(2));
  // ── Form completeness ──────────────────────────────────────────────────
  const isFormComplete =
    amcEquals100 &&
    parseFloat(inputs.baseRate22K[0]) > 0 &&
    parseFloat(inputs.lcgAMC[0]) > 0 &&
    parseFloat(inputs.mcgAMC[0]) > 0 &&
    parseFloat(inputs.hcgAMC[0]) > 0 &&
    parseFloat(inputs.coinsAMC[0]) > 0 &&
    inputs.stockTurnPlain.every((v) => parseFloat(v) > 0) &&
    inputs.stockTurnStudded.every((v) => parseFloat(v) > 0) &&
    inputs.stockTurnCoins.every((v) => parseFloat(v) > 0);

  const incompleteReasons = [];
  if (!(parseFloat(inputs.baseRate22K[0]) > 0))
    incompleteReasons.push("Enter Base Rate – 22K");
  if (
    !(
      parseFloat(inputs.lcgAMC[0]) > 0 &&
      parseFloat(inputs.mcgAMC[0]) > 0 &&
      parseFloat(inputs.hcgAMC[0]) > 0
    )
  )
    incompleteReasons.push("Fill all Plain Group AMC% values");
  if (!(parseFloat(inputs.coinsAMC[0]) > 0))
    incompleteReasons.push("Enter Coins AMC%");
  if (!amcEquals100)
    incompleteReasons.push(
      "AMC% (LCG + MCG + HCG + Coins) must sum to exactly 100%",
    );
  if (
    !inputs.stockTurnPlain.every((v) => parseFloat(v) > 0) ||
    !inputs.stockTurnStudded.every((v) => parseFloat(v) > 0) ||
    !inputs.stockTurnCoins.every((v) => parseFloat(v) > 0)
  )
    incompleteReasons.push("Fill all Stock Turn values for all 6 years");

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const payload = {
        username: userLog?.name,
        roiid: forwardDetail?.roiid,
        inputs: {
          baseRate22K: inputs.baseRate22K,
          markupPct: inputs.markupPct,
          plainAMC: {
            lcg: inputs.lcgAMC,
            mcg: inputs.mcgAMC,
            hcg: inputs.hcgAMC,
          },
          coinsAMC: inputs.coinsAMC,
          stockTurnPlain: inputs.stockTurnPlain,
          stockTurnStudded: inputs.stockTurnStudded,
          stockTurnCoins: inputs.stockTurnCoins,
        },
        computed: {
          bgCoinsStockTurn: Array(6).fill(0), // brand guidelines zeroed until SP is live
          totalStockTurn: computed.totalStockTurn,
          stockPlain: computed.stockPlain,
          stockStudded: computed.stockStudded,
          stockCoins: computed.stockCoins,
          totalStock: computed.totalStock,
          bgPlainStockTurn: Array(6).fill(0), // brand guidelines zeroed until SP is live
          bgStuddedStockTurn: Array(6).fill(0), // brand guidelines zeroed until SP is live
          bgTotalStockTurn: Array(6).fill(0), // brand guidelines zeroed until SP is live
        },
      };

      const res = await fetch(`${BASE_URL}/sales_planning_page_3`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        setIsSaving(false);
        toast.error("Failed to save pricing metrics. Please try again.");
        return;
      }
      setIsSaving(false);
      setIsSaved(true);
      markStepSaved(2);
      setShowModal(true);
    } catch (e) {
      console.error(e);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const MIX_FIELDS = new Set([
    "stockTurnPlain",
    "stockTurnStudded",
    "stockTurnCoins",
    "baseRate22K",
    "markupPct",
    "lcgAMC",
    "mcgAMC",
    "hcgAMC",
    "coinsAMC",
  ]);

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

  //   const fetchStockTurnGuideLine = async (parameter) => {
  //     const totalSales = subpage3_2Data.total_sales_data[0];
  //     const region = forwardDetail?.region;

  //     try {
  //       const response = await fetch(`${BASE_URL}/stock_turn_guideline`, {
  //         method: "POST",
  //         headers: {
  //           "Content-Type": "application/json",
  //         },
  //         body: JSON.stringify({
  //           cluster: parameter,
  //           sales: String(totalSales),
  //           region: region,
  //         }),
  //       });

  //       const data = await response.json();
  //     } catch (err) {
  //       console.error(err);
  //     }
  //   };

  // useEffect(() => {
  //     fetchStockTurnGuideLine('Plain')
  // }, [])

  return (
    <div>
      <div className='subpage3_3 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 min-h-screen'>
        {/* Page Header */}
        <div className='mb-6'>
          <h2 className='text-3xl font-bold text-gray-800 mb-2'>
            Pricing Metrics &amp; Stock Turn
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
          {/* ──────────────────────────────────────────────────────
                        SECTION 1 — Pricing Metrics (Base Rate, Mark-up, AMC%)
                    ────────────────────────────────────────────────────── */}
          <div className='bg-white rounded-lg shadow-md overflow-x-auto'>
            <table className='min-w-full border-collapse'>
              <SectionHeader label='Pricing Metrics' />
              <tbody>
                {/* Base Rate — Yr.1 blue, Yr.2–6 auto copy */}
                <tr>
                  <LabelCell label='Base Rate – 22K (in Rs)' />
                  <BlueInputCell
                    value={inputs.baseRate22K[0]}
                    onChange={(e) =>
                      handleChange("baseRate22K", 0, e.target.value)
                    }
                  />
                  {[1, 2, 3, 4, 5].map((i) => (
                    <AutoCell key={i} value={inputs.baseRate22K[0]} />
                  ))}
                </tr>

                {/* Mark-up % — Yr.1 blue, Yr.2–6 auto copy */}
                <tr>
                  <LabelCell label='Mark-up %' />
                  <BlueInputCell
                    value={inputs.markupPct[0]}
                    onChange={(e) =>
                      handleChange("markupPct", 0, e.target.value)
                    }
                  />
                  {[1, 2, 3, 4, 5].map((i) => (
                    <AutoCell key={i} value={inputs.markupPct[0]} />
                  ))}
                </tr>

                {/* Sub-header: Plain Group AMC% */}
                <SubSectionRow label='Plain Group AMC%' />

                {/* LCG — Yr.1 blue with ref colour, Yr.2–6 auto copy */}
                <tr>
                  <LabelCell label={`LCG - (Ref = ${amcMetrics.lcg})`} />
                  <BlueInputCell
                    value={inputs.lcgAMC[0]}
                    onChange={(e) => handleChange("lcgAMC", 0, e.target.value)}
                    {...getRefCellClasses(inputs.lcgAMC[0], amcMetrics.lcg)}
                  />
                  {[1, 2, 3, 4, 5].map((i) => (
                    <AutoCell key={i} value={inputs.lcgAMC[0]} />
                  ))}
                </tr>

                {/* MCG */}
                <tr>
                  <LabelCell label={`MCG - (Ref = ${amcMetrics.mcg})`} />
                  <BlueInputCell
                    value={inputs.mcgAMC[0]}
                    onChange={(e) => handleChange("mcgAMC", 0, e.target.value)}
                    {...getRefCellClasses(inputs.mcgAMC[0], amcMetrics.mcg)}
                  />
                  {[1, 2, 3, 4, 5].map((i) => (
                    <AutoCell key={i} value={inputs.mcgAMC[0]} />
                  ))}
                </tr>

                {/* HCG */}
                <tr>
                  <LabelCell label={`HCG - (Ref = ${amcMetrics.hcg})`} />
                  <BlueInputCell
                    value={inputs.hcgAMC[0]}
                    onChange={(e) => handleChange("hcgAMC", 0, e.target.value)}
                    {...getRefCellClasses(inputs.hcgAMC[0], amcMetrics.hcg)}
                  />
                  {[1, 2, 3, 4, 5].map((i) => (
                    <AutoCell key={i} value={inputs.hcgAMC[0]} />
                  ))}
                </tr>

                {/* Sub-header: Coins AMC% */}
                <SubSectionRow label='Coins AMC%' />

                {/* Coins AMC */}
                <tr>
                  <LabelCell
                    label={`Coins AMC% - (Ref = ${amcMetrics.coins})`}
                  />
                  <BlueInputCell
                    value={inputs.coinsAMC[0]}
                    onChange={(e) =>
                      handleChange("coinsAMC", 0, e.target.value)
                    }
                    {...getRefCellClasses(inputs.coinsAMC[0], amcMetrics.coins)}
                  />
                  {[1, 2, 3, 4, 5].map((i) => (
                    <AutoCell key={i} value={inputs.coinsAMC[0]} />
                  ))}
                </tr>

                {/* AMC% over-100 warning */}
                {amcOver100 && (
                  <tr>
                    <td
                      colSpan={7}
                      className='bg-red-50 border border-red-300 px-3 py-2 text-red-700 text-sm font-semibold text-center'>
                      ⚠️ AMC% total exceeds 100% — reduce LCG, MCG, HCG or Coins
                    </td>
                  </tr>
                )}
                <TotalRow label='Total AMC%' values={amcTotalRow} />
                <RemainingRow values={amcRemainingRow} />
              </tbody>
            </table>
          </div>

          {/* Info note */}
          <div className='bg-yellow-50 border-l-4 border-yellow-400 px-4 py-3 rounded text-xs text-yellow-800'>
            For L1 / L2 / L4 inventory values are calculated on brand guidelines
            and will not change basis the below stock turns. For L3 / L2.5
            Formats please modify the same if required considering Inventory
            requirements and partner's ROI.
          </div>

          {/* ──────────────────────────────────────────────────────
                        SECTION 2 — Stock Turn
                    ────────────────────────────────────────────────────── */}
          <div className='bg-white rounded-lg shadow-md overflow-x-auto'>
            <table className='min-w-full border-collapse'>
              <SectionHeader label='Stock Turn' />
              <tbody>
                {allInputRow("Plain", "stockTurnPlain")}
                {allInputRow("Studded", "stockTurnStudded")}
                {allInputRow("Coins / Silver Share", "stockTurnCoins")}
                <TotalRow label='Total' values={computed.totalStockTurn} />
              </tbody>
            </table>
          </div>

          {/* ──────────────────────────────────────────────────────
                        SECTION 3 — Stock
                    ────────────────────────────────────────────────────── */}
          <div className='bg-white rounded-lg shadow-md overflow-x-auto'>
            <table className='min-w-full border-collapse'>
              <SectionHeader label='Stock' />
              <tbody>
                <tr>
                  <LabelCell label='Plain' />
                  {computed.stockPlain.map((v, i) => (
                    <AutoCell key={i} value={v} />
                  ))}
                </tr>
                <tr>
                  <LabelCell label='Studded' />
                  {computed.stockStudded.map((v, i) => (
                    <AutoCell key={i} value={v} />
                  ))}
                </tr>
                <tr>
                  <LabelCell label='Coins / Silver Share' />
                  {computed.stockCoins.map((v, i) => (
                    <AutoCell key={i} value={v} />
                  ))}
                </tr>
                <TotalRow label='Total' values={computed.totalStock} />
              </tbody>
            </table>
          </div>

          {/* SECTION 4 — Stock Turn: Brand Guidelines (temporarily hidden) */}
          {/* <div className='bg-white rounded-lg shadow-md overflow-x-auto'>
            <table className='min-w-full border-collapse'>
              <SectionHeader label='Stock Turn \u2013 Brand Guidelines' />
              <tbody>
                <tr><LabelCell label='Plain' />{computed.bgPlainStockTurn.map((v,i)=><AutoCell key={i} value={v}/>)}</tr>
                <tr><LabelCell label='Studded' />{computed.bgStuddedStockTurn.map((v,i)=><AutoCell key={i} value={v}/>)}</tr>
                <tr>
                  <LabelCell label='Coins / Silver Share' />
                  <BlueInputCell value={inputs.bgCoinsStockTurn[0]} onChange={(e)=>handleChange("bgCoinsStockTurn",0,e.target.value)}/>
                  {[1,2,3,4,5].map((i)=><AutoCell key={i} value={computed.bgCoinsStockTurn[i]}/>)}
                </tr>
                <TotalRow label='Total' values={computed.bgTotalStockTurn} />
              </tbody>
            </table>
          </div> */}
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
      {/* ── Summary Modal ────────────────────────────────────── */}
      {showModal && (
        <div className='fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4'>
          <div className='bg-white rounded-2xl shadow-2xl w-full max-w-lg'>
            <div className='bg-gradient-to-r from-green-500 to-emerald-600 px-8 py-6 rounded-t-2xl'>
              <div className='flex items-center gap-3'>
                <span className='text-3xl'>✅</span>
                <div>
                  <h2 className='text-xl font-bold text-white'>
                    Pricing Metrics Saved
                  </h2>
                  <p className='text-green-100 text-sm mt-0.5'>
                    Step 3 of Sales Planning complete
                  </p>
                </div>
              </div>
            </div>
            <div className='p-8'>
              <h3 className='text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3'>
                Total Stock Value
              </h3>
              <div className='grid grid-cols-3 gap-2'>
                {computed.totalStock.map((v, i) => (
                  <div key={i} className='bg-gray-50 rounded-lg px-3 py-2'>
                    <p className='text-xs text-gray-400 font-medium'>
                      Yr. {i + 1}
                    </p>
                    <p className='text-gray-800 font-semibold mt-0.5'>
                      {v ?? "—"}
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
                Proceed to Discounts →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
