import { axiosInstance } from "./Authorization";
import { HOST_URL } from "./HostUrl";
import { clearAllCookies } from "../../utils/cookieUtils";

export const clearClientSession = () => {
  localStorage.clear();
  sessionStorage.clear();
  clearAllCookies();
};

export const invalidateServerSession = async () => {
  try {
    await axiosInstance.post("/logout", {});
  } catch (error) {
    // Best effort only. Client-side logout should continue even if server logout fails.
  }
};

export const invalidateServerSessionOnUnload = () => {
  const logoutUrl = `${HOST_URL}/logout`;

  try {
    if (navigator.sendBeacon) {
      const payload = new Blob([""], { type: "text/plain;charset=UTF-8" });
      navigator.sendBeacon(logoutUrl, payload);
      return;
    }

    fetch(logoutUrl, {
      method: "POST",
      credentials: "include",
      keepalive: true,
      mode: "cors",
    }).catch(() => {});
  } catch (error) {
    // Ignore unload-time failures.
  }
};
