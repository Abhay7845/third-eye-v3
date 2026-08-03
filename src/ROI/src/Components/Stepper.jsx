// components/Stepper.jsx

export default function Stepper({ currentStep, steps }) {
  return (
    <div className="w-full flex justify-center pb-6">
      <div className="flex items-start justify-center w-full max-w-5xl">
        {steps.map((step, index) => {
          const stepNo    = index + 1;
          const completed = currentStep > stepNo;
          const active    = currentStep === stepNo;
          const label     = typeof step === "string" ? step : step.label;
          const icon      = typeof step === "object" ? step.icon : null;

          return (
            <div key={stepNo} className="flex items-start flex-1">
              {/* Circle + Label */}
              <div className="flex flex-col items-center flex-shrink-0" style={{ minWidth: 60 }}>
                <div
                  className={`w-11 h-11 rounded-full flex items-center justify-center text-base font-bold border-2 shadow-lg transition-all duration-300 ${
                    completed
                      ? "bg-green-400 border-green-300 text-white"
                      : active
                      ? "bg-white border-white text-blue-700 scale-110 ring-4 ring-white/30"
                      : "bg-white/10 border-white/25 text-white/40"
                  }`}
                >
                  {completed ? "✓" : (icon ?? stepNo)}
                </div>
                <span
                  className={`text-xs mt-2 text-center font-medium leading-tight transition-all duration-300 ${
                    completed ? "text-green-300" :
                    active    ? "text-white font-bold" :
                                "text-white/40"
                  }`}
                  style={{ maxWidth: 68 }}
                >
                  {label}
                </span>
              </div>

              {/* Connector */}
              {index < steps.length - 1 && (
                <div className="flex-1 mt-5 mx-1">
                  <div className="h-0.5 w-full rounded-full bg-white/20 overflow-hidden">
                    <div
                      className="h-full bg-green-300 rounded-full transition-all duration-500"
                      style={{ width: completed ? "100%" : "0%" }}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}