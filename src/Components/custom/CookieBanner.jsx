import React, { useState, useEffect, useRef } from "react";
import "../Styles/CookieBanner.css";
import {
  hasConsent,
  acceptAllCookies,
  getCookie,
  COOKIE_NAMES,
} from "../../utils/cookieUtils";
import { axiosInstance } from "../../HostManger/API/Authorization";

const attachAnalyticsHeader = () => {
  const analyticsId = getCookie(COOKIE_NAMES.ANALYTICS);
  if (!analyticsId) return;
  axiosInstance.interceptors.request.use((config) => {
    config.headers["X-TE-Analytics-ID"] = analyticsId;
    return config;
  });
};

const CookieBanner = () => {
  const [visible, setVisible] = useState(false);
  const [showHoverHint, setShowHoverHint] = useState(false);
  const hintTimerRef = useRef(null);

  useEffect(() => {
    if (hasConsent()) {
      // Consent already given on a previous visit — reattach analytics header.
      attachAnalyticsHeader();
    } else {
      setVisible(true);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (hintTimerRef.current) {
        clearTimeout(hintTimerRef.current);
      }
    };
  }, []);

  const handleAccept = () => {
    // Collect lightweight session prefs to persist in the cookie.
    const sessionPrefs = {
      acceptedAt: new Date().toISOString(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language || "en",
    };

    // Write real browser cookies: consent (365d) + analytics ID (365d) + prefs.
    acceptAllCookies(sessionPrefs);

    // Immediately wire up the analytics header for this session.
    attachAnalyticsHeader();

    setVisible(false);
  };

  const handleOverlayMouseMove = () => {
    setShowHoverHint(true);

    if (hintTimerRef.current) {
      clearTimeout(hintTimerRef.current);
    }

    hintTimerRef.current = setTimeout(() => {
      setShowHoverHint(false);
    }, 900);
  };

  if (!visible) return null;

  return (
    <React.Fragment>
      {/* Blocks all interaction behind the banner until cookies are accepted */}
      <div className='cookie-overlay' onMouseMove={handleOverlayMouseMove} />
      {showHoverHint && (
        <div className='cookie-hover-hint'>Please accept cookies</div>
      )}
      <div className='cookie-banner'>
        <div className='cookie-banner__content'>
          <span className='cookie-banner__text'>
            We use cookies to enhance your experience, remember your
            preferences, and support anonymous usage analytics on the Third Eye
            portal.
          </span>
          <button className='cookie-banner__btn' onClick={handleAccept}>
            Accept All Cookies
          </button>
        </div>
      </div>
    </React.Fragment>
  );
};

export default CookieBanner;
