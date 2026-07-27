import React from "react";
import "./totstyle/WeightedRateTable.css";

const WeightedRateTable = ({ data = [], columns = [], title }) => {
  return (
    <div className='weighted_rate_container'>
      <div className='weighted_rate_card'>
        <div className='weighted_rate_title'>{title}</div>

        <table className='weighted_rate_table'>
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col}>{col}</th>
              ))}
            </tr>
          </thead>

          <tbody>
            {data.map((row, index) => (
              <tr key={index}>
                {columns.map((col) => (
                  <td key={col}>
                    {row[col] !== null && row[col] !== undefined
                      ? row[col]
                      : "-"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default WeightedRateTable;
