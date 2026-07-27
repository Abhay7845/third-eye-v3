import React from "react";
import TotTableInfo from "../../Plain_tot/TotTableInfo";
import "../../Plain_tot/totstyle/PlainTOT.css";
import YearsTotTable from "../../Plain_tot/YearsTotTable";
import { dummy_data } from "../../Plain_tot/DummryTotData";

const PlainTOT = () => {
  console.log("dummy_data==>", dummy_data?.ucp_sales_forcast);
  return (
    <React.Fragment>
      <div className='tot_table_layout'>
        <TotTableInfo
          title='UCP Sales'
          data={dummy_data?.ucp_sales_forcast?.row_data}
          columns={dummy_data?.ucp_sales_forcast?.col}
        />
        <TotTableInfo
          title='Projected Sales'
          data={dummy_data?.ucp_sales_forcast?.row_data}
          columns={dummy_data?.ucp_sales_forcast?.col}
        />
        <TotTableInfo
          title='UCP Sales'
          data={dummy_data?.ucp_sales_forcast?.row_data}
          columns={dummy_data?.ucp_sales_forcast?.col}
        />
      </div>

      <div className='tot_table_layout'>
        <TotTableInfo
          title='Projected Sales'
          data={dummy_data?.ucp_sales_forcast?.row_data}
          columns={dummy_data?.ucp_sales_forcast?.col}
        />
        <TotTableInfo
          title='UCP Sales'
          data={dummy_data?.ucp_sales_forcast?.row_data}
          columns={dummy_data?.ucp_sales_forcast?.col}
        />
        <TotTableInfo
          title='Projected Sales'
          data={dummy_data?.ucp_sales_forcast?.row_data}
          columns={dummy_data?.ucp_sales_forcast?.col}
        />
      </div>
      <div className='years_tot_table_layout'>
        <YearsTotTable
          data={dummy_data?.financialSummary?.row_data}
          columns={dummy_data?.financialSummary?.col}
          table_title='Y1 TOT'
        />
        <YearsTotTable
          data={dummy_data?.financialSummary?.row_data}
          columns={dummy_data?.financialSummary?.col}
          table_title='Y2 TOT'
        />
      </div>
    </React.Fragment>
  );
};

export default PlainTOT;
