import { useEffect, useState } from "react";
import { useSection3Context } from "./Section3Context";
import { toast } from "react-toastify";
import { BASE_URL } from "../data/baseUrl";
import { useSelector } from "react-redux";

const YEARS = ["Yr. 1", "Yr. 2", "Yr. 3", "Yr. 4", "Yr. 5", "Yr. 6"];

// ─── Computed / auto-populated values ────────────────────────────────────────
// All values derived from Subpage3_2 (sales mix, shares) and Subpage3_3 (pricing)
// TODO: Replace Array(6).fill("-") with real formula logic when upstream data is wired in
function computeValues(subpage3_2Data, customerDiscount) {
  let cdLCG = Array(6).fill("-");
  let cdMCG = Array(6).fill("-");
  let cdHCG = Array(6).fill("-");
  let cdGIS = Array(6).fill("-");
  let cdRegular = Array(6).fill("-");
  let cdColorStones = Array(6).fill("-");
  let cdSolitaireA = Array(6).fill("-");
  let cdSolitaireB = Array(6).fill("-");
  let cdSolitaireC = Array(6).fill("-");
  let cdSolitaireD = Array(6).fill("-");
  let cdCoins = Array(6).fill("-");
  let cdTotal = Array(6).fill("-");
  let cdPctOfUCP = Array(6).fill("-");
  let ghsPlain = Array(6).fill("-");
  let ghsStudded = Array(6).fill("-");
  let ghsCoins = Array(6).fill("-");
  let ghsTotal = Array(6).fill("-");
  let ghsPctOfUCP = Array(6).fill("-");

  for (let i = 0; i < 6; i++) {
    const totalSales = subpage3_2Data?.total_sales_data?.[i] ?? 0;
    const plainShare = subpage3_2Data?.plainShare?.[i] ?? 0;
    const studdedShare = subpage3_2Data?.studdedShare?.[i] ?? 0;
    const coinsShare = subpage3_2Data?.coinsShare?.[i] ?? 0;

    const lcg = subpage3_2Data?.lcg?.[i] ?? 0;
    const mcg = subpage3_2Data?.mcg?.[i] ?? 0;
    const hcg = subpage3_2Data?.hcg?.[i] ?? 0;

    const gis = subpage3_2Data?.gis?.[i] ?? 0;
    const regular = subpage3_2Data?.regular?.[i] ?? 0;
    const colorStones = subpage3_2Data?.colorStones?.[i] ?? 0;
    const solitaireA = subpage3_2Data?.solitaireA?.[i] ?? 0;
    const solitaireB = subpage3_2Data?.solitaireB?.[i] ?? 0;
    const solitaireC = subpage3_2Data?.solitaireC?.[i] ?? 0;
    const solitaireD = subpage3_2Data?.solitaireD?.[i] ?? 0;

    // Customer Discount
    const cdLCGVal =
      totalSales * plainShare * lcg * (customerDiscount["LCG"] ?? 0);
    const cdMCGVal =
      totalSales * plainShare * mcg * (customerDiscount["MCG"] ?? 0);
    const cdHCGVal =
      totalSales * plainShare * hcg * (customerDiscount["HCG"] ?? 0);

    const cdGISVal =
      totalSales * studdedShare * gis * (customerDiscount["GIS"] ?? 0);
    const cdRegularVal =
      totalSales * studdedShare * regular * (customerDiscount["Regular"] ?? 0);
    const cdColorStonesVal =
      totalSales *
      studdedShare *
      colorStones *
      (customerDiscount["Color Stones"] ?? 0);

    const cdSolitaireAVal =
      totalSales *
      studdedShare *
      solitaireA *
      (customerDiscount["Solitaire A(<70C)"] ?? 0);
    const cdSolitaireBVal =
      totalSales *
      studdedShare *
      solitaireB *
      (customerDiscount["Solitaire B(70-100C)"] ?? 0);
    const cdSolitaireCVal =
      totalSales *
      studdedShare *
      solitaireC *
      (customerDiscount["Solitaire C(1CRT+)"] ?? 0);
    const cdSolitaireDVal =
      totalSales *
      studdedShare *
      solitaireD *
      (customerDiscount["Solitaire D(2CRT+)"] ?? 0);

    const cdCoinsVal =
      totalSales * coinsShare * (customerDiscount["Coins"] ?? 0);

    const cdTotalVal =
      cdLCGVal +
      cdMCGVal +
      cdHCGVal +
      cdGISVal +
      cdRegularVal +
      cdColorStonesVal +
      cdSolitaireAVal +
      cdSolitaireBVal +
      cdSolitaireCVal +
      cdSolitaireDVal +
      cdCoinsVal;

    const cdPctOfUCPVal =
      totalSales !== 0 ? (cdTotalVal / totalSales) * 100 : 0;

    // GHS
    const ghsPlainVal =
      totalSales *
      plainShare *
      (customerDiscount["GHS-Plain Disc % on UCP"] ?? 0);

    const ghsStuddedVal =
      totalSales *
      studdedShare *
      (customerDiscount["GHS-Studded Disc % on UCP"] ?? 0);

    const ghsCoinsVal =
      totalSales *
      coinsShare *
      (customerDiscount["GHS-Coins Disc % on UCP"] ?? 0);

    const ghsTotalVal = ghsPlainVal + ghsStuddedVal + ghsCoinsVal;

    const ghsPctOfUCPVal =
      totalSales !== 0 ? (ghsTotalVal / totalSales) * 100 : 0;

    // Store formatted values
    cdLCG[i] = cdLCGVal.toFixed(2);
    cdMCG[i] = cdMCGVal.toFixed(2);
    cdHCG[i] = cdHCGVal.toFixed(2);
    cdGIS[i] = cdGISVal.toFixed(2);
    cdRegular[i] = cdRegularVal.toFixed(2);
    cdColorStones[i] = cdColorStonesVal.toFixed(2);
    cdSolitaireA[i] = cdSolitaireAVal.toFixed(2);
    cdSolitaireB[i] = cdSolitaireBVal.toFixed(2);
    cdSolitaireC[i] = cdSolitaireCVal.toFixed(2);
    cdSolitaireD[i] = cdSolitaireDVal.toFixed(2);
    cdCoins[i] = cdCoinsVal.toFixed(2);
    cdTotal[i] = cdTotalVal.toFixed(2);
    cdPctOfUCP[i] = cdPctOfUCPVal.toFixed(2);

    ghsPlain[i] = ghsPlainVal.toFixed(2);
    ghsStudded[i] = ghsStuddedVal.toFixed(2);
    ghsCoins[i] = ghsCoinsVal.toFixed(2);
    ghsTotal[i] = ghsTotalVal.toFixed(2);
    ghsPctOfUCP[i] = ghsPctOfUCPVal.toFixed(2);
  }

  return {
    cdLCG,
    cdMCG,
    cdHCG,
    cdGIS,
    cdRegular,
    cdColorStones,
    cdSolitaireA,
    cdSolitaireB,
    cdSolitaireC,
    cdSolitaireD,
    cdCoins,
    cdTotal,
    cdPctOfUCP,
    ghsPlain,
    ghsStudded,
    ghsCoins,
    ghsTotal,
    ghsPctOfUCP,
  };
}

