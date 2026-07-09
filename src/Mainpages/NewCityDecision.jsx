import React, { useEffect, useState } from "react";
import { axiosInstance } from "../HostManger/API/Authorization";
import { useDispatch, useSelector } from "react-redux";
import DecisionSkeleton from "../Components/skaleton/DecisionSkeleton";
import { toast } from "react-toastify";
import WordByWordTyping from "../Components/custom/WordByWordTyping";
import { setNewCityDecisiontext } from "../redux/reducer/NewCity";

const NewStoreDecision = ({
  targetMatrix,
  similarMatrix,
  dormancyTarget,
  dormancySimilar,
  userLog,
  btnDesabeld,
  inputsPayload,
  competitors,
  defaultLoad,
  pdfMarkers,
}) => {
  const dispatch = useDispatch();
  const decisionObj = useSelector(
    (state) => state?.newCityInputs?.newCityDecisiontext,
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
    const mallsData = await j_list.filter(
      (item) => item.title && /mall|malls/i.test(item.title),
    );
    const EBO_Data = await r_list?.filter(
      (item) =>
        item.title &&
        ebo_key.some((kw) => item.title.toLowerCase().includes(kw)),
    );

    const filteredStores = await j_list?.filter(
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
        "Large Stores / Chain Stores": filteredStores.length,
      },
    };
  };

  const GetPosibilityDecision = async (chl, t_pin, s_pin) => {
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
    setLoading(true);
    btnDesabeld(true);
    const decision_data = await GetPosibilityDecision(
      inputsPayload?.targetPinCode,
      inputsPayload?.setOfPin,
      inputsPayload?.similarPinCode,
    );

    const fallbackRespData = (reason = []) => ({
      bottom_line:
        "Unable to find a decision based on the selected details. Please wait some time and try again.",
      decision: "",
      recomendation: "Somthing went wrong!",
      reason,
    });

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
        const apiDecision = decision_data?.decision?.trim() || "";
        const apiBottomLine = response?.data?.bottom_line?.trim() || "";
        const apiRecommendation = decision_data?.recomendation?.trim() || "";
        const hasValidDecisionData =
          Boolean(apiBottomLine) ||
          Boolean(apiDecision) ||
          Boolean(apiRecommendation);

        if (!hasValidDecisionData) {
          btnDesabeld(true);
          const respData = fallbackRespData(response?.data?.reason || []);
          dispatch(setNewCityDecisiontext(respData));
        } else {
          const respData = {
            bottom_line: apiBottomLine,
            decision: apiDecision,
            recomendation: apiRecommendation,
            reason: response?.data?.reason || [],
          };
          if (
            apiDecision?.toUpperCase() === "NEW" ||
            apiDecision?.toUpperCase() === "MAYBE"
          ) {
            btnDesabeld(false);
          } else {
            btnDesabeld(true);
          }
          dispatch(setNewCityDecisiontext(respData));
        }
      } else {
        btnDesabeld(true);
        const respData = fallbackRespData(response?.data?.reason || []);
        dispatch(setNewCityDecisiontext(respData));
      }
    } catch (err) {
      toast.error(
        "Something Went wrong while pulling the Decision Data . Pls try after sometime",
        { theme: "colored", autoClose: 3000 },
      );
      dispatch(setNewCityDecisiontext());
    } finally {
      setLoading(false);
    }
  };

  const hasFetched = React.useRef(false);

  // Reset gate when radius/anchor changes so decision re-runs for new map context.
  useEffect(() => {
    hasFetched.current = false;
  }, [inputsPayload?.radius, inputsPayload?.anchorLocation]);

  useEffect(() => {
    const anchor = inputsPayload?.anchorLocation;
    const allDataReady =
      defaultLoad &&
      jewellers_stores?.length > 0 &&
      retails_list?.length > 0 &&
      Array.isArray(competitors) &&
      Number.isFinite(anchor?.lat) &&
      Number.isFinite(anchor?.lng);

    if (!allDataReady || hasFetched.current) return;

    hasFetched.current = true;

    const fetchData = async () => {
      const GIS_Data = await Get_GIS_Data(
        jewellers_stores,
        retails_list,
        competitors,
      );
      GetDecisionList(GIS_Data);
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    jewellers_stores,
    retails_list,
    competitors,
    defaultLoad,
    inputsPayload?.radius,
    inputsPayload?.anchorLocation,
  ]);

  return (
    <React.Fragment>
      {loading ? (
        <DecisionSkeleton />
      ) : (
        decisionObj?.decision && (
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
              {decisionObj?.bottom_line && (
                <span
                  style={{
                    position: "absolute",
                    bottom: "5px",
                    right: "8px",
                    fontWeight: "bold",
                    color: "black",
                    cursor: "pointer",
                    textDecoration: "underline",
                    background: "#fff",
                    padding: "2px 5px",
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
