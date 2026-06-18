import React, { useEffect, useRef, useState } from "react";
import Sidebar from "../custom/Sidebar";
import { Modal } from "@mui/material";
import { RiArrowLeftSLine } from "react-icons/ri";
import { useNavigate } from "react-router-dom";
import { Table, Thead, Tbody, Tr, Th, Td } from "react-super-responsive-table";
import { routes } from "../../routes";
import { toast } from "react-toastify";
import CityProjectionPopulationGraph from "../common/graph/CityProjectionPopulationGraph";
import CityStoresBar from "../common/graph/CityStoresBar";
import CustomerRevenueBar from "../common/graph/CustomerRevenueBar";
import Loader from "../custom/Loader";
import { axiosInstance } from "../../HostManger/API/Authorization";
import ThirdEyeHeader from "../custom/ThirdEyeHeader";
import AnimatedNumber from "../accordion/AnimatedNumber";
import { useSelector } from "react-redux";
import NewCityExpantionPdf from "../pdf/NewCityExpantionPdf";
import { FilePopStyle } from "./NewStoreProjection";
import { formatAssessmentData, formatStoreValue } from "../Data/Data";

const NewCityProjection = ({ toggle_open, toggle }) => {
  const userLog = useSelector((state) => state?.user?.user);
  const catchmentData = useSelector(
    (state) => state?.newStoreInputs?.chatchmentData,
  );
  const inputsPayload = useSelector(
    (state) => state?.newCityInputs?.newCityInputs,
  );
  const decisionObj = useSelector(
    (state) => state?.newCityInputs?.newCityDecisiontext,
  );
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [isSave, setIsSave] = useState(true);
  const [slideOut, setSlideOut] = useState(false);
  const navigate = useNavigate();
  const [monthOver, setMonthOver] = useState([]);
  const [CityStoreScore, setCityStoreScore] = useState([]);
  const [extIndecator, setExtIndecator] = useState([]);
  const [storeShare, setStoreShare] = useState([]);
  const [enrollTarget, setEnrollTarget] = useState(0);
  const [cannibilization, setCannibilization] = useState(0);
  const [custExitStore, setCustExitStore] = useState(0);
  const [pdfFileName, setPdfFileName] = useState("");
  const [pdfDecesion, setPdfDecesion] = useState([]);
  const pdfDecisionRef = useRef({ lastPin: "", inFlight: false });

  const { targetCity, targetPinCode, similerStoreVal, arpcVal } = inputsPayload;
  const { t_catch, s_catch, m_trends } = catchmentData;
  const proRev1yr = (enrollTarget + custExitStore) * arpcVal;
  const projectionData = [
    { heading: "First Year Enrollments For Tartget City", value: enrollTarget },
    { heading: "Cross Channel Movement", value: custExitStore },
    { heading: "ARPC", value: arpcVal },
    {
      heading: "Projected Revenue In Year 1",
      value: proRev1yr,
    },
    { heading: "Cannibilization In 1 Year", value: cannibilization },
  ];

  // your function remains same
  const myFunction = (isSave) => {
    if (isSave) {
      toast.info(`Please Save the Data Before Clicking on "BACK"`, {
        theme: "colored",
        autoClose: 2000,
      });
    } else {
      setSlideOut(true);
      setTimeout(() => {
        navigate(routes.NEW_CITY_EXPANSION);
      }, 700);
    }
  };

  useEffect(() => {
    // Add one dummy entry so popstate fires immediately
    window.history.pushState({ dummy: true }, "");
    window.history.replaceState({ dummy: true }, "");
    const handleBackButton = () => {
      myFunction(isSave);
      window.history.pushState({ dummy: true }, "");
    };
    window.addEventListener("popstate", handleBackButton);
    return () => {
      window.removeEventListener("popstate", handleBackButton);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSave]);

  const GetMonthOverTrend = (chl, t_city) => {
    return axiosInstance
      .get(`/api/new/city/exp/mom/trends/data?channel=${chl}&city=${t_city}`)
      .then((res) => res)
      .then((response) => {
        if (response.data.code === "1000") {
          const data = response.data.value.map((item) => {
            return {
              customers: item.customers,
              month: item.month,
              revenueByCustomer: parseFloat(item.revenueByCustomer),
            };
          });
          setMonthOver(data);
        } else {
          setMonthOver([]);
        }
      })
      .catch((err) => setMonthOver([]));
  };

  const GetCityStoreScore = (t_city, s_city) => {
    return axiosInstance
      .get(`/api/new/city/fetch/score?inp1=${t_city}&inp2=${s_city}`)
      .then((res) => res)
      .then((response) => {
        if (response.data.code === "1000") {
          setCityStoreScore(response.data.value);
        } else {
          setCityStoreScore([]);
        }
      })
      .catch((err) => setCityStoreScore([]));
  };

  const GetExteranalIndicatore = (t_city, s_city) => {
    return axiosInstance
      .get(`/api/fetch/external/indicator?inp1=${t_city}&inp2=${s_city}`)
      .then((res) => res)
      .then((response) => {
        if (response.data.code === "1000") {
          const UPPER_KEYS = ["mpv", "mii", "mei"];
          const categoryList = response.data.value;
          const result =
            categoryList.length > 0 &&
            Object.keys(categoryList[0])
              .filter(
                (key) =>
                  key !== "city" && typeof categoryList[0][key] === "number",
              )
              .map((key) => ({
                category: UPPER_KEYS.includes(key.toLowerCase())
                  ? key.toUpperCase()
                  : formatCategory(key),
                targetCity: Number(categoryList[0][key].toFixed(1)),
                similerCity:
                  categoryList.length > 1 && categoryList[1][key] != null
                    ? Number(categoryList[1][key].toFixed(1))
                    : 0,
              }));

          function formatCategory(key) {
            return key
              .replace(/([A-Z])/g, " $1")
              .replace(/^./, (str) => str.toUpperCase());
          }
          setExtIndecator(result);
        } else {
          setExtIndecator([]);
        }
      })
      .catch((err) => setExtIndecator([]));
  };

  const GetNearByStoreShare = (t_city, s_city, chl) => {
    return axiosInstance(
      `/api/near/by/city/store/share?targetCity=${t_city}&similarCity=${s_city}&channel=${chl}`,
    )
      .then((res) => res)
      .then((response) => {
        if (response.data.code === "1000") {
          const shareData = response.data.value.map((item) => {
            return {
              fieldName: item.fieldName,
              similarStore: Number((item.similarStore / 10000000).toFixed(2)),
              topStore: Number((item.topStore / 10000000).toFixed(2)),
            };
          });
          setStoreShare(shareData);
        } else {
          setStoreShare([]);
        }
      })
      .catch((err) => setStoreShare([]));
  };

  const GetEnrollTargetYear = (t_city, chl) => {
    return axiosInstance
      .get(
        `/api/new/city/first/year/enrolls?similarCity=${t_city}&channel=${chl}`,
      )
      .then((res) => res)
      .then((response) => {
        if (response.data.code === "1000") {
          setEnrollTarget(response.data.value[0] || 0);
        }
      })
      .catch((err) => setEnrollTarget(0));
  };

  const GetCannibilization = (t_city, s_city, chl) => {
    return axiosInstance(
      `api/new/expension/city/canib?targetCity=${t_city}&similarCity=${s_city}&channel=${chl}`,
    )
      .then((res) => res)
      .then((response) => {
        if (response.data.code === "1000") {
          setCannibilization(response.data.value[0] || 0);
        }
      })
      .catch((err) => setCannibilization(0));
  };

  const GetNewCrossChannel = (chl, t_city) => {
    return axiosInstance
      .get(`/api/new/city/cross/cust/movement/?city=${t_city}&channel=${chl}`)
      .then((res) => res)
      .then((response) => {
        if (response.data.code === "1000") {
          setCustExitStore(response.data.value[0] || 0);
        }
      })
      .catch((err) => setCustExitStore(0));
  };

  const GetPdfDecision = async (t_pin) => {
    const pin = t_pin?.toString() || "";
    if (!pin) return null;
    // Prevent duplicate calls for same pin due to multiple effect triggers.
    if (
      pdfDecisionRef.current.inFlight &&
      pdfDecisionRef.current.lastPin === pin
    ) {
      return null;
    }
    if (
      !pdfDecisionRef.current.inFlight &&
      pdfDecisionRef.current.lastPin === pin
    ) {
      return null;
    }

    pdfDecisionRef.current = { lastPin: pin, inFlight: true };

    try {
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const response = await axiosInstance.post(
            "/api/openai/decision_reasoner/v2",
            { pincode: "560100" },
          );
          if (response?.status === 200) {
            const formattedData = formatAssessmentData(
              response?.data?.assessment,
            );
            setPdfDecesion(formattedData);
          }
          return response;
        } catch (error) {
          if (attempt === 1) {
            return null;
          }
        }
      }
      return null;
    } finally {
      pdfDecisionRef.current.inFlight = false;
    }
  };

  useEffect(() => {
    if (!(targetPinCode && similerStoreVal && targetCity)) return;

    let isCancelled = false;

    const loadAllProjectionApis = async () => {
      setLoading(true);
      await Promise.allSettled([
        GetMonthOverTrend(targetPinCode, similerStoreVal),
        GetCityStoreScore(similerStoreVal, targetCity),
        GetExteranalIndicatore(similerStoreVal, targetCity),
        GetNearByStoreShare(similerStoreVal, targetCity, targetPinCode),
        GetEnrollTargetYear(similerStoreVal, targetPinCode),
        GetCannibilization(similerStoreVal, targetCity, targetPinCode),
        GetNewCrossChannel(targetPinCode, similerStoreVal),
        GetPdfDecision(targetPinCode),
      ]);
      if (!isCancelled) {
        setLoading(false);
      }
    };

    loadAllProjectionApis();

    return () => {
      isCancelled = true;
    };
  }, [targetPinCode, similerStoreVal, targetCity]);

  const GetInsertUserInfo = () => {
    const newCityPylaod = {
      userName: userLog?.name,
      channel: targetPinCode,
      targetCity: similerStoreVal,
      similarCity: targetCity,
      targetCityEB: t_catch?.targetEB,
      targetCityCB: t_catch?.targetCB,
      targetCagrEB: t_catch?.targetEB_Cagr,
      targetCagrCB: t_catch?.targetCB_Cagr,
      targetPenetration: t_catch?.penetration,
      similarCityEB: s_catch?.targetEB,
      similarCityCB: s_catch?.targetCB,
      similarCagrEB: s_catch?.targetEB_Cagr,
      similarCagrCB: s_catch?.targetCB_Cagr,
      similarPenetration: s_catch?.penetration,
      revCust1m: m_trends[0]?.revenueByCustomer,
      revCust2m: m_trends[1]?.revenueByCustomer,
      revCust3m: m_trends[2]?.revenueByCustomer,
      revCust4m: m_trends[3]?.revenueByCustomer,
      revCust5m: m_trends[4]?.revenueByCustomer,
      revCust6m: m_trends[5]?.revenueByCustomer,
      revCust7m: m_trends[6]?.revenueByCustomer,
      revCust8m: m_trends[7]?.revenueByCustomer,
      revCust9m: m_trends[8]?.revenueByCustomer,
      revCust10m: m_trends[9]?.revenueByCustomer,
      revCust11m: m_trends[10]?.revenueByCustomer,
      revCust12m: m_trends[11]?.revenueByCustomer,
      custCount1m: m_trends[0]?.customers,
      custCount2m: m_trends[1]?.customers,
      custCount3m: m_trends[2]?.customers,
      custCount4m: m_trends[3]?.customers,
      custCount5m: m_trends[4]?.customers,
      custCount6m: m_trends[5]?.customers,
      custCount7m: m_trends[6]?.customers,
      custCount8m: m_trends[7]?.customers,
      custCount9m: m_trends[8]?.customers,
      custCount10m: m_trends[9]?.customers,
      custCount11m: m_trends[10]?.customers,
      custCount12m: m_trends[11]?.customers,
      firstYearEnrolls: enrollTarget,
      crossChnlMovement: custExitStore,
      arpc: arpcVal,
      estRev1Year: proRev1yr,
      canibalizationFor1yr: cannibilization,
      similarCityScore: CityStoreScore[0]?.score || 0,
      targetCityScore: CityStoreScore[1]?.score || 0,
      targetPopulation: extIndecator[0]?.targetCity,
      similarPopulation: extIndecator[0]?.similerCity,
      targetMPV: extIndecator[1]?.targetCity,
      similarMPV: extIndecator[1]?.similerCity,
      targetMII: extIndecator[2]?.targetCity,
      similarMII: extIndecator[2]?.similerCity,
      targetCityMEI: extIndecator[3]?.targetCity,
      similarCityMEI: extIndecator[3]?.similerCity,
      targetJewMarket: extIndecator[4]?.targetCity,
      similarJewMarket: extIndecator[4]?.similerCity,
      topStoretotalSale: storeShare[0]?.topStore,
      topStoreTargetCitySale: storeShare[0]?.topStore,
      similarStoretotalSale: storeShare[1]?.similarStore,
      similarStoreTarCitySale: storeShare[1]?.similarStore,
      decision: decisionObj?.decision,
      reason: decisionObj?.reason?.toString(),
      recommendation: decisionObj?.recomendation,
    };
    setLoading(true);
    axiosInstance
      .post(`/api/data/insert/new/city`, newCityPylaod)
      .then((res) => res)
      .then((response) => {
        if (response.data.code === "1000") {
          const fileName = response?.data?.value?.trim().replace(/\s+/g, "_");
          setPdfFileName(fileName);
          setIsSave(false);
          setModalOpen(true);
        } else {
          setPdfFileName("");
          toast.error("Something Went Wrong", {
            theme: "colored",
            autoClose: 1000,
          });
        }
        setLoading(false);
      })
      .catch((err) => {
        setLoading(false);
        toast.error("Internal Server Error", {
          theme: "colored",
          autoClose: 1000,
        });
      });
  };

  return (
    <React.Fragment>
      <Sidebar
        toggle_open={toggle_open}
        toggle={toggle}
        setSlideOut={setSlideOut}
      />
      {loading && <Loader />}
      <div
        className={`main_container ${slideOut ? "slide_animation_back" : ""}`}>
        <ThirdEyeHeader chl={targetPinCode} />
        <div
          style={{
            border: "1.5px solid #233044",
            marginTop: "5px",
          }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "5px",
            }}>
            <div style={{ width: "45%" }}>
              {projectionData.map((item, i) => {
                const { heading, value } = item;
                return (
                  <div key={i} className='box_text'>
                    {heading}
                    <AnimatedNumber
                      index={i}
                      value={value}
                      data={projectionData}
                    />
                  </div>
                );
              })}
              <div
                style={{
                  border: "1px solid #233044",
                  padding: "5px",
                  marginTop: "4%",
                }}>
                <div
                  style={{
                    textAlign: "center",
                    fontSize: "12px",
                    padding: "5px",
                  }}>
                  <strong>{similerStoreVal}</strong> Customers Shares in Stores
                  in Nearby Cities
                </div>
                {storeShare.length > 0 && (
                  <Table className='custom_table'>
                    <Thead>
                      <Tr>
                        <Th></Th>
                        <Th>Top Store (Cr) </Th>
                        <Th>Similer Store (Cr)</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {storeShare.map((item, i) => {
                        return (
                          <Tr key={i}>
                            <Td>{item.fieldName} </Td>
                            <Td>₹{formatStoreValue(item.topStore)}</Td>
                            <Td>₹{formatStoreValue(item.similarStore)}</Td>
                          </Tr>
                        );
                      })}
                    </Tbody>
                  </Table>
                )}
              </div>
            </div>
            <div style={{ width: "54.5%" }}>
              <div style={{ border: "1px solid #233044" }}>
                <div style={{ textAlign: "center", marginTop: "10px" }}>
                  City Score
                </div>
                <CityStoresBar data={CityStoreScore} />
              </div>
              <div style={{ border: "1px solid #233044", marginTop: "5px" }}>
                <div style={{ textAlign: "center", padding: "6px" }}>
                  External Indicators
                </div>
                {extIndecator.length > 0 ? (
                  <CityProjectionPopulationGraph
                    data={extIndecator}
                    height={300}
                  />
                ) : (
                  <h5 style={{ textAlign: "center", color: "red" }}>
                    Data Not Found
                  </h5>
                )}
              </div>
              <div style={{ border: "1px solid #233044", marginTop: "5px" }}>
                <div style={{ textAlign: "center", padding: "6px" }}>
                  Customers Vs Revenue Trends For City
                </div>
                {monthOver.length > 0 ? (
                  <CustomerRevenueBar monthOver={monthOver} height={300} />
                ) : (
                  <h5 style={{ textAlign: "center", color: "red" }}>
                    Data Not Found
                  </h5>
                )}
              </div>
            </div>
          </div>
        </div>
        <Modal open={modalOpen}>
          <div style={FilePopStyle} className='scrollable_container'>
            <NewCityExpantionPdf
              inputsPayload={inputsPayload}
              close={() => setModalOpen(false)}
              CityStoreScore={CityStoreScore}
              catchmentData={catchmentData}
              projectionData={projectionData}
              storeShare={storeShare}
              extIndecator={extIndecator}
              monthOver={monthOver}
              userLog={userLog}
              pdfFileName={pdfFileName}
              pdfDecesion={pdfDecesion}
            />
          </div>
        </Modal>
        <div
          style={{
            display: "flex",
            justifyContent: "end",
            marginTop: "5px",
          }}>
          <button
            className='CButton'
            style={{ marginRight: "3px" }}
            onClick={GetInsertUserInfo}>
            Save & Preview
          </button>
          <button
            style={{
              border: "1px solid black",
              padding: "3px",
              background: "none",
              width: "10%",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              cursor: "pointer",
            }}
            onClick={() => {
              if (isSave) {
                toast.info(`Please Save the Data Before Clicking on "BACK"`, {
                  theme: "colored",
                  autoClose: 2000,
                });
              } else {
                setSlideOut(true);
                setTimeout(() => {
                  navigate(routes.NEW_CITY_EXPANSION);
                }, 700);
              }
            }}>
            <RiArrowLeftSLine size={24} /> <span>Back</span>
          </button>
        </div>
        <br />
      </div>
    </React.Fragment>
  );
};

export default NewCityProjection;
