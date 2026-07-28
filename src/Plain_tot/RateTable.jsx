import React from "react";
import "./totstyle/RateTable.css";

const getClassName = (name) =>
  name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "");

function RateTable({ data, columns, title }) {
  return (
    <div className='rate_table_wrapper'>
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
                row["Band"] === "Total" ? "rate_table__total_row" : ""
              }>
              {columns.map((column) => (
                <td
                  key={column}
                  className={`rate_table__cell rate_table__cell--${getClassName(
                    column,
                  )}`}>
                  {row[column]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default RateTable;
