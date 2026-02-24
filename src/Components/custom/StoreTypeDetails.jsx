import React from "react";

const StoreTypeDetails = ({ storeTypeData }) => {
  return (
    <div
      style={{
        background: "#233044",
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-start",
        gap: "5px",
        fontSize: "clamp(8px, 1vw, 12px)", // auto resize text
        padding: "8px",
        fontWeight: 500,
        color: "#000",
        borderBottom: "1px solid #233044",
        flexWrap: "nowrap", // keep in single row
        overflow: "hidden", // prevent overflow
        textOverflow: "ellipsis", // show "..." if too long
        whiteSpace: "nowrap", // force single line
      }}>
      <span>
        <strong style={{ color: "#fff" }}>Store Code:</strong>
        <span
          style={{
            background: "#f4f6f8",
            padding: "2px 5px",
            borderRadius: "1px",
          }}>
          {storeTypeData?.storecode}
        </span>
      </span>

      <span>
        <strong style={{ color: "#fff" }}>Store Name:</strong>
        <span
          style={{
            background: "#f4f6f8",
            padding: "2px 5px",
            borderRadius: "1px",
          }}>
          {storeTypeData?.storeName}
        </span>
      </span>

      <span>
        <strong style={{ color: "#fff" }}>Store Type:</strong>
        <span
          style={{
            background: "#f4f6f8",
            padding: "2px 5px",
            borderRadius: "1px",
          }}>
          {storeTypeData?.storeType?.toUpperCase()}
        </span>
      </span>

      <span>
        <strong style={{ color: "#fff" }}>Store Level:</strong>
        <span
          style={{
            background: "#f4f6f8",
            padding: "2px 5px",
            borderRadius: "1px",
          }}>
          {storeTypeData?.storeLevel}
        </span>
      </span>

      <span>
        <strong style={{ color: "#fff" }}>LTL Tag:</strong>
        <span
          style={{
            background: "#f4f6f8",
            padding: "2px 5px",
            borderRadius: "1px",
          }}>
          {storeTypeData?.ltlType}
        </span>
      </span>
    </div>
  );
};

export default StoreTypeDetails;
