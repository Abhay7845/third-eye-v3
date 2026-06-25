import React, { useState, useEffect } from "react";
import "../Styles/CookieBanner.css";
import {
  hasConsent,
  acceptAllCookies,
  getCookie,
  COOKIE_NAMES,
} from "../../utils/cookieUtils";
import { axiosInstance } from "../../HostManger/API/Authorization";

/**
 * Attaches the anonymous analytics ID to every outgoing axios request
 * so the server can correlate activity without exposing user identity.
 */
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

  useEffect(() => {
    if (hasConsent()) {
      // Consent already given on a previous visit — reattach analytics header.
      attachAnalyticsHeader();
    } else {
      setVisible(true);
    }
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

  if (!visible) return null;

  return (
    <React.Fragment>
      {/* Blocks all interaction behind the banner until cookies are accepted */}
      <div className='cookie-overlay' />
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
