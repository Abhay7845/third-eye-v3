import React from "react";
import { Table, Tbody, Tr, Th, Td } from "react-super-responsive-table";

const StoreSummary = ({
  storeSummary,
  populationList = [],
  channel,
  maxHeight,
}) => {
  const store_summ_heading = [
    "Total Population",
    "Encircle Base (CAGR)",
    `${channel} Base (CAGR)`,
    "ARPC",
    "Dormant Base",
    "Dormancy Rate",
    "Fill Rate",
  ];

  const getTotalSum = (numbers) => {
    return numbers.reduce((sum, num) => sum + Number(num || 0), 0);
  };

  const getValue = (index) => {
    if (!storeSummary) return "0";

    switch (index) {
      case 0:
        return getTotalSum(populationList).toLocaleString("en-IN");

      case 1:
        return `${storeSummary?.encircleBase?.toLocaleString("en-IN")} (${
          storeSummary?.encircleBaseCagr
        }%)`;

      case 2:
        return `${storeSummary?.channelBase?.toLocaleString("en-IN")} (${
          storeSummary?.channelBaseCagr
        }%)`;

      case 3:
        return storeSummary?.arpc?.toLocaleString("en-IN");

      case 4:
        return storeSummary?.dormantBase?.toLocaleString("en-IN");

      case 5:
        return `${storeSummary?.dormancyRate}%`;

      case 6:
        return `${storeSummary?.fillRate}%`;

      default:
        return "0";
    }
  };

  return (
    <React.Fragment>
      <div
        style={{
          textAlign: "center",
          fontSize: "13px",
          fontWeight: "bold",
          border: "1px solid #233044",
          color: "#8b2f00",
          padding: "6px 8px",
        }}>
        Store Summary
      </div>
      <div
        style={{
          maxHeight: maxHeight,
          overflowY: "auto",
          border: "1px solid #ddd",
          width: "100%",
          margin: "0 auto",
        }}>
        <Table
          className='custom_table'
          style={{
            fontSize: "10px",
            borderCollapse: "collapse",
            width: "100%",
            marginTop: "-1px",
          }}>
          <Tbody>
            {store_summ_heading.map((head, i) => (
              <Tr key={i}>
                <Th
                  style={{
                    background: "#ccc",
                    color: "#000",
                    fontSize: "11px",
                    textAlign: "start",
                    padding: "4px 6px",
                    whiteSpace: "nowrap",
                  }}>
                  {head}
                </Th>

                <Td
                  style={{
                    padding: "4px 6px",
                    fontSize: "10px",
                    textAlign: "start",
                  }}>
                  {getValue(i)}
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </div>
    </React.Fragment>
  );
};

export default StoreSummary;
