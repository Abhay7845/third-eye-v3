import { useEffect, useState } from "react";
import { useSection4Context } from "./Section4Context";
import { toast } from "react-toastify";
import { BASE_URL } from "../data/baseUrl";

// ─── Capex additional items — Yes/No dropdown options ────────────────────────
const YES_NO_ITEMS = [
  { key: "Civil Works", label: "Additional Civil Works" },
  { key: "Additional Work for Corner Property", label: "Corner Property Work" },
  { key: "Lift(Irrespective of the area - 1 No)", label: "Lift Installation" },
  {
    key: "Increase Façade Height per Floor",
    label: "Increase Façade Height per Floor",
  },
  {
    key: "EHV zone addition - Furniture and interior",
    label: "EHV zone addition (Furniture & Interior)",
  },
  {
    key: "DXC Equipment",
    label: "DxC (Equipment and Interiors)",
  },
  { key: "LED Screen", label: "LED Screen" },
  { key: "Solar", label: "Solar Installation" },
  { key: "engravingMachine", label: "Engraving Machine" },
];

const DROPDOWN_ITEMS = [
  { key: "Art & Craft - TYPE 1", label: "Art & Craft - TYPE 1" },
  {
    key: "Art & Craft - TYPE 2 & TYPE 3",
    label: "Art & Craft - TYPE 2 & TYPE 3",
  },
];

// Formatter for Indian currency
const fmt = (n) =>
  n === null || n === undefined || n === ""
    ? "—"
    : Number(n).toLocaleString("en-IN", { maximumFractionDigits: 0 });

const IT_EQUIPMENT_MAX = 2500000; // ₹25 lakh cap

function EditableAmountRow({ label, value, onChange, max, disabled, note }) {
  return (
    <tr className='hover:bg-gray-50'>
      <td className='border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 bg-white'>
        {label}
      </td>
      <td className='border border-gray-200 px-4 py-3 bg-blue-50'>
        <input
          type='number'
          min={0}
          max={max}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder='₹ Enter amount'
          className={`w-full px-2 py-1.5 border border-blue-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 ${
            disabled ? "bg-gray-100 cursor-not-allowed text-gray-500" : "bg-white"
          }`}
        />
      </td>
      <td className='border border-gray-200 px-4 py-3 text-sm font-bold text-right text-gray-800 bg-amber-50'>
        ₹ {fmt(value)}
      </td>
      <td className='border border-gray-200 px-4 py-3 text-xs text-gray-400 italic bg-white'>
        {note}
      </td>
    </tr>
  );
}

function ReadOnlyRow({ label, value, note }) {
  return (
    <tr className='hover:bg-gray-50'>
      <td className='border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 bg-white'>
        {label}
      </td>
      <td className='border border-gray-200 px-4 py-3 text-sm text-gray-500 bg-white text-center'>
        —
      </td>
      <td className='border border-gray-200 px-4 py-3 text-sm font-bold text-right text-gray-800 bg-amber-50'>
        ₹ {fmt(value)}
      </td>
      <td className='border border-gray-200 px-4 py-3 text-xs text-gray-400 italic bg-white'>
        {note}
      </td>
    </tr>
  );
}

