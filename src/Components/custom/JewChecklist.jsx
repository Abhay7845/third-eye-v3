import React, { useEffect } from "react";
import { Checkbox, FormControlLabel } from "@mui/material";
import { toast } from "react-toastify";

const JewChecklist = ({
  driveTime,
  setSelectedCategories,
  selectedCategories,
  name,
  value,
  newStore,
  handleCheckBox,
  anchorLocation,
  pdfMarkers,
}) => {
  const isDisabled = driveTime.length === 0;
  useEffect(() => {
    if (driveTime.length === 0 || anchorLocation) {
      setSelectedCategories((prev) => ({
        ...prev,
        [value]: false,
      }));
    }
  }, [
    driveTime,
    setSelectedCategories,
    value,
    anchorLocation,
    newStore?.selectedCategories,
  ]);

  return (
    <React.Fragment>
      <FormControlLabel
        disabled={isDisabled}
        control={
          <Checkbox
            checked={selectedCategories[value]}
            onChange={(e) => {
              if (pdfMarkers.length > 0) {
                handleCheckBox(e.target.checked, value);
              } else {
                toast.info(`${name} Stores Are Not Available`, {
                  theme: "colored",
                  autoClose: 2000,
                });
              }
            }}
            style={{
              color: isDisabled ? "gray" : "white",
              cursor: isDisabled ? "not-allowed" : "pointer",
            }}
          />
        }
        label={
          <span
            style={{
              color: isDisabled ? "gray" : "white",
              cursor: isDisabled ? "not-allowed" : "pointer",
            }}>
            {name}
          </span>
        }
      />
    </React.Fragment>
  );
};

export default JewChecklist;
