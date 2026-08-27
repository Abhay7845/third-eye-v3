import React from "react";

const CatchmentLevelAction = ({ StoreColorSet }) => {
  return (
    <React.Fragment>
      <div
        style={{
          textAlign: "center",
          fontSize: "13px",
          fontWeight: "bold",
          borderBottom: "1px solid #233044",
          color: "#8b2f00",
          padding: "6px 8px",
        }}>
        Catchment Level Action
      </div>

      <div
        style={{
          padding: "5px",
        }}>
        {StoreColorSet?.map((item, index) => (
          <div
            key={index}
            style={{
              display: "flex",
              alignItems: "center",
              marginBottom: "5px",
            }}>
            <div
              style={{
                width: "15px",
                height: "13px",
                backgroundColor: item.color,
                marginRight: "10px",
                border: "1px solid #ccc",
                borderRadius: "2px",
                flexShrink: 0,
              }}
            />

            <span
              style={{
                fontSize: "13px",
                color: "#233044",
              }}>
              {item.action}
            </span>
          </div>
        ))}
      </div>
    </React.Fragment>
  );
};

export default CatchmentLevelAction;