function YesNoRow({
  label,
  fieldKey,
  value,
  onChange,
  computedValue,
  disabled,
  userValue,
  onUserValueChange,
}) {
  return (
    <tr className='hover:bg-gray-50'>
      <td className='border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 bg-white'>
        {label}
      </td>
      <td className='border border-gray-200 px-4 py-3 bg-blue-50 space-y-1.5'>
        <select
          value={value}
          onChange={(e) => onChange(fieldKey, e.target.value)}
          disabled={disabled}
          className={`w-full px-2 py-1.5 border border-blue-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 ${
            disabled
              ? "bg-gray-100 cursor-not-allowed text-gray-500"
              : "bg-white"
          }`}>
          <option value=''>Select</option>
          <option value='No'>No</option>
          <option value='Yes'>Yes</option>
          <option value='Enter Custom Value'>Enter Custom Value</option>
        </select>
        {/* User-defined amount input shown only when 'Enter Custom Value' is selected */}
        {value === "Enter Custom Value" && (
          <input
            type='number'
            min={0}
            value={userValue ?? ""}
            onChange={(e) => onUserValueChange(fieldKey, e.target.value)}
            disabled={disabled}
            placeholder='₹ Enter amount'
            className='w-full px-2 py-1.5 border border-violet-300 rounded text-sm bg-violet-50 text-violet-900 focus:outline-none focus:ring-2 focus:ring-violet-400'
          />
        )}
      </td>
      <td className='border border-gray-200 px-4 py-3 text-sm font-bold text-right text-gray-800 bg-amber-50'>
        {value === "Yes"
          ? `₹ ${fmt(computedValue)}`
          : value === "Enter Custom Value"
          ? `₹ ${fmt(userValue || 0)}`
          : "—"}
      </td>
      <td className='border border-gray-200 px-4 py-3 text-xs text-gray-400 italic bg-white'>
        {value === "Enter Custom Value"
          ? "User-defined amount"
          : "If Yes: DB rate/sqft × carpet area"}
      </td>
    </tr>
  );
}

function DropdownRow({
  label,
  fieldKey,
  value,
  onChange,
  options,
  computedValue,
  disabled,
}) {
  return (
    <tr className='hover:bg-gray-50'>
      <td className='border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 bg-white'>
        {label}
      </td>
      <td className='border border-gray-200 px-4 py-3 bg-blue-50'>
        <select
          value={value}
          onChange={(e) => onChange(fieldKey, e.target.value)}
          disabled={disabled}
          className={`w-full px-2 py-1.5 border border-blue-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 ${
            disabled
              ? "bg-gray-100 cursor-not-allowed text-gray-500"
              : "bg-white"
          }`}>
          <option value=''>Select</option>
          {options.map((o) => (
            <option key={o.description} value={o.description}>
              {o.description}
            </option>
          ))}
        </select>
      </td>
      <td className='border border-gray-200 px-4 py-3 text-sm font-bold text-right text-gray-800 bg-amber-50'>
        {value && value !== "" ? `₹ ${fmt(computedValue)}` : "—"}
      </td>
      <td className='border border-gray-200 px-4 py-3 text-xs text-gray-400 italic bg-white'>
        DB rate/sqft × carpet area
      </td>
    </tr>
  );
}

