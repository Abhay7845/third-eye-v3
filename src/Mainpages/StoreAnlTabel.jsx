import React, { useState } from "react";
import { Table, Thead, Tbody, Tr, Th, Td } from "react-super-responsive-table";
import { IoMdArrowRoundUp, IoMdArrowRoundDown } from "react-icons/io";
import Tippy from "@tippyjs/react";

const StoreAnlTabel = ({ data, channel }) => {
  const [viewMode, setViewMode] = useState("one");

  const handleToggle = () => {
    setViewMode((prev) => (prev === "one" ? "all" : "one"));
  };

  // rows to display in collapsed mode
  const rowsToShow = viewMode === "one" ? 1 : data.length;

  const t_header = [
    "Pincode",
    "Encircle Base (CAGR)",
    `${channel} Base (CAGR)`,
    "ARPC",
    "Dormant Base",
    "Dormancy %",
  ];

  return (
    <React.Fragment>
      <button
        onClick={handleToggle}
        style={{
          position: "fixed",
          bottom: "5px",
          right: "16.5px",
          zIndex: 3,
          padding: "1px",
          borderRadius: "2px",
          border: "none",
          background: "#ccc",
          color: "#36454F",
          cursor: "pointer",
        }}>
        {viewMode === "one" ? (
          <Tippy content='Expand Full Table'>
            <span>
              <IoMdArrowRoundUp size={20} />
            </span>
          </Tippy>
        ) : (
          <Tippy content='Collapse to 1 Rows'>
            <span>
              <IoMdArrowRoundDown size={20} />
            </span>
          </Tippy>
        )}
      </button>

      <div
        style={{
          position: "fixed",
          bottom: "0",
          left: 0,
          right: 0,
          background: "#fff",
          zIndex: 2,
          overflow: "hidden",
          transition: "max-height 0.5s ease",
          maxHeight: viewMode === "all" ? "210px" : "120px",
          marginRight: "5px",
        }}>
        <div style={{ overflowY: "auto", maxHeight: "210px" }}>
          <Table className='custom_table' style={{ textAlign: "start" }}>
            <Thead
              style={{
                position: "sticky",
                top: 0,
                background: "#2e4861",
                color: "#fff",
                zIndex: 2,
                textAlign: "start",
              }}>
              <Tr>
                {t_header.map((head, i) => (
                  <Th key={i} style={{ padding: "12px", textAlign: "start" }}>
                    {head}
                  </Th>
                ))}
              </Tr>
            </Thead>
            <Tbody>
              {data.slice(0, rowsToShow).map((item, i) => (
                <Tr key={i}>
                  <Td>{item?.pincode}</Td>
                  <Td>
                    {item?.encircleBase?.toLocaleString("en-IN")} (
                    {parseFloat(item?.encircleBaseCagr * 100).toFixed(1)}%)
                  </Td>
                  <Td>
                    {item?.channelBase?.toLocaleString("en-IN")} (
                    {parseFloat(item?.channelBaseCagr * 100).toFixed(1)}%)
                  </Td>
                  <Td>{(item?.arpc / 100000).toFixed(2)} L</Td>
                  <Td>{item?.dormantBase?.toLocaleString("en-IN")}</Td>
                  <Td>{item?.dormancyRate}%</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </div>
      </div>
    </React.Fragment>
  );
};

export default StoreAnlTabel;
