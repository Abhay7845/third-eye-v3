import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import { BASE_URL } from "./Forms/data/baseUrl";

// ─── Page definitions ─────────────────────────────────────────────────────────
const PAGES = [
  { name: "Basic Store Details", icon: "🏪", step: 1, group: "Store Setup" },
  {
    name: "Store Retail Specifications",
    icon: "📋",
    step: 2,
    group: "Store Setup",
  },
  {
    name: "Sales Planning - Ref Store Code Details",
    icon: "🔗",
    step: 3,
    group: "Sales Planning",
  },
  {
    name: "Sales Planning - Sales Summary",
    icon: "📈",
    step: 3,
    group: "Sales Planning",
  },
  {
    name: "Sales Planning - Stock Summary",
    icon: "📦",
    step: 3,
    group: "Sales Planning",
  },
  {
    name: "Sales Planning - Discount",
    icon: "🏷️",
    step: 3,
    group: "Sales Planning",
  },
  { name: "Capex Expenses", icon: "🏗️", step: 4, group: "Expense Planning" },
  { name: "Resource Expenses", icon: "👥", step: 4, group: "Expense Planning" },
  { name: "Other Expenses", icon: "📝", step: 4, group: "Expense Planning" },
  { name: "Summary Expenses", icon: "💼", step: 4, group: "Expense Planning" },
];

const GROUPS = ["Store Setup", "Sales Planning", "Expense Planning"];

const PROJECT_COLORS = {
  "New Store": "bg-blue-100 text-blue-700 border-blue-200",
  Renovation: "bg-amber-100 text-amber-700 border-amber-200",
  Relocation: "bg-purple-100 text-purple-700 border-purple-200",
  "Store Expansion": "bg-green-100 text-green-700 border-green-200",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function daysAgo(dateStr) {
  if (!dateStr) return null;
  const d = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000);
  if (d <= 0) return "Today";
  if (d === 1) return "1 day ago";
  return `${d} days ago`;
}
function getFirstIncompleteStep(pages) {
  if (!pages?.length) return { step: 1, subStep: 1 };
  const m = Object.fromEntries(
    pages.map((p) => [p.page_name ?? p.PageName, p.status]),
  );
  const na = (name) => !m[name] || m[name] === "Not Available";

  if (na("Basic Store Details")) return { step: 1, subStep: 1 };
  if (na("Store Retail Specifications")) return { step: 2, subStep: 1 };

  const salesPages = [
    "Sales Planning - Ref Store Code Details",
    "Sales Planning - Sales Summary",
    "Sales Planning - Stock Summary",
    "Sales Planning - Discount",
  ];
  const firstIncompleteSales = salesPages.findIndex(na);
  if (firstIncompleteSales !== -1)
    return { step: 3, subStep: firstIncompleteSales + 1 };

  const expensePages = [
    "Capex Expenses",
    "Resource Expenses",
    "Other Expenses",
    "Summary Expenses",
  ];
  const firstIncompleteExpense = expensePages.findIndex(na);
  if (firstIncompleteExpense !== -1)
    return { step: 4, subStep: Math.min(firstIncompleteExpense + 1, 3) };

  return { step: 5, subStep: 1 };
}

const isPageFilled = (status) => !!status && status !== "Not Available";

function getStats(pages) {
  if (!pages?.length) return { done: 0, total: 10, pct: 0 };
  const done = pages.filter((p) => isPageFilled(p.status)).length;
  return {
    done,
    total: pages.length,
    pct: Math.round((done / pages.length) * 100),
  };
}

function SkeletonCard() {
  return (
    <div className='animate-pulse rounded-xl border border-gray-100 bg-white p-4 space-y-3'>
      <div className='h-4 bg-gray-200 rounded w-3/4' />
      <div className='h-3 bg-gray-100 rounded w-1/3' />
      <div className='h-1.5 bg-gray-100 rounded-full w-full mt-2' />
    </div>
  );
}

// ─── Modal display helpers ────────────────────────────────────────────────────
const HIDDEN_MODAL_KEYS = new Set([
  "roiid",
  "roi_id",
  "ROIID",
  "status",
  "inserted_date",
  "updated_date",
  "username",
  "created_date",
  "create_date",
]);

