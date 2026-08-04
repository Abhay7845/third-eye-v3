// MultiStepROIForm.jsx

import { useState } from "react";
import BasicStoreDetails from "./Forms/BasicStoreRetailForm";
import StoreRetailSpecifications from "./Forms/StoreRetailSpecification";
import Stepper from "./Stepper";
import Section3 from "./Forms/SalesPlanning/Section3";
import Section4 from "./Forms/ExpensePlanning/Section4";
import SummaryPage5 from "./Forms/Summary";

const STEPS = [
  { label: "Store Details", icon: "🏪" },
  { label: "Retail Specs", icon: "📋" },
  { label: "Sales Planning", icon: "📊" },
  { label: "Expense Planning", icon: "💰" },
  { label: "Review", icon: "🔍" },
];

export default function MultiStepROIForm({
  initialStep = 1,
  initialSubStep = 1,
  initialRoiContext = null,
  onExit,
}) {
  // const [activeForm, setActiveForm] = useState(4);
  const [activeForm, setActiveForm] = useState(initialStep);
  const [roiContext, setRoiContext] = useState(initialRoiContext);
  const progressPct = Math.round(((activeForm - 1) / (STEPS.length - 1)) * 100);

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 py-8 px-4'>
      <div className='max-w-7xl mx-auto'>
        {/* Page Header */}
        <div className='mb-8 text-center'>
          {/*<div className="inline-flex items-center gap-2 bg-white/70 backdrop-blur border border-indigo-100 rounded-full px-5 py-1.5 text-sm font-semibold text-indigo-600 shadow-sm mb-4">
            📈 ROI Calculator
          </div>*/}
          <h1 className='text-4xl font-extrabold text-gray-900 tracking-tight'>
            New Investment Request
          </h1>
          <p className='mt-2 text-gray-500 text-base'>
            Complete all sections to calculate and submit your investment
            proposal
          </p>
        </div>

        {/* Main Card */}
        <div className='bg-white rounded-3xl shadow-2xl shadow-indigo-100 overflow-hidden border border-gray-100'>
          {/* Stepper Header */}
          <div className='bg-gradient-to-r from-indigo-700 via-blue-600 to-blue-500 px-8 pt-8'>
            <Stepper currentStep={activeForm} steps={STEPS} />
            {/* Progress bar */}
            <div className='pb-0'>
              <div className='h-1 bg-white/20 rounded-full overflow-hidden'>
                <div
                  className='h-full bg-white/70 rounded-full transition-all duration-500'
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <div className='flex justify-between text-white/50 text-xs py-2'>
                <span>
                  Step {activeForm} of {STEPS.length}
                </span>
                <span>{progressPct}% complete</span>
              </div>
            </div>
          </div>

          {/* Form Content */}
          <div>
            {activeForm === 1 && (
              <BasicStoreDetails
                onNext={(ctx) => {
                  setRoiContext(ctx);
                  setActiveForm(2);
                }}
              />
            )}
            {activeForm === 2 && (
              <StoreRetailSpecifications
                roiContext={roiContext}
                onNext={() => setActiveForm(3)}
                onPrevious={() => setActiveForm(1)}
              />
            )}
            {activeForm === 3 && (
              <Section3
                roiContext={roiContext}
                initialSubStep={initialStep === 3 ? initialSubStep : 1}
                onNext={() => setActiveForm(4)}
                onPrevious={() => setActiveForm(2)}
              />
            )}
            {activeForm === 4 && (
              <Section4
                roiContext={roiContext}
                initialSubStep={initialStep === 4 ? initialSubStep : 1}
                onNext={() => setActiveForm(5)}
                onPrevious={() => setActiveForm(3)}
              />
            )}
            {activeForm === 5 && (
              <SummaryPage5
                roiContext={roiContext}
                onNext={() => setActiveForm(5)}
                onPrevious={() => setActiveForm(3)}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
