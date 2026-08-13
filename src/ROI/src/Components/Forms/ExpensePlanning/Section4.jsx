import { useEffect, useState } from "react";
import { Section4Context } from "./Section4Context";
import Subpage4_1 from "./Subpage4_1";
import Subpage4_2 from "./Subpage4_2";
import Subpage4_3 from "./Subpage4_3";
import { toast } from "react-toastify";
import { BASE_URL } from "../data/baseUrl";

// ─── Step definitions ─────────────────────────────────────────────────────────
const STEPS = [
  { id: 1, label: "Capex" },
  { id: 2, label: "Salaries & Expenses" },
  { id: 3, label: "Rent & Summary" },
];

// ─── Stepper ──────────────────────────────────────────────────────────────────
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
                    ? "bg-amber-600 border-amber-600 text-white"
                    : "bg-gray-100 border-gray-300 text-gray-400"
                }`}>
                {saved ? "✓" : step.id}
              </div>
              <span
                className={`text-xs mt-1 font-medium whitespace-nowrap ${
                  saved
                    ? "text-green-600"
                    : active
                    ? "text-amber-700"
                    : "text-gray-400"
                }`}>
                {step.label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div
                className={`h-0.5 w-16 mx-2 mb-5 rounded transition-all ${
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
export default function Section4({
  roiContext,
  onNext,
  onPrevious,
  initialSubStep = 1,
}) {
  const [subStep, setSubStep] = useState(initialSubStep);
  const [savedSteps, setSavedSteps] = useState([false, false, false]);
  const [subpage4_1Data, setSubpage4_1Data] = useState(null);
  const [subpage4_2Data, setSubpage4_2Data] = useState(null);

  // ── Store code input — fetches data from Screen 2 that was already saved ─
  const [storeCode, setStoreCode] = useState("");
  const [storeData, setStoreData] = useState(null);
  const [isFetched, setIsFetched] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  const markStepSaved = (stepIndex) => {
    setSavedSteps((prev) => {
      const updated = [...prev];
      updated[stepIndex] = true;
      return updated;
    });
  };

  const handleFetchStoreData = async () => {
    try {
      setIsFetching(true);
      const roiid = roiContext?.roiId;
      const res = await fetch(
        `${BASE_URL}/fetchScreen?parameter=roi_store_retail_specifications&roiid=${roiid}`,
      );
      if (res.ok) {
        const json = await res.json();
        console.log(json.data[0])
        if(roiContext?.projectType !== 'New Store'){
          setStoreData({
          ...json.data[0],
          project_type: roiContext?.projectType,
        });
        }
        else{
          setStoreData({
          ...json.data[0],
          project_type: roiContext?.projectType,
          refStoreCode:roiContext?.refStoreCode
        });
        }
        setIsFetched(true);
      } else {
        toast.error(
          "Failed to fetch store specifications. Please go back and try again.",
        );
      }
    } catch (err) {
      console.error("Failed to fetch store data", err);
      toast.error("Failed to load store data. Please try again.");
    } finally {
      setIsFetching(false);
    }
  };

  const handleReset = () => {
    setIsFetched(false);
    setStoreData(null);
    setStoreCode("");
    setSubStep(1);
    setSavedSteps([false, false, false]);
    setSubpage4_1Data(null);
    setSubpage4_2Data(null);
  };

  const handleNext = () => setSubStep((s) => Math.min(s + 1, 3));
  const handlePrevious = () => setSubStep((s) => Math.max(s - 1, 1));

  const contextValue = {
    storeData,
    savedSteps,
    markStepSaved,
    subpage4_1Data,
    subpage4_2Data,
    setSubpage4_1Data,
    setSubpage4_2Data,
  };

  useEffect(() => {
    handleFetchStoreData();
  }, []);

  return (
    <Section4Context.Provider value={contextValue}>
      {/* ── Store Code Fetch Bar ──────────────────────────────────────── */}
      <div className='bg-white shadow-md px-6 py-4 border-b border-gray-200'>
        <h1 className='text-2xl font-bold text-gray-800 mb-3'>
          Expense Planning
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
                            Store Code
                        </label>
                        <input
                            type="text"
                            placeholder="e.g., STR001"
                            value={storeCode}
                            onChange={(e) => setStoreCode(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && !isFetched && handleFetchStoreData()}
                            disabled={isFetched}
                            className={`w-full px-4 py-2 border-2 rounded-lg focus:outline-none transition ${isFetched
                                    ? "border-green-400 bg-green-50 text-green-800 cursor-not-allowed"
                                    : "border-gray-300 focus:border-amber-500"
                                }`}
                        />
                    </div>
                    {!isFetched ? (
                        <button
                            type="button"
                            onClick={handleFetchStoreData}
                            disabled={isFetching}
                            className={`font-semibold px-6 py-2 rounded-lg shadow transition ${isFetching
                                    ? "bg-gray-400 text-gray-200 cursor-wait"
                                    : "bg-amber-600 hover:bg-amber-700 text-white cursor-pointer"
                                }`}
                        >
                            {isFetching ? "Loading…" : "Fetch"}
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
        {/* {isFetched && storeData && (
                    <p className="mt-2 text-green-600 text-sm font-semibold">
                        ✓ Loaded: {storeCode.trim().toUpperCase()} — {storeData.storeType}, {storeData.carpetArea?.toLocaleString("en-IN")} sqft carpet area
                    </p>
                )} */}
      </div>

      {/* ── Gate: require fetch before proceeding ─────────────────────── */}
      {!isFetched ? (
        <div className='p-10 flex justify-center'>
          <div className='bg-yellow-100 border-l-4 border-yellow-500 p-6 rounded-lg'>
            <p className='text-gray-700 font-medium'>fetching......</p>
          </div>
        </div>
      ) : (
        <>
          {/* ── Stepper ─────────────────────────────────────────── */}
          <Stepper currentStep={subStep} savedSteps={savedSteps} />

          {/* ── Active subpage ───────────────────────────────────── */}
          {subStep === 1 && <Subpage4_1 handleNext={handleNext} />}
          {subStep === 2 && (
            <Subpage4_2
              handleNext={handleNext}
              handlePrevious={handlePrevious}
            />
          )}
          {subStep === 3 && (
            <Subpage4_3 handlePrevious={handlePrevious} onNext={onNext} />
          )}
        </>
      )}

      {/* ── Section-level navigation (only shown after all steps saved) ─ */}
      {isFetched && savedSteps.every(Boolean) && (
        <div className='flex justify-between px-6 py-4 bg-white border-t border-gray-200'>
          {onPrevious && (
            <button
              type='button'
              onClick={onPrevious}
              className='bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold px-6 py-2 rounded-lg shadow transition'>
              ← Back to Sales Planning
            </button>
          )}
          {onNext && (
            <button
              type='button'
              onClick={onNext}
              className='bg-amber-600 hover:bg-amber-700 text-white font-semibold px-6 py-2 rounded-lg shadow transition'>
              Next: Investment →
            </button>
          )}
        </div>
      )}
    </Section4Context.Provider>
  );
}
