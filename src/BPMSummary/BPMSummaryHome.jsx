import React from "react";
import ThirdEyeHeader from "../Components/custom/ThirdEyeHeader";
import BPMFieldValuesTable from "./BPMFieldValuesTable";
import { bpm_dummy_data } from "./BPMDummyData";

const BPMSummaryHome = () => {
  return (
    <React.Fragment>
      <ThirdEyeHeader />

      <div style={{ margin: "5px", marginTop: "10px" }}>
        <BPMFieldValuesTable
          data={bpm_dummy_data.data}
          columns={bpm_dummy_data.columns}
        />
      </div>
    </React.Fragment>
  );
};

export default BPMSummaryHome;
