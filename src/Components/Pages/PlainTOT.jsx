import React from "react";
import UCPSalesInfo from "../../Plain_tot/UCPSalesInfo";
import "../../Plain_tot/totstyle/PlainTOT.css";
import YearsTotTable from "../../Plain_tot/YearsTotTable";
import { dummy_data } from "../../Plain_tot/DummryTotData";
import NSVRangeTable from "../../Plain_tot/NSVRangeTable";
import WeightedRateTable from "../../Plain_tot/WeightedRateTable";
import PlainPreFinalTbl from "../../Plain_tot/PlainPreFinalTbl";

const PlainTOT = () => {
  console.log("dummy_data==>", dummy_data?.ucp_sales_forcast);
  return (
    <React.Fragment>
      <div className='tot_table_layout'>
        <UCPSalesInfo
          title='UCP Sales'
          data={dummy_data?.ucp_sales_forcast?.row_data}
          columns={dummy_data?.ucp_sales_forcast?.col}
        />

        <UCPSalesInfo
          title='AMC/gm'
          data={dummy_data?.ucp_sales_forcast?.row_data}
          columns={dummy_data?.ucp_sales_forcast?.col}
        />

        <UCPSalesInfo
          title='Gold Rate+AMC+MU'
          data={dummy_data?.ucp_sales_forcast?.row_data}
          columns={dummy_data?.ucp_sales_forcast?.col}
        />

        <UCPSalesInfo
          title='Grammage'
          data={dummy_data?.ucp_sales_forcast?.row_data}
          columns={dummy_data?.ucp_sales_forcast?.col}
        />

        <UCPSalesInfo
          title='AMC in Lakhs'
          data={dummy_data?.ucp_sales_forcast?.row_data}
          columns={dummy_data?.ucp_sales_forcast?.col}
        />

        <UCPSalesInfo
          title='AMC Crores'
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
        <YearsTotTable
          data={dummy_data?.financialSummary?.row_data}
          columns={dummy_data?.financialSummary?.col}
          table_title='Y3 TOT'
        />
        <YearsTotTable
          data={dummy_data?.financialSummary?.row_data}
          columns={dummy_data?.financialSummary?.col}
          table_title='Y4 TOT'
        />
        <YearsTotTable
          data={dummy_data?.financialSummary?.row_data}
          columns={dummy_data?.financialSummary?.col}
          table_title='Y5 TOT'
        />
        <YearsTotTable
          data={dummy_data?.financialSummary?.row_data}
          columns={dummy_data?.financialSummary?.col}
          table_title='Y6 TOT'
        />
      </div>

      <div className='net_amc_table_layout'>
        <NSVRangeTable
          data={dummy_data?.net_amc_data?.nsvRangeSummary}
          columns={dummy_data?.net_amc_data?.columns}
          title='Net AMC Y1'
        />
        <NSVRangeTable
          data={dummy_data?.net_amc_data?.nsvRangeSummary}
          columns={dummy_data?.net_amc_data?.columns}
          title='Net AMC Y2'
        />
        <NSVRangeTable
          data={dummy_data?.net_amc_data?.nsvRangeSummary}
          columns={dummy_data?.net_amc_data?.columns}
          title='Net AMC Y3'
        />
        <NSVRangeTable
          data={dummy_data?.net_amc_data?.nsvRangeSummary}
          columns={dummy_data?.net_amc_data?.columns}
          title='Net AMC Y4'
        />
        <NSVRangeTable
          data={dummy_data?.net_amc_data?.nsvRangeSummary}
          columns={dummy_data?.net_amc_data?.columns}
          title='Net AMC Y5'
        />
        <NSVRangeTable
          data={dummy_data?.net_amc_data?.nsvRangeSummary}
          columns={dummy_data?.net_amc_data?.columns}
          title='Net AMC Y6'
        />
      </div>

      <div className='tot_default_table_layout'>
        <WeightedRateTable
          data={dummy_data?.tot_percentage?.weightedRateSummary}
          columns={dummy_data?.tot_percentage?.columns}
          title='TOT Default'
        />
      </div>

      <div className='pre_final_table_layout'>
        <PlainPreFinalTbl
          data={dummy_data?.rote_table_data?.data}
          columns={dummy_data?.rote_table_data?.columns}
          title='Plain TOT Pre Final Y1'
        />
        <PlainPreFinalTbl
          data={dummy_data?.rote_table_data?.data}
          columns={dummy_data?.rote_table_data?.columns}
          title='Plain TOT Pre Final Y2'
        />
        <PlainPreFinalTbl
          data={dummy_data?.rote_table_data?.data}
          columns={dummy_data?.rote_table_data?.columns}
          title='Plain TOT Pre Final Y3'
        />
        <PlainPreFinalTbl
          data={dummy_data?.rote_table_data?.data}
          columns={dummy_data?.rote_table_data?.columns}
          title='Plain TOT Pre Final Y4'
        />
        <PlainPreFinalTbl
          data={dummy_data?.rote_table_data?.data}
          columns={dummy_data?.rote_table_data?.columns}
          title='Plain TOT Pre Final Y5'
        />
        <PlainPreFinalTbl
          data={dummy_data?.rote_table_data?.data}
          columns={dummy_data?.rote_table_data?.columns}
          title='Plain TOT Pre Final Y6'
        />
      </div>
    </React.Fragment>
  );
};

export default PlainTOT;
