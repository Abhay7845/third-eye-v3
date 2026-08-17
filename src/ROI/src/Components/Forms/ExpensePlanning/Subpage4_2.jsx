import { useEffect, useState } from "react";
import { useSection4Context } from "./Section4Context";
import { toast } from "react-toastify";
import { BASE_URL } from "../data/baseUrl";
// ─── Indian currency formatter ────────────────────────────────────────────────
const fmt = (n) =>
  n === null || n === undefined || isNaN(n)
    ? "—"
    : Number(n).toLocaleString("en-IN", { maximumFractionDigits: 0 });

// ─── Salary Row Component ─────────────────────────────────────────────────────
function SalaryRow({ role, levelOptions, row, onChange, disabled }) {
  const annualFixed =
    (parseFloat(row.monthly) || 0) * 12 * (parseFloat(row.nos) || 0);
  const annualVariable =
    annualFixed * ((parseFloat(row.variablePct) || 0) / 100);
  const annualTotal = annualFixed + annualVariable;

  return (
    <tr className='hover:bg-gray-50'>
      <td className='border border-gray-200 px-3 py-2 text-xs text-gray-500 bg-gray-50'>
        From DB
      </td>
      <td className='border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700'>
        {role}
      </td>

      {/* Level dropdown */}
      <td className='border border-gray-200 p-1 bg-blue-50'>
        <select
          value={row.level}
          onChange={(e) => onChange(role, "level", e.target.value)}
          disabled={disabled}
          className={`w-full px-2 py-1 border border-blue-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 ${
            disabled ? "bg-gray-100 cursor-not-allowed" : "bg-white"
          }`}>
          <option>Select</option>
          {levelOptions.map((item) => (
            <option key={item.level} value={item.level}>
              {item.level}
            </option>
          ))}
        </select>
      </td>

      {/* Ref salary — read only from DB */}
      <td className='border border-gray-200 px-3 py-2 text-sm text-right text-gray-500 bg-gray-50'>
        ₹ {fmt(row.refSalary / 12)}
      </td>

      <td className='border border-gray-200 px-3 py-2 text-sm text-right text-gray-500 bg-gray-50'>
        ₹ {fmt(row.refSalary)}
      </td>

      {/* Nos. — editable */}
      <td className='border border-gray-200 p-1 bg-blue-50'>
        <input
          type='number'
          min={0}
          value={row.nos}
          onChange={(e) => onChange(role, "nos", e.target.value)}
          disabled={disabled}
          className={`w-full px-2 py-1.5 bg-transparent text-center text-sm text-blue-900 focus:outline-none focus:ring-1 focus:ring-blue-400 ${
            disabled ? "cursor-not-allowed text-gray-500" : ""
          }`}
        />
      </td>

      {/* Monthly fixed — editable */}
      <td className='border border-gray-200 p-1 bg-blue-50'>
        <input
          type='number'
          min={0}
          value={row.monthly}
          onChange={(e) => onChange(role, "monthly", e.target.value)}
          disabled={disabled}
          className={`w-full px-2 py-1.5 bg-transparent text-center text-sm text-blue-900 focus:outline-none focus:ring-1 focus:ring-blue-400 ${
            disabled ? "cursor-not-allowed text-gray-500" : ""
          }`}
        />
      </td>

      {/* Annual fixed — computed */}
      <td className='border border-gray-200 px-3 py-2 text-sm text-right text-gray-600 bg-gray-50'>
        ₹ {fmt(annualFixed)}
      </td>

      {/* Variable % — editable */}
      <td className='border border-gray-200 p-1 bg-blue-50'>
        <input
          type='number'
          min={0}
          max={100}
          value={row.variablePct}
          onChange={(e) => onChange(role, "variablePct", e.target.value)}
          disabled={disabled}
          className={`w-full px-2 py-1.5 bg-transparent text-center text-sm text-blue-900 focus:outline-none focus:ring-1 focus:ring-blue-400 ${
            disabled ? "cursor-not-allowed text-gray-500" : ""
          }`}
        />
      </td>

      {/* Annual variable — computed */}
      <td className='border border-gray-200 px-3 py-2 text-sm text-right text-gray-600 bg-gray-50'>
        ₹ {fmt(annualVariable)}
      </td>

      {/* Annual total — computed */}
      <td className='border border-gray-200 px-3 py-2 text-sm text-right font-semibold text-gray-800 bg-amber-50'>
        ₹ {fmt(annualTotal)}
      </td>
    </tr>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Subpage4_2({ handleNext, handlePrevious }) {
  const { storeData, markStepSaved, setSubpage4_2Data, subpage4_1Data } =
    useSection4Context();
  const [resourceRoles, setResourceRoles] = useState([]);
  const [salaryRows, setSalaryRows] = useState({});
  const [roleLevels, setRoleLevels] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showModal, setShowModal] = useState(false);
  // Mark as saved if resource data already exists when resuming
  useEffect(() => {
    const roiid = storeData?.roiid;
    if (!roiid || isSaved) return;
    (async () => {
      try {
        const res = await fetch(
          `${BASE_URL}/expense_details/${roiid}?expense_type=RESOURCE`,
        );
        if (!res.ok) return;
        const json = await res.json();
        const row = json?.data?.[0];
        if (!row) return;
        if (row.salaries?.rows) setSalaryRows(row.salaries.rows);
        if (row.electricity?.ratePerSqft != null)
          setElectricity({ ratePerSqft: row.electricity.ratePerSqft });
        if (row.otherExpenses) setOtherExpenses(row.otherExpenses);
        if (row.securityHousekeeping?.rows)
          setSecHousekeeping(row.securityHousekeeping.rows);
        setIsSaved(true);
      } catch (e) {
        console.error("Failed to load saved resource data:", e);
      }
    })();
  }, [storeData?.roiid]);

  // ── Expense state (Yr. 1) — editable ─────────────────────────────────────
  const [electricity, setElectricity] = useState({ ratePerSqft: 25 });
  const [otherExpenses, setOtherExpenses] = useState({
    registrationCharges: 500000,
    relocCost: 10000000, // 1 Cr default
  });
  const [secHousekeeping, setSecHousekeeping] = useState([
    { role: "Security", nos: 2, monthly: 20000 },
    { role: "Housekeeping", nos: 3, monthly: 15000 },
  ]);

  // ── Fetch level options and reference salary data ─────────────────────────

  const fetchHeadCount = async (storeCode) => {
    const res = await fetch(`${BASE_URL}/head_count?store=${storeCode}`);

    if (!res.ok) {
      throw new Error("Failed to fetch headcount");
    }

    const json = await res.json();

    return json.data.reduce((acc, item) => {
      acc[item.role.trim().toUpperCase()] = item.headcount;
      return acc;
    }, {});
  };

  const handleFetchStoreData = async () => {
    const roiid = storeData?.roiid;

    const res = await fetch(
      `${BASE_URL}/fetchScreen?parameter=roi_basic_store_details&roiid=${roiid}`,
    );

    if (!res.ok) {
      throw new Error("Failed to fetch store");
    }

    const json = await res.json();

    const storeCode =
      storeData?.project_type === "New Store"
        ? storeData?.refStoreCode
        : json.data?.[0]?.exsisting_store_code;

    return await fetchHeadCount(storeCode);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Fetch roles
        const roleRes = await fetch(`${BASE_URL}/attribute/resource_roles`);

        if (!roleRes.ok) throw new Error("Failed to fetch roles");

        const roleJson = await roleRes.json();

        const roles = roleJson.data
          .filter(
            (r) =>
              r.resource_roles !== "Security" &&
              r.resource_roles !== "House Keeping",
          )
          .map((r) => r.resource_roles);
        setResourceRoles(roles);

        // Fetch levels for all roles
        const roleLevelMap = {};

        await Promise.all(
          roles.map(async (role) => {
            const res = await fetch(
              `${BASE_URL}/role_level?role=${encodeURIComponent(role)}`,
            );
            const json = await res.json();
            roleLevelMap[role] = json.data || [];
          }),
        );

        setRoleLevels(roleLevelMap);

        // Fetch headcount
        const headCountMap = await handleFetchStoreData();

        // Alias mapping
        const roleAlias = {
          RSOS: "RSO",
          "TEAM-LEADS (NEW STRUCTURE)": "TEAM-LEADS",
        };

        // Create salary rows
        const rows = Object.fromEntries(
          roles.map((role) => {
            const normalized = role.trim().toUpperCase();
            const lookup = roleAlias[normalized] || normalized;

            return [
              role,
              {
                level: "",
                refSalary: 0,
                monthly: 0,
                variablePct: 15,
                nos: headCountMap[lookup] ?? 0,
              },
            ];
          }),
        );

        setSalaryRows(rows);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSalaryChange = (role, field, value) => {
    setSalaryRows((prev) => {
      const updated = {
        ...prev,
        [role]: {
          ...prev[role],
          [field]: value,
        },
      };

      if (field === "level") {
        const selected = roleLevels[role]?.find((item) => item.level === value);
        const annualRef = selected?.salary || 0;
        updated[role].refSalary = annualRef;
        // Auto-fill monthly fixed with the ref monthly salary so user sees a starting value
        updated[role].monthly = annualRef > 0 ? Math.round(annualRef / 12) : 0;
      }
      return updated;
    });
  };

  const handleSecChange = (index, field, value) => {
    setSecHousekeeping((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // ── Derived totals ────────────────────────────────────────────────────────
  const carpetArea =
    storeData?.project_type === "Renovation" ||
    storeData?.project_type === "New Store"
      ? parseFloat(storeData?.new_retail_area)
      : parseFloat(storeData?.existing_retail_area);

  const totalMonthlyFixed = Object.values(salaryRows).reduce(
    (s, r) => s + (parseFloat(r.monthly) || 0),
    0,
  );
  const totalrefMonthlyFixed = Object.values(salaryRows).reduce(
    (s, r) => s + (parseFloat(r.refSalary) || 0),
    0,
  );
  const totalAnnualFixed = Object.entries(salaryRows).reduce((s, [, r]) => {
    const af = (parseFloat(r.monthly) || 0) * 12 * (parseFloat(r.nos) || 0);
    return s + af;
  }, 0);
  const totalAnnualVariable = Object.entries(salaryRows).reduce((s, [, r]) => {
    const af = (parseFloat(r.monthly) || 0) * 12 * (parseFloat(r.nos) || 0);
    return s + af * ((parseFloat(r.variablePct) || 0) / 100);
  }, 0);
  const totalAnnualTotal = totalAnnualFixed + totalAnnualVariable;
  const totalNos = Object.values(salaryRows).reduce(
    (s, r) => s + (parseInt(r.nos) || 0),
    0,
  );

  const electricityTotal =
    carpetArea * (parseFloat(electricity.ratePerSqft) || 0);

  const secTotal = secHousekeeping.reduce(
    (s, r) => s + (parseInt(r.nos) || 0) * (parseFloat(r.monthly) || 0) * 12,
    0,
  );
  const secNos = secHousekeeping.reduce(
    (s, r) => s + (parseInt(r.nos) || 0),
    0,
  );
  const secMonthlyTotal = secHousekeeping.reduce(
    (s, r) => s + (parseFloat(r.monthly) || 0),
    0,
  );

  const otherTotal =
    (parseFloat(otherExpenses.registrationCharges) || 0) +
    (parseFloat(otherExpenses.relocCost) || 0);

  // sqft/emp and cost/emp stats
  const sqftPerEmp = totalNos > 0 ? Math.round(carpetArea / totalNos) : 0;
  const costPerEmp = totalNos > 0 ? Math.round(totalAnnualTotal / totalNos) : 0;

  const isFormComplete = Object.values(salaryRows).every(
    (r) => r.level !== "" && parseFloat(r.monthly) > 0,
  );

  const handleSave = async () => {
    setIsSaving(true);
    const payload = {
      roiid: storeData?.roiid,
      salaries: {
        rows: salaryRows,
        totalMonthlyFixed,
        totalAnnualFixed,
        totalAnnualVariable,
        totalAnnualTotal,
        totalNos,
        sqftPerEmp,
        costPerEmp,
      },
      electricity: {
        carpetArea,
        ratePerSqft: electricity.ratePerSqft,
        total: electricityTotal,
      },
      otherExpenses: {
        ...otherExpenses,
        total: otherTotal,
      },
      securityHousekeeping: {
        rows: secHousekeeping,
        totalNos: secNos,
        totalMonthly: secMonthlyTotal,
        totalAnnual: secTotal,
      },
    };

    try {
      const res = await fetch(`${BASE_URL}/expense_planning_page2`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error("Save failed");
      }

      const data = await res.json();

      toast.success(data.message || "Expense data saved successfully!");

      setSubpage4_2Data(payload);
      setIsSaved(true);
      markStepSaved(1);
      setShowModal(true);
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to save Expense data");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className='flex items-center justify-center min-h-[300px]'>
        <p className='text-gray-500 text-lg animate-pulse'>
          Loading salary data…
        </p>
      </div>
    );
  }

  return (
    <div className='p-6 bg-gradient-to-br from-orange-50 to-amber-50 min-h-screen space-y-8'>
      {/* Header */}
      <div>
        <h2 className='text-3xl font-bold text-gray-800 mb-1'>
          Stage 2 — Salaries & Operating Expenses
        </h2>
        <p className='text-gray-500 text-sm'>
          Configure staff salaries, electricity, security &amp; other operating
          costs for Year 1
        </p>
      </div>

      {/* ──────────────────────────────────────────────────────────────
                SALARY TABLE
            ────────────────────────────────────────────────────────────── */}
      <div className='bg-white rounded-xl shadow-lg overflow-x-auto'>
        <div className='px-6 py-4 border-b border-gray-100 flex items-center justify-between'>
          <h3 className='text-lg font-bold text-gray-800'>
            Salaries (₹) — Year 1
          </h3>
          <span className='text-xs text-gray-400'>
            Blue cells are editable &nbsp;|&nbsp; Gray cells are auto-calculated
          </span>
        </div>
        <table className='min-w-full border-collapse text-sm'>
          <thead>
            <tr className='bg-amber-700 text-white text-xs font-semibold'>
              <th className='border border-amber-600 px-3 py-2 text-center'>
                Source
              </th>
              <th className='border border-amber-600 px-3 py-2 text-left min-w-[180px]'>
                Role
              </th>
              <th className='border border-amber-600 px-3 py-2 text-center min-w-[100px]'>
                Level
              </th>
              <th className='border border-amber-600 px-3 py-2 text-center min-w-[110px]'>
                Monthly Ref Salary
              </th>
              <th className='border border-amber-600 px-3 py-2 text-center min-w-[110px]'>
                Annual Ref Salary
              </th>
              <th className='border border-amber-600 px-3 py-2 text-center min-w-[70px]'>
                Nos.
              </th>
              <th className='border border-amber-600 px-3 py-2 text-center min-w-[110px]'>
                Monthly Fixed
              </th>
              <th className='border border-amber-600 px-3 py-2 text-center min-w-[110px]'>
                Annual Fixed
              </th>
              <th className='border border-amber-600 px-3 py-2 text-center min-w-[90px]'>
                Variable %
              </th>
              <th className='border border-amber-600 px-3 py-2 text-center min-w-[110px]'>
                Annual Variable
              </th>
              <th className='border border-amber-600 px-3 py-2 text-center min-w-[110px]'>
                Annual Total
              </th>
            </tr>
          </thead>
          <tbody>
            {resourceRoles.map((role) => (
              <SalaryRow
                key={role}
                role={role}
                levelOptions={roleLevels[role] || []}
                row={
                  salaryRows[role] ?? {
                    level: "",
                    nos: 0,
                    refSalary: 0,
                    monthly: 0,
                    variablePct: 15,
                  }
                }
                onChange={handleSalaryChange}
                disabled={isSaved}
              />
            ))}

            {/* Total row */}
            <tr className='bg-amber-100 font-bold text-sm'>
              <td className='border border-amber-300 px-3 py-2' colSpan={2}>
                Total
              </td>
              <td className='border border-amber-300 px-3 py-2 text-center text-gray-500'>
                —
              </td>
              <td className='border border-amber-300 px-3 py-2 text-right text-amber-800'>
                ₹ {fmt(totalrefMonthlyFixed)}
              </td>
              <td className='border border-amber-300 px-3 py-2 text-right text-amber-800'>
                ₹ {fmt(totalrefMonthlyFixed * 12)}
              </td>
              <td className='border border-amber-300 px-3 py-2 text-center text-amber-800'>
                {totalNos}
              </td>
              <td className='border border-amber-300 px-3 py-2 text-right text-amber-800'>
                ₹ {fmt(totalMonthlyFixed)}
              </td>
              <td className='border border-amber-300 px-3 py-2 text-right text-amber-800'>
                ₹ {fmt(totalAnnualFixed)}
              </td>
              <td className='border border-amber-300 px-3 py-2 text-center text-gray-500'>
                —
              </td>
              <td className='border border-amber-300 px-3 py-2 text-right text-amber-800'>
                ₹ {fmt(totalAnnualVariable)}
              </td>
              <td className='border border-amber-300 px-3 py-2 text-right text-amber-800'>
                ₹ {fmt(totalAnnualTotal)}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Salary stats */}
        <div className='px-6 py-3 bg-amber-50 border-t border-amber-200 flex gap-8 text-sm'>
          <span>
            <strong>Sqft / Emp:</strong> {sqftPerEmp}
          </span>
          <span>
            <strong>Cost / Emp:</strong> ₹ {fmt(costPerEmp)}
          </span>
        </div>
        <p className='px-6 py-2 text-xs text-gray-400 italic border-t border-gray-100'>
          Note: Salary increase should account for both headcount increase and
          mean salary increase over years.
        </p>
      </div>

      {/* ──────────────────────────────────────────────────────────────
                ELECTRICITY
            ────────────────────────────────────────────────────────────── */}
      <div className='bg-white rounded-xl shadow-lg overflow-hidden'>
        <div className='px-6 py-4 border-b border-gray-100'>
          <h3 className='text-lg font-bold text-gray-800'>
            Electricity — Year 1
          </h3>
        </div>
        <div className='p-6 grid grid-cols-1 md:grid-cols-3 gap-6'>
          <div className='bg-gray-50 rounded-lg p-4 border border-gray-200'>
            <p className='text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1'>
              Carpet Area (sqft)
            </p>
            <p className='text-2xl font-bold text-gray-800'>
              {fmt(carpetArea)}
            </p>
          </div>
          <div className='bg-blue-50 rounded-lg p-4 border border-blue-200'>
            <p className='text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1'>
              Rate per Sqft (₹)
            </p>
            <input
              type='number'
              min={0}
              value={electricity.ratePerSqft}
              onChange={(e) => setElectricity({ ratePerSqft: e.target.value })}
              disabled={isSaved}
              className={`w-full text-2xl font-bold text-blue-800 bg-transparent focus:outline-none ${
                isSaved ? "cursor-not-allowed" : ""
              }`}
            />
          </div>
          <div className='bg-amber-50 rounded-lg p-4 border border-amber-200'>
            <p className='text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1'>
              Total — ₹
            </p>
            <p className='text-2xl font-bold text-amber-800'>
              ₹ {fmt(electricityTotal)}
            </p>
          </div>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────────
                OTHER EXPENSES
            ────────────────────────────────────────────────────────────── */}
      <div className='bg-white rounded-xl shadow-lg overflow-hidden'>
        <div className='px-6 py-4 border-b border-gray-100'>
          <h3 className='text-lg font-bold text-gray-800'>
            Other Expenses — Year 1
          </h3>
        </div>
        <div className='p-6 grid grid-cols-1 md:grid-cols-3 gap-6'>
          <div className='bg-blue-50 rounded-lg p-4 border border-blue-200'>
            <p className='text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1'>
              Registration Charges (₹)
            </p>
            <input
              type='number'
              min={0}
              value={otherExpenses.registrationCharges}
              onChange={(e) =>
                setOtherExpenses((p) => ({
                  ...p,
                  registrationCharges: e.target.value,
                }))
              }
              disabled={isSaved}
              className={`w-full text-2xl font-bold text-blue-800 bg-transparent focus:outline-none ${
                isSaved ? "cursor-not-allowed" : ""
              }`}
            />
          </div>
          <div className='bg-blue-50 rounded-lg p-4 border border-blue-200'>
            <p className='text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1'>
              Temporary Relocation Cost (₹)
            </p>
            <input
              type='number'
              min={0}
              value={otherExpenses.relocCost}
              onChange={(e) =>
                setOtherExpenses((p) => ({ ...p, relocCost: e.target.value }))
              }
              disabled={isSaved}
              className={`w-full text-2xl font-bold text-blue-800 bg-transparent focus:outline-none ${
                isSaved ? "cursor-not-allowed" : ""
              }`}
            />
          </div>
          <div className='bg-amber-50 rounded-lg p-4 border border-amber-200'>
            <p className='text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1'>
              Total — ₹
            </p>
            <p className='text-2xl font-bold text-amber-800'>
              ₹ {fmt(otherTotal)}
            </p>
          </div>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────────
                SECURITY & HOUSEKEEPING
            ────────────────────────────────────────────────────────────── */}
      <div className='bg-white rounded-xl shadow-lg overflow-x-auto'>
        <div className='px-6 py-4 border-b border-gray-100'>
          <h3 className='text-lg font-bold text-gray-800'>
            Security &amp; Housekeeping — Year 1
          </h3>
        </div>
        <table className='min-w-full border-collapse text-sm'>
          <thead>
            <tr className='bg-amber-700 text-white text-xs font-semibold'>
              <th className='border border-amber-600 px-4 py-2 text-left min-w-[160px]'>
                Role
              </th>
              <th className='border border-amber-600 px-4 py-2 text-center min-w-[80px]'>
                Nos.
              </th>
              <th className='border border-amber-600 px-4 py-2 text-center min-w-[120px]'>
                Monthly (₹)
              </th>
              <th className='border border-amber-600 px-4 py-2 text-center min-w-[130px]'>
                Annual (₹)
              </th>
            </tr>
          </thead>
          <tbody>
            {secHousekeeping.map((row, idx) => {
              const annual =
                (parseInt(row.nos) || 0) * (parseFloat(row.monthly) || 0) * 12;
              return (
                <tr key={row.role} className='hover:bg-gray-50'>
                  <td className='border border-gray-200 px-4 py-2 font-semibold text-gray-700'>
                    {row.role}
                  </td>
                  <td className='border border-gray-200 p-1 bg-blue-50'>
                    <input
                      type='number'
                      min={0}
                      value={row.nos}
                      onChange={(e) =>
                        handleSecChange(idx, "nos", e.target.value)
                      }
                      disabled={isSaved}
                      className={`w-full px-2 py-1.5 bg-transparent text-center text-sm text-blue-900 focus:outline-none focus:ring-1 focus:ring-blue-400 ${
                        isSaved ? "cursor-not-allowed" : ""
                      }`}
                    />
                  </td>
                  <td className='border border-gray-200 p-1 bg-blue-50'>
                    <input
                      type='number'
                      min={0}
                      value={row.monthly}
                      onChange={(e) =>
                        handleSecChange(idx, "monthly", e.target.value)
                      }
                      disabled={isSaved}
                      className={`w-full px-2 py-1.5 bg-transparent text-center text-sm text-blue-900 focus:outline-none focus:ring-1 focus:ring-blue-400 ${
                        isSaved ? "cursor-not-allowed" : ""
                      }`}
                    />
                  </td>
                  <td className='border border-gray-200 px-4 py-2 text-right text-gray-700 bg-amber-50'>
                    ₹ {fmt(annual)}
                  </td>
                </tr>
              );
            })}
            {/* Total row */}
            <tr className='bg-amber-100 font-bold'>
              <td className='border border-amber-300 px-4 py-2'>
                Total annual cost
              </td>
              <td className='border border-amber-300 px-4 py-2 text-center'>
                {secNos}
              </td>
              <td className='border border-amber-300 px-4 py-2 text-right'>
                ₹ {fmt(secMonthlyTotal)}
              </td>
              <td className='border border-amber-300 px-4 py-2 text-right text-amber-800'>
                ₹ {fmt(secTotal)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Validation hint */}
      {!isFormComplete && (
        <div className='bg-yellow-100 border-l-4 border-yellow-500 p-4 rounded-lg text-sm text-yellow-800'>
          Please fill in the level and monthly salary for all roles before
          saving.
        </div>
      )}

      {/* Navigation */}
      <div className='flex justify-between gap-4 mt-4'>
        {/* <button
          type='button'
          onClick={handlePrevious}
          className='bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold px-8 py-3 rounded-lg shadow transition'>
          ← Previous
        </button> */}

        {!isSaved ? (
          <button
            type='button'
            disabled={!isFormComplete || isSaving}
            onClick={handleSave}
            className={`font-semibold px-8 py-3 rounded-lg shadow-lg transition transform ${
              isFormComplete && !isSaving
                ? "bg-amber-600 hover:bg-amber-700 text-white hover:scale-105 cursor-pointer"
                : "bg-gray-400 text-gray-200 cursor-not-allowed"
            }`}>
            {isSaving ? "Saving…" : "Save"}
          </button>
        ) : (
          <button
            type='button'
            onClick={handleNext}
            className='bg-amber-600 hover:bg-amber-700 text-white font-semibold px-8 py-3 rounded-lg shadow-lg transition transform hover:scale-105 cursor-pointer'>
            Next →
          </button>
        )}
      </div>

      {/* ── Summary Modal ───────────────────────────────────── */}
      {showModal && (
        <div className='fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4'>
          <div className='bg-white rounded-2xl shadow-2xl w-full max-w-md'>
            <div className='bg-gradient-to-r from-amber-500 to-orange-600 px-8 py-6 rounded-t-2xl'>
              <div className='flex items-center gap-3'>
                <span className='text-3xl'>✅</span>
                <div>
                  <h2 className='text-xl font-bold text-white'>
                    Salaries & Expenses Saved
                  </h2>
                  <p className='text-orange-100 text-sm mt-0.5'>
                    Stage 2 of Expense Planning complete
                  </p>
                </div>
              </div>
            </div>
            <div className='p-8 space-y-3'>
              <div className='grid grid-cols-2 gap-3'>
                <div className='bg-gray-50 rounded-lg px-4 py-3'>
                  <p className='text-xs text-gray-400 uppercase tracking-wide font-medium'>
                    Total Staff (Nos.)
                  </p>
                  <p className='text-gray-800 font-semibold mt-0.5'>
                    {totalNos}
                  </p>
                </div>
                <div className='bg-gray-50 rounded-lg px-4 py-3'>
                  <p className='text-xs text-gray-400 uppercase tracking-wide font-medium'>
                    Annual Total Cost
                  </p>
                  <p className='text-gray-800 font-semibold mt-0.5'>
                    ₹ {fmt(totalAnnualTotal)}
                  </p>
                </div>
              </div>
            </div>
            <div className='px-8 pb-8 flex justify-end'>
              <button
                type='button'
                onClick={() => {
                  setShowModal(false);
                  handleNext();
                }}
                className='px-8 py-3 bg-amber-600 text-white rounded-xl font-semibold text-sm hover:bg-amber-700 transition'>
                Proceed to Rent & Summary →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
