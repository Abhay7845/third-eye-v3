const AUTH_TOKEN_KEY = "3rd_eye_auth_token";
const AUTH_EXPIRY_KEY = "3rd_eye_auth_token_expiry";
const ONE_HOUR_IN_MS = 60 * 60 * 1000;

export const startAuthSession = () => {
  const expiresAt = Date.now() + ONE_HOUR_IN_MS;
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
