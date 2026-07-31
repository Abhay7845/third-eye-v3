import React from "react";
import "./studdedtotstyle/StuddedTOTFinalTbl.css";

const StuddedTOTFinalTbl = ({ data, columns }) => {
  const getValue = (value) => {
    return value ?? "-";
  };

  return (
    <div className='studded_tot_final_tbl_wrapper'>
      <table className='studded_tot_final_tbl'>
        <thead>
          <tr>
            {columns.map((column, index) => (
              <th key={index}>
                {column.replace("&lt;", "<").replace("&gt;", ">")}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {data.map((row, index) => {
            const isMetricRow = !!row.metric;

            return (
              <tr
                key={index}
                className={
                  isMetricRow ? "studded_tot_final_tbl_summary_row" : ""
                }>
                <td>{row.low}</td>
                <td>{row.high}</td>
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
