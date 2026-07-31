import React from "react";
import "./studdedtotstyle/StuddedTOTHome.css";
import ThirdEyeHeader from "../Components/custom/ThirdEyeHeader";
import { studded_tot } from "./studdedtotDummy";
import StuddedTOTYearwiseTbl from "./StuddedTOTYearwiseTbl";

const StuddedTOTHome = () => {
  return (
    <React.Fragment>
      <ThirdEyeHeader />
      <div className='studded_tot_yearwise_tbl_layout'>
        <StuddedTOTYearwiseTbl
          data={studded_tot.studded_nsv_y1_6}
          columns={studded_tot.columns}
        />

        <StuddedTOTYearwiseTbl
          data={studded_tot.studded_nsv_y1_6}
          columns={studded_tot.columns}
        />

        <StuddedTOTYearwiseTbl
          data={studded_tot.studded_nsv_y1_6}
          columns={studded_tot.columns}
        />

        <StuddedTOTYearwiseTbl
          data={studded_tot.studded_nsv_y1_6}
          columns={studded_tot.columns}
        />
      </div>
    </React.Fragment>
  );
};

export default StuddedTOTHome;
