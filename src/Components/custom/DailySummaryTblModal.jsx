import React, { useEffect } from "react";
import "../Styles/UserSummaryTblModal.css";
import DailySummaryTable from "./DailySummaryTable";

export default function DailySummaryTblModal({
  open,
  setOpenSumTbl,
  children,
  title,
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
          <DailySummaryTable dailySummary={userSummary?.dailySummary} />
        </div>
      </div>
    </div>
  );
}
