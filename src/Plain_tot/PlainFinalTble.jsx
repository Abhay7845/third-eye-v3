import "./totstyle/PlainFinalTble.css";

const PlainFinalTble = ({ data, columns, title }) => {
  return (
    <div className='plain_final_tble_wrapper'>
      <div className='plain_final_tble_card'>
        {title && <div className='plain_final_tble_title'>{title}</div>}

        <table className='plain_final_tble'>
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col}>{col}</th>
              ))}
            </tr>
          </thead>

          <tbody>
            {data.map((row, rowIndex) => {
              const isTotal = row.Metric === "Net TOT";

              return (
                <tr
                  key={rowIndex}
                  className={isTotal ? "plain_final_tble_total_row" : ""}>
                  {columns.map((col, colIndex) => (
                    <td
                      key={col}
                      className={
                        colIndex === 0
                          ? "plain_final_tble_first_col"
                          : "plain_final_tble_cell"
                      }>
                      {row[col]}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PlainFinalTble;
