import React, { useState, useRef } from "react";
import PdfLoader from "./PdfLoader";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { Table, Thead, Tbody, Tr, Th, Td } from "react-super-responsive-table";
import third_eye from "../../asset/3rdeye.png";
import StoreTypePdfDetails from "../custom/StoreTypePdfDetails";
import { GetChannelLogo } from "../Data/ChannelLogo";
import { useSelector } from "react-redux";
import moment from "moment";
import StoreSummary from "../custom/StoreSummary";
import CustomersShares from "../custom/CustomersShares";
import CatchmentLevelAction from "../custom/CatchmentLevelAction";

const NewStoreCatchmentPdf = ({
  close,
  storeTypeData,
  channel,
  map_img,
  storeSummary,
  population_list,
  custStrPerc,
  StoreColorSet,
  pincodeSummary,
}) => {
  const userLog = useSelector((state) => state?.user?.user);

  const [loading, setLoading] = useState(false);
  const [showDownloadLoader, setShowDownloadLoader] = useState(false);

  const storeCatchment = useRef(null);

  const logo = GetChannelLogo(userLog?.channel?.toLowerCase());
  const currentDate = moment(new Date()).format("DD-MM-YYYY");

  const t_header = [
    "Pincode",
    "Encircle Base (CAGR)",
    `${channel} Base (CAGR)`,
    "ARPC",
    "Dormant Base",
    "Dormancy %",
  ];

  const PDF_SECTIONS = ["first_page_separation"];

  const renderSectionsToPdf = async (pdf) => {
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    const x = pdfWidth * 0.04;
    const y = pdfHeight * 0.04;
    const imgWidth = pdfWidth * 0.92;
    const usableHeight = pdfHeight * 0.88;
    const pageBottomY = y + usableHeight;

    const drawPageBorder = () => {
      pdf.setDrawColor(0, 0, 0);
      pdf.setLineWidth(0.3);
      pdf.rect(x, y, imgWidth, usableHeight);
    };

    let isFirstPage = true;
    let cursorY = y;

    const ensureNewPage = () => {
      if (!isFirstPage) {
        drawPageBorder();
        pdf.addPage();
      }

      isFirstPage = false;
      cursorY = y;
    };

    const CAPTURE_WIDTH_PX = 1100;
    const CAPTURE_SCALE = 2;
    const PDF_TABLE_FONT_BUMP_PX = 1;
    const PDF_MAP_HEIGHT_PX = 320;
    const PDF_CONCLUSION_FONT_BUMP_PX = 2;

    for (let i = 0; i < PDF_SECTIONS.length; i++) {
      const element = document.querySelector(`.${PDF_SECTIONS[i]}`);

      if (!element) continue;

      const captureHost = document.createElement("div");

      captureHost.style.position = "fixed";
      captureHost.style.left = "-20000px";
      captureHost.style.top = "0";
      captureHost.style.width = `${CAPTURE_WIDTH_PX}px`;
      captureHost.style.maxWidth = `${CAPTURE_WIDTH_PX}px`;
      captureHost.style.minWidth = `${CAPTURE_WIDTH_PX}px`;
      captureHost.style.background = "#fff";
      captureHost.style.zIndex = "-1";

      const captureNode = element.cloneNode(true);

      captureNode.style.width = `${CAPTURE_WIDTH_PX}px`;
      captureNode.style.maxWidth = `${CAPTURE_WIDTH_PX}px`;
      captureNode.style.minWidth = `${CAPTURE_WIDTH_PX}px`;
      captureNode.style.boxSizing = "border-box";

      captureHost.appendChild(captureNode);
      document.body.appendChild(captureHost);

      // General PDF table font
      const pdfTableNodes = captureNode.querySelectorAll(
        ".pdf-font-up-table, .pdf-font-up-table *",
      );

      pdfTableNodes.forEach((node) => {
        const computedSize = parseFloat(window.getComputedStyle(node).fontSize);

        if (!Number.isNaN(computedSize)) {
          node.style.fontSize = `${computedSize + PDF_TABLE_FONT_BUMP_PX}px`;
        }
      });

      // Extra spacing specifically for Customer Share in PDF
      const customerShareNodes = captureNode.querySelectorAll(
        ".pdf-customer-share",
      );

      customerShareNodes.forEach((node) => {
        node.style.marginBottom = "18px";
        node.style.paddingBottom = "10px";
      });

      // Extra spacing for Customer Share table rows/cells
      const customerShareTable = captureNode.querySelector(
        ".pdf-customer-share-table",
      );

      if (customerShareTable) {
        const customerRows = customerShareTable.querySelectorAll("tr");

        customerRows.forEach((row) => {
          row.style.height = "28px";

          const cells = row.querySelectorAll("th, td");

          cells.forEach((cell) => {
            cell.style.paddingTop = "7px";
            cell.style.padding = "10px";
            cell.style.verticalAlign = "middle";
          });
        });
      }

      // Map height only for PDF
      const pdfMapImage = captureNode.querySelector(".pdf-map-screenshot");

      if (pdfMapImage) {
        pdfMapImage.style.height = `${PDF_MAP_HEIGHT_PX}px`;
      }

      // Conclusion font adjustment
      const pdfConclusionNodes = captureNode.querySelectorAll(
        ".pdf-conclusion-section, .pdf-conclusion-section *",
      );

      pdfConclusionNodes.forEach((node) => {
        const computedSize = parseFloat(window.getComputedStyle(node).fontSize);

        if (!Number.isNaN(computedSize)) {
          node.style.fontSize = `${
            computedSize + PDF_CONCLUSION_FONT_BUMP_PX
          }px`;
        }
      });

      let canvas;

      try {
        canvas = await html2canvas(captureNode, {
          useCORS: true,
          scale: CAPTURE_SCALE,
          width: CAPTURE_WIDTH_PX,
          windowWidth: CAPTURE_WIDTH_PX,
          scrollX: 0,
          scrollY: 0,
          backgroundColor: "#ffffff",
        });
      } finally {
        document.body.removeChild(captureHost);
      }

      const sourceWidth = canvas.width;
      const sourceHeight = canvas.height;

      const fullImgHeight = (sourceHeight * imgWidth) / sourceWidth;

      if (fullImgHeight <= usableHeight) {
        const canFitInCurrentPage =
          !isFirstPage && cursorY + fullImgHeight <= pageBottomY;

        if (isFirstPage || !canFitInCurrentPage) {
          ensureNewPage();
        }

        const imgData = canvas.toDataURL("image/jpeg", 0.85);

        pdf.addImage(
          imgData,
          "JPEG",
          x,
          cursorY,
          imgWidth,
          fullImgHeight,
          undefined,
          "FAST",
        );

        cursorY += fullImgHeight;

        continue;
      }

      const maxSliceHeightPxFloat = (usableHeight * sourceWidth) / imgWidth;

      const pageSliceHeightPx = Math.max(1, Math.round(maxSliceHeightPxFloat));

      let offsetY = 0;

      while (offsetY < sourceHeight) {
        const sliceHeight = Math.min(pageSliceHeightPx, sourceHeight - offsetY);

        const sliceCanvas = document.createElement("canvas");

        sliceCanvas.width = sourceWidth;
        sliceCanvas.height = sliceHeight;

        const ctx = sliceCanvas.getContext("2d");

        if (!ctx) break;

        ctx.drawImage(
          canvas,
          0,
          offsetY,
          sourceWidth,
          sliceHeight,
          0,
          0,
          sourceWidth,
          sliceHeight,
        );

        const sliceImgHeight = (sliceHeight * imgWidth) / sourceWidth;

        const canFitSliceInCurrentPage =
          !isFirstPage && cursorY + sliceImgHeight <= pageBottomY;

        if (isFirstPage || !canFitSliceInCurrentPage) {
          ensureNewPage();
        }

        const sliceImg = sliceCanvas.toDataURL("image/jpeg", 0.85);

        pdf.addImage(
          sliceImg,
          "JPEG",
          x,
          cursorY,
          imgWidth,
          sliceImgHeight,
          undefined,
          "FAST",
        );

        cursorY += sliceImgHeight;
        offsetY += sliceHeight;
      }
    }

    if (!isFirstPage) {
      drawPageBorder();
    }
  };

  const handleDownloadPdf = async () => {
    setShowDownloadLoader(true);

    try {
      const pdf = new jsPDF("p", "mm", "a4");

      await renderSectionsToPdf(pdf);

      const pdfBlob = pdf.output("blob");

      const link = document.createElement("a");

      link.href = URL.createObjectURL(pdfBlob);
      link.download = "StoreCatchment.pdf";

      link.click();

      setTimeout(() => {
        URL.revokeObjectURL(link.href);
      }, 1000);
    } catch (error) {
      console.error("PDF download error:", error);
    } finally {
      setShowDownloadLoader(false);
    }
  };

  return (
    <React.Fragment>
      {/* BUTTONS */}
      <div
        style={{
          display: "flex",
          justifyContent: "end",
          alignItems: "center",
          marginBottom: "2px",
        }}>
        <div>
          <button
            onClick={handleDownloadPdf}
            className={loading ? "apply_btn_disabled" : "CButton"}
            disabled={loading}
            style={{ marginRight: "5px" }}>
            {loading ? "Preparing PDF..." : "Download"}
          </button>

          <button className='CButton' onClick={close}>
            Close
          </button>
        </div>

        {showDownloadLoader && <PdfLoader />}
      </div>

      {/* PDF CONTENT */}
      <div style={{ marginTop: "2%" }} ref={storeCatchment}>
        <div
          className='first_page_separation'
          style={{
            padding: "10px",
            border: "1px solid #000",
            background: "#fff",
          }}>
          {/* THIRD EYE LOGO */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              marginBottom: "5px",
            }}>
            <img src={third_eye} style={{ height: "30px" }} alt='third_eye' />
          </div>

          {/* HEADER */}
          <div className='pdf_top_header'>
            <img src={logo} style={{ height: "30px" }} alt='logo' />

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "end",
                fontSize: "12px",
                gap: "4px",
                fontWeight: "bold",
              }}>
              <span>History ID: N/A</span>
              <div>Date: {currentDate}</div>
            </div>
          </div>

          <br />

          {/* STORE TYPE */}
          <StoreTypePdfDetails
            storeTypeData={storeTypeData}
            channel={channel}
          />

          {/* MAP + CATCHMENT ACTION */}
          <div
            style={{
              width: "100%",
              marginTop: "5px",
              display: "flex",
              alignItems: "stretch",
            }}>
            <div
              style={{
                width: "70%",
                flexShrink: 0,
              }}>
              <img
                src={map_img}
                alt='Map Screenshot'
                className='pdf-map-screenshot'
                style={{
                  width: "100%",
                  height: "260px",
                  display: "block",
                  objectFit: "cover",
                  border: "1px solid #233044",
                }}
              />
            </div>

            <div
              style={{
                width: "30%",
                boxSizing: "border-box",
                border: "1px solid #233044",
                borderLeft: "none",
                background: "#fff",
              }}>
              <div style={{ borderBottom: "1px solid #233044" }}>
                <CatchmentLevelAction StoreColorSet={StoreColorSet} />
              </div>
            </div>
          </div>

          <br />

          {/* STORE SUMMARY */}
          <div
            className='pdf-font-up-table'
            style={{
              width: "100%",
              marginBottom: "15px",
              paddingBottom: "8px",
            }}>
            <StoreSummary
              storeSummary={storeSummary}
              populationList={population_list}
              channel={channel}
              maxHeight='100%'
            />
          </div>

          {/* CUSTOMER SHARE */}
          <div
            className='pdf-font-up-table pdf-customer-share'
            style={{
              width: "100%",
              marginBottom: "20px",
              //   paddingBottom: "12px",
            }}>
            <CustomersShares custStrPerc={custStrPerc} />
          </div>

          {/* PINCODE SUMMARY TABLE */}
          <Table
            className='custom_table pdf-font-up-table'
            style={{
              textAlign: "start",
              fontSize: "10px",
              width: "100%",
              borderCollapse: "collapse",
            }}>
            <Thead
              style={{
                background: "#2e4861",
                color: "#fff",
                textAlign: "start",
                fontSize: "10px",
              }}>
              <Tr>
                {t_header.map((head, i) => (
                  <Th
                    key={i}
                    style={{
                      padding: "6px 8px",
                      textAlign: "start",
                      verticalAlign: "middle",
                      fontSize: "10px",
                      fontWeight: "600",
                    }}>
                    {head}
                  </Th>
                ))}
              </Tr>
            </Thead>

            <Tbody>
              {pincodeSummary?.map((item, i) => (
                <Tr key={i}>
                  <Td
                    style={{
                      padding: "5px 8px",
                      fontSize: "10px",
                      verticalAlign: "middle",
                    }}>
                    {item?.pincode}
                  </Td>

                  <Td
                    style={{
                      padding: "5px 8px",
                      fontSize: "10px",
                      verticalAlign: "middle",
                    }}>
                    {item?.encircleBase?.toLocaleString("en-IN")} (
                    {parseFloat(item?.encircleBaseCagr * 100).toFixed(1)}
                    %)
                  </Td>

                  <Td
                    style={{
                      padding: "5px 8px",
                      fontSize: "10px",
                      verticalAlign: "middle",
                    }}>
                    {item?.channelBase?.toLocaleString("en-IN")} (
                    {parseFloat(item?.channelBaseCagr * 100).toFixed(1)}
                    %)
                  </Td>

                  <Td
                    style={{
                      padding: "5px 8px",
                      fontSize: "10px",
                      verticalAlign: "middle",
                    }}>
                    {(item?.arpc / 100000).toFixed(2)} L
                  </Td>

                  <Td
                    style={{
                      padding: "5px 8px",
                      fontSize: "10px",
                      verticalAlign: "middle",
                    }}>
                    {item?.dormantBase?.toLocaleString("en-IN")}
                  </Td>

                  <Td
                    style={{
                      padding: "5px 8px",
                      fontSize: "10px",
                      verticalAlign: "middle",
                    }}>
                    {item?.dormancyRate}%
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </div>
      </div>
    </React.Fragment>
  );
};

export default NewStoreCatchmentPdf;
