import React from "react";
import { Table, Thead, Tbody, Tr, Th, Td } from "react-super-responsive-table";
const styles = {
  padding: "3px 4px",
  lineHeight: "0.9",
  border: "1px solid #ddd",
  textAlign: "left",
  fontSize: "9px",
};

const PDFTable = ({ data, userLog }) => {
  const header = [
    "Pincode",
    "Encircle Base (CAGR)",
    `${userLog?.channel} Base (CAGR)`,
    "Penetration",
    "Dormancy Base",
    "Dormancy Rate",
    "ARPC",
  ];

  return (
    <React.Fragment>
      <Table
        style={{
          fontSize: "12px",
          borderCollapse: "collapse",
          width: "100%",
        }}>
        <Thead>
          <Tr>
            {header.map((heading, i) => (
              <Th
                key={i}
                style={{
                  background: "#ccc",
                  fontWeight: "bold",
                  fontSize: "8px",
                  padding: "4px 6px",
                  lineHeight: "1.2",
                  border: "1px solid #ddd",
                  textAlign: "left",
                }}>
                {heading}
              </Th>
            ))}
          </Tr>
        </Thead>
        <Tbody>
          {data?.map((item, i) => (
            <Tr key={i}>
              <Td style={styles}>{item?.pincode}</Td>
              <Td style={styles}>
                {item?.encircleBase?.toLocaleString("en-IN")} (
                {item?.encircleBaseCagr}%)
              </Td>
              <Td style={styles}>
                {item?.channelBase?.toLocaleString("en-IN")} (
                {item?.channelBaseCagr}%)
              </Td>
              <Td style={styles}>{item?.penetration} %</Td>
              <Td style={styles}>
                {item?.dormantBase?.toLocaleString("en-IN")}
              </Td>
              <Td style={styles}>{item?.dormancyRate} %</Td>
              <Td style={styles}>{item?.arpc?.toLocaleString("en-IN")}</Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </React.Fragment>
  );
};

export default PDFTable;
