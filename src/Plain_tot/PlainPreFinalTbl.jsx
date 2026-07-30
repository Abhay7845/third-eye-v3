import React from "react";
import "./totstyle/PlainPreFinalTbl.css";

const getClassName = (name) =>
  name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "");

function PlainPreFinalTbl({ data = [], columns = [], title }) {
  return (
    <div className='rate_table_wrapper'>
      {title && <div className='rate_table_title'>{title}</div>}

      <div className='rate_table_scroll'>
        <table className='rate_table'>
          <thead>
            <tr>
              {columns.map((column) => (
                <th
                  key={column}
                  className={`rate_table__header rate_table__header--${getClassName(
                    column,
                  )}`}>
                  {column}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {data.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className={
                  row?.Band?.toLowerCase() === "total"
                    ? "rate_table__total_row"
                    : ""
                }>
                {columns.map((column) => (
                  <td
                    key={column}
                    className={`rate_table__cell rate_table__cell--${getClassName(
                      column,
                    )}`}>
                    {row[column] ?? "-"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default PlainPreFinalTbl;
