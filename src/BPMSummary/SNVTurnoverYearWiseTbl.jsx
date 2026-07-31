import "./BPMSummaryStyle/SNVTurnoverYearWiseTbl.css";

const SNVTurnoverYearWiseTbl = ({ data, columns }) => {
  const formatValue = (value) => {
    if (value === null || value === undefined) return "-";

    return typeof value === "number"
      ? value.toLocaleString("en-IN", {
          minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
          maximumFractionDigits: 2,
        })
      : value;
  };

  const getRowClass = (metric) => {
    if (metric.includes("Turnover")) return "highlight-row turnover";
    if (metric.includes("Payout")) return "highlight-row payout";
    if (metric.includes("PBT")) return "highlight-row pbt";
    return "";
  };

  return (
    <div className='snv_turnover_year_wise_tbl_wrapper'>
      <table className='snv_turnover_year_wise_tbl'>
        <thead>
          <tr>
            {columns.map((column, index) => (
              <th key={index}>{column}</th>
            ))}
          </tr>
        </thead>

        <tbody>
          {data.map((row, index) => (
            <tr key={index} className={getRowClass(row.metric)}>
              <td className='metric-column'>{row.metric}</td>
              <td>{formatValue(row.year1)}</td>
              <td>{formatValue(row.year2)}</td>
              <td>{formatValue(row.year3)}</td>
              <td>{formatValue(row.year4)}</td>
              <td>{formatValue(row.year5)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SNVTurnoverYearWiseTbl;
