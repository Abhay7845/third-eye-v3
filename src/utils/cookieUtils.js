/**
 * Cookie utility helpers for the ThirdEye portal.
 * All consent and preference cookies are managed here.
 */

export const COOKIE_NAMES = {
  CONSENT: "te_cookie_consent", // Has user accepted cookies?
  SESSION_PREF: "te_session_pref", // Portal session preferences (channel, theme, etc.)
  ANALYTICS: "te_analytics_id", // Anonymous analytics session identifier
};

/**
 * Set a browser cookie.
 * @param {string} name
 * @param {string} value
 * @param {number} days - Expiry in days. Omit for session cookie.
 */
export const setCookie = (name, value, days) => {
  let expires = "";
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    expires = `; expires=${date.toUTCString()}`;
  }
  document.cookie = `${name}=${encodeURIComponent(
    value,
  )}${expires}; path=/; SameSite=Strict`;
};

/**
 * Read a browser cookie value by name.
 * @param {string} name
 * @returns {string|null}
 */
export const getCookie = (name) => {
  const key = `${name}=`;
  const cookies = document.cookie.split(";");
  for (let c of cookies) {
    const trimmed = c.trim();
    if (trimmed.startsWith(key)) {
      return decodeURIComponent(trimmed.substring(key.length));
    }
  }
  return null;
};

/**
 * Delete a cookie by name.
 * @param {string} name
 */
export const deleteCookie = (name) => {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Strict`;
};

/**
 * Returns true when the user has given cookie consent.
 */
export const hasConsent = () => getCookie(COOKIE_NAMES.CONSENT) === "true";

/**
 * Write all portal cookies after the user accepts consent.
 * - Consent cookie: 365 days
 * - Anonymous analytics ID: 365 days
 * - Session preference snapshot: session-scoped
 */
export const acceptAllCookies = (sessionPrefs = {}) => {
  setCookie(COOKIE_NAMES.CONSENT, "true", 365);

  // Set anonymous analytics ID only if not already set.
  if (!getCookie(COOKIE_NAMES.ANALYTICS)) {
    const analyticsId = `te-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 9)}`;
    setCookie(COOKIE_NAMES.ANALYTICS, analyticsId, 365);
  }

  // Persist portal session preferences (channel, last visited, etc.)
  if (Object.keys(sessionPrefs).length > 0) {
    setCookie(COOKIE_NAMES.SESSION_PREF, JSON.stringify(sessionPrefs), 365);
  }
};

/**
 * Clear all portal cookies (called on logout).
 */
export const clearAllCookies = () => {
  Object.values(COOKIE_NAMES).forEach(deleteCookie);
};

/**
 * Retrieve saved session preferences from cookie.
 * @returns {object}
 */
export const getSessionPrefs = () => {
  try {
    const raw = getCookie(COOKIE_NAMES.SESSION_PREF);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};
