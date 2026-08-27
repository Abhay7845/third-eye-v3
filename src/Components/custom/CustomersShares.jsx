import React, { useState, useRef } from "react";
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

  const handleDownloadPdf = async () => {
    setLoading(true);

    try {
      const element = storeCatchment.current;

      if (!element) {
        setLoading(false);
        return;
      }

      // Wait for fonts
      if (document.fonts) {
        await document.fonts.ready;
      }

      // Wait for images
      const images = element.querySelectorAll("img");

      await Promise.all(
        Array.from(images).map((img) => {
          if (img.complete) {
            return Promise.resolve();
          }

          return new Promise((resolve) => {
            img.onload = resolve;
            img.onerror = resolve;
          });
        }),
      );

      // Allow UI to finish rendering
      await new Promise((resolve) => setTimeout(resolve, 300));

      /*
       * Capture the SAME UI.
       * No separate PDF styling/layout is applied.
       */
      const canvas = await html2canvas(element, {
        useCORS: true,
        allowTaint: false,
        backgroundColor: "#ffffff",
        scale: 2,
        logging: false,
        scrollX: 0,
        scrollY: -window.scrollY,
      });

      const pdf = new jsPDF("p", "mm", "a4");

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const margin = 8;

      const availableWidth = pdfWidth - margin * 2;
      const availableHeight = pdfHeight - margin * 2;

      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;

      const ratio = availableWidth / canvasWidth;

      const fullImageHeight = canvasHeight * ratio;

      /*
       * If complete UI fits on one page
       */
      if (fullImageHeight <= availableHeight) {
        const imgData = canvas.toDataURL("image/jpeg", 0.95);

        pdf.addImage(
          imgData,
          "JPEG",
          margin,
          margin,
          availableWidth,
          fullImageHeight,
          undefined,
          "FAST",
        );
      } else {
        /*
         * Split the exact UI screenshot into pages.
         */
        const pageCanvasHeight = Math.floor(availableHeight / ratio);

        let sourceY = 0;
        let firstPage = true;

        while (sourceY < canvasHeight) {
          const sliceHeight = Math.min(
            pageCanvasHeight,
            canvasHeight - sourceY,
          );

          const sliceCanvas = document.createElement("canvas");

          sliceCanvas.width = canvasWidth;
          sliceCanvas.height = sliceHeight;

          const context = sliceCanvas.getContext("2d");

          context.fillStyle = "#ffffff";

          context.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);

          context.drawImage(
            canvas,
            0,
            sourceY,
            canvasWidth,
            sliceHeight,
            0,
            0,
            canvasWidth,
            sliceHeight,
          );

          const sliceImage = sliceCanvas.toDataURL("image/jpeg", 0.95);

          const slicePdfHeight = sliceHeight * ratio;

          if (!firstPage) {
            pdf.addPage();
          }

          pdf.addImage(
            sliceImage,
            "JPEG",
            margin,
            margin,
            availableWidth,
            slicePdfHeight,
            undefined,
            "FAST",
          );

          firstPage = false;

          sourceY += sliceHeight;
        }
      }

      pdf.save("StoreCatchment.pdf");
    } catch (error) {
      console.error("PDF Download Error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <React.Fragment>
      {/* Download / Close buttons */}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          marginBottom: "2px",
        }}>
        <div>
          <button
            onClick={handleDownloadPdf}
            className={loading ? "apply_btn_disabled" : "CButton"}
            disabled={loading}
            style={{
              marginRight: "5px",
            }}>
            {loading ? "Preparing PDF..." : "Download"}
          </button>

          <button className='CButton' onClick={close}>
            Close
          </button>
        </div>
      </div>

      {/* ================= PDF CONTENT ================= */}
      <div
        ref={storeCatchment}
        style={{
          marginTop: "2%",
          width: "100%",
          background: "#fff",
        }}>
        <div
          style={{
            padding: "10px",
            border: "1px solid #000",
            background: "#fff",
            boxSizing: "border-box",
          }}>
          {/* Third Eye Logo */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              marginBottom: "5px",
            }}>
            <img
              src={third_eye}
              style={{
                height: "30px",
              }}
              alt='third_eye'
            />
          </div>

          {/* Header */}
          <div className='pdf_top_header'>
            <img
              src={logo}
              style={{
                height: "30px",
              }}
              alt='logo'
            />

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
                fontSize: "12px",
                gap: "4px",
                fontWeight: "bold",
              }}>
              <span>History ID: N/A</span>

              <div>Date: {currentDate}</div>
            </div>
          </div>

          <br />

          {/* Store Type */}
          <StoreTypePdfDetails
            storeTypeData={storeTypeData}
            channel={channel}
          />

          {/* Map + Catchment Action */}
          <div
            style={{
              width: "100%",
              marginTop: "5px",
              display: "flex",
              alignItems: "stretch",
            }}>
            {/* Map */}
            <div
              style={{
                width: "70%",
                flexShrink: 0,
              }}>
              <img
                src={map_img}
                alt='Map Screenshot'
                style={{
                  width: "100%",
                  height: "260px",
                  display: "block",
                  objectFit: "cover",
                  border: "1px solid #233044",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* Catchment Action */}
            <div
              style={{
                width: "30%",
                boxSizing: "border-box",
                border: "1px solid #233044",
                borderLeft: "none",
                background: "#fff",
              }}>
              <CatchmentLevelAction StoreColorSet={StoreColorSet} />
            </div>
          </div>

          <br />

          {/* Store Summary */}
          <StoreSummary
            storeSummary={storeSummary}
            populationList={population_list}
            channel={channel}
            maxHeight='100%'
          />

          <br />

          {/* Customer Share */}
          <CustomersShares custStrPerc={custStrPerc} />

          <br />

          {/* Pincode Summary */}
          <Table
            className='custom_table'
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
                      fontSize: "10px",
                      fontWeight: "600",
                      verticalAlign: "middle",
                      lineHeight: "normal",
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
