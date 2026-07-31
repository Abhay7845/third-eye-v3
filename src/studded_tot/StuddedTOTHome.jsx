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
          title='Y1 TOT'
        />
        <StuddedTOTYearwiseTbl
          data={studded_tot.studded_nsv_y1_6}
          columns={studded_tot.columns}
          title='Y2 TOT'
        />
        <StuddedTOTYearwiseTbl
          data={studded_tot.studded_nsv_y1_6}
          columns={studded_tot.columns}
          title='Y3 TOT'
        />
        <StuddedTOTYearwiseTbl
          data={studded_tot.studded_nsv_y1_6}
          columns={studded_tot.columns}
          title='Y4 TOT'
        />
        <StuddedTOTYearwiseTbl
          data={studded_tot.studded_nsv_y1_6}
          columns={studded_tot.columns}
          title='Y5 TOT'
        />
        <StuddedTOTYearwiseTbl
          data={studded_tot.studded_nsv_y1_6}
          columns={studded_tot.columns}
          title='Y6 TOT'
        />
      </div>
    </React.Fragment>
  );
};

export default StuddedTOTHome;
