import { useState, useEffect, useRef } from "react";
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
  gemstoneAMC: Array(6).fill(0),
  coinsAMC: Array(6).fill(0),
  stockTurnPlain: Array(6).fill(2),
  stockTurnStudded: Array(6).fill(1.8),
  stockTurnCoins: Array(6).fill(3),
  bgCoinsStockTurn: Array(6).fill(0),
};

// ─── Computed / auto-populated values ────────────────────────────────────────
// Section 2's "Total Stock Turn" row is a simple client-side sum of the year's
// inputs; Sections 3-5 (Stock, Stock UCP Terms, Brand Guidelines) come straight
// from the backend's TOT calculation (stockSectionData), refreshed after the
// Phase 1 save (reference stock-turn preview) and the Phase 2 save (authoritative,
// driven by the user's own Stock Turn selections).
const computeValues = (inputs, stockSectionData) => {
  const totalStockTurn = Array(6);
  for (let i = 0; i < 6; i++) {
    const sum =
      (parseFloat(inputs.stockTurnPlain[i]) || 0) +
      (parseFloat(inputs.stockTurnStudded[i]) || 0) +
      (parseFloat(inputs.stockTurnCoins[i]) || 0);
    totalStockTurn[i] = +sum.toFixed(2);
  }

  const dash6 = Array(6).fill("-");
  const zero6 = Array(6).fill(0);

  // Section 3 — Stock (display-only; not sent back to the API)
  const physicalStockPlain = stockSectionData?.stock?.plain ?? dash6;
  const physicalStockStudded = stockSectionData?.stock?.studded ?? dash6;
  const physicalStockCoins = stockSectionData?.stock?.coins ?? dash6;

  // Section 4 — Stock (UCP Terms - ₹ Lakhs); numeric fallback since these are
  // submitted to /sales_planning_page_3_phase_2 (List[float] on the backend)
  const stockPlain = stockSectionData?.stock_ucp?.plain ?? zero6;
  const stockStudded = stockSectionData?.stock_ucp?.studded ?? zero6;
  const stockCoins = stockSectionData?.stock_ucp?.coins ?? zero6;
  const totalStock = stockSectionData?.stock_ucp?.overall ?? zero6;

  // Section 5 — Stock Turn - Brand Guidelines (achieved turns on the floored stock)
  const bgPlainStockTurn = stockSectionData?.stock_turn_brand_guideline?.plain ?? zero6;
  const bgStuddedStockTurn = stockSectionData?.stock_turn_brand_guideline?.studded ?? zero6;
  const bgCoinsStockTurn = stockSectionData?.stock_turn_brand_guideline?.coins ?? zero6;
  const bgTotalStockTurn = stockSectionData?.stock_turn_brand_guideline?.overall ?? zero6;

  return {
    totalStockTurn,
    stockPlain,
    stockStudded,
    stockCoins,
    totalStock,
    physicalStockPlain,
    physicalStockStudded,
    physicalStockCoins,
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
  disabled = false,
}) {
  return (
    <td className={`border border-gray-200 p-0 ${bgColor} ${disabled ? "opacity-60" : ""}`}>
      <strong>
        <input
          type='number'
          min={0}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={`w-full px-2 py-2 bg-transparent text-center text-sm ${textColor} focus:outline-none focus:bg-blue-100 focus:ring-1 focus:ring-inset focus:ring-blue-400 disabled:cursor-not-allowed`}
        />
      </strong>
    </td>
  );
}

function Spinner({ className = "w-4 h-4" }) {
  return (
    <span
      className={`inline-block border-2 border-current border-t-transparent rounded-full animate-spin ${className}`}
      aria-hidden='true'
    />
  );
}

