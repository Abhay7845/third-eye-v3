import axios from "axios";
import { HOST_URL } from "./HostUrl";
import { routes } from "../../routes";
import { clearAllCookies } from "../../utils/cookieUtils";
import {
  initializeMsal,
  loginRequest,
  msalInstance,
} from "../../Components/auth/AuthConfig";
import { isAuthSessionValid } from "../../utils/authSession";

export const axiosInstance = axios.create({
  baseURL: HOST_URL,
  withCredentials: true,
});

const ACCESS_TOKEN_KEY = "3rd_eye_access_token";
const ACCESS_TOKEN_EXPIRY_KEY = "3rd_eye_access_token_expiry";

let hasHandledSessionExpiry = false;

const isLoginRoute = () => {
  const path = window?.location?.pathname || "";
  return path === routes.LOGIN || path === `${routes.LOGIN}/`;
};

const clearClientAuthState = () => {
  localStorage.clear();
  sessionStorage.clear();
  clearAllCookies();
};

export const handleSessionExpiry = () => {
  if (hasHandledSessionExpiry || isLoginRoute()) {
    return;
  }

  hasHandledSessionExpiry = true;
  showSessionExpiredPopup(() => {
    clearClientAuthState();
    window.location.href = routes.LOGIN;
  });
};

const showSessionExpiredPopup = (onConfirm) => {
  const existing = document.getElementById("session-expired-overlay");
  if (existing) return;

  const overlay = document.createElement("div");
  overlay.id = "session-expired-overlay";
  overlay.style.position = "fixed";
  overlay.style.inset = "0";
  overlay.style.background = "#0a0f19a6";
  overlay.style.zIndex = "999999";
  overlay.style.display = "flex";
  overlay.style.alignItems = "center";
  overlay.style.justifyContent = "center";
  overlay.style.padding = "16px";

  const modal = document.createElement("div");
  modal.style.width = "min(560px, 95vw)";
  modal.style.background = "#ffffff";
  modal.style.borderRadius = "2px";
  modal.style.boxShadow = "0 24px 50px #00000059";
  modal.style.padding = "28px 24px";
  modal.style.fontFamily = "Segoe UI, Arial, sans-serif";
  modal.style.textAlign = "center";

  const title = document.createElement("h2");
  title.textContent = "Session Expired";
  title.style.margin = "0 0 10px";
  title.style.color = "#1a2236";
  title.style.fontSize = "28px";

  const desc = document.createElement("p");
  desc.textContent =
    "Your session has expired. Please login again to continue.";
  desc.style.margin = "0 0 22px";
  desc.style.color = "#3f4b5c";
  desc.style.fontSize = "16px";
  desc.style.lineHeight = "1.5";

  const okBtn = document.createElement("button");
  okBtn.type = "button";
  okBtn.textContent = "OK";
  okBtn.style.background = "#df1608";
  okBtn.style.color = "#ffffff";
  okBtn.style.border = "none";
  okBtn.style.borderRadius = "2px";
  okBtn.style.padding = "10px 26px";
  okBtn.style.cursor = "pointer";
  okBtn.style.fontSize = "15px";
  okBtn.style.fontWeight = "600";

  okBtn.onclick = () => {
    document.body.removeChild(overlay);
    onConfirm();
  };

  modal.appendChild(title);
  modal.appendChild(desc);
  modal.appendChild(okBtn);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
};

const shouldSkipAuthHeader = (url) => {
  const requestUrl = String(url || "");
  return requestUrl.includes("/api/dummy/userinfo");
};

const shouldIgnoreSessionExpiry = (url, requestConfig = {}) => {
  const requestUrl = String(url || "");
  return !!requestConfig?.__skipSessionExpiry || requestUrl.includes("/logout");
};

