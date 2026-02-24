import React from "react";

const BrandStoreList = ({ stores, brandName, color }) => {
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
          borderBottom: "1px solid #ccc",
          border: "1px solid yellow",
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
