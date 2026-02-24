import React from "react";
import "../Styles/PreHistories.css";
import { RxCross2 } from "react-icons/rx";
import { Table, Thead, Tbody, Tr, Th, Td } from "react-super-responsive-table";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const PreHistories = ({ data, close }) => {
  const tableHead = ["Name", "Email", "Phone"];
  const bodyData = data.map((item) => [item.name, item.email, item.phone]);
  const downloadPDF = () => {
    const doc = new jsPDF();

    autoTable(doc, {
      head: [tableHead],
      body: bodyData,

      // Header border + style
      headStyles: {
        lineWidth: 0.1, // Border thickness
        lineColor: [0, 0, 0], // Border color
        fillColor: [35, 48, 68], // Dark blue background
        textColor: [255, 255, 255], // White text
        fontStyle: "bold",
      },

      // Body border + style
      bodyStyles: {
        lineWidth: 0.1,
        lineColor: [0, 0, 0], // Black border
      },
      theme: "grid", // Ensures all borders are drawn
      tableWidth: "full", // <-- This makes it span full page
    });
    doc.save("YourPreview.pdf");
  };

  return (
    <React.Fragment>
      <div
        style={{
          position: "sticky",
          top: -1,
          zIndex: 1000,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "10px",
          background: "#233044",
          color: "#fff",
        }}>
        <b>Preview</b>
        <RxCross2 onClick={close} className='close_pop_up' />
      </div>
      <div style={{ height: "100%", padding: "3px" }}>
        {data.length > 0 && (
          <Table className='custom_table'>
            <Thead>
              <Tr>
                {tableHead.map((header, i) => {
                  return <Th key={i}>{header}</Th>;
                })}
              </Tr>
            </Thead>
            <Tbody>
              {data.map((item, i) => (
                <Tr key={i}>
                  <Td>{item.name}</Td>
                  <Td>{item.email}</Td>
                  <Td>{item.phone}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
        <div
          style={{
            position: "sticky",
            bottom: 0,
            display: "flex",
            justifyContent: "end",
            background: "#fff",
            paddingTop: "5px",
            paddingBottom: "5px",
            zIndex: 1,
            borderTop: "1px solid gray",
          }}>
          <button className='CButton' onClick={downloadPDF}>
            Download
          </button>
        </div>
      </div>
    </React.Fragment>
  );
};

export default PreHistories;
