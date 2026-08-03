import { useState } from "react";
import MultiStepROIForm from "./MultiStepROIForm";
import HistoryPage from "./HistoryPage";
import ThirdEyeHeader from "../../../Components/custom/ThirdEyeHeader";
import { useSelector } from "react-redux";

function ROIMainPage() {
  const userLog = useSelector((state) => state?.user?.user);

  const [newReqFlag, setNewReqFlag] = useState(false);
  const [historyReqFlag, setHistoryReqFlag] = useState(false);
  const [continueContext, setContinueContext] = useState(null);

  const handleContinueROI = (roiContext, startStep) => {
    setContinueContext({ roiContext, startStep });
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
      <div className='flex-1 overflow-auto bg-gradient-to-br from-blue-50 via-white to-indigo-100'>
        {!newReqFlag && !historyReqFlag ? (
          <div className='flex items-center justify-center h-full p-4'>
            <div
              className='w-full max-w-md bg-white rounded-2xl p-8 text-center'
              style={{
                boxShadow:
                  "0 0 0 1px rgba(99,102,241,0.08), 0 4px 24px rgba(99,102,241,0.12), 0 24px 48px rgba(0,0,0,0.10), 0 -4px 16px rgba(99,102,241,0.06)",
              }}>
              {/* top accent bar */}
              <div className='h-1 w-20 bg-gradient-to-r from-indigo-400 via-purple-400 to-green-400 rounded-full mx-auto mb-6' />

              {/* icon badge */}
              <div className='flex items-center justify-center w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl mx-auto mb-5 shadow-lg'>
                <span style={{ fontSize: "24px" }}>📈</span>
              </div>

              <h5 className='text-xl md:text-2xl font-bold text-gray-800 mb-2'>
                Return On Investment
              </h5>
              <p className='text-sm text-gray-400 mb-8'>
                Manage and track your investment requests easily.
              </p>

              <div className='flex flex-col sm:flex-row gap-4 justify-center'>
                <button
                  onClick={() => setNewReqFlag(true)}
                  className='flex-1 text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg hover:-translate-y-0.5'
                  style={{
                    background: "linear-gradient(135deg, #10b981, #059669)",
                  }}>
                  + New Request
                </button>

                <button
                  onClick={() => setHistoryReqFlag(true)}
                  className='flex-1 text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg hover:-translate-y-0.5'
                  style={{
                    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                  }}>
                  ↺ History
                </button>
              </div>
            </div>
          </div>
        ) : newReqFlag ? (
          <div className='w-full max-w-7xl mx-auto p-4'>
            <MultiStepROIForm
              initialRoiContext={continueContext?.roiContext ?? null}
              initialStep={continueContext?.startStep ?? 1}
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
    </div>
  );
}

export default ROIMainPage;
