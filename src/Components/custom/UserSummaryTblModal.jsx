import React, { useEffect } from "react";
import "../Styles/UserSummaryTblModal.css";
import UserSummaryTable from "./UserSummaryTable";

export default function UserSummaryTblModal({
  open,
  setOpenSumTbl,
  children,
  title = "User Summary",
  userSummary,
}) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className='modal_overlay'>
      <div className='modal_container'>
        <div className='modal_header'>
          <h2>{title}</h2>
          <button className='close_btn' onClick={() => setOpenSumTbl(false)}>
            ✕
          </button>
        </div>
        <div className='modal_body'>
          <UserSummaryTable userSummary={userSummary} />
        </div>
      </div>
    </div>
  );
}
