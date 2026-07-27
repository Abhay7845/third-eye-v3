import React from "react";
import "../Plain_tot/totstyle/YearsTotTable.css";

const YearsTotTable = ({ data, columns, table_title }) => {
  return (
    <div className='years_tot_container'>
      <div className='years_tot_card'>
        <div className='years_tot_title'>{table_title}</div>
        <table className='years_tot_table'>
          <thead>
            <tr>
              <th>Metric</th>
              {columns.map((col) => (
                <th key={col}>{col}</th>
              ))}
            </tr>
          </thead>

          <tbody>
            {data.map((row, index) => (
              <tr key={index}>
                <td className='years_metric'>{row.metric}</td>
                {columns.map((col) => (
                  <td key={col}>{row[col] !== null ? row[col] : "-"}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default YearsTotTable;
