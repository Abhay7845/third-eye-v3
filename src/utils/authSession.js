const AUTH_TOKEN_KEY = "3rd_eye_auth_token";
const AUTH_EXPIRY_KEY = "3rd_eye_auth_token_expiry";

const getEndOfDayTimestamp = () => {
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);
  return endOfDay.getTime();
};

export const startAuthSession = () => {
  const expiresAt = getEndOfDayTimestamp();
  localStorage.setItem(AUTH_TOKEN_KEY, "true");
  localStorage.setItem(AUTH_EXPIRY_KEY, String(expiresAt));
};

export const clearAuthSession = () => {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_EXPIRY_KEY);
};

export const isAuthSessionValid = () => {
  const hasToken = localStorage.getItem(AUTH_TOKEN_KEY) === "true";
  const expiresAt = Number(localStorage.getItem(AUTH_EXPIRY_KEY));

  if (!hasToken || !Number.isFinite(expiresAt) || Date.now() >= expiresAt) {
    clearAuthSession();
    return false;
  }

  return true;
};
