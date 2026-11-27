import { useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { BASE_URL } from "./data/baseUrl";

// Full, multi-tab ROI Report (.xlsx) — one sheet per form section plus the
// detailed ROI Summary financial statement — generated entirely server-side
// and emailed to the logged-in user who clicked the button
// (`POST /roi/email_report/{roiid}`) — there is no direct browser download;
// the password + a link back into the app arrive in the email.
export default function RoiSummaryExcelDownload({ roiid, className = "", label = null }) {
  const [loading, setLoading] = useState(false);
  const userLog = useSelector((state) => state?.user?.user);

  const handleEmailReport = async () => {
    if (!roiid) return;
    const to_email = userLog?.email;
    if (!to_email) {
      toast.error("Could not determine your logged-in email address.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/roi/email_report/${roiid}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ report_type: "summary_excel", to_email }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        throw new Error(json?.message || "Failed to generate/email the full ROI Report Excel.");
      }
      toast.success(json.message || `The full ROI Report has been emailed to ${to_email}.`);
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to generate/email the full ROI Report Excel.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type='button'
      onClick={handleEmailReport}
      disabled={loading || !roiid}
      className={
        className ||
        "inline-flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm shadow-lg transition text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
      }>
      {loading ? "Sending…" : label ?? "📧 Email Full ROI Report (Excel)"}
    </button>
  );
}
