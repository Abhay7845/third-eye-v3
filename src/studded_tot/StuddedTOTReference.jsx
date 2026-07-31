import React from "react";
import "./studdedtotstyle/StuddedTOTReference.css";

const StuddedTOTReference = ({ data, columns, title }) => {
  return (
    <div className='studded_tot_reference_tbl_wrapper'>
      <h5 className='studded_tot_refrence_title'>{title}</h5>
      <table className='studded_tot_reference_tbl'>
        <thead>
          <tr>
            {columns.map((column, index) => (
              <th key={index} className='studded_tot_reference_tbl_headCell'>
                <span className='studded_tot_reference_tbl_headText'>
                  {column.replace("&lt;", "<").replace("&gt;", ">")}
                </span>
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {data.map((row, index) => (
            <tr key={index}>
              <td className='studded_tot_reference_tbl_cell'>{row.low}</td>
              <td className='studded_tot_reference_tbl_cell'>{row.high}</td>
              <td className='studded_tot_reference_tbl_cell'>{row.gis}</td>
              <td className='studded_tot_reference_tbl_cell'>{row.regular}</td>
              <td className='studded_tot_reference_tbl_cell'>
                {row.colorStones}
              </td>
              <td className='studded_tot_reference_tbl_cell'>
                {row.solitaireAUnder70C}
              </td>
              <td className='studded_tot_reference_tbl_cell'>
                {row.solitaireB70To100C}
              </td>
              <td className='studded_tot_reference_tbl_cell'>
                {row.solitaireC1CrtPlus}
              </td>
              <td className='studded_tot_reference_tbl_cell'>
                {row.solitaireD2CrtPlus}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default StuddedTOTReference;
