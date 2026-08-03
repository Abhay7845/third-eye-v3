import { useEffect, useState } from "react";
import { Section3Context } from "./Section3Context";
import Subpage3_1 from "./Subpage3_1";
import Subpage3_2 from "./Subpage3_2";
import Subpage3_3 from "./Subpage3_3";
import Subpage3_4 from "./Subpage3_4";
import { toast } from "react-toastify";
import { BASE_URL } from "../data/baseUrl";

// ─── Reference store data (TODO: replace with API call) ──────────────────────
const referenceDatabase = {
  REF001: {
    name: "Store A - Mumbai",
    particulars: {
      "Super Built Up Area": 5000,
      "Carpet area": 4500,
      Sales: 1200000,
      Inventory: 350000,
      "Sales Plain share": 65,
      "Sales Studded share": 35,
      "Inventory Plain share": 55,
      "Inventory Studded share": 45,
      "Plain Stock Turns": 4.2,
      "Studded Stock Turns": 3.8,
      "LCG mix": 30,
      "MCG mix": 40,
      "HCG mix": 30,
      "Btg AMC%": 8,
      "City AMC%": 12,
    },
  },
  REF002: {
    name: "Store B - Delhi",
    particulars: {
      "Super Built Up Area": 6000,
      "Carpet area": 5200,
      Sales: 1500000,
      Inventory: 400000,
      "Sales Plain share": 60,
      "Sales Studded share": 40,
      "Inventory Plain share": 50,
      "Inventory Studded share": 50,
      "Plain Stock Turns": 4.5,
      "Studded Stock Turns": 4.0,
      "LCG mix": 28,
      "MCG mix": 42,
      "HCG mix": 30,
      "Btg AMC%": 10,
      "City AMC%": 14,
    },
  },
};

// ─── Step definitions ─────────────────────────────────────────────────────────
const STEPS = [
  { id: 1, label: "Store Details" },
  { id: 2, label: "Sales Planning" },
  { id: 3, label: "Pricing Metrics" },
  { id: 4, label: "Discounts" },
];

