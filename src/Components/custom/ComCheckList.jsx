import React, { useEffect } from "react";
import { Checkbox, FormControlLabel } from "@mui/material";
import { toast } from "react-toastify";

const ComCheckList = ({
  driveTime,
  setSelectedCategories,
  name,
  value,
  newStore,
  handleCheckBox,
  anchorLocation,
  checked,
  selectedCategories,
  list,
  Styles,
}) => {
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
        value={value}
        disabled={driveTime.length > 0 ? false : true}
        control={
          <Checkbox
            style={Styles.checkBox_label}
            // checked={checked?.length > 0 && driveTime.length > 0 ? true : false}
            checked={selectedCategories[value]}
            onChange={(e) => {
              if (list.length > 0) {
                handleCheckBox(e.target.checked, value);
              } else {
                toast.info(`${name} Stores Are Not Available`, {
                  theme: "colored",
                  autoClose: 2000,
                });
              }
            }}
          />
        }
        label={<span style={Styles.checkBox_label}>{name}</span>}
      />
    </React.Fragment>
  );
};

export default ComCheckList;
