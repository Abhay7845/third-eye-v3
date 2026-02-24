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
  const [modalOpen, setModalOpen] = useState(false);
  const [isSave, setIsSave] = useState(true);
  const [slideOut, setSlideOut] = useState(false);
  const [cityName, setCityName] = useState("");
  const [top3Stores, setTop3Stores] = useState([]);
  const [enrollTarget, setEnrollTarget] = useState(0);
  const [custExitStore, setCustExitStore] = useState(0);
  const [crossChl, setCrossChl] = useState(0);
  const [arpcVal, setArpcVal] = useState(0);
  const [cannibalizationPeriod, setCannibalizationPeriod] = useState([]);
  const [pdfFileName, setPdfFileName] = useState("");
  // -----------------POPULATION CALUCATION SATES
  const [priPincodePopulation, setPriPincodePopulation] = useState([]);
  const [secPincodePopulation, setSecPincodePopulation] = useState([]);
  // REF DEFINE
  const screenshotRef = useRef();
  const {
    channel,
    targetPinCode,
    similarPinCode,
    similerStoreVal,
    setOfPin,
    storeSize,
    category,
    primarySec,
  } = inputsPayload;
  const estiCustBase = enrollTarget + custExitStore + crossChl;

  const projectionData = [
    { heading: "Enrollments in Target Store in Year 1", value: enrollTarget },
    { heading: "Customer Coming From Existng Store", value: custExitStore },
    { heading: "New From Cross-Channel", value: crossChl },
    { heading: "First Year Estimated Custome Base", value: estiCustBase },
    { heading: "Average Revenue Per Customer", value: arpcVal },
    { heading: "First Year Revenue Estimate", value: estiCustBase * arpcVal },
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

  const GetCityNameByPincode = (t_pin) => {
    axiosInstance
      .get(`/api/projection/fetch/city/by/pin?pincodes=${t_pin}`)
      .then((res) => res)
      .then((response) => {
        if (response.data.code === "1000") {
          setCityName(response.data.value.toString());
        }
      })
      .catch((err) => {
        setLoading(false);
        setIsSave(false);
      });
  };

  useEffect(() => {
    if (setOfPin) {
      GetCityNameByPincode(setOfPin);
    }
  }, [setOfPin]);

  const GetTop3Stores = (chl, t_pin) => {
    axiosInstance
      .get(`/api/store/to/pincode/rev?channel=${chl}&pincodes=${t_pin}`)
      .then((res) => res)
      .then((response) => {
        if (response.data.code === "1000") {
          setTop3Stores(response.data.value);
        }
      })
      .catch((err) => {
        setLoading(false);
        setIsSave(false);
      });
  };

  useEffect(() => {
    if (setOfPin) {
      GetTop3Stores(channel, setOfPin);
    }
  }, [channel, setOfPin]);

  const GetEnrollTargetYear = (s_pin, t_pin, chl) => {
    axiosInstance
      .get(
        `/api/new/store/first/yr/prob/enrolls?similarPincodes=${s_pin}&targetPincodes=${t_pin}&channel=${chl}`,
      )
      .then((res) => res)
      .then((response) => {
        if (response.data.code === "1000") {
          setEnrollTarget(response.data.value[0] || 0);
        }
      })
      .catch((err) => {
        setLoading(false);
        setIsSave(false);
      });
  };

  useEffect(() => {
    if (similarPinCode && setOfPin && channel) {
      GetEnrollTargetYear(similarPinCode, setOfPin, channel);
    }
  }, [similarPinCode, setOfPin, channel]);

  const GetCustExitStore = (t_pin, chl) => {
    axiosInstance
      .get(
        `/api/new/store/cross/cust/movement?pincodes=${t_pin}&channel=${chl}`,
      )
      .then((res) => res)
      .then((response) => {
        if (response.data.code === "1000") {
          setCustExitStore(response.data.value[0] || 0);
        }
      })
      .catch((err) => {
        setLoading(false);
        setIsSave(false);
      });
  };

  useEffect(() => {
    if (setOfPin && channel) {
      GetCustExitStore(setOfPin, channel);
    }
  }, [setOfPin, channel]);

  const GetNewCrossChannel = (chl, t_pin, s_pin) => {
    axiosInstance
      .get(
        `api/new/store/cross/channel/movement?channel=${chl}&targetPincodes=${t_pin}&similarPincodes=${s_pin}`,
      )
      .then((res) => res)
      .then((response) => {
        if (response.data.code === "1000") {
          setCrossChl(response.data.value[0] || 0);
        }
      })
      .catch((err) => {
        setLoading(false);
        setIsSave(false);
      });
  };

  useEffect(() => {
    if (channel && setOfPin && similarPinCode) {
      GetNewCrossChannel(channel, setOfPin, similarPinCode);
    }
  }, [channel, setOfPin, similarPinCode]);

  const GetARPCData = (chl, city, t_pin) => {
    axiosInstance
      .get(
        `/api/new/store/projection/arpc?channel=${chl}&city=${city}&pincodes=${t_pin}`,
      )
      .then((res) => res)
      .then((response) => {
        if (response.data.code === "1000") {
          setArpcVal(response.data.value[0] || 0);
        }
      })
      .catch((err) => {
        setLoading(false);
        setIsSave(false);
      });
  };

  useEffect(() => {
    if (channel && cityName && setOfPin) {
      GetARPCData(channel, cityName, setOfPin);
    }
  }, [channel, cityName, setOfPin]);

  const GetCannibalizationPeriod = (chl, t_pin) => {
    setLoading(true);
    axiosInstance
      .get(`api/new/store/cannib/data?channel=${chl}&pincodes=${t_pin}`)
      .then((res) => res)
      .then((response) => {
        if (response.data.code === "1000") {
          setCannibalizationPeriod(response.data.value);
        }
        setLoading(false);
      })
      .catch((err) => {
        toast.error("Internal Load Error", {
          theme: "colored",
          autoClose: 2000,
        });
        setLoading(false);
        setIsSave(false);
      });
  };

  useEffect(() => {
    if (channel && setOfPin) {
      GetCannibalizationPeriod(channel, setOfPin);
    }
  }, [channel, setOfPin]);

  // -----------------------------------INSEART HISTORY DATA FUNCTION -------------------------------------------

  const GetInsertUserInfo = () => {
    setLoading(true);
    const newStrPylaod = {
      userName: userLog?.name,
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
      firstYrEnrolls: enrollTarget,
      existingStrCusts: custExitStore,
      newCrossChannel: crossChl,
      firstYrEstCustBase: estiCustBase,
      strArpc: arpcVal,
      estRev1Year: estiCustBase * arpcVal,
      storeToPinCustS1: top3Stores[0]?.storeToPinCustPerc,
      storeToPinCustS2: top3Stores[1]?.storeToPinCustPerc,
      storeToPinCustS3: top3Stores[2]?.storeToPinCustPerc,
      storeToPinRevS1: top3Stores[0]?.storeToPinRevPerc,
      storeToPinRevS2: top3Stores[1]?.storeToPinRevPerc,
      storeToPinRevS3: top3Stores[2]?.storeToPinRevPerc,
      canibalization3yrS1: cannibalizationPeriod[0]?.cannibValue,
      canibalization3yrS2: cannibalizationPeriod[1]?.cannibValue,
      canibalization3yrS3: cannibalizationPeriod[2]?.cannibValue,
      targetCatchmentCity: cityName,
      decision: decisionObj?.decision,
      reason: decisionObj?.reason?.toString(),
      recommendation: decisionObj?.recomendation,
    };

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
      .catch((err) => {
        setLoading(false);
        setIsSave(false);
      });
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
      setIsSave(false);
      return [];
    }
  };

  // -----------------------PRIMARY PINCODE LEVEL POPULATION------------------
  const PriPincodeSummary = async (chl, p_code) => {
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
      } else {
        return [];
      }
    } catch (err) {
      setLoading(false);
      setIsSave(false);
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
      } else {
        return [];
      }
    } catch (err) {
      setLoading(false);
      setIsSave(false);
      return [];
    }
  };

  useEffect(() => {
    if (channel && primarySec?.secondary) {
      SecPincodeSummary(channel, primarySec?.secondary);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channel, primarySec?.secondary]);

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
          <ThirdEyeHeader city={cityName} chl={channel} />
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
                {top3Stores.length > 0 && (
                  <Table className='custom_table'>
                    <Thead>
                      <Tr>
                        <Th />
                        <Th>Store to Pincode Customer(%) Top 3 Stores</Th>
                        <Th>Store to Pincode Revenue(%) Top 3 Stores</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {top3Stores.map((item, i) => {
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
                )}
                <div style={{ border: "1px solid #233044", marginTop: "2%" }}>
                  <div style={{ textAlign: "center", padding: "6px" }}>
                    Cannibalization Effect Over Period of 3 Years
                  </div>
                  <NewStoreProBarGraph
                    cannibalizationPeriod={cannibalizationPeriod}
                    height={200}
                  />
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
              cannibalization={cannibalizationPeriod}
              top3Stores={top3Stores}
              userLog={userLog}
              pdfFileName={pdfFileName}
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
