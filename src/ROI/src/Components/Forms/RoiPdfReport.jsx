import { useState } from "react";
import { BASE_URL } from "./data/baseUrl";

// Full, section-by-section ROI report — generated entirely server-side
// (`/roi_full_report/{roiid}`) so every role downloads an identical,
// industry-standard PDF regardless of which screen they open it from.
export default function RoiPdfReport({ roiid, className = "" }) {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    if (!roiid) return;
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/roi_full_report/${roiid}`);
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.message || "Failed to generate the ROI report PDF.");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `ROI_Report_${roiid}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to generate the ROI report PDF.");
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
        "inline-flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm shadow-lg transition text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed"
      }>
      {loading ? "Generating…" : "📥 Download ROI Report (PDF)"}
    </button>
  );
}

