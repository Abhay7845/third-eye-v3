import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { FiFileText, FiGrid, FiExternalLink } from "react-icons/fi";
import { BASE_URL } from "./Forms/data/baseUrl";
import RoiPdfReport from "./Forms/RoiPdfReport";
import RoiSummaryExcelDownload from "./Forms/RoiSummaryExcelDownload";
import { routes } from "../../../routes";
// Shared "ROI_IRR_Details" view (same layout the ABM saw on Summary.jsx when
// submitting) — also used by HistoryPage.jsx so both roles see it identically.
import { buildFinalSummaryView, FinalSummaryContent } from "./FinalSummaryView";

// ─── Page definitions ─────────────────────────────────────────────────────────
const PAGES = [
  { name: "Basic Store Details", group: "Store Setup", icon: "🏪" },
  { name: "Store Retail Specifications", group: "Store Setup", icon: "📋" },
  { name: "Sales Planning - Ref Store Code Details", group: "Sales Planning", icon: "🔗" },
  { name: "Sales Planning - Sales Summary", group: "Sales Planning", icon: "📈" },
  { name: "Sales Planning - Stock Summary - Phase 1", group: "Sales Planning", icon: "📦" },
  { name: "Sales Planning - Stock Summary - Phase 2", group: "Sales Planning", icon: "📦" },
  { name: "Sales Planning - Discount", group: "Sales Planning", icon: "🏷️" },
  { name: "Capex Expenses", group: "Expense Planning", icon: "🏗️" },
  { name: "Resource Expenses", group: "Expense Planning", icon: "👥" },
  { name: "Other Expenses", group: "Expense Planning", icon: "📝" },
  { name: "Summary Expenses", group: "Expense Planning", icon: "💼" },
  { name: "ROI_IRR_Details", group: "ROI_IRR_Details", icon: "📊" },
];

