import React from "react";

const StoreTypePdfDetails = ({ storeTypeData, channel }) => {
  return (
    <div style={styles.container}>
      {/* Heading */}
      <div style={styles.heading}>Store Type Details</div>
      {/* Store Details */}
      <div style={styles.table}>
        <div style={styles.row}>
          <PdfCell label='Channel' value={channel} />
          <PdfCell label='Store Code' value={storeTypeData?.storecode} />

          <PdfCell
            label='Store Name'
            value={storeTypeData?.storeName}
            width='30%'
          />

          <PdfCell
            label='Store Type'
            value={storeTypeData?.storeType?.toUpperCase()}
            width='25%'
          />

          <PdfCell
            label='Store Level'
            value={storeTypeData?.storeLevel}
            width='15%'
          />

          <PdfCell label='LTL Tag' value={storeTypeData?.ltlType} width='15%' />
        </div>
      </div>
    </div>
  );
};

const PdfCell = ({ label, value, width = "15%" }) => {
  return (
    <div
      style={{
        ...styles.cell,
        width,
      }}>
      <div style={styles.label}>{label}</div>
      <div style={styles.value}>{value || "N/A"}</div>
    </div>
  );
};

const styles = {
  container: {
    width: "100%",
    border: "1px solid #233044",
    boxSizing: "border-box",
    fontFamily: "Arial, Helvetica, sans-serif",
  },

  heading: {
    fontSize: "13px",
    fontWeight: "bold",
    padding: "6px 8px",
    borderBottom: "1px solid #233044",
    textAlign: "center",
    color: "#8b2f00",
  },

  table: {
    width: "100%",
    padding: "0",
  },

  row: {
    display: "flex",
    width: "100%",
  },

  cell: {
    minHeight: "42px",
    padding: "6px 8px",
    borderRight: "1px solid #1d2939",
    boxSizing: "border-box",
    backgroundColor: "#ffffff",
  },

  label: {
    fontSize: "10px",
    fontWeight: "bold",
    color: "#667085",
    marginBottom: "4px",
    textTransform: "uppercase",
  },

  value: {
    fontSize: "9px",
    fontWeight: "bold",
    color: "#1d2939",
    lineHeight: "13px",
    wordBreak: "break-word",
  },
};

export default StoreTypePdfDetails;
