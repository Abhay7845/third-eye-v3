import { useEffect, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Input, Select } from "../FormControl";
import { toast } from "react-toastify";
import { BASE_URL } from "./data/baseUrl";
import { useSelector } from "react-redux";

const Section = ({ title, completed, children, isExpanded, onToggle }) => (
  <div
    className={`rounded-lg border transition-all ${
      isExpanded
        ? "border-blue-500 shadow-md bg-white"
        : completed
        ? "border-green-500 bg-green-50"
        : "border-gray-200 bg-gray-50"
    }`}>
    <div
      onClick={onToggle}
      className='flex items-center justify-between px-8 py-5 border-b bg-gradient-to-r from-gray-50 to-white cursor-pointer hover:bg-gray-100 transition'>
      <div className='flex items-center gap-3'>
        <span className='text-lg'>{isExpanded ? "▼" : "▶"}</span>
        <h3 className='font-semibold text-lg text-gray-800'>{title}</h3>
      </div>
      {completed && !isExpanded && (
        <span className='text-green-600 font-medium text-sm bg-green-100 px-3 py-1 rounded-full'>
          ✓ Completed
        </span>
      )}
    </div>
    {isExpanded && (
      <div className='p-8'>
        <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'>
          {children}
        </div>
      </div>
    )}
  </div>
);

