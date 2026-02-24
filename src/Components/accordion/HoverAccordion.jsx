import React, { useState } from "react";

const HoverAccordion = ({
  title,
  targetData,
  similardData,
  target_name,
  similar_name,
  userLog,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      className='accordion'
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
      style={{
        border: "1px solid #E0E0E0",
        borderRadius: "4px",
        width: "100%",
        overflow: "hidden",
        backgroundColor: "#FFFFFF",
        cursor: "pointer",
        transition: "box-shadow 0.3s ease",
      }}>
      <div
        style={{
          padding: "12px 16px",
          backgroundColor: isOpen ? "#F9F9F9" : "#FFFFFF",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          color: "#212121",
          borderBottom: "1px solid #E0E0E0",
        }}>
        <span>{title}</span>
        <span
          style={{
            transform: isOpen ? "rotate(180deg)" : "rotate(0)",
            transition: "transform 0.3s ease",
            color: "#666666",
          }}>
          ▼
        </span>
      </div>
      <div
        style={{
          maxHeight: isOpen ? "300px" : "0",
          overflow: "hidden",
          transition: "max-height 0.3s ease, padding 0.3s ease",
          backgroundColor: "#FFFFFF",
          color: "#212121",
          padding: isOpen ? "5px 5px" : "0 5px",
        }}>
        <div
          style={{
            border: "1px solid #ccc",
            borderRadius: "6px",
            padding: "6px",
            maxWidth: "330px",
          }}>
          <div
            style={{
              fontSize: "13px",
              fontWeight: "600",
              marginBottom: "5px",
              borderBottom: "1px solid #ddd",
              paddingBottom: "3px",
            }}>
            {target_name}
          </div>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "12px",
            }}>
            <tbody>
              <tr>
                <td style={{ padding: "3px 4px", fontWeight: "500" }}>
                  Encircle Base:
                </td>
                <td style={{ padding: "3px 4px" }}>
                  {Number(targetData?.targetEB).toLocaleString()}{" "}
                  <span style={{ color: "#666", fontSize: "11px" }}>
                    (CAGR:{" "}
                    {parseFloat(targetData?.targetEB_Cagr * 100).toFixed(1)}%)
                  </span>
                </td>
              </tr>

              <tr>
                <td style={{ padding: "3px 4px", fontWeight: "500" }}>
                  {userLog?.channel} Base:
                </td>
                <td style={{ padding: "3px 4px" }}>
                  {Number(targetData?.targetCB).toLocaleString()}{" "}
                  <span style={{ color: "#666", fontSize: "11px" }}>
                    (CAGR:{" "}
                    {parseFloat(targetData?.targetCB_Cagr * 100).toFixed(1)}%)
                  </span>
                </td>
              </tr>

              <tr>
                <td style={{ padding: "3px 4px", fontWeight: "500" }}>
                  Penetration:
                </td>
                <td style={{ padding: "3px 4px" }}>
                  {parseInt(targetData?.penetration * 100)}%
                </td>
              </tr>

              <tr>
                <td style={{ padding: "3px 4px", fontWeight: "500" }}>ARPC:</td>
                <td style={{ padding: "3px 4px" }}>
                  {parseInt(targetData?.arpc ?? 0)?.toLocaleString()}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div
          style={{
            border: "1px solid #ccc",
            borderRadius: "6px",
            padding: "6px",
            maxWidth: "330px",
            marginTop: "5px",
          }}>
          <div
            style={{
              fontSize: "13px",
              fontWeight: "600",
              marginBottom: "5px",
              borderBottom: "1px solid #ddd",
              paddingBottom: "3px",
            }}>
            {similar_name}
          </div>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "12px",
            }}>
            <tbody>
              <tr>
                <td style={{ padding: "3px 4px", fontWeight: "500" }}>
                  Encircle Base:
                </td>
                <td style={{ padding: "3px 4px" }}>
                  {Number(similardData?.targetEB).toLocaleString()}{" "}
                  <span style={{ color: "#666", fontSize: "11px" }}>
                    (CAGR:{" "}
                    {parseFloat(similardData?.targetEB_Cagr * 100).toFixed(1)}%)
                  </span>
                </td>
              </tr>
              <tr>
                <td style={{ padding: "3px 4px", fontWeight: "500" }}>
                  {userLog?.channel} Base:
                </td>
                <td style={{ padding: "3px 4px" }}>
                  {Number(similardData?.targetCB).toLocaleString()}{" "}
                  <span style={{ color: "#666", fontSize: "11px" }}>
                    (CAGR:{" "}
                    {parseFloat(similardData?.targetCB_Cagr * 100).toFixed(1)}%)
                  </span>
                </td>
              </tr>
              <tr>
                <td style={{ padding: "3px 4px", fontWeight: "500" }}>
                  Penetration:
                </td>
                <td style={{ padding: "3px 4px" }}>
                  {parseInt(similardData?.penetration * 100)}%
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default HoverAccordion;
