import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import MultiStepROIForm from "./MultiStepROIForm";
import HistoryPage from "./HistoryPage";
import RBMDashboard from "./RBMDashboard";
import ThirdEyeHeader from "../../../Components/custom/ThirdEyeHeader";
import { useSelector } from "react-redux";
import roi_banner from "../assets/ROI_Banner.png";
import { BASE_URL } from "./Forms/data/baseUrl";
import { routes } from "../../../routes";

function ROIMainPage() {
  const navigate = useNavigate();
  const userLog = useSelector((state) => state?.user?.user);
  const [userRole, setUserRole] = useState(null); // null = loading
  const [newReqFlag, setNewReqFlag] = useState(false);
  const [historyReqFlag, setHistoryReqFlag] = useState(false);
  const [continueContext, setContinueContext] = useState(null);

  // Fetch role once the user is available
  useEffect(() => {
    const email = userLog?.email;
    if (!email) return;
    (async () => {
      try {
        const res = await fetch(`${BASE_URL}/user_role?email=${encodeURIComponent(email)}`);
        if (!res.ok) { setUserRole("ABM"); return; }
        const json = await res.json();
        // API returns array; first entry is the logged-in user's role
        const role = (json.data?.[0]?.Role ?? "ABM");
        setUserRole(role);
      } catch {
        setUserRole("ABM"); // fallback to ABM on error
      }
    })();
  }, [userLog?.name]);

  const handleContinueROI = (roiContext, startStep, startSubStep = 1) => {
    setContinueContext({ roiContext, startStep, startSubStep });
    setHistoryReqFlag(false);
    setNewReqFlag(true);
  };

  const handleBack = () => {
    setNewReqFlag(false);
    setHistoryReqFlag(false);
    setContinueContext(null);
  };

  return (
    <div className='flex flex-col h-screen overflow-hidden'>
      <ThirdEyeHeader chl={userLog?.channel} />

      {/* Non-ABM roles (RBM, Commercial, Retail, …) get the approver dashboard */}
      {userRole !== null && userRole !== "ABM" ? (
        <RBMDashboard userRole={userRole} />
      ) : (
        <div className='flex-1 overflow-auto relative'>

          {/* Role loading spinner */}
          {userRole === null ? (
            <div className='flex items-center justify-center h-full'>
              <div className='animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full' />
            </div>
          /* ABM / default flow */
          ) : !newReqFlag && !historyReqFlag ? (
          <div
            className='flex items-center justify-center h-full p-4'
            style={{
              backgroundImage: `url(${roi_banner})`,
              backgroundSize: "80%",
              backgroundPosition: "center 40%",
              backgroundRepeat: "no-repeat",
              backgroundColor: "#0d1017",
              minHeight: "100%",
            }}>
            {/* dark scrim so text stays readable over any banner */}
            <div
              className='absolute inset-0 pointer-events-none'
              style={{ background: "rgba(15,23,42,0.55)" }}
            />

            <div
              className='relative z-10 w-full max-w-sm text-center rounded-2xl p-8'
              style={{
                background: "rgba(255,255,255,0.10)",
                backdropFilter: "blur(3px)",
                WebkitBackdropFilter: "blur(3px)",
                border: "1px solid rgba(255,255,255,0.22)",
                boxShadow:
                  "0 0 0 1px rgba(255,255,255,0.08), 0 8px 32px rgba(0,0,0,0.4), 0 -4px 16px rgba(99,102,241,0.15)",
              }}>
              {/* accent bar */}
              <div
                className='h-1 w-16 rounded-full mx-auto mb-5'
                style={{
                  background: "linear-gradient(90deg,#6366f1,#a78bfa,#10b981)",
                }}
              />

              {/* icon badge */}
              <div
                className='flex items-center justify-center w-12 h-12 rounded-xl mx-auto mb-2'
                style={{
                  background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
                  boxShadow: "0 4px 15px #6366f180",
                }}>
                <span style={{ fontSize: "24px" }}>📈</span>
              </div>

              <h5 className='text-xl md:text-2xl font-bold text-white mb-2 tracking-wide'>
                Return On Investment
              </h5>
              <p
                className='text-sm mb-7'
                style={{ color: "rgba(255,255,255,0.65)" }}>
                Manage and track your investment requests easily.
              </p>

              <div className='flex flex-col sm:flex-row gap-3'>
                <button
                  onClick={() => setNewReqFlag(true)}
                  className='flex-1 text-white font-semibold py-3 px-5 rounded-xl transition-all duration-200 hover:-translate-y-0.5'
                  style={{
                    background: "linear-gradient(135deg,#10b981,#059669)",
                    boxShadow: "0 4px 16px rgba(16,185,129,0.45)",
                  }}>
                  + New Request
                </button>

                <button
                  onClick={() => setHistoryReqFlag(true)}
                  className='flex-1 text-white font-semibold py-3 px-5 rounded-xl transition-all duration-200 hover:-translate-y-0.5'
                  style={{
                    background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
                    boxShadow: "0 4px 16px rgba(99,102,241,0.45)",
                  }}>
                  ↺ History
                </button>
              </div>

              <button
                onClick={() => navigate(routes.NEW_STORE)}
                className='mt-4 w-full text-sm font-medium py-2 rounded-xl transition-all duration-200 hover:bg-blue-800 hover:text-white'
                style={{ color: "rgb(250, 221, 0)" }}>
                ← Back to ThirdEye
              </button>
            </div>
          </div>
          ) : newReqFlag ? (
            <div className='w-full max-w-7xl mx-auto p-4'>
              <MultiStepROIForm
                initialRoiContext={continueContext?.roiContext ?? null}
                initialStep={continueContext?.startStep ?? 1}
                initialSubStep={continueContext?.startSubStep ?? 1}
                onExit={handleBack}
              />
            </div>
          ) : (
            historyReqFlag && (
              <div className='h-full'>
                <HistoryPage
                  onBack={handleBack}
                  onContinueROI={handleContinueROI}
                />
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}

export default ROIMainPage;