function fmtModalNum(value) {
  const n = parseFloat(value);
  if (isNaN(n) || value === "" || value === null || value === undefined)
    return "—";
  return n.toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

function formatModalLabel(key) {
  return key
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatModalValue(value) {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) {
    if (value.length === 0) return "—";
    return value.map((v) => fmtModalNum(v)).join(" · ");
  }
  if (typeof value === "object") return null; // rendered separately
  const n = parseFloat(value);
  if (!isNaN(n) && String(value).trim() !== "") return fmtModalNum(value);
  return String(value);
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function HistoryPage({ onBack, onContinueROI }) {
  const [roiList, setRoiList] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [selectedRoi, setSelectedRoi] = useState(null);
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [continuing, setContinuing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const userLog = useSelector((state) => state?.user?.user);
  const [viewModal, setViewModal] = useState({
    open: false,
    pageName: "",
    data: null,
    loading: false,
  });

  useEffect(() => {
    (async () => {
      try {
        setListLoading(true);
        const username = userLog?.name;
        const res = await fetch(`${BASE_URL}/roi_id?username=${username}`);
        if (!res.ok) throw new Error("Failed to fetch ROI list");
        const json = await res.json();
        // Multiple rows per roiid (one per history entry) — keep latest per roiid
        const latest = new Map();
        for (const row of json.data ?? []) {
          const id = row.roiid ?? row.roi_id ?? row.ROIID ?? "";
          const existing = latest.get(id);
          const rowDate = new Date(
            row.last_updated_date || row.inserted_date || 0,
          );
          const existDate = existing
            ? new Date(
                existing.last_updated_date || existing.inserted_date || 0,
              )
            : new Date(0);
          if (!existing || rowDate > existDate) latest.set(id, row);
        }
        const sorted = [...latest.values()].sort((a, b) =>
          (b.inserted_date ?? "").localeCompare(a.inserted_date ?? ""),
        );
        setRoiList(sorted);
      } catch (err) {
        toast.error(err.message || "No ROI ID history found under your Login");
      } finally {
        setListLoading(false);
      }
    })();
  }, []);

  const handleSelect = async (roi) => {
    const id = roi.roiid ?? roi.roi_id ?? roi.ROIID ?? "";
    if (selectedRoi?.roiid === id) return;
    setSelectedRoi({ ...roi, roiid: id });
    setSummary(null);
    setSummaryLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/summary/${id}`);
      if (!res.ok) throw new Error("Summary not found");
      const json = await res.json();
      setSummary(json.data ?? []);
    } catch (err) {
      toast.error(err.message || "Failed to load summary");
    } finally {
      setSummaryLoading(false);
    }
  };

  const handleContinue = async () => {
    if (!selectedRoi?.roiid) return;
    setContinuing(true);
    try {
      const [r1, r2] = await Promise.all([
        fetch(
          `${BASE_URL}/fetchScreen?parameter=roi_basic_store_details&roiid=${selectedRoi.roiid}`,
        ),
        fetch(
          `${BASE_URL}/fetchScreen?parameter=roi_store_retail_specifications&roiid=${selectedRoi.roiid}`,
        ),
      ]);

      const d1 = r1.ok ? (await r1.json()).data?.[0] ?? {} : {};
      const d2 = r2.ok ? (await r2.json()).data?.[0] ?? {} : {};

      const projectType = d1.project_type ?? d1.projectType ?? "";
      const existingStoreCode =
        d1.exsisting_store_code ?? d1.existing_store_code ?? "";

      const roiContext = {
        roiId: selectedRoi.roiid,
        projectType,
        historyId: d1.TY_historyID ?? d1.history_id ?? "",
        city: d1.city ?? "",
        state: d1.state ?? "",
        region: d1.region ?? "",
        newCity: d1.new_city ?? "",
        existingStoreCode,
        existingStoreFormat: d1.existing_store_format ?? "",
        // effective format drives Section 3 validation-metrics benchmark lookup
        effectiveStoreFormat:
          (projectType === "New Store")
            ? (d1.new_store_format ?? "")
            : (d1.exsisting_store_format ?? ""),
        // d2 wins when screen 2 was saved; d1 carries storeType as fallback
        storeType: d2.store_type ?? d1.store_type ?? "",
        existingRetailArea: d2.existing_retail_area ?? d1.retail_area ?? d1.retailArea ?? "",
        historyRetailArea: d2.new_retail_area ?? "",
        refStoreCode:
          (projectType === "New Store" || projectType === "Renovation" )
            ? d1.ref_store_code ?? existingStoreCode
            : existingStoreCode,
      };



      onContinueROI(roiContext, firstIncomplete.step, firstIncomplete.subStep);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load ROI context. Please try again.");
    } finally {
      setContinuing(false);
    }
  };

  const handleViewPage = async (pageName) => {
    setViewModal({ open: true, pageName, data: null, loading: true });
    try {
      const roiid = selectedRoi?.roiid;
      const sp = (screen) =>
        fetch(`${BASE_URL}/sales_planning`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ screen, roiid }),
        });
      const fs = (param) =>
        fetch(`${BASE_URL}/fetchScreen?parameter=${param}&roiid=${roiid}`);

      let res;
      switch (pageName) {
        case "Basic Store Details":
          res = await fs("roi_basic_store_details");
          break;
        case "Store Retail Specifications":
          res = await fs("roi_store_retail_specifications");
          break;
        case "Sales Planning - Ref Store Code Details":
          res = await sp(1);
          break;
        case "Sales Planning - Sales Summary":
          res = await sp(2);
          break;
        case "Sales Planning - Stock Summary":
          res = await sp(3);
          break;
        case "Sales Planning - Discount":
          res = await sp(4);
          break;
        case "Capex Expenses":
          res = await fetch(
            `${BASE_URL}/expense_details/${roiid}?expense_type=CAPEX`,
          );
          break;
        case "Resource Expenses":
          res = await fetch(
            `${BASE_URL}/expense_details/${roiid}?expense_type=RESOURCE`,
          );
          break;
        case "Other Expenses":
          res = await fetch(
            `${BASE_URL}/expense_details/${roiid}?expense_type=OTHER`,
          );
          break;
        case "Summary Expenses":
          res = await fetch(
            `${BASE_URL}/expense_details/${roiid}?expense_type=SUMMARY`,
          );
          break;
        case "Final Summary":
          res = await fetch(`${BASE_URL}/summary_screen_5/${roiid}`);
          break;
        default:
          res = null;
      }

      if (res?.ok) {
        const json = await res.json();
        setViewModal((prev) => ({
          ...prev,
          data: json.data ?? [],
          loading: false,
        }));
      } else {
        toast.error("Failed to load page data.");
        setViewModal((prev) => ({ ...prev, loading: false }));
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load page data.");
      setViewModal((prev) => ({ ...prev, loading: false }));
    }
  };

  const stats = getStats(summary);
  const firstIncomplete = summary
    ? getFirstIncompleteStep(summary)
    : { step: 1, subStep: 1 };
  const firstIncompleteStep = firstIncomplete.step;
  const firstIncompleteSubStep = firstIncomplete.subStep;
  const isAllComplete = firstIncompleteStep === 5;
  // View-only: any status that means the ROI is with an approver
  const roiStatus = selectedRoi?.status ?? "";
  const isSubmitted =
    roiStatus === "Submitted to RBM" ||
    roiStatus === "Submitted_toRBM" ||
    roiStatus.startsWith("Approved_by") ||
    roiStatus.startsWith("Rejected_by") ||
    roiStatus === "BPM_Requestraised";
  // ABM can edit & resubmit when any approver has sent clarification back
  const isClarificationPending = roiStatus.startsWith("SK_by");
  // ── Derived filter data ─────────────────────────────────────────────────
  const projectTypes = [
    "All",
    ...new Set(
      roiList.map((r) => r.project_type ?? r.projectType).filter(Boolean),
    ),
  ];

  const filteredList = roiList.filter((roi) => {
    const id = String(roi.roiid ?? roi.roi_id ?? roi.ROIID ?? "");
    const projType = roi.project_type ?? roi.projectType ?? "";
    const q = searchQuery.toLowerCase();
    const roiDate =
      roi.created_date ??
      roi.create_date ??
      roi.inserted_date ??
      roi.date ??
      "";
    return (
      (q === "" ||
        id.toLowerCase().includes(q) ||
        projType.toLowerCase().includes(q)) &&
      (typeFilter === "All" || projType === typeFilter) &&
      (!dateFrom || !roiDate || roiDate >= dateFrom) &&
      (!dateTo || !roiDate || roiDate <= dateTo)
    );
  });

  const groupedPages = summary
    ? GROUPS.map((group) => ({
        group,
        pages: PAGES.filter((p) => p.group === group).map((p) => {
          const match = summary.find(
            (s) => (s.page_name ?? s.PageName) === p.name,
          );
          return {
            ...p,
            status: match?.status ?? "Not Available",
            inserted_date: match?.inserted_date ?? null,
            updated_date: match?.updated_date ?? null,
          };
        }),
      }))
    : [];

  return (
    <div className='h-full bg-gradient-to-br from-slate-50 via-indigo-50 to-blue-100 flex flex-col overflow-hidden'>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className='flex-shrink-0 bg-white border-b border-gray-200 shadow-sm px-6 py-3.5 flex items-center gap-4'>
        <button
          onClick={onBack}
          className='flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-800 transition'>
          ← Back
        </button>
        <div className='h-5 w-px bg-gray-200' />
        <h1 className='text-lg font-bold text-gray-800'>ROI Request History</h1>
        {!listLoading && (
          <span className='ml-auto text-xs text-gray-400'>
            {roiList.length} total · {filteredList.length} shown
          </span>
        )}
      </div>

      {/* ── Body ────────────────────────────────────────────────────────── */}
      <div className='flex flex-1 overflow-hidden' style={{ minHeight: 0 }}>
        {/* ── Left: ROI list ──────────────────────────────────────────── */}
        <aside className='w-72 flex-shrink-0 flex flex-col border-r border-gray-200 bg-white overflow-hidden'>
          {/* Search + filter header — sticky */}
          <div className='flex-shrink-0 p-3 border-b border-gray-100 space-y-2'>
            <div className='relative'>
              <svg
                className='absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400'
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z'
                />
              </svg>
              <input
                type='text'
                placeholder='Search by ROI ID…'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-400 bg-gray-50'
              />
            </div>

            {/* Project type filter pills */}
            {projectTypes.length > 1 && (
              <div className='flex flex-wrap gap-1'>
                {projectTypes.map((type) => (
                  <button
                    key={type}
                    onClick={() => setTypeFilter(type)}
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border transition ${
                      typeFilter === type
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "bg-white text-gray-500 border-gray-200 hover:border-indigo-300"
                    }`}>
                    {type}
                  </button>
                ))}
              </div>
            )}

            {/* Date range filter */}
            <div className='grid grid-cols-2 gap-1'>
              <div>
                <p className='text-[9px] uppercase text-gray-400 font-semibold mb-0.5'>
                  From
                </p>
                <input
                  type='date'
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className='w-full px-2 py-1 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-400 bg-gray-50'
                />
              </div>
              <div>
                <p className='text-[9px] uppercase text-gray-400 font-semibold mb-0.5'>
                  To
                </p>
                <input
                  type='date'
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className='w-full px-2 py-1 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-400 bg-gray-50'
                />
              </div>
            </div>
            {(dateFrom || dateTo) && (
              <button
                onClick={() => {
                  setDateFrom("");
                  setDateTo("");
                }}
                className='text-[10px] text-indigo-600 hover:underline'>
                Clear date filter
              </button>
            )}
          </div>

          {/* Scrollable list */}
          <div className='flex-1 overflow-y-auto p-2 space-y-1.5'>
            {listLoading ? (
              Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
            ) : filteredList.length === 0 ? (
              <div className='flex flex-col items-center justify-center py-16 text-center'>
                <span className='text-4xl mb-2'>📭</span>
                <p className='font-semibold text-gray-500 text-sm'>
                  {roiList.length === 0 ? "No requests found" : "No matches"}
                </p>
                {roiList.length > 0 && (
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setTypeFilter("All");
                    }}
                    className='mt-2 text-xs text-indigo-600 hover:underline'>
                    Clear filters
                  </button>
                )}
              </div>
            ) : (
              filteredList.map((roi, idx) => {
                const id = roi.roiid ?? roi.roi_id ?? roi.ROIID ?? String(idx);
                const isActive = selectedRoi?.roiid === id;
                const projType = roi.project_type ?? roi.projectType ?? "—";
                const colorCls =
                  PROJECT_COLORS[projType] ??
                  "bg-gray-100 text-gray-500 border-gray-200";

                return (
                  <button
                    key={id}
                    onClick={() => handleSelect(roi)}
                    className={`w-full text-left rounded-lg border px-3 py-2.5 transition-all duration-150 ${
                      isActive
                        ? "border-indigo-400 bg-indigo-50 ring-1 ring-indigo-200"
                        : "border-gray-100 bg-white hover:border-indigo-200 hover:bg-gray-50"
                    }`}>
                    <div className='flex items-center justify-between gap-2'>
                      <span className='text-xs font-bold text-gray-800 font-mono truncate'>
                        {id}
                      </span>
                      {isActive && (
                        <span className='w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0' />
                      )}
                    </div>
                    <div className='flex items-center justify-between mt-1.5 gap-1'>
                      <span
                        className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${
                          roi.status === "Submitted to RBM"
                            ? "bg-green-100 text-green-700 border-green-200"
                            : "bg-gray-100 text-gray-500 border-gray-200"
                        }`}>
                        {roi.status ?? "Pending"}
                      </span>
                      {roi.inserted_date && (
                        <span className='text-[10px] text-indigo-400 font-medium'>
                          {daysAgo(roi.inserted_date)}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* ── Right: Detail panel ─────────────────────────────────────── */}
        <main className='flex-1 overflow-y-auto p-8'>
          {!selectedRoi && !summaryLoading && (
            <div className='flex flex-col items-center justify-center h-full text-center'>
              <span className='text-7xl mb-5'>👈</span>
              <p className='text-lg font-semibold text-gray-500'>
                Select an ROI request
              </p>
              <p className='text-sm text-gray-400 mt-1'>
                Click any request on the left to view its progress
              </p>
            </div>
          )}

          {summaryLoading && (
            <div className='flex items-center justify-center h-full'>
              <div className='flex flex-col items-center gap-3'>
                <svg
                  className='h-8 w-8 animate-spin text-indigo-500'
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
                <span className='text-sm font-medium text-gray-500'>
                  Loading summary…
                </span>
              </div>
            </div>
          )}

          {!summaryLoading && summary && (
            <div className='max-w-2xl mx-auto space-y-5'>
              {/* ── ROI header card ───────────────────────────────────── */}
              <div className='bg-white rounded-2xl shadow-sm border border-gray-100 p-6'>
                <div className='flex items-start justify-between gap-4'>
                  <div>
                    <p className='text-[10px] uppercase tracking-widest text-gray-400 font-semibold mb-1'>
                      ROI ID
                    </p>
                    <p className='text-2xl font-extrabold text-gray-900 font-mono tracking-wide'>
                      {selectedRoi.roiid}
                    </p>
                    <span
                      className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full border mt-2 ${
                        PROJECT_COLORS[
                          selectedRoi.project_type ?? selectedRoi.projectType
                        ] ?? "bg-gray-100 text-gray-500 border-gray-200"
                      }`}>
                      {selectedRoi.project_type ??
                        selectedRoi.projectType ??
                        "—"}
                    </span>
                  </div>

                  {/* Circular progress ring */}
                  <div className='flex flex-col items-center gap-1 flex-shrink-0'>
                    <div className='relative w-20 h-20'>
                      <svg
                        className='w-full h-full -rotate-90'
                        viewBox='0 0 36 36'>
                        <circle
                          cx='18'
                          cy='18'
                          r='15.5'
                          fill='none'
                          stroke='#e5e7eb'
                          strokeWidth='3.5'
                        />
                        <circle
                          cx='18'
                          cy='18'
                          r='15.5'
                          fill='none'
                          stroke={isAllComplete ? "#22c55e" : "#6366f1"}
                          strokeWidth='3.5'
                          strokeDasharray={`${(stats.pct / 100) * 97.4} 97.4`}
                          strokeLinecap='round'
                        />
                      </svg>
                      <div className='absolute inset-0 flex items-center justify-center'>
                        <span className='text-sm font-bold text-gray-700'>
                          {stats.pct}%
                        </span>
                      </div>
                    </div>
                    <p className='text-xs text-gray-400'>
                      {stats.done}/{stats.total} pages
                    </p>
                  </div>
                </div>

                {/* Linear bar */}
                <div className='mt-5'>
                  <div className='h-2 bg-gray-100 rounded-full overflow-hidden'>
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        isAllComplete ? "bg-green-500" : "bg-indigo-500"
                      }`}
                      style={{ width: `${stats.pct}%` }}
                    />
                  </div>
                  <div className='flex justify-between text-xs text-gray-400 mt-1'>
                    <span>{stats.done} completed</span>
                    <span>{stats.total - stats.done} remaining</span>
                  </div>
                </div>
              </div>

              {/* ── Section groups ────────────────────────────────────── */}
              {groupedPages.map(({ group, pages }) => {
                const groupDone = pages.filter((p) =>
                  isPageFilled(p.status),
                ).length;
                const allDone = groupDone === pages.length;
                const noneDone = groupDone === 0;

                return (
                  <div
                    key={group}
                    className='bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden'>
                    <div className='px-6 py-3.5 border-b border-gray-50 flex items-center justify-between'>
                      <div className='flex items-center gap-2'>
                        <span
                          className={`w-2 h-2 rounded-full ${
                            allDone
                              ? "bg-green-500"
                              : noneDone
                              ? "bg-gray-300"
                              : "bg-amber-400"
                          }`}
                        />
                        <h3 className='font-bold text-sm text-gray-700'>
                          {group}
                        </h3>
                      </div>
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          allDone
                            ? "bg-green-100 text-green-700"
                            : noneDone
                            ? "bg-gray-100 text-gray-400"
                            : "bg-amber-100 text-amber-700"
                        }`}>
                        {groupDone}/{pages.length}
                      </span>
                    </div>

                    <div className='divide-y divide-gray-50'>
                      {pages.map((page) => {
                        const done = isPageFilled(page.status);
                        const pageSubmitted =
                          page.status === "Submitted to RBM" ||
                          page.status === "Submitted_toRBM";
                        return (
                          <div
                            key={page.name}
                            className='flex items-center gap-3 px-6 py-3'>
                            <span className='text-lg flex-shrink-0'>
                              {page.icon}
                            </span>
                            <div className='flex-1 min-w-0'>
                              <p
                                className={`text-sm font-medium truncate ${
                                  done ? "text-gray-800" : "text-gray-400"
                                }`}>
                                {page.name}
                              </p>
                              {done && page.inserted_date && (
                                <p className='text-[10px] text-gray-400 mt-0.5'>
                                  Saved: {page.inserted_date}
                                  {page.updated_date
                                    ? ` · Updated: ${page.updated_date}`
                                    : ""}
                                </p>
                              )}
                            </div>
                            <div className='flex items-center gap-2 flex-shrink-0'>
                              {done ? (
                                <>
                                  <button
                                    onClick={() => handleViewPage(page.name)}
                                    className='text-[10px] font-semibold text-indigo-700 bg-indigo-100 hover:bg-indigo-200 px-2.5 py-1 rounded-full transition'>
                                    View
                                  </button>
                                  {!isSubmitted && !pageSubmitted && (
                                    <span className='flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-100 px-2.5 py-1 rounded-full'>
                                      ✓ Completed
                                    </span>
                                  )}
                                </>
                              ) : (
                                <span className='text-xs font-medium text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full'>
                                  Not Started
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* ── Continue / View-only / Clarification action card ── */}
              {isSubmitted ? (
                <div className='rounded-2xl border border-blue-200 bg-blue-50 p-6 flex items-center gap-4'>
                  <span className='text-3xl flex-shrink-0'>🔒</span>
                  <div className='flex-1'>
                    <p className='font-bold text-blue-800'>
                      {roiStatus === "BPM_Requestraised"
                        ? "BPM Request Raised"
                        : roiStatus.startsWith("Rejected_by")
                        ? `Rejected by ${roiStatus.replace("Rejected_by", "")}`
                        : roiStatus.startsWith("Approved_by")
                        ? `Approved by ${roiStatus.replace(
                            "Approved_by",
                            "",
                          )} — Awaiting next approver`
                        : "Submitted for Approval"}
                    </p>
                    <p className='text-xs text-blue-600 mt-1'>
                      This ROI is with the approver. You can view each section
                      below but cannot make changes.
                    </p>
                  </div>
                  <button
                    onClick={() => handleViewPage("Final Summary")}
                    className='flex-shrink-0 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm shadow transition'>
                    📊 View Final Summary
                  </button>
                </div>
              ) : (
                <div
                  className={`rounded-2xl border p-6 flex items-center justify-between gap-4 ${
                    isClarificationPending
                      ? "bg-amber-50 border-amber-300"
                      : isAllComplete
                      ? "bg-green-50 border-green-200"
                      : "bg-indigo-50 border-indigo-200"
                  }`}>
                  <div className='flex-1 min-w-0'>
                    <p className='font-bold text-gray-800'>
                      {isClarificationPending
                        ? `💬 Clarification Requested by ${(
                            selectedRoi?.status ?? ""
                          ).replace("SK_by", "")}`
                        : isAllComplete
                        ? "🎉 All sections complete"
                        : `📍 Continue from Step ${firstIncompleteStep}`}
                    </p>
                    <p className='text-xs text-gray-500 mt-1'>
                      {isClarificationPending
                        ? "Review the remark below and make necessary changes before resubmitting."
                        : isAllComplete
                        ? "Review all filled data and proceed to submit."
                        : "Saved fields are editable — Project Type, History ID & Ref Store are locked."}
                    </p>
                    {/* Show remark from approval history when clarification is pending */}
                    {isClarificationPending && selectedRoi?.remarks && (
                      <div className='mt-3 bg-white rounded-xl border border-amber-200 px-4 py-3'>
                        <p className='text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1'>
                          Remark from Approver
                        </p>
                        <p className='text-sm text-gray-800 whitespace-pre-wrap'>
                          {selectedRoi.remarks}
                        </p>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={handleContinue}
                    disabled={continuing}
                    className={`flex-shrink-0 px-6 py-3 rounded-xl font-semibold text-sm shadow transition ${
                      continuing
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : isClarificationPending
                        ? "bg-amber-500 hover:bg-amber-600 text-white"
                        : isAllComplete
                        ? "bg-green-600 hover:bg-green-700 text-white"
                        : "bg-indigo-600 hover:bg-indigo-700 text-white"
                    }`}>
                    {continuing
                      ? "Loading…"
                      : isClarificationPending
                      ? "✏️ Edit & Resubmit"
                      : isAllComplete
                      ? "Review & Submit"
                      : "Continue ROI →"}
                  </button>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* ── View Page Modal ────────────────────────────────────── */}
      {viewModal.open && (
        <div className='fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-6 sm:p-10'>
          <div className='bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col'>
            {/* Modal header */}
            <div className='flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0 bg-gradient-to-r from-indigo-50 to-white rounded-t-2xl'>
              <div className='flex items-center gap-3'>
                <span className='text-2xl'>
                  {PAGES.find((p) => p.name === viewModal.pageName)?.icon ??
                    "📄"}
                </span>
                <div>
                  <h2 className='text-base font-bold text-gray-900'>
                    {viewModal.pageName}
                  </h2>
                  <p className='text-xs text-gray-400 mt-0.5 font-mono'>
                    ROI: {selectedRoi?.roiid}
                  </p>
                </div>
              </div>
              <button
                onClick={() =>
                  setViewModal({
                    open: false,
                    pageName: "",
                    data: null,
                    loading: false,
                  })
                }
                className='text-gray-400 hover:text-gray-700 text-xl font-bold w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition'>
                ✕
              </button>
            </div>

            {/* Modal body */}
            <div className='flex-1 overflow-y-auto bg-slate-50'>
              {viewModal.loading ? (
                <div className='flex flex-col items-center justify-center h-48 gap-3'>
                  <svg className='h-8 w-8 animate-spin text-indigo-500' fill='none' viewBox='0 0 24 24'>
                    <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4' />
                    <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z' />
                  </svg>
                  <span className='text-sm text-gray-500 font-medium'>Loading data…</span>
                </div>
              ) : !viewModal.data?.length ? (
                <div className='flex flex-col items-center justify-center h-48 text-gray-400'>
                  <p className='text-5xl mb-3'>📭</p>
                  <p className='text-sm font-semibold text-gray-500'>No data saved for this section yet</p>
                </div>
              ) : (() => {
                const data = viewModal.data;
                const pageName = viewModal.pageName;
                const first = data[0] ?? {};

                // ── Shared helpers ─────────────────────────────────────────────────
                const YR_KEYS = ['Yr1','Yr2','Yr3','Yr4','Yr5','Yr6'];
                const YR_LABELS = ['Yr. 1','Yr. 2','Yr. 3','Yr. 4','Yr. 5','Yr. 6'];
                const fmtVal = (v) => {
                  if (v == null || v === '') return '—';
                  if (typeof v === 'boolean') return v ? 'Yes' : 'No';
                  const n = parseFloat(v);
                  if (!isNaN(n) && String(v).trim() !== '') return n.toLocaleString('en-IN', { maximumFractionDigits: 2 });
                  return String(v);
                };
                const fmtLabel = (k) => k.replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());

                const InfoCard = ({ label, value, accent = false }) => (
                  <div className={`rounded-xl px-4 py-3 border ${accent ? 'bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-100' : 'bg-white border-gray-200'}`}>
                    <p className='text-[10px] font-bold uppercase tracking-widest text-indigo-400 mb-1'>{label}</p>
                    <p className='text-sm font-bold text-gray-800 break-words leading-snug'>{value || '—'}</p>
                  </div>
                );

                const SectionHead = ({ children }) => (
                  <div className='flex items-center gap-3 mb-3'>
                    <div className='h-px flex-1 bg-gray-200' />
                    <span className='text-[10px] font-black uppercase tracking-widest text-gray-400 whitespace-nowrap px-1'>{children}</span>
                    <div className='h-px flex-1 bg-gray-200' />
                  </div>
                );

                // ── Year-wise table (Sales Planning pages) ─────────────────────────
                // Data format: [{ Header: "Sales Planning_Total Sales", Yr1: N, … }]
                if ('Header' in first && !('Particulars' in first)) {
                  // Group rows: "Total" / "total_" prefixed → bold amber; section breaks by prefix change
                  const TOTAL_WORDS = ['total', 'sum', 'net', 'overall'];
                  const isTotal = (h) => h && TOTAL_WORDS.some(w => h.toLowerCase().includes(w));
                  // Strip common prefixes like "Sales Planning_", "Pricing Metrics_", etc.
                  const stripPrefix = (h) => h?.replace(/^[^_]+_/, '') ?? h ?? '';
                  const prevGroup = { val: null };

                  return (
                    <div className='p-5'>
                      <div className='overflow-x-auto rounded-2xl border border-gray-200 shadow-md bg-white'>
                        <table className='min-w-full border-collapse text-xs'>
                          <thead>
                            <tr className='bg-[#1e3a5f] text-white'>
                              <th className='px-4 py-3.5 text-left font-bold text-sm min-w-[240px] sticky left-0 bg-[#1e3a5f] z-10'>Metric</th>
                              {YR_LABELS.map(y => (
                                <th key={y} className='px-4 py-3.5 text-right font-bold min-w-[100px]'>{y}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {data.map((row, i) => {
                              const label = stripPrefix(row.Header);
                              const tot = isTotal(label);
                              return (
                                <tr key={i} className={`transition-colors ${tot ? 'bg-amber-50 hover:bg-amber-100' : i % 2 === 0 ? 'bg-white hover:bg-slate-50' : 'bg-slate-50/60 hover:bg-slate-100/60'}`}>
                                  <td className={`px-4 py-2.5 border-b border-gray-100 sticky left-0 z-10 ${tot ? 'font-bold text-amber-900 bg-amber-50' : 'font-medium text-gray-700 bg-inherit'}`}>{label}</td>
                                  {YR_KEYS.map(y => (
                                    <td key={y} className={`px-4 py-2.5 text-right border-b border-gray-100 tabular-nums ${tot ? 'font-bold text-amber-800' : 'text-gray-700'}`}>
                                      {row[y] != null ? fmtModalNum(row[y]) : '—'}
                                    </td>
                                  ))}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                }

                // ── Financial statement (Final Summary / Particulars + Yr1-Yr6) ─────
                if ('Particulars' in first) {
                  const scalarRows = data.filter(r => YR_KEYS.every(y => r[y] == null));
                  const yearRows   = data.filter(r => YR_KEYS.some(y => r[y] != null));
                  const INCOME_KEYS = ['ucp', 'nsv', 'gross', 'commission', 'discount'];
                  const EXPENSE_KEYS = ['expense', 'rent', 'salary', 'electric', 'repair', 'insurance', 'btl', 'travel', 'gst', 'credit', 'printing', 'consumable', 'staff', 'welfare', 'bg cost', 'regn'];
                  const PROFIT_KEYS = ['ebitda', 'pbt', 'roi', 'depreciation', 'profit', 'operating'];
                  const INVEST_KEYS = ['investment', 'interior', 'depreciation', 'working capital', 'security deposit', 'current value'];
                  const sectionOf = (label) => {
                    const l = (label ?? '').toLowerCase();
                    if (INVEST_KEYS.some(k => l.includes(k))) return 'Investment';
                    if (PROFIT_KEYS.some(k => l.includes(k))) return 'Profitability';
                    if (EXPENSE_KEYS.some(k => l.includes(k))) return 'Expenses';
                    if (INCOME_KEYS.some(k => l.includes(k))) return 'Income';
                    return 'Other';
                  };
                  const SECTION_COLORS = {
                    Income: 'bg-green-50 text-green-900',
                    Expenses: 'bg-amber-50 text-amber-900',
                    Profitability: 'bg-blue-50 text-blue-900',
                    Investment: 'bg-purple-50 text-purple-900',
                    Other: 'bg-gray-50 text-gray-800',
                  };
                  const SECTION_HEADER_COLORS = {
                    Income: 'bg-green-700',
                    Expenses: 'bg-amber-700',
                    Profitability: 'bg-blue-700',
                    Investment: 'bg-purple-700',
                    Other: 'bg-[#1e3a5f]',
                  };
                  // Group year rows by section
                  let lastSection = null;
                  const groupedRows = yearRows.map(r => ({ ...r, _section: sectionOf(r.Particulars) }));

                  return (
                    <div className='p-5 space-y-5'>
                      {scalarRows.length > 0 && (
                        <div className='grid grid-cols-2 sm:grid-cols-3 gap-3'>
                          {scalarRows.map((r, i) => <InfoCard key={i} label={r.Particulars} value={r.Header} accent />)}
                        </div>
                      )}
                      {yearRows.length > 0 && (
                        <div className='overflow-x-auto rounded-2xl border border-gray-200 shadow-md bg-white'>
                          <table className='min-w-full border-collapse text-xs'>
                            <thead>
                              <tr className='bg-[#1e3a5f] text-white'>
                                <th className='px-4 py-3.5 text-left font-bold text-sm min-w-[240px] sticky left-0 bg-[#1e3a5f] z-10'>Particulars</th>
                                {YR_LABELS.map(y => <th key={y} className='px-4 py-3.5 text-right font-bold min-w-[90px]'>{y}</th>)}
                              </tr>
                            </thead>
                            <tbody>
                              {groupedRows.map((row, i) => {
                                const isNewSection = row._section !== lastSection;
                                lastSection = row._section;
                                const isTotalRow = ['total', 'ebitda', 'pbt', 'roi', 'net'].some(k => row.Particulars?.toLowerCase().includes(k));
                                const secCls = SECTION_COLORS[row._section] ?? 'bg-white';
                                const secHdrCls = SECTION_HEADER_COLORS[row._section] ?? 'bg-[#1e3a5f]';
                                return (
                                  <>
                                    {isNewSection && i > 0 && (
                                      <tr key={`sec-${row._section}`}>
                                        <td colSpan={7} className={`${secHdrCls} text-white text-[10px] font-black uppercase tracking-widest px-4 py-2`}>{row._section}</td>
                                      </tr>
                                    )}
                                    <tr key={i} className={`transition-colors ${isTotalRow ? `${secCls} font-bold` : 'hover:bg-gray-50'}`}>
                                      <td className={`px-4 py-2.5 border-b border-gray-100 sticky left-0 z-10 ${isTotalRow ? `${secCls} font-bold` : 'bg-white font-medium text-gray-700'}`}>
                                        {row.Particulars}
                                      </td>
                                      {YR_KEYS.map(y => (
                                        <td key={y} className={`px-4 py-2.5 text-right border-b border-gray-100 tabular-nums ${isTotalRow ? 'font-bold' : 'text-gray-700'} ${(row[y] ?? 0) < 0 ? 'text-red-600' : ''}`}>
                                          {row[y] != null ? fmtModalNum(row[y]) : '—'}
                                        </td>
                                      ))}
                                    </tr>
                                  </>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  );
                }

                // ── Flat key-value pages (Store Details, Expense Details) ────────────
                // Smart section map per page
                const PAGE_SECTIONS = {
                  'Basic Store Details': [
                    { title: 'Project', keys: ['project_type', 'ty_history_id', 'history_id', 'TY_historyID'] },
                    { title: 'Location', keys: ['city', 'state', 'region', 'new_city'] },
                    { title: 'Store Format', keys: ['existing_store_code', 'existing_store_format', 'store_format_change', 'new_store_format', 'store_type', 'retail_area'] },
                    { title: 'Franchise Details', keys: ['new_franchise', 'new_franchisee_storename', 'new_franchisee_storecode', 'existing_franchisee_store_name', 'existing_franchisee_store_code', 'franchisee_ba_iat_score', 'partner_db_status', 'partner_score'] },
                  ],
                  'Store Retail Specifications': [
                    { title: 'Store Type & Areas', keys: ['store_type', 'existing_overall_area_SBA', 'existing_retail_area', 'new_over_all_area_SBA', 'new_retail_area', 'no_of_floors', 'floor_plate'] },
                    { title: 'Architecture', keys: ['frontage', 'ceiling_height', 'facade_led', 'terrace_branding', 'totem_pole', 'display_type', 'flooring_type', 'floors_for_facade'] },
                    { title: 'Facilities', keys: ['cashier_count', 'karatmeter_count', 'strong_room', 'franchise_room', 'manager_room', 'conference_room', 'pvr_room', 'additional_workstation', 'regional_service_centre'] },
                    { title: 'Notes', keys: ['remarks'] },
                  ],
                };

                const sections = PAGE_SECTIONS[pageName];
                const row = data[0] ?? {};
                const allKeys = Object.keys(row);

                // Check if it's a nested JSON payload (CAPEX / RESOURCE / SUMMARY expense pages)
                const hasNestedObjects = allKeys.some(k => typeof row[k] === 'object' && row[k] !== null && !Array.isArray(row[k]));

                if (hasNestedObjects) {
                  // Deep render nested expense payloads
                  const renderValue = (v, depth = 0) => {
                    if (v == null || v === '') return '—';
                    if (Array.isArray(v)) {
                      const nums = v.filter(x => x != null);
                      if (!nums.length) return '—';
                      return (
                        <div className='flex flex-wrap gap-1 mt-1'>
                          {nums.map((n, i) => (
                            <span key={i} className='bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-lg border border-indigo-100'>
                              {YR_LABELS[i] ?? `#${i+1}`}: {fmtModalNum(n)}
                            </span>
                          ))}
                        </div>
                      );
                    }
                    if (typeof v === 'object') {
                      const entries = Object.entries(v).filter(([, val]) => val != null && val !== '');
                      return (
                        <div className={`grid grid-cols-2 sm:grid-cols-3 gap-1.5 mt-1.5 ${depth > 0 ? 'bg-white rounded-lg p-2 border border-gray-100' : ''}`}>
                          {entries.map(([k2, v2]) => (
                            <div key={k2} className='bg-slate-50 rounded-lg px-3 py-2 border border-gray-100'>
                              <p className='text-[9px] font-bold text-gray-400 uppercase tracking-wide'>{fmtLabel(k2)}</p>
                              <div className='text-xs font-semibold text-gray-800 mt-0.5'>{renderValue(v2, depth + 1)}</div>
                            </div>
                          ))}
                        </div>
                      );
                    }
                    return fmtVal(v);
                  };

                  const topEntries = Object.entries(row).filter(([k]) => !HIDDEN_MODAL_KEYS.has(k));
                  const scalarEntries = topEntries.filter(([, v]) => typeof v !== 'object' || v == null);
                  const objEntries = topEntries.filter(([, v]) => typeof v === 'object' && v !== null);

                  return (
                    <div className='p-5 space-y-5'>
                      {scalarEntries.length > 0 && (
                        <div className='grid grid-cols-2 sm:grid-cols-3 gap-3'>
                          {scalarEntries.map(([k, v]) => <InfoCard key={k} label={fmtLabel(k)} value={fmtVal(v)} />)}
                        </div>
                      )}
                      {objEntries.map(([k, v]) => (
                        <div key={k} className='bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden'>
                          <div className='px-5 py-3 bg-gradient-to-r from-[#1e3a5f] to-[#2d5f8a]'>
                            <h4 className='text-xs font-black text-white uppercase tracking-widest'>{fmtLabel(k)}</h4>
                          </div>
                          <div className='p-4'>
                            {Array.isArray(v) ? (
                              v.length === 0 ? <p className='text-xs text-gray-400'>—</p> :
                              typeof v[0] === 'object' ? (
                                // Table for array of objects (e.g., salary rows)
                                <div className='overflow-x-auto rounded-xl border border-gray-100'>
                                  <table className='min-w-full text-xs border-collapse'>
                                    <thead>
                                      <tr className='bg-slate-100'>
                                        {Object.keys(v[0]).filter(k2 => !HIDDEN_MODAL_KEYS.has(k2)).map(k2 => (
                                          <th key={k2} className='px-3 py-2 text-left font-bold text-gray-500 uppercase tracking-wide text-[9px]'>{fmtLabel(k2)}</th>
                                        ))}
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {v.map((item, i) => (
                                        <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                                          {Object.entries(item).filter(([k2]) => !HIDDEN_MODAL_KEYS.has(k2)).map(([k2, v2]) => (
                                            <td key={k2} className='px-3 py-2 border-b border-gray-100 text-gray-700 font-medium'>{fmtVal(v2)}</td>
                                          ))}
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              ) : (
                                <div className='flex flex-wrap gap-1.5'>
                                  {v.map((n, i) => (
                                    <span key={i} className='bg-amber-50 text-amber-700 text-[10px] font-bold px-2.5 py-1 rounded-lg border border-amber-100'>
                                      {YR_LABELS[i] ?? `#${i+1}`}: {fmtModalNum(n)}
                                    </span>
                                  ))}
                                </div>
                              )
                            ) : typeof v === 'object' && v !== null ? (
                              <div className='grid grid-cols-2 sm:grid-cols-3 gap-2'>
                                {Object.entries(v).filter(([k2, val]) => !HIDDEN_MODAL_KEYS.has(k2) && val != null && val !== '').map(([k2, v2]) => (
                                  <InfoCard key={k2} label={fmtLabel(k2)} value={typeof v2 === 'object' ? JSON.stringify(v2) : fmtVal(v2)} />
                                ))}
                              </div>
                            ) : <p className='text-sm font-semibold text-gray-800'>{fmtVal(v)}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                }

                // Sectioned flat display for known pages
                if (sections) {
                  const usedKeys = new Set();
                  return (
                    <div className='p-5 space-y-5'>
                      {sections.map(({ title, keys }) => {
                        const entries = keys
                          .map(k => {
                            const val = row[k] ?? row[k.replace(/_([a-z])/g, (_, c) => c.toUpperCase())];
                            if (val == null || val === '') return null;
                            usedKeys.add(k);
                            return [k, val];
                          })
                          .filter(Boolean);
                        if (!entries.length) return null;
                        return (
                          <div key={title} className='bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden'>
                            <div className='px-5 py-3 bg-gradient-to-r from-[#1e3a5f] to-[#2d5f8a]'>
                              <h4 className='text-xs font-black text-white uppercase tracking-widest'>{title}</h4>
                            </div>
                            <div className='grid grid-cols-2 sm:grid-cols-3 gap-px bg-gray-100'>
                              {entries.map(([k, v]) => (
                                <div key={k} className='bg-white px-4 py-3'>
                                  <p className='text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-0.5'>{fmtLabel(k)}</p>
                                  <p className='text-sm font-semibold text-gray-800 break-words'>{fmtVal(v)}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                      {/* Ungrouped remainder */}
                      {(() => {
                        const rem = Object.entries(row).filter(([k, v]) => !HIDDEN_MODAL_KEYS.has(k) && !usedKeys.has(k) && v != null && v !== '');
                        return rem.length > 0 ? (
                          <div className='bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden'>
                            <div className='px-5 py-3 bg-slate-100 border-b border-gray-200'>
                              <h4 className='text-xs font-bold text-gray-500 uppercase tracking-widest'>Other</h4>
                            </div>
                            <div className='grid grid-cols-2 sm:grid-cols-3 gap-px bg-gray-100'>
                              {rem.map(([k, v]) => (
                                <div key={k} className='bg-white px-4 py-3'>
                                  <p className='text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-0.5'>{fmtLabel(k)}</p>
                                  <p className='text-sm font-semibold text-gray-800 break-words'>{fmtVal(v)}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : null;
                      })()}
                    </div>
                  );
                }

                // Generic fallback for multiple rows (e.g., ref store details)
                return (
                  <div className='p-5 space-y-4'>
                    {data.map((row, rowIdx) => {
                      const entries = Object.entries(row).filter(([k, v]) => !HIDDEN_MODAL_KEYS.has(k) && v != null && v !== '');
                      if (!entries.length) return null;
                      const scalarE = entries.filter(([, v]) => typeof v !== 'object');
                      const objE    = entries.filter(([, v]) => typeof v === 'object' && v !== null);
                      return (
                        <div key={rowIdx} className='bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden'>
                          {data.length > 1 && (
                            <div className='px-5 py-2.5 bg-slate-100 border-b border-gray-200'>
                              <p className='text-[10px] font-black text-gray-400 uppercase tracking-widest'>Record {rowIdx + 1}</p>
                            </div>
                          )}
                          <div className='grid grid-cols-2 sm:grid-cols-3 gap-px bg-gray-100'>
                            {scalarE.map(([k, v]) => (
                              <div key={k} className='bg-white px-4 py-3'>
                                <p className='text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-0.5'>{fmtLabel(k)}</p>
                                <p className='text-sm font-semibold text-gray-800 break-words'>{fmtVal(v)}</p>
                              </div>
                            ))}
                          </div>
                          {objE.map(([k, v]) => (
                            <div key={k} className='border-t border-gray-100 px-5 py-4'>
                              <p className='text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2'>{fmtLabel(k)}</p>
                              <div className='grid grid-cols-2 sm:grid-cols-3 gap-2'>
                                {Object.entries(v).filter(([k2, v2]) => !HIDDEN_MODAL_KEYS.has(k2) && v2 != null && v2 !== '').map(([k2, v2]) => (
                                  <InfoCard key={k2} label={fmtLabel(k2)} value={Array.isArray(v2) ? v2.map(n => fmtModalNum(n)).join(' · ') : fmtVal(v2)} />
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
