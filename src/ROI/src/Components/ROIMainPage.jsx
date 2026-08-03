import { useState } from "react";
import MultiStepROIForm from "./MultiStepROIForm";
import HistoryPage from "./HistoryPage";

function ROIMainPage() {
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
    <div className='min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-100 flex items-center justify-center p-4'>
      {!newReqFlag && !historyReqFlag ? (
        <div className='w-full max-w-md bg-white rounded-2xl shadow-xl p-8 text-center'>
          <h1 className='text-3xl md:text-4xl font-bold text-gray-800 mb-3'>
            Return On Investment
          </h1>

          <p className='text-gray-500 mb-8'>
            Manage and track your investment requests easily.
          </p>

          <div className='flex flex-col sm:flex-row gap-4 justify-center'>
            <button
              onClick={() => setNewReqFlag(true)}
              className='flex-1 bg-green-500 hover:bg-green-600 text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg'>
              New Request
            </button>

            <button
              onClick={() => setHistoryReqFlag(true)}
              className='flex-1 bg-indigo-500 hover:bg-indigo-600 text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg'>
              History
            </button>
          </div>
        </div>
      ) : newReqFlag ? (
        <div className='w-full max-w-7xl'>
          <MultiStepROIForm
            initialRoiContext={continueContext?.roiContext ?? null}
            initialStep={continueContext?.startStep ?? 1}
            onExit={handleBack}
          />
        </div>
      ) : (
        historyReqFlag && (
          <div className='w-full h-screen'>
            <HistoryPage
              onBack={handleBack}
              onContinueROI={handleContinueROI}
            />
          </div>
        )
      )}
    </div>
  );
}

export default ROIMainPage;
