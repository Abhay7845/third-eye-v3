import React, { useEffect, useState } from "react";
import { axiosInstance } from "../HostManger/API/Authorization";
import { useDispatch, useSelector } from "react-redux";
import { setNewStoreDecisiontext } from "../redux/reducer/NewStore";
import DecisionSkeleton from "../Components/skaleton/DecisionSkeleton";
import { toast } from "react-toastify";
import WordByWordTyping from "../Components/custom/WordByWordTyping";

const NewStoreDecision = ({
  targetMatrix,
  similarMatrix,
  dormancyTarget,
  dormancySimilar,
  userLog,
  btnDesabeld,
  inputsPayload,
  pdfMarkers,
  competitors,
  defaultLoad,
}) => {
  const dispatch = useDispatch();
  const decisionObj = useSelector(
    (state) => state?.newStoreInputs?.newStoreDecisiontext,
  );
  const [loading, setLoading] = useState(null);
  const [seeMore, setSeeMore] = useState(false);
  const target = {
    targetEB: targetMatrix?.targetCatchmentEB || 0,
    targetCB: targetMatrix?.targetCatchmentCB || 0,
    targetEB_Cagr: targetMatrix?.encircleBaseCAGR || 0,
    targetCB_Cagr: targetMatrix?.channelBaseCAGR || 0,
    penetration:
      (targetMatrix?.targetCatchmentEB > 0 &&
        targetMatrix?.targetCatchmentCB / targetMatrix?.targetCatchmentEB) ||
      0,
    targetGrowth: dormancyTarget?.dormancyGrowthRate || 0,
    targetDormancy: dormancyTarget?.dormantBase || 0,
    arpc: dormancyTarget?.arpc,
  };

  const similar = {
    similarEB: similarMatrix?.targetCatchmentEB || 0,
    similarCB: similarMatrix?.targetCatchmentCB || 0,
    similarEB_Cagr: similarMatrix?.encircleBaseCAGR || 0,
    similerCB_Cagr: similarMatrix?.channelBaseCAGR || 0,
    penetration:
      (similarMatrix?.targetCatchmentEB > 0 &&
        similarMatrix?.targetCatchmentCB / similarMatrix?.targetCatchmentEB) ||
      0,
    similarGrowth: dormancyTarget?.dormancyGrowthRate || 0,
    similarDormancy: dormancyTarget?.dormantBase || 0,
  };

  const jewellers_stores = pdfMarkers?.jewellery;
  const retails_list = pdfMarkers?.retail;
  const ebo_key = ["bata", "starbucks", "bosch"];

  const keywords = [
    "dmart",
    "croma",
    "shoppers",
    "reliance",
    "big bazaar",
    "easyday",
    "fbb",
    "central",
    "brand factory",
    "hypercity",
    "foodhall",
    "more",
    "westside",
    "star bazaar",
    "landmark",
    "fashion yatra",
    "bata",
    "metro",
  ];

  const Get_GIS_Data = async (j_list, r_list, competitors) => {
    const mallsData = await j_list?.filter(
      (item) => item.title && /mall|malls/i.test(item.title),
    );
    const EBO_Data = await r_list?.filter(
      (item) =>
        item.title &&
        ebo_key.some((kw) => item.title.toLowerCase().includes(kw)),
    );

    const large_stores = await j_list?.filter(
      (item) =>
        item.title &&
        keywords.some((kw) => item.title.toLowerCase().includes(kw)),
    );

    return {
      Competition: competitors.length,
      "Jewellery stores": r_list.length,
      "Retail Maturity": {
        EBO: EBO_Data.length,
        Malls: mallsData.length,
        "Large Stores / Chain Stores": large_stores.length,
      },
    };
  };
  const GetPosibilityDecision = async (chl, t_pin, s_pin) => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(
        `/api/get/decision/details?channel=${chl}&targCatchment=${t_pin}&similarCatchment=${s_pin}`,
      );
      if (response?.data?.code === "1000") {
        return response?.data?.value;
      } else {
        return null;
      }
    } catch (err) {
      toast.error(err?.message, { theme: "colored", autoClose: 5000 });
      return null;
    }
  };

  const GetDecisionList = async (GIS_Data) => {
    btnDesabeld(true);
    const decision_data = await GetPosibilityDecision(
      inputsPayload?.channel,
      inputsPayload?.setOfPin,
      inputsPayload?.similarPinCode,
    );

    const DecesionPayload = {
      Channel: userLog?.channel,
      "Target Catchment": {
        "Encircle Base": target?.targetEB,
        "Encircle CAGR": target?.targetEB_Cagr,
        "Channel Base": target?.targetCB,
        "Channel CAGR": target?.targetCB_Cagr,
        Penetration: target?.penetration,
        ARPC: target?.arpc,
        "Dormancy Rate": dormancyTarget?.dormancyGrowthRate,
        "GIS Data": GIS_Data,
      },
      "Similar Catchment": {
        "Encircle Base": similar?.similarEB,
        "Encircle CAGR": similar?.similarEB_Cagr,
        "Channel Base": similar?.similarCB,
        "Channel CAGR": similar?.similerCB_Cagr,
        Penetration: similar?.penetration,
        "Dormancy Rate": dormancySimilar?.dormancyGrowthRate,
      },
      Decision: decision_data?.decision,
    };
    try {
      setLoading(true);
      const response = await axiosInstance.post(
        "/api/openai/decision_reasoner",
        DecesionPayload,
      );
      if (response.data.code === "1000") {
        const respData = {
          bottom_line: response?.data?.bottom_line,
          decision: decision_data?.decision,
          recomendation: decision_data?.recomendation,
          reason: response?.data?.reason,
        };
        if (
          decision_data?.decision?.toUpperCase() === "NEW" ||
          decision_data?.decision?.toUpperCase() === "MAYBE"
        ) {
          btnDesabeld(false);
        } else {
          btnDesabeld(true);
        }
        dispatch(setNewStoreDecisiontext(respData));
      } else {
        btnDesabeld(true);
        const respData = {
          bottom_line:
            "Unable to find a decision based on the selected details. Please wait some time and try again.",
          decision: "",
          recomendation: "Somthing went wrong!",
          reason: response?.data?.reason || [],
        };
        dispatch(setNewStoreDecisiontext(respData));
      }
      setLoading(false);
    } catch (err) {
      setLoading(false);
      btnDesabeld(true);
      const respData = {
        bottom_line:
          "Something Went wrong while pulling the Decision Data . Pls try after sometime",
        decision: "",
        recomendation: "Somthing went wrong!",
        reason: [],
      };
      dispatch(setNewStoreDecisiontext(respData));
    }
  };

  const max_stores = Math.max(
    jewellers_stores?.length,
    inputsPayload?.anchorLocation?.lat,
  );

  useEffect(() => {
    const fetchData = async () => {
      const GIS_Data = await Get_GIS_Data(
        jewellers_stores,
        retails_list,
        competitors,
      );
      setTimeout(() => {
        GetDecisionList(GIS_Data);
      }, 700);
    };
    if (defaultLoad) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [max_stores, inputsPayload?.radius]);

  return (
    <React.Fragment>
      {loading ? (
        <DecisionSkeleton />
      ) : (
        decisionObj?.bottom_line && (
          <div
            style={{
              border: "1.5px solid #233044",
              display: "flex",
              padding: "3px",
              justifyContent: "space-between",
              marginBottom: "5px",
            }}>
            <div
              style={{
                border: "1px solid #233044",
                width: "19%",
                padding: "5px",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                textAlign: "center",
                fontSize: "13px",
                color: decisionObj?.reason?.length > 0 ? "#000000" : "#ea0909",
              }}>
              <span>{decisionObj?.recomendation}</span>
            </div>
            <div
              style={{
                border: "1px solid #233044",
                padding: "5px",
                width: "78.5%",
                textAlign: "justify",
                fontSize: "13px",
                position: "relative",
              }}>
              <WordByWordTyping sentence={decisionObj?.bottom_line} />
              {seeMore && (
                <ul
                  style={{
                    columns: "1",
                    columnGap: "2px",
                    paddingLeft: "15px",
                    listStyleType: "disc",
                    textAlign: "justify",
                  }}>
                  {decisionObj?.reason?.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              )}
              {decisionObj?.reason.length > 0 && (
                <span
                  style={{
                    position: "absolute",
                    bottom: "5px",
                    right: "8px",
                    fontWeight: "bold",
                    color: "black",
                    cursor: "pointer",
                    textDecoration: "underline",
                  }}
                  onClick={() => setSeeMore(!seeMore)}>
                  {seeMore ? "Hide" : "See more"}
                </span>
              )}
            </div>
          </div>
        )
      )}
    </React.Fragment>
  );
};

export default NewStoreDecision;
