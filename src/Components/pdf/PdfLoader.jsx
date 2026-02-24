import React from "react";
import "../Styles/pdfCss/PdfLoader.css";
import pdfLogo from "../../asset/pdf_logo.png"; // 👈 your pdf logo

const PdfLoader = () => {
  return (
    <div className='pdf-loader-overlay'>
      <div className='pdf-loader-box'>
        <div className='pdf-loader-animation'>
          <img src={pdfLogo} alt='PDF Logo' className='pdf-logo' />
          <div className='page'></div>
          <div className='page'></div>
          <div className='page'></div>
        </div>
        <p className='pdf-loader-text'>Generating...</p>
      </div>
    </div>
  );
};

export default PdfLoader;
