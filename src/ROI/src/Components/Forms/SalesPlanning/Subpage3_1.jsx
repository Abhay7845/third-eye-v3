import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useSection3Context } from "./Section3Context";
import { toast } from "react-toastify";
import { BASE_URL } from "../data/baseUrl";
import { useSelector } from "react-redux";

const particularsFields = [
  "Super Built Up Area",
  "Carpet area",
  "Sales",
  "Inventory",
  "Sales Plain share",
  "Sales Studded share",
  "Sales Coin Silver share",
  "Inventory Plain share",
  "Inventory Studded share",
  "Plain Stock Turns",
  "Studded Stock Turns",
  "LCG mix",
  "MCG mix",
  "HCG mix",
  "Btg AMC%",
  "City AMC%",
];

const expensesFields = [
  "Rent",
  "Staff Salaries",
  "Security & Housekeeping",
  "Electricity",
  "Repairs & Maintenance",
  "Insurance",
  "BTL",
  "Travel & Conveyance",
  "Telephone/Internet",
  "Credit Card Commission",
  "GST (primarily rental)",
  "Store - Printing/Pantry etc",
  "Consumables",
  "Other - Staff welfare/Uniforms etc",
];

// ─── Units for each Store Particulars field ─────────────────────────────────────
const particularsUnits = {
  "Super Built Up Area": "sqft",
  "Carpet area": "sqft",
  Sales: "₹ [in Cr.]",
  Inventory: "₹ [in Cr.]",
  "Sales Plain share": "%",
  "Sales Studded share": "%",
  "Sales Coin Silver share": "%",
  "Inventory Plain share": "%",
  "Inventory Studded share": "%",
  "Plain Stock Turns": "×",
  "Studded Stock Turns": "×",
  "LCG mix": "%",
  "MCG mix": "%",
  "HCG mix": "%",
  "Btg AMC%": "%",
  "City AMC%": "%",
};

// ─── react-hook-form validation rules (blocking — shown in red) ───────────────
const getValidationRules = (field) => {
  const base = {
    required: "This field is required",
    min: { value: 0, message: "Value cannot be negative" },
  };
  switch (field) {
    case "Rent":
      return {
        ...base,
        min: { value: 1, message: "Rent must be greater than ₹0" },
      };
    case "Staff Salaries":
      return {
        ...base,
        min: { value: 1, message: "Staff salaries must be greater than ₹0" },
      };
    case "Security & Housekeeping":
      return {
        ...base,
        min: {
          value: 1,
          message: "Security & Housekeeping must be greater than ₹0",
        },
      };
    default:
      return { ...base };
  }
};

// ─── Labour-law & business soft warnings (non-blocking — shown in yellow) ─────
// References: Code on Wages, 2019 (national floor min wage ≈ ₹15,000/month
// for skilled workers in metro areas); typical retail benchmarks for rent.
const getLabourWarning = (field, monthlyValue) => {
  const v = parseFloat(monthlyValue) || 0;
  if (v <= 0) return null; // only warn when a value has been entered
  switch (field) {
    case "Rent":
      if (v < 50000)
        return "⚠ Rent below ₹50,000/month — verify this is appropriate for a retail store location.";
      return null;
    case "Staff Salaries":
      if (v < 15000)
        return "⚠ Labour Law (Code on Wages, 2019): Total staff salary appears low. Minimum wage is ₹15,000/person/month for skilled workers — ensure compliance.";
      return null;
    case "Security & Housekeeping":
      if (v < 12000)
        return "⚠ Labour Law: Minimum ₹12,000/person/month for security / housekeeping staff (assumes at least 2 staff members).";
      return null;
    default:
      return null;
  }
};

const fmt = (n) =>
  n === null || n === undefined || isNaN(n)
    ? "—"
    : Number(n).toLocaleString("en-IN", { maximumFractionDigits: 0 });

