import React from "react";
import "./BPMSummaryStyle/BPMFieldValuesTable.css";

const BPMFieldValuesTable = ({ data, columns }) => {
  const safeData = Array.isArray(data) ? data : [];
  const safeColumns = Array.isArray(columns) ? columns : [];

  return (
    <div className='bpm_field_values_table'>
      <table className='bpm_field_values_table__table'>
        <colgroup>
          <col className='bpm_field_values_table__col--field' />
          <col className='bpm_field_values_table__col--remarks' />
        </colgroup>
        <thead className='bpm_field_values_table__header'>
          <tr className='bpm_field_values_table__header_row'>
            {safeColumns.map((column, index) => (
              <th key={column} className='bpm_field_values_table__heading'>
                {String(column ?? (index === 0 ? "Field" : "Remarks"))}
              </th>
            ))}
          </tr>
        </thead>

        <tbody className='bpm_field_values_table__body'>
          {safeData.map((item, index) => (
            <tr
              key={item.field || index}
              className={`bpm_field_values_table__row ${
                index % 2 === 0 ? "" : "bpm_field_values_table__row--even"
              }`}>
              <td className='bpm_field_values_table__field'>{item.field}</td>

              <td className='bpm_field_values_table__remarks'>
                {item.remarks || "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default BPMFieldValuesTable;