// ─── Reusable cell components ─────────────────────────────────────────────────

function AutoCell({ value = "—" }) {
  const display =
    value === null || value === undefined || value === "—"
      ? "—"
      : typeof value === "number"
      ? value.toLocaleString("en-IN", { maximumFractionDigits: 2 })
      : value;
  return (
    <td className='border border-gray-200 px-3 py-2 bg-gray-50 text-right text-sm text-gray-700 tabular-nums'>
      {display}
    </td>
  );
}

function LabelCell({ label, bold = false }) {
  return (
    <td
      className={`border border-gray-200 px-3 py-2 text-sm text-gray-800 bg-white${
        bold ? " font-semibold" : ""
      }`}>
      <strong>{label}</strong>
    </td>
  );
}

function TotalRow({ label, values }) {
  return (
    <tr className='bg-indigo-50'>
      <LabelCell label={label} bold />
      {values.map((v, i) => (
        <AutoCell key={i} value={v} />
      ))}
    </tr>
  );
}

function PctRow({ label, values }) {
  return (
    <tr className='bg-blue-50'>
      <LabelCell label={label} bold />
      {values.map((v, i) => (
        <td
          key={i}
          className='border border-gray-200 px-3 py-2 bg-blue-50 text-center text-sm font-semibold text-blue-700'>
          {v}
        </td>
      ))}
    </tr>
  );
}

function SubSectionRow({ label }) {
  return (
    <tr className='bg-blue-100'>
      <td
        colSpan={7}
        className='border border-blue-200 px-3 py-1.5 text-sm font-bold text-blue-800'>
        {label}
      </td>
    </tr>
  );
}

