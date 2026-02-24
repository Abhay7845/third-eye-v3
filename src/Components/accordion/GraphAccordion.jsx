import React, { useState } from "react";
import "../Styles/GraphAccordian.css";
import LineViewGraphCr from "../common/graph/LineViewGraphCr";
import LineViewGraphTh from "../common/graph/LineViewGraphTh";
import { FormControlLabel, Switch } from "@mui/material";
import Tippy from "@tippyjs/react";

const GraphAccordion = ({ title, data }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showTool, setShowTool] = useState(false);

  return (
    <React.Fragment>
      {data?.length > 0 && (
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
            boxShadow: isOpen ? "0 2px 6px #0000001a" : "none",
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
            <div
              style={{
                display: "flex",
                width: "100%",
                justifyContent: "space-between",
              }}>
              <span>{title}</span>
              <Tippy
                content={
                  <span>{showTool ? "Hide Label" : "Show Label"} </span>
                }>
                <FormControlLabel
                  control={<Switch checked={showTool} size='small' />}
                  sx={{ ".MuiFormControlLabel-label": { fontSize: "0.8rem" } }}
                  onChange={() => setShowTool(!showTool)}
                  style={{ marginRight: "2%" }}
                />
              </Tippy>
            </div>
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
              maxHeight: isOpen ? "100%" : "0",
              overflow: "hidden",
              transition: "max-height 0.3s ease, padding 0.3s ease",
              backgroundColor: "#FFFFFF",
              color: "#212121",
              padding: isOpen ? "1px 2px" : "0 2px",
            }}>
            <div className='graph_scroll'>
              <LineViewGraphCr data={data} showTool={showTool} />
              <LineViewGraphTh data={data} showTool={showTool} />
            </div>
          </div>
        </div>
      )}
    </React.Fragment>
  );
};

export default GraphAccordion;
