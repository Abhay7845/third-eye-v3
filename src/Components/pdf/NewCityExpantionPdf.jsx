import React, { useState, useRef, useEffect } from "react";
import "../Styles/pdfCss/NewCityExPdf.css";
import moment from "moment";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { PDFDocument } from "pdf-lib";
import { Table, Thead, Tbody, Tr, Th, Td } from "react-super-responsive-table";
import third_eye from "../../asset/3rdeye.png";
import CityStoresBar from "../common/graph/CityStoresBar";
import CityProjectionPopulationGraph from "../common/graph/CityProjectionPopulationGraph";
import CustomerRevenueBar from "../common/graph/CustomerRevenueBar";
import PdfLoader from "./PdfLoader";
import { useSelector } from "react-redux";
import { GetChannelLogo } from "../Data/ChannelLogo";
import { axiosInstance } from "../../HostManger/API/Authorization";
import Loader from "../custom/Loader";
import { formatStoreValue, getKeyAndValue } from "../Data/Data";

const NewCityExpantionPdf = ({
  inputsPayload,
  close,
  projectionData,
  storeShare,
  CityStoreScore,
  catchmentData,
  extIndecator,
  monthOver,
  userLog,
  pdfFileName,
  pdfDecesion,
  retails_category,
}) => {
  const [loading, setLoading] = useState(false);
  const [skeletonLoad, setSkeletonLoad] = useState(false);
  const newCityRef = useRef(null);
  const lastSavedPdfRef = useRef(null);
  const currentDate = moment(new Date()).format("DD-MM-YYYY");
  const s_city = catchmentData?.s_catch;
  const t_city = catchmentData?.t_catch;
  const map_img = useSelector((state) => state?.newStoreMapImg?.newStoreMapImg);
  const dicisionData = useSelector(
    (state) => state?.newCityInputs?.newCityDecisiontext,
  );
  const logo = GetChannelLogo(userLog?.channel?.toLowerCase());

  const drive_time = getKeyAndValue(inputsPayload?.radius);

  const { anchorLocation, pdfMarkers } = inputsPayload;
  // <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<GET OUR BRAND JEWELERS >>>>>>>>>>>>>>>>>>>>>>>>>>
  const brandList = pdfMarkers?.ourBrand || [];
  // <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<GET OUR COMPETITOR JEWELERS >>>>>>>>>>>>>>>>>>>>>>>>>>
  const competitorsList = pdfMarkers?.competitor || [];

  // -------------------------------UPLOAD PDF FUNCTIONALITY ---------------------------
  const UploadPdf = async (file) => {
    try {
      const formData = new FormData();
      if (!(file instanceof Blob)) {
        throw new Error("Invalid file type passed to UploadPdf");
      }
      formData.append("files", file);
      formData.append("folderName", "ThirdEye");
      await axiosInstance.post(`/s3/upload`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
    } catch (err) {
      return;
    }
  };

  // ------------------------------------- PDF GENERATION -------------------------------
  // Fixed capture width — makes html2canvas output identical regardless of
  // browser window size, zoom, viewport changes, or DevTools open/close.
  const CAPTURE_WIDTH_PX = 1100;
  const CAPTURE_SCALE = 2;
  const PDF_EXTERNAL_INDICATOR_WIDTH = 1048;
  const PDF_CUSTOMER_REVENUE_WIDTH = 1048;
  const PDF_SECTIONS = ["first_page_separation", "second_page_separation"];

  const renderSectionsToPdf = async () => {
    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const x = pdfWidth * 0.04;
    const y = pdfHeight * 0.04;
    const imgWidth = pdfWidth * 0.92;
    const usableHeight = pdfHeight * 0.92;
    let isFirstPage = true;
    const drawPageTopBottomBorder = () => {
      pdf.setDrawColor(0, 0, 0);
      pdf.setLineWidth(0.2646);
      pdf.line(x, y, x + imgWidth, y);
      pdf.line(x, y + usableHeight, x + imgWidth, y + usableHeight);
    };

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
        if (!isFirstPage) pdf.addPage();
        const imgData = canvas.toDataURL("image/jpeg", 0.8);
        pdf.addImage(
          imgData,
          "JPEG",
          x,
          y,
          imgWidth,
          fullImgHeight,
          undefined,
          "FAST",
        );
        drawPageTopBottomBorder();
        isFirstPage = false;
        continue;
      }

      const pageSliceHeightPx = Math.max(
        1,
        Math.floor((usableHeight * sourceWidth) / imgWidth),
      );
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

        if (!isFirstPage) pdf.addPage();
        const sliceImg = sliceCanvas.toDataURL("image/jpeg", 0.8);
        const sliceImgHeight = (sliceHeight * imgWidth) / sourceWidth;
        pdf.addImage(
          sliceImg,
          "JPEG",
          x,
          y,
          imgWidth,
          sliceImgHeight,
          undefined,
          "FAST",
        );
        drawPageTopBottomBorder();

        isFirstPage = false;
        offsetY += sliceHeight;
      }
    }

    return pdf;
  };

  const handleSavePdfHistory = async () => {
    try {
      const pdf = await renderSectionsToPdf();
      const pdfBlob = pdf.output("blob");

      const arrayBuffer = await pdfBlob.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer, {
        ignoreEncryption: true,
      });
      pdfDoc.setProducer("Optimized PDF");
      pdfDoc.setCreator("");
      const compressedBytes = await pdfDoc.save({ useObjectStreams: true });
      const compressedBlob = new Blob([compressedBytes], {
        type: "application/pdf",
      });

      const pdfFile = new File([compressedBlob], `${pdfFileName}.pdf`, {
        type: "application/pdf",
      });
      await UploadPdf(pdfFile);
    } catch (error) {
      return;
    } finally {
      setSkeletonLoad(false);
    }
  };

  useEffect(() => {
    if (!pdfFileName) return;
    if (lastSavedPdfRef.current === pdfFileName) return;

    lastSavedPdfRef.current = pdfFileName;

    const runHistorySave = async () => {
      setSkeletonLoad(true);
      // Ensure loader paint before heavy PDF generation starts.
      await new Promise((resolve) => requestAnimationFrame(resolve));
      await new Promise((resolve) => setTimeout(resolve, 0));
      await handleSavePdfHistory(pdfFileName);
    };

    runHistorySave();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pdfFileName]);

  const handleDownloadPdf = async () => {
    setLoading(true);
    try {
      // Let React commit loader UI before starting heavy PDF work.
      await new Promise((resolve) => requestAnimationFrame(resolve));
      await new Promise((resolve) => setTimeout(resolve, 0));

      const pdf = await renderSectionsToPdf();
      const pdfBlob = pdf.output("blob");

      const arrayBuffer = await pdfBlob.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer, {
        ignoreEncryption: true,
      });
      pdfDoc.setProducer("Optimized PDF");
      pdfDoc.setCreator("");
      const compressedBytes = await pdfDoc.save({ useObjectStreams: true });
      const compressedBlob = new Blob([compressedBytes], {
        type: "application/pdf",
      });

      const link = document.createElement("a");
      link.href = URL.createObjectURL(compressedBlob);
      link.download = `${pdfFileName}.pdf`;
      link.click();
    } catch (error) {
      return;
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------DISTANCE CALULATION FOR OUR BRAND -------------------------------
  // Haversine formula to calculate distance in KM

  const str_distance = {
    our_brand: brandList,
    competitor: competitorsList,
  };

  function getMarkersWithDistance(anchorLocation, markers) {
    if (!anchorLocation?.lat || !anchorLocation?.lng || !markers) {
      return [];
    }
    const R = 6371; // Earth's radius in KM
    // Haversine formula
    const calculateDistance = (lat1, lon1, lat2, lon2) => {
      const dLat = ((lat2 - lat1) * Math.PI) / 180;
      const dLon = ((lon2 - lon1) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) *
          Math.cos((lat2 * Math.PI) / 180) *
          Math.sin(dLon / 2) ** 2;

      return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
    };

    // Map markers with distance
    const markersWithDistance = markers.map((m) => {
      // position.lat/lng can be a Google Maps LatLng function (live)
      // or a plain number (after Redux/localStorage serialization on reload)
      const lat =
        typeof m?.position?.lat === "function"
          ? m.position.lat()
          : m?.position?.lat;
      const lng =
        typeof m?.position?.lng === "function"
          ? m.position.lng()
          : m?.position?.lng;

      return {
        ...m,
        distance: Number(
          calculateDistance(
            anchorLocation.lat,
            anchorLocation.lng,
            lat,
            lng,
          ).toFixed(2),
        ),
      };
    });
    const shortStoresbyDistance = markersWithDistance.sort(
      (a, b) => a.distance - b.distance,
    );
    const allSorted_stores = shortStoresbyDistance.map((item) => {
      const brand_name = item.title.split(" ")[0];
      return {
        title: brand_name,
        distance: item.distance,
      };
    });
    const unique_storesList = Object.values(
      allSorted_stores.reduce((acc, curr) => {
        if (!acc[curr.title] || curr.distance < acc[curr.title].distance) {
          acc[curr.title] = curr;
        }
        return acc;
      }, {}),
    );
    return unique_storesList;
  }
  // ---------------------OUR NEAREST BRAND DISTACE CALCULATION FUNCTINALITY-------------
  const nearestOurBrands = getMarkersWithDistance(
    anchorLocation,
    str_distance?.our_brand,
  );

  // ---------------------OUR NEAREST COMPETITORS  DISTACE CALCULATION FUNCTINALITY-------------
  const nearestCompetitors = getMarkersWithDistance(
    anchorLocation,
    str_distance?.competitor,
  );

  function getFirstSixData(list) {
    return list.slice(0, 6);
  }
  const our_brand_list = getFirstSixData(nearestOurBrands);
  const competitors_list = getFirstSixData(nearestCompetitors);

  const showHistoryLoader = skeletonLoad && !loading;
  const showDownloadLoader = loading && !skeletonLoad;

  return (
    <React.Fragment>
      {showHistoryLoader && <Loader />}
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
      </div>
      {showDownloadLoader && <PdfLoader />}
      <div style={{ marginTop: "2%" }} ref={newCityRef}>
        {/* ---------------------------------PDF RIRST PAGE SEPRATION ------------------------------ */}
        <div
          className='first_page_separation'
          style={{
            padding: "10px",
            border: "1px solid #000",
          }}>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              marginBottom: "5px",
            }}>
            <img src={third_eye} style={{ height: "30px" }} alt='third_eye' />
          </div>
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
              <span>History ID: {pdfFileName?.toUpperCase()}</span>
              <div>Date: {currentDate}</div>
            </div>
          </div>
          <div className='catchment_box'>
            <h5 className='catchment_title'>New City Expansion Details</h5>
            <div className='catchment_grid'>
              <div className='catchment_col'>
                <div
                  style={{
                    fontSize: "13px",
                    fontWeight: "600",
                    marginBottom: "5px",
                    paddingBottom: "3px",
                  }}>
                  Similar City
                </div>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: "10px",
                  }}>
                  <tbody>
                    <tr>
                      <td style={{ padding: "2px 4px" }}>Encircle Base:</td>
                      <td style={{ padding: "2px 4px" }}>
                        {s_city?.targetEB?.toLocaleString()}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: "2px 4px" }}>
                        {userLog?.channel} Base:
                      </td>
                      <td style={{ padding: "2px 4px" }}>
                        {s_city?.targetCB?.toLocaleString()}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: "2px 4px" }}>ARPC:</td>
                      <td style={{ padding: "2px 4px" }}>
                        {parseInt(s_city?.arpc)?.toLocaleString()}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: "2px 4px" }}>Penetration:</td>
                      <td style={{ padding: "2px 4px" }}>
                        {parseInt(s_city?.penetration * 100)}%
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: "2px 4px" }}>CAGR:</td>
                      <td style={{ padding: "2px 4px" }}>
                        {(Number(s_city?.targetEB_Cagr) * 100)?.toFixed(2)}%
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className='catchment_col'>
                <div
                  style={{
                    fontSize: "13px",
                    fontWeight: "600",
                    marginBottom: "5px",
                    paddingBottom: "3px",
                  }}>
                  Target City
                </div>

                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: "10px",
                  }}>
                  <tbody>
                    <tr>
                      <td style={{ padding: "2px 4px" }}>Encircle Base:</td>
                      <td style={{ padding: "2px 4px" }}>
                        {t_city?.targetEB?.toLocaleString()}
                      </td>
                    </tr>

                    <tr>
                      <td style={{ padding: "2px 4px" }}>
                        {userLog?.channel} Base:
                      </td>
                      <td style={{ padding: "2px 4px" }}>
                        {t_city?.targetCB?.toLocaleString()}
                      </td>
                    </tr>

                    <tr>
                      <td style={{ padding: "2px 4px" }}>ARPC:</td>
                      <td style={{ padding: "2px 4px" }}>
                        {parseInt(t_city?.arpc)?.toLocaleString()}
                      </td>
                    </tr>

                    <tr>
                      <td style={{ padding: "2px 4px" }}>Penetration:</td>
                      <td style={{ padding: "2px 4px" }}>
                        {parseInt(t_city?.penetration * 100)}%
                      </td>
                    </tr>

                    <tr>
                      <td style={{ padding: "2px 4px" }}>CAGR</td>
                      <td style={{ padding: "2px 4px" }}>
                        {parseFloat(t_city?.targetEB_Cagr * 100)?.toFixed(2)}%
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          {/* GOOGLE MAP DATA DETAILS */}
          <div style={{ width: "100%" }}>
            <img
              src={map_img}
              alt='Map Screenshot'
              style={{ width: "100%", height: "240px", display: "block" }}
            />
          </div>
          <br />
          <Table
            className='custom_table'
            style={{
              fontSize: "12px",
              borderCollapse: "collapse",
              width: "100%",
            }}>
            <Thead>
              <Tr>
                <Th
                  colSpan={2}
                  style={{
                    background: "#ccc",
                    fontSize: "10px",
                    padding: "4px 6px",
                    textAlign: "center",
                  }}>
                  New City Projection Details
                </Th>
              </Tr>
            </Thead>
            <Tbody>
              {projectionData.map((item, i) => (
                <Tr key={i} style={{ lineHeight: "1.2" }}>
                  <Td
                    style={{
                      textAlign: "start",
                      padding: "4px 6px",
                      fontSize: "10px",
                    }}>
                    {item.heading}
                  </Td>
                  <Td
                    style={{
                      padding: "4px 6px",
                      textAlign: "center",
                      fontSize: "10px",
                    }}>
                    {(() => {
                      const rawValue = Number(item.value);
                      const isNumeric = Number.isFinite(rawValue);
                      const isArpcRow = `${item.heading || ""}`
                        .toLowerCase()
                        .includes("arpc");

                      if (!isNumeric) return item.value;
                      if (isArpcRow) {
                        return Math.round(rawValue).toLocaleString("en-IN");
                      }
                      if (i >= projectionData.length - 2) {
                        const inCrore = rawValue / 10000000;
                        return `₹${inCrore.toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })} Cr`;
                      }
                      return rawValue.toLocaleString("en-IN");
                    })()}
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
          <br />
          <Table
            className='custom_table'
            style={{
              fontSize: "10px",
              borderCollapse: "collapse",
              width: "100%",
            }}>
            <Thead>
              <Tr>
                <Th
                  colSpan={2}
                  style={{
                    background: "#ccc",
                    fontSize: "10px",
                    padding: "4px 6px",
                    textAlign: "center",
                  }}>
                  {inputsPayload?.similerStoreVal} Customers Shares in Stores in
                  Near by Cities
                </Th>
              </Tr>
            </Thead>
            <Tbody>
              {storeShare.length > 0 && (
                <Table className='custom_table' style={{ fontSize: "10px" }}>
                  <Thead>
                    <Tr>
                      <Th></Th>
                      <Th>Top Store (Cr) </Th>
                      <Th>Similer Store (Cr)</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {storeShare.map((item, i) => {
                      return (
                        <Tr key={i}>
                          <Td>{item?.fieldName} </Td>
                          <Td>₹{formatStoreValue(item?.topStore)} </Td>
                          <Td>₹{formatStoreValue(item?.similarStore)} </Td>
                        </Tr>
                      );
                    })}
                  </Tbody>
                </Table>
              )}
            </Tbody>
          </Table>
          <div className='score_city_box'>
            <h5 className='city_title'> City Score</h5>
            <CityStoresBar data={CityStoreScore} />
          </div>
          <br />
          <div
            style={{
              border: "1px solid #233044",
            }}>
            <div style={{ textAlign: "center", padding: "6px" }}>
              External Indicators
            </div>
            <CityProjectionPopulationGraph
              data={extIndecator}
              height={200}
              fixedWidth={PDF_EXTERNAL_INDICATOR_WIDTH}
            />
          </div>
          <br />
          <div
            style={{
              border: "1px solid #233044",
            }}>
            <div style={{ textAlign: "center", padding: "6px" }}>
              Customers Vs Revenue Trends For City
            </div>
            <CustomerRevenueBar
              monthOver={monthOver}
              height={190}
              fixedWidth={PDF_CUSTOMER_REVENUE_WIDTH}
            />
          </div>
          <br />
          {our_brand_list?.length > 0 && (
            <div className='user_input_box'>
              <h5 className='user_input_title'>
                Nearest Our Brand Store Details
              </h5>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr 1fr",
                  borderTop: "1px solid black",
                  padding: "8px",
                  fontSize: "12px",
                  gap: "5px",
                  textAlign: "left",
                }}>
                {our_brand_list?.map((item, i) => (
                  <React.Fragment key={i}>
                    <strong>{item?.title}:</strong>
                    <span>{item.distance} KM</span>
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ---------------------------------PDF SECOND PAGE SEPRATION ------------------------------ */}
        <br />
        <div
          className='second_page_separation'
          style={{
            padding: "10px",
            border: "1px solid #000",
          }}>
          {competitors_list?.length > 0 && (
            <div className='user_input_box'>
              <h5 className='user_input_title'>
                Nearest Competitor Store Details
              </h5>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr 1fr",
                  padding: "8px",
                  borderTop: "1px solid black",
                  fontSize: "12px",
                  gap: "5px",
                  textAlign: "left",
                }}>
                {competitors_list?.map((item, i) => (
                  <React.Fragment key={i}>
                    <strong>{item?.title} Jewellers:</strong>
                    <span>{item.distance} KM</span>
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}
          <div className='retail_box'>
            <div className='retail_heading'>
              Jewellery Market Store Count:
              <strong style={{ margin: "0 5px" }}>
                {" "}
                {pdfMarkers?.jewellery?.length}{" "}
              </strong>{" "}
              Within Drive Time:
              <strong style={{ margin: "0 5px" }}> {drive_time?.key}min</strong>
            </div>
            <div style={{ margin: "6px" }}>
              <div className='retail_subheading'>Retail Maturity Summary:</div>
              <div className='retail_section'>
                <h6 style={{ marginBottom: "0px", marginTop: "5px" }}>
                  Major Retail Brands Present
                </h6>
                <ul>
                  {retails_category
                    ?.filter((category) => category.data?.length)
                    ?.map((category) => (
                      <li key={category.label}>
                        <strong>{category.label}:</strong>{" "}
                        {category.data.map((item) => item.title).join(", ")}
                      </li>
                    ))}
                </ul>
              </div>
            </div>
          </div>
          <br />
          <div className='retail_section' style={{ lineHeight: "1.6" }}>
            {pdfDecesion?.map((section, index) => (
              <div key={index}>
                <h6 style={{ marginBottom: "5px", marginTop: "5px" }}>
                  {section.title}
                </h6>
                <ul>
                  {section.points?.map((point, idx) => (
                    <li key={idx}>{point}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <br />
          <div className='user_input_box' style={{ padding: "5px" }}>
            <h5
              style={{
                textAlign: "start",
                margin: "5px",
                marginBottom: "7px",
                fontSize: "14px",
                fontWeight: "bold",
              }}>
              Conclusion: {dicisionData?.recomendation}.
            </h5>
            <div
              style={{
                textAlign: "justify",
                margin: "5px",
                fontSize: "13px",
                lineHeight: "1.5",
              }}>
              <span>{dicisionData?.bottom_line}</span>
              <ul
                style={{
                  columns: "1",
                  columnGap: "2px",
                  paddingLeft: "15px",
                  listStyleType: "disc",
                  textAlign: "justify",
                }}>
                {dicisionData?.reason?.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        {/* ---------------------------------PDF THIRD PAGE SEPRATION ------------------------------ */}
        {/* <div
          className='third_page_separation'
          style={{ padding: "10px", border: "1px solid #000" }}></div> */}
      </div>
    </React.Fragment>
  );
};

export default NewCityExpantionPdf;
