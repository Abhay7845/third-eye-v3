import React from "react";
import { Table, Thead, Tbody, Tr, Th, Td } from "react-super-responsive-table";

const CustomersShares = ({ custStrPerc = [] }) => {
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
          borderBottom: "none",
        }}>
        Customers Shares
      </div>
      <Table
        className='custom_table'
        style={{
          textAlign: "start",
          margin: "0 auto",
          border: "1px solid #ddd",
        }}>
        <Thead
          style={{
            background: "#ccc",
            color: "#000",
            textAlign: "start",
          }}>
          <Tr>
            {["Share Type", "Share", "Count"].map((head, i) => (
              <Th
                key={i}
                style={{
                  padding: "3px 3px",
                  fontSize: "12px",
                  textAlign: "start",
                }}>
                {head}
              </Th>
            ))}
          </Tr>
        </Thead>

        <Tbody>
          {custStrPerc && custStrPerc.length > 0 ? (
            custStrPerc.map((item, i) => (
              <Tr key={i}>
                <Td
                  style={{
                    padding: "2px 3px",
                    fontSize: "12px",
                  }}>
                  {item?.percentShareType}
                </Td>

                <Td
                  style={{
                    padding: "2px 3px",
                    fontSize: "12px",
                  }}>
                  {parseFloat(item?.customerShare || 0).toFixed(2)} %
                </Td>

                <Td
                  style={{
                    padding: "2px 3px",
                    fontSize: "12px",
                  }}>
                  {item?.customerCount != null
                    ? item.customerCount.toLocaleString("en-IN")
                    : "0"}
                </Td>
              </Tr>
            ))
          ) : (
            <Tr>
              <Td
                colSpan={3}
                style={{
                  padding: "8px 3px",
                  fontSize: "12px",
                  textAlign: "center",
                  color: "#777",
                }}>
                No customer share data available
              </Td>
            </Tr>
          )}
        </Tbody>
      </Table>
    </React.Fragment>
  );
};

export default CustomersShares;
