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

  /**
   * ==========================================================
   * PDF ONLY CSS
   * ==========================================================
   *
   * This CSS is added only to the cloned element that is used
   * to generate the PDF.
   *
   * Therefore the normal UI is NOT affected.
   */
  const PDF_ONLY_STYLES = `
    /* ========================================================
       PDF ROOT
    ======================================================== */

    .pdf-capture-root {
      width: 1100px !important;
      max-width: 1100px !important;
      min-width: 1100px !important;

      background: #ffffff !important;
      color: #000000 !important;

      font-family:
        Arial,
        Helvetica,
        sans-serif !important;
    }

    .pdf-capture-root,
    .pdf-capture-root * {
      box-sizing: border-box !important;
    }


    /* ========================================================
       ALL PDF TABLES
    ======================================================== */

    .pdf-capture-root table {
      width: 100% !important;
      max-width: 100% !important;

      border-collapse: collapse !important;
      border-spacing: 0 !important;

      margin: 0 !important;

      table-layout: fixed !important;
    }


    /*
     * react-super-responsive-table normally applies
     * responsive display rules.
     *
     * Those rules can cause html2canvas to calculate table
     * columns differently.
     *
     * Force standard HTML table layout in PDF.
     */

    .pdf-capture-root table.responsiveTable {
      display: table !important;
    }

    .pdf-capture-root table.responsiveTable thead {
      display: table-header-group !important;
    }

    .pdf-capture-root table.responsiveTable tbody {
      display: table-row-group !important;
    }

    .pdf-capture-root table.responsiveTable tr {
      display: table-row !important;
    }

    .pdf-capture-root table.responsiveTable th,
    .pdf-capture-root table.responsiveTable td {
      display: table-cell !important;
    }

    .pdf-capture-root table tr {
      display: table-row !important;
    }

    .pdf-capture-root table th,
    .pdf-capture-root table td {
      display: table-cell !important;

      box-sizing: border-box !important;

      vertical-align: middle !important;

      line-height: 1.25 !important;

      border: 1px solid #233044 !important;

      font-family:
        Arial,
        Helvetica,
        sans-serif !important;
    }


    /* ========================================================
       STORE SUMMARY
       PDF ONLY
    ======================================================== */

    .pdf-capture-root .pdf-store-summary {
      width: 100% !important;

      margin-bottom: 15px !important;

      padding-bottom: 8px !important;
    }

    .pdf-capture-root .pdf-store-summary table {
      width: 100% !important;
      max-width: 100% !important;

      table-layout: fixed !important;

      border-collapse: collapse !important;

      border-spacing: 0 !important;

      border: 1px solid #233044 !important;

      margin: 0 !important;
    }


    /*
     * STORE SUMMARY HEADER
     *
     * Light gray background.
     */
    .pdf-capture-root .pdf-store-summary th {
      display: table-cell !important;

      box-sizing: border-box !important;

      background: #e9ecef !important;

      color: #000000 !important;

      border: 1px solid #233044 !important;

      padding: 7px 10px !important;

      font-family:
        Arial,
        Helvetica,
        sans-serif !important;

      font-size: 11px !important;

      font-weight: 600 !important;

      line-height: 1.25 !important;

      text-align: left !important;

      vertical-align: middle !important;

      white-space: normal !important;

      height: 34px !important;
    }


    /*
     * STORE SUMMARY BODY
     */
    .pdf-capture-root .pdf-store-summary td {
      display: table-cell !important;

      box-sizing: border-box !important;

      background: #ffffff !important;

      color: #000000 !important;

      border: 1px solid #233044 !important;

      padding: 7px 10px !important;

      font-family:
        Arial,
        Helvetica,
        sans-serif !important;

      font-size: 11px !important;

      font-weight: 400 !important;

      line-height: 1.25 !important;

      text-align: left !important;

      vertical-align: middle !important;

      white-space: normal !important;
    }

    .pdf-capture-root .pdf-store-summary tr {
      display: table-row !important;

      height: auto !important;
    }

    .pdf-capture-root .pdf-store-summary thead {
      display: table-header-group !important;
    }

    .pdf-capture-root .pdf-store-summary tbody {
      display: table-row-group !important;
    }


    /* ========================================================
       CUSTOMERS SHARES
       PDF ONLY
    ======================================================== */

    .pdf-capture-root .pdf-customer-share {
      width: 100% !important;

      margin-bottom: 18px !important;

      padding-bottom: 10px !important;
    }

    .pdf-capture-root .pdf-customer-share table {
      width: 100% !important;
      max-width: 100% !important;

      table-layout: fixed !important;

      border-collapse: collapse !important;

      border-spacing: 0 !important;

      border: 1px solid #233044 !important;

      margin: 0 !important;
    }


    /*
     * CUSTOMERS SHARES HEADER
     *
     * Light gray background.
     */
    .pdf-capture-root .pdf-customer-share th {
      display: table-cell !important;

      box-sizing: border-box !important;

      background: #e9ecef !important;

      color: #000000 !important;

      border: 1px solid #233044 !important;

      padding: 8px 10px !important;

      font-family:
        Arial,
        Helvetica,
        sans-serif !important;

      font-size: 11px !important;

      font-weight: 600 !important;

      line-height: 1.25 !important;

      text-align: left !important;

      vertical-align: middle !important;

      white-space: normal !important;

      height: 34px !important;
    }


    /*
     * CUSTOMERS SHARES BODY
     */
    .pdf-capture-root .pdf-customer-share td {
      display: table-cell !important;

      box-sizing: border-box !important;

      background: #ffffff !important;

      color: #000000 !important;

      border: 1px solid #233044 !important;

      padding: 8px 10px !important;

      font-family:
        Arial,
        Helvetica,
        sans-serif !important;

      font-size: 11px !important;

      font-weight: 400 !important;

      line-height: 1.25 !important;

      text-align: left !important;

      vertical-align: middle !important;

      white-space: normal !important;
    }

    .pdf-capture-root .pdf-customer-share tr {
      display: table-row !important;

      height: auto !important;
    }

    .pdf-capture-root .pdf-customer-share thead {
      display: table-header-group !important;
    }

    .pdf-capture-root .pdf-customer-share tbody {
      display: table-row-group !important;
    }


    /*
     * Explicit responsive-table override for Customers Shares.
     */
    .pdf-capture-root
      .pdf-customer-share table.responsiveTable {
      display: table !important;
    }

    .pdf-capture-root
      .pdf-customer-share table.responsiveTable tr {
      display: table-row !important;
    }

    .pdf-capture-root
      .pdf-customer-share table.responsiveTable th,
    .pdf-capture-root
      .pdf-customer-share table.responsiveTable td {
      display: table-cell !important;
    }


    /* ========================================================
       PINCODE SUMMARY
       PDF ONLY
    ======================================================== */

    .pdf-pincode-table {
      width: 100% !important;

      max-width: 100% !important;

      min-width: 100% !important;

      table-layout: fixed !important;

      border-collapse: collapse !important;

      border-spacing: 0 !important;

      margin: 0 !important;

      padding: 0 !important;

      font-family:
        Arial,
        Helvetica,
        sans-serif !important;

      font-size: 11px !important;

      text-align: left !important;

      border: 1px solid #233044 !important;
    }


    /* ========================================================
       PINCODE COLUMN WIDTHS
    ======================================================== */

    .pdf-pincode-table col.pdf-col-1 {
      width: 12% !important;
    }

    .pdf-pincode-table col.pdf-col-2 {
      width: 23% !important;
    }

    .pdf-pincode-table col.pdf-col-3 {
      width: 23% !important;
    }

    .pdf-pincode-table col.pdf-col-4 {
      width: 12% !important;
    }

    .pdf-pincode-table col.pdf-col-5 {
      width: 17% !important;
    }

    .pdf-pincode-table col.pdf-col-6 {
      width: 13% !important;
    }


    /* ========================================================
       PINCODE HEADER
    ======================================================== */

    .pdf-pincode-table thead {
      display: table-header-group !important;

      width: 100% !important;
    }

    .pdf-pincode-table thead tr {
      display: table-row !important;

      width: 100% !important;
    }

    .pdf-pincode-table th {
      display: table-cell !important;

      background: #2e4861 !important;

      color: #ffffff !important;

      border: 1px solid #233044 !important;

      padding: 7px 8px !important;

      font-size: 11px !important;

      font-weight: 600 !important;

      line-height: 1.25 !important;

      white-space: normal !important;

      text-align: left !important;

      vertical-align: middle !important;

      height: 38px !important;
    }


    /* ========================================================
       PINCODE BODY
    ======================================================== */

    .pdf-pincode-table tbody {
      display: table-row-group !important;

      width: 100% !important;
    }

    .pdf-pincode-table tbody tr {
      display: table-row !important;

      width: 100% !important;

      height: 28px !important;
    }

    .pdf-pincode-table td {
      display: table-cell !important;

      color: #000000 !important;

      background: #ffffff !important;

      border: 1px solid #233044 !important;

      padding: 6px 8px !important;

      font-size: 11px !important;

      font-weight: 400 !important;

      line-height: 1.25 !important;

      white-space: nowrap !important;

      text-align: left !important;

      vertical-align: middle !important;

      height: 28px !important;
    }


    /* ========================================================
       GENERAL PDF FONT
    ======================================================== */

    .pdf-font-up-table th,
    .pdf-font-up-table td {
      box-sizing: border-box !important;

      vertical-align: middle !important;

      line-height: 1.25 !important;
    }


    /* ========================================================
       MAP
    ======================================================== */

    .pdf-map-screenshot {
      display: block !important;

      object-fit: cover !important;
    }
  `;

  /**
   * ==========================================================
   * INJECT PDF CSS
   * ==========================================================
   */
  const injectPdfStyles = (captureNode) => {
    const style = document.createElement("style");

    style.setAttribute("data-pdf-only-style", "true");

    style.textContent = PDF_ONLY_STYLES;

    captureNode.prepend(style);

    captureNode.classList.add("pdf-capture-root");
  };

  /**
   * ==========================================================
   * FIX STORE SUMMARY
   * ==========================================================
   */
  const fixStoreSummaryTables = (captureNode) => {
    const allTables = captureNode.querySelectorAll("table");

    allTables.forEach((table) => {
      /*
       * Skip Pincode Summary.
       */
      if (table.classList.contains("pdf-pincode-table")) {
        return;
      }

      /*
       * Skip Customers Shares.
       */
      if (table.closest(".pdf-customer-share")) {
        return;
      }

      /*
       * Everything else here is Store Summary.
       */
      const parent = table.parentElement;

      if (parent) {
        parent.classList.add("pdf-store-summary");
      }

      /*
       * Force normal table layout.
       */
      table.style.display = "table";

      table.style.width = "100%";

      table.style.maxWidth = "100%";

      table.style.tableLayout = "fixed";

      table.style.borderCollapse = "collapse";

      table.style.borderSpacing = "0";

      /*
       * KEEP OUTER BORDER.
       */
      table.style.border = "1px solid #233044";

      /*
       * Header cells.
       */
      const headers = table.querySelectorAll("th");

      headers.forEach((th) => {
        th.style.display = "table-cell";

        th.style.boxSizing = "border-box";

        /*
         * LIGHT GRAY.
         */
        th.style.background = "#e9ecef";

        th.style.color = "#000000";

        /*
         * KEEP BORDER.
         */
        th.style.border = "1px solid #233044";

        th.style.padding = "7px 10px";

        th.style.fontFamily = "Arial, Helvetica, sans-serif";

        th.style.fontSize = "11px";

        th.style.fontWeight = "600";

        th.style.lineHeight = "1.25";

        th.style.textAlign = "left";

        th.style.verticalAlign = "middle";

        th.style.whiteSpace = "normal";

        th.style.height = "34px";
      });

      /*
       * Body cells.
       */
      const cells = table.querySelectorAll("td");

      cells.forEach((td) => {
        td.style.display = "table-cell";

        td.style.boxSizing = "border-box";

        td.style.background = "#ffffff";

        td.style.color = "#000000";

        /*
         * KEEP BORDER.
         */
        td.style.border = "1px solid #233044";

        td.style.padding = "7px 10px";

        td.style.fontFamily = "Arial, Helvetica, sans-serif";

        td.style.fontSize = "11px";

        td.style.fontWeight = "400";

        td.style.lineHeight = "1.25";

        td.style.textAlign = "left";

        td.style.verticalAlign = "middle";

        td.style.whiteSpace = "normal";
      });

      /*
       * Rows.
       */
      const rows = table.querySelectorAll("tr");

      rows.forEach((row) => {
        row.style.display = "table-row";

        row.style.height = "auto";
      });

      /*
       * THEAD.
       */
      const thead = table.querySelector("thead");

      if (thead) {
        thead.style.display = "table-header-group";
      }

      /*
       * TBODY.
       */
      const tbody = table.querySelector("tbody");

      if (tbody) {
        tbody.style.display = "table-row-group";
      }
    });
  };

  /**
   * ==========================================================
   * FIX CUSTOMERS SHARES
   * ==========================================================
   */
  const fixCustomerShareTable = (captureNode) => {
    const customerShare = captureNode.querySelector(".pdf-customer-share");

    if (!customerShare) {
      return;
    }

    customerShare.style.width = "100%";

    customerShare.style.marginBottom = "18px";

    customerShare.style.paddingBottom = "10px";

    const tables = customerShare.querySelectorAll("table");

    tables.forEach((table) => {
      /*
       * Force standard HTML table.
       */
      table.style.display = "table";

      table.style.width = "100%";

      table.style.maxWidth = "100%";

      table.style.tableLayout = "fixed";

      table.style.borderCollapse = "collapse";

      table.style.borderSpacing = "0";

      /*
       * KEEP BORDER.
       */
      table.style.border = "1px solid #233044";

      /*
       * Header cells.
       */
      const headers = table.querySelectorAll("th");

      headers.forEach((th) => {
        th.style.display = "table-cell";

        th.style.boxSizing = "border-box";

        /*
         * LIGHT GRAY HEADER.
         */
        th.style.background = "#e9ecef";

        th.style.color = "#000000";

        /*
         * KEEP BORDER.
         */
        th.style.border = "1px solid #233044";

        th.style.padding = "8px 10px";

        th.style.fontFamily = "Arial, Helvetica, sans-serif";

        th.style.fontSize = "11px";

        th.style.fontWeight = "600";

        th.style.lineHeight = "1.25";

        th.style.textAlign = "left";

        th.style.verticalAlign = "middle";

        th.style.whiteSpace = "normal";

        th.style.height = "34px";
      });

      /*
       * Body cells.
       */
      const cells = table.querySelectorAll("td");

      cells.forEach((td) => {
        td.style.display = "table-cell";

        td.style.boxSizing = "border-box";

        td.style.background = "#ffffff";

        td.style.color = "#000000";

        /*
         * KEEP BORDER.
         */
        td.style.border = "1px solid #233044";

        td.style.padding = "8px 10px";

        td.style.fontFamily = "Arial, Helvetica, sans-serif";

        td.style.fontSize = "11px";

        td.style.fontWeight = "400";

        td.style.lineHeight = "1.25";

        td.style.textAlign = "left";

        td.style.verticalAlign = "middle";

        td.style.whiteSpace = "normal";
      });

      /*
       * Rows.
       */
      const rows = table.querySelectorAll("tr");

      rows.forEach((row) => {
        row.style.display = "table-row";

        row.style.height = "auto";
      });

      /*
       * THEAD.
       */
      const thead = table.querySelector("thead");

      if (thead) {
        thead.style.display = "table-header-group";
      }

      /*
       * TBODY.
       */
      const tbody = table.querySelector("tbody");

      if (tbody) {
        tbody.style.display = "table-row-group";
      }
    });
  };

  /**
   * ==========================================================
   * FIX PINCODE TABLE
   * ==========================================================
   */
  const fixPdfPincodeTable = (captureNode) => {
    const table = captureNode.querySelector(".pdf-pincode-table");

    if (!table) {
      return;
    }

    table.style.display = "table";

    table.style.width = "100%";

    table.style.maxWidth = "100%";

    table.style.minWidth = "100%";

    table.style.tableLayout = "fixed";

    table.style.borderCollapse = "collapse";

    table.style.borderSpacing = "0";

    /*
     * KEEP BORDER.
     */
    table.style.border = "1px solid #233044";

    /*
     * Add column widths.
     */
    let colgroup = table.querySelector("colgroup");

    if (!colgroup) {
      colgroup = document.createElement("colgroup");

      const widths = ["12%", "23%", "23%", "12%", "17%", "13%"];

      widths.forEach((width, index) => {
        const col = document.createElement("col");

        col.className = `pdf-col-${index + 1}`;

        col.style.width = width;

        colgroup.appendChild(col);
      });

      table.insertBefore(colgroup, table.firstChild);
    }

    /*
     * THEAD.
     */
    const thead = table.querySelector("thead");

    if (thead) {
      thead.style.display = "table-header-group";

      thead.style.width = "100%";
    }

    /*
     * TBODY.
     */
    const tbody = table.querySelector("tbody");

    if (tbody) {
      tbody.style.display = "table-row-group";

      tbody.style.width = "100%";
    }

    /*
     * Rows and cells.
     */
    const rows = table.querySelectorAll("tr");

    rows.forEach((row) => {
      row.style.display = "table-row";

      row.style.width = "100%";

      const cells = row.querySelectorAll("th, td");

      cells.forEach((cell) => {
        cell.style.display = "table-cell";

        cell.style.boxSizing = "border-box";

        cell.style.verticalAlign = "middle";

        cell.style.textAlign = "left";

        cell.style.lineHeight = "1.25";

        /*
         * KEEP BORDER.
         */
        cell.style.border = "1px solid #233044";

        if (cell.tagName.toLowerCase() === "th") {
          cell.style.padding = "7px 8px";

          cell.style.fontSize = "11px";

          cell.style.fontWeight = "600";

          cell.style.whiteSpace = "normal";

          cell.style.height = "38px";

          cell.style.background = "#2e4861";

          cell.style.color = "#ffffff";
        } else {
          cell.style.padding = "6px 8px";

          cell.style.fontSize = "11px";

          cell.style.fontWeight = "400";

          cell.style.whiteSpace = "nowrap";

          cell.style.height = "28px";

          cell.style.background = "#ffffff";

          cell.style.color = "#000000";
        }
      });
    });
  };

  /**
   * ==========================================================
   * PDF TABLE FONT FIX
   * ==========================================================
   */
  const applyPdfTableFonts = (captureNode) => {
    /*
     * Store Summary and Customers Shares use an exact
     * font size in PDF.
     *
     * This avoids different nested elements getting
     * different font sizes and breaking alignment.
     */

    const fixedTables = captureNode.querySelectorAll(
      ".pdf-store-summary th, " +
        ".pdf-store-summary td, " +
        ".pdf-customer-share th, " +
        ".pdf-customer-share td",
    );

    fixedTables.forEach((cell) => {
      cell.style.fontFamily = "Arial, Helvetica, sans-serif";

      cell.style.fontSize = "11px";

      cell.style.lineHeight = "1.25";

      cell.style.verticalAlign = "middle";

      cell.style.boxSizing = "border-box";

      /*
       * NEVER remove table border.
       */
      cell.style.border = "1px solid #233044";
    });

    /*
     * Pincode Summary.
     */
    const pincodeCells = captureNode.querySelectorAll(
      ".pdf-pincode-table th, " + ".pdf-pincode-table td",
    );

    pincodeCells.forEach((cell) => {
      cell.style.fontFamily = "Arial, Helvetica, sans-serif";

      cell.style.fontSize = "11px";

      cell.style.lineHeight = "1.25";

      cell.style.verticalAlign = "middle";

      cell.style.boxSizing = "border-box";

      /*
       * NEVER remove border.
       */
      cell.style.border = "1px solid #233044";
    });
  };

  /**
   * ==========================================================
   * MAP FIX
   * ==========================================================
   */
  const fixPdfMap = (captureNode) => {
    const PDF_MAP_HEIGHT_PX = 320;

    const pdfMapImage = captureNode.querySelector(".pdf-map-screenshot");

    if (!pdfMapImage) {
      return;
    }

    pdfMapImage.style.height = `${PDF_MAP_HEIGHT_PX}px`;

    pdfMapImage.style.width = "100%";

    pdfMapImage.style.display = "block";

    pdfMapImage.style.objectFit = "cover";
  };

  /**
   * ==========================================================
   * CONCLUSION FONT FIX
   * ==========================================================
   */
  const fixPdfConclusion = (captureNode) => {
    const PDF_CONCLUSION_FONT_BUMP_PX = 2;

    const nodes = captureNode.querySelectorAll(
      ".pdf-conclusion-section, " + ".pdf-conclusion-section *",
    );

    nodes.forEach((node) => {
      const computedSize = parseFloat(window.getComputedStyle(node).fontSize);

      if (!Number.isNaN(computedSize)) {
        node.style.fontSize = `${computedSize + PDF_CONCLUSION_FONT_BUMP_PX}px`;
      }
    });
  };

  /**
   * ==========================================================
   * RENDER PDF
   * ==========================================================
   */
  const renderSectionsToPdf = async (pdf) => {
    const pdfWidth = pdf.internal.pageSize.getWidth();

    const pdfHeight = pdf.internal.pageSize.getHeight();

    const x = pdfWidth * 0.04;

    const y = pdfHeight * 0.04;

    const imgWidth = pdfWidth * 0.92;

    const usableHeight = pdfHeight * 0.88;

    const pageBottomY = y + usableHeight;

    /**
     * Draw page border.
     */
    const drawPageBorder = () => {
      pdf.setDrawColor(0, 0, 0);

      pdf.setLineWidth(0.3);

      pdf.rect(x, y, imgWidth, usableHeight);
    };

    let isFirstPage = true;

    let cursorY = y;

    /**
     * New page.
     */
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

    /**
     * Process sections.
     */
    for (let i = 0; i < PDF_SECTIONS.length; i++) {
      const element = document.querySelector(`.${PDF_SECTIONS[i]}`);

      if (!element) {
        continue;
      }

      /**
       * Temporary PDF host.
       */
      const captureHost = document.createElement("div");

      captureHost.style.position = "fixed";

      captureHost.style.left = "-20000px";

      captureHost.style.top = "0";

      captureHost.style.width = `${CAPTURE_WIDTH_PX}px`;

      captureHost.style.maxWidth = `${CAPTURE_WIDTH_PX}px`;

      captureHost.style.minWidth = `${CAPTURE_WIDTH_PX}px`;

      captureHost.style.background = "#ffffff";

      captureHost.style.zIndex = "-1";

      /**
       * Clone UI.
       */
      const captureNode = element.cloneNode(true);

      captureNode.style.width = `${CAPTURE_WIDTH_PX}px`;

      captureNode.style.maxWidth = `${CAPTURE_WIDTH_PX}px`;

      captureNode.style.minWidth = `${CAPTURE_WIDTH_PX}px`;

      captureNode.style.boxSizing = "border-box";

      captureNode.style.background = "#ffffff";

      captureHost.appendChild(captureNode);

      document.body.appendChild(captureHost);

      try {
        /**
         * Add PDF-only CSS.
         */
        injectPdfStyles(captureNode);

        /**
         * Fix Store Summary.
         */
        fixStoreSummaryTables(captureNode);

        /**
         * Fix Customers Shares.
         */
        fixCustomerShareTable(captureNode);

        /**
         * Fix Pincode Summary.
         */
        fixPdfPincodeTable(captureNode);

        /**
         * Fix PDF fonts.
         */
        applyPdfTableFonts(captureNode);

        /**
         * Fix map.
         */
        fixPdfMap(captureNode);

        /**
         * Fix conclusion.
         */
        fixPdfConclusion(captureNode);

        /**
         * Wait for browser layout.
         *
         * Two animation frames make sure table widths,
         * fonts and layout have been calculated before
         * html2canvas starts.
         */
        await new Promise((resolve) => {
          requestAnimationFrame(() => {
            requestAnimationFrame(resolve);
          });
        });

        /**
         * ====================================================
         * HTML2CANVAS
         * ====================================================
         */
        const canvas = await html2canvas(captureNode, {
          useCORS: true,

          scale: CAPTURE_SCALE,

          width: CAPTURE_WIDTH_PX,

          windowWidth: CAPTURE_WIDTH_PX,

          scrollX: 0,

          scrollY: 0,

          backgroundColor: "#ffffff",

          /**
           * Final layout enforcement.
           */
          onclone: (clonedDocument) => {
            /*
             * Force all PDF tables to standard
             * HTML table layout.
             */
            const tables = clonedDocument.querySelectorAll(
              ".pdf-capture-root table",
            );

            tables.forEach((table) => {
              table.style.display = "table";

              table.style.width = "100%";

              table.style.maxWidth = "100%";

              table.style.tableLayout = "fixed";

              table.style.borderCollapse = "collapse";

              table.style.borderSpacing = "0";

              /*
               * KEEP BORDER.
               */
              table.style.border = "1px solid #233044";

              const rows = table.querySelectorAll("tr");

              rows.forEach((row) => {
                row.style.display = "table-row";
              });

              const cells = table.querySelectorAll("th, td");

              cells.forEach((cell) => {
                cell.style.display = "table-cell";

                cell.style.boxSizing = "border-box";

                cell.style.verticalAlign = "middle";

                cell.style.lineHeight = "1.25";

                /*
                 * KEEP BORDER.
                 */
                cell.style.border = "1px solid #233044";
              });
            });

            /**
             * Store Summary header.
             */
            const storeHeaders = clonedDocument.querySelectorAll(
              ".pdf-store-summary th",
            );

            storeHeaders.forEach((th) => {
              th.style.background = "#e9ecef";

              th.style.color = "#000000";

              th.style.border = "1px solid #233044";

              th.style.textAlign = "left";

              th.style.verticalAlign = "middle";

              th.style.fontFamily = "Arial, Helvetica, sans-serif";

              th.style.fontSize = "11px";

              th.style.fontWeight = "600";

              th.style.lineHeight = "1.25";
            });

            /**
             * Customers Shares header.
             */
            const customerHeaders = clonedDocument.querySelectorAll(
              ".pdf-customer-share th",
            );

            customerHeaders.forEach((th) => {
              /*
               * LIGHT GRAY.
               */
              th.style.background = "#e9ecef";

              th.style.color = "#000000";

              /*
               * KEEP BORDER.
               */
              th.style.border = "1px solid #233044";

              th.style.textAlign = "left";

              th.style.verticalAlign = "middle";

              th.style.fontFamily = "Arial, Helvetica, sans-serif";

              th.style.fontSize = "11px";

              th.style.fontWeight = "600";

              th.style.lineHeight = "1.25";
            });
          },
        });

        const sourceWidth = canvas.width;

        const sourceHeight = canvas.height;

        const fullImgHeight = (sourceHeight * imgWidth) / sourceWidth;

        /**
         * ====================================================
         * SECTION FITS ON ONE PAGE
         * ====================================================
         */
        if (fullImgHeight <= usableHeight) {
          const canFitInCurrentPage =
            !isFirstPage && cursorY + fullImgHeight <= pageBottomY;

          if (isFirstPage || !canFitInCurrentPage) {
            ensureNewPage();
          }

          const imgData = canvas.toDataURL("image/jpeg", 0.92);

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

        /**
         * ====================================================
         * SECTION REQUIRES MULTIPLE PAGES
         * ====================================================
         */
        const maxSliceHeightPxFloat = (usableHeight * sourceWidth) / imgWidth;

        const pageSliceHeightPx = Math.max(
          1,
          Math.round(maxSliceHeightPxFloat),
        );

        let offsetY = 0;

        while (offsetY < sourceHeight) {
          const sliceHeight = Math.min(
            pageSliceHeightPx,
            sourceHeight - offsetY,
          );

          const sliceCanvas = document.createElement("canvas");

          sliceCanvas.width = sourceWidth;

          sliceCanvas.height = sliceHeight;

          const ctx = sliceCanvas.getContext("2d");

          if (!ctx) {
            break;
          }

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

          const sliceImg = sliceCanvas.toDataURL("image/jpeg", 0.92);

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
      } finally {
        /**
         * Remove temporary clone.
         */
        if (document.body.contains(captureHost)) {
          document.body.removeChild(captureHost);
        }
      }
    }

    /**
     * Final page border.
     */
    if (!isFirstPage) {
      drawPageBorder();
    }
  };

  /**
   * ==========================================================
   * DOWNLOAD
   * ==========================================================
   */
  const handleDownloadPdf = async () => {
    setShowDownloadLoader(true);

    try {
      const pdf = new jsPDF("p", "mm", "a4");

      await renderSectionsToPdf(pdf);

      const pdfBlob = pdf.output("blob");

      const blobUrl = URL.createObjectURL(pdfBlob);

      const link = document.createElement("a");

      link.href = blobUrl;

      link.download = "StoreCatchment.pdf";

      document.body.appendChild(link);

      link.click();

      document.body.removeChild(link);

      setTimeout(() => {
        URL.revokeObjectURL(blobUrl);
      }, 1000);
    } catch (error) {
      console.error("PDF download error:", error);
    } finally {
      setShowDownloadLoader(false);
    }
  };

  /**
   * ==========================================================
   * JSX
   * ==========================================================
   */
  return (
    <React.Fragment>
      {/* ======================================================
          BUTTONS
      ====================================================== */}

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
            style={{
              marginRight: "5px",
            }}>
            {loading ? "Preparing PDF..." : "Download"}
          </button>

          <button className='CButton' onClick={close}>
            Close
          </button>
        </div>

        {showDownloadLoader && <PdfLoader />}
      </div>

      {/* ======================================================
          PDF CONTENT
      ====================================================== */}

      <div
        style={{
          marginTop: "2%",
        }}
        ref={storeCatchment}>
        <div
          className='first_page_separation'
          style={{
            padding: "10px",

            border: "1px solid #000",

            background: "#fff",
          }}>
          {/* ==================================================
              THIRD EYE LOGO
          ================================================== */}

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

          {/* ==================================================
              HEADER
          ================================================== */}

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

          {/* ==================================================
              STORE TYPE
          ================================================== */}

          <StoreTypePdfDetails
            storeTypeData={storeTypeData}
            channel={channel}
          />

          {/* ==================================================
              MAP + CATCHMENT ACTION
          ================================================== */}

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
              <div
                style={{
                  borderBottom: "1px solid #233044",
                }}>
                <CatchmentLevelAction StoreColorSet={StoreColorSet} />
              </div>
            </div>
          </div>

          <br />

          {/* ==================================================
              STORE SUMMARY
          ================================================== */}

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

          {/* ==================================================
              CUSTOMERS SHARES
          ================================================== */}

          <div
            className='pdf-font-up-table pdf-customer-share'
            style={{
              width: "100%",

              marginBottom: "20px",
            }}>
            <CustomersShares custStrPerc={custStrPerc} />
          </div>

          {/* ==================================================
              PINCODE SUMMARY
          ================================================== */}

          <Table
            className='custom_table pdf-font-up-table pdf-pincode-table'
            style={{
              textAlign: "start",

              fontSize: "10px",

              width: "100%",

              borderCollapse: "collapse",

              border: "1px solid #233044",
            }}>
            <colgroup>
              <col
                style={{
                  width: "12%",
                }}
              />

              <col
                style={{
                  width: "23%",
                }}
              />

              <col style={{ width: "23%" }} />
              <col style={{ width: "12%" }} />
              <col style={{ width: "17%" }} />
              <col style={{ width: "13%" }} />
            </colgroup>

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
                      border: "1px solid #233044",
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
                      border: "1px solid #233044",
                    }}>
                    {item?.pincode}
                  </Td>

                  <Td
                    style={{
                      padding: "5px 8px",
                      fontSize: "10px",
                      verticalAlign: "middle",
                      border: "1px solid #233044",
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
                      border: "1px solid #233044",
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
                      border: "1px solid #233044",
                    }}>
                    {(item?.arpc / 100000).toFixed(2)} L
                  </Td>

                  <Td
                    style={{
                      padding: "5px 8px",
                      fontSize: "10px",
                      verticalAlign: "middle",
                      border: "1px solid #233044",
                    }}>
                    {item?.dormantBase?.toLocaleString("en-IN")}
                  </Td>

                  <Td
                    style={{
                      padding: "5px 8px",
                      fontSize: "10px",
                      verticalAlign: "middle",
                      border: "1px solid #233044",
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
