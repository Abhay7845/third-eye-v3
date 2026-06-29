import axios from "axios";
import { HOST_URL } from "./HostUrl";
import { routes } from "../../routes";
import { clearAllCookies } from "../../utils/cookieUtils";

export const axiosInstance = axios.create({
  baseURL: HOST_URL,
  withCredentials: true,
});

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

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;

    if (status === 401 && !isLoginRoute()) {
      if (!hasHandledSessionExpiry) {
        hasHandledSessionExpiry = true;
        showSessionExpiredPopup(() => {
          clearClientAuthState();
          window.location.href = routes.LOGIN;
          window.location.reload(true);
        });
      }
    }

    return Promise.reject(error);
  },
);