// ─── Stepper component ────────────────────────────────────────────────────────
function Stepper({ currentStep, savedSteps }) {
  return (
    <div className='flex items-center justify-center py-5 bg-white border-b border-gray-200 shadow-sm'>
      {STEPS.map((step, idx) => {
        const saved = savedSteps[idx];
        const active = currentStep === step.id;
        return (
          <div key={step.id} className='flex items-center'>
            <div className='flex flex-col items-center'>
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-all ${
                  saved
                    ? "bg-green-500 border-green-500 text-white"
                    : active
                    ? "bg-blue-600 border-blue-600 text-white"
                    : "bg-gray-100 border-gray-300 text-gray-400"
                }`}>
                {saved ? "✓" : step.id}
              </div>
              <span
                className={`text-xs mt-1 font-medium whitespace-nowrap ${
                  saved
                    ? "text-green-600"
                    : active
                    ? "text-blue-700"
                    : "text-gray-400"
                }`}>
                {step.label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div
                className={`h-0.5 w-14 mx-2 mb-5 rounded transition-all ${
                  saved ? "bg-green-400" : "bg-gray-200"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Main layout component ────────────────────────────────────────────────────
export default function Section3({ roiContext, onNext }) {
  const [subSteps, setSubSteps] = useState(1);
  const [savedSteps, setSavedSteps] = useState([false, false, false, false]);
  const [forwardDetail, setforwardDetail] = useState({});
  const [subpage3_2Data, setSubpage3_2Data] = useState(null);
  const [isFetched, setIsFetched] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [storeParticulars, setStoreParticulars] = useState({
    "Super Built Up Area": 0,
    "Carpet area": 0,
    Sales: 0,
    Inventory: 0,
    "Sales Plain share": 0,
    "Sales Studded share": 0,
    "Sales Coin Silver share": 0,
    "Inventory Plain share": 0,
    "Inventory Studded share": 0,
    "Plain Stock Turns": 0,
    "Studded Stock Turns": 0,
    "LCG mix": 0,
    "MCG mix": 0,
    "HCG mix": 0,
    "Btg AMC%": 0,
    "City AMC%": 0,
  });

  // Called by any subpage after a successful save
  const markStepSaved = (stepIndex) => {
    setSavedSteps((prev) => {
      const updated = [...prev];
      updated[stepIndex] = true;
      return updated;
    });
  };

  const fetchRefStoreMixDetail = async (storeCode) => {
    const res = await fetch(`${BASE_URL}/refStore/${storeCode}`);
    if (!res.ok) {
      toast.error("Failed to fetch reference store details.");
      setStoreParticulars({});
      return;
    }
    const response = await res.json();
    const data = response.data[0];
    setStoreParticulars((prev) => ({
      ...prev,
      Sales: data?.sales_cr,
      Inventory: data?.inv_cr,
      "Sales Plain share": data?.sales_plain_share,
      "Sales Studded share": data?.sales_studded_share,
      "Sales Coin Silver share": data?.sales_coin_silver_share,
      "Inventory Plain share": data?.inv_plain_share,
      "Inventory Studded share": data?.inv_studded_share,
      "Plain Stock Turns": data?.plain_stock_turn,
      "Studded Stock Turns": data?.studded_stock_turn,
      "LCG mix": data?.lcg_mix,
      "MCG mix": data?.mcg_mix,
      "HCG mix": data?.hcg_mix,
      "Btg AMC%": data?.["Btq AMC%"],
      "City AMC%": data?.["City AMC%"],
    }));
    setforwardDetail({
      roiid: roiContext?.roiId,
      refStoreCode: roiContext?.refStoreCode,
      region: roiContext?.region,
      storeFormat: roiContext?.existingStoreFormat,
    });
    setIsFetched(true);
  };

  const fetchScreen2Detail = async (roiid) => {
    const res = await fetch(
      `${BASE_URL}/fetchScreen?parameter=roi_store_retail_specifications&roiid=${roiid}`,
    );
    if (!res.ok) {
      throw new Error("ROI ID not found. Please check and try again.");
    }
    const json = await res.json();
    return [
      json?.data[0]?.new_over_all_area_SBA,
      json?.data[0]?.new_retail_area,
    ];
  };

  const handleFetchRefStoreDetail = async () => {
    setIsFetching(true);
    const code = roiContext?.refStoreCode;
    const roi_id = roiContext?.roiId;
    try {
      if (roiContext?.projectType !== "New Store") {
        const res = await fetch(`${BASE_URL}/area_detail/${roi_id}`);
        if (!res.ok) {
          toast.error("Failed to fetch store area details.");
          return;
        }
        const response = await res.json();
        const data = response.data[0];
        if (
          roiContext?.projectType === "Store Expansion" ||
          roiContext?.projectType === "Relocation"
        ) {
          setStoreParticulars((prev) => ({
            ...prev,
            "Super Built Up Area": data?.new_over_all_area_SBA,
            "Carpet area": data?.new_retail_area,
          }));
        } else {
          setStoreParticulars((prev) => ({
            ...prev,
            "Super Built Up Area": data?.existing_overall_area_SBA,
            "Carpet area": data?.new_retail_area,
          }));
        }
      } else {
        const data = await fetchScreen2Detail(roi_id);
        setStoreParticulars((prev) => ({
          ...prev,
          "Super Built Up Area": data[0] || 0,
          "Carpet area": data[1] || 0,
        }));
      }
      await fetchRefStoreMixDetail(code);
    } catch (err) {
      console.error(err);
      toast.error(
        err.message || "Failed to fetch store details. Please try again.",
      );
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    handleFetchRefStoreDetail();
  }, []);

  useEffect(() => {
    if (subSteps === 5) {
      onNext();
    }
  }, [subSteps]);

  const handleNext = () => setSubSteps((s) => s + 1);
  const handlePrevious = () => setSubSteps((s) => s - 1);

  const contextValue = {
    storeParticulars,
    forwardDetail,
    isFetched,
    subpage3_2Data,
    setSubpage3_2Data,
    savedSteps,
    markStepSaved,
  };

  return (
    <Section3Context.Provider value={contextValue}>
      {/* ── Reference Code Fetch Bar ─────────────────────────────── */}
      <div className='bg-white shadow-md px-6 py-4 border-b border-gray-200'>
        <h1 className='text-2xl font-bold text-gray-800 mb-3'>
          Sales Planning
        </h1>
        {/* ROI Context Banner */}
        {roiContext?.roiId && (
          <div className='bg-indigo-50 border border-indigo-200 rounded-xl px-6 py-4'>
            <div className='flex flex-wrap items-center gap-4 text-sm'>
              <span className='text-indigo-500 font-medium'>ROI ID:</span>
              <span className='text-indigo-800 font-bold tracking-wide'>
                {roiContext.roiId}
              </span>
              <span className='text-gray-300'>|</span>
              <span className='text-gray-600'>
                Project:{" "}
                <strong className='text-gray-800'>
                  {roiContext.projectType}
                </strong>
              </span>
              {roiContext.historyId && (
                <>
                  <span className='text-gray-300'>|</span>
                  <span className='text-gray-600'>
                    History ID:{" "}
                    <strong className='text-gray-800'>
                      {roiContext.historyId}
                    </strong>
                  </span>
                </>
              )}
              {roiContext.refStoreCode && (
                <>
                  <span className='text-gray-300'>|</span>
                  <span className='text-gray-600'>
                    Reference Store Code:{" "}
                    <strong className='text-gray-800'>
                      {roiContext.refStoreCode}
                    </strong>
                  </span>
                </>
              )}
            </div>
          </div>
        )}
        {/* <div className="flex gap-4 items-end max-w-lg">
                    <div className="flex-1">
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                            Reference Store Code
                        </label>
                        <input
                            type="text"
                            placeholder="e.g., REF001"
                            value={referenceCode}
                            onChange={(e) => setReferenceCode(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && !isFetched && handleFetchCode()}
                            disabled={isFetched}
                            className={`w-full px-4 py-2 border-2 rounded-lg focus:outline-none transition ${isFetched
                                    ? "border-green-400 bg-green-50 text-green-800 cursor-not-allowed"
                                    : "border-gray-300 focus:border-blue-500"
                                }`}
                        />
                    </div>
                    {!isFetched ? (
                        <button
                            type="button"
                            onClick={handleFetchCode}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-lg shadow transition"
                        >
                            Fetch
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={handleReset}
                            className="bg-red-500 hover:bg-red-600 text-white font-semibold px-6 py-2 rounded-lg shadow transition"
                        >
                            Reset
                        </button>
                    )}
                </div> */}
        {isFetching && (
          <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/20'>
            <div className='rounded-lg bg-white px-6 py-5 shadow-lg flex items-center gap-3'>
              <svg
                className='h-6 w-6 animate-spin text-blue-600'
                xmlns='http://www.w3.org/2000/svg'
                fill='none'
                viewBox='0 0 24 24'>
                <circle
                  className='opacity-25'
                  cx='12'
                  cy='12'
                  r='10'
                  stroke='currentColor'
                  strokeWidth='4'
                />
                <path
                  className='opacity-75'
                  fill='currentColor'
                  d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z'
                />
              </svg>

              <span className='font-medium'>
                Fetching reference store code...
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ── Gate: require fetch before proceeding ────────────────── */}
      {isFetched && (
        <>
          {/* ── Stepper ──────────────────────────────────────── */}
          <Stepper currentStep={subSteps} savedSteps={savedSteps} />

          {/* ── Active subpage ───────────────────────────────── */}
          {subSteps === 1 && <Subpage3_1 handleNext={handleNext} />}
          {subSteps === 2 && (
            <Subpage3_2
              handleNext={handleNext}
              handlePrevious={handlePrevious}
            />
          )}
          {subSteps === 3 && (
            <Subpage3_3
              handleNext={handleNext}
              handlePrevious={handlePrevious}
            />
          )}
          {subSteps === 4 && (
            <Subpage3_4 handleNext={handleNext} onNext={onNext} />
          )}
        </>
      )}
    </Section3Context.Provider>
  );
}
