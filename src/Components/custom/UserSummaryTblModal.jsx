import React, { useEffect } from "react";
import "../Styles/UserSummaryTblModal.css";

export default function UserSummaryTblModal({
  open,
  setOpenSumTbl,
  children,
  title = "User Login Summary",
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
    <div className='modal-overlay'>
      <div className='modal-container'>
        <div className='modal-header'>
          <h2>{title}</h2>
          <button className='close-btn' onClick={() => setOpenSumTbl(false)}>
            ✕
          </button>
        </div>
        <div className='modal-body'>{children}</div>
      </div>
    </div>
  );
}