function SectionHeader({ label }) {
  return (
    <thead>
      <tr className='bg-indigo-700 text-white text-sm font-semibold'>
        <th className='border border-indigo-600 px-3 py-2 text-left min-w-[230px]'>
          {label}
        </th>
        {YEARS.map((yr) => (
          <th
            key={yr}
            className='border border-indigo-600 px-3 py-2 text-center min-w-[95px]'>
            {yr}
          </th>
        ))}
      </tr>
    </thead>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Subpage3_4({ handleNext, handlePrevious }) {
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setLoading] = useState(false);
  const { markStepSaved, subpage3_2Data, forwardDetail } = useSection3Context();
  const [customerDiscount, setCustomerDiscount] = useState([]);
  const computed = computeValues(subpage3_2Data, customerDiscount);
  const userLog = useSelector((state) => state?.user?.user);

  // Mark as saved if screen 4 data already exists when resuming
  useEffect(() => {
    const roiid = forwardDetail?.roiid;
    if (!roiid || isSaved) return;
    (async () => {
      try {
        const res = await fetch(`${BASE_URL}/sales_planning`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ screen: 4, roiid }),
        });
        if (!res.ok) return;
        const json = await res.json();
        if (json?.data?.[0]) setIsSaved(true);
      } catch (e) {
        console.error("Failed to check saved discount data:", e);
      }
    })();
  }, [forwardDetail?.roiid]);
  const getCustomerDiscountData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${BASE_URL}/cutomer_discount`);
      if (res.ok) {
        const response = await res.json();
        const data = response.data;
        const discountObj = data?.reduce(
          (acc, curr) => ({
            ...acc,
            ...curr,
          }),
          {},
        );
        setCustomerDiscount(discountObj);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch discount data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getCustomerDiscountData();
  }, []);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const payload = {
        roiid: forwardDetail?.roiid,
        username: userLog?.name,
        totalCustomerDiscount: {
          plain: {
            lcg: computed.cdLCG,
            mcg: computed.cdMCG,
            hcg: computed.cdHCG,
          },
          studded: {
            gis: computed.cdGIS,
            regular: computed.cdRegular,
            colorStones: computed.cdColorStones,
            solitaireA: computed.cdSolitaireA,
            solitaireB: computed.cdSolitaireB,
            solitaireC: computed.cdSolitaireC,
            solitaireD: computed.cdSolitaireD,
          },
          coins: computed.cdCoins,
          total: computed.cdTotal,
          pctOfUCP: computed.cdPctOfUCP,
        },
        totalGHSDiscount: {
          plain: computed.ghsPlain,
          studded: computed.ghsStudded,
          coins: computed.ghsCoins,
          total: computed.ghsTotal,
          pctOfUCP: computed.ghsPctOfUCP,
        },
      };
      const res = await fetch(`${BASE_URL}/sales_planning_page_4`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        setIsSaving(false);
        toast.error("Failed to save discount data. Please try again.");
        return;
      }
      setIsSaving(false);
      setIsSaved(true);
      markStepSaved(3);
      setShowModal(true);
    } catch (e) {
      console.error(e);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      {isLoading ? (
        <h1>Calculating the Data for The Customer Discount</h1>
      ) : (
        <>
          <div className='subpage3_4 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 min-h-screen'>
            {/* Page Header */}
            <div className='mb-6'>
              <h2 className='text-xl font-bold text-gray-800 mb-2'>
                Calculation for Total Customer Discount &amp; Total GHS Discount
              </h2>
              <p className='text-sm text-gray-500 flex items-center gap-2'>
                <span className='inline-block w-5 h-5 bg-gray-50 border border-gray-300 rounded' />
                All cells are auto-calculated from previous sections
              </p>
            </div>

            <div className='space-y-6'>
              {/* ──────────────────────────────────────────────────────
                        SECTION 1 — Total Customer Discount
                    ────────────────────────────────────────────────────── */}
              <div className='bg-white rounded-lg shadow-md overflow-x-auto'>
                <table className='min-w-full border-collapse'>
                  <SectionHeader label='Total Customer Discount' />
                  <tbody>
                    {/* Plain sub-group */}
                    <SubSectionRow label='Plain' />
                    <tr>
                      <LabelCell label='LCG' />
                      {computed.cdLCG.map((v, i) => (
                        <AutoCell key={i} value={v} />
                      ))}
                    </tr>
                    <tr>
                      <LabelCell label='MCG' />
                      {computed.cdMCG.map((v, i) => (
                        <AutoCell key={i} value={v} />
                      ))}
                    </tr>
                    <tr>
                      <LabelCell label='HCG' />
                      {computed.cdHCG.map((v, i) => (
                        <AutoCell key={i} value={v} />
                      ))}
                    </tr>

                    {/* Studded sub-group */}
                    <SubSectionRow label='Studded' />
                    <tr>
                      <LabelCell label='GIS' />
                      {computed.cdGIS.map((v, i) => (
                        <AutoCell key={i} value={v} />
                      ))}
                    </tr>
                    <tr>
                      <LabelCell label='Regular' />
                      {computed.cdRegular.map((v, i) => (
                        <AutoCell key={i} value={v} />
                      ))}
                    </tr>
                    <tr>
                      <LabelCell label='Color Stones' />
                      {computed.cdColorStones.map((v, i) => (
                        <AutoCell key={i} value={v} />
                      ))}
                    </tr>
                    <tr>
                      <LabelCell label='Solitaire A (<70C)' />
                      {computed.cdSolitaireA.map((v, i) => (
                        <AutoCell key={i} value={v} />
                      ))}
                    </tr>
                    <tr>
                      <LabelCell label='Solitaire B (70–100C)' />
                      {computed.cdSolitaireB.map((v, i) => (
                        <AutoCell key={i} value={v} />
                      ))}
                    </tr>
                    <tr>
                      <LabelCell label='Solitaire C (1 CRT+)' />
                      {computed.cdSolitaireC.map((v, i) => (
                        <AutoCell key={i} value={v} />
                      ))}
                    </tr>
                    <tr>
                      <LabelCell label='Solitaire D (2 CRT+)' />
                      {computed.cdSolitaireD.map((v, i) => (
                        <AutoCell key={i} value={v} />
                      ))}
                    </tr>

                    {/* Coins */}
                    <SubSectionRow label='Coins' />
                    <tr>
                      <LabelCell label='Coins' />
                      {computed.cdCoins.map((v, i) => (
                        <AutoCell key={i} value={v} />
                      ))}
                    </tr>

                    {/* Totals */}
                    <TotalRow label='Total' values={computed.cdTotal} />
                    <PctRow label='% of UCP' values={computed.cdPctOfUCP} />
                  </tbody>
                </table>
              </div>

              {/* ──────────────────────────────────────────────────────
                        SECTION 2 — Total GHS Discount
                    ────────────────────────────────────────────────────── */}
              <div className='bg-white rounded-lg shadow-md overflow-x-auto'>
                <table className='min-w-full border-collapse'>
                  <SectionHeader label='Total GHS Discount' />
                  <tbody>
                    <tr>
                      <LabelCell label='Plain' />
                      {computed.ghsPlain.map((v, i) => (
                        <AutoCell key={i} value={v} />
                      ))}
                    </tr>
                    <tr>
                      <LabelCell label='Studded' />
                      {computed.ghsStudded.map((v, i) => (
                        <AutoCell key={i} value={v} />
                      ))}
                    </tr>
                    <tr>
                      <LabelCell label='Coins' />
                      {computed.ghsCoins.map((v, i) => (
                        <AutoCell key={i} value={v} />
                      ))}
                    </tr>
                    <TotalRow label='Total' values={computed.ghsTotal} />
                    <PctRow label='% of UCP' values={computed.ghsPctOfUCP} />
                  </tbody>
                </table>
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className='flex justify-start mt-10'>
              {/* <button
                                    type="button"
                                    onClick={handlePrevious}
                                    className="bg-gray-500 hover:bg-gray-600 text-white font-semibold px-6 py-2 rounded-lg"
                                >
                                    ← Previous
                                </button> */}
              {!isSaved ? (
                <button
                  type='button'
                  onClick={handleSave}
                  disabled={isSaving}
                  className={`font-semibold px-8 py-2 rounded-lg shadow transition ${
                    isSaving
                      ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                      : "bg-green-600 hover:bg-green-700 text-white cursor-pointer"
                  }`}>
                  {isSaving ? "Saving..." : "Save"}
                </button>
              ) : (
                <button
                  type='button'
                  onClick={handleNext}
                  className='bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-2 rounded-lg shadow'>
                  Next →
                </button>
              )}
            </div>
          </div>
        </>
      )}

      {/* ── Summary Modal ───────────────────────────────────── */}
      {showModal && (
        <div className='fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4'>
          <div className='bg-white rounded-2xl shadow-2xl w-full max-w-lg'>
            <div className='bg-gradient-to-r from-green-500 to-emerald-600 px-8 py-6 rounded-t-2xl'>
              <div className='flex items-center gap-3'>
                <span className='text-3xl'>✅</span>
                <div>
                  <h2 className='text-xl font-bold text-white'>
                    Discounts Saved
                  </h2>
                  <p className='text-green-100 text-sm mt-0.5'>
                    Sales Planning complete
                  </p>
                </div>
              </div>
            </div>
            <div className='p-8'>
              <h3 className='text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3'>
                Total Customer Discount (Yr. 1–6)
              </h3>
              <div className='grid grid-cols-3 gap-2'>
                {computed.cdTotal.map((v, i) => (
                  <div key={i} className='bg-gray-50 rounded-lg px-3 py-2'>
                    <p className='text-xs text-gray-400 font-medium'>
                      Yr. {i + 1}
                    </p>
                    <p className='text-gray-800 font-semibold mt-0.5'>
                      {v ?? "—"}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <div className='px-8 pb-8 flex justify-end'>
              <button
                type='button'
                onClick={() => {
                  setShowModal(false);
                  handleNext();
                }}
                className='px-8 py-3 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 transition'>
                Proceed to Expense Planning →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
