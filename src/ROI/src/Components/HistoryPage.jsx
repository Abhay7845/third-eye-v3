import { useEffect, useState } from "react";
import { toast } from "react-toastify";
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
  if (!pages?.length) return 1;
  const m = Object.fromEntries(
    pages.map((p) => [p.page_name ?? p.PageName, p.status]),
  );
  const na = (name) => !m[name] || m[name] === "Not Available";
  if (na("Basic Store Details")) return 1;
  if (na("Store Retail Specifications")) return 2;
  if (
    [
      "Sales Planning - Ref Store Code Details",
      "Sales Planning - Sales Summary",
      "Sales Planning - Stock Summary",
      "Sales Planning - Discount",
    ].some(na)
  )
    return 3;
  if (
    [
      "Capex Expenses",
      "Resource Expenses",
      "Other Expenses",
      "Summary Expenses",
    ].some(na)
  )
    return 4;
  return 5;
}

function getStats(pages) {
  if (!pages?.length) return { done: 0, total: 10, pct: 0 };
  const done = pages.filter(
    (p) => p.status === "Pending" || p.status === "Submitted to RBM",
  ).length;
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
        const res = await fetch(`${BASE_URL}/roi_id`);
        if (!res.ok) throw new Error("Failed to fetch ROI list");
        const json = await res.json();
        const sorted = (json.data ?? [])
          .slice()
          .sort((a, b) =>
            (b.inserted_date ?? "").localeCompare(a.inserted_date ?? ""),
          );
        setRoiList(sorted);
      } catch (err) {
        toast.error(err.message || "Failed to load ROI requests");
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
        historyId: d1.ty_history_id ?? d1.history_id ?? "",
        city: d1.city ?? "",
        state: d1.state ?? "",
        region: d1.region ?? "",
        newCity: d1.new_city ?? "",
        existingStoreCode,
        existingStoreFormat: d1.existing_store_format ?? "",
        storeType: d2.store_type ?? "",
        existingRetailArea: d2.existing_retail_area ?? "",
        historyRetailArea: d2.new_retail_area ?? "",
        refStoreCode:
          projectType === "New Store"
            ? d1.ref_store_code ?? existingStoreCode
            : existingStoreCode,
      };

      onContinueROI(roiContext, getFirstIncompleteStep(summary));
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
  const firstIncompleteStep = summary ? getFirstIncompleteStep(summary) : 1;
  const isAllComplete = firstIncompleteStep === 5;
  const isSubmitted = selectedRoi?.status === "Submitted to RBM";
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
                const groupDone = pages.filter(
                  (p) => p.status === "Pending",
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
                        const done =
                          page.status === "Pending" ||
                          page.status === "Submitted to RBM";
                        const pageSubmitted =
                          page.status === "Submitted to RBM";
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

              {/* ── Continue / Submitted action card ──────────────────── */}
              {isSubmitted ? (
                <div className='rounded-2xl border border-green-200 bg-green-50 p-6 flex items-center gap-4'>
                  <span className='text-3xl flex-shrink-0'>✅</span>
                  <div>
                    <p className='font-bold text-green-800'>Submitted to RBM</p>
                    <p className='text-xs text-green-600 mt-1'>
                      This ROI has been submitted for approval. All sections are
                      view-only.
                    </p>
                  </div>
                </div>
              ) : (
                <div
                  className={`rounded-2xl border p-6 flex items-center justify-between gap-4 ${
                    isAllComplete
                      ? "bg-green-50 border-green-200"
                      : "bg-indigo-50 border-indigo-200"
                  }`}>
                  <div>
                    <p className='font-bold text-gray-800'>
                      {isAllComplete
                        ? "🎉 All sections complete"
                        : `📍 Continue from Step ${firstIncompleteStep}`}
                    </p>
                    <p className='text-xs text-gray-500 mt-1'>
                      {isAllComplete
                        ? "Review all filled data and proceed to submit."
                        : "Saved fields are editable — Project Type, History ID & Ref Store are locked."}
                    </p>
                  </div>
                  <button
                    onClick={handleContinue}
                    disabled={continuing}
                    className={`flex-shrink-0 px-6 py-3 rounded-xl font-semibold text-sm shadow transition ${
                      continuing
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : isAllComplete
                        ? "bg-green-600 hover:bg-green-700 text-white"
                        : "bg-indigo-600 hover:bg-indigo-700 text-white"
                    }`}>
                    {continuing
                      ? "Loading…"
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
        <div className='fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4'>
          <div className='bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col'>
            {/* Modal header */}
            <div className='flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0'>
              <div>
                <h2 className='text-lg font-bold text-gray-900'>
                  {viewModal.pageName}
                </h2>
                <p className='text-xs text-gray-400 mt-0.5'>
                  ROI ID: {selectedRoi?.roiid}
                </p>
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
            <div className='flex-1 overflow-y-auto p-6'>
              {viewModal.loading ? (
                <div className='flex flex-col items-center justify-center h-40 gap-3'>
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
                  <span className='text-sm text-gray-500'>Loading data…</span>
                </div>
              ) : viewModal.data?.length > 0 ? (
                (() => {
                  const isHeaderFormat = "Header" in (viewModal.data[0] ?? {});
                  if (isHeaderFormat) {
                    return (
                      <div className='overflow-x-auto rounded-xl border border-gray-100'>
                        <table className='min-w-full border-collapse text-xs'>
                          <thead>
                            <tr className='bg-indigo-700 text-white'>
                              <th className='px-3 py-2 text-left font-semibold min-w-[200px]'>
                                Metric
                              </th>
                              {["Yr1", "Yr2", "Yr3", "Yr4", "Yr5", "Yr6"].map(
                                (y) => (
                                  <th
                                    key={y}
                                    className='px-3 py-2 text-right font-semibold'>
                                    {y}
                                  </th>
                                ),
                              )}
                            </tr>
                          </thead>
                          <tbody>
                            {viewModal.data.map((row, i) => (
                              <tr
                                key={i}
                                className={
                                  i % 2 === 0 ? "bg-white" : "bg-gray-50"
                                }>
                                <td className='px-3 py-2 font-medium text-gray-700 border-b border-gray-100'>
                                  {row.Header}
                                </td>
                                {["Yr1", "Yr2", "Yr3", "Yr4", "Yr5", "Yr6"].map(
                                  (y) => (
                                    <td
                                      key={y}
                                      className='px-3 py-2 text-right text-gray-600 border-b border-gray-100 tabular-nums'>
                                      {row[y] !== null && row[y] !== undefined
                                        ? row[y]
                                        : "—"}
                                    </td>
                                  ),
                                )}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    );
                  }
                  return (
                    <div className='space-y-3'>
                      {viewModal.data.map((row, rowIdx) => {
                        const entries = Object.entries(row).filter(
                          ([, v]) => v !== null && v !== undefined && v !== "",
                        );
                        if (!entries.length) return null;
                        return (
                          <div
                            key={rowIdx}
                            className='bg-gray-50 rounded-xl p-4'>
                            {viewModal.data.length > 1 && (
                              <p className='text-[10px] text-gray-400 font-semibold uppercase tracking-wide mb-3'>
                                Record {rowIdx + 1}
                              </p>
                            )}
                            <div className='grid grid-cols-2 sm:grid-cols-3 gap-3'>
                              {entries.map(([key, value]) => (
                                <div key={key}>
                                  <p className='text-[10px] font-semibold text-gray-400 uppercase tracking-wide'>
                                    {key.replace(/_/g, " ")}
                                  </p>
                                  <p className='text-sm font-medium text-gray-800 mt-0.5 break-all'>
                                    {typeof value === "object"
                                      ? JSON.stringify(value)
                                      : String(value)}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()
              ) : (
                <div className='flex flex-col items-center justify-center h-40 text-gray-400'>
                  <p className='text-4xl mb-2'>📭</p>
                  <p className='text-sm font-medium'>
                    No data found for this page
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
