import { useEffect, useState } from "react";
import "../Styles/InternetStatus.css";

const InternetStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);

    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);

    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className='offline-container'>
      <div className='wifi-loader'>
        <span className='wifi-circle circle-1'></span>
        <span className='wifi-circle circle-2'></span>
        <span className='wifi-circle circle-3'></span>
      </div>
      <span>Your internet connection is lost...</span>
    </div>
  );
};

export default InternetStatus;
