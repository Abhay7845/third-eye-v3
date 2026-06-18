import React, { useEffect, useState } from "react";

const CityScoreBar = ({ label, value, max, color }) => {
  const [widthPercent, setWidthPercent] = useState(0);

  useEffect(() => {
    const target = (value / max) * 100;
    const timeout = setTimeout(() => setWidthPercent(target), 10);
    return () => clearTimeout(timeout);
  }, [value, max]);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        flexWrap: "nowrap",
        marginBottom: "12px",
        gap: "8px",
        minWidth: 0,
      }}>
      {/* Label */}
      <div
        style={{
          width: "150px",
          flexShrink: 0,
          fontSize: "13px",
          fontWeight: 500,
          textAlign: "left",
          whiteSpace: "nowrap",
        }}>
        {label}
      </div>
      {/* Values Bar */}
      <div
        style={{
          flexShrink: 0,
          whiteSpace: "nowrap",
          textAlign: "center",
          border: "1px solid #000",
          padding: "2px",
          paddingLeft: "12px",
          paddingRight: "12px",
        }}>
        {value}
      </div>
      {/* Progress Bar */}
      <div
        style={{
          flexGrow: 1,
          flexShrink: 1,
          minWidth: 0,
          height: "12px",
          backgroundColor: "#e0e0e0",
          borderRadius: "7px",
          overflow: "hidden",
        }}>
        <div
          style={{
            height: "100%",
            width: `${widthPercent}%`,
            backgroundColor: color,
            borderRadius: "7px",
            transition: "width 1s ease-in-out",
          }}
        />
      </div>
    </div>
  );
};

// Main component rendering all bars
const CityStoresBar = ({ data }) => {
  const colorList = ["#22466b", "#7cc1faff"];
  const result = data.map((item, index) => ({
    ...item,
    color: colorList[index % colorList.length],
  }));

  return (
    <div style={{ padding: "5px" }}>
      {result.map((item, i) => (
        <CityScoreBar
          key={i}
          label={item.city}
          value={item.score}
          max={100}
          color={item.color}
        />
      ))}
    </div>
  );
};

export default CityStoresBar;
