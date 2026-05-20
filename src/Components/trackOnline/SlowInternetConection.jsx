import React, { useEffect, useState } from "react";
import "../Styles/InternetStatus.css";

const SlowInternetConection = () => {
  const [slowNetwork, setSlowNetwork] = useState(true);

  useEffect(() => {
    const connection =
      navigator.connection ||
      navigator.mozConnection ||
      navigator.webkitConnection;

    const checkNetwork = () => {
      if (!connection) return;
      const slowTypes = ["slow-2g", "2g"];
      if (
        slowTypes.includes(connection.effectiveType) ||
        connection.downlink < 1.2
      ) {
        setSlowNetwork(true);
      } else {
        setSlowNetwork(false);
      }
    };
    checkNetwork();
    connection?.addEventListener("change", checkNetwork);
    return () => {
      connection?.removeEventListener("change", checkNetwork);
    };
  }, []);

  return (
    <React.Fragment>
      {slowNetwork && (
        <div className='offline-container'>
          <div className='wifi-loader'>
            <span className='wifi-circle circle-1'></span>
            <span className='wifi-circle circle-2'></span>
            <span className='wifi-circle circle-3'></span>
          </div>
          <span>Slow internet connection detected.</span>
          <span
            style={{
              marginLeft: "15%",
              cursor: "pointer",
              textDecoration: "underline",
            }}
            onClick={() => setSlowNetwork(false)}>
            Close
          </span>
        </div>
      )}
    </React.Fragment>
  );
};

export default SlowInternetConection;
