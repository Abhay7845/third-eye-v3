import { useState } from "react";
import { BASE_URL } from "./data/baseUrl";

// ROI Summary (Review & Submit) as a password-protected .xlsx — generated
// entirely server-side (`/roi_summary_excel/{roiid}`) so it's available
// regardless of the ROI's current status, including after final submission.
export default function RoiSummaryExcelDownload({ roiid, className = "" }) {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    if (!roiid) return;
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/roi_summary_excel/${roiid}`);
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.message || "Failed to generate the ROI Summary Excel.");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `ROI_Summary_${roiid}.xlsx`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to generate the ROI Summary Excel.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type='button'
      onClick={handleDownload}
      disabled={loading || !roiid}
      className={
        className ||
        "inline-flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm shadow-lg transition text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
      }>
      {loading ? "Generating…" : "📥 Download Summary (Excel)"}
    </button>
  );
}