const GROUP_COLORS = {
  "Store Setup": "bg-blue-50 text-blue-700 border-blue-200",
  "Sales Planning": "bg-green-50 text-green-700 border-green-200",
  "Expense Planning": "bg-amber-50 text-amber-700 border-amber-200",
  "ROI_IRR_Details": "bg-indigo-50 text-indigo-700 border-indigo-200",
};

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CFG = {
  "Pending": { bg: "bg-green-100", text: "text-green-700", dot: "bg-green-500", label: "Completed" },
  // legacy strings
  "Submitted to RBM": { bg: "bg-blue-100", text: "text-blue-700", dot: "bg-blue-500", label: "Submitted" },
  "Approved": { bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-500", label: "Approved" },
  "Rejected": { bg: "bg-red-100", text: "text-red-700", dot: "bg-red-500", label: "Rejected" },
  "Changes Required": { bg: "bg-amber-100", text: "text-amber-700", dot: "bg-amber-500", label: "Changes Required" },
  "Not Available": { bg: "bg-gray-100", text: "text-gray-500", dot: "bg-gray-400", label: "Not Filled" },
  // new status strings
  "Submitted_toRBM": { bg: "bg-blue-100", text: "text-blue-700", dot: "bg-blue-500", label: "Submitted to RBM" },
  "BPM_Requestraised": { bg: "bg-purple-100", text: "text-purple-700", dot: "bg-purple-500", label: "BPM Request Raised" },
};

// Dynamic fallback for pattern-based statuses (Approved_by*, Rejected_by*, SK_by*)
const getCfg = (s) => {
  if (!s) return STATUS_CFG["Not Available"];
  if (STATUS_CFG[s]) return STATUS_CFG[s];
  if (s.startsWith("Approved_by")) return { bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-500", label: `Approved \u2713` };
  if (s.startsWith("Rejected_by")) return { bg: "bg-red-100", text: "text-red-700", dot: "bg-red-500", label: "Rejected" };
  if (s.startsWith("SK_by")) return { bg: "bg-amber-100", text: "text-amber-700", dot: "bg-amber-500", label: "Clarification Sought" };
  return STATUS_CFG["Not Available"];
};

function StatusBadge({ status, size = "sm" }) {
  const cfg = getCfg(status);
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-semibold whitespace-nowrap ${size === "sm" ? "text-xs" : "text-sm"} ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function daysAgo(dateStr) {
  if (!dateStr) return null;
  const d = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000);
  if (d <= 0) return "Today";
  if (d === 1) return "1 day ago";
  return `${d} days ago`;
}

function formatLabel(key) {
  return key.replace(/_/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

function formatValue(v) {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (typeof v === "object") return null;
  const n = parseFloat(v);
  if (!isNaN(n) && String(v).trim() !== "") return n.toLocaleString("en-IN", { maximumFractionDigits: 1 });
  return String(v);
}

const HIDDEN = new Set(["roiid", "roi_id", "status", "inserted_date", "updated_date", "username", "created_date", "annual cost escalation"]);
// Case-insensitive membership check — some procs return these columns in
// Title Case (e.g. Resource Expenses: "Status", "Inserted_date", "Updated_date")
// instead of the lowercase/snake_case form `HIDDEN` lists, which a plain
// `HIDDEN.has(k)` would silently miss and leak into the "View" table.
const isHiddenKey = (k) => HIDDEN.has(String(k ?? "").toLowerCase());

// ─── PageCard ─────────────────────────────────────────────────────────────────
// Card grid (not an accordion) — every page's primary action is visible at a
// glance without an extra click to expand each row. Per-page status isn't
// shown here — it's already surfaced once via the overall ROI status badge
// in the header above, and was otherwise identical on nearly every card.
function PageCard({ page, onViewData, restricted }) {
  const groupCls = GROUP_COLORS[page.group] ?? "bg-gray-50 text-gray-600 border-gray-200";
  const grad = GROUP_GRADIENT[page.group] ?? "from-slate-500 to-slate-600";
  return (
    <div className="group bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 overflow-hidden flex flex-col">
      <div className={`h-1.5 bg-gradient-to-r ${grad}`} />
      <div className="p-4 flex-1 flex flex-col gap-3">
        <div className="flex items-start gap-3">
          <span className="text-2xl shrink-0 leading-none mt-0.5">{page.icon}</span>
          <div className="min-w-0 flex-1">
            <p className="font-bold text-sm text-slate-800 leading-snug" title={page.name}>{page.name}</p>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border mt-1.5 inline-block ${groupCls}`}>{page.group}</span>
          </div>
        </div>
        <div className="mt-auto pt-1">
          {restricted ? (
            <span
              className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 bg-slate-50 text-slate-400 text-xs font-semibold rounded-lg border border-slate-200"
              title="Discount details are visible to Commercial and above only">
              🔒 Commercial and above only
            </span>
          ) : (
            <button type="button" onClick={onViewData}
              className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white text-xs font-bold rounded-lg transition border border-indigo-200 hover:border-indigo-600">
              🔍 View Page Data
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Page Data Modal ──────────────────────────────────────────────────────────
const GROUP_GRADIENT = {
  "Store Setup": "from-blue-600 to-cyan-600",
  "Sales Planning": "from-emerald-600 to-green-700",
  "Expense Planning": "from-amber-500 to-orange-600",
  "ROI_IRR_Details": "from-indigo-600 to-purple-700",
};

const YEARS = ["Yr 1", "Yr 2", "Yr 3", "Yr 4", "Yr 5", "Yr 6"];

// Detect comma-separated numeric strings used for 6-year projections
function parseYearly(val) {
  if (typeof val !== "string") return null;
  const parts = val.split(",");
  if (parts.length < 3) return null;
  const nums = parts.map(p => { const n = parseFloat(p.trim()); return isNaN(n) ? null : n; });
  return nums.some(n => n === null) ? null : nums;
}

const fmtN = (n) =>
  n === null || n === undefined || isNaN(n) ? "—"
    : Number(n).toLocaleString("en-IN", { maximumFractionDigits: 1 });

// 1-decimal percentage value — the DB already stores these as the percent
// number itself (e.g. 70.10 means 70.1%, not a 0-1 fraction).
const fmtPctN = (n) =>
  n === null || n === undefined || isNaN(n) ? "—" : `${fmtN(n)}%`;

// Groups Sales Planning Stock Summary Phase 1/2 rows into the same sections
// shown on Subpage3_3.jsx (Pricing Metrics / Stock Turn / Stock / Stock UCP
// Terms / Stock Turn Brand Guidelines) instead of one flat Header/Yr table.
// Row tuples are [rawKey, label, isPercent].
const STOCK_SUMMARY_SECTIONS = {
  "Sales Planning - Stock Summary - Phase 1": [
    { title: "Pricing Metrics", prefix: "Pricing Metrics_", rows: [
        ["BaseRate", "Retail Gold Rate – 22K (in Rs)", false],
        ["LCG", "LCG AMC%", true],
        ["MCG", "MCG AMC%", true],
        ["HCG", "HCG AMC%", true],
        ["Gemstones", "Gemstones AMC%", true],
        ["PlaingroupAMC%", "Plain Group AMC%", true],
        ["Coins AMC%", "Coins AMC%", true],
      ] },
  ],
  "Sales Planning - Stock Summary - Phase 2": [
    { title: "Stock Turn (UCP Terms)", prefix: "Stock turn_", test: (h) => h?.startsWith("Stock turn_") },
    { title: "Stock", prefix: "Stock_", test: (h) => h?.startsWith("Stock_") && !h.startsWith("Stock_UCP_") },
    { title: "Stock (UCP Terms - ₹ Lakhs)", prefix: "Stock_UCP_", test: (h) => h?.startsWith("Stock_UCP_") },
    { title: "Stock Turn - Brand Guidelines", prefix: "Stockturn-Brandguide_", test: (h) => h?.startsWith("Stockturn-Brandguide_") },
  ],
};
const ROW_ORDER = ["plain", "studded", "coins", "total"];
const rowRank = (label) => {
  const l = label.toLowerCase();
  const idx = ROW_ORDER.findIndex((k) => l.includes(k));
  return idx === -1 ? ROW_ORDER.length : idx;
};
const normStockKey = (s) => (s ?? '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').replace(/\.$/, '').trim().toLowerCase();

function StockSummarySectionedContent({ pageName, rows }) {
  const sections = STOCK_SUMMARY_SECTIONS[pageName] ?? [];
  return (
    <div className="p-6 space-y-5">
      {sections.map((section) => {
        const { title, prefix } = section;
        const sectionRows = section.rows
          ? section.rows
              .map(([key, label, isPct]) => {
                const r = rows.find((d) => d.Header?.startsWith(prefix) && normStockKey(d.Header.slice(prefix.length)) === normStockKey(key));
                return r ? { ...r, _label: label, _pct: !!isPct } : null;
              })
              .filter(Boolean)
          : rows
              .filter((r) => section.test(r.Header))
              .map((r) => ({ ...r, _label: r.Header.slice(prefix.length), _pct: false }))
              .sort((a, b) => rowRank(a._label) - rowRank(b._label));
        if (!sectionRows.length) return null;
        return (
          <div key={title} className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
            <div className="px-4 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600">
              <h4 className="text-xs font-black text-white uppercase tracking-widest">{title}</h4>
            </div>
            <table className="min-w-full border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100">
                  <th className="px-3 py-2.5 text-left font-bold text-slate-500 min-w-[180px]">Metric</th>
                  {YEARS.map((y) => (
                    <th key={y} className="px-3 py-2.5 text-right font-bold text-slate-500 min-w-[90px]">{y}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sectionRows.map((row, i) => {
                  const tot = row._label.toLowerCase().includes("total");
                  const fmt = row._pct ? fmtPctN : fmtN;
                  return (
                    <tr key={i} className={tot ? "bg-amber-50" : i % 2 === 0 ? "bg-white" : "bg-slate-50/60"}>
                      <td className={`px-3 py-2 border-b border-slate-100 ${tot ? "font-bold text-amber-900" : "font-medium text-slate-700"}`}>{row._label}</td>
                      {[1, 2, 3, 4, 5, 6].map((n) => (
                        <td key={n} className={`px-3 py-2 text-right border-b border-slate-100 tabular-nums ${tot ? "font-bold text-amber-800" : "text-slate-700"}`}>
                          {row[`Yr${n}`] != null ? fmt(row[`Yr${n}`]) : "—"}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}

// Groups Sales Planning Sales Summary rows into the same sections shown on
// Subpage3_2.jsx (Sales Planning / Sales Mix % / Plain Sales Mix % / Studded
// Sales Mix %) instead of one flat Header/Yr table. Row tuples are
// [rawKey, label, isPercent].
const SALES_SUMMARY_SECTIONS = [
  { title: 'Sales Planning', rows: [
      ['Total Area  ( SBA )', 'Total Area (SBA)', false],
      ['Total Area - Carpet Sqft.', 'Total Area – Carpet Sqft.', false],
      ['Walk-in per day', 'Walk-in per day', false],
      ['Increase in Wallk ins per day', 'Increase in Walk-ins % per day', true],
      ['Conv.%', 'Conv. %', true],
      ['Buyers per day', 'Buyers per day', false],
      ['Average Ticket Size (Rs)', 'Average Ticket Size (Rs)', false],
      ['Growth in Ticket Size', 'Growth in Ticket Size %', true],
      ['No. of store days in a year', 'No. of store days in a year', false],
      ['Total Sales', 'Total Sales (in Lakhs)', false],
      ['Sales Growth %', 'Sales Growth %', true],
    ]},
  { title: 'Sales Mix %', rows: [
      ['Plain Share', 'Plain Share %', true],
      ['Studded Share', 'Studded Share %', true],
      ['Coins /Silver Share', 'Coins / Silver Share %', true],
      ['Total share', 'Total Share %', true],
    ]},
  { title: 'Plain Sales Mix %', rows: [
      ['LCG', 'LCG %', true],
      ['MCG', 'MCG %', true],
      ['HCG', 'HCG %', true],
      ['Gemstones', 'Gemstones %', true],
      ['Total plain mix', 'Total Plain Mix %', true],
      ['Stoneshare(HCG only)', 'Stone Share in Plain (HCG only) %', true],
    ]},
  { title: 'Studded Sales Mix %', rows: [
      ['GIS', 'GIS %', true],
      ['Regular', 'Regular %', true],
      ['Solitaire A(<70C)', 'Solitaire A (<70C) %', true],
      ['Solitaire B(70-100C)', 'Solitaire B (70–100C) %', true],
      ['Solitaire C(1CRT+)', 'Solitaire C (1 CRT+) %', true],
      ['Solitaire D(2CRT+)', 'Solitaire D (2 CRT+) %', true],
      ['Totalstuddedmix', 'Total Studded Mix %', true],
    ]},
];
// Robust match against DB header quirks (trailing period, HTML-encoded "<", prefix)
const normSalesKey = (s) => (s ?? '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').replace(/\.$/, '').trim().toLowerCase();
const stripSalesPrefix = (h) => (h ?? '').replace(/^Sales Planning_/, '');

function SalesSummarySectionedContent({ rows }) {
  const findRow = (key) => rows.find((r) => normSalesKey(stripSalesPrefix(r.Header)) === normSalesKey(key));
  const usedHeaders = new Set();
  const renderSection = (title, sectionRows) => {
    if (!sectionRows.length) return null;
    return (
      <div key={title} className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
        <div className="px-4 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600">
          <h4 className="text-xs font-black text-white uppercase tracking-widest">{title}</h4>
        </div>
        <table className="min-w-full border-collapse text-xs">
          <thead>
            <tr className="bg-slate-100">
              <th className="px-3 py-2.5 text-left font-bold text-slate-500 min-w-[200px]">Metric</th>
              {YEARS.map((y) => (
                <th key={y} className="px-3 py-2.5 text-right font-bold text-slate-500 min-w-[90px]">{y}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sectionRows.map(({ label, row, isPct }, i) => {
              const tot = label.toLowerCase().includes('total');
              const fmt = isPct ? fmtPctN : fmtN;
              return (
                <tr key={i} className={tot ? "bg-amber-50" : i % 2 === 0 ? "bg-white" : "bg-slate-50/60"}>
                  <td className={`px-3 py-2 border-b border-slate-100 ${tot ? "font-bold text-amber-900" : "font-medium text-slate-700"}`}>{label}</td>
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <td key={n} className={`px-3 py-2 text-right border-b border-slate-100 tabular-nums ${tot ? "font-bold text-amber-800" : "text-slate-700"}`}>
                      {row[`Yr${n}`] != null ? fmt(row[`Yr${n}`]) : "—"}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  const sectionsRendered = SALES_SUMMARY_SECTIONS.map(({ title, rows: defs }) => {
    const resolved = defs
      .map(([key, label, isPct]) => {
        const row = findRow(key);
        if (!row) return null;
        usedHeaders.add(row.Header);
        return { label, row, isPct };
      })
      .filter(Boolean);
    return renderSection(title, resolved);
  });
  const otherRows = rows
    .filter((r) => !usedHeaders.has(r.Header))
    .map((r) => ({ label: stripSalesPrefix(r.Header), row: r, isPct: false }));

  return (
    <div className="p-6 space-y-5">
      {sectionsRendered}
      {renderSection('Other', otherRows)}
    </div>
  );
}

// Groups Discount rows into the same sections shown on Subpage3_4.jsx (Total
// Customer Discount / Total GHS Discount) instead of one flat Header/Yr table.
// Row tuples are [rawKey, label, isPercent].
const DISCOUNT_ROWS = [
  ['LCG', 'LCG', false], ['MCG', 'MCG', false], ['HCG', 'HCG', false], ['Gemstones', 'Gemstones', false],
  ['GIS', 'GIS', false], ['Regular', 'Regular', false],
  ['Solitaire A(<70C)', 'Solitaire A (<70C)', false],
  ['Solitaire B(70-100C)', 'Solitaire B (70–100C)', false],
  ['Solitaire C(1CRT+)', 'Solitaire C (1 CRT+)', false],
  ['Solitaire D(2CRT+)', 'Solitaire D (2 CRT+)', false],
  ['Coins', 'Coins', false],
  ['Total', 'Total', false],
  ['% of UCP', '% of UCP', true],
];
const DISCOUNT_SECTIONS = [
  { title: 'Total Customer Discount', prefix: 'TCD_', rows: DISCOUNT_ROWS },
  { title: 'Total GHS Discount', prefix: 'TGHSD_', rows: DISCOUNT_ROWS },
];

function DiscountSectionedContent({ rows }) {
  const usedHeaders = new Set();
  const isHighlight = (label) => /total|% of ucp/i.test(label);
  const renderSection = (title, sectionRows) => {
    if (!sectionRows.length) return null;
    return (
      <div key={title} className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
        <div className="px-4 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600">
          <h4 className="text-xs font-black text-white uppercase tracking-widest">{title}</h4>
        </div>
        <table className="min-w-full border-collapse text-xs">
          <thead>
            <tr className="bg-slate-100">
              <th className="px-3 py-2.5 text-left font-bold text-slate-500 min-w-[200px]">Category</th>
              {YEARS.map((y) => (
                <th key={y} className="px-3 py-2.5 text-right font-bold text-slate-500 min-w-[90px]">{y}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sectionRows.map(({ label, row, isPct }, i) => {
              const hl = isHighlight(label);
              const fmt = isPct ? fmtPctN : fmtN;
              return (
                <tr key={i} className={hl ? "bg-amber-50" : i % 2 === 0 ? "bg-white" : "bg-slate-50/60"}>
                  <td className={`px-3 py-2 border-b border-slate-100 ${hl ? "font-bold text-amber-900" : "font-medium text-slate-700"}`}>{label}</td>
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <td key={n} className={`px-3 py-2 text-right border-b border-slate-100 tabular-nums ${hl ? "font-bold text-amber-800" : "text-slate-700"}`}>
                      {row[`Yr${n}`] != null ? fmt(row[`Yr${n}`]) : "—"}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  const sectionsRendered = DISCOUNT_SECTIONS.map(({ title, prefix, rows: defs }) => {
    const resolved = defs
      .map(([key, label, isPct]) => {
        const row = rows.find((d) => d.Header?.startsWith(prefix) && normStockKey(d.Header.slice(prefix.length)) === normStockKey(key));
        if (!row) return null;
        usedHeaders.add(row.Header);
        return { label, row, isPct };
      })
      .filter(Boolean);
    return renderSection(title, resolved);
  });
  const otherRows = rows
    .filter((r) => !usedHeaders.has(r.Header))
    .map((r) => ({ label: r.Header, row: r, isPct: false }));

  return (
    <div className="p-6 space-y-5">
      {sectionsRendered}
      {renderSection('Other', otherRows)}
    </div>
  );
}

// Groups flat single-row pages into logical sections — mirrors HistoryPage.jsx's
// PAGE_SECTIONS mapping so both views present the same fields the same way.
const PAGE_SECTIONS = {
  "Basic Store Details": [
    { title: "Project", keys: ["project_type", "ty_history_id", "history_id", "TY_historyID"] },
    { title: "Location", keys: ["city", "state", "region", "new_city"] },
    { title: "Store Format", keys: ["existing_store_code", "existing_store_format", "store_format_change", "new_store_format", "store_type", "retail_area"] },
    { title: "Franchise Details", keys: ["new_franchise", "new_franchisee_storename", "new_franchisee_storecode", "existing_franchisee_store_name", "existing_franchisee_store_code", "franchisee_ba_iat_score", "partner_db_status", "partner_score"] },
  ],
  "Store Retail Specifications": [
    { title: "Store Type & Areas", keys: ["store_type", "existing_overall_area_SBA", "existing_retail_area", "new_over_all_area_SBA", "new_retail_area", "no_of_floors", "floor_plate"] },
    { title: "Architecture", keys: ["frontage", "ceiling_height", "facade_led", "terrace_branding", "totem_pole", "display_type", "flooring_type", "floors_for_facade"] },
    { title: "Facilities", keys: ["cashier_count", "karatmeter_count", "strong_room", "franchise_room", "manager_room", "conference_room", "pvr_room", "additional_workstation", "regional_service_centre"] },
    { title: "Notes", keys: ["remarks"] },
  ],
  "Capex Expenses": [
    { title: "Store Reference", keys: ["Flooring Type", "Property type", "Retail Area"] },
    { title: "Capex Items", keys: ["Interiors", "Additional Civil Works", "Corner Property Work", "Lift Installation", "Increase Façade Height per Floor", "EHV zone addition (Furniture & Interior)", "DxC (Equipment and Interiors)", "Art and Crafts(Type 1 (Crafts)", "Art and Crafts(Type 2 (Crafts)", "Art and Crafts(Type 3 (Crafts)", "LED Screen", "Solar Installation", "Engraving Machine"] },
    { title: "IT Equipment", keys: ["IT (Equipments and Installation)"] },
    { title: "Other Items", keys: ["Other Expenses"] },
    { title: "Totals", keys: ["Total capex", "Rate /Sqft"] },
  ],
  "Other Expenses": [
    { title: "Salary Stats", keys: ["Sqft/emp", "Cost/emp"] },
    { title: "Electricity", keys: ["Electricity_Rate/sqft", "Electricity_Total"] },
    { title: "Registration & Relocation", keys: ["Registration Charges", "Temp_cost"] },
  ],
};

// ─ Renders one object row split into scalar fields + 6-year projection table
function SingleRowContent({ row, pageName }) {
  const simple = [], yearly = [], nested = [];
  for (const [k, v] of Object.entries(row)) {
    if (isHiddenKey(k)) continue;
    if (typeof v === "object" && v !== null) { nested.push({ key: k, value: v }); continue; }
    const yv = parseYearly(String(v ?? ""));
    if (yv) yearly.push({ key: k, values: yv });
    else simple.push({ key: k, value: v });
  }
  return (
    <div className="p-6 space-y-8">
      {/* Scalar fields — grouped into named sections when a mapping exists for this page */}
      {simple.length > 0 && (() => {
        const sectionDefs = PAGE_SECTIONS[pageName];
        if (!sectionDefs) {
          return (
            <section>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 pb-1.5 border-b border-slate-200">
                📋 Field Values
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {simple.map(({ key, value }) => {
                  const fv = formatValue(value);
                  const isNum = !isNaN(parseFloat(value)) && String(value ?? "").trim() !== "";
                  return (
                    <div key={key} className="bg-slate-50 hover:bg-white rounded-xl border border-slate-100 hover:border-indigo-200 hover:shadow-sm transition p-3">
                      <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1 leading-tight">{formatLabel(key)}</p>
                      <p className={`text-sm font-bold break-words leading-snug ${isNum ? "text-indigo-700" : "text-slate-800"}`}>{fv ?? "—"}</p>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        }
        const byKey = Object.fromEntries(simple.map((f) => [f.key, f]));
        const usedKeys = new Set();
        const fieldCard = ({ key, value }) => {
          const fv = formatValue(value);
          const isNum = !isNaN(parseFloat(value)) && String(value ?? "").trim() !== "";
          return (
            <div key={key} className="bg-white rounded-xl border border-slate-100 p-3">
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1 leading-tight">{formatLabel(key)}</p>
              <p className={`text-sm font-bold break-words leading-snug ${isNum ? "text-indigo-700" : "text-slate-800"}`}>{fv ?? "—"}</p>
            </div>
          );
        };
        return (
          <div className="space-y-4">
            {sectionDefs.map(({ title, keys }) => {
              const fields = keys.map((k) => byKey[k]).filter(Boolean);
              if (!fields.length) return null;
              fields.forEach((f) => usedKeys.add(f.key));
              return (
                <section key={title} className="rounded-xl border border-slate-200 overflow-hidden">
                  <div className="px-4 py-2.5 bg-gradient-to-r from-[#1e3a5f] to-[#2d5f8a]">
                    <h4 className="text-xs font-black text-white uppercase tracking-widest">{title}</h4>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-px bg-slate-100 p-px">
                    {fields.map(fieldCard)}
                  </div>
                </section>
              );
            })}
            {(() => {
              const rem = simple.filter((f) => !usedKeys.has(f.key));
              return rem.length > 0 ? (
                <section className="rounded-xl border border-slate-200 overflow-hidden">
                  <div className="px-4 py-2.5 bg-slate-100">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Other</h4>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-px bg-slate-100 p-px">
                    {rem.map(fieldCard)}
                  </div>
                </section>
              ) : null;
            })()}
          </div>
        );
      })()}

      {/* 6-year projection table */}
      {yearly.length > 0 && (
        <section>
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 pb-1.5 border-b border-slate-200">
            📈 6-Year Projections
          </h4>
          <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
            <table className="min-w-full border-collapse text-xs">
              <thead>
                <tr className="bg-indigo-700 text-white">
                  <th className="px-4 py-2.5 text-left font-bold min-w-[200px]">Parameter</th>
                  {YEARS.map(yr => (
                    <th key={yr} className="px-4 py-2.5 text-right font-bold min-w-[90px]">{yr}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {yearly.map(({ key, values }, idx) => (
                  <tr key={key} className={idx % 2 === 0 ? "bg-white" : "bg-indigo-50"}>
                    <td className="px-4 py-2 font-semibold text-slate-700 border-b border-slate-100">{formatLabel(key)}</td>
                    {YEARS.map((_, i) => (
                      <td key={i} className="px-4 py-2 text-right font-bold text-indigo-700 border-b border-slate-100">
                        {values[i] !== undefined ? fmtN(values[i]) : "—"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Nested objects (e.g. JSON blobs) */}
      {nested.map(({ key, value }) => (
        <section key={key}>
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 pb-1.5 border-b border-slate-200">
            📌 {formatLabel(key)}
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {typeof value === "object" && !Array.isArray(value)
              ? Object.entries(value)
                .filter(([k]) => !isHiddenKey(k))
                .map(([k, v]) => {
                  const fv = formatValue(v);
                  return fv === null ? null : (
                    <div key={k} className="bg-amber-50 rounded-xl border border-amber-100 p-3">
                      <p className="text-xs text-amber-600 font-semibold uppercase tracking-wide mb-1">{formatLabel(k)}</p>
                      <p className="text-sm font-bold text-slate-800 break-words">{fv}</p>
                    </div>
                  );
                })
              : <p className="text-sm text-slate-500 col-span-3">{JSON.stringify(value)}</p>
            }
          </div>
        </section>
      ))}
    </div>
  );
}

// ─ Renders multiple rows as a scrollable table (e.g. RESOURCE expenses, one row per role)
function MultiRowContent({ rows }) {
  // Role/Level/count up front, money figures next, status/dates last.
  const PREFERRED_ORDER = [
    "Role", "Level", "No_of_Resource", "Commercial Ref salary",
    "Monthly Fixed", "Annual Fixed", "Variable Component",
    "Annual Variable", "Annual Total", "Status", "Inserted_date", "Updated_date",
  ];
  const rawKeys = [...new Set(rows.flatMap(r => Object.keys(r)))].filter(k => !isHiddenKey(k));
  const allKeys = [
    ...PREFERRED_ORDER.filter(k => rawKeys.includes(k)),
    ...rawKeys.filter(k => !PREFERRED_ORDER.includes(k)),
  ];
  const isDateCol = (k) => /date/i.test(k);
  const NON_SUMMABLE = /variable component|%|rate|level|status/i;
  const isNumericCol = (k) => !isDateCol(k) && rows.some(r => { const v = r[k]; return v != null && v !== "" && !parseYearly(String(v ?? "")) && !isNaN(parseFloat(v)); });
  const isSummableCol = (k) => isNumericCol(k) && !NON_SUMMABLE.test(k);
  const colTotal = (k) => rows.reduce((s, r) => s + (parseFloat(r[k]) || 0), 0);
  // Columns whose own name already signals a percentage (e.g. "Annual cost
  // escalation" on Expense Summary rows) get the '%' appended to the value
  // itself too, not just the header.
  const isPctCol = (k) => /escalation/i.test(k) || k.trim().endsWith("%");

  return (
    <div className="p-6">
      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 pb-1.5 border-b border-slate-200">
        📋 {rows.length} Record{rows.length !== 1 ? "s" : ""}
      </p>
      <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
        <table className="min-w-full border-collapse text-xs">
          <thead>
            <tr className="bg-amber-600 text-white">
              <th className="px-3 py-2.5 text-left font-bold w-8 sticky left-0 bg-amber-600 z-10">#</th>
              {allKeys.map(k => (
                <th key={k} className={`px-3 py-2.5 font-bold whitespace-nowrap ${isNumericCol(k) ? "text-right" : "text-left"}`}>{formatLabel(k)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={idx} className={idx % 2 === 0 ? "bg-white hover:bg-amber-50" : "bg-amber-50/50 hover:bg-amber-50"}>
                <td className="px-3 py-2 text-slate-400 font-bold border-b border-slate-100 sticky left-0 bg-inherit z-10">{idx + 1}</td>
                {allKeys.map(k => {
                  const v = row[k];
                  const yv = !isDateCol(k) && parseYearly(String(v ?? ""));
                  const display = yv
                    ? yv.slice(0, 6).map(n => fmtN(n)).join(" │ ")
                    : (isNumericCol(k) && isPctCol(k) ? fmtPctN(parseFloat(v)) : (formatValue(v) ?? "—"));
                  const isNum = !yv && isNumericCol(k) && !isNaN(parseFloat(v)) && String(v ?? "").trim() !== "";
                  return (
                    <td key={k} className={`px-3 py-2 border-b border-slate-100 whitespace-nowrap ${isNum ? "text-right tabular-nums text-indigo-700 font-bold" : "text-slate-700"}`}>
                      {display}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
          {allKeys.some(isSummableCol) && (
            <tfoot>
              <tr className="bg-amber-100 font-bold text-amber-900">
                <td className="px-3 py-2.5 sticky left-0 bg-amber-100 z-10">Total</td>
                {allKeys.map(k => (
                  <td key={k} className="px-3 py-2.5 text-right tabular-nums">
                    {isSummableCol(k) ? fmtN(colTotal(k)) : ""}
                  </td>
                ))}
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}


// ROI_IRR_Details rich view (KPI cards + Income/Expense/Profit/Investment/Cash-
// Flow table) is now shared with HistoryPage.jsx — see FinalSummaryView.jsx.
// ─ Sales Planning - Ref Store Code Details: two-section layout mirroring
// Subpage3_1.jsx — Store Particulars (ref data) + Key Expenses, side by side.
const REF_PARTICULARS_FIELDS = [
  "Super Built Up Area", "Carpet area", "Sales", "Inventory",
  "Sales Plain share", "Sales Studded share", "Sales Coin Silver share",
  "Inventory Plain share", "Inventory Studded share",
  "Plain Stock Turns", "Studded Stock Turns",
  "LCG mix", "MCG mix", "HCG mix", "Btq AMC%", "City AMC%",
];
const REF_PARTICULARS_UNITS = {
  "Super Built Up Area": "sqft", "Carpet area": "sqft",
  Sales: "₹ [in Cr.]", Inventory: "₹ [in Cr.]",
  "Sales Plain share": "%", "Sales Studded share": "%", "Sales Coin Silver share": "%",
  "Inventory Plain share": "%", "Inventory Studded share": "%",
  "Plain Stock Turns": "×", "Studded Stock Turns": "×",
  "LCG mix": "%", "MCG mix": "%", "HCG mix": "%", "Btq AMC%": "%", "City AMC%": "%",
};
const REF_EXPENSE_FIELDS = [
  "Rent", "Staff Salaries", "Security & Housekeeping", "Electricity",
  "Repairs & Maintenance", "Insurance", "BTL", "Travel & Conveyance",
  "Telephone/Internet", "Credit Card Commission", "GST (primarily rental)",
  "Store - Printing/Pantry etc", "Consumables", "Other - Staff welfare/Uniforms etc",
];
// Column names returned by the view proc don't always match these human
// labels exactly — fall back to a case/punctuation-insensitive match that
// also treats the literal word "pct" as equivalent to a '%' sign (the DB
// column is e.g. `btq amc pct`, not `btq amc%`) — without this, "Btq/City
// AMC%" never resolved against their actual DB columns at all.
const normRefKey = (s) => String(s).toLowerCase().replace(/%/g, "").replace(/pct/g, "").replace(/[^a-z0-9]/g, "");
function getRefField(row, label) {
  if (row == null) return null;
  if (label in row) return row[label];
  const target = normRefKey(label);
  const k = Object.keys(row).find((key) => normRefKey(key) === target);
  return k !== undefined ? row[k] : null;
}
function asRefNum(v) {
  if (v && typeof v === "object") return parseFloat(v.monthly ?? v.value ?? 0) || 0;
  return parseFloat(v) || 0;
}

function RefStoreCodeContent({ row }) {
  const monthlyValues = REF_EXPENSE_FIELDS.map((f) => asRefNum(getRefField(row, f)));
  const totalMonthly = monthlyValues.reduce((s, v) => s + v, 0);
  const totalAnnual = totalMonthly * 12;

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left — Store Particulars (ref store data) */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col border border-slate-100">
          <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50/60 to-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">📊</span>
                <div>
                  <h3 className="text-base font-bold text-gray-800 leading-tight">Store Particulars</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Values sourced from the reference store</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-full whitespace-nowrap">
                🔒 Read only
              </span>
            </div>
          </div>
          <div className="grid grid-cols-[2fr_1fr_56px] gap-x-2 px-5 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide bg-gray-50 border-b border-gray-100">
            <span>Field</span>
            <span className="text-right">Value</span>
            <span className="text-center">Unit</span>
          </div>
          <div>
            {REF_PARTICULARS_FIELDS.map((field, i) => (
              <div key={field} className={`grid grid-cols-[2fr_1fr_56px] gap-x-2 items-center px-5 py-2 ${i % 2 === 0 ? "bg-white" : "bg-blue-50/40"}`}>
                <span className="text-sm font-semibold text-gray-700 truncate" title={field}>{field}</span>
                <span className="text-sm font-bold text-gray-800 text-right tabular-nums">
                  {formatValue(getRefField(row, field)) ?? "—"}
                </span>
                <span className="text-xs font-medium text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded text-center">
                  {REF_PARTICULARS_UNITS[field] ?? ""}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right — Key Expenses (benchmark expense data) */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col border border-slate-100">
          <div className="border-b border-gray-100 bg-gradient-to-r from-green-50/60 to-white">
            <div className="px-5 pt-4 pb-3 flex items-start justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="text-lg">💰</span>
                <div>
                  <h3 className="text-base font-bold text-gray-800 leading-tight">Key Expenses</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Monthly values saved for this ROI — annual is ×12</p>
                </div>
              </div>
              <div className="flex gap-2.5 text-xs text-gray-500 shrink-0 mt-0.5">
                <span className="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-200 rounded px-2 py-0.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-blue-200 inline-block" />
                  Monthly
                </span>
                <span className="inline-flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded px-2 py-0.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-gray-300 inline-block" />
                  Annual ×12
                </span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-[2fr_1fr_1fr] gap-x-2 px-5 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide bg-gray-50 border-b border-gray-100">
            <span>Expense</span>
            <span className="text-right">Monthly (₹)</span>
            <span className="text-right">Annual (₹)</span>
          </div>
          <div>
            {REF_EXPENSE_FIELDS.map((field, i) => {
              const monthly = asRefNum(getRefField(row, field));
              return (
                <div key={field} className={`grid grid-cols-[2fr_1fr_1fr] gap-x-2 items-center px-5 py-2 ${i % 2 === 0 ? "bg-white" : "bg-green-50/30"}`}>
                  <span className="text-sm font-semibold text-gray-700 truncate" title={field}>{field}</span>
                  <span className="text-sm text-right tabular-nums text-gray-800 font-semibold">{monthly > 0 ? fmtN(monthly) : "—"}</span>
                  <span className="text-sm text-right tabular-nums text-gray-600 font-semibold">{monthly > 0 ? fmtN(monthly * 12) : "—"}</span>
                </div>
              );
            })}
            <div className="grid grid-cols-[2fr_1fr_1fr] gap-x-2 px-5 py-2.5 bg-blue-100 border-t-2 border-blue-300">
              <span className="text-sm font-bold text-gray-800">Total</span>
              <span className="text-sm font-bold text-right text-blue-800 tabular-nums">{fmtN(totalMonthly)}</span>
              <span className="text-sm font-bold text-right text-blue-800 tabular-nums">{fmtN(totalAnnual)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PageDataModal({ pageName, data, loading, onClose, onNavigate, canViewDiscount = true }) {
  const pageInfo = PAGES.find(p => p.name === pageName);
  const grad = GROUP_GRADIENT[pageInfo?.group] ?? "from-indigo-600 to-blue-700";
  const isFinalSummary = pageName === "ROI_IRR_Details";
  // data is the full array of rows from the API
  const rows = Array.isArray(data) ? data : (data ? [data] : []);
  const totalFields = rows[0] ? Object.keys(rows[0]).filter(k => !isHiddenKey(k)).length : 0;
  const finalSummaryData = useMemo(
    () => (isFinalSummary ? buildFinalSummaryView(rows) : null),
    [isFinalSummary, rows]
  );

  // Discount is restricted to Commercial and above — excluded from the
  // navigable page list entirely (quick-jump pills + Prev/Next) so a
  // restricted viewer can't reach it even indirectly.
  const navigablePages = canViewDiscount ? PAGES : PAGES.filter(p => p.name !== "Sales Planning - Discount");
  // Sibling pages in the same group (Sales Planning / Expense Planning /
  // Store Setup) — still used for the quick-jump pill bar below the header.
  const groupPages = pageInfo ? navigablePages.filter(p => p.group === pageInfo.group) : [];
  const groupIndex = groupPages.findIndex(p => p.name === pageName);
  // Prev/Next in the footer walk the ENTIRE form (all sections, not just the
  // current one) so reaching the last page of a section (e.g. "Sales
  // Planning - Discount") moves straight into the next section's first page
  // ("Capex Expenses") instead of dead-ending — only disabled at the true
  // first/last page of the whole ROI.
  const globalIndex = navigablePages.findIndex(p => p.name === pageName);
  const prevPage = globalIndex > 0 ? navigablePages[globalIndex - 1] : null;
  const nextPage = globalIndex !== -1 && globalIndex < navigablePages.length - 1 ? navigablePages[globalIndex + 1] : null;
  const shortLabel = (n) => n.replace(/^.*?-\s*/, "");
  const isRefStoreCode = pageName === "Sales Planning - Ref Store Code Details";
  const isStockSummary = Object.prototype.hasOwnProperty.call(STOCK_SUMMARY_SECTIONS, pageName);
  const isSalesSummary = pageName === "Sales Planning - Sales Summary";
  const isDiscount = pageName === "Sales Planning - Discount";
  const [isMaximized, setIsMaximized] = useState(false);

  return (
    <div className={`fixed inset-0 bg-black/70 flex items-center justify-center z-50 ${isMaximized ? "p-0" : "p-4"}`}>
      <div className={`bg-white shadow-2xl w-full flex flex-col overflow-hidden ${isMaximized ? "h-full max-w-none max-h-none rounded-none" : "rounded-2xl max-w-7xl max-h-[95vh]"}`}>

        {/* Gradient header */}
        <div className={`bg-gradient-to-r ${grad} px-6 py-5 shrink-0`}>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-4xl drop-shadow">{pageInfo?.icon ?? "📄"}</span>
              <div className="min-w-0">
                <p className="text-white/60 text-xs font-semibold uppercase tracking-widest">
                  {pageInfo?.group}
                  {groupPages.length > 1 && ` · Section ${groupIndex + 1} of ${groupPages.length}`}
                  {` · Page ${globalIndex + 1} of ${navigablePages.length}`}
                </p>
                <h3 className="text-white font-bold text-xl leading-tight truncate">{pageName}</h3>
                {rows.length > 1 && <p className="text-white/60 text-xs mt-0.5">{rows.length} records</p>}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={() => setIsMaximized(m => !m)}
                title={isMaximized ? "Restore" : "Full screen"}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/35 text-white text-base transition">
                {isMaximized ? "🗗" : "⛶"}
              </button>
              <button onClick={onClose}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/35 text-white text-xl font-bold transition">
                ×
              </button>
            </div>
          </div>
        </div>

        {/* Section quick-jump bar — only for pages that belong to a multi-section group */}
        {groupPages.length > 1 && (
          <div className="flex items-center gap-2 px-6 py-2.5 border-b border-slate-100 bg-white shrink-0 overflow-x-auto">
            {groupPages.map((p, i) => (
              <button
                key={p.name}
                onClick={() => onNavigate?.(p.name)}
                title={p.name}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition shrink-0 ${
                  p.name === pageName
                    ? "bg-indigo-600 text-white shadow"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                }`}>
                <span>{p.icon}</span>
                <span className="hidden sm:inline">{i + 1}. {shortLabel(p.name)}</span>
              </button>
            ))}
          </div>
        )}

        {/* Body */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="animate-spin w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full" />
              <p className="text-slate-400 text-sm">Loading complete form data…</p>
            </div>
          ) : isFinalSummary ? (
            <FinalSummaryContent d={finalSummaryData} />
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
              <span className="text-5xl">📭</span>
              <p className="text-sm font-medium">No data submitted for this page yet.</p>
            </div>
          ) : isRefStoreCode ? (
            <RefStoreCodeContent row={rows[0]} />
          ) : isStockSummary ? (
            <StockSummarySectionedContent pageName={pageName} rows={rows} />
          ) : isSalesSummary ? (
            <SalesSummarySectionedContent rows={rows} />
          ) : isDiscount ? (
            <DiscountSectionedContent rows={rows} />
          ) : rows.length > 1 ? (
            <MultiRowContent rows={rows} />
          ) : (
            <SingleRowContent row={rows[0]} pageName={pageName} />
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex justify-between items-center gap-3 shrink-0">
          <button
            onClick={() => prevPage && onNavigate?.(prevPage.name)}
            disabled={!prevPage}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition truncate max-w-[32%] ${
              prevPage
                ? "bg-slate-200 text-slate-700 hover:bg-slate-300"
                : "bg-slate-100 text-slate-300 cursor-not-allowed"
            }`}>
            ← {prevPage ? shortLabel(prevPage.name) : "Previous"}
          </button>
          <p className="text-xs text-slate-400 hidden md:block whitespace-nowrap">
            {rows.length} record{rows.length !== 1 ? "s" : ""}
            {totalFields > 0 ? ` · ${totalFields} fields` : ""}
          </p>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => nextPage && onNavigate?.(nextPage.name)}
              disabled={!nextPage}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition truncate max-w-[180px] ${
                nextPage
                  ? "bg-indigo-600 text-white hover:bg-indigo-700"
                  : "bg-slate-100 text-slate-300 cursor-not-allowed"
              }`}>
              {nextPage ? shortLabel(nextPage.name) : "Next"} →
            </button>
            <button onClick={onClose}
              className="px-5 py-2 bg-slate-700 hover:bg-slate-800 text-white text-sm font-semibold rounded-lg transition">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Action Modal (Approve / Seek Clarification / Reject) ────────────────────