// Sensible monthly defaults for a premium jewelry boutique (Tanishq-scale)
const EXPENSE_DEFAULTS = {
  "Rent":                              "200000",
  "Staff Salaries":                    "120000",
  "Security & Housekeeping":           "25000",
  "Electricity":                       "18000",
  "Repairs & Maintenance":             "5000",
  "Insurance":                         "15000",
  "BTL":                               "12000",
  "Travel & Conveyance":               "5000",
  "Telephone/Internet":                "3000",
  "Credit Card Commission":            "10000",
  "GST (primarily rental)":            "36000",
  "Store - Printing/Pantry etc":       "4000",
  "Consumables":                       "4000",
  "Other - Staff welfare/Uniforms etc":"6000",
};

export default function Subpage3_1({ handleNext }) {
  // ── Store particulars come from the outer Section3 context ────────────
  const { storeParticulars, forwardDetail, markStepSaved } =
    useSection3Context();
  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      expenses: Object.fromEntries(
        expensesFields.map((f) => [f, EXPENSE_DEFAULTS[f] ?? ""])
      ),
    },
  });
  const userLog = useSelector((state) => state?.user?.user);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Load previously saved expenses when resuming
  useEffect(() => {
    const roiid = forwardDetail?.roiid;
    if (!roiid || isSaved) return;
    (async () => {
      try {
        const res = await fetch(`${BASE_URL}/sales_planning`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ screen: 1, roiid }),
        });
        if (!res.ok) return;
        const json = await res.json();
        const row = json?.data?.[0];
        if (!row) return;
        const saved = row.expenses ?? row;
        expensesFields.forEach((field) => {
          const entry = saved[field];
          const val = entry?.monthly ?? entry ?? "";
          if (val !== "" && val !== undefined)
            setValue(`expenses.${field}`, String(val));
        });
        setIsSaved(true);
      } catch (e) {
        console.error("Failed to load saved expenses:", e);
      }
    })();
  }, [forwardDetail?.roiid]);

  const userExpenses = useWatch({ control, name: "expenses" });

  // All fields filled with a non-empty, non-negative value
  const isFormComplete = expensesFields.every(
    (field) =>
      userExpenses?.[field] !== "" && userExpenses?.[field] !== undefined,
  );

  // Per-field: annual = monthly × 12
  const annualValues = Object.fromEntries(
    expensesFields.map((field) => [
      field,
      (parseFloat(userExpenses?.[field]) || 0) * 12,
    ]),
  );

  const totalMonthly = expensesFields.reduce(
    (s, f) => s + (parseFloat(userExpenses?.[f]) || 0),
    0,
  );
  const totalAnnual = totalMonthly * 12;

  const onSubmit = async (data) => {
    setIsSaving(true);
    try {
      // Build payload: monthly + annual per field
      const expenses = Object.fromEntries(
        expensesFields.map((field) => [
          field,
          {
            monthly: parseFloat(data.expenses[field]) || 0,
            annual: (parseFloat(data.expenses[field]) || 0) * 12,
          },
        ]),
      );
      const formData = {
        username: userLog?.name,
        roiid: forwardDetail.roiid,
        ref_storecode: forwardDetail.refStoreCode,
        storeParticulars,
        expenses,
        totals: { totalMonthly, totalAnnual },
      };

      // TODO: Replace with real API call
      const res = await fetch(`${BASE_URL}/sales_planning_page_1`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        toast.error("Failed to save store details. Please try again.");
        return;
      }
      setIsSaving(false);
      setIsSaved(true);
      markStepSaved(0);
      setShowModal(true);
    } catch (error) {
      console.error(error);
      toast.error("Failed to save data. Please try again.");
      setIsSaving(false);
    }
  };

  return (
    <div>
      <div className='subpage3_1 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 min-h-screen'>
        {/* Header */}
        <div className='mb-6'>
          <h2 className='text-xl font-bold text-gray-800 mb-1'>
            Store Details 
          </h2>
          <p className='text-gray-500 text-sm'>
            View store particulars and enter key monthly expenses
          </p>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
          {/* ── Left — Store Particulars ─────────────────────────── */}
          <div className='bg-white rounded-xl shadow-lg overflow-hidden h-full flex flex-col'>
            <div className='px-5 py-4 border-b border-gray-100'>
              <h3 className='text-base font-bold text-gray-800'>
                📊 Store Particulars [The fields value are based on RefStore]
              </h3>
              <p className='text-xs text-gray-400 mt-0.5'>
                Reference data — read only
              </p>
            </div>

            {/* Column headers */}
            <div className='grid grid-cols-[2fr_1fr_56px] gap-x-2 px-5 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide bg-gray-50 border-b border-gray-100'>
              <span>Field</span>
              <span className='text-right'>Value</span>
              <span className='text-center'>Unit</span>
            </div>

            <div className='flex-1 overflow-y-auto'>
              {particularsFields.map((field, i) => (
                <div
                  key={field}
                  className={`grid grid-cols-[2fr_1fr_56px] gap-x-2 items-center px-5 py-2 ${
                    i % 2 === 0 ? "bg-white" : "bg-blue-50/40"
                  }`}>
                  <span
                    className='text-sm font-semibold text-gray-700 truncate'
                    title={field}>
                    {field}
                  </span>
                  <span className='text-sm font-bold text-gray-800 text-right tabular-nums'>
                    {storeParticulars?.[field] ?? "—"}
                  </span>
                  <span className='text-xs font-medium text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded text-center'>
                    {particularsUnits[field] ?? ""}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Right — Key Expenses ─────────────────────────────── */}
          <div className='bg-white rounded-xl shadow-lg overflow-hidden h-full flex flex-col'>
            <div className='px-5 py-4 border-b border-gray-100 flex items-start justify-between'>
              <div>
                <h3 className='text-base font-bold text-gray-800'>
                  💰 Key Expenses [The Value of Expenses are on the basis of Ref store, you can edit accordingly]
                </h3>
                <p className='text-xs text-gray-400 mt-0.5'>
                  Enter monthly values — annual is auto-calculated
                </p>
              </div>
              {/* Legend */}
              <div className='flex gap-3 text-xs text-gray-500 mt-0.5'>
                <span className='inline-flex items-center gap-1'>
                  <span className='w-2.5 h-2.5 rounded-sm bg-blue-50 border border-blue-300 inline-block' />
                  Monthly
                </span>
                <span className='inline-flex items-center gap-1'>
                  <span className='w-2.5 h-2.5 rounded-sm bg-gray-100 border border-gray-300 inline-block' />
                  Annual ×12
                </span>
              </div>
            </div>

            {/* Column headers */}
            <div className='grid grid-cols-[2fr_1fr_1fr] gap-x-2 px-5 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide bg-gray-50 border-b border-gray-100'>
              <span>Expense</span>
              <span className='text-right'>Monthly (₹)</span>
              <span className='text-right'>Annual (₹)</span>
            </div>

            <div className='flex-1 overflow-y-auto'>
              {expensesFields.map((field, i) => {
                const fieldError = errors.expenses?.[field];
                const warning = getLabourWarning(field, userExpenses?.[field]);
                const hasError = !!fieldError;

                return (
                  <div
                    key={field}
                    className={i % 2 === 0 ? "bg-white" : "bg-green-50/30"}>
                    <div className='grid grid-cols-[2fr_1fr_1fr] gap-x-2 items-center px-5 py-2'>
                      <label
                        className='text-sm font-semibold text-gray-700 truncate'
                        title={field}>
                        {field}
                      </label>

                      {/* Monthly input */}
                      <input
                        type='number'
                        step='1'
                        placeholder='0'
                        min={0}
                        disabled={isSaved}
                        {...register(
                          `expenses.${field}`,
                          getValidationRules(field),
                        )}
                        className={`w-full px-2 py-1.5 border rounded-md text-sm text-right focus:outline-none transition ${
                          isSaved
                            ? "bg-gray-100 cursor-not-allowed text-gray-500 border-gray-200"
                            : hasError
                            ? "border-red-400 bg-red-50 focus:ring-1 focus:ring-red-300"
                            : warning
                            ? "border-yellow-400 bg-yellow-50 focus:ring-1 focus:ring-yellow-200"
                            : "border-blue-200 bg-blue-50 focus:border-blue-400 focus:ring-1 focus:ring-blue-200"
                        }`}
                      />

                      {/* Annual — computed, read-only */}
                      <div className='w-full px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-md text-sm text-right text-gray-700 font-semibold tabular-nums select-none'>
                        {annualValues[field] > 0
                          ? fmt(annualValues[field])
                          : "—"}
                      </div>
                    </div>

                    {/* Blocking error */}
                    {hasError && (
                      <p className='text-xs text-red-600 px-5 pb-1.5 -mt-1'>
                        {fieldError.message}
                      </p>
                    )}

                    {/* Labour-law warning (non-blocking) */}
                    {!hasError && warning && (
                      <p className='text-xs text-yellow-700 px-5 pb-1.5 -mt-1'>
                        {warning}
                      </p>
                    )}
                  </div>
                );
              })}

              {/* Totals row */}
              {isFormComplete && (
                <div className='grid grid-cols-[2fr_1fr_1fr] gap-x-2 px-5 py-2.5 bg-blue-100 border-t-2 border-blue-300'>
                  <span className='text-sm font-bold text-gray-800'>Total</span>
                  <span className='text-sm font-bold text-right text-blue-800 tabular-nums'>
                    {fmt(totalMonthly)}
                  </span>
                  <span className='text-sm font-bold text-right text-blue-800 tabular-nums'>
                    {fmt(totalAnnual)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className='flex justify-start gap-4 mt-12'>
          {!isSaved ? (
            <button
              type='button'
              disabled={!isFormComplete || isSaving}
              onClick={handleSubmit(onSubmit)}
              className={`font-semibold px-8 py-3 rounded-lg shadow-lg transition transform ${
                isFormComplete && !isSaving
                  ? "bg-blue-600 hover:bg-blue-700 text-white hover:scale-105 cursor-pointer"
                  : "bg-gray-400 text-gray-200 cursor-not-allowed"
              }`}>
              {isSaving ? "Saving..." : "Save"}
            </button>
          ) : (
            <button
              type='button'
              onClick={handleNext}
              className='bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-lg shadow-lg transition transform hover:scale-105 cursor-pointer'>
              Next →
            </button>
          )}
        </div>
      </div>

      {/* ── Summary Modal ───────────────────────────────────────── */}
      {showModal && (
        <div className='fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4'>
          <div className='bg-white rounded-2xl shadow-2xl w-full max-w-md'>
            <div className='bg-gradient-to-r from-green-500 to-emerald-600 px-8 py-6 rounded-t-2xl'>
              <div className='flex items-center gap-3'>
                <span className='text-3xl'>✅</span>
                <div>
                  <h2 className='text-xl font-bold text-white'>
                    Store Details Saved
                  </h2>
                  <p className='text-green-100 text-sm mt-0.5'>
                    Step 1 of Sales Planning complete
                  </p>
                </div>
              </div>
            </div>
            <div className='p-8 space-y-3'>
              <div className='grid grid-cols-2 gap-3'>
                <div className='bg-gray-50 rounded-lg px-4 py-3'>
                  <p className='text-xs text-gray-400 uppercase tracking-wide font-medium'>
                    Total Monthly Expenses
                  </p>
                  <p className='text-gray-800 font-semibold mt-0.5'>
                    ₹ {totalMonthly.toLocaleString("en-IN")}
                  </p>
                </div>
                <div className='bg-gray-50 rounded-lg px-4 py-3'>
                  <p className='text-xs text-gray-400 uppercase tracking-wide font-medium'>
                    Total Annual Expenses
                  </p>
                  <p className='text-gray-800 font-semibold mt-0.5'>
                    ₹ {totalAnnual.toLocaleString("en-IN")}
                  </p>
                </div>
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
                Proceed to Sales Planning →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