function SavingOverlay({ show, label = "Saving..." }) {
  if (!show) return null;
  return (
    <div className='absolute inset-0 bg-white/70 flex items-center justify-center z-10 rounded-lg'>
      <div className='flex items-center gap-2 text-indigo-700 font-semibold text-sm'>
        <Spinner className='w-5 h-5' /> {label}
      </div>
    </div>
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
      className={`border border-gray-200 px-3 py-2 text-sm text-gray-800 bg-white${bold ? " font-semibold" : ""
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
  const [isPhase1Saving, setIsPhase1Saving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isPhase1FormSaved, setisPhase1FormSaved] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [stockSectionData, setStockSectionData] = useState(null); // TOT-calculation output for Sections 3-5
  const {
    markStepSaved,
    subpage3_2Data,
    setSubpage3_2Data,
    forwardDetail,
    savedSteps,
    invalidateStepsFrom,
    salesSummaryVersion,
    phase1SavedAtVersion,
    markPhase1SavedVersion,
  } = useSection3Context();
  const computed = computeValues(inputs, stockSectionData);
  const userLog = useSelector((state) => state?.user?.user);
  // Once Phase 1 is (or was already) saved, fetch the latest Stock section data
  // (TOT-calculation output) so Sections 3-5 aren't stuck on placeholders when
  // resuming this step.
  useEffect(() => {
    const roiid = forwardDetail?.roiid;
    if (!roiid || !isPhase1FormSaved || stockSectionData) return;
    (async () => {
      try {
        const params = new URLSearchParams({ store_format: forwardDetail?.storeFormat ?? "" });
        const res = await fetch(`${BASE_URL}/tot_stock_section/${encodeURIComponent(roiid)}?${params}`);
        if (!res.ok) return;
        const json = await res.json();
        if (json?.success && json.data) setStockSectionData(json.data);
      } catch (e) {
        console.error("Failed to fetch TOT stock section:", e);
      }
    })();
  }, [forwardDetail?.roiid, isPhase1FormSaved]);

  // Fetch screen-2 sales data if context is empty (resumed directly at step 3)
  useEffect(() => {
    const roiid = forwardDetail?.roiid;
    if (!roiid) return;
    if (subpage3_2Data?.total_sales_data?.some((v) => v > 0)) return;
    (async () => {
      try {
        const res = await fetch(`${BASE_URL}/sales_planning`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ screen: 2, roiid }),
        });
        if (!res.ok) return;
        const json = await res.json();
        const rows = json?.data ?? [];
        if (!rows.length) return;
        const yrs = (header) => {
          const r = rows.find((x) => x.Header === header);
          if (!r) return Array(6).fill(0);
          return [r.Yr1, r.Yr2, r.Yr3, r.Yr4, r.Yr5, r.Yr6].map((v) => parseFloat(v) || 0);
        };
        const totalSales = yrs("Sales Planning_Total Sales");
        if (!totalSales.some((v) => v > 0)) return;
        setSubpage3_2Data({
          roiid,
          total_sales_data: totalSales,
          plainShare: yrs("Sales Planning_Plain Share"),
          studdedShare: yrs("Sales Planning_Studded Share"),
          coinsShare: yrs("Sales Planning_Coins /Silver Share"),
          lcg: yrs("Sales Planning_LCG"),
          mcg: yrs("Sales Planning_MCG"),
          hcg: yrs("Sales Planning_HCG"),
          stoneShareHCG: yrs("Sales Planning_Stoneshare(HCG only)"),
          gis: yrs("Sales Planning_GIS"),
          regular: yrs("Sales Planning_Regular"),
          colorStones: yrs("Sales Planning_Color Stones"),
          solitaireA: yrs("Sales Planning_Solitaire A(<70C)"),
          solitaireB: yrs("Sales Planning_Solitaire B(70-100C)"),
          solitaireC: yrs("Sales Planning_Solitaire C(1CRT+)"),
          solitaireD: yrs("Sales Planning_Solitaire D(2CRT+)"),
        });
      } catch (e) {
        console.error("Failed to fetch upstream sales data for stock calc:", e);
      }
    })();
  }, [forwardDetail?.roiid]);

  const [amcMetrics, setAmcMetrics] = useState({
    lcg: 0,
    mcg: 0,
    hcg: 0,
    gemstone: 0,
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
          lcg: get("Plain AMCs - LCG"),
          mcg: get("Plain AMCs - MCG"),
          hcg: get("Plain AMCs - HCG"),
          gemstone: get("Plain AMCs - SCS"),
          coins: get("Gold Coins - AMCs"),
        });
        // Pre-fill AMC fields with raw reference values — no normalisation
        if (!isSaved) {
          const rawAMC = [
            get("Plain AMCs - LCG"),
            get("Plain AMCs - MCG"),
            get("Plain AMCs - HCG"),
            get("Plain AMCs - SCS"),
            get("Gold Coins - AMCs"),
          ];
          if (rawAMC.some((v) => v > 0)) {
            setInputs((prev) => ({
              ...prev,
              lcgAMC:
                prev.lcgAMC[0] === 0 ? Array(6).fill(rawAMC[0]) : prev.lcgAMC,
              mcgAMC:
                prev.mcgAMC[0] === 0 ? Array(6).fill(rawAMC[1]) : prev.mcgAMC,
              hcgAMC:
                prev.hcgAMC[0] === 0 ? Array(6).fill(rawAMC[2]) : prev.hcgAMC,
              gemstoneAMC:
                prev.gemstoneAMC[0] === 0
                  ? Array(6).fill(rawAMC[3])
                  : prev.gemstoneAMC,
              coinsAMC:
                prev.coinsAMC[0] === 0
                  ? Array(6).fill(rawAMC[4])
                  : prev.coinsAMC,
            }));
          }
        }
      } catch (e) {
        console.error(e);
      }
    })();
  }, [forwardDetail?.region, forwardDetail?.storeFormat]);

  // Tracks whether the Stock Turn (UCP Terms) inputs already have a real value
  // (either restored from a saved Phase 2, or auto-populated from the TOT-derived
  // Brand Guideline default) so we only auto-populate once and never clobber it.
  const stockTurnInitialisedRef = useRef(false);

  // Guards the two resume-fetches below so they only ever hydrate once per
  // mount. They used to depend on isPhase1FormSaved/isSaved directly, which
  // meant clicking "Edit Pricing Metrics" (or editing Stock Turn, which flips
  // isSaved false) re-ran the fetch and immediately flipped the flag back to
  // saved/true, snapping the edit form shut right after it opened.
  const phase1HydratedRef = useRef(false);
  const phase2HydratedRef = useRef(false);

  // Resume — Phase 1 (Pricing Metrics): screen 3 only tells us whether Phase 1
  // itself was saved; it must NOT flip `isSaved`, otherwise resuming with only
  // Phase 1 done would incorrectly skip straight past Phase 2 (Stock Turn).
  useEffect(() => {
    const roiid = forwardDetail?.roiid;
    if (!roiid || phase1HydratedRef.current) return;
    phase1HydratedRef.current = true;
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
          gemstoneAMC: inp.plainAMC?.gemstone ?? prev.gemstoneAMC,
          coinsAMC: inp.coinsAMC ?? prev.coinsAMC,
        }));
        setisPhase1FormSaved(true);
        if (phase1SavedAtVersion === null) markPhase1SavedVersion();
      } catch (e) {
        console.error("Failed to load saved pricing metrics (Phase 1):", e);
      }
    })();
  }, [forwardDetail?.roiid]);

  // Resume — Phase 2 (Stock Turn): only screen 4 (the Phase 2 SP) tells us Phase 2
  // was actually saved. If it wasn't (e.g. only Phase 1 is saved), `isSaved` stays
  // false so the page resumes into the editable Phase 2 / Stock Turn view instead
  // of jumping straight to "Next".
  useEffect(() => {
    const roiid = forwardDetail?.roiid;
    if (!roiid || phase2HydratedRef.current) return;
    phase2HydratedRef.current = true;
    (async () => {
      try {
        const res = await fetch(`${BASE_URL}/sales_planning`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ screen: 4, roiid }),
        });
        if (!res.ok) return;
        const json = await res.json();
        const row = json?.data?.[0];
        if (!row) return;
        const inp = row.inputs ?? row;
        setInputs((prev) => ({
          ...prev,
          stockTurnPlain: inp.stockTurnPlain ?? prev.stockTurnPlain,
          stockTurnStudded: inp.stockTurnStudded ?? prev.stockTurnStudded,
          stockTurnCoins: inp.stockTurnCoins ?? prev.stockTurnCoins,
          bgCoinsStockTurn: inp.bgCoinsStockTurn ?? prev.bgCoinsStockTurn,
        }));
        stockTurnInitialisedRef.current = true; // real saved values — never overwrite with defaults
        setIsSaved(true);
        setisPhase1FormSaved(true); // Phase 2 can only exist if Phase 1 was saved first
        if (phase1SavedAtVersion === null) markPhase1SavedVersion();
      } catch (e) {
        console.error("Failed to load saved stock turn (Phase 2):", e);
      }
    })();
  }, [forwardDetail?.roiid]);

  // Staleness guard: if Sales Mix (Subpage3_2) was edited & re-saved *after*
  // Pricing Metrics was last saved here, the TOT calculation is now out of
  // date. Force the user back into the Pricing Metrics form (and, if Stock
  // Turn/Phase 2 was already saved too, back into that as well) instead of
  // silently leaving stale TOT/Stock figures in place.
  const staleVersionHandledRef = useRef(null);
  useEffect(() => {
    if (!isPhase1FormSaved) return;
    if (phase1SavedAtVersion === null || phase1SavedAtVersion >= salesSummaryVersion) return;
    if (staleVersionHandledRef.current === salesSummaryVersion) return;
    staleVersionHandledRef.current = salesSummaryVersion;

    setisPhase1FormSaved(false);
    const wasPhase2Saved = isSaved;
    setIsSaved(false);
    stockTurnInitialisedRef.current = false;
    invalidateStepsFrom(2);
    toast.info(
      wasPhase2Saved
        ? "Sales Mix was updated — please review and re-save Pricing Metrics (this also refreshes TOT/Stock Turn)."
        : "Sales Mix was updated — please review and re-save Pricing Metrics to refresh the TOT calculation.",
    );
  }, [salesSummaryVersion, isPhase1FormSaved, phase1SavedAtVersion]);

  // Default the editable "Stock Turn (UCP Terms)" inputs from the TOT sheet's
  // 'Turns - Brand Guidelines - UCP' calculation (same series driving the
  // read-only "Stock Turn - Brand Guidelines" table below) as soon as it's
  // available, unless a real Phase 2 value has already been restored/saved.
  useEffect(() => {
    if (isSaved || stockTurnInitialisedRef.current) return;
    const bg = stockSectionData?.stock_turn_brand_guideline;
    if (!bg?.plain || !bg?.studded || !bg?.coins) return;
    setInputs((prev) => ({
      ...prev,
      stockTurnPlain: bg.plain.map((v) => +(+v).toFixed(2)),
      stockTurnStudded: bg.studded.map((v) => +(+v).toFixed(2)),
      stockTurnCoins: bg.coins.map((v) => +(+v).toFixed(2)),
    }));
    stockTurnInitialisedRef.current = true;
  }, [stockSectionData, isSaved]);

  const totalAMCPct = +(
    (parseFloat(inputs.lcgAMC[0]) || 0) +
    (parseFloat(inputs.mcgAMC[0]) || 0) +
    (parseFloat(inputs.hcgAMC[0]) || 0) +
    (parseFloat(inputs.gemstoneAMC[0]) || 0) +
    (parseFloat(inputs.coinsAMC[0]) || 0)
  ).toFixed(2);
  const amcTotalRow = Array(6).fill(totalAMCPct);
  // ── Form completeness ──────────────────────────────────────────────────
  const isPhase1FormComplete =
    parseFloat(inputs.baseRate22K[0]) > 0 &&
    parseFloat(inputs.lcgAMC[0]) > 0 &&
    parseFloat(inputs.mcgAMC[0]) > 0 &&
    parseFloat(inputs.hcgAMC[0]) > 0 &&
    parseFloat(inputs.gemstoneAMC[0]) > 0 &&
    parseFloat(inputs.coinsAMC[0]) > 0
  const isPhase2FormComplete =
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
      parseFloat(inputs.hcgAMC[0]) > 0 &&
      parseFloat(inputs.gemstoneAMC[0]) > 0
    )
  )
    incompleteReasons.push("Fill all Plain Group AMC% values");
  if (!(parseFloat(inputs.coinsAMC[0]) > 0))
    incompleteReasons.push("Enter Coins AMC%");
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
        store_format: forwardDetail?.storeFormat,
        computed: {
          stockTurnPlain: inputs.stockTurnPlain,
          stockTurnStudded: inputs.stockTurnStudded,
          stockTurnCoins: inputs.stockTurnCoins,
          totalStockTurn: computed.totalStockTurn,
          stockPlain: computed.stockPlain,
          stockStudded: computed.stockStudded,
          stockCoins: computed.stockCoins,
          totalStock: computed.totalStock,
          bgPlainStockTurn: computed.bgPlainStockTurn,
          bgStuddedStockTurn: computed.bgStuddedStockTurn,
          bgCoinsStockTurn: computed.bgCoinsStockTurn,
          bgTotalStockTurn: computed.bgTotalStockTurn,
        },
      };

      const res = await fetch(`${BASE_URL}/sales_planning_page_3_phase_2`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || json?.success === false) {
        setIsSaving(false);
        toast.error(json?.message || "Failed to save stock summary. Please try again.");
        return;
      }
      // Phase 2 recomputes Stock / Stock (UCP Terms) / Brand Guidelines using the
      // Stock Turn values just submitted — refresh the tables with that result.
      if (json?.stock_section) setStockSectionData(json.stock_section);
      stockTurnInitialisedRef.current = true; // user's own submitted values — never overwrite with defaults
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

  const handleSavePhase1 = async () => {
    // Capture before this save flips any flags — tells us whether Stock Turn
    // (Phase 2) had already been saved against the pricing metrics we're
    // about to overwrite, so we know whether to cascade-invalidate it below.
    const wasPhase2Saved = isSaved;
    try {
      setIsPhase1Saving(true);
      const payload = {
        roiid: forwardDetail?.roiid,
        username: userLog?.name,
        store_format: forwardDetail?.storeFormat,
        inputs: {
          baseRate22K: inputs.baseRate22K,
          plainAMC: {
            lcg: inputs.lcgAMC,
            mcg: inputs.mcgAMC,
            hcg: inputs.hcgAMC,
            gemstone: inputs.gemstoneAMC,
          },
          coinsAMC: inputs.coinsAMC,
        }
      };
      const res = await fetch(`${BASE_URL}/sales_planning_page_3_phase_1`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || json?.success === false) {
        setIsPhase1Saving(false);
        toast.error(json?.message || "Failed to save pricing metrics. Please try again.");
        return;
      }
      // Pricing Metrics saved → backend triggers TOT recomputation; its Stock,
      // Stock (UCP Terms) and Brand Guidelines output (using reference Stock Turn
      // assumptions) is returned immediately as a preview for Sections 3-5.
      if (json?.stock_section) setStockSectionData(json.stock_section);
      setisPhase1FormSaved(true);
      markPhase1SavedVersion();
      if (wasPhase2Saved) {
        // TOT was just recomputed — Stock Turn (Phase 2) was saved against the
        // old TOT output, so it must be reviewed and re-saved to stay consistent.
        setIsSaved(false);
        stockTurnInitialisedRef.current = false;
        invalidateStepsFrom(2);
        toast.success("Pricing metrics re-saved — TOT recalculated. Please review and re-save Stock Turn.");
      } else {
        toast.success("Pricing metrics saved. Proceed to Stock Turn.");
      }
    } catch (e) {
      console.error(e);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsPhase1Saving(false);
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
    "gemstoneAMC",
    "coinsAMC",
  ]);

  const handleChange = (field, yearIndex, value) => {
    setIsSaved(false); // any edit invalidates the saved state
    if (field === "stockTurnPlain" || field === "stockTurnStudded" || field === "stockTurnCoins") {
      stockTurnInitialisedRef.current = true; // user is editing it manually — stop applying TOT defaults
    }
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
  const allInputRow = (label, field, disabled = false) => (
    <tr key={field}>
      <LabelCell label={label} />
      {YEARS.map((_, i) => (
        <BlueInputCell
          key={i}
          value={inputs[field][i]}
          onChange={(e) => handleChange(field, i, e.target.value)}
          disabled={disabled}
        />
      ))}
    </tr>
  );

  const fetchStockTurnGuideLine = async (parameter) => {
    const totalSales = subpage3_2Data.total_sales_data[0];
    const region = forwardDetail?.region;

    try {
      const response = await fetch(`${BASE_URL}/stock_turn_guideline`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cluster: parameter,
          sales: String(totalSales),
          region: region,
        }),
      });

      const data = await response.json();
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    // fetchStockTurnGuideLine('Plain')
  }, [])

  // Formatter for Indian currency
  const fmt = (n) =>
    n === null || n === undefined || n === ""
      ? "—"
      : Number(n).toLocaleString("en-IN", { maximumFractionDigits: 0 });

  // Formatter for stock-turn / physical-stock ratios — fixed decimal places so
  // every cell in a table lines up instead of mixing 1.7 with 2.0574.
  const fmtDec = (n, decimals = 2) =>
    n === null || n === undefined || n === "" || isNaN(Number(n))
      ? "—"
      : Number(n).toFixed(decimals);

  return (
    <div>
      <div className='subpage3_3 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 min-h-screen'>
        {/* Page Header */}
        <div className='mb-6'>
          <h2 className='text-xl font-bold text-gray-800 mb-2'>
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

        {/* Incomplete/warning summary — shown up-front so issues are visible as soon as the page loads */}
        {(!isPhase1FormComplete || !isPhase2FormComplete) && incompleteReasons.length > 0 && (
          <div className='mb-6 bg-red-50 border border-red-300 rounded-xl px-5 py-3'>
            <p className='text-xs font-bold text-red-700 uppercase tracking-wide mb-1'>⚠ Action Required</p>
            <ul className='text-xs text-red-600 space-y-0.5'>
              {incompleteReasons.map((r, i) => (
                <li key={i}>⚠️ {r}</li>
              ))}
            </ul>
          </div>
        )}

        <div className='space-y-6'>
          {/* ──────────────────────────────────────────────────────
                        SECTION 1 — Pricing Metrics (Base Rate, Mark-up, AMC%)
                    ────────────────────────────────────────────────────── */}
          {!isPhase1FormSaved && (
            <div className='bg-white rounded-lg shadow-md overflow-x-auto relative'>
              <SavingOverlay show={isPhase1Saving} />
              <table className='min-w-full border-collapse'>
                <SectionHeader label='Pricing Metrics' />
                <tbody>
                  {/* Base Rate — Yr.1 blue, Yr.2–6 auto copy */}
                  <tr>
                    <LabelCell label='Retail Gold Rate – 22K (in Rs)' />
                    <BlueInputCell
                      value={inputs.baseRate22K[0]}
                      onChange={(e) =>
                        handleChange("baseRate22K", 0, e.target.value)
                      }
                      disabled={isPhase1Saving}
                    />
                    {[1, 2, 3, 4, 5].map((i) => (
                      <AutoCell key={i} value={inputs.baseRate22K[0]} />
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
                      disabled={isPhase1Saving}
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
                      disabled={isPhase1Saving}
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
                      disabled={isPhase1Saving}
                      {...getRefCellClasses(inputs.hcgAMC[0], amcMetrics.hcg)}
                    />
                    {[1, 2, 3, 4, 5].map((i) => (
                      <AutoCell key={i} value={inputs.hcgAMC[0]} />
                    ))}
                  </tr>
                  {/* Gemstones */}
                  <tr>
                    <LabelCell label={`Gemstones - (Ref = ${amcMetrics.gemstone})`} />
                    <BlueInputCell
                      value={inputs.gemstoneAMC[0]}
                      onChange={(e) => handleChange("gemstoneAMC", 0, e.target.value)}
                      disabled={isPhase1Saving}
                      {...getRefCellClasses(inputs.gemstoneAMC[0], amcMetrics.gemstone)}
                    />
                    {[1, 2, 3, 4, 5].map((i) => (
                      <AutoCell key={i} value={inputs.gemstoneAMC[0]} />
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
                      disabled={isPhase1Saving}
                      {...getRefCellClasses(inputs.coinsAMC[0], amcMetrics.coins)}
                    />
                    {[1, 2, 3, 4, 5].map((i) => (
                      <AutoCell key={i} value={inputs.coinsAMC[0]} />
                    ))}
                  </tr>

                  {/* AMC Total row */}
                  <TotalRow label='Total AMC%' values={amcTotalRow} />
                </tbody>
              </table>
              <div className='flex justify-center mt-3 mb-3'>
                <div className='flex gap-3 flex-row items-center'>
                  {!isPhase1FormComplete && incompleteReasons.length > 0 && (
                    <ul className='text-xs text-red-500 text-right space-y-0.5'>
                      {incompleteReasons.map((r, i) => (
                        <li key={i}>⚠️ {r}</li>
                      ))}
                    </ul>
                  )}
                  <button
                    type='button'
                    onClick={handleSavePhase1}
                    disabled={isPhase1Saving || !isPhase1FormComplete}
                    title={!isPhase1FormComplete ? incompleteReasons.join(" | ") : ""}
                    className={`font-semibold px-8 py-2 rounded-lg shadow transition ${isPhase1Saving || !isPhase1FormComplete
                      ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                      : "bg-green-600 hover:bg-green-700 text-white cursor-pointer"
                      }`}>
                    {isPhase1Saving ? (
                      <span className='flex items-center gap-2'>
                        <Spinner /> Saving...
                      </span>
                    ) : (
                      "Save"
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {isPhase1FormSaved && (
            <div className='space-y-6'>
              {/* Pricing Metrics is now hidden behind Phase 1's saved summary —
                  allow the user to reopen it (re-saving retriggers TOT and, if
                  Stock Turn was already saved, forces it to be redone too). */}
              <div className='flex justify-end'>
                <button
                  type='button'
                  onClick={() => setisPhase1FormSaved(false)}
                  className='text-sm font-semibold text-indigo-700 hover:text-indigo-900 underline underline-offset-2'>
                  ✎ Edit Pricing Metrics
                </button>
              </div>

              {/* ──────────────────────────────────────────────────────
                        SECTION 2 — Stock Turn
                    ────────────────────────────────────────────────────── */}
              <div className='bg-white rounded-lg shadow-md overflow-x-auto relative'>
                <SavingOverlay show={isSaving} />
                <table className='min-w-full border-collapse'>
                  <SectionHeader label='Stock Turn (UCP Terms)' />
                  <tbody>
                    {allInputRow("Plain", "stockTurnPlain", isSaving)}
                    {allInputRow("Studded", "stockTurnStudded", isSaving)}
                    {allInputRow("Coins / Silver Share", "stockTurnCoins", isSaving)}
                    <TotalRow label='Total' values={computed.totalStockTurn.map((v) => fmtDec(v))} />
                  </tbody>
                </table>
              </div>

              {/* ──────────────────────────────────────────────────────
                        SECTION 3 — Stock (populated from TOT calculation)
                    ────────────────────────────────────────────────────── */}
              <div className='bg-white rounded-lg shadow-md overflow-x-auto'>
                <table className='min-w-full border-collapse'>
                  <SectionHeader label='Stock' />
                  <tbody>
                    <tr>
                      <LabelCell label='Plain (KGs - 22Kt Terms)' />
                      {computed.physicalStockPlain.map((v, i) => (
                        <AutoCell key={i} value={fmtDec(v)} />
                      ))}
                    </tr>
                    <tr>
                      <LabelCell label='Studded (₹ Lakhs)' />
                      {computed.physicalStockStudded.map((v, i) => (
                        <AutoCell key={i} value={fmtDec(v)} />
                      ))}
                    </tr>
                    <tr>
                      <LabelCell label='Coins (KGs - 24Kt Terms)' />
                      {computed.physicalStockCoins.map((v, i) => (
                        <AutoCell key={i} value={fmtDec(v)} />
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* ──────────────────────────────────────────────────────
                        SECTION 4 — Stock (UCP Terms - ₹ Lakhs)
                    ────────────────────────────────────────────────────── */}
              <div className='bg-white rounded-lg shadow-md overflow-x-auto'>
                <table className='min-w-full border-collapse'>
                  <SectionHeader label='Stock (UCP Terms - ₹ Lakhs)' />
                  <tbody>
                    <tr>
                      <LabelCell label='Plain (KGs - 22Kt Terms)' />
                      {computed.stockPlain.map((v, i) => (
                        <AutoCell key={i} value={fmt(v)} />
                      ))}
                    </tr>
                    <tr>
                      <LabelCell label='Studded (₹ Lakhs)' />
                      {computed.stockStudded.map((v, i) => (
                        <AutoCell key={i} value={fmt(v)} />
                      ))}
                    </tr>
                    <tr>
                      <LabelCell label='Coins (KGs - 24Kt Terms)' />
                      {computed.stockCoins.map((v, i) => (
                        <AutoCell key={i} value={fmt(v)} />
                      ))}
                    </tr>
                    <TotalRow label='Total' values={computed.totalStock.map((v) => fmt(v))} />
                  </tbody>
                </table>
              </div>

              {/* ──────────────────────────────────────────────────────
                        SECTION 5 — Stock Turn: Brand Guidelines (populated from TOT calculation)
                    ────────────────────────────────────────────────────── */}
              <div className='bg-white rounded-lg shadow-md overflow-x-auto'>
                <table className='min-w-full border-collapse'>
                  <SectionHeader label='Stock Turn - Brand Guidelines' />
                  <tbody>
                    <tr><LabelCell label='Plain' />{computed.bgPlainStockTurn.map((v, i) => <AutoCell key={i} value={fmtDec(v)} />)}</tr>
                    <tr><LabelCell label='Studded' />{computed.bgStuddedStockTurn.map((v, i) => <AutoCell key={i} value={fmtDec(v)} />)}</tr>
                    <tr><LabelCell label='Coins / Silver Share' />{computed.bgCoinsStockTurn.map((v, i) => <AutoCell key={i} value={fmtDec(v)} />)}</tr>
                    <TotalRow label='Total' values={computed.bgTotalStockTurn.map((v) => fmtDec(v))} />
                  </tbody>
                </table>
              </div>

              {/* Navigation Buttons */}
              <div className='flex justify-start mt-2'>
                <div className='flex gap-3 flex-col items-end'>
                  {!isPhase2FormComplete && incompleteReasons.length > 0 && (
                    <ul className='text-xs text-red-500 text-right space-y-0.5'>
                      {incompleteReasons.map((r, i) => (
                        <li key={i}>⚠️ {r}</li>
                      ))}
                    </ul>
                  )}
                  {isSaved ? (
                    <button
                      type='button'
                      onClick={handleNext}
                      className='bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-2 rounded-lg shadow'>
                      Next →
                    </button>
                  ) : (
                    <button
                      type='button'
                      onClick={handleSave}
                      disabled={isSaving || !isPhase2FormComplete}
                      title={!isPhase2FormComplete ? incompleteReasons.join(" | ") : ""}
                      className={`font-semibold px-8 py-2 rounded-lg shadow transition ${isSaving || !isPhase2FormComplete
                        ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                        : "bg-green-600 hover:bg-green-700 text-white cursor-pointer"
                        }`}>
                      {isSaving ? (
                        <span className='flex items-center gap-2'>
                          <Spinner /> Saving...
                        </span>
                      ) : (
                        "Save"
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
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
    </div>
  );
}
