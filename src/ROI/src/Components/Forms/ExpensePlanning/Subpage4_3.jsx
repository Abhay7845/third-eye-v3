import { useEffect, useState } from "react";
import { useSection4Context } from "./Section4Context";
import { toast } from "react-toastify";

const YEARS = ["Yr. 1", "Yr. 2", "Yr. 3", "Yr. 4", "Yr. 5", "Yr. 6"];

const fmt = (n) =>
    n === null || n === undefined || isNaN(n)
        ? "—"
        : Number(n).toLocaleString("en-IN", { maximumFractionDigits: 0 });

const fmtPct = (n) =>
    n === null || n === undefined || isNaN(n) ? "—" : `${Number(n).toFixed(2)}%`;

// ─── Reusable table cells ────────────────────────────────────────────────────
function LabelCell({ label, subLabel }) {
    return (
        <td className="border border-gray-200 px-3 py-2 text-sm text-gray-800 bg-white min-w-[200px]">
            <strong>{label}</strong>
            {subLabel && <div className="text-xs text-gray-400 mt-0.5">{subLabel}</div>}
        </td>
    );
}

function AutoCell({ value, prefix = "₹", highlight = false }) {
    return (
        <td
            className={`border border-gray-200 px-3 py-2 text-sm text-right ${
                highlight ? "bg-amber-50 font-bold text-amber-800" : "bg-gray-50 text-gray-700"
            }`}
        >
            {value === "—" || value === null || value === undefined ? "—" : `${prefix} ${fmt(value)}`}
        </td>
    );
}

function BlueInputCell({ value, onChange, disabled, prefix = "" }) {
    return (
        <td className={`border border-gray-200 p-0 ${disabled ? "bg-gray-100" : "bg-blue-50"}`}>
            <div className="flex items-center">
                {prefix && <span className="pl-2 text-sm text-blue-700 font-bold">{prefix}</span>}
                <input
                    type="number"
                    min={0}
                    value={value}
                    onChange={onChange}
                    disabled={disabled}
                    className={`w-full px-2 py-2 bg-transparent text-center text-sm text-blue-900 focus:outline-none focus:ring-1 focus:ring-inset focus:ring-blue-400 ${
                        disabled ? "cursor-not-allowed text-gray-500" : ""
                    }`}
                />
            </div>
        </td>
    );
}

function SectionHeader({ label }) {
    return (
        <thead>
            <tr className="bg-amber-700 text-white text-sm font-semibold">
                <th className="border border-amber-600 px-3 py-2 text-left min-w-[200px]">{label}</th>
                {YEARS.map((yr) => (
                    <th key={yr} className="border border-amber-600 px-3 py-2 text-center min-w-[110px]">{yr}</th>
                ))}
                <th className="border border-amber-600 px-3 py-2 text-center min-w-[120px]">Security Deposit</th>
            </tr>
        </thead>
    );
}

function SectionHeaderNoSD({ label, extraCol }) {
    return (
        <thead>
            <tr className="bg-amber-700 text-white text-sm font-semibold">
                <th className="border border-amber-600 px-3 py-2 text-left min-w-[200px]">{label}</th>
                {extraCol && <th className="border border-amber-600 px-3 py-2 text-left min-w-[140px]">{extraCol}</th>}
                <th className="border border-amber-600 px-3 py-2 text-left min-w-[160px]">Annual Cost Escalation</th>
                {YEARS.map((yr) => (
                    <th key={yr} className="border border-amber-600 px-3 py-2 text-center min-w-[110px]">{yr}</th>
                ))}
            </tr>
        </thead>
    );
}

