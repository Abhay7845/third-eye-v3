import React, { useState } from "react";
import { Table, Thead, Tbody, Tr, Th, Td } from "react-super-responsive-table";
import { Pagination } from "antd";
import moment from "moment";
import { FaFilePdf } from "react-icons/fa6";
import Tippy from "@tippyjs/react";

const InfinitTableLoad = ({ data, header }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const startIndex = (currentPage - 1) * pageSize;
  const currentData = data.slice(startIndex, startIndex + pageSize);

  return (
    <div
      style={{
        height: "100%",
        overflowY: "auto",
        scrollbarWidth: "none",
        msOverflowStyle: "none",
        marginRight: "5px",
        display: "flex",
        flexDirection: "column",
      }}>
      <Table className='custom_table'>
        <Thead
          style={{
            position: "sticky",
            top: 0,
            background: "#2e4861",
            color: "#fff",
            zIndex: 1,
          }}>
          <Tr>
            {header.map((head, i) => (
              <Th key={i} style={{ padding: "15px" }}>
                {head}
              </Th>
            ))}
          </Tr>
        </Thead>
        <Tbody>
          {currentData.length === 0 ? (
            <Tr>
              <Td
                colSpan={header.length}
                style={{
                  textAlign: "center",
                  padding: "14px",
                  fontWeight: "600",
                  color: "#2e4861",
                }}>
                No record find
              </Td>
            </Tr>
          ) : (
            currentData.map((item, i) => {
              const pdfFileName = item?.historyId?.trim().replace(/\s+/g, "_");
              // UAT PDF URL
              const pdf_url = `https://d6oojw29okpcs.cloudfront.net/ThirdEye/${pdfFileName}.pdf`;
              // PROD PDF URL
              // const pdf_url = `https://d1i4tarane3v3g.cloudfront.net/ThirdEye/${pdfFileName}.pdf`;
              return (
                <Tr key={i}>
                  <Td style={{ width: "6%" }}>{i + 1}</Td>
                  <Td>{pdfFileName}</Td>
                  <Td>{moment(item?.date).format("DD-MM-YYYY")}</Td>
                  <Td>{item?.targetValue}</Td>
                  <Td>{item?.similarValue}</Td>
                  <Td
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      gap: "15px",
                    }}>
                    <Tippy content={<span>Preview PDF</span>}>
                      <span
                        onClick={() =>
                          window.open(pdf_url, "_blank", "noopener,noreferrer")
                        }
                        style={{ cursor: "pointer" }}>
                        <FaFilePdf size={15} color='#e63838ff' />
                      </span>
                    </Tippy>
                  </Td>
                </Tr>
              );
            })
          )}
        </Tbody>
      </Table>
      <div
        style={{
          position: "sticky",
          bottom: 0,
          zIndex: 1,
          padding: "3px",
          background: "#fff",
          textAlign: "center",
          display: "flex",
          justifyContent: "end",
        }}>
        {data.length > 0 && (
          <Pagination
            current={currentPage}
            total={data.length}
            pageSize={pageSize}
            onChange={(page) => setCurrentPage(page)}
            showSizeChanger={false}
          />
        )}
      </div>
    </div>
  );
};

export default InfinitTableLoad;