const setCachedAccessToken = (token, expiresOn) => {
  if (!token) {
    return;
  }

  try {
    sessionStorage.setItem(ACCESS_TOKEN_KEY, token);
    const expiryMs = expiresOn ? new Date(expiresOn).getTime() : 0;
    if (Number.isFinite(expiryMs) && expiryMs > 0) {
      sessionStorage.setItem(ACCESS_TOKEN_EXPIRY_KEY, String(expiryMs));
    } else {
      sessionStorage.removeItem(ACCESS_TOKEN_EXPIRY_KEY);
    }
  } catch (error) {
    // Ignore browser storage write failures.
  }
};

const getValidCachedAccessToken = () => {
  try {
    const token = sessionStorage.getItem(ACCESS_TOKEN_KEY);
    if (!token) {
      return null;
    }

    const expiryMs = Number(sessionStorage.getItem(ACCESS_TOKEN_EXPIRY_KEY));
    if (Number.isFinite(expiryMs) && expiryMs > 0) {
      // Keep 30s safety buffer before token expiry.
      if (Date.now() >= expiryMs - 30 * 1000) {
        sessionStorage.removeItem(ACCESS_TOKEN_KEY);
        sessionStorage.removeItem(ACCESS_TOKEN_EXPIRY_KEY);
        return null;
      }
    }

    return token;
  } catch (error) {
    return null;
  }
};

const getAccessTokenSilently = async (options = {}) => {
  await initializeMsal();

  const active =
    msalInstance.getActiveAccount() || msalInstance.getAllAccounts()[0];
  if (!active) {
    try {
      const ssoResponse = await msalInstance.ssoSilent({
        ...loginRequest,
        forceRefresh: !!options.forceRefresh,
      });
      if (ssoResponse?.account) {
        msalInstance.setActiveAccount(ssoResponse.account);
      }
      if (ssoResponse?.accessToken) {
        setCachedAccessToken(ssoResponse.accessToken, ssoResponse.expiresOn);
        return ssoResponse.accessToken;
      }
    } catch (error) {
      // Fall through to cached token fallback.
    }

    return getValidCachedAccessToken();
  }

  try {
    msalInstance.setActiveAccount(active);
    const response = await msalInstance.acquireTokenSilent({
      ...loginRequest,
      account: active,
      forceRefresh: !!options.forceRefresh,
    });
    if (response?.accessToken) {
      setCachedAccessToken(response.accessToken, response.expiresOn);
      return response.accessToken;
    }
  } catch (error) {
    // Fall through to cached token fallback.
  }

  return getValidCachedAccessToken();
};

axiosInstance.interceptors.request.use(
  async (config) => {
    if (shouldSkipAuthHeader(config?.url)) {
      return config;
    }

    try {
      const token = await getAccessTokenSilently();
      if (token) {
        config.headers = {
          ...(config.headers || {}),
          Authorization: `Bearer ${token}`,
        };
      }
    } catch (error) {
      // Let request proceed without token; backend 401 is handled centrally.
    }

    return config;
  },
  (error) => Promise.reject(error),
);

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status;
    const originalRequest = error?.config || {};

    const canRetryWithFreshToken =
      status === 401 &&
      !isLoginRoute() &&
      !shouldSkipAuthHeader(originalRequest?.url) &&
      !shouldIgnoreSessionExpiry(originalRequest?.url, originalRequest) &&
      !originalRequest.__retriedWithFreshToken;

    if (canRetryWithFreshToken) {
      try {
        const freshToken = await getAccessTokenSilently({ forceRefresh: true });
        if (freshToken) {
          originalRequest.__retriedWithFreshToken = true;
          originalRequest.headers = {
            ...(originalRequest.headers || {}),
            Authorization: `Bearer ${freshToken}`,
          };
          return axiosInstance(originalRequest);
        }
      } catch (refreshError) {
        // If refresh fails, continue with existing session-expiry handling.
      }
    }

    if (
      status === 401 &&
      !isLoginRoute() &&
      !shouldIgnoreSessionExpiry(originalRequest?.url, originalRequest)
    ) {
      const hasValidSession = isAuthSessionValid();
      if (!hasValidSession) {
        handleSessionExpiry();
      }
    }

    return Promise.reject(error);
  },
);
