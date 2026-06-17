import React from "react";

const getContrastTextColor = (bgColor) => {
  if (!bgColor) return "#000";
  const hex = bgColor.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55 ? "#111111" : "#ffffff";
};

const BrandStoreList = ({ stores, brandName, color }) => {
  const textColor = getContrastTextColor(color);
  return (
    <React.Fragment>
      <div
        style={{
          position: "sticky",
          top: 0,
          padding: "5px",
          backgroundColor: color,
          textAlign: "center",
          fontSize: "12px",
          fontWeight: "600",
          color: textColor,
          borderBottom: "1px solid #ccc",
        }}>
        {brandName}
      </div>
      <ul
        style={{
          margin: 0,
          padding: "0 5px",
          listStyle: "none",
          fontSize: "12px",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}>
        {stores.map((marker, index) => (
          <li
            key={index}
            style={{ padding: "5px", borderBottom: "1px solid #ccc" }}>
            {marker.title}
          </li>
        ))}
      </ul>
    </React.Fragment>
  );
};

export default BrandStoreList;
