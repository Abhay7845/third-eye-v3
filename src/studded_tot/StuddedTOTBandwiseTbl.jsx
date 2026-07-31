import React from "react";
import "./studdedtotstyle/StuddedTOTBandwiseTbl.css";

const StuddedTOTBandwiseTbl = ({ data, columns, title }) => {
  const renderValue = (value) => {
    return value ?? "-";
  };

  return (
    <div className='studded_tot_bandwise_data_wrapper'>
      <h5 className='studded_tot_bandwise_title'>{title}</h5>
      <table className='studded_tot_bandwise_data_table'>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column} className='studded_tot_bandwise_data_headCell'>
                <span className='studded_tot_bandwise_data_headText'>
                  {column}
                </span>
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {data.map((row, index) => {
            const isOverallRow = row.metric === "Overall NSV";

            return (
              <tr
                key={index}
                className={
                  isOverallRow ? "studded_tot_bandwise_data_overall_row" : ""
                }>
                <td className='studded_tot_bandwise_data_slabCell'>
                  {isOverallRow ? row.metric : row.lowerSlab}
                </td>
                <td className='studded_tot_bandwise_data_slabCell'>
                  {isOverallRow ? "-" : row.upperSlab}
                </td>

                <td className='studded_tot_bandwise_data_valueCell'>
                  {renderValue(row.nsv)}
                </td>
                <td className='studded_tot_bandwise_data_valueCell'>
                  {renderValue(row.gis)}
                </td>
                <td className='studded_tot_bandwise_data_valueCell'>
                  {renderValue(row.regular)}
                </td>
                <td className='studded_tot_bandwise_data_valueCell'>
                  {renderValue(row.colorStones)}
                </td>
                <td className='studded_tot_bandwise_data_valueCell'>
                  {renderValue(row.solitaireAUnder70C)}
                </td>
                <td className='studded_tot_bandwise_data_valueCell'>
                  {renderValue(row.solitaireB70To100C)}
                </td>
                <td className='studded_tot_bandwise_data_valueCell'>
                  {renderValue(row.solitaireC1CrtPlus)}
                </td>
                <td className='studded_tot_bandwise_data_valueCell'>
                  {renderValue(row.solitaireD2CrtPlus)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default StuddedTOTBandwiseTbl;
