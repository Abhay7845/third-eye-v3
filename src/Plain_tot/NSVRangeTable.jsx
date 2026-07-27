import React from "react";
import "./totstyle/NSVRangeTable.css";

const NSVRangeTable = ({ data = [], columns = [], title }) => {
  return (
    <div className='nsv_table_container'>
      <div className='nsv_table_card'>
        <div className='nsv_table_title'>{title}</div>
        <table className='nsv_table'>
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

export default NSVRangeTable;
