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
  const isNumber = type === "number";
  const { onChange, ...fieldProps } = register(name, rules);

  // Block "-" / "+" / "e" keystrokes so negative numbers can't be typed at all.
  const handleKeyDown = (e) => {
    if (isNumber && ["-", "+", "e", "E"].includes(e.key)) e.preventDefault();
  };

  // Also strip any negative sign that slips in via paste/autofill.
  const handleChange = (e) => {
    if (isNumber && e.target.value.includes("-")) {
      e.target.value = e.target.value.replace(/-/g, "");
    }
    onChange(e);
  };

  return (
    <div>
      <label className="block mb-1 text-sm font-semibold text-gray-700">
        {label}
      </label>
      <input
        type={type}
        disabled={disabled}
        maxLength={maxLength}
        min={isNumber ? 0 : undefined}
        onKeyDown={handleKeyDown}
        onChange={handleChange}
        {...fieldProps}
        className={`w-full rounded-lg p-2.5 text-sm border transition-colors
          ${disabled
            ? "bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed"
            : "bg-white border-gray-300 text-gray-900 focus:ring-2 focus:ring-[#233044] focus:border-[#233044] hover:border-gray-400"
          }`}
      />
    </div>
  );
}

// Like Select, but lets the user type free text or pick from the suggestion list.
export function Combobox({
  label,
  name,
  register,
  rules,
  options = [],
  disabled = false,
  placeholder = "",
}) {
  const listId = `${name}-datalist`;
  return (
    <div>
      <label className="block mb-1 text-sm font-semibold text-gray-700">
        {label}
      </label>
      <input
        type="text"
        list={listId}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete="off"
        {...register(name, rules)}
        className={`w-full rounded-lg p-2.5 text-sm border transition-colors
          ${disabled
            ? "bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed"
            : "bg-white border-gray-300 text-gray-900 focus:ring-2 focus:ring-[#233044] focus:border-[#233044] hover:border-gray-400"
          }`}
      />
      <datalist id={listId}>
        {options.map((opt) => (
          <option key={opt} value={opt} />
        ))}
      </datalist>
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