// Previous level each role sends clarification TO
const CLARIFY_TARGET = {
  "RBM":        "ABM",
  "COMMERCIAL":  "RBM",
  "ADMIN":       "Commercial",
  "RETAIL":      "Admin",
};

function ActionModal({ action, roiid, userRole, onConfirm, onCancel, loading }) {
  const [remark, setRemark] = useState("");
  const needsRemark = action === "clarify" || action === "reject";
  const clarifyTarget = CLARIFY_TARGET[userRole?.toUpperCase()] ?? "previous approver";

  const cfg = {
    approve: {
      grad: "from-emerald-600 to-green-700",
      btn: "bg-emerald-600 hover:bg-emerald-700",
      icon: "✓", label: "Approve",
      desc: `Confirm approval of ROI ${roiid}. It will be forwarded to the next approver.`,
    },
    clarify: {
      grad: "from-violet-600 to-indigo-700",
      btn: "bg-violet-600 hover:bg-violet-700",
      icon: "💬", label: `Seek Clarification from ${clarifyTarget}`,
      desc: `Add your remark below. It will be sent to ${clarifyTarget} for resolution.`,
      placeholder: `Describe what needs clarification from ${clarifyTarget}…`,
      remarkLabel: "Clarification Remark",
    },
    reject: {
      grad: "from-red-600 to-rose-700",
      btn: "bg-red-600 hover:bg-red-700",
      icon: "✗", label: "Reject",
      desc: `Provide a reason for rejecting ROI ${roiid}. The ABM will be notified.`,
      placeholder: "Explain why this ROI is being rejected…",
      remarkLabel: "Rejection Reason",
    },
  }[action];

  const canSubmit = !needsRemark || remark.trim().length > 0;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className={`bg-gradient-to-r ${cfg.grad} px-6 py-5`}>
          <div className="flex items-center gap-3">
            <span className="text-3xl">{cfg.icon}</span>
            <div>
              <h3 className="text-white font-bold text-lg">{cfg.label}</h3>
              <p className="text-white/60 text-xs mt-0.5">ROI: {roiid}</p>
            </div>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-600 leading-relaxed">{cfg.desc}</p>
          {needsRemark && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                {cfg.remarkLabel} <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={4}
                autoFocus
                maxLength={500}
                placeholder={cfg.placeholder}
                value={remark}
                onChange={e => setRemark(e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-300 resize-none"
              />
              <p className="text-xs text-slate-400 text-right">{remark.length} / 500</p>
            </div>
          )}
        </div>
        <div className="px-6 pb-6 flex gap-3">
          <button onClick={onCancel} disabled={loading}
            className="flex-1 px-4 py-2.5 border border-slate-300 rounded-xl text-slate-700 font-semibold text-sm hover:bg-slate-50 transition disabled:opacity-50">
            Cancel
          </button>
          <button onClick={() => onConfirm(remark)} disabled={loading || !canSubmit}
            className={`flex-1 px-4 py-2.5 text-white rounded-xl font-bold text-sm transition disabled:opacity-40 disabled:cursor-not-allowed ${cfg.btn}`}>
            {loading ? "Processing…" : cfg.label}
          </button>
        </div>
      </div>
    </div>
  );
}
// ─── New Store PDF Modal ──────────────────────────────────────────────────────────────────
// ─── TOT Section (Commercial role only) ────────────────────────────────────────────────────────────
const TOT_TABS = [
  { key: "Plain_TOT_Final", label: "Plain Final" },
  { key: "Studded_TOT_Final", label: "Studded Final" },
  { key: "Coins_TOT", label: "Coins" },
  { key: "Plain_TOT_Presummary", label: "Plain Pre-Summary" },
  { key: "Plain_TOT_yearwise_data", label: "Plain Yr-wise" },
  { key: "Studded_TOT_Yearwise_data", label: "Studded Yr-wise" },
  { key: "Studded_TOT_slabwise_data", label: "Studded Slab-wise" },
];

