import React from "react";
import "../studded_tot/studdedtotstyle/StuddedTOTYearwiseTbl.css";

const StuddedTOTYearwiseTbl = ({ data, columns, title }) => {
  const columnKeys = [
    "gis",
    "regular",
    "colorStones",
    "solitaireAUnder70C",
    "solitaireB70To100C",
    "solitaireC1CrtPlus",
    "solitaireD2CrtPlus",
    "total",
  ];
  return (
    <div className='StuddedTOTYearwiseTbl'>
      <div className='StuddedTOTYearwiseTbl__wrapper'>
        {title ? (
          <h5 className='StuddedTOTYearwiseTbl__title'>{title}</h5>
        ) : null}
        <table className='StuddedTOTYearwiseTbl__table'>
          <thead className='StuddedTOTYearwiseTbl__thead'>
            <tr>
              <th className='StuddedTOTYearwiseTbl__metric'>Metric</th>

              {columns.map((item) => (
                <th key={item} className='StuddedTOTYearwiseTbl__heading'>
                  {item}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {data.map((row, index) => (
              <tr
                key={row.metric}
                className={`StuddedTOTYearwiseTbl__row ${
                  index % 2 ? "StuddedTOTYearwiseTbl__row--even" : ""
                }`}>
                <td className='StuddedTOTYearwiseTbl__metric'>{row.metric}</td>

                {columnKeys.map((key) => (
                  <td key={key} className='StuddedTOTYearwiseTbl__cell'>
                    {row[key] ?? "-"}
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

export default StuddedTOTYearwiseTbl;
