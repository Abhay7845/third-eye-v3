import React, { useEffect } from "react";
import { Checkbox, FormControlLabel } from "@mui/material";
import { toast } from "react-toastify";

const CheckList = ({
  driveTime,
  setSelectedCategories,
  selectedCategories,
  name,
  value,
  newStore,
  handleCategoryToggle,
  anchorLocation,
  inputsPayload,
}) => {
  const isDisabled = driveTime.length === 0;
  const handleChange = (e) => {
    if (inputsPayload?.pdfMarkers[value].length > 0) {
      if (e.target.checked) {
        handleCategoryToggle(value);
      } else {
        handleCategoryToggle(value);
      }
    } else {
      toast.info(`${value?.toUpperCase()} Stores Are Not Available`, {
        theme: "colored",
        autoClose: 2000,
      });
    }
  };

  useEffect(() => {
    if (driveTime.length === 0 || anchorLocation) {
      setSelectedCategories((prev) => ({
        ...prev,
        [value]: newStore?.selectedCategories[value] || false,
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
            onChange={handleChange}
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

export default CheckList;
