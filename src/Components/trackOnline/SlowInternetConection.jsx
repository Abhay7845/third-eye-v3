import React, { useEffect, useState } from "react";
import "../Styles/InternetStatus.css";

const SlowInternetConection = () => {
  const [slowNetwork, setSlowNetwork] = useState(false);
  const [connectionChecked, setConnectionChecked] = useState(false);

  useEffect(() => {
    const connection =
      navigator.connection ||
      navigator.mozConnection ||
      navigator.webkitConnection;

    const VERY_SLOW_TYPES = ["slow-2g", "2g"];
    const VERY_SLOW_DOWNLINK_MBPS = 0.7;

    const checkNetwork = () => {
      if (connection) {
        const isVerySlowType = VERY_SLOW_TYPES.includes(
          connection.effectiveType,
        );
        const isVerySlowDownlink =
          typeof connection.downlink === "number" &&
          connection.downlink < VERY_SLOW_DOWNLINK_MBPS;
        setSlowNetwork(isVerySlowType || isVerySlowDownlink);
        setConnectionChecked(true);
      } else {
        setSlowNetwork(!navigator.onLine);
        setConnectionChecked(true);
      }
    };

    checkNetwork();
    connection?.addEventListener("change", checkNetwork);
    window.addEventListener("online", checkNetwork);
    window.addEventListener("offline", checkNetwork);

    return () => {
      connection?.removeEventListener("change", checkNetwork);
      window.removeEventListener("online", checkNetwork);
      window.removeEventListener("offline", checkNetwork);
    };
  }, []);

  return (
    <React.Fragment>
      {connectionChecked && slowNetwork && (
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
