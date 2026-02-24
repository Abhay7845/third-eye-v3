import React, { useEffect } from "react";
import { FaBars } from "react-icons/fa";
import { MapContent } from "../Data/Data";
import HoverAccordion from "../accordion/HoverAccordion";
import GraphAccordion from "../accordion/GraphAccordion";
import MapView from "./MapView";
import ShowJweleryStores from "../custom/ShowJweleryStores";
import { setChatchmentData } from "../../redux/reducer/NewStore";
import { useDispatch } from "react-redux";
import MapSkeleton from "./MapSkeleton";

const GoogleMapView = ({
  setMapsidebaar_open,
  mapsidebaar_open,
  driveTime,
  setGoogleMapInstance,
  selectedDriveTimesRef,
  targetMatrix,
  similerMatrix,
  monthOver,
  dormancyData,
  target_name,
  similar_name,
  anchorLocation,
  categoryMarkers,
  map_img,
  mapLoader,
  userLog,
}) => {
  const dispatch = useDispatch();

  useEffect(() => {
    selectedDriveTimesRef.current = driveTime;
  }, [driveTime, selectedDriveTimesRef]);

  const targetCatchment = {
    arpc: dormancyData?.arpc,
    targetEB: targetMatrix?.targetCatchmentEB || 0,
    targetCB: targetMatrix?.targetCatchmentCB || 0,
    targetEB_Cagr: targetMatrix?.encircleBaseCAGR || 0,
    targetCB_Cagr: targetMatrix?.channelBaseCAGR || 0,
    penetration:
      (targetMatrix?.targetCatchmentEB > 0 &&
        targetMatrix?.targetCatchmentCB / targetMatrix?.targetCatchmentEB) ||
      0,
  };
  const similerCatchment = {
    arpc: dormancyData?.arpc,
    targetEB: similerMatrix?.targetCatchmentEB || 0,
    targetCB: similerMatrix?.targetCatchmentCB || 0,
    targetEB_Cagr: similerMatrix?.encircleBaseCAGR || 0,
    targetCB_Cagr: similerMatrix?.channelBaseCAGR || 0,
    penetration:
      (similerMatrix?.targetCatchmentEB > 0 &&
        similerMatrix?.targetCatchmentCB / similerMatrix?.targetCatchmentEB) ||
      0,
  };

  const catchData = {
    t_catch: targetCatchment,
    s_catch: similerCatchment,
    m_trends: monthOver,
  };

  useEffect(() => {
    dispatch(setChatchmentData(catchData));
  });

  return (
    <React.Fragment>
      <div
        style={{
          position: "absolute",
          zIndex: mapsidebaar_open ? "0" : "1",
          marginTop: "10px",
          marginLeft: "10px",
          color: "#233044",
          background: "#fff",
          borderRadius: "2px",
          padding: "5px",
          cursor: "pointer",
          display: "flex",
          justifyContent: "center",
          alignContent: "center",
          boxShadow: "0 0 10px #24242433",
        }}
        onClick={() => setMapsidebaar_open(!mapsidebaar_open)}>
        <FaBars size={25} />
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          flexDirection: "row",
          marginLeft: "2px",
        }}>
        <div
          style={
            categoryMarkers.competitor.length > 0 ||
            categoryMarkers.retail.length > 0 ||
            categoryMarkers.ourBrand.length
              ? { width: "75%" }
              : { width: "99.5%" }
          }>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <div className='target_chatchment_data'>
              {targetMatrix && similerMatrix && (
                <HoverAccordion
                  title='Details'
                  target_name={target_name}
                  similar_name={similar_name}
                  targetData={targetCatchment}
                  similardData={similerCatchment}
                  userLog={userLog}
                />
              )}
              <GraphAccordion title='Last 12 Months Trends' data={monthOver} />
            </div>
          </div>
          <div ref={map_img}>
            {mapLoader && <MapSkeleton />}
            <MapView
              center={anchorLocation}
              zoom={11}
              style={{ height: "80vh", width: "100%" }}
              options={MapContent}
              setGoogleMapInstance={setGoogleMapInstance}
              placeMarkers={categoryMarkers}
            />
          </div>
        </div>
        {categoryMarkers?.jewellery?.length > 0 ||
        categoryMarkers?.competitor?.length > 0 ||
        categoryMarkers?.retail?.length > 0 ||
        categoryMarkers?.ourBrand?.length ? (
          <div style={{ width: "24%" }}>
            <ShowJweleryStores categoryMarkers={categoryMarkers} />
          </div>
        ) : null}
      </div>
    </React.Fragment>
  );
};

export default GoogleMapView;
