import React from "react";
import "./studdedtotstyle/StuddedTOTFinalTbl.css";

const StuddedTOTFinalTbl = ({ data, columns, title }) => {
  const getValue = (value) => {
    return value ?? "-";
  };

  return (
    <div className='studded_tot_final_tbl_wrapper'>
      {title ? <h5 className='studded_tot_final_title'>{title}</h5> : null}
      <table className='studded_tot_final_tbl'>
        <thead>
          <tr>
            {columns.map((column, index) => (
              <th key={index} className='studded_tot_final_tbl_head_cell'>
                <span className='studded_tot_final_tbl_head_text'>
                  {column.replace("&lt;", "<").replace("&gt;", ">")}
                </span>
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {data.map((row, index) => {
            const isMetricRow = !!row.metric;
            const firstCellValue = isMetricRow
              ? row.metric
              : `${getValue(row.low)} - ${getValue(row.high)}`;

            return (
              <tr
                key={index}
                className={
                  isMetricRow ? "studded_tot_final_tbl_summary_row" : ""
                }>
                <td colSpan={2} className='studded_tot_final_tbl_metric_cell'>
                  {firstCellValue}
                </td>

                <td>{getValue(row.gis)}</td>
                <td>{getValue(row.regular)}</td>
                <td>{getValue(row.colorStones)}</td>
                <td>{getValue(row.solitaireAUnder70C)}</td>
                <td>{getValue(row.solitaireB70To100C)}</td>
                <td>{getValue(row.solitaireC1CrtPlus)}</td>
                <td>{getValue(row.solitaireD2CrtPlus)}</td>
                <td>{getValue(row.total)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default StuddedTOTFinalTbl;