// ─── Escalation calculator ────────────────────────────────────────────────────
function escalate(base, pct, years = 6) {
    const result = [];
    let current = base;
    for (let i = 0; i < years; i++) {
        result.push(Math.round(current));
        current = current * (1 + pct / 100);
    }
    return result;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Subpage4_3({ handlePrevious, onNext }) {
    const { storeData, subpage4_1Data, subpage4_2Data, markStepSaved } = useSection4Context();

    // ── Rent inputs (6 years) ─────────────────────────────────────────────────
    const [revenueSharing, setRevenueSharing]       = useState("No");
    const [sba, setSba]                             = useState(Array(6).fill(22000));
    const [ratePerSqft, setRatePerSqft]             = useState(Array(6).fill(100));
    const [revSharePct, setRevSharePct]             = useState([2.0, 2.0, 2.0, 2.3, 2.3, 2.3]);
    const [minGuaranteeMth, setMinGuaranteeMth]     = useState(Array(6).fill(5500000));
    const [nsv, setNsv]                             = useState(Array(6).fill(0)); // Net Sales Values for Rev Sharing calc
    const [securityDepositRate, setSecurityDepositRate] = useState(19800000); // single value

    const [isSaving, setIsSaving] = useState(false);
    const [isSaved, setIsSaved]   = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [screen1Expenses, setScreen1Expenses] = useState(null);

    const fetchExpenseData = async () => {
        if (!storeData?.roiid) return;
        try {
            const res = await fetch("http://127.0.0.1:8000/sales_planning", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ screen: 1, roiid: storeData.roiid }),
            });
            if (!res.ok) {
                toast.error("Failed to load key expense reference data.");
                return;
            }
            const json = await res.json();
            setScreen1Expenses(json.data?.[0] ?? null);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load key expense reference data.");
        }
    };

    useEffect(() => {
        fetchExpenseData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [storeData?.roiid]);

    // Pull year-1 data from upstream subpages
    const salaryYr1         = subpage4_2Data?.salaries?.totalAnnualTotal  ?? 0;
    const secHkYr1          = subpage4_2Data?.securityHousekeeping?.totalAnnual ?? 0;
    const electricityYr1    = subpage4_2Data?.electricity?.total            ?? 0;
    const totalCapex        = subpage4_1Data?.totalCapex                   ?? 0;
    const interiors         = subpage4_1Data?.interiors                    ?? 0;

    // ── Computed rent ─────────────────────────────────────────────────────────
    const annualRent = YEARS.map((_, i) => {
        const baseRent = sba[i] * ratePerSqft[i] * 12;
        if (revenueSharing === "No") return baseRent;
        // Revenue sharing: max of (revShare% × NSV × 100000) or (minGuarantee × 12)
        const revShare = (revSharePct[i] / 100) * (parseFloat(nsv[i]) || 0) * 100000;
        const minGuaranteeAnnual = parseFloat(minGuaranteeMth[i]) * 12;
        return Math.max(revShare, minGuaranteeAnnual);
    });
    const monthlyRent = annualRent.map((r) => Math.round(r / 12));

    // ── Expense Summary rows — computed with escalation ──────────────────────
    // ── Yr1 base values from Screen 3 Subpage 1 (Key Expenses, stored as monthly) ────
    const toAnnual = (monthly) => (parseFloat(monthly) || 0) * 12;
    const s1 = screen1Expenses;

    // Repairs & Maintenance: screen1 Yr1 base, 5% escalation
    const repairs = escalate(s1 ? toAnnual(s1["repairs maintenance"]) : 0, 5);

    // Insurance: screen1 Yr1 base, 5% escalation
    const insurance = escalate(s1 ? toAnnual(s1.insurance) : (interiors * 0.01), 5);

    // BTL: screen1 Yr1 base, 10% escalation
    const btl = escalate(s1 ? toAnnual(s1.btl) : 100000, 10);

    // Travel & Conveyance: screen1 Yr1 base, 7% escalation
    const travel = escalate(s1 ? toAnnual(s1["travel & Conveyance"]) : (17500 * 12), 7);

    // Telephone/Internet: screen1 Yr1 base, 7% escalation
    const telephone = escalate(s1 ? toAnnual(s1["telephone/internet"]) : (11000 * 12), 7);

    // Credit Card Commission: screen1 Yr1 base, 5% escalation
    const creditCard = escalate(s1 ? toAnnual(s1["credit card commission"]) : 0, 5);

    // GST (primarily rental): screen1 Yr1 base, 3% escalation
    const gst = escalate(s1 ? toAnnual(s1["GST (primarily rental)"]) : 0, 3);

    // Store Printing/Pantry: screen1 Yr1 base, 10% escalation
    const printing = escalate(s1 ? toAnnual(s1["Store - Printing/Pantry"]) : (17500 * 12), 10);

    // Consumables: screen1 Yr1 base, 10% escalation
    const consumables = escalate(s1 ? toAnnual(s1.consumables) : (20000 * 12), 10);

    // Other — Staff welfare/Uniforms: screen1 Yr1 base, 10% escalation
    const totalNos = subpage4_2Data?.salaries?.totalNos ?? 0;
    const staffWelfare = escalate(s1 ? toAnnual(s1["Other - Staff welfare/Uniforms"]) : (3500 * totalNos * 12), 10);

    // Salaries: 5% escalation from Yr1 (sourced from Subpage 4-2)
    const salaryEscalated = escalate(salaryYr1, 5);

    // Security & Housekeeping: 5% escalation from Yr1 (sourced from Subpage 4-2)
    const secHkEscalated = escalate(secHkYr1, 5);

    // Electricity: 5% escalation from Yr1 (sourced from Subpage 4-2)
    const electricityEscalated = escalate(electricityYr1, 5);

    // Expense summary rows
    const expenseRows = [
        { label: "Rent",                          basis: "as under",           escalation: "—",   values: annualRent },
        { label: "Salaries",                       basis: "as under",           escalation: "5%",  values: salaryEscalated },
        { label: "Security & Housekeeping",        basis: "as under",           escalation: "5%",  values: secHkEscalated },
        { label: "Electricity",                    basis: "as under",           escalation: "5%",  values: electricityEscalated },
        { label: "Repairs & Maintenance",          basis: "1%–3% initial capex", escalation: "% capex", values: repairs },
        { label: "Insurance",                      basis: "1% interiors",       escalation: "% interiors", values: insurance },
        { label: "BTL",                            basis: "0.3% sale",          escalation: "% sale", values: btl },
        { label: "Travel & Conveyance",            basis: "17.5k p.m",         escalation: "7%",  values: travel },
        { label: "Telephone/Internet",             basis: "11k p.m",            escalation: "7%",  values: telephone },
        { label: "Credit Card Commission",         basis: "30% sale @ 1.2%",    escalation: "% sale", values: creditCard },
        { label: "GST (primarily rental)",         basis: "0.1% sale",          escalation: "% sale", values: gst },
        { label: "Store — Printing/Pantry etc",    basis: "17.5k p.m",         escalation: "10%", values: printing },
        { label: "Consumables, Safety, Cust Exp",  basis: "20k p.m",            escalation: "10%", values: consumables },
        { label: "Other — Staff welfare/Uniforms", basis: "3.5k/person/month",  escalation: "10%", values: staffWelfare },
    ];

    const totalExpenses = YEARS.map((_, i) =>
        expenseRows.reduce((sum, row) => sum + (parseFloat(row.values[i]) || 0), 0)
    );

    const isFormComplete = revenueSharing !== "" &&
        sba.every((v) => parseFloat(v) > 0) &&
        ratePerSqft.every((v) => parseFloat(v) > 0);

    const handleInputArray = (setter, index, value) => {
        setter((prev) => {
            const updated = [...prev];
            updated[index] = value;
            return updated;
        });
    };

    const handleSave = async () => {
        setIsSaving(true);
        const payload = {
            roiid: storeData?.roiid,
            rent: { revenueSharing, sba, ratePerSqft, revSharePct, minGuaranteeMth, annualRent, monthlyRent, securityDeposit: securityDepositRate },
            expenseSummary: {
                rows: expenseRows.map((r) => ({ label: r.label, basis: r.basis, escalation: r.escalation, values: r.values })),
                total: totalExpenses,
            },
        };

        try {
            const res = await fetch("http://127.0.0.1:8000/expense_planning_page3", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                const errData = await res.json().catch(() => null);
                toast.error(errData?.message ?? "Failed to save expense summary. Please try again.");
                return;
            }
            setIsSaved(true);
            markStepSaved(2);
            setShowModal(true);
        } catch (err) {
            console.error(err);
            toast.error("An unexpected error occurred. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="p-6 bg-gradient-to-br from-orange-50 to-amber-50 min-h-screen space-y-8">
            {/* Header */}
            <div>
                <h2 className="text-3xl font-bold text-gray-800 mb-1">Stage 3 — Rent &amp; Expense Summary</h2>
                <p className="text-gray-500 text-sm">Configure rent terms and review the 6-year expense projection</p>
            </div>

            {/* ──────────────────────────────────────────────────────────────
                REVENUE SHARING TOGGLE
            ────────────────────────────────────────────────────────────── */}
            <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center gap-6">
                    <span className="text-sm font-bold text-gray-700 min-w-[200px]">Revenue Sharing For Rentals</span>
                    <select
                        value={revenueSharing}
                        onChange={(e) => setRevenueSharing(e.target.value)}
                        disabled={isSaved}
                        className={`px-4 py-2 border-2 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-400 ${
                            revenueSharing === "Yes"
                                ? "border-green-400 bg-green-50 text-green-800"
                                : "border-gray-300 bg-white text-gray-700"
                        } ${isSaved ? "cursor-not-allowed" : ""}`}
                    >
                        <option value="No">No</option>
                        <option value="Yes">Yes</option>
                    </select>
                    {revenueSharing === "Yes" && (
                        <span className="text-xs text-amber-700 bg-amber-100 px-3 py-1 rounded-full">
                            Max of: (RevShare% × NSV × 1,00,000) or (Min Guarantee × 12)
                        </span>
                    )}
                </div>
            </div>

            {/* ──────────────────────────────────────────────────────────────
                RENT TABLE
            ────────────────────────────────────────────────────────────── */}
            <div className="bg-white rounded-xl shadow-lg overflow-x-auto">
                <div className="px-6 py-4 border-b border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800">Rent &amp; Security Deposit (₹)</h3>
                </div>
                <table className="min-w-full border-collapse text-sm">
                    <SectionHeader label="Parameter" />
                    <tbody>
                        {/* SBA */}
                        <tr>
                            <LabelCell label="Square Foot — Super Built Area" />
                            {sba.map((v, i) => (
                                <BlueInputCell
                                    key={i}
                                    value={v}
                                    onChange={(e) => handleInputArray(setSba, i, e.target.value)}
                                    disabled={isSaved}
                                />
                            ))}
                            <td className="border border-gray-200 px-3 py-2 text-right text-gray-600 bg-gray-50">
                                {fmt(sba[0])}
                            </td>
                        </tr>

                        {/* Rate per sqft */}
                        <tr>
                            <LabelCell label="Rate per Square Foot (₹)" />
                            {ratePerSqft.map((v, i) => (
                                <BlueInputCell
                                    key={i}
                                    value={v}
                                    onChange={(e) => handleInputArray(setRatePerSqft, i, e.target.value)}
                                    disabled={isSaved}
                                />
                            ))}
                            <td className="border border-gray-200 px-3 py-2 text-right text-gray-600 bg-gray-50">
                                ₹ {fmt(securityDepositRate)}
                            </td>
                        </tr>

                        {/* Revenue sharing % — only visible when YES */}
                        {revenueSharing === "Yes" && (
                            <tr>
                                <LabelCell label="Revenue Sharing (% of Net Sales)" subLabel="NSV in Lakhs" />
                                {revSharePct.map((v, i) => (
                                    <BlueInputCell
                                        key={i}
                                        value={v}
                                        onChange={(e) => handleInputArray(setRevSharePct, i, e.target.value)}
                                        disabled={isSaved}
                                    />
                                ))}
                                <td className="border border-gray-200 px-3 py-2 bg-gray-50" />
                            </tr>
                        )}

                        {/* Min Guarantee — only visible when YES */}
                        {revenueSharing === "Yes" && (
                            <>
                                <tr>
                                    <LabelCell label="Net Sales Value — NSV (₹ Lakhs)" subLabel="For revenue share calc" />
                                    {nsv.map((v, i) => (
                                        <BlueInputCell
                                            key={i}
                                            value={v}
                                            onChange={(e) => handleInputArray(setNsv, i, e.target.value)}
                                            disabled={isSaved}
                                        />
                                    ))}
                                    <td className="border border-gray-200 px-3 py-2 bg-gray-50" />
                                </tr>
                                <tr>
                                    <LabelCell label="Min Guarantee / Monthly (₹)" />
                                    {minGuaranteeMth.map((v, i) => (
                                        <BlueInputCell
                                            key={i}
                                            value={v}
                                            onChange={(e) => handleInputArray(setMinGuaranteeMth, i, e.target.value)}
                                            disabled={isSaved}
                                        />
                                    ))}
                                    <td className="border border-gray-200 px-3 py-2 bg-gray-50" />
                                </tr>
                            </>
                        )}

                        {/* Security Deposit — user editable single value */}
                        <tr>
                            <LabelCell label="Security Deposit (₹)" />
                            {YEARS.map((_, i) => (
                                <td key={i} className="border border-gray-200 px-3 py-2 bg-gray-50 text-center text-gray-400">—</td>
                            ))}
                            <td className="border border-gray-200 p-1 bg-blue-50">
                                <input
                                    type="number"
                                    min={0}
                                    value={securityDepositRate}
                                    onChange={(e) => setSecurityDepositRate(e.target.value)}
                                    disabled={isSaved}
                                    className={`w-full px-2 py-2 bg-transparent text-center text-sm text-blue-900 focus:outline-none focus:ring-1 focus:ring-blue-400 ${
                                        isSaved ? "cursor-not-allowed" : ""
                                    }`}
                                />
                            </td>
                        </tr>

                        {/* Total Annual Rent — computed */}
                        <tr className="bg-amber-100 font-bold">
                            <td className="border border-amber-300 px-3 py-2 text-sm">Total Annual Rent</td>
                            {annualRent.map((v, i) => (
                                <td key={i} className="border border-amber-300 px-3 py-2 text-right text-amber-800">
                                    ₹ {fmt(v)}
                                </td>
                            ))}
                            <td className="border border-amber-300 px-3 py-2 text-xs text-gray-500 italic">
                                {revenueSharing === "No"
                                    ? "(SBA × Rate) × 12"
                                    : "Max of RevShare or Min Guarantee × 12"}
                            </td>
                        </tr>

                        {/* Total Monthly Rent */}
                        <tr className="bg-orange-50">
                            <td className="border border-orange-200 px-3 py-2 text-sm font-semibold">Total Monthly Rent</td>
                            {monthlyRent.map((v, i) => (
                                <td key={i} className="border border-orange-200 px-3 py-2 text-right text-orange-700 font-semibold">
                                    ₹ {fmt(v)}
                                </td>
                            ))}
                            <td className="border border-orange-200 px-3 py-2" />
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* ──────────────────────────────────────────────────────────────
                EXPENSE SUMMARY TABLE
            ────────────────────────────────────────────────────────────── */}
            <div className="bg-white rounded-xl shadow-lg overflow-x-auto">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-gray-800">Expense Summary — Value in ₹ Terms</h3>
                    <span className="text-xs text-gray-400">6-year projection with escalation</span>
                </div>
                <table className="min-w-full border-collapse text-sm">
                    <SectionHeaderNoSD label="Expense Item" extraCol="Basis" />
                    <tbody>
                        {expenseRows.map(({ label, basis, escalation, values }) => (
                            <tr key={label} className="hover:bg-gray-50">
                                <LabelCell label={label} />
                                <td className="border border-gray-200 px-3 py-2 text-xs text-gray-500 italic bg-white">
                                    {basis}
                                </td>
                                <td className="border border-gray-200 px-3 py-2 text-xs text-gray-500 text-center bg-white">
                                    {escalation}
                                </td>
                                {values.map((v, i) => (
                                    <td
                                        key={i}
                                        className="border border-gray-200 px-3 py-2 text-right text-sm text-gray-700 bg-gray-50"
                                    >
                                        {(parseFloat(v) || 0) === 0 ? "—" : `₹ ${fmt(v)}`}
                                    </td>
                                ))}
                            </tr>
                        ))}

                        {/* Total row */}
                        <tr className="bg-amber-100 font-bold">
                            <td className="border border-amber-300 px-3 py-2" colSpan={3}>Total</td>
                            {totalExpenses.map((v, i) => (
                                <td key={i} className="border border-amber-300 px-3 py-2 text-right text-amber-800 text-base">
                                    ₹ {fmt(v)}
                                </td>
                            ))}
                        </tr>
                    </tbody>
                </table>

                {/* Notes */}
                <div className="px-6 py-3 bg-amber-50 border-t border-amber-200 text-xs text-amber-800 space-y-1">
                    <p>• Salaries: increase accounts for both headcount increase and mean salary increase.</p>
                    <p>• Credit Card Commission &amp; GST rows depend on NSV — enter NSV above for revenue-sharing stores.</p>
                </div>
            </div>

            {/* Validation hint */}
            {!isFormComplete && (
                <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 rounded-lg text-sm text-yellow-800">
                    Please fill in all rent parameters (SBA and rate) for all 6 years before saving.
                </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between gap-4 mt-4">
                <button
                    type="button"
                    onClick={handlePrevious}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold px-8 py-3 rounded-lg shadow transition"
                >
                    ← Previous
                </button>

                {!isSaved ? (
                    <button
                        type="button"
                        disabled={!isFormComplete || isSaving}
                        onClick={handleSave}
                        className={`font-semibold px-8 py-3 rounded-lg shadow-lg transition transform ${
                            isFormComplete && !isSaving
                                ? "bg-amber-600 hover:bg-amber-700 text-white hover:scale-105 cursor-pointer"
                                : "bg-gray-400 text-gray-200 cursor-not-allowed"
                        }`}
                    >
                        {isSaving ? "Saving…" : "Save & Complete"}
                    </button>
                ) : (
                    <div className="flex items-center gap-3 bg-green-100 border border-green-400 text-green-800 font-semibold px-6 py-3 rounded-lg">
                        ✓ Expense Planning Complete
                    </div>
                )}
            </div>

            {/* ── Summary Modal ─────────────────────────────────────────── */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
                        <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-8 py-6 rounded-t-2xl">
                            <div className="flex items-center gap-3">
                                <span className="text-3xl">✅</span>
                                <div>
                                    <h2 className="text-xl font-bold text-white">Expense Planning Complete</h2>
                                    <p className="text-green-100 text-sm mt-0.5">Rent & Expense data saved successfully</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-8 space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-gray-50 rounded-lg px-4 py-3">
                                    <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Revenue Sharing</p>
                                    <p className="text-gray-800 font-semibold mt-0.5">{revenueSharing}</p>
                                </div>
                                <div className="bg-gray-50 rounded-lg px-4 py-3">
                                    <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Security Deposit</p>
                                    <p className="text-gray-800 font-semibold mt-0.5">₹ {Number(securityDepositRate).toLocaleString("en-IN")}</p>
                                </div>
                            </div>
                        </div>
                        <div className="px-8 pb-8 flex justify-end">
                            <button
                                type="button"
                                onClick={() => { setShowModal(false); onNext?.(); }}
                                className="px-8 py-3 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 transition"
                            >
                                Proceed to Review →
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
