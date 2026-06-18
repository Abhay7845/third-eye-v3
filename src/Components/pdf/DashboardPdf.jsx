import React, { useState, useRef, useEffect } from "react";
import { Table, Thead, Tbody, Tr, Th, Td } from "react-super-responsive-table";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import moment from "moment";
import third_eye from "../../asset/3rdeye.png";
import "../Styles/pdfCss/NewStorepdf.css";
import { useSelector } from "react-redux";
import NewStoreProBarGraph from "../common/graph/NewStoreProBarGraph";
import PdfLoader from "./PdfLoader";
import PDFTable from "./PDFTable";
import { GetChannelLogo } from "../Data/ChannelLogo";
import { axiosInstance } from "../../HostManger/API/Authorization";
import Loader from "../custom/Loader";
import { getKeyAndValue } from "../Data/Data";

const DashboardPdf = ({
  inputsPayload,
  close,
  cityName,
  projectionData,
  cannibalization,
  top3Stores,
  userLog,
  priPincodePopulation,
  secPincodePopulation,
  pdfFileName,
  cityTier,
  pdfDecesion,
}) => {
  const newStoreRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [skeletonLoad, setSkeletonLoad] = useState(false);

  //----------------------------------- REDUX STATE -----------------------------------------
  const catchmentData = useSelector(
    (state) => state?.newStoreInputs?.chatchmentData,
  );
  const dicisionData = useSelector(
    (state) => state?.newStoreInputs?.newStoreDecisiontext,
  );
  const map_img = useSelector((state) => state?.newStoreMapImg?.newStoreMapImg);

  const logo = GetChannelLogo(userLog?.channel?.toLowerCase());

  const drive_time = getKeyAndValue(inputsPayload?.radius);
  // -----------------------------------USER INPUTS DATA --------------------------------------------
  const {
    targetPinCode,
    similerStoreVal,
    similarPinCode,
    storeSize,
    category,
    anchorLocation,
    pdfMarkers,
  } = inputsPayload;
  const currentDate = moment(new Date()).format("DD-MM-YYYY");
  // <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<GET OUR BRAND JEWELERS >>>>>>>>>>>>>>>>>>>>>>>>>>
  const brandList = pdfMarkers?.ourBrand || [];
  // <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<GET OUR COMPETITOR JEWELERS >>>>>>>>>>>>>>>>>>>>>>>>>>
  const competitorsList = pdfMarkers?.competitor || [];

  function CategoryFormat(str) {
    return str
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  }

  const str_distance = {
    our_brand: brandList,
    competitor: competitorsList,
  };

  const s_pincodes = similarPinCode?.split(",") || [];
  // --------------------------------DISTANCE CALULATION FOR OUR BRAND -------------------------------
  // Haversine formula to calculate distance in KM

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
      const lat = m?.position?.lat();
      const lng = m?.position?.lng();

      return {
        ...m,
        distance: Number(
          calculateDistance(
            anchorLocation.lat,
            anchorLocation.lng,
            lat,
            lng,
          ).toFixed(1),
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

  // -------------------------------UPLOAD PDF FUNCTIONALITY ---------------------------

  const UploadPdf = async (file) => {
    try {
      const formData = new FormData();
      if (!(file instanceof Blob)) {
        throw new Error("Invalid file type passed to UploadPdf");
      }
      formData.append("files", file);
      formData.append("folderName", "ThirdEye");
      const res = await axiosInstance.post(`/s3/upload`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return res;
    } catch (err) {
      return;
    }
  };

  const PDF_SECTIONS = [
    "first_page_separation",
    "second_page_separation",
    "third_page_separation",
    "forth_page_separation",
  ];

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

    // Use a fixed offscreen capture surface so PDF output does not change with
    // window resize, zoom, viewport changes, or DevTools open/close.
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

      // Increase font only for PDFTable in cloned DOM (preview remains unchanged).
      const pdfTableNodes = captureNode.querySelectorAll(
        ".pdf-font-up-table, .pdf-font-up-table *",
      );
      pdfTableNodes.forEach((node) => {
        const computedSize = parseFloat(window.getComputedStyle(node).fontSize);
        if (Number.isNaN(computedSize)) return;
        node.style.fontSize = `${computedSize + PDF_TABLE_FONT_BUMP_PX}px`;
      });

      // Increase map image height only for PDF capture (preview remains unchanged).
      const pdfMapImage = captureNode.querySelector(".pdf-map-screenshot");
      if (pdfMapImage) {
        pdfMapImage.style.height = `${PDF_MAP_HEIGHT_PX}px`;
      }

      // Increase conclusion section font only for PDF capture (preview remains unchanged).
      const pdfConclusionNodes = captureNode.querySelectorAll(
        ".pdf-conclusion-section, .pdf-conclusion-section *",
      );
      pdfConclusionNodes.forEach((node) => {
        const computedSize = parseFloat(window.getComputedStyle(node).fontSize);
        if (Number.isNaN(computedSize)) return;
        node.style.fontSize = `${computedSize + PDF_CONCLUSION_FONT_BUMP_PX}px`;
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

  // ------------------------------------- PDF GENERATION -------------------------------

  const handleSavePdfHistory = async (pdfFileName) => {
    try {
      const pdf = new jsPDF("p", "mm", "a4");
      await renderSectionsToPdf(pdf);

      //  Create Blob instead of direct save
      const pdfBlob = pdf.output("blob");
      const pdfFile = new File([pdfBlob], `${pdfFileName}.pdf`, {
        type: "application/pdf",
      });
      // Upload to server
      await UploadPdf(pdfFile);
    } catch (error) {
      return error;
    } finally {
      setSkeletonLoad(false);
    }
  };

  useEffect(() => {
    if (pdfFileName) {
      setSkeletonLoad(true);
      setTimeout(() => {
        handleSavePdfHistory(pdfFileName);
      }, 1500);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pdfFileName]);

  const handleDownloadPdf = async () => {
    setLoading(true);
    try {
      const pdf = new jsPDF("p", "mm", "a4");
      await renderSectionsToPdf(pdf);

      // ✅ Create Blob instead of direct save
      const pdfBlob = pdf.output("blob");
      // Also download locally
      const link = document.createElement("a");
      link.href = URL.createObjectURL(pdfBlob);
      link.download = `${pdfFileName}.pdf`;
      link.click();
    } catch (error) {
      return error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <React.Fragment>
      {skeletonLoad && <Loader />}
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
      {loading && <PdfLoader />}
      <div style={{ marginTop: "3%" }} ref={newStoreRef}>
        {/* ------------------------1ST PAGE -------------------- */}
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
            <img src={third_eye} height={30} alt='third_eye' />
          </div>
          <div className='pdf_top_header'>
            <img src={logo} height={26} alt='logo' />
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "end",
                fontSize: "15px",
                gap: "4px",
                fontWeight: "bold",
              }}>
              <span>History ID: {pdfFileName?.toUpperCase()}</span>
              <div>Date: {currentDate}</div>
            </div>
          </div>
          <div className='catchment_box'>
            <h5 className='catchment_title'>User Inputs Details</h5>
            <div className='catchment_grid'>
              <div className='catchment_col'>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: "13px",
                  }}>
                  <tbody>
                    <tr>
                      <td style={{ padding: "3px 4px", fontWeight: "500" }}>
                        Target Pin Codes:
                      </td>
                      <td style={{ padding: "3px 4px" }}>
                        {targetPinCode?.toString()}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: "3px 4px", fontWeight: "500" }}>
                        Similar Store:
                      </td>
                      <td style={{ padding: "3px 4px" }}>{similerStoreVal}</td>
                    </tr>

                    <tr>
                      <td style={{ padding: "3px 4px", fontWeight: "500" }}>
                        Store Size:
                      </td>
                      <td style={{ padding: "3px 4px" }}>{storeSize}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className='catchment_col'>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: "13px",
                  }}>
                  <tbody>
                    <tr>
                      <td style={{ padding: "3px 4px", fontWeight: "500" }}>
                        Similar Pin Codes:
                      </td>
                      <td style={{ padding: "3px 4px" }}>
                        {s_pincodes?.slice(0, 2).join(", ")}
                        {s_pincodes.length > 4 &&
                          `, +${s_pincodes.length - 2} more`}
                      </td>
                    </tr>

                    <tr>
                      <td style={{ padding: "3px 4px", fontWeight: "500" }}>
                        Similar City:
                      </td>
                      <td style={{ padding: "3px 4px" }}>
                        {cityName}, ({cityTier})
                      </td>
                    </tr>

                    <tr>
                      <td style={{ padding: "3px 4px", fontWeight: "500" }}>
                        Store Category:
                      </td>
                      <td style={{ padding: "3px 4px" }}>
                        {CategoryFormat(category || "")}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          {/* catchment div  */}
          <div className='catchment_box'>
            <h5 className='catchment_title'>Catchment Details</h5>
            <div className='catchment_grid'>
              <div className='catchment_col'>
                <div
                  style={{
                    fontSize: "15px",
                    fontWeight: "600",
                    marginBottom: "5px",
                    paddingBottom: "3px",
                  }}>
                  Target Catchment
                </div>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: "13px",
                  }}>
                  <tbody>
                    <tr>
                      <td style={{ padding: "3px 4px", fontWeight: "500" }}>
                        Encircle Base
                      </td>
                      <td style={{ padding: "3px 4px" }}>
                        {Number(
                          catchmentData?.t_catch?.targetEB,
                        ).toLocaleString()}{" "}
                        <span style={{ color: "#666", fontSize: "14px" }}>
                          (CAGR:{" "}
                          {parseFloat(
                            catchmentData?.t_catch?.targetEB_Cagr * 100,
                          ).toFixed(1)}
                          %)
                        </span>
                      </td>
                    </tr>

                    <tr>
                      <td style={{ padding: "3px 4px", fontWeight: "500" }}>
                        {userLog?.channel} Base
                      </td>
                      <td style={{ padding: "3px 4px" }}>
                        {Number(
                          catchmentData?.t_catch?.targetCB,
                        ).toLocaleString()}{" "}
                        <span style={{ color: "#666", fontSize: "14px" }}>
                          (CAGR:{" "}
                          {parseFloat(
                            catchmentData?.t_catch?.targetCB_Cagr * 100,
                          ).toFixed(1)}
                          %)
                        </span>
                      </td>
                    </tr>

                    <tr>
                      <td style={{ padding: "3px 4px", fontWeight: "500" }}>
                        Penetration
                      </td>
                      <td style={{ padding: "3px 4px" }}>
                        {parseInt(catchmentData?.t_catch?.penetration * 100)}%
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className='catchment_col'>
                <div
                  style={{
                    fontSize: "15px",
                    fontWeight: "600",
                    marginBottom: "5px",
                    paddingBottom: "3px",
                  }}>
                  Similar Catchment
                </div>

                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: "13px",
                  }}>
                  <tbody>
                    <tr>
                      <td style={{ padding: "3px 4px", fontWeight: "500" }}>
                        Encircle Base
                      </td>
                      <td style={{ padding: "3px 4px" }}>
                        {Number(
                          catchmentData?.s_catch?.targetEB,
                        ).toLocaleString()}{" "}
                        <span style={{ color: "#666", fontSize: "14px" }}>
                          (CAGR:{" "}
                          {parseFloat(
                            catchmentData?.s_catch?.targetEB_Cagr * 100,
                          ).toFixed(1)}
                          %)
                        </span>
                      </td>
                    </tr>

                    <tr>
                      <td style={{ padding: "3px 4px", fontWeight: "500" }}>
                        {userLog?.channel} Base
                      </td>
                      <td style={{ padding: "3px 4px" }}>
                        {Number(
                          catchmentData?.s_catch?.targetCB,
                        ).toLocaleString()}{" "}
                        <span style={{ color: "#666", fontSize: "14px" }}>
                          (CAGR:{" "}
                          {parseFloat(
                            catchmentData?.s_catch?.targetCB_Cagr * 100,
                          ).toFixed(1)}
                          %)
                        </span>
                      </td>
                    </tr>

                    <tr>
                      <td style={{ padding: "3px 4px", fontWeight: "500" }}>
                        Penetration
                      </td>
                      <td style={{ padding: "3px 4px" }}>
                        {parseInt(catchmentData?.s_catch?.penetration * 100)}%
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
              className='pdf-map-screenshot'
              src={map_img}
              alt='map_Screenshot'
              style={{ width: "100%", height: "250px", display: "block" }}
            />
          </div>
          <br />
          {/* PRIMARY CATCHMENT DETAILS */}
          <div className='user_input_box'>
            <h5 className='user_input_title'>Primary Catchment Details</h5>
            {priPincodePopulation?.length > 0 ? (
              <PDFTable data={priPincodePopulation} userLog={userLog} />
            ) : (
              <h6>Data Not Available</h6>
            )}
          </div>
          <br />
          <div className='user_input_box'>
            <h5 className='user_input_title'>Secondary Catchment Details</h5>
            {secPincodePopulation?.length > 0 ? (
              <PDFTable data={secPincodePopulation} userLog={userLog} />
            ) : (
              <h6>Stores Not Available</h6>
            )}
          </div>
          <br />
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
              {our_brand_list?.length > 0 ? (
                our_brand_list?.map((item, i) => (
                  <React.Fragment key={i}>
                    <strong>{item?.title}:</strong>
                    <span>{item.distance} KM</span>
                  </React.Fragment>
                ))
              ) : (
                <h6 style={{ textAlign: "center" }}>Stores Not Available</h6>
              )}
            </div>
          </div>
          <br />
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
              {competitors_list?.length > 0 ? (
                competitors_list?.map((item, i) => (
                  <React.Fragment key={i}>
                    <strong>{item?.title} Jewellers:</strong>
                    <span>{item.distance} KM</span>
                  </React.Fragment>
                ))
              ) : (
                <h6 style={{ textAlign: "center" }}>Stores Not Available</h6>
              )}
            </div>
          </div>
        </div>
        <br />
        {/* ------------------------2ND PAGE SAPARATION -------------------- */}
        <div
          className='second_page_separation'
          style={{ padding: "10px", border: "1px solid #000" }}>
          <div className='retail_box'>
            <div className='retail_heading'>
              Jewellery Market Store Count:
              <strong style={{ margin: "0 5px" }}>
                {" "}
                {pdfMarkers?.jewellery?.length}{" "}
              </strong>{" "}
              Within Drive Time:
              <strong style={{ margin: "0 5px" }}> {drive_time?.key}Min</strong>
            </div>
            <div style={{ margin: "6px" }}>
              <div className='retail_subheading'>Retail Maturity Summary:</div>
              <div className='retail_section'>
                <h6 style={{ marginBottom: "0px", marginTop: "5px" }}>
                  Major Retail Brands Present
                </h6>
                <ul>
                  <li>
                    <strong>Fashion & Lifestyle:</strong> H&M, Zara, Uniqlo,
                    Lifestyle, Pantaloons.
                  </li>
                  <li>
                    <strong>Tech & Electronics:</strong> Croma, Reliance
                    Digital, Apple Store.
                  </li>
                  <li>
                    <strong>Luxury & Premium:</strong> Marks & Spencer, Sephora,
                    MAC, Coach.
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <br />
          <br />
          <div className='retail_section' style={{ lineHeight: "1.7" }}>
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
        </div>
        {/* ------------------------3RD PAGE: Footfall / Decision -------------------- */}
        <br />
        <div
          className='third_page_separation'
          style={{ padding: "10px", border: "1px solid #000" }}>
          <Table
            className='custom_table'
            style={{
              fontSize: "15px",
              borderCollapse: "collapse",
              width: "100%",
            }}>
            <Thead>
              <Tr>
                <Th
                  colSpan={2}
                  style={{
                    background: "#ccc",
                    fontSize: "15px",
                    padding: "4px 6px",
                    textAlign: "center",
                  }}>
                  New Store Projection Details
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
                      fontSize: "13px",
                    }}>
                    {item.heading}
                  </Td>
                  <Td
                    style={{
                      padding: "4px 6px",
                      textAlign: "center",
                      fontSize: "13px",
                    }}>
                    {(() => {
                      const rawValue = Number(item.value);
                      if (!Number.isFinite(rawValue)) return item.value;

                      if (i >= projectionData.length - 2) {
                        const inCrore = Math.round(rawValue / 10000000);
                        return `₹${inCrore.toLocaleString("en-IN")} Cr`;
                      }

                      return item.value;
                    })()}
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
          <br />
          <div className='user_input_box' style={{ padding: "5px" }}>
            <h5 className='user_input_title'>
              Cannibalization Effect Over Period of 3 Years
            </h5>
            <Table
              className='custom_table'
              style={{
                fontSize: "13px",
                borderCollapse: "collapse",
              }}>
              <Thead>
                <Tr>
                  <Th
                    style={{
                      background: "#ccc",
                      fontSize: "12px",
                      padding: "4px 6px",
                      textAlign: "center",
                    }}>
                    Store
                  </Th>
                  <Th
                    style={{
                      background: "#ccc",
                      fontSize: "12px",
                      padding: "4px 6px",
                      textAlign: "center",
                    }}>
                    Store To Pincode Customer(%) Top 3 Stores
                  </Th>
                  <Th
                    style={{
                      background: "#ccc",
                      fontSize: "12px",
                      padding: "4px 6px",
                      textAlign: "center",
                    }}>
                    Store To Pincode Revenue(%) Top 3 Stores
                  </Th>
                </Tr>
              </Thead>
              <Tbody>
                {top3Stores.map((item, i) => (
                  <Tr key={i} style={{ lineHeight: "1.2" }}>
                    <Td style={{ padding: "4px 6px", textAlign: "center" }}>
                      {item?.storeCode}
                    </Td>
                    <Td style={{ padding: "4px 6px", textAlign: "center" }}>
                      {Number(item?.storeToPinCustPerc).toFixed(2)}%
                    </Td>
                    <Td style={{ padding: "4px 6px", textAlign: "center" }}>
                      {Number(item?.storeToPinRevPerc).toFixed(2)}%
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
            <NewStoreProBarGraph
              cannibalizationPeriod={cannibalization}
              height={200}
            />
          </div>
        </div>
        <br />
        {/* ------------------------4TH PAGE: Projection + Cannibalization -------------------- */}
        <div
          className='forth_page_separation'
          style={{
            padding: "10px",
            paddingTop: "20px",
            border: "1px solid #000",
          }}>
          <div
            className='user_input_box pdf-conclusion-section'
            style={{ padding: "5px" }}>
            <h5
              style={{
                textAlign: "start",
                margin: "5px",
                marginBottom: "7px",
                fontSize: "14px",
              }}>
              Conclusion: {dicisionData?.recomendation}.
            </h5>
            <div
              style={{
                textAlign: "justify",
                fontSize: "12px",
                margin: "5px",
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
      </div>
    </React.Fragment>
  );
};

export default DashboardPdf;
