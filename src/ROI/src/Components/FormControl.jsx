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
      <label className="block mb-1 font-medium">
        {label}
      </label>

      <input
        type={type}
        disabled={disabled}
        maxLength={maxLength}
        {...register(name, rules)}
        className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-blue-500"
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
      <label className="block mb-1 font-medium">
        {label}
      </label>

      <select
        disabled={disabled}
        {...register(name, rules)}
        className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-blue-500"
      >
        {children}
      </select>
    </div>
  );
}