export default function StoreRetailSpecifications({
  onNext,
  onPrevious,
  roiContext,
}) {
  const projectType = roiContext?.projectType ?? "";
  const isNewStore = projectType === "New Store";
  const isRenovation = projectType === "Renovation";

  const {
    control,
    register,
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm({
    mode: "onBlur",
    defaultValues: {
      storeType: "",
      existingOverallArea: "",
      existingRetailArea: "",
      newOverallArea: "",
      newRetailArea: "",
      noOfFloors: "",
      floorPlate: { GF: "", FF: "", SF: "", TF: "" },
      frontage: "10",
      ceilingHeight: "15",
      facadeLed: "",
      terraceBranding: "",
      totemPole: "",
      displayType: "",
      flooringType: "",
      retailFloors: [],
      cashierCount: "1",
      karatmeterCount: "1",
      strongRoom: "1",
      franchiseRoom: "1",
      managerRoom: "1",
      conferenceRoom: "1",
      pvrRoom: "1",
      additionalWorkstation: "1",
      regionalServiceCentre: "",
      remarks: "",
    },
  });

  const [isSaved, setIsSaved] = useState(false);
  const [showRemarks, setShowRemarks] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [savedSummary, setSavedSummary] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    spec: true,
    arch: false,
  });
  const [storeTypes, setStoreTypes] = useState([]);
  const [flooringTypes, setFlooringTypes] = useState([]);
  const [displayTypes, setDisplayTypes] = useState([]);

  const prevFloorPlateRef = useRef({});
  const userLog = useSelector((state) => state?.user?.user);
  const selectedStoreType = useWatch({ control, name: "storeType" });
  const existingRetailArea = useWatch({ control, name: "existingRetailArea" });
  const newOverallArea = useWatch({ control, name: "newOverallArea" });
  const newRetailArea = useWatch({ control, name: "newRetailArea" });
  const noOfFloors = Number(useWatch({ control, name: "noOfFloors" }) || 0);
  const floorPlateData = useWatch({ control, name: "floorPlate" });
  const selectedFlooringType = useWatch({ control, name: "flooringType" });
  const cashierCount = useWatch({ control, name: "cashierCount" });
  const karatmeterCount = useWatch({ control, name: "karatmeterCount" });
  const strongRoom = useWatch({ control, name: "strongRoom" });
  const franchiseRoom = useWatch({ control, name: "franchiseRoom" });
  const managerRoom = useWatch({ control, name: "managerRoom" });
  const conferenceRoom = useWatch({ control, name: "conferenceRoom" });
  const pvrRoom = useWatch({ control, name: "pvrRoom" });
  const additionalWorkstation = useWatch({
    control,
    name: "additionalWorkstation",
  });
  const regionalServiceCentre = useWatch({
    control,
    name: "regionalServiceCentre",
  });
  const remarks = useWatch({ control, name: "remarks" });

  const floorOptions = [];
  if (noOfFloors >= 1) floorOptions.push("GF");
  if (noOfFloors >= 2) floorOptions.push("FF");
  if (noOfFloors >= 3) floorOptions.push("SF");
  if (noOfFloors >= 4) floorOptions.push("TF");

  const STORE_TYPE_MAP = {
    standalone_store: "Mall Store",
  };

  const formatStoreType = (raw) => {
    if (!raw) return raw;
    return (
      STORE_TYPE_MAP[raw] ??
      raw.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    );
  };

  useEffect(() => {
    if (!roiContext) return;
    if (roiContext.storeType)
      setValue("storeType", formatStoreType(roiContext.storeType));
    if (!isNewStore && roiContext.existingRetailArea)
      setValue("existingRetailArea", String(roiContext.existingRetailArea));
    if (isNewStore && roiContext.historyRetailArea)
      setValue("newRetailArea", String(roiContext.historyRetailArea));
  }, [roiContext, isNewStore, setValue]);

  useEffect(() => {
    if (
      !isNewStore &&
      newRetailArea &&
      newOverallArea &&
      Number(newRetailArea) > Number(newOverallArea)
    ) {
      toast.error(
        "New Retail Area cannot exceed New Overall Area. Field has been reset.",
      );
      setValue("newRetailArea", "");
    }
  }, [newRetailArea, newOverallArea, setValue]);

  useEffect(() => {
    fetchAttribute("store_type");
    fetchAttribute("flooring_type");
    fetchAttribute("display_type");
  }, []);

  const fetchAttribute = async (parameter) => {
    try {
      const res = await fetch(`${BASE_URL}/attribute/${parameter}`);
      if (!res.ok) {
        toast.error(`Failed to load ${parameter.replace(/_/g, " ")} options.`);
        return;
      }
      const response = await res.json();
      if (parameter === "store_type") setStoreTypes(response.data);
      if (parameter === "flooring_type") setFlooringTypes(response.data);
      if (parameter === "display_type") setDisplayTypes(response.data);
    } catch (error) {
      console.error(error);
      toast.error(`Failed to load ${parameter.replace(/_/g, " ")} options.`);
    }
  };

  const totalFloorArea = floorOptions.reduce(
    (sum, floor) => sum + Number(floorPlateData?.[floor] || 0),
    0,
  );

  const allFloorsFilled =
    floorOptions.length > 0 &&
    floorOptions.every((floor) => !!floorPlateData?.[floor]) &&
    totalFloorArea === Number(newRetailArea);

  const isRetailAreaTooLow =
    isNewStore &&
    !!roiContext?.historyRetailArea &&
    Number(roiContext.historyRetailArea) < 2500;

  const specCompleted = (() => {
    if (isRetailAreaTooLow) return false;
    if (!selectedStoreType || !noOfFloors || !allFloorsFilled) return false;
    if (isNewStore) return !!newOverallArea && !!newRetailArea;
    if (isRenovation) return !!existingRetailArea && !!newRetailArea;
    // Relocation / Store Expansion
    return !!existingRetailArea && !!newOverallArea && !!newRetailArea;
  })();

  useEffect(() => {
    if (!newRetailArea || Number(newRetailArea) <= 0) {
      prevFloorPlateRef.current = { ...floorPlateData };
      return;
    }

    const currentTotal = floorOptions.reduce(
      (sum, floor) => sum + Number(floorPlateData?.[floor] || 0),
      0,
    );

    const changedFloor = floorOptions.find(
      (floor) =>
        String(floorPlateData?.[floor] ?? "") !==
          String(prevFloorPlateRef.current?.[floor] ?? "") &&
        floorPlateData?.[floor] !== "" &&
        floorPlateData?.[floor] !== undefined,
    );

    if (changedFloor && currentTotal > Number(newRetailArea)) {
      setValue(`floorPlate.${changedFloor}`, "");
      toast.warning(
        `${changedFloor} area would exceed New Retail Area (${newRetailArea} sq ft). Field has been reset.`,
      );
    }

    prevFloorPlateRef.current = { ...floorPlateData };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [floorPlateData]);

  const archCompleted =
    !!selectedFlooringType &&
    !!cashierCount &&
    !!karatmeterCount &&
    !!strongRoom &&
    !!franchiseRoom &&
    !!managerRoom &&
    !!conferenceRoom &&
    !!pvrRoom &&
    !!additionalWorkstation &&
    !!regionalServiceCentre;

  useEffect(() => {
    if (specCompleted)
      setExpandedSections((prev) => ({ ...prev, spec: false, arch: true }));
  }, [specCompleted]);

  useEffect(() => {
    if (archCompleted)
      setExpandedSections((prev) => ({ ...prev, arch: false }));
  }, [archCompleted]);

  const onSubmitSpecifications = async (data) => {
    try {
      const payload = {
        username: userLog?.username?.split("@")[0],
        roiId: roiContext?.roiId,
        tyHistoryId: roiContext?.historyId,
        storeType: data.storeType,
        existingOverallArea: data.existingOverallArea,
        existingRetailArea: data.existingRetailArea,
        newOverallArea: data.newOverallArea,
        newRetailArea: data.newRetailArea,
        noOfFloors: data.noOfFloors,
        floorPlate: data.floorPlate,
        frontage: data.frontage,
        ceilingHeight: data.ceilingHeight,
        facadeLed: data.facadeLed,
        terraceBranding: data.terraceBranding,
        totemPole: data.totemPole,
        displayType: data.displayType,
        flooringType: data.flooringType,
        retailFloors: data.retailFloors,
        cashierCount: data.cashierCount,
        karatmeterCount: data.karatmeterCount,
        strongRoom: data.strongRoom,
        franchiseRoom: data.franchiseRoom,
        managerRoom: data.managerRoom,
        conferenceRoom: data.conferenceRoom,
        pvrRoom: data.pvrRoom,
        additionalWorkstation: data.additionalWorkstation,
        regionalServiceCentre: data.regionalServiceCentre,
        remarks: data.remarks,
      };

      const res = await fetch(`${BASE_URL}/store-retail-spec`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        toast.error(
          errData?.detail ?? "Failed to save specifications. Please try again.",
        );
        return;
      }

      setIsSaved(true);
      setSavedSummary(payload);
      setExpandedSections((prev) => ({ ...prev, arch: false }));
      setShowSummaryModal(true);
    } catch (error) {
      console.error(error);
      toast.error("An unexpected error occurred. Please try again.");
    }
  };

  return (
    <div className='space-y-8 p-8'>
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
            {roiContext.existingStoreCode && (
              <>
                <span className='text-gray-300'>|</span>
                <span className='text-gray-600'>
                  Store:{" "}
                  <strong className='text-gray-800'>
                    {roiContext.existingStoreCode}
                  </strong>
                </span>
              </>
            )}
          </div>
        </div>
      )}

      {/* SECTION 1: Store Specification */}
      <Section
        title='🏪 Store Specification Details'
        completed={specCompleted}
        isExpanded={expandedSections.spec}
        onToggle={() =>
          setExpandedSections((prev) => ({ ...prev, spec: !prev.spec }))
        }>
        {/* Store Type */}
        {isNewStore && roiContext?.storeType ? (
          <Input
            label='Store Type'
            name='storeType'
            register={register}
            disabled
          />
        ) : (
          <>
            <Select
              label='Store Type *'
              name='storeType'
              register={register}
              rules={{ required: "Store Type is required" }}>
              <option value=''>Select</option>
              {storeTypes?.map((it) => {
                if (!it.store_type) return null;
                const mappedValue = formatStoreType(it.store_type);
                return (
                  <option key={it.store_type} value={mappedValue}>
                    {mappedValue}
                  </option>
                );
              })}
            </Select>
            {errors?.storeType && (
              <p className='text-red-500 text-xs mt-1'>
                {errors.storeType.message}
              </p>
            )}
          </>
        )}

        {/* Existing areas — non-New Store */}
        {!isNewStore && (
          <>
            <div>
              <Input
                label='Existing Overall Area SBA (enter if available)'
                name='existingOverallArea'
                type='number'
                register={register}
                rules={{
                  validate: (v) =>
                    !v ||
                    Number(v) > 3000 ||
                    "Existing Overall Area SBA must be greater than 3000",
                }}
              />
              <p className='text-gray-400 text-xs mt-1'>
                If entered, must be greater than 3000 sq ft
              </p>
              {errors?.existingOverallArea && (
                <p className='text-red-500 text-xs mt-1'>
                  {errors.existingOverallArea.message}
                </p>
              )}
            </div>
            <Input
              label='Existing Retail Area'
              name='existingRetailArea'
              type='number'
              register={register}
              disabled={!!roiContext?.existingRetailArea}
            />
          </>
        )}

        {/* New Overall Area — New Store & Relocation/Expansion */}
        {!isRenovation && (
          <>
            <div>
              <Input
                label='New Overall Area SBA *'
                name='newOverallArea'
                type='number'
                register={register}
                rules={{
                  required: "New Overall Area is required",
                  validate: (v) =>
                    Number(v) > 3000 ||
                    "New Overall Area SBA must be more than 3000",
                }}
              />
              <p className='text-gray-400 text-xs mt-1'>
                Must be greater than 3000 sq ft
              </p>
              {errors?.newOverallArea && (
                <p className='text-red-500 text-xs mt-1'>
                  {errors.newOverallArea.message}
                </p>
              )}
            </div>
          </>
        )}

        {/* New Retail Area — all types */}
        <>
          <Input
            label={`New Retail Area *${
              isNewStore && roiContext?.historyRetailArea
                ? " (from History ID)"
                : ""
            }`}
            name='newRetailArea'
            type='number'
            register={register}
            rules={{ required: "New Retail Area is required" }}
            disabled={isNewStore && !!roiContext?.historyRetailArea}
          />
          {errors?.newRetailArea && (
            <p className='text-red-500 text-xs mt-1'>
              {errors.newRetailArea.message}
            </p>
          )}
          {isRetailAreaTooLow && (
            <div className='xl:col-span-3 mt-2'>
              <div className='flex items-start gap-3 bg-amber-50 border border-amber-400 rounded-xl px-5 py-4'>
                <span className='text-amber-500 text-xl mt-0.5'>⚠️</span>
                <div>
                  <p className='font-semibold text-amber-800 text-sm'>
                    New Retail Area too low ({roiContext.historyRetailArea} sq
                    ft)
                  </p>
                  <p className='text-amber-700 text-sm mt-1'>
                    The retail area from History ID must be at least{" "}
                    <strong>2500 sq ft</strong> to proceed. Please update the
                    retail area in <strong>Third Eye History ID</strong> and
                    reload the form.
                  </p>
                </div>
              </div>
            </div>
          )}
        </>

        {/* Number of Floors for Retail */}
        <>
          <Select
            label='Number of Floors for Retail *'
            name='noOfFloors'
            register={register}
            rules={{ required: "Number of Floors is required" }}>
            <option value=''>Select</option>
            <option value='1'>GF Only</option>
            <option value='2'>GF + FF</option>
            <option value='3'>GF + FF + SF</option>
            <option value='4'>GF + FF + SF + TF</option>
          </Select>
          {errors?.noOfFloors && (
            <p className='text-red-500 text-xs mt-1'>
              {errors.noOfFloors.message}
            </p>
          )}
        </>

        {/* Dynamic Floor Plate */}
        {noOfFloors > 0 && (
          <div className='xl:col-span-3'>
            <label className='block font-medium text-gray-800 mb-4'>
              Floor Plate Details *
            </label>
            <div className='grid md:grid-cols-4 gap-5'>
              {floorOptions.map((floor) => (
                <Input
                  key={floor}
                  label={`${floor} Area *`}
                  name={`floorPlate.${floor}`}
                  type='number'
                  register={register}
                  rules={{ required: `${floor} Area is required` }}
                />
              ))}
            </div>
          </div>
        )}
      </Section>

      {/* SECTION 2: Architecture */}
      <Section
        title='🏗️ Store Architecture Details'
        completed={archCompleted}
        isExpanded={expandedSections.arch}
        onToggle={() =>
          setExpandedSections((prev) => ({ ...prev, arch: !prev.arch }))
        }>
        <Input
          label='Frontage'
          name='frontage'
          type='number'
          register={register}
        />
        <Input
          label='Ceiling Height'
          name='ceilingHeight'
          type='number'
          register={register}
        />

        {[
          ["facadeLed", "Facade LED Screen Required"],
          ["terraceBranding", "Terrace Branding Needed"],
          ["totemPole", "Totem Pole Space Available"],
        ].map(([name, label]) => (
          <Select key={name} label={label} name={name} register={register}>
            <option value=''>Select</option>
            <option value='Yes'>Yes</option>
            <option value='No'>No</option>
          </Select>
        ))}

        <Select label='Display Type' name='displayType' register={register}>
          <option value=''>Select</option>
          {displayTypes?.map((it) =>
            it.display_type ? (
              <option key={it.display_type} value={it.display_type}>
                {it.display_type}
              </option>
            ) : null,
          )}
        </Select>

        <>
          <Select
            label='Flooring Type *'
            name='flooringType'
            register={register}
            rules={{ required: "Flooring Type is required" }}>
            <option value=''>Select</option>
            {flooringTypes?.map((it) =>
              it.flooring_type ? (
                <option key={it.flooring_type} value={it.flooring_type}>
                  {it.flooring_type}
                </option>
              ) : null,
            )}
          </Select>
          {errors?.flooringType && (
            <p className='text-red-500 text-xs mt-1'>
              {errors.flooringType.message}
            </p>
          )}
        </>

        {floorOptions.length > 0 && (
          <div className='xl:col-span-3'>
            <label className='block font-medium text-gray-800 mb-4'>
              Number of Floors for Facade
            </label>
            <div className='flex flex-wrap gap-6'>
              {floorOptions.map((floor) => (
                <label
                  key={floor}
                  className='flex items-center gap-3 cursor-pointer'>
                  <input
                    type='checkbox'
                    value={floor}
                    {...register("retailFloors")}
                    className='w-4 h-4 rounded border-gray-300 text-blue-600'
                  />
                  <span className='text-gray-700 font-medium'>{floor}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {[
          ["cashierCount", "Number of Cashier"],
          ["karatmeterCount", "Number of Karatmeter"],
          ["strongRoom", "Strong Room"],
          ["franchiseRoom", "Franchise Room"],
          ["managerRoom", "Manager Room"],
          ["conferenceRoom", "Conference Room"],
          ["pvrRoom", "PVR Room"],
          ["additionalWorkstation", "Additional Workstation"],
        ].map(([name, label]) => (
          <Input
            key={name}
            label={`${label} *`}
            name={name}
            type='number'
            register={register}
            rules={{
              required: `${label} is required`,
              min: { value: 0, message: "Cannot be negative" },
            }}
          />
        ))}

        <>
          <Select
            label='Regional Service Centre *'
            name='regionalServiceCentre'
            register={register}
            rules={{ required: "Regional Service Centre is required" }}>
            <option value=''>Select</option>
            <option value='Yes'>Yes</option>
            <option value='No'>No</option>
          </Select>
          {errors?.regionalServiceCentre && (
            <p className='text-red-500 text-xs mt-1'>
              {errors.regionalServiceCentre.message}
            </p>
          )}
        </>

        <div className='xl:col-span-3'>
          {!showRemarks ? (
            <div className='rounded-lg border-2 border-dashed border-gray-300 bg-white p-6 text-center'>
              <p className='text-sm text-gray-600 mb-4'>Want to add remarks?</p>
              <button
                type='button'
                onClick={() => setShowRemarks(true)}
                className='px-5 py-2 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 transition'>
                Yes, Add Remarks
              </button>
            </div>
          ) : (
            <div className='rounded-lg border border-blue-200 bg-white p-6'>
              <div className='flex items-center justify-between mb-3'>
                <label className='font-medium text-gray-800 text-sm'>
                  Remarks
                </label>
                <button
                  type='button'
                  onClick={() => {
                    setShowRemarks(false);
                    setValue("remarks", "");
                  }}
                  className='text-gray-400 hover:text-gray-600 text-lg font-bold transition'>
                  ✕
                </button>
              </div>
              <textarea
                {...register("remarks", {
                  maxLength: { value: 200, message: "Max 200 characters" },
                })}
                rows={3}
                maxLength={200}
                className='w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition resize-none'
                placeholder='Add notes...'
              />
              <span
                className={`text-xs font-medium mt-2 block ${
                  (remarks?.length ?? 0) > 180
                    ? "text-red-600"
                    : "text-gray-500"
                }`}>
                {remarks?.length ?? 0}/200
              </span>
            </div>
          )}
        </div>
      </Section>

      {/* FOOTER */}
      {specCompleted && archCompleted && !isSaved && (
        <div className='flex gap-3 justify-end px-8 py-6 bg-gray-50 rounded-lg border border-gray-200 mt-8'>
          <button
            type='button'
            onClick={onPrevious}
            className='px-6 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg font-medium hover:bg-gray-100 transition'>
            ← Previous
          </button>
          <button
            type='button'
            onClick={handleSubmit(onSubmitSpecifications)}
            className='px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition'>
            Save Details
          </button>
        </div>
      )}

      {/* SUMMARY MODAL */}
      {showSummaryModal && savedSummary && (
        <div className='fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4'>
          <div className='bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto'>
            {/* Modal Header */}
            <div className='bg-gradient-to-r from-green-500 to-emerald-600 px-8 py-6 rounded-t-2xl'>
              <div className='flex items-center gap-3'>
                <span className='text-3xl'>✅</span>
                <div>
                  <h2 className='text-xl font-bold text-white'>
                    Store Specifications Saved
                  </h2>
                  <p className='text-green-100 text-sm mt-0.5'>
                    Retail specifications saved successfully
                  </p>
                </div>
              </div>
              <div className='mt-4 bg-white/20 rounded-xl px-5 py-3 inline-flex items-center gap-3'>
                <span className='text-white/80 text-sm font-medium'>
                  ROI ID
                </span>
                <span className='text-white font-bold text-lg tracking-widest'>
                  {roiContext?.roiId ?? "—"}
                </span>
              </div>
            </div>

            {/* Modal Body */}
            <div className='p-8 space-y-4'>
              <h3 className='text-sm font-semibold text-gray-500 uppercase tracking-wide'>
                Summary
              </h3>
              <div className='grid grid-cols-2 gap-3'>
                {[
                  ["Store Type", savedSummary.storeType],
                  !isNewStore &&
                    savedSummary.existingRetailArea && [
                      "Existing Retail Area",
                      savedSummary.existingRetailArea,
                    ],
                  !isNewStore &&
                    savedSummary.existingOverallArea && [
                      "Existing Overall Area",
                      savedSummary.existingOverallArea,
                    ],
                  !isRenovation &&
                    savedSummary.newOverallArea && [
                      "New Overall Area (SBA)",
                      savedSummary.newOverallArea,
                    ],
                  ["New Retail Area", savedSummary.newRetailArea],
                  ["No. of Floors", savedSummary.noOfFloors],
                  savedSummary.flooringType && [
                    "Flooring Type",
                    savedSummary.flooringType,
                  ],
                  savedSummary.displayType && [
                    "Display Type",
                    savedSummary.displayType,
                  ],
                  savedSummary.facadeLed && [
                    "Facade LED",
                    savedSummary.facadeLed,
                  ],
                  savedSummary.cashierCount && [
                    "Cashiers",
                    savedSummary.cashierCount,
                  ],
                  savedSummary.karatmeterCount && [
                    "Karatmeters",
                    savedSummary.karatmeterCount,
                  ],
                  [
                    "Regional Service Centre",
                    savedSummary.regionalServiceCentre,
                  ],
                  savedSummary.remarks && ["Remarks", savedSummary.remarks],
                ]
                  .filter(Boolean)
                  .map(([label, value]) =>
                    value ? (
                      <div
                        key={label}
                        className='bg-gray-50 rounded-lg px-4 py-3'>
                        <p className='text-xs text-gray-400 uppercase tracking-wide font-medium'>
                          {label}
                        </p>
                        <p className='text-gray-800 font-semibold mt-0.5 text-sm'>
                          {value}
                        </p>
                      </div>
                    ) : null,
                  )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className='px-8 pb-8 flex justify-between items-center'>
              {/* <button
                type="button"
                onClick={onPrevious}
                className="px-5 py-2 bg-white text-gray-600 border border-gray-300 rounded-lg font-medium text-sm hover:bg-gray-100 transition"
              >
                ← Previous
              </button> */}
              <button
                type='button'
                onClick={() => {
                  setShowSummaryModal(false);
                  onNext();
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