export default function Subpage4_1({ handleNext }) {
  const { storeData, markStepSaved, setSubpage4_1Data } = useSection4Context();
  const [selections, setSelections] = useState(() =>
    Object.fromEntries([
      ...YES_NO_ITEMS.map((item) => [item.key, "No"]),
      ...DROPDOWN_ITEMS.map((item) => [item.key, ""]),
    ]),
  );
  const [artOptions, setArtOptions] = useState([]);
  const [dbRates, setDbRates] = useState([]);
  const [interiors, setInteriors] = useState(0);
  const [itEquipment, setItEquipment] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Stores user-entered amounts when selection is 'Enter Custom Value'
  const [userEnteredAmounts, setUserEnteredAmounts] = useState(() =>
    Object.fromEntries([
      ...YES_NO_ITEMS.map(({ key }) => [key, ""]),
      ["artAndCrafts", ""],
    ]),
  );

  // Single additional cost field entered before the Total Capex row
  const [sectionAdditionalCost, setSectionAdditionalCost] = useState("");
  const [additionalCostDescription, setAdditionalCostDescription] = useState("");

  // ── Carpet area (declared early — the restore effect below needs it) ──────
  const carpetArea =
    storeData?.project_type === "Relocation" || storeData?.project_type === 'Renovation' ||
    storeData?.project_type === "New Store" || storeData?.project_type === 'Store Expansion'
      ? parseFloat(storeData?.new_retail_area)
      : parseFloat(storeData?.existing_retail_area);

  // Load previously saved CAPEX selections when resuming
  //
  // NOTE: `/expense_details?expense_type=CAPEX` returns the raw flat
  // `roi_capex_expenses` row (one column per item, holding the SAVED ₹
  // AMOUNT) — NOT the `{selections:{...}}` shape this page originally posted.
  // There's no column distinguishing "Yes" (DB-rate) from "Enter Custom
  // Value" (user amount), so we infer it: if the saved amount matches what
  // the live DB rate would compute today, treat it as "Yes"; otherwise it's
  // a custom value. Needs `dbRates`/`carpetArea` loaded first to compare.
  useEffect(() => {
    const roiid = storeData?.roiid;
    if (!roiid || isSaved || !dbRates.length) return;
    (async () => {
      try {
        const res = await fetch(
          `${BASE_URL}/expense_details/${roiid}?expense_type=CAPEX`,
        );
        if (!res.ok) return;
        const json = await res.json();
        const row = json?.data?.[0];
        if (!row) return;

        const COLUMN_BY_KEY = {
          "Civil Works": "Additional Civil Works",
          "Additional Work for Corner Property": "Corner Property Work",
          "Lift(Irrespective of the area - 1 No)": "Lift Installation",
          "Increase Fa\u00e7ade Height per Floor": "Increase Fa\u00e7ade Height per Floor",
          "EHV zone addition - Furniture and interior": "EHV zone addition (Furniture & Interior)",
          "DXC Equipment": "DxC (Equipment and Interiors)",
          "LED Screen": "LED Screen",
          "Solar": "Solar Installation",
          "engravingMachine": "Engraving Machine",
        };
        const rateFor = (key) => {
          const rateData = dbRates.find(
            (item) => item.description.toLowerCase() === key.toLowerCase(),
          );
          if (!rateData) return 0;
          return Number(rateData.sqft) > 0
            ? Number(rateData.sqft) * carpetArea
            : Number(rateData.total_cost) || 0;
        };

        const restoredSelections = {};
        const restoredUserAmounts = {};
        let yesNoTotal = 0;
        YES_NO_ITEMS.forEach(({ key }) => {
          const saved = parseFloat(row[COLUMN_BY_KEY[key]]) || 0;
          yesNoTotal += saved;
          if (saved <= 0) {
            restoredSelections[key] = "No";
            return;
          }
          restoredSelections[key] =
            Math.abs(saved - rateFor(key)) < 1 ? "Yes" : "Enter Custom Value";
          if (restoredSelections[key] === "Enter Custom Value")
            restoredUserAmounts[key] = saved;
        });

        const artType1 = parseFloat(row["Art and Crafts(Type 1 (Crafts)"]) || 0;
        const artType2 = parseFloat(row["Art and Crafts(Type 2 (Crafts)"]) || 0;
        let artTotal = 0;
        if (artType1 > 0) {
          restoredSelections.artAndCrafts = "Art & Craft - TYPE 1";
          artTotal = artType1;
        } else if (artType2 > 0) {
          restoredSelections.artAndCrafts = "Art & Craft - TYPE 2 & TYPE 3";
          artTotal = artType2;
        }

        const savedItEquipment = parseFloat(row["IT (Equipments and Installation)"]) || 0;
        if (savedItEquipment > 0) setItEquipment(savedItEquipment);

        // Additional Cost isn't stored as its own column — back it out of the
        // saved "Other Expenses" total (= YES/NO items + Art&Crafts + this).
        const otherExpensesTotal = parseFloat(row["Other Expenses"]) || 0;
        const leftover = otherExpensesTotal - yesNoTotal - artTotal;
        if (leftover > 0) setSectionAdditionalCost(leftover);

        setSelections((prev) => ({ ...prev, ...restoredSelections }));
        setUserEnteredAmounts((prev) => ({ ...prev, ...restoredUserAmounts }));
        setIsSaved(true);
        // Populate Section4Context too — it's otherwise only set on handleSave,
        // leaving Subpage4_3 (totalCapex/interiors-dependent Yr1 formulas) blank
        // whenever the wizard is resumed straight past this page.
        setSubpage4_1Data({
          roiid,
          interiors: parseFloat(row.Interiors) || 0,
          itEquipment: savedItEquipment,
          totalCapex: parseFloat(row["Total capex"]) || 0,
          ratePerSqft: parseFloat(row["Rate /Sqft"]) || 0,
        });
      } catch (e) {
        console.error("Failed to load saved CAPEX data:", e);
      }
    })();
  }, [storeData?.roiid, dbRates, carpetArea]);

  // ── Fetch DB rates for additional capex items ────────────────────────────
  useEffect(() => {
    const fetchCapexRates = async () => {
      try {
        setIsLoading(true);
        let retail_area = 0;
        if (
          storeData.project_type === "New Store" ||
          storeData?.project_type === "Rennovation"
        ) {
          retail_area = storeData?.new_retail_area;
        } else {
          retail_area = storeData?.existing_retail_area;
        }
        const res = await fetch(
          `${BASE_URL}/roi_expenses?store_type=${storeData?.store_type}&floor_type=${storeData?.flooring_type}&retail_area=${retail_area}`,
        );
        if (res.ok) {
          const json = await res.json();
          setDbRates(json.data ?? {});
          const artOptions = json.data.filter((it) => {
            if (
              it.description === "Art & Craft - TYPE 1" ||
              it.description === "Art & Craft - TYPE 2 & TYPE 3"
            ) {
              return it;
            }
            if (it.description === "Interiors") {
              let interiorTotalCost = retail_area * it?.sqft + it?.total_cost;
              setInteriors(interiorTotalCost);
            }
            if (it.description === "Itexpenses") {
              setItEquipment(it?.total_cost);
            }
          });
          setArtOptions(artOptions);
        }
      } catch (err) {
        console.error("Failed to fetch capex rates", err);
        // Use empty fallback so the form still renders
        setDbRates({});
        setArtOptions(["Type A", "Type B", "Type C"]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCapexRates();
  }, [storeData?.carpetArea]);

  const handleChange = (key, val) => {
    setSelections((prev) => ({ ...prev, [key]: val }));
  };

  const handleUserValueChange = (key, val) => {
    setUserEnteredAmounts((prev) => ({ ...prev, [key]: val }));
  };

  // Clamps user edits to the IT equipment field at ₹25 lakh
  const handleItEquipmentChange = (val) => {
    if (val === "") {
      setItEquipment("");
      return;
    }
    const num = parseFloat(val) || 0;
    setItEquipment(num > IT_EQUIPMENT_MAX ? IT_EQUIPMENT_MAX : num);
  };

  // Effective amount per item: DB rate (Yes), user-entered (Enter Custom Value), or 0 (No)
  const getEffectiveAmount = (key) => {
    const sel = selections[key];
    return sel === "Yes"
      ? computedAmounts[key] ?? 0
      : sel === "Enter Custom Value"
      ? parseFloat(userEnteredAmounts[key]) || 0
      : 0;
  };

  // ── Compute capex amounts ─────────────────────────────────────────────────
  const computedAmounts = {};

  YES_NO_ITEMS.forEach(({ key }) => {
    const rateData = dbRates.find(
      (item) => item.description.toLowerCase() === key.toLowerCase(),
    );

    if (!rateData) {
      computedAmounts[key] = 0;
      return;
    }

    computedAmounts[key] =
      Number(rateData.total_cost) > 0 ?? Number(rateData.total_cost);

    computedAmounts[key] =
      Number(rateData.sqft) > 0
        ? Number(rateData.sqft) * carpetArea
        : Number(rateData.total_cost);
  });

  // Art & Craft
  const selectedArt = dbRates.find(
    (item) => item.description === selections.artAndCrafts,
  );

  computedAmounts.artAndCrafts = selectedArt
    ? Number(selectedArt.sqft) > 0
      ? Number(selectedArt.sqft) * carpetArea
      : Number(selectedArt.total_cost)
    : 0;

  const additionalCapex =
    YES_NO_ITEMS.reduce((sum, { key }) => sum + getEffectiveAmount(key), 0) +
    (selections.artAndCrafts ? computedAmounts.artAndCrafts || 0 : 0) +
    (parseFloat(sectionAdditionalCost) || 0);

  const totalCapex = interiors + (parseFloat(itEquipment) || 0) + additionalCapex;
  const ratePerSqft = carpetArea > 0 ? totalCapex / carpetArea : 0;
  const isFormComplete = [
    ...YES_NO_ITEMS.map(({ key }) => key),
    "artAndCrafts",
  ].every((key) => {
    if (selections[key] === "") return false;
    if (
      selections[key] === "Enter Custom Value" &&
      !(parseFloat(userEnteredAmounts[key]) > 0)
    )
      return false;
    return true;
  });

  const handleSave = async () => {
    setIsSaving(true);

    const payloadSelections = { ...selections };
    // Art & Crafts amount must be keyed by its DB column name (Type 1 vs
    // Type 2 & 3), same as payloadSelections below — computedAmounts.artAndCrafts
    // alone doesn't match what the backend looks up, so it always saved as 0.
    const payloadComputedAmounts = { ...computedAmounts };

    if (payloadSelections.artAndCrafts) {
      payloadComputedAmounts[payloadSelections.artAndCrafts] =
        computedAmounts.artAndCrafts;

      payloadSelections[payloadSelections.artAndCrafts] =
        payloadSelections.artAndCrafts;

      delete payloadSelections.artAndCrafts;
    }

    const payload = {
      roiid: storeData?.roiid,
      storeData,
      selections: payloadSelections,
      computedAmounts: payloadComputedAmounts,
      interiors,
      itEquipment,
      additionalCapex,
      additionalCapexDescription: additionalCostDescription,
      totalCapex,
      ratePerSqft,
    };

    try {
      const res = await fetch(`${BASE_URL}/expense_planning_page1`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error("Save failed");
      }

      const data = await res.json();

      toast.success(data.message || "Capex data saved successfully!");

      setSubpage4_1Data(payload);
      setIsSaved(true);
      setIsEditing(false);
      markStepSaved(0);
      setShowModal(true);
    } catch (err) {
      console.error(err);

      toast.error(err.message || "Failed to save Capex data");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className='flex items-center justify-center min-h-[300px]'>
        <p className='text-gray-500 text-lg animate-pulse'>
          Loading Capex data…
        </p>
      </div>
    );
  }

  return (
      <div className='p-6 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen'>
      {/* Header */}
      <div className='mb-8'>
          <h2 className='text-xl font-bold text-gray-800 mb-1'>
          Stage 1 — Capex Planning
        </h2>
        <p className='text-gray-500 text-sm'>
          Review store-linked data and configure additional capital expenditure
          items
        </p>
      </div>

      {/* Store Reference Banner */}
      <div className='bg-white rounded-lg shadow-sm border border-amber-200 p-4 mb-6 grid grid-cols-2 md:grid-cols-4 gap-4'>
        {[
          { label: "Flooring Type", value: storeData?.flooring_type ?? "—" },
          { label: "Property Nature", value: storeData?.store_type ?? "—" },
          {
            label: "Carpet Area (sqft)",
            value: fmt(carpetArea),
          },
        ].map(({ label, value }) => (
          <div key={label} className='text-center'>
            <p className='text-xs font-semibold text-gray-500 uppercase tracking-wide'>
              {label}
            </p>
            <p className='text-lg font-bold text-gray-800 mt-1'>{value}</p>
          </div>
        ))}
      </div>

      {/* Capex Table */}
      <div className='bg-white rounded-xl shadow-lg overflow-x-auto'>
        <table className='min-w-full border-collapse'>
          <thead>
            <tr className='bg-[#233044] text-white text-sm font-semibold'>
              <th className='border border-[#1a2535] px-4 py-3 text-left min-w-[260px]'>
                Capex Item
              </th>
              <th className='border border-[#1a2535] px-4 py-3 text-center min-w-[160px]'>
                Selection
              </th>
              <th className='border border-[#1a2535] px-4 py-3 text-center min-w-[160px]'>
                Amount (₹)
              </th>
              <th className='border border-[#1a2535] px-4 py-3 text-left min-w-[220px]'>
                Basis
              </th>
            </tr>
          </thead>
          <tbody>
            {/* Read-only rows from DB / Screen 2 */}
            {/* <ReadOnlyRow
                            label="Flooring Type"
                            value={storeData?.flooring_type ?? "—"}
                            note="From Screen 2 — Store Type"
                        />
                        <ReadOnlyRow
                            label="Property Nature"
                            value={storeData?.store_type ?? "—"}
                            note="From Screen 2 — Store Type"
                        />
                        <ReadOnlyRow
                            label="Square Foot — Carpet Area"
                            value={storeData?.existing_retail_area}
                            note="From Screen 2 — Retail Area"
                        /> */}
            <ReadOnlyRow label='Interiors' value={interiors} note='From DB' />

            {/* Yes/No rows */}
            {YES_NO_ITEMS.map(({ key, label }) => (
              <YesNoRow
                key={key}
                label={label}
                fieldKey={key}
                value={selections[key]}
                onChange={handleChange}
                computedValue={computedAmounts[key]}
                disabled={isSaved && !isEditing}
                userValue={userEnteredAmounts[key]}
                onUserValueChange={handleUserValueChange}
              />
            ))}

            {/* Art and Crafts — dropdown from DB */}
            <DropdownRow
              label='Art and Crafts'
              fieldKey='artAndCrafts'
              value={selections.artAndCrafts}
              onChange={handleChange}
              options={artOptions}
              computedValue={computedAmounts.artAndCrafts}
              disabled={isSaved && !isEditing}
            />

            {/* IT (Equipments and Installation) — editable, capped at ₹25 lakh */}
            <EditableAmountRow
              label='IT (Equipments and Installation)'
              value={itEquipment}
              onChange={handleItEquipmentChange}
              max={IT_EQUIPMENT_MAX}
              disabled={isSaved && !isEditing}
              note='Editable — capped at ₹25,00,000'
            />

            {/* Additional Cost — editable section before Total Capex */}
            <tr className='bg-indigo-50'>
              <td className='border border-indigo-200 px-4 py-3 text-sm font-semibold text-indigo-800'>
                Additional Cost
              </td>
              <td className='border border-indigo-200 px-4 py-3 bg-indigo-100 space-y-2'>
                <input
                  type='number'
                  min={0}
                  value={sectionAdditionalCost}
                  onChange={(e) => setSectionAdditionalCost(e.target.value)}
                  disabled={isSaved && !isEditing}
                  placeholder='₹ Enter amount'
                  className={`w-full px-2 py-1.5 border border-indigo-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 ${
                    isSaved && !isEditing
                      ? 'bg-gray-100 cursor-not-allowed text-gray-500'
                      : 'bg-white'
                  }`}
                />
                {/* Description box appears once an amount is entered */}
                {parseFloat(sectionAdditionalCost) > 0 && (
                  <textarea
                    rows={2}
                    value={additionalCostDescription}
                    onChange={(e) => setAdditionalCostDescription(e.target.value)}
                    disabled={isSaved && !isEditing}
                    placeholder='Specify reason for this additional cost…'
                    className={`w-full px-2 py-1.5 border border-indigo-300 rounded text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400 ${
                      isSaved && !isEditing
                        ? 'bg-gray-100 cursor-not-allowed text-gray-500'
                        : 'bg-white'
                    }`}
                  />
                )}
              </td>
              <td className='border border-indigo-200 px-4 py-3 text-sm font-bold text-right text-indigo-800 bg-amber-50'>
                {sectionAdditionalCost
                  ? `₹ ${fmt(parseFloat(sectionAdditionalCost) || 0)}`
                  : '—'}
              </td>
              <td className='border border-indigo-200 px-4 py-3 text-xs text-gray-400 italic bg-white'>
                Any other additional capex not covered above
              </td>
            </tr>

            {/* Total Capex */}
            <tr className='bg-amber-100 font-bold'>
              <td className='border border-amber-300 px-4 py-3 text-sm text-gray-800'>
                Total Capex
              </td>
              <td className='border border-amber-300 px-4 py-3 text-center text-gray-500'>
                —
              </td>
              <td className='border border-amber-300 px-4 py-3 text-right text-base font-extrabold text-amber-800'>
                ₹ {fmt(totalCapex)}
              </td>
              <td className='border border-amber-300 px-4 py-3 text-xs italic text-gray-500'>
                Interiors + IT + Additional Items
              </td>
            </tr>

            {/* Rate / Sqft */}
            <tr className='bg-orange-50 font-bold'>
              <td className='border border-amber-300 px-4 py-3 text-sm text-gray-800'>
                Rate / Sqft
              </td>
              <td className='border border-amber-300 px-4 py-3 text-center text-gray-500'>
                —
              </td>
              <td className='border border-amber-300 px-4 py-3 text-right text-base font-extrabold text-orange-700'>
                ₹ {fmt(ratePerSqft)}
              </td>
              <td className='border border-amber-300 px-4 py-3 text-xs italic text-gray-500'>
                Total Capex ÷ Carpet Area
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Validation hint */}
      {!isFormComplete && (
        <div className='mt-4 bg-yellow-100 border-l-4 border-yellow-500 p-4 rounded-lg text-sm text-yellow-800'>
          Please select a value for all capex items before saving.
        </div>
      )}

      {/* Navigation */}
      <div className='flex justify-start gap-4 mt-8'>
        {!isSaved || isEditing ? (
          <button
            type='button'
            disabled={!isFormComplete || isSaving}
            onClick={handleSave}
            className={`font-semibold px-8 py-3 rounded-lg shadow-lg transition transform ${
              isFormComplete && !isSaving
                ? "bg-amber-600 hover:bg-amber-700 text-white hover:scale-105 cursor-pointer"
                : "bg-gray-400 text-gray-200 cursor-not-allowed"
            }`}>
            {isSaving ? "Saving…" : "Save"}
          </button>
        ) : (
          <>
            <button
              type='button'
              onClick={() => setIsEditing(true)}
              className='px-6 py-3 bg-white text-amber-700 border border-amber-300 rounded-lg font-semibold text-sm hover:bg-amber-50 transition'>
              ✎ Edit
            </button>
            <button
              type='button'
              onClick={handleNext}
              className='bg-amber-600 hover:bg-amber-700 text-white font-semibold px-8 py-3 rounded-lg shadow-lg transition transform hover:scale-105 cursor-pointer'>
              Next →
            </button>
          </>
        )}
      </div>

      {/* ── Summary Modal ───────────────────────────────────── */}
      {showModal && (
        <div className='fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4'>
          <div className='bg-white rounded-2xl shadow-2xl w-full max-w-md'>
            <div className='bg-gradient-to-r from-amber-500 to-orange-600 px-8 py-6 rounded-t-2xl'>
              <div className='flex items-center gap-3'>
                <span className='text-3xl'>✅</span>
                <div>
                  <h2 className='text-xl font-bold text-white'>Capex Saved</h2>
                  <p className='text-orange-100 text-sm mt-0.5'>
                    Stage 1 of Expense Planning complete
                  </p>
                </div>
              </div>
            </div>
            <div className='p-8 space-y-3'>
              <div className='grid grid-cols-2 gap-3'>
                <div className='bg-gray-50 rounded-lg px-4 py-3'>
                  <p className='text-xs text-gray-400 uppercase tracking-wide font-medium'>
                    Total Capex
                  </p>
                  <p className='text-gray-800 font-semibold mt-0.5'>
                    ₹ {fmt(totalCapex)}
                  </p>
                </div>
                <div className='bg-gray-50 rounded-lg px-4 py-3'>
                  <p className='text-xs text-gray-400 uppercase tracking-wide font-medium'>
                    Rate / Sqft
                  </p>
                  <p className='text-gray-800 font-semibold mt-0.5'>
                    ₹ {fmt(ratePerSqft)}
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
                className='px-8 py-3 bg-amber-600 text-white rounded-xl font-semibold text-sm hover:bg-amber-700 transition'>
                Proceed to Salaries & Expenses →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
