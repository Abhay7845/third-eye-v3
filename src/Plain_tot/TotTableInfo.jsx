import React from "react";
import "../Plain_tot/totstyle/TotTableInfo.css";

const TotTableInfo = ({ data, columns }) => {
  console.log("data==>", data);
  console.log("columns==>", columns);
  return (
    <div className='tot_table_container'>
      <div className='tot_table_card'>
        <h6 className='tot_table_title'>UCP Sales Forecast</h6>
        <table className='tot_sales_table'>
          <thead>
            <tr>
              <th>Category</th>
              {columns.map((year) => (
                <th key={year}>{year}</th>
              ))}
            </tr>
          </thead>

          <tbody>
            {data.map((item) => (
              <tr key={item.category}>
                <td className='tot_category'>{item.category}</td>
                {columns.map((year) => (
                  <td key={year}>{item[year]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TotTableInfo;
