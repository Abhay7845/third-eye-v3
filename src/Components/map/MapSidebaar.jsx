import React, { useEffect } from "react";
import "./style/Mapsidebaar.css";
import { IoClose } from "react-icons/io5";
import { FormGroup, Checkbox } from "@mui/material";
import { HardCodeData } from "../Data/Data";
import JewChecklist from "../custom/JewChecklist";
import ComCheckList from "../custom/ComCheckList";

const MapSidebaar = ({
  mapsidebaar_open,
  driveTime,
  setDriveTime,
  setSelectedCategories,
  selectedCategories,
  inputsPayload,
  GetJewelleryMark,
  GetRetailsMark,
  GetCompetitor,
  GetOurBrand,
  setMapsidebaar_open,
  brandList,
  newStore,
  competitorsList,
  anchorLocation,
  handleDriveTimeSearch,
  setDefaultLoad,
}) => {
  const driveTimeList = HardCodeData.driveTime.map((item) => {
    return {
      value: item,
      label: `${item}min`,
    };
  });

  const HandelCheckDistance = (checked, time) => {
    setDefaultLoad(true);
    setDriveTime((prev) => {
      if (checked) {
        return [...prev, time];
      } else {
        return prev.filter((t) => t !== time);
      }
    });
  };

  useEffect(() => {
    if (anchorLocation) {
      driveTime.map((el) => handleDriveTimeSearch(anchorLocation));
    }
    if (driveTime.length === 0) {
      handleDriveTimeSearch(anchorLocation);
    }
  }, [anchorLocation, driveTime, driveTime.length, handleDriveTimeSearch]);

  // ------------------CSS OBJECT STYLE ----------------------------------
  const Styles = {
    squareStyle: {
      width: "9px",
      height: "9px",
      display: "inline-block",
      marginRight: "3px",
    },
    checkBox_label: {
      color: driveTime.length > 0 ? "white" : "gray",
      cursor: driveTime.length > 0 ? "pointer" : "not-allowed",
    },
  };
  return (
    <React.Fragment>
      <div
        className={
          mapsidebaar_open ? "map_sidebaar_open" : "map_sidebaar_close"
        }>
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            padding: "5px",
          }}>
          <IoClose
            size={30}
            cursor='pointer'
            style={{
              backgroundColor: "#fff",
              color: "#233044",
              borderRadius: "2px",
            }}
            onClick={() => setMapsidebaar_open(!mapsidebaar_open)}
          />
        </div>
        <div style={{ display: mapsidebaar_open ? "block" : "none" }}>
          <FormGroup style={{ marginTop: "-10%", padding: "3%" }}>
            <JewChecklist
              driveTime={driveTime}
              name={"Jewellery Market"}
              value={"jewellery"}
              newStore={newStore}
              pdfMarkers={inputsPayload?.pdfMarkers?.jewellery}
              anchorLocation={anchorLocation}
              selectedCategories={selectedCategories}
              handleCheckBox={GetJewelleryMark}
              setSelectedCategories={setSelectedCategories}
            />
            <JewChecklist
              driveTime={driveTime}
              name={"Retail Maturity"}
              value={"retail"}
              newStore={newStore}
              pdfMarkers={inputsPayload?.pdfMarkers?.retail}
              anchorLocation={anchorLocation}
              selectedCategories={selectedCategories}
              handleCheckBox={GetRetailsMark}
              setSelectedCategories={setSelectedCategories}
            />
            <ComCheckList
              driveTime={driveTime}
              name={"Competitor"}
              value={"competitor"}
              newStore={newStore}
              checked={inputsPayload?.categoryMarkers?.competitor}
              anchorLocation={anchorLocation}
              handleCheckBox={GetCompetitor}
              setSelectedCategories={setSelectedCategories}
              selectedCategories={selectedCategories}
              list={competitorsList}
              Styles={Styles}
            />
            <ComCheckList
              driveTime={driveTime}
              name='Our Brand'
              value='ourBrand'
              newStore={newStore}
              checked={inputsPayload?.categoryMarkers?.ourBrand}
              anchorLocation={anchorLocation}
              handleCheckBox={GetOurBrand}
              setSelectedCategories={setSelectedCategories}
              selectedCategories={selectedCategories}
              list={brandList}
              Styles={Styles}
            />
            <b style={{ marginTop: "5px", fontSize: "12px" }}>
              Drive Time (In min)
            </b>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: "5px",
              }}>
              {driveTimeList.map((time, i) => {
                return (
                  <React.Fragment key={i}>
                    <Checkbox
                      style={{
                        height: "15px",
                        width: "19px",
                        border: "none",
                        color: "#fff",
                      }}
                      checked={driveTime.includes(time.value)}
                      onChange={(e) =>
                        HandelCheckDistance(e.target.checked, time.value)
                      }
                    />
                    <span style={{ marginRight: "25px", fontSize: "12px" }}>
                      {time.label}
                    </span>
                  </React.Fragment>
                );
              })}
            </div>
          </FormGroup>
          {driveTime.length > 0 && (
            <div style={{ margin: "5px" }}>
              <span style={{ fontSize: "12px" }}>15min</span>
              <div style={{ ...Styles.squareStyle, backgroundColor: "red" }} />
              <span style={{ fontSize: "12px" }}>30min</span>
              <div
                style={{ ...Styles.squareStyle, backgroundColor: "green" }}
              />
              <span style={{ fontSize: "12px" }}>45min</span>
              <div style={{ ...Styles.squareStyle, backgroundColor: "blue" }} />
            </div>
          )}
        </div>
      </div>
    </React.Fragment>
  );
};

export default MapSidebaar;
