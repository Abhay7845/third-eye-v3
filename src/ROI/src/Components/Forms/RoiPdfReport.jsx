import { useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { BASE_URL } from "./data/baseUrl";

// Full, section-by-section ROI report — generated entirely server-side,
// password-protected, and emailed to the logged-in user who clicked the
// button (`POST /roi/email_report/{roiid}`) — there is no direct browser
// download; the password + a link back into the app arrive in the email.
export default function RoiPdfReport({ roiid, className = "", label = null }) {
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
        body: JSON.stringify({ report_type: "pdf_full_report", to_email }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        throw new Error(json?.message || "Failed to generate/email the ROI report PDF.");
      }
      toast.success(json.message || `The ROI Report has been emailed to ${to_email}.`);
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to generate/email the ROI report PDF.");
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
        "inline-flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm shadow-lg transition text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed"
      }>
      {loading ? "Sending…" : label ?? "📧 Email ROI Report (PDF)"}
    </button>
  );
}