function TOTSection({ roiid, onClose }) {
  const [activeTab, setActiveTab] = useState("Plain_TOT_Final");
  const [totData, setTotData] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!roiid) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setTotData({});
      try {
        const results = await Promise.all(
          TOT_TABS.map(async ({ key }) => {
            const res = await fetch(
              `${BASE_URL}/tot_details/${encodeURIComponent(roiid)}?tot_type=${key}`
            );
            if (!res.ok) return [key, []];
            const json = await res.json();
            return [key, json.data ?? []];
          })
        );
        if (!cancelled) setTotData(Object.fromEntries(results));
      } catch (err) {
        console.error("TOT fetch error:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [roiid]);

  const rows = totData[activeTab] ?? [];
  const cols = rows.length > 0
    ? Object.keys(rows[0]).filter(k => k !== "roiid" && k !== "ROIID")
    : [];

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden">

        {/* Modal header */}
        <div className="bg-gradient-to-r from-violet-700 to-purple-600 px-6 py-5 shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-white font-bold text-xl">📊 TOT Analysis</h3>
              <p className="text-violet-200 text-xs mt-0.5">Turn-Over-Time details · ROI {roiid}</p>
            </div>
            <button onClick={onClose}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/35 text-white text-xl font-bold transition">
              ×
            </button>
          </div>

          {/* Tabs inside header */}
          <div className="flex gap-1 mt-4 overflow-x-auto">
            {TOT_TABS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`px-3 py-1.5 text-xs font-semibold whitespace-nowrap rounded-lg transition ${activeTab === key
                  ? "bg-white text-violet-700"
                  : "text-violet-200 hover:bg-white/20"
                  }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-auto p-5">
          {loading ? (
            <div className="flex items-center justify-center py-16 gap-3">
              <div className="animate-spin w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full" />
              <p className="text-slate-400 text-sm">Loading TOT data…</p>
            </div>
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
              <span className="text-4xl">📭</span>
              <p className="text-sm font-medium">TOT data not available for this section.</p>
              <p className="text-xs">Ensure the expense summary has been saved to trigger TOT computation.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="min-w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-violet-700 text-white">
                    {cols.map(col => (
                      <th key={col} className="px-3 py-2.5 text-left font-semibold whitespace-nowrap">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? "bg-white hover:bg-violet-50" : "bg-violet-50/40 hover:bg-violet-50"}>
                      {cols.map(col => (
                        <td key={col} className="px-3 py-2 text-slate-700 border-b border-slate-100 whitespace-nowrap">
                          {row[col] ?? "—"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
          <p className="text-xs text-slate-400">
            {rows.length > 0 ? `${rows.length} row${rows.length !== 1 ? "s" : ""} · ${cols.length} columns` : ""}
          </p>
          <button onClick={onClose}
            className="px-5 py-2 bg-slate-700 hover:bg-slate-800 text-white text-sm font-semibold rounded-lg transition">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
// ─── Main Component ───────────────────────────────────────────────────────────
export default function RBMDashboard({ userRole = "RBM" }) {
  const userLog = useSelector((state) => state?.user?.user);
  const navigate = useNavigate();
  // Sales Planning - Discount is only visible to Commercial and above in the
  // "View" screens (ABM never sees it here at all — HistoryPage.jsx hides it
  // unconditionally — and RBM is likewise excluded, one rung below Commercial
  // in the ABM → RBM → Commercial → Admin → Retail approval chain).
  const canViewDiscount = (userRole || "").toUpperCase() !== "RBM";

  // Left panel state
  const [roiList, setRoiList] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // Selected ROI state
  const [selectedRoi, setSelectedRoi] = useState(null);
  const [pageStatuses, setPageStatuses] = useState([]);
  const [pagesLoading, setPagesLoading] = useState(false);

  // Page data modal
  const [pageModal, setPageModal] = useState({ open: false, pageName: "", data: [], loading: false });

  // Action modal: 'approve' | 'clarify' | 'reject'
  const [confirmAction, setConfirmAction] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showTotModal, setShowTotModal] = useState(false);
  const [roiHistoryId, setRoiHistoryId] = useState(null);
  const [pdfLinkLoading, setPdfLinkLoading] = useState(false);

  // ── Fetch ROI list ─────────────────────────────────────────────────────────
  useEffect(() => {
    const username = userLog?.name;
    if (!username) return;
    (async () => {
      try {
        setListLoading(true);
        // Commercial sees all ROIs submitted to the commercial queue
        const url = userRole?.toUpperCase() === "COMMERCIAL"
          ? `${BASE_URL}/roi_id?username=Commercial` 
          : userRole?.toUpperCase() === "ADMIN"
          ? `${BASE_URL}/roi_id?username=sunilr`
          : userRole?.toUpperCase() === "Retail"
          ? `${BASE_URL}/roi_id?username=arun`
          : `${BASE_URL}/rbm_roi_id?username=${encodeURIComponent(username)}`;
        const res = await fetch(url);
        // Surface the backend's actual message (e.g. role-specific "No ROI
        // requests found...") instead of a hardcoded string that doesn't
        // reflect the real cause (network/server error vs. genuinely empty list).
        const json = await res.json().catch(() => null);
        if (!res.ok || json?.success === false) {
          throw new Error(json?.message || `Failed to load ROI list (HTTP ${res.status}).`);
        }
        const sorted = (json.data ?? []).slice().sort((a, b) =>
          (b.inserted_date ?? "").localeCompare(a.inserted_date ?? "")
        );
        setRoiList(sorted);
      } catch (err) {
        toast.error(err.message || "No ROI ID history found under your Login");
      } finally {
        setListLoading(false);
      }
    })();
  }, [userLog?.name, userRole]);

  // ── Select ROI ─────────────────────────────────────────────────────────────
  const handleSelectRoi = async (roi) => {
    const roiid = roi.roiid ?? roi.roi_id ?? roi.ROIID ?? "";
    if (selectedRoi?.roiid === roiid) return;
    setSelectedRoi({ ...roi, roiid });
    setPageStatuses([]);
    setRoiHistoryId(null);
    setPagesLoading(true);
    try {
      const summaryRes = await fetch(`${BASE_URL}/summary/${roiid}`);
      if (summaryRes.ok) {
        const json = await summaryRes.json();
        setPageStatuses(json.data ?? []);
      }
      // Screen-1 (Basic Store Details) is the source of truth for region/
      // store_format/project_type — the ROI list APIs don't reliably include
      // these, and sending them blank in the approve/reject/clarify payload
      // risks the backend's own auto-resolve coming up empty too (→ 403
      // "could not resolve the approval chain"). Always pull them here so
      // the action payload never has to guess. Also carries ty_history_id
      // for the New Store PDF button.
      const basicRes = await fetch(`${BASE_URL}/fetchScreen?parameter=roi_basic_store_details&roiid=${roiid}`);
      if (basicRes.ok) {
        const bj = await basicRes.json();
        const basic = bj.data?.[0] ?? {};
        // DB columns are actually `TY_historyID` / `exsisting_store_format` (both
        // misspelled/odd-cased on the backend) — "ty_history_id"/"existing_store_format"
        // never matched, so store_format silently stayed "" in the approve/reject/
        // clarify payload every time.
        setRoiHistoryId(basic.TY_historyID ?? null);
        setSelectedRoi(prev => ({
          ...prev,
          region: prev?.region || basic.region || "",
          store_format: prev?.store_format || basic.exsisting_store_format || basic.new_store_format || "",
          project_type: prev?.project_type || basic.project_type || "",
        }));
      }
    } catch (err) {
      toast.error("Failed to load ROI details");
    } finally {
      setPagesLoading(false);
    }
  };

  // ── View New Store PDF — navigates straight to the resolved document link
  // in a new tab instead of opening an in-page modal/iframe preview. ───────
  const handleViewNewStorePdf = async () => {
    if (!roiHistoryId || pdfLinkLoading) return;
    setPdfLinkLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/history/${encodeURIComponent(roiHistoryId)}`);
      if (!res.ok) throw new Error("Failed to fetch history details.");
      const json = await res.json();
      const d = json.data?.[0] ?? {};
      // Scan all string values for a URL that looks like a PDF / document
      const url = d.pdf_url ?? d.document_url ?? d.pdf_link ?? d.file_url ??
        Object.values(d).find(v =>
          typeof v === "string" && v.startsWith("http") &&
          (v.includes(".pdf") || v.includes("blob") || v.includes("drive") || v.includes("/document"))
        ) ?? null;
      if (!url) {
        toast.error("No PDF document is linked to this History ID.");
        return;
      }
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      toast.error(err.message || "Failed to open the New Store PDF.");
    } finally {
      setPdfLinkLoading(false);
    }
  };

  // ── View page data ─────────────────────────────────────────────────────────
  const handleViewPageData = async (pageName) => {
    if (pageName === "Sales Planning - Discount" && !canViewDiscount) {
      toast.error("Discount details are visible to Commercial and above only.");
      return;
    }
    const roiid = selectedRoi?.roiid;
    setPageModal({ open: true, pageName, data: null, loading: true });
    try {
      const sp = (screen) => fetch(`${BASE_URL}/sales_planning`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ screen, roiid }) });
      const fs = (param) => fetch(`${BASE_URL}/fetchScreen?parameter=${param}&roiid=${roiid}`);
      const ed = (type) => fetch(`${BASE_URL}/expense_details/${roiid}?expense_type=${type}`);

      const fetchers = {
        "Basic Store Details": () => fs("roi_basic_store_details"),
        "Store Retail Specifications": () => fs("roi_store_retail_specifications"),
        "Sales Planning - Ref Store Code Details": () => sp(1),
        "Sales Planning - Sales Summary": () => sp(2),
        "Sales Planning - Stock Summary - Phase 1": () => sp(3),
        "Sales Planning - Stock Summary - Phase 2": () => sp(4),
        "Sales Planning - Discount": () => sp(5),
        "Capex Expenses": () => ed("CAPEX"),
        "Resource Expenses": () => ed("RESOURCE"),
        "Other Expenses": () => ed("OTHER"),
        "Summary Expenses": () => ed("SUMMARY"),
        "ROI_IRR_Details": () => fetch(`${BASE_URL}/summary_screen_5/${roiid}`),
      };

      const res = await fetchers[pageName]?.();
      if (!res) { setPageModal(prev => ({ ...prev, loading: false })); return; }
      // Backend returns a JSON body with a specific `message` even on 404/500
      // (e.g. "No saved data found for ROI '...' (section: ...)") — surface that
      // instead of a generic failure so the user knows exactly what's missing.
      const json = await res.json().catch(() => null);
      if (!res.ok || json?.success === false) {
        throw new Error(json?.message || `Failed to load page data (HTTP ${res.status}).`);
      }
      setPageModal({ open: true, pageName, data: json.data ?? [], loading: false });
    } catch (err) {
      toast.error(err.message || "Failed to load page data");
      setPageModal(prev => ({ ...prev, loading: false }));
    }
  };
  // ── Execute action (remark supplied by ActionModal) ───────────────────────
  const handleConfirmAction = async (remark = "") => {
    const roiid = selectedRoi?.roiid;

    setActionLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/roi/action/${roiid}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: confirmAction,  // 'approve' | 'reject' | 'clarify'
          actor_email: userLog?.email ?? "",
          actor_role: userRole,
          remark: remark.trim(),
          channel: selectedRoi?.channel ?? "Tanishq",
          store_format: selectedRoi?.store_format ?? selectedRoi?.existing_store_format ?? "",
          project_type: selectedRoi?.project_type ?? "",
          region: selectedRoi?.region ?? "",
        }),
      });
      // Backend always returns a JSON body (even on 403/422/500) with a specific
      // `message` — e.g. "not authorised to act on it", "no approver configured
      // for this stage" — surface that instead of a generic "Action failed" so
      // the user knows exactly what went wrong and how to fix it.
      const json = await res.json().catch(() => null);
      if (!res.ok || json?.success === false) {
        throw new Error(json?.message || `Action failed (HTTP ${res.status}).`);
      }
      const newStatus = json.new_status ?? confirmAction;
      const nextApprover = json.next_approver?.[0];
      const msg = confirmAction === "approve"
        ? `ROI approved ✓${nextApprover ? ` — Next: ${nextApprover.approver_name ?? nextApprover.role ?? ""}` : ""}`
        : confirmAction === "reject"
          ? "ROI rejected — ABM notified"
          : "Clarification requested — ABM notified";

      toast.success(msg);
      setSelectedRoi(prev => ({ ...prev, status: newStatus }));
      setRoiList(prev => prev.map(r => (r.roiid ?? r.roi_id ?? r.ROIID) === roiid ? { ...r, status: newStatus } : r));
      setConfirmAction(null);
    } catch (err) {
      toast.error(err.message || "Action failed");
    } finally {
      setActionLoading(false);
    }
  };

  // ── Computed values ────────────────────────────────────────────────────────
  const filteredList = roiList.filter(roi => {
    const id = (roi.roiid ?? roi.roi_id ?? roi.ROIID ?? "").toLowerCase();
    const q = searchQuery.toLowerCase();
    const matchQ = !q || id.includes(q) || (roi.city ?? "").toLowerCase().includes(q) || (roi.project_type ?? "").toLowerCase().includes(q);
    const matchSt = statusFilter === "All" || roi.status === statusFilter;
    return matchQ && matchSt;
  });

  const roiStatus = selectedRoi?.status ?? "";

  // Each approver can act on the status created by the level directly below them,
  // AND on SK statuses where the level above has sent a query back down to them.
  const ACTIONABLE_STATUS_BY_ROLE = {
    // ABM → RBM → Commercial → Admin → Retail
    "RBM":        ["Submitted_toRBM", "Submitted to RBM", "SK_byCommercial"],
    "COMMERCIAL":  ["Approved_byRBM",        "SK_byAdmin"],
    "ADMIN":       ["Approved_byCommercial"],
    "RETAIL":      ["Approved_byAdmin"],
  };
  const isActionable = (ACTIONABLE_STATUS_BY_ROLE[userRole?.toUpperCase()] ?? []).includes(roiStatus);

  const getPageStatus = (pageName) => {
    // ROI_IRR_Details (formerly "Final Summary") has no page-level status row
    // of its own — it mirrors the ROI's own overall status (Submitted to
    // RBM/Approved_by*/etc.), not a fixed "Completed" badge, since that's
    // what the approval list actually shows.
    if (pageName === "ROI_IRR_Details") return roiStatus;
    const row = pageStatuses.find(p => (p.page_name ?? p.PageName) === pageName);
    return row?.status ?? "Not Available";
  };
  // Counted via getPageStatus (not the raw pageStatuses array) so ROI_IRR_Details —
  // which has no row of its own and always mirrors roiStatus — counts as filled too.
  const completedCount = PAGES.filter(p => getPageStatus(p.name) !== "Not Available").length;

  return (
    <div className="flex flex-1 h-full min-h-0 overflow-hidden bg-slate-50">
      {/* ══ Left Sidebar ══════════════════════════════════════════════════ */}
      <aside className="w-80 bg-white border-r border-slate-200 flex flex-col overflow-hidden shadow-sm shrink-0">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-indigo-700 to-blue-600">
          <button type="button" onClick={() => navigate(routes.NEW_STORE)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 mb-3 bg-white/15 hover:bg-white/25 text-white text-xs font-semibold rounded-lg transition">
            ← Back to Third Eye
          </button>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">📊</span>
            <h2 className="text-white font-bold text-lg tracking-wide">{userLog?.name}</h2>
          </div>
          <h3 className="text-indigo-200 text-s truncate text-right px-2">{userRole}</h3>
        </div>

        {/* Search + filters */}
        <div className="p-3 border-b border-slate-100 space-y-2">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
            <input
              type="text"
              placeholder="Search ROI, city, project…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
          <div className="flex flex-wrap gap-1">
            {["All", "Submitted to RBM", "Approved", "Changes Required", "Rejected"].map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-2.5 py-0.5 rounded-full text-xs font-medium transition ${statusFilter === s ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>
                {s === "Submitted to RBM" ? "Submitted" : s}
              </button>
            ))}
          </div>
        </div>

        {/* Summary counts */}
        <div className="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100 text-center">
          {[
            { label: "Total", count: roiList.length, color: "text-slate-700" },
            { label: "Pending", count: roiList.filter(r => r.status === "Submitted to RBM").length, color: "text-blue-600" },
            { label: "Approved", count: roiList.filter(r => r.status === "Approved").length, color: "text-emerald-600" },
          ].map(({ label, count, color }) => (
            <div key={label} className="py-2.5">
              <p className={`text-lg font-bold ${color}`}>{count}</p>
              <p className="text-xs text-slate-400">{label}</p>
            </div>
          ))}
        </div>

        {/* ROI list */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          {listLoading ? (
            <div className="p-3 space-y-2">
              {[1, 2, 3, 4].map(i => <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" />)}
            </div>
          ) : filteredList.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-slate-400">
              <span className="text-3xl mb-2">📭</span>
              <p className="text-sm">No requests found</p>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {filteredList.map(roi => {
                const id = roi.roiid ?? roi.roi_id ?? roi.ROIID ?? "";
                const isSelected = selectedRoi?.roiid === id;
                const cfg = getCfg(roi.status);
                return (
                  <button key={id} onClick={() => handleSelectRoi(roi)}
                    className={`w-full text-left p-3 rounded-xl transition-all ${isSelected ? "bg-indigo-50 border border-indigo-200 shadow-sm" : "hover:bg-slate-50 border border-transparent"}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className={`font-bold text-sm truncate ${isSelected ? "text-indigo-700" : "text-slate-800"}`}>{id}</p>
                        <p className="text-xs text-slate-500 mt-0.5 truncate">{[roi.project_type, roi.city].filter(Boolean).join(" · ")}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{daysAgo(roi.inserted_date)}</p>
                      </div>
                      <span className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                        {cfg.label}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </aside>

      {/* ══ Main Content ══════════════════════════════════════════════════ */}
      <main className="flex-1 min-h-0 overflow-y-auto">
        {!selectedRoi ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mb-5">
              <span className="text-5xl">📋</span>
            </div>
            <h3 className="text-xl font-bold text-slate-700">Select an ROI Request</h3>
            <p className="text-slate-400 text-sm mt-2 max-w-xs leading-relaxed">
              Choose a request from the sidebar to review its details, view submitted data, and take action.
            </p>
          </div>
        ) : (
          <div className="p-6 space-y-5">

            {/* ─── ROI Header card ─────────────────────────────────────── */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-700 to-blue-600 px-5 py-3.5">
                <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-indigo-300 text-[10px] font-semibold uppercase tracking-widest shrink-0">ROI ID</span>
                      <span className="text-white font-extrabold text-base tracking-wide truncate">{selectedRoi.roiid}</span>
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-xs text-indigo-100">
                      {selectedRoi.project_type && <span>📁 {selectedRoi.project_type}</span>}
                      {selectedRoi.city && <span>📍 {selectedRoi.city}{selectedRoi.state ? `, ${selectedRoi.state}` : ""}</span>}
                      {selectedRoi.username && <span>👤 {selectedRoi.username}</span>}
                      {selectedRoi.inserted_date && <span>📅 {new Date(selectedRoi.inserted_date).toLocaleDateString("en-IN")}</span>}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                    <StatusBadge status={roiStatus} size="sm" />
                    {/* Every ROI reaching this dashboard has already been submitted.
                        Solid white pill (not a ghost bg-white/20 overlay) so these
                        read clearly as clickable buttons against the blue header,
                        with a visible focus ring for keyboard navigation. Short
                        icon + label (not an emoji + full sentence) so each reads
                        like a compact link/chip rather than a wordy button. */}
                    {!!roiStatus && (
                      <RoiPdfReport
                        roiid={selectedRoi.roiid}
                        label={<><FiFileText size={13} /> PDF Report</>}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white text-indigo-700 hover:bg-indigo-50 disabled:opacity-50 text-[11px] font-bold rounded-lg shadow-sm transition whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-indigo-700"
                      />
                    )}
                    {/* Full multi-tab ROI Report Excel — same as HistoryPage.jsx's
                        button, now also available to every approver role once
                        the ROI has reached this dashboard (i.e. already submitted). */}
                    {!!roiStatus && (
                      <RoiSummaryExcelDownload
                        roiid={selectedRoi.roiid}
                        label={<><FiGrid size={13} /> Excel Report</>}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white text-indigo-700 hover:bg-indigo-50 disabled:opacity-50 text-[11px] font-bold rounded-lg shadow-sm transition whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-indigo-700"
                      />
                    )}
                    {/* PDF button shown to all roles for New Store projects —
                        navigates straight to the resolved document URL in a new
                        tab instead of opening an in-page modal/iframe preview. */}
                    {selectedRoi.project_type === "New Store" && roiHistoryId && (
                      <button
                        onClick={handleViewNewStorePdf}
                        disabled={pdfLinkLoading}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white text-indigo-700 hover:bg-indigo-50 disabled:opacity-50 text-[11px] font-bold rounded-lg shadow-sm transition whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-indigo-700">
                        <FiExternalLink size={13} /> {pdfLinkLoading ? "Opening…" : "New Store PDF"}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Progress */}
              <div className="px-5 py-2.5 border-b border-slate-100 bg-slate-50 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-medium text-slate-600">Form Completion</span>
                    <span className="text-slate-500 font-semibold">{completedCount} / {PAGES.length} pages filled</span>
                  </div>
                  <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${(completedCount / PAGES.length) * 100}%`,
                        background: "linear-gradient(90deg,#6366f1,#3b82f6)",
                      }}
                    />
                  </div>
                </div>
                {/* ─── TOT Analysis button (Commercial only) ──────────────── */}
                {userRole?.toUpperCase() === "COMMERCIAL" && (
                  <button
                    onClick={() => setShowTotModal(true)}
                    className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-bold text-xs shadow-sm transition active:scale-95">
                    📊 View TOT Analysis
                  </button>
                )}
              </div>

              {/* Action buttons */}
              {isActionable && (
                <div className="px-5 py-3 flex flex-wrap items-center gap-2.5">
                  <button onClick={() => setConfirmAction("approve")}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs shadow-sm transition active:scale-95">
                    ✓ Approve
                  </button>
                  <button onClick={() => setConfirmAction("clarify")}
                    className="flex items-center gap-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-bold text-xs shadow-sm transition active:scale-95">
                    💬 Seek Clarification
                  </button>
                  <button onClick={() => setConfirmAction("reject")}
                    className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-xs shadow-sm transition active:scale-95">
                    ✗ Reject
                  </button>
                </div>
              )}

              {/* Non-actionable status banner with remark */}
              {!isActionable && (
                <div className={`px-5 py-2.5 border-t border-slate-100 ${getCfg(roiStatus).bg}`}>
                  <p className={`text-xs font-medium ${getCfg(roiStatus).text}`}>
                    {roiStatus === "Approved" && "✓ This ROI has been approved."}
                    {roiStatus === "Rejected" && "✗ This ROI has been rejected."}
                    {roiStatus === "BPM_Requestraised" && "🏭 BPM request raised — forwarded to Retail."}
                    {roiStatus === "Approved_byRBM" && "✓ Approved by RBM — awaiting Commercial review."}
                    {roiStatus === "Approved_byCommercial" && "✓ Approved by Commercial — awaiting Admin review."}
                    {roiStatus === "Approved_byAdmin" && "✓ Approved by Admin — awaiting Retail acceptance."}
                    {roiStatus.startsWith("Rejected_by") && `✗ Rejected by ${roiStatus.replace("Rejected_by", "")} — ABM notified.`}
                    {roiStatus === "SK_byRBM" && "💬 Clarification sent to ABM by RBM — ABM must revise and resubmit."}
                    {roiStatus === "SK_byCommercial" && "💬 Clarification sent to RBM by Commercial — RBM must resolve."}
                    {roiStatus === "SK_byAdmin" && "💬 Clarification sent to Commercial by Admin — Commercial must resolve."}
                    {!["", "Approved", "Rejected", "BPM_Requestraised", "Approved_byRBM", "Approved_byCommercial", "Approved_byAdmin"].includes(roiStatus)
                      && !roiStatus.startsWith("Rejected_by") && !roiStatus.startsWith("SK_by")
                      && `Status: ${roiStatus}`}
                  </p>
                  {selectedRoi?.remarks && (
                    <div className="mt-2 bg-white/60 rounded-lg px-3 py-2 border border-slate-200">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-0.5">Remark</p>
                      <p className="text-sm text-slate-700 whitespace-pre-wrap">{selectedRoi.remarks}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ─── Pages — card grid (everything visible at a glance, no
                accordion click needed to reach the View action) ─────────── */}
            <div>
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-3 px-1">Submitted Pages</h3>
              {pagesLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
                  {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-28 bg-white rounded-2xl animate-pulse border border-slate-200" />)}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
                  {PAGES.map(page => (
                    <PageCard
                      key={page.name}
                      page={page}
                      onViewData={() => handleViewPageData(page.name)}
                      restricted={page.name === "Sales Planning - Discount" && !canViewDiscount}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* ── Modals ──────────────────────────────────────────────────────── */}
      {pageModal.open && (
        <PageDataModal
          pageName={pageModal.pageName}
          data={pageModal.data}
          loading={pageModal.loading}
          onClose={() => setPageModal({ open: false, pageName: "", data: [], loading: false })}
          onNavigate={handleViewPageData}
          canViewDiscount={canViewDiscount}
        />
      )}

      {showTotModal && (
        <TOTSection
          roiid={selectedRoi?.roiid}
          onClose={() => setShowTotModal(false)}
        />
      )}

      {confirmAction && (
        <ActionModal
          action={confirmAction}
          roiid={selectedRoi?.roiid}
          userRole={userRole}
          onConfirm={handleConfirmAction}
          onCancel={() => setConfirmAction(null)}
          loading={actionLoading}
        />
      )}
    </div>
  );
}
