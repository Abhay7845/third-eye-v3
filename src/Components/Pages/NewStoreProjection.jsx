import React, { useState, useEffect, useRef } from "react";
import Sidebar from "../custom/Sidebar";
import "../Styles/ProjectionSrceen.css";
import { Table, Thead, Tbody, Tr, Th, Td } from "react-super-responsive-table";
import { RiArrowLeftSLine } from "react-icons/ri";
import { useNavigate } from "react-router-dom";
import { routes } from "../../routes";
import { Modal } from "@mui/material";
import NewStoreProBarGraph from "../common/graph/NewStoreProBarGraph";
import ThirdEyeHeader from "../custom/ThirdEyeHeader";
import DashboardPdf from "../pdf/DashboardPdf";
import { axiosInstance } from "../../HostManger/API/Authorization";
import Loader from "../custom/Loader";
import AnimatedNumber from "../accordion/AnimatedNumber";
import NormalRandmaize from "../accordion/NormalRandmaize";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import { categorizeRetails, formatAssessmentData } from "../Data/Data";

export const FilePopStyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  background: "#fff",
};

const NewStoreProjection = ({ toggle_open, toggle }) => {
  const navigate = useNavigate();
  const userLog = useSelector((state) => state?.user?.user);
  const inputsPayload = useSelector(
    (state) => state?.newStoreInputs?.newStoreInputs,
  );
  const catchmentData = useSelector(
    (state) => state?.newStoreInputs?.chatchmentData,
  );
  const decisionObj = useSelector(
    (state) => state?.newStoreInputs?.newStoreDecisiontext,
  );
  const t_catch = catchmentData?.t_catch;
  const s_catch = catchmentData?.s_catch;
  const m_trends = catchmentData?.m_trends;
  const [loading, setLoading] = useState(false);

  // Tracks how many API calls are still in-flight.
  // Loader stays visible until every call has completed.
  const pendingRef = useRef(0);
  const startLoading = () => {
    pendingRef.current += 1;
    setLoading(true);
  };
  const stopLoading = () => {
    pendingRef.current = Math.max(0, pendingRef.current - 1);
    if (pendingRef.current === 0) setLoading(false);
  };
  const [modalOpen, setModalOpen] = useState(false);
  const [isSave, setIsSave] = useState(true);
  const [slideOut, setSlideOut] = useState(false);
  const [revenueData, setRevenueData] = useState(null);
  const [topStrCanData, setTopStrCanData] = useState([]);
  const [arpcVal, setArpcVal] = useState(0);
  const [pdfFileName, setPdfFileName] = useState("");
  // -----------------POPULATION CALUCATION SATES
  const [priPincodePopulation, setPriPincodePopulation] = useState([]);
  const [secPincodePopulation, setSecPincodePopulation] = useState([]);
  // const pdlList = formatAssessmentData(pdf_data?.assessment);
  const [pdfDecesion, setPdfDecesion] = useState([]);
  const [estimateRevenue, setEstimateRevenue] = useState(0);
  // REF DEFINE
  const screenshotRef = useRef();
  const lastPdfDecisionPinRef = useRef("");
  const {
    channel,
    targetPinCode,
    similarPinCode,
    similerStoreVal,
    setOfPin,
    storeSize,
    category,
    primarySec,
    pdfMarkers,
  } = inputsPayload;
  const estiCustBase =
    Number(revenueData?.firstYearEnrolls || 0) +
    Number(revenueData?.canniCust || 0) +
    Number(revenueData?.crossCust || 0);

  const cityName = revenueData?.city;
  const retails_category = categorizeRetails(pdfMarkers?.retail);

  useEffect(() => {
    if (arpcVal) {
      setEstimateRevenue(Number(arpcVal * estiCustBase));
    }
  }, [arpcVal, estiCustBase]);

  const projectionData = [
    {
      heading: "Enrollments in Target Store in Year 1",
      value: revenueData?.firstYearEnrolls || 0,
    },
    {
      heading: "Customer Coming From Existng Store",
      value: revenueData?.canniCust || 0,
    },
    { heading: "New From Cross-Channel", value: revenueData?.crossCust || 0 },
    { heading: "First Year Estimated Custome Base", value: estiCustBase || 0 },
    { heading: "Average Revenue Per Customer", value: arpcVal },
    {
      heading: "First Year Revenue Estimate",
      value: estimateRevenue || 0,
    },
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
        navigate(routes.NEW_STORE);
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

  const CannibalizationData = (chl, t_pin) => {
    startLoading();
    axiosInstance
      .get(
        `/api/fetch/projection/canni/store-pin?channel=${chl}&targetPin=${t_pin}`,
      )
      .then((res) => res)
      .then((response) => {
        if (response.data.code === "1000") {
          setTopStrCanData(response.data.value);
        }
        stopLoading();
      })
      .catch(() => stopLoading());
  };

  useEffect(() => {
    if (setOfPin) {
      CannibalizationData(channel, setOfPin);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channel, setOfPin]);

  const GetRevenueData = (chl, t_pin, s_pin) => {
    startLoading();
    axiosInstance
      .get(
        `/api/fetch/first/year/results?similarPin=${s_pin}&targetPin=${t_pin}&channel=${chl}`,
      )
      .then((res) => res)
      .then((response) => {
        if (response.data.code === "1000") {
          setRevenueData(response.data.value);
        }
        stopLoading();
      })
      .catch(() => stopLoading());
  };

  useEffect(() => {
    if (setOfPin) {
      GetRevenueData(channel, setOfPin, similarPinCode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channel, setOfPin, similarPinCode]);

  const GetARPCData = (chl, city, t_pin) => {
    startLoading();
    axiosInstance
      .get(
        `/api/new/store/projection/arpc?channel=${chl}&city=${city}&pincodes=${t_pin}`,
      )
      .then((res) => res)
      .then((response) => {
        if (response.data.code === "1000") {
          setArpcVal(Number(response.data.value[0]) || 0);
        }
        stopLoading();
      })
      .catch(() => stopLoading());
  };

  useEffect(() => {
    if (channel && cityName && setOfPin) {
      GetARPCData(channel, cityName, setOfPin);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channel, cityName, setOfPin]);

  const GetInsertUserInfo = () => {
    const newStrPylaod = {
      userName: userLog?.name || "geust",
      channel: channel,
      targetCatchment: targetPinCode?.toString(),
      similarStore: similerStoreVal,
      similarPincodes: setOfPin?.toString(),
      storeSize: storeSize || 0,
      storeCategory: category,
      targetCatchmentEB: t_catch?.targetEB,
      targetCatchmentCB: t_catch?.targetCB,
      targetCagrEB: t_catch?.targetEB_Cagr,
      targetCagrCB: t_catch?.targetCB_Cagr,
      targetArpc: t_catch?.arpc,
      targetPenetration: t_catch?.penetration,
      similarCatchmentEB: s_catch?.targetEB,
      similarCatchmentCB: s_catch?.targetCB,
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
      firstYrEnrolls: revenueData?.firstYearEnrolls || 0,
      existingStrCusts: revenueData?.canniCust || 0,
      newCrossChannel: revenueData?.crossCust || 0,
      firstYrEstCustBase: estiCustBase || 0,
      strArpc: arpcVal || 0,
      estRev1Year: estimateRevenue || 0,
      storeToPinCustS1: topStrCanData[0]?.storeToPinCustPerc,
      storeToPinCustS2: topStrCanData[1]?.storeToPinCustPerc,
      storeToPinCustS3: topStrCanData[2]?.storeToPinCustPerc,
      storeToPinRevS1: topStrCanData[0]?.storeToPinRevPerc,
      storeToPinRevS2: topStrCanData[1]?.storeToPinRevPerc,
      storeToPinRevS3: topStrCanData[2]?.storeToPinRevPerc,
      canibalization3yrS1: topStrCanData[0]?.f36RevLoss,
      canibalization3yrS2: topStrCanData[1]?.f36RevLoss,
      canibalization3yrS3: topStrCanData[2]?.f36RevLoss,
      targetCatchmentCity: cityName,
      decision: decisionObj?.decision,
      reason: decisionObj?.reason?.toString(),
      recommendation: decisionObj?.recomendation,
    };
    setLoading(true);
    axiosInstance
      .post(`/api/data/insert/new/store`, newStrPylaod)
      .then((res) => res)
      .then((response) => {
        if (response.data.code === "1000") {
          const fileName = response?.data?.value?.trim().replace(/\s+/g, "_");
          setPdfFileName(fileName);
          setIsSave(false);
          setModalOpen(true);
        } else {
          setPdfFileName("");
          toast.error(response.data.value, {
            theme: "colored",
            autoClose: 1000,
          });
        }
        setLoading(false);
      })
      .catch((err) => setLoading(false));
  };

  // PINCODE LEVEL GET POPULATION

  const GetPopulation = async (pincode) => {
    try {
      const response = await axiosInstance.get(
        `/api/fetch/population/data?pincodes=${pincode}`,
      );
      if (response?.data?.code === "1000") {
        return response?.data?.value;
      } else {
        return [];
      }
    } catch (err) {
      setLoading(false);
      return [];
    }
  };

  // -----------------------PRIMARY PINCODE LEVEL POPULATION------------------
  const PriPincodeSummary = async (chl, p_code) => {
    startLoading();
    try {
      const response = await axiosInstance.get(
        `/api/fetch/catch/analysis/pincode/summary?channel=${chl}&pincodes=${p_code}`,
      );
      if (response?.data?.code === "1000") {
        const pincod_level_pop = await GetPopulation(p_code);
        const pin_summary = response?.data?.value?.map((item) => ({
          pincode: item.pincode,
          arpc: Number(parseInt(item.arpc)),
          channelBase: Number(parseFloat(item.channelBase).toFixed(2)),
          channelBaseCagr: Number(
            parseFloat(item.channelBaseCagr * 100).toFixed(2),
          ),
          dormancyRate: Number(parseFloat(item.dormancyRate).toFixed(1)),
          dormantBase: Number(parseFloat(item.dormantBase).toFixed(2)),
          encircleBase: Number(parseFloat(item.encircleBase).toFixed(2)),
          encircleBaseCagr: Number(
            parseFloat(item.encircleBaseCagr * 100).toFixed(2),
          ),
          fillRate: Number(parseFloat(item.fillRate).toFixed(1)),
          penetration: Number(
            parseFloat((item.channelBase / item.encircleBase) * 100).toFixed(1),
          ),
        }));
        function PinPopulation(population, store) {
          const populationMap = {};
          population.forEach((item) => {
            populationMap[item.pincode] = item.population;
          });
          return store.map((item) => ({
            ...item,
            population: populationMap[item.pincode] || null,
          }));
        }
        const mergedData = await PinPopulation(pincod_level_pop, pin_summary);
        setPriPincodePopulation(mergedData);
        stopLoading();
      } else {
        stopLoading();
        return [];
      }
    } catch (err) {
      stopLoading();
      return [];
    }
  };

  useEffect(() => {
    if (channel && primarySec?.primary) {
      PriPincodeSummary(channel, primarySec?.primary);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channel, primarySec?.primary]);

  // -----------------------SECONDARY PINCODE LEVEL POPULATION------------------
  const SecPincodeSummary = async (chl, p_code) => {
    startLoading();
    try {
      const response = await axiosInstance.get(
        `/api/fetch/catch/analysis/pincode/summary?channel=${chl}&pincodes=${p_code}`,
      );
      if (response?.data?.code === "1000") {
        const pincod_level_pop = await GetPopulation(p_code);
        const pin_summary = response?.data?.value?.map((item) => ({
          pincode: item.pincode,
          arpc: Number(parseInt(item.arpc)),
          channelBase: Number(parseFloat(item.channelBase).toFixed(2)),
          channelBaseCagr: Number(parseFloat(item.channelBaseCagr).toFixed(2)),
          dormancyRate: Number(parseFloat(item.dormancyRate).toFixed(1)),
          dormantBase: Number(parseFloat(item.dormantBase).toFixed(2)),
          encircleBase: Number(parseFloat(item.encircleBase).toFixed(2)),
          encircleBaseCagr: Number(
            parseFloat(item.encircleBaseCagr).toFixed(2),
          ),
          fillRate: Number(parseFloat(item.fillRate).toFixed(1)),
          penetration: Number(
            parseFloat((item.channelBase / item.encircleBase) * 100).toFixed(1),
          ),
        }));
        function PinPopulation(population, store) {
          const populationMap = {};
          population.forEach((item) => {
            populationMap[item.pincode] = item.population;
          });
          return store.map((item) => ({
            ...item,
            population: populationMap[item.pincode] || null,
          }));
        }
        const mergedData = await PinPopulation(pincod_level_pop, pin_summary);
        setSecPincodePopulation(mergedData);
        stopLoading();
      } else {
        stopLoading();
        return [];
      }
    } catch (err) {
      stopLoading();
      return [];
    }
  };

  useEffect(() => {
    if (channel && primarySec?.secondary) {
      SecPincodeSummary(channel, primarySec?.secondary);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channel, primarySec?.secondary]);

  const GetPdfDecision = async (t_pin) => {
    const pin = t_pin?.toString() || "";
    if (!pin) return;

    startLoading();
    try {
      let response;
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          response = await axiosInstance.post(
            "/api/openai/decision_reasoner/v2",
            { pincode: pin },
          );
          break;
        } catch (error) {
          if (attempt === 1) {
            return;
          }
        }
      }

      if (response?.status === 200) {
        const formattedData = formatAssessmentData(response?.data?.assessment);
        setPdfDecesion(formattedData);
      }
    } finally {
      stopLoading();
    }
  };

  useEffect(() => {
    const pin = inputsPayload?.targetPinCode?.toString() || "";
    if (!pin) return;
    if (lastPdfDecisionPinRef.current === pin) return;

    const timer = setTimeout(() => {
      lastPdfDecisionPinRef.current = pin;
      GetPdfDecision(pin);
    }, 0);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputsPayload?.targetPinCode]);

  return (
    <React.Fragment>
      {loading && <Loader />}
      <Sidebar
        toggle_open={toggle_open}
        toggle={toggle}
        setSlideOut={setSlideOut}
      />
      <div
        className={`main_container ${slideOut ? "slide_animation_back" : ""}`}>
        <div ref={screenshotRef}>
          <ThirdEyeHeader
            city={cityName}
            chl={channel}
            cityTier={revenueData?.cityTier}
          />
          <div
            style={{
              border: "1.5px solid #233044",
              marginTop: "5px",
              marginRight: "4px",
            }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "5px",
                flexWrap: "wrap",
              }}>
              <div style={{ width: "45%" }}>
                {projectionData.map((item, i) => {
                  const { heading, value } = item;
                  return (
                    <div key={i} className='box_text'>
                      <div>{heading}</div>
                      <AnimatedNumber
                        index={i}
                        value={value}
                        data={projectionData}
                      />
                    </div>
                  );
                })}
              </div>
              <div style={{ width: "54.5%" }}>
                {topStrCanData.length > 0 ? (
                  <Table className='custom_table'>
                    <Thead>
                      <Tr>
                        <Th />
                        <Th>Store to Pincode Customer(%) Top 3 Stores</Th>
                        <Th>Store to Pincode Revenue(%) Top 3 Stores</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {topStrCanData.map((item, i) => {
                        return (
                          <Tr key={i}>
                            <Td>{item.storeCode}</Td>
                            <Td>
                              <NormalRandmaize
                                value={item.storeToPinCustPerc}
                              />
                            </Td>
                            <Td>
                              <NormalRandmaize value={item.storeToPinRevPerc} />
                            </Td>
                          </Tr>
                        );
                      })}
                    </Tbody>
                  </Table>
                ) : (
                  <div style={{ color: "red", textAlign: "center" }}>
                    Data not available
                  </div>
                )}
                <div style={{ border: "1px solid #233044", marginTop: "2%" }}>
                  {topStrCanData?.length > 0 ? (
                    <React.Fragment>
                      <div style={{ textAlign: "center", padding: "6px" }}>
                        Cannibalization Effect
                      </div>
                      <NewStoreProBarGraph
                        cannibalizationPeriod={topStrCanData}
                        height={220}
                      />
                    </React.Fragment>
                  ) : (
                    <div style={{ color: "red", textAlign: "center" }}>
                      Cannibalization Effect Not Found
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <Modal open={modalOpen}>
          <div style={FilePopStyle} className='scrollable_container'>
            <DashboardPdf
              inputsPayload={inputsPayload}
              close={() => setModalOpen(false)}
              priSecPin={primarySec}
              priPincodePopulation={priPincodePopulation}
              secPincodePopulation={secPincodePopulation}
              cityName={cityName}
              projectionData={projectionData}
              cannibalization={topStrCanData}
              top3Stores={topStrCanData}
              userLog={userLog}
              pdfFileName={pdfFileName}
              cityTier={revenueData?.cityTier}
              pdfDecesion={pdfDecesion}
              retails_category={retails_category}
            />
          </div>
        </Modal>
        <div
          style={{
            display: "flex",
            justifyContent: "end",
            marginRight: "5px",
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
                toast.info(`Please Save the Data before Clicking on "BACK"`, {
                  theme: "colored",
                  autoClose: 2000,
                });
              } else {
                setSlideOut(true);
                setTimeout(() => {
                  navigate(routes.NEW_STORE);
                }, 700);
              }
            }}>
            <RiArrowLeftSLine size={24} /> <span>Back</span>
          </button>
        </div>
      </div>
    </React.Fragment>
  );
};

export default NewStoreProjection;
