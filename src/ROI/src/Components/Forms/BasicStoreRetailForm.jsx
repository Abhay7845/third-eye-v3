import { useEffect, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Input, Select } from "../FormControl";
import { BASE_URL } from "./data/baseUrl";
import { useSelector } from "react-redux";

const Section = ({
  title,
  completed,
  active,
  children,
  isExpanded,
  onToggle,
}) => (
  <div
    className={`
      rounded-lg border transition-all
      ${
        active || isExpanded
          ? "border-blue-500 shadow-md bg-white"
          : completed
          ? "border-green-500 bg-green-50"
          : "border-gray-200 bg-gray-50"
      }
    `}>
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

export default function BasicStoreDetails({ onNext, roiContext }) {
  const {
    control,
    register,
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      projectType: "",
      historyId: "",
      existingStoreCode: "",
      city: "",
      state: "",
      region: "",
      newCity: "",
      existingStoreFormat: "",
      storeFormatChange: "",
      newStoreFormat: "",
      newFranchise: "",
      newFranchiseeStoreName: "",
      newFranchiseeStoreCode: "",
      retailArea: "",
      storeType: "",
      historyRetailArea: "",
      franchiseeStoreCode: "",
      franchiseeStoreName: "",
      baiatScore: "",
      partnerDbStatus: "",
      partnerScore: "",
    },
  });

  const userLog = useSelector((state) => state?.user?.user);

  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [savedSummary, setSavedSummary] = useState(null);
  const [storeFound, setStoreFound] = useState(false);
  const [franchiseeFound, setFranchiseeFound] = useState(false);
  const [storeFormats, setStoreFormats] = useState([]);
  const [projectTypes, setProjectTypes] = useState([]);
  const [historyIds, setHistoryIds] = useState([]);
  const [btqStores, setBtqStores] = useState([]);
  const [refStoreCode, setRefStoreCode] = useState("");
  const [isEditingLocked, setIsEditingLocked] = useState(false);
  const [isLoadingExisting, setIsLoadingExisting] = useState(false);
  // Consumed once by the corresponding destructive reset effect so that
  // programmatic prefill (editing an existing ROI) doesn't immediately wipe
  // the very values it just set.
  const skipProjectTypeResetRef = useRef(false);
  const skipFranchiseeResetRef = useRef(false);
  const [expandedSections, setExpandedSections] = useState({
    projectType: true,
    location: false,
    storeFormat: false,
    franchise: false,
  });

  // Watched values
  const selectedProjectType = useWatch({ control, name: "projectType" });
  const historyId = useWatch({ control, name: "historyId" });
  const existingStoreCode = useWatch({ control, name: "existingStoreCode" });
  const city = useWatch({ control, name: "city" });
  const state = useWatch({ control, name: "state" });
  const region = useWatch({ control, name: "region" });
  const existingStoreFormat = useWatch({
    control,
    name: "existingStoreFormat",
  });
  const storeFormatChange = useWatch({ control, name: "storeFormatChange" });
  const selectedNewStoreFormat = useWatch({ control, name: "newStoreFormat" });
  const newFranchise = useWatch({ control, name: "newFranchise" });
  const franchiseeStoreCode = useWatch({
    control,
    name: "franchiseeStoreCode",
  });
  const franchiseeStoreName = useWatch({
    control,
    name: "franchiseeStoreName",
  });
  const newFranchiseeStoreName = useWatch({
    control,
    name: "newFranchiseeStoreName",
  });
  const baiatScore = useWatch({ control, name: "baiatScore" });
  const partnerDbStatus = useWatch({ control, name: "partnerDbStatus" });
  const partnerScore = useWatch({ control, name: "partnerScore" });

  const isNewStore = selectedProjectType === "New Store";
  const isRenovation = selectedProjectType === "Renovation";

  // Effective store format used to decide franchise visibility
  const effectiveStoreFormat = isNewStore
    ? selectedNewStoreFormat
    : storeFormatChange === "Yes"
    ? selectedNewStoreFormat
    : existingStoreFormat;

  // ── Completion flags ────────────────────────────────────────────────────────
  const projectTypeCompleted = !!selectedProjectType;

  const locationCompleted =
    projectTypeCompleted &&
    (isNewStore
      ? !!historyId && !!city && !!state && !!region
      : !!existingStoreCode && !!city && !!state && !!region && storeFound);

  const storeFormatCompleted =
    locationCompleted &&
    (isNewStore
      ? !!selectedNewStoreFormat
      : isRenovation
      ? !!existingStoreFormat
      : !!storeFormatChange &&
        (storeFormatChange === "Yes"
          ? !!selectedNewStoreFormat
          : !!existingStoreFormat));

  const showFranchise =
    storeFormatCompleted &&
    !!effectiveStoreFormat &&
    effectiveStoreFormat !== "L1";

  const franchiseCompleted = showFranchise
    ? !!newFranchise &&
      (newFranchise === "Yes"
        ? !!newFranchiseeStoreName
        : !!franchiseeStoreName && !!franchiseeStoreCode)
    : storeFormatCompleted;

  // ── Auto-advance effects ────────────────────────────────────────────────────
  useEffect(() => {
    if (projectTypeCompleted) {
      setExpandedSections((prev) => ({
        ...prev,
        projectType: false,
        location: true,
      }));
    }
  }, [projectTypeCompleted]);

  useEffect(() => {
    if (locationCompleted) {
      if (isRenovation) {
        setExpandedSections((prev) => ({
          ...prev,
          location: false,
          franchise: showFranchise,
        }));
      } else {
        setExpandedSections((prev) => ({
          ...prev,
          location: false,
          storeFormat: true,
        }));
      }
    }
  }, [locationCompleted, isRenovation, showFranchise]);

  useEffect(() => {
    if (storeFormatCompleted && !isRenovation) {
      setExpandedSections((prev) => ({
        ...prev,
        storeFormat: false,
        franchise: showFranchise,
      }));
    }
  }, [storeFormatCompleted, isRenovation, showFranchise]);

  // ── Reset on project type change ────────────────────────────────────────────
  useEffect(() => {
    if (skipProjectTypeResetRef.current) {
      skipProjectTypeResetRef.current = false;
      return;
    }
    if (selectedProjectType) {
      [
        "historyId",
        "existingStoreCode",
        "city",
        "state",
        "region",
        "newCity",
        "existingStoreFormat",
        "storeFormatChange",
        "newStoreFormat",
        "newFranchise",
        "newFranchiseeStoreName",
        "newFranchiseeStoreCode",
        "franchiseeStoreCode",
        "franchiseeStoreName",
        "baiatScore",
        "partnerDbStatus",
        "partnerScore",
      ].forEach((field) => setValue(field, ""));
      setStoreFound(false);
      setFranchiseeFound(false);
      setIsSaved(false);
      setExpandedSections({
        projectType: false,
        location: true,
        storeFormat: false,
        franchise: false,
      });
    }
  }, [selectedProjectType, setValue]);

  // Auto-populate location fields when a store is selected from the dropdown
  useEffect(() => {
    if (!existingStoreCode) {
      setStoreFound(false);
      setValue("city", "");
      setValue("state", "");
      setValue("region", "");
      setValue("existingStoreFormat", "");
      setValue("retailArea", "");
      setValue("storeType", "");
      return;
    }
    const store = btqStores.find((s) => s.store_code === existingStoreCode);
    if (store) {
      setStoreFound(true);
      setValue("city", store.city ?? "");
      setValue("state", store.state ?? "");
      setValue("region", store.region ?? "");
      setValue("existingStoreFormat", store.existing_store_format ?? "");
      setValue(
        "retailArea",
        store.retail_area != null ? String(store.retail_area) : "",
      );
      setValue("storeType", store.store_type ?? "");
    } else {
      setStoreFound(false);
    }
  }, [existingStoreCode, btqStores, setValue]);

  // Auto-fetch location details when a history ID is selected from the dropdown
  useEffect(() => {
    if (!historyId) {
      setValue("city", "");
      setValue("state", "");
      setValue("region", "");
      setValue("newCity", "");
      return;
    }
    const fetchDetails = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${BASE_URL}/history/${historyId}`);
        if (!res.ok) {
          setValue("city", "");
          setValue("state", "");
          setValue("region", "");
          setValue("newCity", "");
          return;
        }
        const response = await res.json();
        const data = response.data[0];
        setValue("city", data?.target_city ?? "");
        setValue("state", data?.state ?? "");
        setValue("region", data?.region ?? "");
        setValue("newCity", data?.new_city ?? "");
        setValue("storeType", data?.store_type ?? "");
        setValue(
          "historyRetailArea",
          data?.retail_space ? String(data.retail_space) : "",
        );
        setRefStoreCode(data?.storecode);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [historyId, setValue]);

  // Reset franchisee fields when franchisee store code changes
  useEffect(() => {
    if (skipFranchiseeResetRef.current) {
      skipFranchiseeResetRef.current = false;
      return;
    }
    setFranchiseeFound(false);
    setValue("franchiseeStoreName", "");
    setValue("baiatScore", "");
    setValue("partnerDbStatus", "");
    setValue("partnerScore", "");
  }, [franchiseeStoreCode, setValue]);

  // ── Fetch helpers ───────────────────────────────────────────────────────────
  useEffect(() => {
    fetchAttribute("store_format");
    fetchAttribute("project_type");
  }, []);

  // Fetch all history IDs from the backend when New Store is selected
  useEffect(() => {
    if (!isNewStore) {
      setHistoryIds([]);
      return;
    }
    const fetchHistoryIds = async () => {
      try {
        setLoading(true);
        const username = userLog?.name;
        const res = await fetch(`${BASE_URL}/history_id?username=${username}`);
        if (res.ok) {
          const response = await res.json();
          setHistoryIds(response.data ?? []);
        }
      } catch (error) {
        console.error(error);
        alert("Failed to fetch History IDs");
      } finally {
        setLoading(false);
      }
    };
    fetchHistoryIds();
  }, [isNewStore]);

  // Fetch BTQ store list when a non-New Store project type is selected
  useEffect(() => {
    if (!selectedProjectType || selectedProjectType === "New Store") {
      setBtqStores([]);
      return;
    }
    const fetchBtqStores = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${BASE_URL}/btq_details`);
        if (res.ok) {
          const response = await res.json();
          setBtqStores(response.data ?? []);
        }
      } catch (error) {
        console.error(error);
        alert("Failed to fetch store list");
      } finally {
        setLoading(false);
      }
    };
    fetchBtqStores();
  }, [selectedProjectType]);

  const fetchAttribute = async (parameter) => {
    try {
      const res = await fetch(`${BASE_URL}/attribute/${parameter}`);
      if (res.ok) {
        const response = await res.json();
        if (parameter === "store_format") setStoreFormats(response.data);
        if (parameter === "project_type") setProjectTypes(response.data);
      }
    } catch (error) {
      console.error(error);
      alert("Failed to fetch required details");
    }
  };

  const fetchFranchiseeDetails = async () => {
    if (!franchiseeStoreCode?.trim()) {
      alert("Please enter a Franchisee Store Code");
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(`${BASE_URL}/store/${franchiseeStoreCode}`);
      if (!res.ok) {
        setFranchiseeFound(false);
        setValue("franchiseeStoreName", "");
        setValue("baiatScore", "");
        setValue("partnerDbStatus", "");
        setValue("partnerScore", "");
        alert("Franchisee store not found");
        return;
      }
      const response = await res.json();
      const data = response.data;
      setFranchiseeFound(true);
      setValue("franchiseeStoreName", data[0]?.store_name ?? "");
      setValue("baiatScore", data[0]?.baiat_score ?? "");
      setValue("partnerDbStatus", data[0]?.partner_db_status ?? "");
      setValue("partnerScore", data[0]?.partner_score ?? "");
    } catch (error) {
      console.error(error);
      setFranchiseeFound(false);
      alert("Failed to fetch franchisee details");
    } finally {
      setLoading(false);
    }
  };

  // Loads the already-saved Screen 1 record and switches into the editable
  // form — Project Type/History ID (New Store) or Store Code (other types)
  // stay disabled below since they define the ROI and can't change.
  const startEditingExisting = async () => {
    if (!roiContext?.roiId) return;
    setIsLoadingExisting(true);
    try {
      const res = await fetch(
        `${BASE_URL}/fetchScreen?parameter=roi_basic_store_details&roiid=${roiContext.roiId}`,
      );
      if (!res.ok) {
        alert("Failed to load saved store details.");
        return;
      }
      const json = await res.json();
      const d = json?.data?.[0];
      if (!d) {
        alert("No saved store details found for this ROI.");
        return;
      }

      skipProjectTypeResetRef.current = true;
      skipFranchiseeResetRef.current = true;

      const pType = d.project_type ?? d.projectType ?? roiContext.projectType ?? "";
      setValue("projectType", pType);
      if (pType === "New Store") {
        setValue("historyId", d.TY_historyID ?? d.ty_history_id ?? d.history_id ?? roiContext.historyId ?? "");
      } else {
        setValue("existingStoreCode", d.exsisting_store_code ?? d.existing_store_code ?? roiContext.existingStoreCode ?? "");
      }
      setValue("existingStoreFormat", d.exsisting_store_format ?? d.existing_store_format ?? "");
      setValue("storeFormatChange", d.store_format_change ?? "");
      setValue("newStoreFormat", d.new_store_format ?? "");
      setValue("newFranchise", d.new_franchise ?? "");
      setValue("newFranchiseeStoreName", d.new_franchisee_storename ?? d.new_franchisee_store_name ?? "");
      setValue("newFranchiseeStoreCode", d.new_franchisee_storecode ?? d.new_franchisee_store_code ?? "");
      setValue("franchiseeStoreCode", d.existing_franchisee_store_code ?? d.franchisee_store_code ?? "");
      setValue("franchiseeStoreName", d.existing_franchisee_store_name ?? d.franchisee_store_name ?? "");
      setValue("baiatScore", d.franchisee_ba_iat_score != null ? String(d.franchisee_ba_iat_score) : "");
      setValue("partnerDbStatus", d.partner_db_status ?? "");
      setValue("partnerScore", d.partner_score != null ? String(d.partner_score) : "");
      setValue("retailArea", d.retail_area != null ? String(d.retail_area) : d.retailArea != null ? String(d.retailArea) : "");

      setFranchiseeFound(!!(d.existing_franchisee_store_code || d.franchisee_store_code));
      setExpandedSections({ projectType: true, location: true, storeFormat: true, franchise: true });
      setIsEditingLocked(true);
    } catch (e) {
      console.error("Failed to load existing store details for edit:", e);
      alert("Failed to load saved store details.");
    } finally {
      setIsLoadingExisting(false);
    }
  };

  const onSubmitBasicDetails = async (data) => {
    const username = userLog?.name;
    try {
      const payload = {
        username: username,
        roiid: roiContext?.roiId || undefined,
        projectType: data.projectType,
        historyId: data.historyId,
        existingStoreCode: data.existingStoreCode,
        city: data.city,
        state: data.state,
        region: data.region,
        newCity: data.newCity,
        existingStoreFormat: data.existingStoreFormat,
        retailArea: data.retailArea,
        storeType: data.storeType,
        storeFormatChange: data.storeFormatChange,
        newStoreFormat: data.newStoreFormat,
        newFranchise: data.newFranchise,
        newFranchiseeStoreName: data.newFranchiseeStoreName,
        newFranchiseeStoreCode: data.newFranchiseeStoreCode,
        franchiseeStoreCode: data.franchiseeStoreCode,
        franchiseeStoreName: data.franchiseeStoreName,
        baiatScore: data.baiatScore,
        partnerDbStatus: data.partnerDbStatus,
        partnerScore: data.partnerScore,
      };

      const res = await fetch(`${BASE_URL}/basic-store-details`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        alert("Failed to save store details");
        return;
      }

      const response = await res.json();
      setIsSaved(true);
      setSavedSummary({
        ...payload,
        roiId: response.roiId,
        historyRetailArea: data.historyRetailArea,
      });
      setShowSummaryModal(true);
    } catch (error) {
      console.error(error);
      alert("Failed to save store details");
    }
  };

  // Once a ROI has already been created (roiContext.roiId set — e.g. the user
  // navigated back here via "← Previous" from Store Retail Specifications),
  // show a locked summary by default instead of jumping straight back into a
  // blank creation form (which would mint a brand-new roiId on save and fork
  // off a duplicate ROI). Clicking "Edit" loads the real saved form so other
  // fields stay editable, while Project Type/History ID (New Store) or Store
  // Code (other types) — the flow-defining fields — stay locked below.
  if (roiContext?.roiId && !isEditingLocked) {
    const lockedFields = [
      ["Project Type", roiContext.projectType],
      ["History ID", roiContext.historyId],
      ["Ref Store Code", roiContext.refStoreCode || roiContext.existingStoreCode],
      ["City", roiContext.city],
      ["State", roiContext.state],
      ["Region", roiContext.region],
    ].filter(([, value]) => !!value);

    return (
      <div className='max-w-2xl mx-auto py-10'>
        <div className='bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden'>
          <div className='bg-gradient-to-r from-indigo-600 to-blue-600 px-8 py-6'>
            <div className='flex items-center gap-3'>
              <span className='text-3xl'>🔒</span>
              <div>
                <h2 className='text-xl font-bold text-white'>
                  Store Details Already Created
                </h2>
                <p className='text-indigo-100 text-sm mt-0.5'>
                  ROI ID: <span className='font-mono font-semibold'>{roiContext.roiId}</span>
                </p>
              </div>
            </div>
          </div>
          <div className='p-8 space-y-4'>
            <p className='text-sm text-gray-500'>
              {roiContext.projectType === "New Store"
                ? "Project Type and History ID define this ROI and can't be changed."
                : "The selected Store Code defines this ROI and can't be changed."}{" "}
              Other details can still be edited.
            </p>
            <div className='grid grid-cols-2 gap-3'>
              {lockedFields.map(([label, value]) => (
                <div key={label} className='bg-gray-50 rounded-lg px-4 py-3'>
                  <p className='text-xs text-gray-400 uppercase tracking-wide font-medium'>
                    {label}
                  </p>
                  <p className='text-gray-800 font-semibold mt-0.5 text-sm'>
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <div className='px-8 pb-8 flex justify-end gap-3'>
            <button
              type='button'
              onClick={startEditingExisting}
              disabled={isLoadingExisting}
              className='px-6 py-3 bg-white text-indigo-700 border border-indigo-200 rounded-xl font-semibold text-sm hover:bg-indigo-50 transition disabled:opacity-60'>
              {isLoadingExisting ? "Loading…" : "✎ Edit Details"}
            </button>
            <button
              type='button'
              onClick={() => onNext(roiContext)}
              className='px-8 py-3 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 transition'>
              Continue →
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-8'>
      {/* ── PROJECT TYPE ─────────────────────────────────────────────────────── */}
      <Section
        title='📋 Project Type'
        active={expandedSections.projectType}
        completed={projectTypeCompleted}
        isExpanded={expandedSections.projectType}
        onToggle={() =>
          setExpandedSections((prev) => ({
            ...prev,
            projectType: !prev.projectType,
          }))
        }>
        <Select
          label='Project Type *'
          name='projectType'
          register={register}
          disabled={!!roiContext?.roiId}
          rules={{ required: "Project Type is required" }}>
          <option value=''>Select Project Type</option>
          {projectTypes?.map((it) =>
            it.project_type ? (
              <option key={it.project_type} value={it.project_type}>
                {it.project_type}
              </option>
            ) : null,
          )}
        </Select>
        {errors?.projectType && (
          <p className='text-red-500 text-xs mt-1'>
            {errors.projectType.message}
          </p>
        )}
      </Section>

      {/* ── LOCATION ─────────────────────────────────────────────────────────── */}
      {projectTypeCompleted && (
        <Section
          title={
            isNewStore
              ? "📍 History & Location Details"
              : "📍 Store Location Details"
          }
          active={expandedSections.location}
          completed={locationCompleted}
          isExpanded={expandedSections.location}
          onToggle={() =>
            setExpandedSections((prev) => ({
              ...prev,
              location: !prev.location,
            }))
          }>
          {isNewStore ? (
            <>
              {/* History ID dropdown — auto-populates location on selection */}
              <Select
                label='History ID *'
                name='historyId'
                register={register}
                disabled={!!roiContext?.roiId || loading || historyIds.length === 0}
                rules={{ required: "History ID is required" }}>
                <option value=''>
                  {loading
                    ? "Loading..."
                    : historyIds.length === 0
                    ? "No records found"
                    : "Select History ID"}
                </option>
                {historyIds.map((it) => (
                  <option key={it.history_id} value={it.history_id}>
                    {it.history_id}
                  </option>
                ))}
              </Select>
              {errors?.historyId && (
                <p className='text-red-500 text-xs mt-1'>
                  {errors.historyId.message}
                </p>
              )}
              {loading && (
                <p className='text-blue-500 text-xs mt-1'>
                  Fetching location details...
                </p>
              )}

              {/* Auto-populated location */}
              {city && (
                <div className='xl:col-span-3'>
                  <div className='rounded-lg border border-green-200 bg-green-50 p-5'>
                    <div className='flex items-center justify-between mb-4'>
                      <h4 className='text-sm font-semibold text-green-700'>
                        Location Details
                      </h4>
                      <span className='text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded'>
                        ✓ Auto Populated
                      </span>
                    </div>
                    <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6'>
                      <Input
                        label='City'
                        name='city'
                        register={register}
                        disabled
                      />
                      <Input
                        label='State'
                        name='state'
                        register={register}
                        disabled
                      />
                      <Input
                        label='Region'
                        name='region'
                        register={register}
                        disabled
                      />
                      <Input
                        label='New City'
                        name='newCity'
                        register={register}
                        disabled
                      />
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Store code dropdown — auto-populates location on selection */}
              <Select
                label='Store Code *'
                name='existingStoreCode'
                register={register}
                disabled={!!roiContext?.roiId || loading || btqStores.length === 0}
                rules={{ required: "Store Code is required" }}>
                <option value=''>
                  {loading
                    ? "Loading..."
                    : btqStores.length === 0
                    ? "No stores found"
                    : "Select Store Code"}
                </option>
                {btqStores.map((it) => (
                  <option key={it.store_code} value={it.store_code}>
                    {it.store_code}
                  </option>
                ))}
              </Select>
              {errors?.existingStoreCode && (
                <p className='text-red-500 text-xs mt-1'>
                  {errors.existingStoreCode.message}
                </p>
              )}

              {/* Auto-populated store details */}
              {storeFound && (
                <div className='xl:col-span-3'>
                  <div className='rounded-lg border border-green-200 bg-green-50 p-5'>
                    <div className='flex items-center justify-between mb-4'>
                      <h4 className='text-sm font-semibold text-green-700'>
                        Store Details
                      </h4>
                      <span className='text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded'>
                        ✓ Auto Populated
                      </span>
                    </div>
                    <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'>
                      <Input
                        label='City'
                        name='city'
                        register={register}
                        disabled
                      />
                      <Input
                        label='State'
                        name='state'
                        register={register}
                        disabled
                      />
                      <Input
                        label='Region'
                        name='region'
                        register={register}
                        disabled
                      />
                      {/* Renovation: show format here since there is no separate format section */}
                      {isRenovation && (
                        <Input
                          label='Store Format'
                          name='existingStoreFormat'
                          register={register}
                          disabled
                        />
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </Section>
      )}

      {/* ── STORE FORMAT (not shown for Renovation) ──────────────────────────── */}
      {locationCompleted && !isRenovation && (
        <Section
          title='🏪 Store Format Details'
          active={expandedSections.storeFormat}
          completed={storeFormatCompleted}
          isExpanded={expandedSections.storeFormat}
          onToggle={() =>
            setExpandedSections((prev) => ({
              ...prev,
              storeFormat: !prev.storeFormat,
            }))
          }>
          {isNewStore ? (
            <>
              <Select
                label='New Store Format *'
                name='newStoreFormat'
                register={register}
                rules={{ required: "Store Format is required" }}>
                <option value=''>Select Format</option>
                {storeFormats?.map((it) =>
                  it.store_format ? (
                    <option key={it.store_format} value={it.store_format}>
                      {it.store_format}
                    </option>
                  ) : null,
                )}
              </Select>
              {errors?.newStoreFormat && (
                <p className='text-red-500 text-xs mt-1'>
                  {errors.newStoreFormat.message}
                </p>
              )}
            </>
          ) : (
            <>
              <Select
                label='Store Format Change *'
                name='storeFormatChange'
                register={register}
                rules={{
                  required: "Please select if store format is changing",
                }}>
                <option value=''>Select</option>
                <option value='Yes'>Yes</option>
                <option value='No'>No</option>
              </Select>
              {errors?.storeFormatChange && (
                <p className='text-red-500 text-xs mt-1'>
                  {errors.storeFormatChange.message}
                </p>
              )}

              {storeFormatChange === "Yes" && (
                <>
                  <Input
                    label='Existing Store Format'
                    name='existingStoreFormat'
                    register={register}
                    disabled
                  />
                  <Select
                    label='New Store Format *'
                    name='newStoreFormat'
                    register={register}>
                    <option value=''>Select New Format</option>
                    {storeFormats?.map((it) =>
                      it.store_format &&
                      it.store_format !== existingStoreFormat ? (
                        <option key={it.store_format} value={it.store_format}>
                          {it.store_format}
                        </option>
                      ) : null,
                    )}
                  </Select>
                </>
              )}

              {storeFormatChange === "No" && (
                <Input
                  label='Existing Store Format'
                  name='existingStoreFormat'
                  register={register}
                  disabled
                />
              )}
            </>
          )}
        </Section>
      )}

      {/* ── FRANCHISE ────────────────────────────────────────────────────────── */}
      {showFranchise && (
        <Section
          title='🤝 Franchise Details'
          active={expandedSections.franchise}
          completed={franchiseCompleted}
          isExpanded={expandedSections.franchise}
          onToggle={() =>
            setExpandedSections((prev) => ({
              ...prev,
              franchise: !prev.franchise,
            }))
          }>
          <Select
            label='New Franchise *'
            name='newFranchise'
            register={register}>
            <option value=''>Select</option>
            <option value='Yes'>Yes</option>
            <option value='No'>No</option>
          </Select>

          {/* New franchise fields */}
          {newFranchise === "Yes" && (
            <Input
              label='New Franchisee Store Name *'
              name='newFranchiseeStoreName'
              register={register}
            />
          )}

          {/* Existing franchisee search */}
          {newFranchise === "No" && (
            <>
              <div className='xl:col-span-3'>
                <div className='rounded-lg border border-gray-300 bg-gray-50 p-5'>
                  <h4 className='mb-4 text-sm font-semibold text-gray-700'>
                    Search Existing Franchisee
                  </h4>
                  <div className='flex flex-col md:flex-row md:items-end gap-3'>
                    <div className='flex-1'>
                      <Input
                        label='Franchisee Store Code *'
                        name='franchiseeStoreCode'
                        register={register}
                        maxLength={3}
                      />
                    </div>
                    <button
                      type='button'
                      onClick={fetchFranchiseeDetails}
                      disabled={loading}
                      className='h-10 px-5 rounded-lg bg-blue-600 text-white font-medium text-sm hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed'>
                      {loading ? "Fetching..." : "Fetch"}
                    </button>
                  </div>
                </div>
              </div>

              {franchiseeFound && (
                <div className='xl:col-span-3'>
                  <div className='rounded-lg border border-green-200 bg-green-50 p-5'>
                    <div className='flex items-center justify-between mb-4'>
                      <h4 className='text-sm font-semibold text-green-700'>
                        Franchisee Details
                      </h4>
                      <span className='text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded'>
                        ✓ Auto Populated
                      </span>
                    </div>
                    <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'>
                      <Input
                        label='Franchisee Store Name'
                        name='franchiseeStoreName'
                        register={register}
                        disabled
                      />
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Additional details — shown for both Yes/No, non-mandatory */}
          {!!newFranchise && (
            <div className='xl:col-span-3'>
              <div className='rounded-lg border border-blue-100 bg-blue-50 p-5'>
                <h4 className='mb-4 text-sm font-semibold text-gray-700'>
                  Additional Details{" "}
                  <span className='text-gray-400 font-normal'>(Optional)</span>
                </h4>
                <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'>
                  <Input
                    label='BA-IAT Score'
                    name='baiatScore'
                    register={register}
                    disabled={franchiseeFound && baiatScore !== ""}
                  />
                  <Input
                    label='Partner DB Status'
                    name='partnerDbStatus'
                    register={register}
                    disabled={franchiseeFound && partnerDbStatus !== ""}
                  />
                  <Input
                    label='Partner Score'
                    name='partnerScore'
                    register={register}
                    disabled={franchiseeFound && partnerScore !== ""}
                  />
                </div>
              </div>
            </div>
          )}
        </Section>
      )}

      {/* ── FOOTER BUTTONS ───────────────────────────────────────────────────── */}
      {franchiseCompleted && !isSaved && (
        <div className='flex gap-3 justify-start px-8 py-6 bg-gray-50 rounded-lg border border-gray-200 mt-8'>
          <button
            type='button'
            onClick={handleSubmit(onSubmitBasicDetails)}
            className='px-6 py-2 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 transition'>
            Save Details
          </button>
        </div>
      )}

      {/* ── SUMMARY MODAL ────────────────────────────────────────────────────── */}
      {showSummaryModal && savedSummary && (
        <div className='fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4'>
          <div className='bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto'>
            {/* Modal Header */}
            <div className='bg-gradient-to-r from-green-500 to-emerald-600 px-8 py-6 rounded-t-2xl'>
              <div className='flex items-center gap-3'>
                <span className='text-3xl'>✅</span>
                <div>
                  <h2 className='text-xl font-bold text-white'>
                    Store Details Saved
                  </h2>
                  <p className='text-green-100 text-sm mt-0.5'>
                    Basic details saved successfully
                  </p>
                </div>
              </div>
              <div className='mt-4 bg-white/20 rounded-xl px-5 py-3 inline-flex items-center gap-3'>
                <span className='text-white/80 text-sm font-medium'>
                  ROI ID
                </span>
                <span className='text-white font-bold text-lg tracking-widest'>
                  {savedSummary.roiId ?? "—"}
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
                  ["Project Type", savedSummary.projectType],
                  ["City", savedSummary.city],
                  ["State", savedSummary.state],
                  ["Region", savedSummary.region],
                  savedSummary.historyId && [
                    "History ID",
                    savedSummary.historyId,
                  ],
                  savedSummary.existingStoreCode && [
                    "Store Code",
                    savedSummary.existingStoreCode,
                  ],
                  savedSummary.newCity && ["New City", savedSummary.newCity],
                  (savedSummary.existingStoreFormat ||
                    savedSummary.newStoreFormat) && [
                    "Store Format",
                    savedSummary.existingStoreFormat ||
                      savedSummary.newStoreFormat,
                  ],
                  savedSummary.storeFormatChange && [
                    "Format Change",
                    savedSummary.storeFormatChange,
                  ],
                  savedSummary.newFranchise && [
                    "New Franchise",
                    savedSummary.newFranchise,
                  ],
                  savedSummary.newFranchiseeStoreName && [
                    "New Franchisee",
                    savedSummary.newFranchiseeStoreName,
                  ],
                  savedSummary.franchiseeStoreName && [
                    "Franchisee",
                    savedSummary.franchiseeStoreName,
                  ],
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
            <div className='px-8 pb-8 flex justify-end'>
              <button
                type='button'
                onClick={() => {
                  setShowSummaryModal(false);
                  onNext({
                    roiId: savedSummary.roiId,
                    projectType: savedSummary.projectType,
                    historyId: savedSummary.historyId,
                    city: savedSummary.city,
                    state: savedSummary.state,
                    region: savedSummary.region,
                    newCity: savedSummary.newCity,
                    existingStoreCode: savedSummary.existingStoreCode,
                    existingStoreFormat:
                      savedSummary.existingStoreFormat ||
                      savedSummary.newStoreFormat,
                    existingRetailArea: savedSummary.retailArea,
                    storeType: savedSummary.storeType,
                    historyRetailArea: savedSummary.historyRetailArea,
                    refStoreCode:
                      savedSummary.projectType === "New Store"
                        ? refStoreCode
                        : savedSummary.existingStoreCode,
                  });
                }}
                className='px-8 py-3 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 transition'>
                Proceed to Store Specifications →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
