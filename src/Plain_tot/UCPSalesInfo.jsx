import React from "react";
import "../Plain_tot/totstyle/UCPSalesInfo.css";

const UCPSalesInfo = ({ data, columns, title }) => {
  return (
    <div className='tot_table_container'>
      <div className='tot_table_card'>
        <h6 className='tot_table_title'>{title}</h6>
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
                <td className='tot_category'>{item?.category}</td>
                <td>{item?.Yr1}</td>
                <td>{item?.Yr2}</td>
                <td>{item?.Yr3}</td>
                <td>{item?.Yr4}</td>
                <td>{item?.Yr5}</td>
                <td>{item?.Yr6}</td>
              </tr>
            ))}

            {title === "UCP Sales" && (
              <tr>
                <td className='tot_category'>Btq Rate</td>
                <td>11760</td>
                <td>11760</td>
                <td>11760</td>
                <td>11760</td>
                <td>11760</td>
                <td>11760</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UCPSalesInfo;
