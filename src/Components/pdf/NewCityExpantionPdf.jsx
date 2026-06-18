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
}) => {
  const [loading, setLoading] = useState(false);
  const [skeletonLoad, setSkeletonLoad] = useState(false);
  const newCityRef = useRef(null);
  const currentDate = moment(new Date()).format("DD-MM-YYYY");
  const s_city = catchmentData?.s_catch;
  const t_city = catchmentData?.t_catch;
  const map_img = useSelector((state) => state?.newStoreMapImg?.newStoreMapImg);
  const dicisionData = useSelector(
    (state) => state?.newCityInputs?.newCityDecisiontext,
  );
  const logo = GetChannelLogo(userLog?.channel?.toLowerCase());

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
    } catch (err) {
      return;
    }
  };

  // ------------------------------------- PDF GENERATION -------------------------------
  const handleSavePdfHistory = async () => {
    try {
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      // Sections to capture in order
      const sections = ["first_page_separation", "second_page_separation"];

      for (let i = 0; i < sections.length; i++) {
        const element = document.querySelector(`.${sections[i]}`);
        if (!element) continue;

        // ✅ Higher scale for sharper rendering
        const canvas = await html2canvas(element, {
          useCORS: true,
          scale: 1.8, // was 1.2, increase for quality
        });

        // ✅ Better quality JPEG (80%)
        const imgData = canvas.toDataURL("image/jpeg", 0.8);

        const imgProps = pdf.getImageProperties(imgData);
        const imgWidth = pdfWidth * 0.92;
        const imgHeight = (imgProps.height * imgWidth) / imgProps.width;

        const x = pdfWidth * 0.04;
        const y = pdfHeight * 0.04;

        if (i > 0) pdf.addPage();

        pdf.addImage(
          imgData,
          "JPEG",
          x,
          y,
          imgWidth,
          imgHeight,
          undefined,
          "FAST",
        );
      }

      // ✅ Get initial PDF Blob
      const pdfBlob = pdf.output("blob");

      // ✅ Further compress with pdf-lib
      const arrayBuffer = await pdfBlob.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer, {
        ignoreEncryption: true,
      });

      // Metadata optimization
      pdfDoc.setProducer("Optimized PDF");
      pdfDoc.setCreator("");

      const compressedBytes = await pdfDoc.save({ useObjectStreams: true });
      const compressedBlob = new Blob([compressedBytes], {
        type: "application/pdf",
      });

      // ✅ Create file from compressed PDF
      const pdfFile = new File([compressedBlob], `${pdfFileName}.pdf`, {
        type: "application/pdf",
      });
      // Upload internally
      await UploadPdf(pdfFile);
    } catch (error) {
      return;
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
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      // Sections to capture in order
      const sections = ["first_page_separation", "second_page_separation"];

      for (let i = 0; i < sections.length; i++) {
        const element = document.querySelector(`.${sections[i]}`);
        if (!element) continue;

        // ✅ Higher scale for sharper rendering
        const canvas = await html2canvas(element, {
          useCORS: true,
          scale: 1.8, // was 1.2, increase for quality
        });

        // ✅ Better quality JPEG (80%)
        const imgData = canvas.toDataURL("image/jpeg", 0.8);

        const imgProps = pdf.getImageProperties(imgData);
        const imgWidth = pdfWidth * 0.92;
        const imgHeight = (imgProps.height * imgWidth) / imgProps.width;

        const x = pdfWidth * 0.04;
        const y = pdfHeight * 0.04;

        if (i > 0) pdf.addPage();

        pdf.addImage(
          imgData,
          "JPEG",
          x,
          y,
          imgWidth,
          imgHeight,
          undefined,
          "FAST",
        );
      }

      // ✅ Get initial PDF Blob
      const pdfBlob = pdf.output("blob");

      // ✅ Further compress with pdf-lib
      const arrayBuffer = await pdfBlob.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer, {
        ignoreEncryption: true,
      });

      // Metadata optimization
      pdfDoc.setProducer("Optimized PDF");
      pdfDoc.setCreator("");
      const compressedBytes = await pdfDoc.save({ useObjectStreams: true });
      const compressedBlob = new Blob([compressedBytes], {
        type: "application/pdf",
      });

      // Download to user machine
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
      <div style={{ marginTop: "2%" }} ref={newCityRef}>
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
            <img
              src={third_eye}
              height={30}
              alt='third_eye'
              style={{ marginTop: "-1%" }}
            />
          </div>

          <div className='pdf_top_header'>
            <img src={logo} height={26} alt='logo' />
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
                    {i >= projectionData.length - 2
                      ? `₹${Number(item.value).toFixed(2)}`
                      : item.value}
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
                          <Td>₹{item?.topStore} </Td>
                          <Td>₹{item?.similarStore} </Td>
                        </Tr>
                      );
                    })}
                  </Tbody>
                </Table>
              )}
            </Tbody>
          </Table>
        </div>
        <br />
        <div
          className='second_page_separation'
          style={{
            padding: "10px",
            border: "1px solid #000",
          }}>
          <div className='score_city_box'>
            <h5 className='city_title'> City Score</h5>
            <CityStoresBar data={CityStoreScore} />
          </div>
          <div style={{ border: "1px solid #233044" }}>
            <div style={{ textAlign: "center", padding: "6px" }}>
              External Indicators
            </div>
            <CityProjectionPopulationGraph data={extIndecator} height={200} />
          </div>
          <div style={{ border: "1px solid #233044", marginTop: "5px" }}>
            <div style={{ textAlign: "center", padding: "6px" }}>
              Customers Vs Revenue Trends For City
            </div>
            <CustomerRevenueBar monthOver={monthOver} height={190} />
          </div>
          <div className='user_input_box' style={{ padding: "5px" }}>
            <h5
              style={{
                textAlign: "start",
                margin: "5px",
                marginBottom: "7px",
                fontSize: "11px",
              }}>
              Conclusion: {dicisionData?.recomendation}.
            </h5>
            <div
              style={{
                textAlign: "justify",
                fontSize: "10px",
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

export default NewCityExpantionPdf;
