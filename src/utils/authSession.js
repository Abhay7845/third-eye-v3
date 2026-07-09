const AUTH_TOKEN_KEY = "3rd_eye_auth_token";
const AUTH_EXPIRY_KEY = "3rd_eye_auth_token_expiry";

const getSessionStorage = () => {
  try {
    return window.sessionStorage;
  } catch (error) {
    return null;
  }
};

const getLocalStorage = () => {
  try {
    return window.localStorage;
  } catch (error) {
    return null;
  }
};

export const startAuthSession = () => {
  const sessionStore = getSessionStorage();
  if (!sessionStore) {
    return;
  }

  sessionStore.setItem(AUTH_TOKEN_KEY, "true");
  sessionStore.removeItem(AUTH_EXPIRY_KEY);
};

export const clearAuthSession = () => {
  const sessionStore = getSessionStorage();
  const localStore = getLocalStorage();

  sessionStore?.removeItem(AUTH_TOKEN_KEY);
  sessionStore?.removeItem(AUTH_EXPIRY_KEY);

  // Backward compatibility for users who still have old localStorage keys.
  localStore?.removeItem(AUTH_TOKEN_KEY);
  localStore?.removeItem(AUTH_EXPIRY_KEY);
};

export const isAuthSessionValid = () => {
  const sessionStore = getSessionStorage();
  const localStore = getLocalStorage();

  if (!sessionStore) {
    return false;
  }

  let hasToken = sessionStore.getItem(AUTH_TOKEN_KEY) === "true";

  // Migrate existing token from localStorage once, then keep using sessionStorage.
  if (!hasToken && localStore?.getItem(AUTH_TOKEN_KEY) === "true") {
    sessionStore.setItem(AUTH_TOKEN_KEY, "true");
    localStore.removeItem(AUTH_TOKEN_KEY);
    localStore.removeItem(AUTH_EXPIRY_KEY);
    hasToken = true;
  }

  if (!hasToken) {
    clearAuthSession();
    return false;
  }

  return true;
};
