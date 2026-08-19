// components/FormControls.jsx

export function Input({
  label,
  name,
  register,
  rules,
  disabled = false,
  type = "text",
  maxLength
}) {
  return (
    <div>
      <label className="block mb-1 text-sm font-semibold text-gray-700">
        {label}
      </label>
      <input
        type={type}
        disabled={disabled}
        maxLength={maxLength}
        {...register(name, rules)}
        className={`w-full rounded-lg p-2.5 text-sm border transition-colors
          ${disabled
            ? "bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed"
            : "bg-white border-gray-300 text-gray-900 focus:ring-2 focus:ring-[#233044] focus:border-[#233044] hover:border-gray-400"
          }`}
      />
    </div>
  );
}

export function Select({
  label,
  name,
  register,
  rules,
  children,
  disabled = false,
}) {
  return (
    <div>
      <label className="block mb-1 text-sm font-semibold text-gray-700">
        {label}
      </label>
      <select
        disabled={disabled}
        {...register(name, rules)}
        className={`w-full rounded-lg p-2.5 text-sm border transition-colors
          ${disabled
            ? "bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed"
            : "bg-white border-gray-300 text-gray-900 focus:ring-2 focus:ring-[#233044] focus:border-[#233044] hover:border-gray-400"
          }`}
      >
        {children}
      </select>
    </div>
  );
}